import Image from 'next/image'
import Link from 'next/link'

import type { ProductWithPhoto } from '@/application/product/product-with-photo'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

type ProductCardProps = {
  item: ProductWithPhoto
}

/** One piece in a catalogue: the photo does the talking, the price only if there is one. */
export function ProductCard({ item }: ProductCardProps) {
  const { product, photo } = item

  return (
    <article className="overflow-hidden rounded-lg border border-stone-300 bg-white">
      <Link href={routes.product(product.id)} className="block hover:bg-stone-50">
        <div className="relative aspect-square bg-stone-100">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 20rem, 50vw"
              className="object-cover"
            />
          ) : (
            // Decorative filler: the card's own text already says which piece this is, and
            // repeating "no photo" would be the first thing a screen reader announced.
            <p
              aria-hidden="true"
              className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-600"
            >
              {messages.product.noPhoto}
            </p>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-stone-900 underline decoration-emerald-700 underline-offset-4">
            {product.name}
          </h3>
          <p className="text-stone-700">
            {product.price ? product.price.format() : messages.product.priceOnRequest}
          </p>
        </div>
      </Link>
    </article>
  )
}
