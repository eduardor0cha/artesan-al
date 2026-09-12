import type { Artisan, ArtisanId } from '@/domain/artisan/artisan'
import type { Cpf } from '@/domain/artisan/cpf'
import type { PhoneNumber } from '@/domain/artisan/phone'
import type { Product, ProductId } from '@/domain/product/product'
import type { Coordinates } from '@/domain/sales-point/coordinates'
import type { NearbySalesPoint, SalesPoint, SalesPointId } from '@/domain/sales-point/sales-point'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type {
  AccountId,
  ArtisanAccountGateway,
  ArtisanAccountRegistration,
  PasswordReset,
} from '../ports/artisan-account.gateway'
import type { ArtisanSalesPointLinkRepository } from '../ports/artisan-sales-point-link.repository'
import type { ArtisanRepository } from '../ports/artisan.repository'
import type { ImageStorage, StoredImage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import type { NearbySearch, SalesPointRepository } from '../ports/sales-point.repository'

/**
 * In-memory ports for the unit tests of the read use cases. They hold plain arrays: a use case is
 * only worth testing here for the orchestration it does, and a mocking library would hide exactly
 * that. The database behaviour these stand in for is covered by the integration tests.
 */

export class FakeArtisanRepository implements ArtisanRepository {
  constructor(
    private readonly artisans: Artisan[] = [],
    /** Which artisans sell at each point, keyed by sales point id. */
    private readonly sellersByPoint: Record<string, Artisan[]> = {},
    /**
     * The CPF of each artisan, keyed by artisan id. It stands in for the join with the auth
     * table, which is the only place a document number is stored.
     */
    private readonly cpfByArtisan: Record<string, string> = {},
  ) {}

  findById(id: ArtisanId): Promise<Artisan | null> {
    return Promise.resolve(this.artisans.find((artisan) => artisan.id === id) ?? null)
  }

  findBySlug(slug: string): Promise<Artisan | null> {
    return Promise.resolve(this.artisans.find((artisan) => artisan.slug === slug) ?? null)
  }

  findByUserId(userId: string): Promise<Artisan | null> {
    return Promise.resolve(this.artisans.find((artisan) => artisan.userId === userId) ?? null)
  }

  findByCpf(cpf: Cpf): Promise<Artisan | null> {
    const found = this.artisans.find((artisan) => this.cpfByArtisan[artisan.id] === cpf.digits)

    return Promise.resolve(found ?? null)
  }

  findBySalesPoint(salesPointId: SalesPointId): Promise<Artisan[]> {
    return Promise.resolve(this.sellersByPoint[salesPointId] ?? [])
  }

  /** Upsert, like the real repository: the panel saves a profile that already exists. */
  save(artisan: Artisan): Promise<void> {
    const at = this.artisans.findIndex((stored) => stored.id === artisan.id)

    if (at === -1) this.artisans.push(artisan)
    else this.artisans[at] = artisan

    return Promise.resolve()
  }
}

export class FakeProductRepository implements ProductRepository {
  constructor(readonly products: Product[] = []) {}

  findById(id: ProductId): Promise<Product | null> {
    return Promise.resolve(this.products.find((product) => product.id === id) ?? null)
  }

  findByArtisan(artisanId: ArtisanId): Promise<Product[]> {
    return Promise.resolve(this.products.filter((product) => product.artisanId === artisanId))
  }

  findBySalesPoint(): Promise<Product[]> {
    return Promise.resolve([])
  }

  /** Upsert, like the real repository: the panel saves a piece it has already published. */
  save(product: Product): Promise<void> {
    const at = this.products.findIndex((stored) => stored.id === product.id)

    if (at === -1) this.products.push(product)
    else this.products[at] = product

    return Promise.resolve()
  }

  delete(id: ProductId): Promise<void> {
    const at = this.products.findIndex((product) => product.id === id)

    if (at !== -1) this.products.splice(at, 1)

    return Promise.resolve()
  }
}

export class FakeSalesPointRepository implements SalesPointRepository {
  constructor(
    private readonly salesPoints: SalesPoint[] = [],
    /** Where each artisan sells, keyed by artisan id. */
    private readonly pointsByArtisan: Record<string, SalesPoint[]> = {},
  ) {}

  /**
   * Great-circle distance instead of PostGIS. It is enough to tell "the same fair" from "the next
   * town" — which is all the use cases decide — and the spheroid maths the database really runs is
   * covered by the integration tests.
   */
  findNearby({ center, radius, limit = 50 }: NearbySearch): Promise<NearbySalesPoint[]> {
    const nearby = this.salesPoints
      .map((salesPoint) => ({
        salesPoint,
        distanceMeters: metersBetween(center, salesPoint.coordinates),
      }))
      .filter((found) => found.distanceMeters <= radius.meters)
      .sort((one, other) => one.distanceMeters - other.distanceMeters)
      .slice(0, limit)

    return Promise.resolve(nearby)
  }

  findById(id: SalesPointId): Promise<SalesPoint | null> {
    return Promise.resolve(this.salesPoints.find((salesPoint) => salesPoint.id === id) ?? null)
  }

  findByArtisan(artisanId: ArtisanId): Promise<SalesPoint[]> {
    return Promise.resolve(this.pointsByArtisan[artisanId] ?? [])
  }

  save(salesPoint: SalesPoint): Promise<void> {
    this.salesPoints.push(salesPoint)
    return Promise.resolve()
  }
}

export class FakeArtisanSalesPointLinkRepository implements ArtisanSalesPointLinkRepository {
  /** Current links only, as "artisanId:salesPointId" — the fakes have no history to keep. */
  readonly links = new Set<string>()

  link(artisanId: ArtisanId, salesPointId: SalesPointId): Promise<void> {
    this.links.add(`${artisanId}:${salesPointId}`)
    return Promise.resolve()
  }

  has(artisanId: ArtisanId, salesPointId: SalesPointId): boolean {
    return this.links.has(`${artisanId}:${salesPointId}`)
  }
}

/**
 * Stands in for Better Auth. It keeps what the use cases actually depend on — that a CPF is taken
 * only once, and that a recovery code is sent — and nothing about hashing or sessions.
 */
export class FakeArtisanAccountGateway implements ArtisanAccountGateway {
  readonly registrations: ArtisanAccountRegistration[] = []
  readonly otpsSentTo: string[] = []
  readonly resets: PasswordReset[] = []

  constructor(private readonly failure: string | null = null) {}

  register(registration: ArtisanAccountRegistration): Promise<Result<AccountId>> {
    if (this.failure) {
      return Promise.resolve(err(domainError('account.register_failed', this.failure)))
    }

    this.registrations.push(registration)

    return Promise.resolve(ok(`user-${this.registrations.length}`))
  }

  sendPasswordResetOtp(phone: PhoneNumber): Promise<void> {
    this.otpsSentTo.push(phone.digits)
    return Promise.resolve()
  }

  resetPassword(reset: PasswordReset): Promise<Result<void>> {
    if (this.failure) {
      return Promise.resolve(err(domainError('account.reset_failed', this.failure)))
    }

    this.resets.push(reset)

    return Promise.resolve(ok(undefined))
  }
}

/** Mirrors how `S3ImageStorage` builds a public URL, without reaching for configuration. */
export class FakeImageStorage implements ImageStorage {
  /** What went into the bucket, so a test can assert the bytes were sent before the row. */
  readonly uploaded: { key: string; contentType: string; bytes: number }[] = []
  readonly deleted: string[] = []

  constructor(private readonly baseUrl = 'https://fotos.exemplo/artesanal') {}

  upload({
    key,
    body,
    contentType,
  }: {
    key: string
    body: Uint8Array | Buffer
    contentType: string
  }): Promise<StoredImage> {
    this.uploaded.push({ key, contentType, bytes: body.byteLength })

    return Promise.resolve({ key })
  }

  delete(key: string): Promise<void> {
    this.deleted.push(key)
    return Promise.resolve()
  }

  publicUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }
}

const EARTH_RADIUS_METERS = 6_371_000

function metersBetween(one: Coordinates, other: Coordinates): number {
  const latitudeDelta = toRadians(other.latitude - one.latitude)
  const longitudeDelta = toRadians(other.longitude - one.longitude)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(one.latitude)) *
      Math.cos(toRadians(other.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
