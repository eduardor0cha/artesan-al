import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Coordinates } from '@/domain/sales-point/coordinates'
import { SearchRadius } from '@/domain/sales-point/search-radius'

import type { Database } from '../client'
import { DrizzleSalesPointRepository } from '../repositories/sales-point.repository'
import * as schema from '../schema'
import { DrizzleSalesPointSearchQuery } from './sales-point-search.query'

/**
 * The public search, against a real PostGIS server. The lateral join and the `ends_on` rule decide
 * what a visitor reads on every result card, and neither can be checked without a database.
 */
const POSTGIS_IMAGE = process.env.POSTGIS_IMAGE ?? 'imresamu/postgis:17-3.5'

describe('DrizzleSalesPointSearchQuery', () => {
  let container: StartedPostgreSqlContainer
  let client: ReturnType<typeof postgres>
  let db: Database
  let searchQuery: DrizzleSalesPointSearchQuery

  /** Test helper: coordinates are known-good here, so an invalid one is a bug in the test. */
  function at(latitude: number, longitude: number): Coordinates {
    const result = Coordinates.create(latitude, longitude)
    if (!result.ok) throw new Error(`Coordenada inválida no teste: ${result.error.message}`)
    return result.value
  }

  function radiusOf(kilometers: number): SearchRadius {
    const result = SearchRadius.create(kilometers)
    if (!result.ok) throw new Error(`Raio inválido no teste: ${result.error.message}`)
    return result.value
  }

  const arapiracaCentre = at(-9.7519, -36.6614)

  const fairId = '11111111-1111-4111-8111-111111111111'
  const workshopId = '22222222-2222-4222-8222-222222222222'
  const maceioId = '33333333-3333-4333-8333-333333333333'

  const artisans = [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', name: 'Maria do Barro' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', name: 'Bento Oleiro' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'Carlos Cesteiro' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', name: 'Dora Rendeira' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', name: 'Elza Bordadeira' },
  ]

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start()
    client = postgres(container.getConnectionUri(), { max: 5 })
    db = drizzle(client, { schema }) as unknown as Database

    await migrate(db, { migrationsFolder: 'src/infrastructure/db/migrations' })

    for (const artisan of artisans) {
      const slug = artisan.id.slice(-1)
      await db.execute(sql`
        insert into "user" (id, name, email)
        values (${artisan.id}, ${artisan.name}, ${`teste-${slug}@local.artesanal`})
      `)
      await db.execute(sql`
        insert into artisans (id, user_id, name, slug, public_phone)
        values (${artisan.id}, ${artisan.id}, ${artisan.name}, ${`artesao-${slug}`}, '82999990000')
      `)
    }

    const repository = new DrizzleSalesPointRepository(db)
    const createdBy = artisans[0]!.id

    await repository.save({
      id: fairId,
      name: 'Feira do Artesanato de Arapiraca',
      type: 'fair',
      coordinates: arapiracaCentre,
      address: 'Centro, Arapiraca',
      openingHours: 'Sábados, das 6h às 12h',
      createdBy,
      createdAt: new Date(),
    })

    await repository.save({
      id: workshopId,
      // Roughly 1.5 km north of the fair.
      name: 'Ateliê perto do centro',
      type: 'workshop',
      coordinates: at(-9.7385, -36.6614),
      address: null,
      openingHours: null,
      createdBy,
      createdAt: new Date(),
    })

    await repository.save({
      id: maceioId,
      name: 'Mercado do Artesanato de Maceió',
      type: 'store',
      coordinates: at(-9.6658, -35.7353),
      address: 'Pajuçara, Maceió',
      openingHours: null,
      createdBy,
      createdAt: new Date(),
    })

    // Five artisans sell at the fair; the card may only name three of them.
    for (const artisan of artisans) {
      await db.execute(sql`
        insert into artisan_sales_points (artisan_id, sales_point_id)
        values (${artisan.id}, ${fairId})
      `)
    }

    // A link that already ended: the artisan no longer sells at the workshop.
    await db.execute(sql`
      insert into artisan_sales_points (artisan_id, sales_point_id, ends_on)
      values (${artisans[1]!.id}, ${workshopId}, now())
    `)

    searchQuery = new DrizzleSalesPointSearchQuery(db)
  }, 180_000)

  afterAll(async () => {
    await client?.end()
    await container?.stop()
  })

  it('returns points inside the radius, nearest first, with their distance', async () => {
    const results = await searchQuery.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(5),
    })

    expect(results.map((result) => result.salesPoint.name)).toEqual([
      'Feira do Artesanato de Arapiraca',
      'Ateliê perto do centro',
    ])
    expect(results[0]!.distanceMeters).toBeLessThan(1)
    expect(results[1]!.distanceMeters).toBeGreaterThan(1_000)
    expect(results[1]!.distanceMeters).toBeLessThan(2_000)
  })

  it('leaves out a point beyond the radius', async () => {
    const results = await searchQuery.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(5),
    })

    expect(results.map((result) => result.salesPoint.name)).not.toContain(
      'Mercado do Artesanato de Maceió',
    )
  })

  it('names at most three artisans but counts them all', async () => {
    const results = await searchQuery.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(5),
    })

    const fair = results.find((result) => result.salesPoint.id === fairId)

    expect(fair?.artisanCount).toBe(5)
    expect(fair?.artisanNames).toEqual(['Bento Oleiro', 'Carlos Cesteiro', 'Dora Rendeira'])
  })

  it('ignores an artisan whose link to the point has ended', async () => {
    const results = await searchQuery.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(5),
    })

    const workshop = results.find((result) => result.salesPoint.id === workshopId)

    expect(workshop?.artisanCount).toBe(0)
    expect(workshop?.artisanNames).toEqual([])
  })

  it('reads back the stored coordinates, which is what the map plots', async () => {
    const results = await searchQuery.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(1),
    })

    expect(results[0]?.salesPoint.coordinates.latitude).toBeCloseTo(-9.7519, 4)
    expect(results[0]?.salesPoint.coordinates.longitude).toBeCloseTo(-36.6614, 4)
  })

  it('honours the limit, so one search never returns an unbounded list', async () => {
    const results = await searchQuery.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(100),
      limit: 1,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.salesPoint.name).toBe('Feira do Artesanato de Arapiraca')
  })
})
