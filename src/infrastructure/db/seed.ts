import 'dotenv/config'

import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { sql } from 'drizzle-orm'

import { auth } from '../auth/better-auth'
import { S3ImageStorage } from '../storage/s3-image-storage'
import { artisanSalesPoints, artisans, productImages, products, salesPoints, user } from './schema'
import { db, sql as client } from './client'
import { DEMO_ARTISAN } from './demo-account'

/**
 * Already reduced to 1200px JPEG at quality 0.8, the same treatment `PhotoInput` gives a photo in
 * the browser before an artisan publishes it, so seeded pieces look like real ones.
 */
const SEED_PHOTOS_DIR = 'src/infrastructure/db/seed-photos'

type SeedPhoto = { file: string; alt: string }

type SeedProduct = {
  name: string
  description: string
  priceCents: number
  photo?: SeedPhoto
}

const images = new S3ImageStorage()

/**
 * Fictional artisans at geographically plausible locations in Alagoas. Enough content that every
 * screen has something to render, and that a map screenshot for the paper looks like the real
 * thing.
 *
 * One of them — the artisan matching `DEMO_ARTISAN.slug` — gets real credentials, so the panel can
 * be demonstrated on an account that already sells somewhere and has a catalogue. The others are
 * profiles only: they populate the public side and are not meant to be signed in to.
 */
const seedData = [
  {
    artisan: {
      name: 'Maria do Barro',
      slug: 'maria-do-barro',
      publicPhone: '82999120001',
      craft: 'Cerâmica utilitária',
      city: 'Arapiraca',
      story: 'Trabalha com barro do Agreste há mais de trinta anos, ensinando o ofício às filhas.',
      // Self-declared and unverified, like every SICAB number here (ADR 0012).
      sicabNumber: 'AL-2018-0413',
    },
    salesPoint: {
      name: 'Feira do Artesanato de Arapiraca',
      type: 'fair' as const,
      latitude: -9.7519,
      longitude: -36.6614,
      address: 'Centro, Arapiraca',
      openingHours: 'Sábados, das 6h às 12h',
    },
    products: [
      {
        name: 'Moringa de barro',
        description: 'Peça torneada à mão, queimada em forno a lenha.',
        priceCents: 8500,
        photo: {
          file: 'moringa-de-barro.jpg',
          alt: 'Moringa de barro com um copo encaixado na boca, pintada com um mandacaru florido, sobre um pires de barro numa mesa de madeira.',
        },
      },
      {
        name: 'Jogo de alguidares',
        description:
          'Alguidares em barro, de vários tamanhos, naturais, vitrificados e pintados à mão.',
        priceCents: 12000,
        photo: {
          file: 'jogo-de-alguidares.jpg',
          alt: 'Alguidares de barro de vários tamanhos sobre uma mesa de madeira: três empilhados, um grande, dois vitrificados em marrom-escuro e um pintado com um peixe.',
        },
      },
    ],
  },
  {
    artisan: {
      name: 'Seu Cícero Rendeiro',
      slug: 'seu-cicero-rendeiro',
      publicPhone: '82999120002',
      craft: 'Renda filé',
      city: 'Marechal Deodoro',
      story: 'Herdou o filé da mãe e mantém o ponto tradicional da lagoa Manguaba.',
      sicabNumber: 'AL-2015-0097',
    },
    salesPoint: {
      name: 'Mercado de Artesanato de Marechal Deodoro',
      type: 'store' as const,
      latitude: -9.7097,
      longitude: -35.8953,
      address: 'Centro Histórico, Marechal Deodoro',
      openingHours: 'Terça a domingo, das 9h às 17h',
    },
    products: [
      {
        name: 'Toalha de mesa em filé',
        description: 'Renda filé bordada à mão, 1,40 m.',
        priceCents: 32000,
      },
      {
        name: 'Caminho de mesa',
        description: 'Peça pequena, ideal para presente.',
        priceCents: 9000,
      },
    ],
  },
  {
    artisan: {
      name: 'Coletivo Bordadeiras do Sertão',
      slug: 'bordadeiras-do-sertao',
      publicPhone: '82999120003',
      craft: 'Bordado e costura',
      city: 'Delmiro Gouveia',
      story: 'Grupo de doze mulheres que divide a produção e a renda do bordado.',
    },
    salesPoint: {
      name: 'Cooperativa do Alto Sertão',
      type: 'cooperative' as const,
      latitude: -9.3853,
      longitude: -37.9986,
      address: 'Delmiro Gouveia',
      openingHours: 'Segunda a sexta, das 8h às 16h',
    },
    products: [
      {
        name: 'Almofada bordada',
        description: 'Bordado livre sobre algodão cru.',
        priceCents: 7000,
      },
    ],
  },
  {
    artisan: {
      name: 'Josefa Fibras',
      slug: 'josefa-fibras',
      publicPhone: '82999120004',
      craft: 'Fibra de bananeira',
      city: 'Maceió',
      story: 'Transforma fibra de bananeira descartada em bolsas e cestaria.',
    },
    salesPoint: {
      name: 'Ateliê Josefa Fibras',
      type: 'workshop' as const,
      latitude: -9.6658,
      longitude: -35.7353,
      address: 'Pajuçara, Maceió',
      openingHours: 'Com hora marcada',
    },
    products: [
      {
        name: 'Bolsa de fibra de bananeira',
        description: 'Trançada à mão, forrada em algodão.',
        priceCents: 18000,
      },
      {
        name: 'Cesto redondo',
        description: 'Fibra natural, 30 cm de diâmetro.',
        priceCents: 11000,
      },
    ],
  },
]

async function seed() {
  console.info('Limpando dados anteriores...')
  await db.execute(sql`
    truncate table ${products}, ${artisanSalesPoints}, ${salesPoints}, ${artisans}, ${user}
    restart identity cascade
  `)

  for (const entry of seedData) {
    const artisanId = randomUUID()
    const salesPointId = randomUUID()
    const userId =
      entry.artisan.slug === DEMO_ARTISAN.slug
        ? await createDemoAccount(entry.artisan.publicPhone)
        : await createProfileOnlyAccount(entry.artisan.name, entry.artisan.slug)

    await db.insert(artisans).values({ id: artisanId, userId, ...entry.artisan })

    await db.insert(salesPoints).values({
      id: salesPointId,
      name: entry.salesPoint.name,
      type: entry.salesPoint.type,
      location: {
        latitude: entry.salesPoint.latitude,
        longitude: entry.salesPoint.longitude,
      },
      address: entry.salesPoint.address,
      openingHours: entry.salesPoint.openingHours,
      createdBy: artisanId,
    })

    await db.insert(artisanSalesPoints).values({ artisanId, salesPointId })

    const catalogue: readonly SeedProduct[] = entry.products
    for (const { photo, ...product } of catalogue) {
      const productId = randomUUID()
      await db.insert(products).values({ id: productId, artisanId, ...product })
      if (photo) await attachPhoto(productId, photo)
    }

    console.info(`  ${entry.artisan.name} — ${entry.salesPoint.name}`)
  }

  console.info(`\n${seedData.length} artesãos semeados.`)
  console.info(`Conta de demonstração: CPF ${DEMO_ARTISAN.cpf}, senha ${DEMO_ARTISAN.password}`)
}

/**
 * Through Better Auth rather than by hand: the password hash is its format, and a row written
 * around it would be a login that fails only when someone tries it. This is the same call the
 * sign-up action makes, which also keeps the seed honest about the account shape the app expects.
 */
async function createDemoAccount(phone: string): Promise<string> {
  const created = await auth.api.signUpEmail({
    body: {
      name: DEMO_ARTISAN.name,
      email: `${DEMO_ARTISAN.cpf}@local.artesanal`,
      password: DEMO_ARTISAN.password,
      username: DEMO_ARTISAN.cpf,
      phoneNumber: phone,
    },
  })

  return created.user.id
}

/**
 * Through the same object store the app uses, so public pages build the photo URL exactly as they
 * do for a piece an artisan published. The key is fixed per file instead of random: seeding again
 * overwrites the object rather than leaving the previous one orphaned in the bucket.
 */
async function attachPhoto(productId: string, photo: SeedPhoto): Promise<void> {
  const body = await readFile(resolve(process.cwd(), SEED_PHOTOS_DIR, photo.file))
  const stored = await images.upload({
    key: `produtos/seed-${photo.file}`,
    body,
    contentType: 'image/jpeg',
  })

  await db
    .insert(productImages)
    .values({ productId, storageKey: stored.key, alt: photo.alt, position: 0 })
}

/** No credentials: these accounts exist to own a public profile, not to be signed in to. */
async function createProfileOnlyAccount(name: string, slug: string): Promise<string> {
  const id = randomUUID()

  await db.insert(user).values({
    id,
    name,
    // Sign-up synthesises an address from the CPF; with no CPF here, the slug plays that part.
    email: `${slug}@local.artesanal`,
    emailVerified: false,
  })

  return id
}

seed()
  .then(() => client.end())
  .catch(async (error) => {
    console.error(error)
    await client.end()
    process.exit(1)
  })
