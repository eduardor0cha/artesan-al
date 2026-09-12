'use client'

import { useActionState } from 'react'

import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { formatPriceInput } from '@/presentation/lib/price-input'
import { messages } from '@/presentation/messages/pt-BR'

import { PhotoInput } from './photo-input'

/**
 * The piece as this form needs it: plain data only. `Product` carries a `Price`, and a class does
 * not survive the crossing from a Server Component into a client one — it arrives as an error at
 * render time, not as a type error.
 */
export type ProductFormValues = {
  id: string
  name: string
  description: string | null
  priceCents: number | null
}

type ProductFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  /** The piece being corrected; absent when a new one is being published. */
  product?: ProductFormValues
  photo?: { url: string; alt: string } | null
}

/**
 * The one form behind publishing and editing. The two differ in what the fields start with and in
 * the word on the button — not in what is asked, which is what makes the second visit to this
 * screen feel like the first one.
 */
export function ProductForm({ action, product, photo = null }: ProductFormProps) {
  const [state, submit, pending] = useActionState(action, IDLE_ACTION)

  // What the artisan last typed wins over what was stored: a refused submit must not undo it.
  const typed = state.values

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      {product && <input type="hidden" name="productId" value={product.id} />}

      <TextField
        id="product-name"
        name="name"
        label={messages.panel.productForm.name}
        hint={messages.panel.productForm.nameHint}
        defaultValue={typed?.name ?? product?.name}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="product-description" className="font-medium text-stone-900">
          {`${messages.panel.productForm.description} (${messages.panel.optional})`}
        </label>
        <p id="product-description-hint" className="text-sm text-stone-600">
          {messages.panel.productForm.descriptionHint}
        </p>
        <textarea
          id="product-description"
          name="description"
          rows={4}
          defaultValue={typed?.description ?? product?.description ?? undefined}
          aria-describedby="product-description-hint"
          className="rounded-lg border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        />
      </div>

      <TextField
        id="product-price"
        name="price"
        label={`${messages.panel.productForm.price} (${messages.panel.optional})`}
        hint={messages.panel.productForm.priceHint}
        // Text, not number: a comma is how a price is written here, and a number field rejects it.
        inputMode="decimal"
        defaultValue={typed?.price ?? formatPriceInput(product?.priceCents ?? null)}
      />

      <PhotoInput currentPhoto={photo} defaultAlt={typed?.alt} />

      <Button type="submit" size="large" disabled={pending}>
        {product ? messages.panel.productForm.save : messages.panel.productForm.submit}
      </Button>
    </form>
  )
}
