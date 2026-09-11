import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { sql } from 'drizzle-orm'

import { artisanSalesPoints, artisans, products, salesPoints, user } from './schema'
import { db, sql as client } from './client'

/**
 * Fictional artisans at geographically plausible locations in Alagoas. Enough content that any
 * screen built on top of this scaffold has something to render, and that a map screenshot for the
 * paper looks like the real thing.
 *
 * Passwords are not set: these accounts exist to populate the catalogue, not to be logged into.
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
      },
      {
        name: 'Jogo de alguidares',
        description: 'Três peças em barro natural.',
        priceCents: 12000,
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
    const userId = randomUUID()
    const artisanId = randomUUID()
    const salesPointId = randomUUID()

    await db.insert(user).values({
      id: userId,
      name: entry.artisan.name,
      // Sign-up synthesises an address from the CPF; the seed follows the same shape.
      email: `${entry.artisan.slug}@local.artesanal`,
      emailVerified: false,
    })

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

    await db.insert(products).values(entry.products.map((product) => ({ ...product, artisanId })))

    console.info(`  ${entry.artisan.name} — ${entry.salesPoint.name}`)
  }

  console.info(`\n${seedData.length} artesãos semeados.`)
}

seed()
  .then(() => client.end())
  .catch(async (error) => {
    console.error(error)
    await client.end()
    process.exit(1)
  })
