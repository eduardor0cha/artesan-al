import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'

import { ArtisanSummary } from '@/presentation/components/artisan/artisan-summary'
import { WhatsAppButton } from '@/presentation/components/contact/whatsapp-button'
import { SalesPointSummary } from '@/presentation/components/sales-point/sales-point-summary'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { viewProduct } from '../../composition'

/** Same reason as the sales point page: an id that is not a uuid is a 404, not a query error. */
const productId = z.uuid()

const load = cache(async (rawId: string) => {
  const id = productId.safeParse(rawId)

  if (!id.success) return null

  const result = await viewProduct().execute(id.data)

  return result.ok ? result.value : null
})

export async function generateMetadata(props: PageProps<'/produtos/[id]'>): Promise<Metadata> {
  const { id } = await props.params
  const found = await load(id)

  if (!found) return {}

  const { product, photo, artisan } = found
  const description = messages.product.metaDescription(product.name, artisan.name)

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} — ${artisan.name}`,
      description,
      type: 'website',
      url: routes.product(product.id),
      images: photo ? [{ url: photo.url, alt: photo.alt }] : undefined,
    },
  }
}

export default async function ProductPage(props: PageProps<'/produtos/[id]'>) {
  const { id } = await props.params
  const found = await load(id)

  if (!found) notFound()

  const { product, photo, artisan, salesPoints } = found

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label={messages.navigation.backToSearch}>
        <Link href={routes.search} className="text-emerald-800 underline underline-offset-4">
          {messages.navigation.backToSearch}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-300 bg-stone-100">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 32rem, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <p className="flex h-full items-center justify-center p-4 text-center text-stone-600">
              {messages.product.noPhoto}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-stone-900">{product.name}</h1>
            <p className="text-xl text-stone-800">
              {product.price ? product.price.format() : messages.product.priceOnRequest}
            </p>
          </header>

          {product.description && (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-stone-900">{messages.product.about}</h2>
              <p className="text-stone-700">{product.description}</p>
            </section>
          )}

          <WhatsAppButton
            phone={artisan.publicPhone}
            message={messages.whatsApp.aboutProduct(product.name, artisan.name)}
            className="self-start"
          />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-stone-900">{messages.product.madeBy}</h2>
        <ArtisanSummary artisan={artisan} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-stone-900">{messages.product.whereToBuy}</h2>

        {salesPoints.length === 0 ? (
          <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
            {messages.artisan.noSalesPoints}
          </p>
        ) : (
          <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
            {salesPoints.map((salesPoint) => (
              <li key={salesPoint.id}>
                <SalesPointSummary salesPoint={salesPoint} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
