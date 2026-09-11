import type { Artisan, ArtisanId } from '@/domain/artisan/artisan'
import type { Cpf } from '@/domain/artisan/cpf'
import type { SalesPointId } from '@/domain/sales-point/sales-point'

export interface ArtisanRepository {
  findById(id: ArtisanId): Promise<Artisan | null>

  /** The public profile page is reached by slug, never by id (ADR 0010). */
  findBySlug(slug: string): Promise<Artisan | null>

  /** Used on sign-up to reject a CPF that already has an account. */
  findByCpf(cpf: Cpf): Promise<Artisan | null>

  /**
   * Who currently sells at a point, in alphabetical order. A link whose validity has ended is
   * history and does not belong on the point's page.
   */
  findBySalesPoint(salesPointId: SalesPointId): Promise<Artisan[]>

  save(artisan: Artisan): Promise<void>
}
