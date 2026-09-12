'use client'

import { useActionState } from 'react'

import type { ProductWithPhoto } from '@/application/product/product-with-photo'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { formatPriceInput } from '@/presentation/lib/price-input'
import { messages } from '@/presentation/messages/pt-BR'

import { PhotoInput } from './photo-input'

type ProductFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  /** The piece being corrected; absent when a new one is being published. */
  item?: ProductWithPhoto
}

/**
 * The one form behind publishing and editing. The two differ in what the fields start with and in
 * the word on the button — not in what is asked, which is what makes the second visit to this
 * screen feel like the first one.
 */
export function ProductForm({ action, item }: ProductFormProps) {
  const [state, submit, pending] = useActionState(action, IDLE_ACTION)
  const product = item?.product

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      {product && <input type="hidden" name="productId" value={product.id} />}

      <TextField
        id="product-name"
        name="name"
        label={messages.panel.productForm.name}
        hint={messages.panel.productForm.nameHint}
        defaultValue={product?.name}
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
          defaultValue={product?.description ?? undefined}
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
        defaultValue={formatPriceInput(product?.price?.cents ?? null)}
      />

      <PhotoInput currentPhoto={item?.photo} />

      <Button type="submit" size="large" disabled={pending}>
        {product ? messages.panel.productForm.save : messages.panel.productForm.submit}
      </Button>
    </form>
  )
}
