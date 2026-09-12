import { Price } from '@/domain/product/price'
import type { ProductImage } from '@/domain/product/product'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ImageStorage } from '../ports/image-storage'

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 2000
const MIN_ALT_LENGTH = 5
const MAX_ALT_LENGTH = 300

/**
 * Two and a half megabytes, matching `serverActions.bodySizeLimit` in next.config.ts with room for
 * the multipart overhead. The browser reduces a photo to about 1200px before sending it, so a file
 * this large means the reduction did not run — on a bad connection it is kinder to refuse it than
 * to let the upload time out.
 */
const MAX_PHOTO_BYTES = 2_500_000

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** What the artisan typed about the piece, before anything has been checked. */
export type ProductDetailsInput = {
  name: string
  description?: string | null
  /** Already in cents: reading "85,50" is the screen's job, not this layer's. */
  priceCents?: number | null
}

export type ProductDetails = {
  readonly name: string
  readonly description: string | null
  readonly price: Price | null
}

/** A photo as it arrives from the form: raw bytes plus the text that describes them. */
export type PhotoUpload = {
  readonly bytes: Uint8Array
  readonly contentType: string
  readonly alt: string
}

export function readProductDetails(input: ProductDetailsInput): Result<ProductDetails> {
  const name = input.name.trim().replace(/\s+/g, ' ')

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return err(domainError('product.invalid_name', 'Dê um nome à peça, como você a chama.'))
  }

  const description = input.description?.trim() || null

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return err(domainError('product.description_too_long', 'A descrição está comprida demais.'))
  }

  if (input.priceCents === undefined || input.priceCents === null) {
    return ok({ name, description, price: null })
  }

  const price = Price.create(input.priceCents)
  if (!price.ok) return price

  return ok({ name, description, price: price.value })
}

/** The alternative text on its own, for an edit that keeps the photo already stored. */
export function readAlt(alt: string): Result<string> {
  const text = alt.trim().replace(/\s+/g, ' ')

  if (text.length < MIN_ALT_LENGTH || text.length > MAX_ALT_LENGTH) {
    return err(
      domainError(
        'product.invalid_alt',
        'Descreva a foto em poucas palavras, para quem não enxerga.',
      ),
    )
  }

  return ok(text)
}

/**
 * Sends the photo to the object store and returns the image as the product will carry it. The key
 * is generated here and never derived from the file name the device supplied: that name can carry
 * anything, including a path.
 */
export async function storePhoto(
  upload: PhotoUpload,
  images: ImageStorage,
): Promise<Result<ProductImage>> {
  const extension = EXTENSION_BY_CONTENT_TYPE[upload.contentType]

  if (!extension) {
    return err(domainError('product.unsupported_photo', 'Envie a foto como JPEG, PNG ou WebP.'))
  }

  if (upload.bytes.byteLength === 0) {
    return err(domainError('product.empty_photo', 'Não conseguimos ler esta foto. Tente outra.'))
  }

  if (upload.bytes.byteLength > MAX_PHOTO_BYTES) {
    return err(domainError('product.photo_too_large', 'Esta foto é pesada demais. Tente outra.'))
  }

  const alt = readAlt(upload.alt)
  if (!alt.ok) return alt

  const id = crypto.randomUUID()
  const stored = await images.upload({
    key: `produtos/${id}.${extension}`,
    body: upload.bytes,
    contentType: upload.contentType,
  })

  // The MVP shows one photo per piece, so there is only ever position zero (ADR 0003 leaves the
  // column in place for the day a gallery is worth its screen).
  return ok({ id, storageKey: stored.key, alt: alt.value, position: 0 })
}

/**
 * Best-effort cleanup of a photo no product points at any more. It runs after the row is written,
 * and a failure is swallowed: an orphan object in the bucket costs storage, while a row pointing
 * at a deleted object shows the visitor a broken image.
 */
export async function forgetPhotos(
  images: ImageStorage,
  storageKeys: readonly string[],
): Promise<void> {
  for (const key of storageKeys) {
    try {
      await images.delete(key)
    } catch (error) {
      console.error('[storage] falha ao apagar a foto', key, error)
    }
  }
}
