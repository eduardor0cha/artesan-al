'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { PhotoUpload } from '@/application/product/product-input'
import { actionFailed, typedValues, type ActionState } from '@/presentation/lib/action-state'
import { myProductsHref, PRODUCT_GONE } from '@/presentation/lib/panel-url'
import { parsePriceInput } from '@/presentation/lib/price-input'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { publishProduct, removeProduct, updateProduct } from '../../composition'
import { requireArtisan } from '../../current-artisan'

/**
 * Shape only, as everywhere else: what counts as a name, a price or a readable photo is decided by
 * the use case, which also writes the sentence the artisan reads.
 */
const detailsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().optional(),
  alt: z.string().optional(),
})

const removeSchema = z.object({ productId: z.uuid() })

export async function publish(_state: ActionState, formData: FormData): Promise<ActionState> {
  const artisan = await requireArtisan()
  const typed = typedValues(formData)
  const input = detailsSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm, typed)

  const priceCents = parsePriceInput(input.data.price ?? '')
  if (priceCents === undefined) return actionFailed(messages.panel.productForm.priceInvalid, typed)

  const published = await publishProduct().execute({
    artisanId: artisan.id,
    name: input.data.name,
    description: input.data.description,
    priceCents,
    photo: await readPhoto(formData, input.data.alt ?? ''),
  })

  if (!published.ok) return actionFailed(published.error.message, typed)

  revalidateCatalogue(artisan.slug, published.value.id)
  redirect(myProductsHref({ added: published.value.id }))
}

export async function update(_state: ActionState, formData: FormData): Promise<ActionState> {
  // Checked here, not by the screen that drew the form: an action is reachable by a direct POST,
  // and the id of the piece travels inside it (ADR 0009).
  const artisan = await requireArtisan()
  const typed = typedValues(formData)
  const input = detailsSchema
    .extend({ productId: z.uuid() })
    .safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm, typed)

  const priceCents = parsePriceInput(input.data.price ?? '')
  if (priceCents === undefined) return actionFailed(messages.panel.productForm.priceInvalid, typed)

  const saved = await updateProduct().execute({
    artisanId: artisan.id,
    productId: input.data.productId,
    name: input.data.name,
    description: input.data.description,
    priceCents,
    alt: input.data.alt,
    photo: await readPhoto(formData, input.data.alt ?? ''),
  })

  if (!saved.ok) return actionFailed(saved.error.message, typed)

  revalidateCatalogue(artisan.slug, saved.value.id)
  redirect(myProductsHref({ saved: saved.value.id }))
}

/**
 * Removal stays a plain form post with no state to render back: the screen it lands on is gone by
 * then. What went wrong travels in the query string of the list, like the rest of the panel.
 */
export async function remove(formData: FormData): Promise<void> {
  const artisan = await requireArtisan()
  const input = removeSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) redirect(myProductsHref({ error: PRODUCT_GONE }))

  const removed = await removeProduct().execute({
    artisanId: artisan.id,
    productId: input.data.productId,
  })

  if (!removed.ok) redirect(myProductsHref({ error: PRODUCT_GONE }))

  revalidateCatalogue(artisan.slug, removed.value.id)
  redirect(myProductsHref({ removed: true }))
}

/**
 * The piece is on four screens at once: the panel list, the page of the piece, the artisan's public
 * page, and any sales point where they sell. The first three are addressable from here; the
 * point's page carries the catalogue of everyone selling there and is revalidated by its own path.
 */
function revalidateCatalogue(slug: string, productId: string): void {
  revalidatePath(routes.myProducts)
  revalidatePath(routes.product(productId))
  revalidatePath(routes.artisan(slug))
}

/**
 * The photo as the use case takes it: bytes, with no `File` crossing the layer boundary. An empty
 * part is what a browser sends for a field nobody touched, and means "keep what is there".
 */
async function readPhoto(formData: FormData, alt: string): Promise<PhotoUpload | undefined> {
  const file = formData.get('photo')

  if (!(file instanceof File) || file.size === 0) return undefined

  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    alt,
  }
}
