import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Database } from '../client'
import * as schema from '../schema'
import { DrizzleArtisanRepository } from './artisan.repository'
import { DrizzleArtisanSalesPointLinkRepository } from './artisan-sales-point-link.repository'
import { DrizzleSalesPointRepository } from './sales-point.repository'

/**
 * The link table carries the validity rule the whole panel depends on: a null end date means the
 * artisan sells there today. The rule lives in SQL, so it is checked against a real server.
 */
const POSTGIS_IMAGE = process.env.POSTGIS_IMAGE ?? 'imresamu/postgis:17-3.5'

describe('DrizzleArtisanSalesPointLinkRepository', () => {
  let container: StartedPostgreSqlContainer
  let client: ReturnType<typeof postgres>
  let db: Database
  let links: DrizzleArtisanSalesPointLinkRepository
  let salesPoints: DrizzleSalesPointRepository
  let artisans: DrizzleArtisanRepository

  const maria = '11111111-1111-4111-8111-111111111111'
  const cicero = '22222222-2222-4222-8222-222222222222'
  const fair = '33333333-3333-4333-8333-333333333333'

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start()
    client = postgres(container.getConnectionUri(), { max: 5 })
    db = drizzle(client, { schema }) as unknown as Database

    await migrate(db, { migrationsFolder: 'src/infrastructure/db/migrations' })

    await db.execute(sql`
      insert into "user" (id, name, email, username) values
        ('user-maria', 'Maria do Barro', 'maria@local.artesanal', '52998224725'),
        ('user-cicero', 'Seu Cícero', 'cicero@local.artesanal', '16899535009')
    `)
    await db.execute(sql`
      insert into artisans (id, user_id, name, slug, public_phone) values
        (${maria}, 'user-maria', 'Maria do Barro', 'maria-do-barro', '82999120001'),
        (${cicero}, 'user-cicero', 'Seu Cícero', 'seu-cicero', '82999120002')
    `)
    await db.execute(sql`
      insert into sales_points (id, name, type, location, created_by)
      values (
        ${fair},
        'Feira do Artesanato de Arapiraca',
        'fair',
        ST_SetSRID(ST_MakePoint(-36.6614, -9.7519), 4326)::geography,
        ${maria}
      )
    `)

    links = new DrizzleArtisanSalesPointLinkRepository(db)
    salesPoints = new DrizzleSalesPointRepository(db)
    artisans = new DrizzleArtisanRepository(db)
  }, 180_000)

  afterAll(async () => {
    await client?.end()
    await container?.stop()
  })

  it('puts an artisan selling at a point someone else registered', async () => {
    await links.link(cicero, fair)

    const where = await salesPoints.findByArtisan(cicero)
    const sellers = await artisans.findBySalesPoint(fair)

    expect(where.map((point) => point.id)).toEqual([fair])
    expect(sellers.map((artisan) => artisan.name)).toContain('Seu Cícero')
  })

  it('leaves a single current link when the same point is linked twice', async () => {
    await links.link(maria, fair)
    await links.link(maria, fair)

    const rows = await db.execute<{ total: string }>(sql`
      select count(*) as total from artisan_sales_points
      where artisan_id = ${maria} and sales_point_id = ${fair} and ends_on is null
    `)

    expect(Number(rows[0]?.total)).toBe(1)
  })

  /** A season that ended is history: it stays in the table and leaves the panel and the page. */
  it('stops showing a point once the link has an end date', async () => {
    await links.link(cicero, fair)
    await db.execute(sql`
      update artisan_sales_points set ends_on = now()
      where artisan_id = ${cicero} and sales_point_id = ${fair}
    `)

    expect(await salesPoints.findByArtisan(cicero)).toEqual([])
    expect((await artisans.findBySalesPoint(fair)).map((one) => one.name)).not.toContain(
      'Seu Cícero',
    )
  })
})
