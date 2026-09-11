import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Cpf } from '@/domain/artisan/cpf'

import type { Database } from '../client'
import * as schema from '../schema'
import { DrizzleArtisanRepository } from './artisan.repository'

/**
 * The profile the public pages read. What needs a real database here is the validity rule on the
 * link table and the join that keeps the CPF in the auth table — both are SQL, not TypeScript.
 */
const POSTGIS_IMAGE = process.env.POSTGIS_IMAGE ?? 'imresamu/postgis:17-3.5'

describe('DrizzleArtisanRepository', () => {
  let container: StartedPostgreSqlContainer
  let client: ReturnType<typeof postgres>
  let db: Database
  let repository: DrizzleArtisanRepository

  const mariaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  const ciceroId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
  const josefaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
  const fairId = '11111111-1111-4111-8111-111111111111'

  /** A valid CPF for the sign-up lookup; the digits are synthetic but pass the check digits. */
  const mariaCpf = Cpf.create('52998224725')

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start()
    client = postgres(container.getConnectionUri(), { max: 5 })
    db = drizzle(client, { schema }) as unknown as Database

    await migrate(db, { migrationsFolder: 'src/infrastructure/db/migrations' })

    if (!mariaCpf.ok) throw new Error('CPF inválido no teste.')

    await db.execute(sql`
      insert into "user" (id, name, email, username) values
        ('user-maria', 'Maria do Barro', 'maria@local.artesanal', ${mariaCpf.value.digits}),
        ('user-cicero', 'Seu Cícero', 'cicero@local.artesanal', '11144477735'),
        ('user-josefa', 'Josefa Fibras', 'josefa@local.artesanal', null)
    `)

    await db.execute(sql`
      insert into artisans (id, user_id, name, slug, public_phone, story, craft, city, sicab_number)
      values
        (${mariaId}, 'user-maria', 'Maria do Barro', 'maria-do-barro', '82999120001',
         'Trabalha com barro do Agreste.', 'Cerâmica utilitária', 'Arapiraca', 'AL-0001'),
        (${ciceroId}, 'user-cicero', 'Seu Cícero', 'seu-cicero', '82999120002',
         null, 'Renda filé', 'Marechal Deodoro', null),
        (${josefaId}, 'user-josefa', 'Josefa Fibras', 'josefa-fibras', '82999120003',
         null, 'Fibra de bananeira', 'Maceió', null)
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

    await db.execute(sql`
      insert into artisan_sales_points (artisan_id, sales_point_id) values
        (${ciceroId}, ${fairId}),
        (${mariaId}, ${fairId})
    `)

    // Josefa used to sell at the fair and no longer does.
    await db.execute(sql`
      insert into artisan_sales_points (artisan_id, sales_point_id, ends_on)
      values (${josefaId}, ${fairId}, now())
    `)

    repository = new DrizzleArtisanRepository(db)
  }, 180_000)

  afterAll(async () => {
    await client?.end()
    await container?.stop()
  })

  it('finds an artisan by the slug the public URL carries', async () => {
    const artisan = await repository.findBySlug('maria-do-barro')

    expect(artisan?.id).toBe(mariaId)
    expect(artisan?.craft).toBe('Cerâmica utilitária')
    expect(artisan?.city).toBe('Arapiraca')
    expect(artisan?.sicabNumber).toBe('AL-0001')
  })

  it('returns null for a slug nobody has', async () => {
    expect(await repository.findBySlug('nao-existe')).toBeNull()
  })

  it('finds an artisan by the CPF held in the auth table', async () => {
    if (!mariaCpf.ok) throw new Error('CPF inválido no teste.')

    const artisan = await repository.findByCpf(mariaCpf.value)

    expect(artisan?.slug).toBe('maria-do-barro')
  })

  it('lists who currently sells at a point, in alphabetical order', async () => {
    const sellers = await repository.findBySalesPoint(fairId)

    expect(sellers.map((artisan) => artisan.name)).toEqual(['Maria do Barro', 'Seu Cícero'])
  })

  it('leaves out an artisan whose link to the point has ended', async () => {
    const sellers = await repository.findBySalesPoint(fairId)

    expect(sellers.map((artisan) => artisan.slug)).not.toContain('josefa-fibras')
  })

  it('stores a profile and reads it back', async () => {
    const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'

    await db.execute(sql`
      insert into "user" (id, name, email) values ('user-novo', 'Artesã nova', 'nova@local.artesanal')
    `)

    await repository.save({
      id,
      userId: 'user-novo',
      name: 'Artesã nova',
      slug: 'artesa-nova',
      publicPhone: '82999120009',
      story: null,
      craft: 'Cestaria',
      city: 'Penedo',
      sicabNumber: null,
      createdAt: new Date(),
    })

    const stored = await repository.findById(id)

    expect(stored?.slug).toBe('artesa-nova')
    expect(stored?.craft).toBe('Cestaria')
    expect(stored?.story).toBeNull()
  })
})
