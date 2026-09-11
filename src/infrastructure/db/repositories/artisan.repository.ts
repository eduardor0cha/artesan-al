import { and, asc, eq, isNull } from 'drizzle-orm'

import type { ArtisanRepository } from '@/application/ports/artisan.repository'
import type { Artisan, ArtisanId } from '@/domain/artisan/artisan'
import type { Cpf } from '@/domain/artisan/cpf'
import type { SalesPointId } from '@/domain/sales-point/sales-point'

import type { Database } from '../client'
import { artisans } from '../schema/artisans'
import { user } from '../schema/auth'
import { artisanSalesPoints } from '../schema/sales-points'

type ArtisanRow = typeof artisans.$inferSelect

export class DrizzleArtisanRepository implements ArtisanRepository {
  constructor(private readonly db: Database) {}

  async findById(id: ArtisanId): Promise<Artisan | null> {
    const rows = await this.db.select().from(artisans).where(eq(artisans.id, id)).limit(1)

    return rows.at(0) ? toArtisan(rows[0]!) : null
  }

  async findBySlug(slug: string): Promise<Artisan | null> {
    const rows = await this.db.select().from(artisans).where(eq(artisans.slug, slug)).limit(1)

    return rows.at(0) ? toArtisan(rows[0]!) : null
  }

  /**
   * The CPF lives in Better Auth's `user.username`, not in this table: the profile is what public
   * pages read, and a document number must never be one query away from them (LGPD).
   */
  async findByCpf(cpf: Cpf): Promise<Artisan | null> {
    const rows = await this.db
      .select({ artisan: artisans })
      .from(artisans)
      .innerJoin(user, eq(user.id, artisans.userId))
      .where(eq(user.username, cpf.digits))
      .limit(1)

    return rows.at(0) ? toArtisan(rows[0]!.artisan) : null
  }

  async findBySalesPoint(salesPointId: SalesPointId): Promise<Artisan[]> {
    const rows = await this.db
      .select({ artisan: artisans })
      .from(artisanSalesPoints)
      .innerJoin(artisans, eq(artisans.id, artisanSalesPoints.artisanId))
      .where(
        and(
          eq(artisanSalesPoints.salesPointId, salesPointId),
          // A null end date is what marks a link as current; past seasons stay as history.
          isNull(artisanSalesPoints.endsOn),
        ),
      )
      .orderBy(asc(artisans.name))

    return rows.map((row) => toArtisan(row.artisan))
  }

  async save(artisan: Artisan): Promise<void> {
    const values = {
      id: artisan.id,
      userId: artisan.userId,
      name: artisan.name,
      slug: artisan.slug,
      publicPhone: artisan.publicPhone,
      story: artisan.story,
      craft: artisan.craft,
      city: artisan.city,
      sicabNumber: artisan.sicabNumber,
    }

    await this.db
      .insert(artisans)
      .values(values)
      .onConflictDoUpdate({ target: artisans.id, set: values })
  }
}

function toArtisan(row: ArtisanRow): Artisan {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    slug: row.slug,
    publicPhone: row.publicPhone,
    story: row.story,
    craft: row.craft,
    city: row.city,
    sicabNumber: row.sicabNumber,
    createdAt: row.createdAt,
  }
}
