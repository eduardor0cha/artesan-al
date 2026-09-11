import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Coordinates } from '@/domain/sales-point/coordinates'
import { SearchRadius } from '@/domain/sales-point/search-radius'

import type { Database } from '../client'
import * as schema from '../schema'
import { DrizzleSalesPointRepository } from './sales-point.repository'

/**
 * The wiring smoke test: Drizzle's custom geography column, the GiST index and ST_DWithin against a
 * real PostGIS server. Everything else in the stack can be checked by reading the code; this part
 * cannot, which is why it runs against a container instead of a mock.
 */
const POSTGIS_IMAGE = process.env.POSTGIS_IMAGE ?? 'imresamu/postgis:17-3.5'

describe('DrizzleSalesPointRepository', () => {
  let container: StartedPostgreSqlContainer
  let client: ReturnType<typeof postgres>
  let db: Database
  let repository: DrizzleSalesPointRepository

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

  const maceioCathedral = at(-9.6658, -35.7353)
  const arapiracaCentre = at(-9.7519, -36.6614)
  const someArtisan = '99999999-9999-4999-8999-999999999999'

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start()
    client = postgres(container.getConnectionUri(), { max: 5 })
    db = drizzle(client, { schema }) as unknown as Database

    // The real migrations, not hand-written DDL: this also proves they apply from scratch.
    await migrate(db, { migrationsFolder: 'src/infrastructure/db/migrations' })

    // A sales point references the artisan who created it, which in turn references an auth user.
    await db.execute(sql`
      insert into "user" (id, name, email) values ('test-user', 'Artesã de teste', 'teste@local.artesanal')
    `)
    await db.execute(sql`
      insert into artisans (id, user_id, name, slug, public_phone)
      values (${someArtisan}, 'test-user', 'Artesã de teste', 'artesa-de-teste', '82999990000')
    `)

    repository = new DrizzleSalesPointRepository(db)
  }, 180_000)

  afterAll(async () => {
    await client?.end()
    await container?.stop()
  })

  it('stores a point and reads its coordinates back unchanged', async () => {
    const id = '11111111-1111-4111-8111-111111111111'
    await repository.save({
      id,
      name: 'Feira do Artesanato de Arapiraca',
      type: 'fair',
      coordinates: arapiracaCentre,
      address: 'Centro, Arapiraca',
      openingHours: 'Sábados, 6h às 12h',
      createdBy: someArtisan,
      createdAt: new Date(),
    })

    const stored = await repository.findById(id)

    expect(stored?.name).toBe('Feira do Artesanato de Arapiraca')
    expect(stored?.coordinates.latitude).toBeCloseTo(-9.7519, 4)
    expect(stored?.coordinates.longitude).toBeCloseTo(-36.6614, 4)
  })

  it('returns only points inside the radius, nearest first, with their distance', async () => {
    await repository.save({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Ateliê perto do centro de Arapiraca',
      type: 'workshop',
      // Roughly 1.5 km north of the fair.
      coordinates: at(-9.7385, -36.6614),
      address: null,
      openingHours: null,
      createdBy: someArtisan,
      createdAt: new Date(),
    })

    const nearby = await repository.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(5),
    })

    expect(nearby).toHaveLength(2)
    expect(nearby[0]?.salesPoint.name).toBe('Feira do Artesanato de Arapiraca')
    expect(nearby[0]?.distanceMeters).toBeLessThan(1)
    expect(nearby[1]?.distanceMeters).toBeGreaterThan(1_000)
    expect(nearby[1]?.distanceMeters).toBeLessThan(2_000)

    // Maceió is ~110 km away, so it must not appear in a 5 km search.
    const names = nearby.map((entry) => entry.salesPoint.name)
    expect(names).not.toContain('Mercado do Artesanato de Maceió')
  })

  it('excludes a point outside the radius', async () => {
    await repository.save({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Mercado do Artesanato de Maceió',
      type: 'store',
      coordinates: maceioCathedral,
      address: 'Pajuçara, Maceió',
      openingHours: null,
      createdBy: someArtisan,
      createdAt: new Date(),
    })

    const nearby = await repository.findNearby({
      center: arapiracaCentre,
      radius: radiusOf(5),
    })
    const names = nearby.map((entry) => entry.salesPoint.name)

    expect(names).not.toContain('Mercado do Artesanato de Maceió')
  })

  it('uses the GiST index rather than scanning the table', async () => {
    // Without this, Postgres prefers a sequential scan on a tiny table and the assertion would be
    // testing nothing.
    await db.execute(sql`set enable_seqscan = off`)

    const plan = await db.execute<{ 'QUERY PLAN': string }>(sql`
      explain select id from sales_points
      where ST_DWithin(location, ST_SetSRID(ST_MakePoint(-36.6614, -9.7519), 4326)::geography, 5000)
    `)

    const text = plan.map((row) => row['QUERY PLAN']).join('\n')
    expect(text).toContain('sales_points_location_idx')
  })
})
