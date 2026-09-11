import type { Artisan } from '@/domain/artisan/artisan'
import { Coordinates } from '@/domain/sales-point/coordinates'
import type { Product, ProductImage } from '@/domain/product/product'
import type { SalesPoint } from '@/domain/sales-point/sales-point'

/**
 * Builders for the unit tests: a plausible entity by default, with only the fields a given test
 * actually cares about spelled out at the call site.
 */

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

export function anArtisan(overrides: Partial<Artisan> = {}): Artisan {
  return {
    id: 'artisan-1',
    userId: 'user-1',
    name: 'Maria do Barro',
    slug: 'maria-do-barro',
    publicPhone: '82999120001',
    story: 'Trabalha com barro do Agreste há mais de trinta anos.',
    craft: 'Cerâmica utilitária',
    city: 'Arapiraca',
    sicabNumber: null,
    createdAt: FIXED_DATE,
    ...overrides,
  }
}

export function aSalesPoint(overrides: Partial<SalesPoint> = {}): SalesPoint {
  const coordinates = Coordinates.create(-9.7519, -36.6614)
  if (!coordinates.ok) throw new Error('Coordenada inválida na fixture.')

  return {
    id: 'sales-point-1',
    name: 'Feira do Artesanato de Arapiraca',
    type: 'fair',
    coordinates: coordinates.value,
    address: 'Centro, Arapiraca',
    openingHours: 'Sábados, das 6h às 12h',
    createdBy: 'artisan-1',
    createdAt: FIXED_DATE,
    ...overrides,
  }
}

export function aProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    artisanId: 'artisan-1',
    name: 'Moringa de barro',
    description: 'Peça torneada à mão, queimada em forno a lenha.',
    price: null,
    images: [],
    createdAt: FIXED_DATE,
    ...overrides,
  }
}

export function aProductImage(overrides: Partial<ProductImage> = {}): ProductImage {
  return {
    id: 'image-1',
    storageKey: 'produtos/moringa.jpg',
    alt: 'Moringa de barro sobre uma mesa de madeira',
    position: 0,
    ...overrides,
  }
}
