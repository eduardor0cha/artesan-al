import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Price } from '@/domain/product/price'

import type { Database } from '../client'
import * as schema from '../schema'
import { DrizzleProductRepository } from './product.repository'

/**
 * The catalogue. The join onto `product_images` is what needs a database: one row per photo has to
 * collapse back into one product, and a piece with no photo must survive the join.
 */
const POSTGIS_IMAGE = process.env.POSTGIS_IMAGE ?? 'imresamu/postgis:17-3.5'

describe('DrizzleProductRepository', () => {
  let container: StartedPostgreSqlContainer
  let client: ReturnType<typeof postgres>
  let db: Database
  let repository: DrizzleProductRepository

  const mariaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  const josefaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
  const fairId = '11111111-1111-4111-8111-111111111111'
  const moringaId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
  const alguidaresId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'
  const cestoId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start()
    client = postgres(container.getConnectionUri(), { max: 5 })
    db = drizzle(client, { schema }) as unknown as Database

    await migrate(db, { migrationsFolder: 'src/infrastructure/db/migrations' })

    await db.execute(sql`
      insert into "user" (id, name, email) values
        ('user-maria', 'Maria do Barro', 'maria@local.artesanal'),
        ('user-josefa', 'Josefa Fibras', 'josefa@local.artesanal')
    `)

    await db.execute(sql`
      insert into artisans (id, user_id, name, slug, public_phone) values
        (${mariaId}, 'user-maria', 'Maria do Barro', 'maria-do-barro', '82999120001'),
        (${josefaId}, 'user-josefa', 'Josefa Fibras', 'josefa-fibras', '82999120002')
    `)

    await db.execute(sql`
      insert into sales_points (id, name, type, location, created_by)
      values (
        ${fairId},
        'Feira do Artesanato de Arapiraca',
        'fair',
        ST_SetSRID(ST_MakePoint(-36.6614, -9.7519), 4326)::geography,
        ${mariaId}
      )
    `)

    // Maria sells at the fair; Josefa's link to it has ended.
    await db.execute(sql`
      insert into artisan_sales_points (artisan_id, sales_point_id) values (${mariaId}, ${fairId})
    `)
    await db.execute(sql`
      insert into artisan_sales_points (artisan_id, sales_point_id, ends_on)
      values (${josefaId}, ${fairId}, now())
    `)

    await db.execute(sql`
      insert into products (id, artisan_id, name, description, price_cents, created_at) values
        (${moringaId}, ${mariaId}, 'Moringa de barro', 'Peça torneada à mão.', 8500, now() - interval '1 day'),
        (${alguidaresId}, ${mariaId}, 'Jogo de alguidares', null, null, now()),
        (${cestoId}, ${josefaId}, 'Cesto redondo', null, 11000, now())
    `)

    await db.execute(sql`
      insert into product_images (product_id, storage_key, alt, position) values
        (${moringaId}, 'produtos/moringa-lado.jpg', 'Moringa vista de lado', 1),
        (${moringaId}, 'produtos/moringa-frente.jpg', 'Moringa de barro sobre uma mesa', 0)
    `)

    repository = new DrizzleProductRepository(db)
  }, 180_000)

  afterAll(async () => {
    await client?.end()
    await container?.stop()
  })

  it('reads a piece with its photos ordered by position', async () => {
    const product = await repository.findById(moringaId)

    expect(product?.name).toBe('Moringa de barro')
    expect(product?.images.map((image) => image.storageKey)).toEqual([
      'produtos/moringa-frente.jpg',
      'produtos/moringa-lado.jpg',
    ])
  })

  it('reads back a price stored in cents', async () => {
    const product = await repository.findById(moringaId)

    expect(product?.price?.cents).toBe(8500)
    expect(product?.price?.format()).toContain('85,00')
  })

  it('keeps a piece priced by negotiation, with no price at all', async () => {
    const product = await repository.findById(alguidaresId)

    expect(product?.price).toBeNull()
    expect(product?.images).toEqual([])
  })

  it('lists an artisan catalogue newest first, with each piece appearing once', async () => {
    const catalogue = await repository.findByArtisan(mariaId)

    expect(catalogue.map((product) => product.name)).toEqual([
      'Jogo de alguidares',
      'Moringa de barro',
    ])
  })

  it('lists what is on offer at a point, ignoring an artisan who no longer sells there', async () => {
    const onOffer = await repository.findBySalesPoint(fairId)

    expect(onOffer.map((product) => product.name).sort()).toEqual([
      'Jogo de alguidares',
      'Moringa de barro',
    ])
  })

  it('replaces the photo list when a piece is saved again', async () => {
    const product = await repository.findById(moringaId)
    if (!product) throw new Error('Produto não encontrado no teste.')

    const price = Price.create(9900)
    if (!price.ok) throw new Error('Preço inválido no teste.')

    await repository.save({
      ...product,
      price: price.value,
      images: [
        {
          id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
          storageKey: 'produtos/moringa-nova.jpg',
          alt: 'Moringa nova em fundo claro',
          position: 0,
        },
      ],
    })

    const stored = await repository.findById(moringaId)

    expect(stored?.price?.cents).toBe(9900)
    expect(stored?.images.map((image) => image.storageKey)).toEqual(['produtos/moringa-nova.jpg'])
  })

  it('removes a piece and its photos', async () => {
    await repository.delete(moringaId)

    expect(await repository.findById(moringaId)).toBeNull()

    const images = await db.execute<{ total: string }>(
      sql`select count(*) as total from product_images where product_id = ${moringaId}`,
    )
    expect(Number(images[0]?.total)).toBe(0)
  })
})
