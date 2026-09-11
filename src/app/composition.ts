import { ViewArtisanProfile } from '@/application/artisan/view-artisan-profile'
import { ViewProduct } from '@/application/product/view-product'
import { SearchNearbySalesPoints } from '@/application/sales-point/search-nearby-sales-points'
import { ViewSalesPoint } from '@/application/sales-point/view-sales-point'
import { db } from '@/infrastructure/db/client'
import { DrizzleSalesPointSearchQuery } from '@/infrastructure/db/queries/sales-point-search.query'
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
