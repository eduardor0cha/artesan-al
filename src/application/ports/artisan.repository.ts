import type { Artisan, ArtisanId } from '@/domain/artisan/artisan'
import type { Cpf } from '@/domain/artisan/cpf'

export interface ArtisanRepository {
  findById(id: ArtisanId): Promise<Artisan | null>

  /** Used on sign-up to reject a CPF that already has an account. */
  findByCpf(cpf: Cpf): Promise<Artisan | null>

  save(artisan: Artisan): Promise<void>
}
