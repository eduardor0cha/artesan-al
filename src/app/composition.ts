import { RequestPasswordOtp, ResetPasswordWithOtp } from '@/application/artisan/recover-password'
import { SignUpArtisan } from '@/application/artisan/sign-up-artisan'
import { UpdateArtisanProfile } from '@/application/artisan/update-artisan-profile'
import { ViewArtisanProfile } from '@/application/artisan/view-artisan-profile'
import { findOwnProduct } from '@/application/product/artisan-product'
import { withPhoto, type ProductWithPhoto } from '@/application/product/product-with-photo'
import { PublishProduct } from '@/application/product/publish-product'
import { RemoveProduct } from '@/application/product/remove-product'
import { UpdateProduct } from '@/application/product/update-product'
import { ViewProduct } from '@/application/product/view-product'
import { FindNearbySalesPointsToReuse } from '@/application/sales-point/find-nearby-sales-points-to-reuse'
import { LinkArtisanToSalesPoint } from '@/application/sales-point/link-artisan-to-sales-point'
import { RegisterSalesPoint } from '@/application/sales-point/register-sales-point'
import { SearchNearbySalesPoints } from '@/application/sales-point/search-nearby-sales-points'
import { ViewSalesPoint } from '@/application/sales-point/view-sales-point'
import type { Artisan } from '@/domain/artisan/artisan'
import type { SalesPoint } from '@/domain/sales-point/sales-point'
import { BetterAuthArtisanAccountGateway } from '@/infrastructure/auth/artisan-account.gateway'
import { db } from '@/infrastructure/db/client'
import { DrizzleSalesPointSearchQuery } from '@/infrastructure/db/queries/sales-point-search.query'
import { DrizzleArtisanSalesPointLinkRepository } from '@/infrastructure/db/repositories/artisan-sales-point-link.repository'
import { DrizzleArtisanRepository } from '@/infrastructure/db/repositories/artisan.repository'
import { DrizzleProductRepository } from '@/infrastructure/db/repositories/product.repository'
import { DrizzleSalesPointRepository } from '@/infrastructure/db/repositories/sales-point.repository'
import { S3ImageStorage } from '@/infrastructure/storage/s3-image-storage'

/**
 * The composition root. `app/` is the only layer allowed to hand a concrete adapter to a use case,
 * and keeping the wiring here means a page reads as what it renders rather than as what it builds.
 */

const artisans = new DrizzleArtisanRepository(db)
const products = new DrizzleProductRepository(db)
const salesPoints = new DrizzleSalesPointRepository(db)
const salesPointSearch = new DrizzleSalesPointSearchQuery(db)
const salesPointLinks = new DrizzleArtisanSalesPointLinkRepository(db)
const accounts = new BetterAuthArtisanAccountGateway()

/** Built on first use: the S3 client reads configuration, which must not run at import time. */
let imageStorage: S3ImageStorage | null = null

function images(): S3ImageStorage {
  imageStorage ??= new S3ImageStorage()
  return imageStorage
}

export function searchNearbySalesPoints(): SearchNearbySalesPoints {
  return new SearchNearbySalesPoints(salesPointSearch)
}

export function viewSalesPoint(): ViewSalesPoint {
  return new ViewSalesPoint(salesPoints, artisans)
}

export function viewArtisanProfile(): ViewArtisanProfile {
  return new ViewArtisanProfile(artisans, products, salesPoints, images())
}

export function viewProduct(): ViewProduct {
  return new ViewProduct(products, artisans, salesPoints, images())
}

export function signUpArtisan(): SignUpArtisan {
  return new SignUpArtisan(artisans, accounts)
}

export function updateArtisanProfile(): UpdateArtisanProfile {
  return new UpdateArtisanProfile(artisans)
}

export function requestPasswordOtp(): RequestPasswordOtp {
  return new RequestPasswordOtp(accounts)
}

export function resetPasswordWithOtp(): ResetPasswordWithOtp {
  return new ResetPasswordWithOtp(accounts)
}

export function findNearbySalesPointsToReuse(): FindNearbySalesPointsToReuse {
  return new FindNearbySalesPointsToReuse(salesPoints)
}

export function registerSalesPoint(): RegisterSalesPoint {
  return new RegisterSalesPoint(salesPoints, salesPointLinks)
}

export function linkArtisanToSalesPoint(): LinkArtisanToSalesPoint {
  return new LinkArtisanToSalesPoint(salesPoints, salesPointLinks)
}

export function publishProduct(): PublishProduct {
  return new PublishProduct(products, images())
}

export function updateProduct(): UpdateProduct {
  return new UpdateProduct(products, images())
}

export function removeProduct(): RemoveProduct {
  return new RemoveProduct(products, images())
}

/**
 * The lookups the panel makes on its own. They orchestrate nothing — the session hands over an
 * account, and the screen needs the profile behind it, where that profile sells and what it has
 * published — so they stay here instead of becoming use cases with a single line each.
 */
export function findArtisanOfAccount(userId: string): Promise<Artisan | null> {
  return artisans.findByUserId(userId)
}

export function findSalesPointsOfArtisan(artisanId: string): Promise<SalesPoint[]> {
  return salesPoints.findByArtisan(artisanId)
}

export async function findProductsOfArtisan(artisanId: string): Promise<ProductWithPhoto[]> {
  const catalogue = await products.findByArtisan(artisanId)

  return catalogue.map((product) => withPhoto(product, images()))
}

/** Null covers both "no such piece" and "made by someone else": the edit screen says the same. */
export async function findOwnProductOfArtisan(
  artisanId: string,
  productId: string,
): Promise<ProductWithPhoto | null> {
  const found = await findOwnProduct(products, artisanId, productId)

  return found.ok ? withPhoto(found.value, images()) : null
}
