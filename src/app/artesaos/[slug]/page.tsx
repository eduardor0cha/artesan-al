import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { WhatsAppButton } from '@/presentation/components/contact/whatsapp-button'
import { ProductCard } from '@/presentation/components/product/product-card'
import { SalesPointSummary } from '@/presentation/components/sales-point/sales-point-summary'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { viewArtisanProfile } from '../../composition'

const load = cache(async (slug: string) => {
  const result = await viewArtisanProfile().execute(slug)

  return result.ok ? result.value : null
})

export async function generateMetadata(props: PageProps<'/artesaos/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const found = await load(slug)

  if (!found) return {}

  const { artisan, products } = found
  const description = messages.artisan.metaDescription(artisan.name, artisan.craft, artisan.city)
  const cover = products.find((item) => item.photo)?.photo

  return {
    title: artisan.name,
    description,
    openGraph: {
      title: artisan.name,
      description,
      type: 'profile',
      url: routes.artisan(artisan.slug),
      images: cover ? [{ url: cover.url, alt: cover.alt }] : undefined,
    },
  }
}

export default async function ArtisanPage(props: PageProps<'/artesaos/[slug]'>) {
  const { slug } = await props.params
  const found = await load(slug)

  if (!found) notFound()

  const { artisan, products, salesPoints } = found

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label={messages.navigation.backToSearch}>
        <Link href={routes.search} className="text-emerald-800 underline underline-offset-4">
          {messages.navigation.backToSearch}
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{artisan.name}</h1>
        {artisan.craft && <p className="text-lg text-stone-700">{artisan.craft}</p>}
        {artisan.city && <p className="text-stone-600">{artisan.city}</p>}
      </header>

      {artisan.story && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-stone-900">{messages.artisan.story}</h2>
          <p className="text-stone-700">{artisan.story}</p>
        </section>
      )}

      {/* Shown as plain information, never as a badge: nothing here checks it (ADR 0012). */}
      {artisan.sicabNumber && (
        <p className="text-stone-600">
          <span className="font-medium text-stone-900">{messages.artisan.sicab}:</span>{' '}
          {artisan.sicabNumber}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-stone-900">{messages.artisan.contact}</h2>
        <WhatsAppButton
          phone={artisan.publicPhone}
          message={messages.whatsApp.aboutArtisan(artisan.name)}
          className="self-start"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-stone-900">{messages.artisan.catalogue}</h2>

        {products.length === 0 ? (
          <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
            {messages.artisan.emptyCatalogue}
          </p>
        ) : (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((item) => (
              <li key={item.product.id}>
                <ProductCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-stone-900">{messages.artisan.whereToFind}</h2>

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
