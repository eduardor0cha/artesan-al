import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'

import { ArtisanSummary } from '@/presentation/components/artisan/artisan-summary'
import { SalesPointMap } from '@/presentation/components/sales-point/sales-point-map'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { viewSalesPoint } from '../../composition'

/**
 * A malformed id is a 404, not a database error: the id reaches the query straight from the URL,
 * and Postgres rejects anything that is not a uuid.
 */
const salesPointId = z.uuid()

const load = cache(async (rawId: string) => {
  const id = salesPointId.safeParse(rawId)

  if (!id.success) return null

  const result = await viewSalesPoint().execute(id.data)

  return result.ok ? result.value : null
})

export async function generateMetadata(
  props: PageProps<'/pontos-de-venda/[id]'>,
): Promise<Metadata> {
  const { id } = await props.params
  const found = await load(id)

  if (!found) return {}

  const { salesPoint } = found
  const type = messages.salesPoint.types[salesPoint.type]
  const description = messages.salesPoint.metaDescription(salesPoint.name, type)

  return {
    title: salesPoint.name,
    description,
    openGraph: {
      title: `${salesPoint.name} — ${type}`,
      description,
      type: 'website',
      url: routes.salesPoint(salesPoint.id),
    },
  }
}

export default async function SalesPointPage(props: PageProps<'/pontos-de-venda/[id]'>) {
  const { id } = await props.params
  const found = await load(id)

  if (!found) notFound()

  const { salesPoint, artisans } = found

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label={messages.navigation.backToSearch}>
        <Link href={routes.search} className="text-emerald-800 underline underline-offset-4">
          {messages.navigation.backToSearch}
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-emerald-800">
          {messages.salesPoint.types[salesPoint.type]}
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">{salesPoint.name}</h1>
      </header>

      <dl className="flex flex-col gap-2">
        {salesPoint.address && (
          <div>
            <dt className="font-medium text-stone-900">{messages.salesPoint.address}</dt>
            <dd className="text-stone-700">{salesPoint.address}</dd>
          </div>
        )}

        {salesPoint.openingHours && (
          <div>
            <dt className="font-medium text-stone-900">{messages.salesPoint.openingHours}</dt>
            <dd className="text-stone-700">{salesPoint.openingHours}</dd>
          </div>
        )}
      </dl>

      <SalesPointMap
        name={salesPoint.name}
        latitude={salesPoint.coordinates.latitude}
        longitude={salesPoint.coordinates.longitude}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-stone-900">{messages.salesPoint.whoSellsHere}</h2>

        {artisans.length === 0 ? (
          <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
            {messages.salesPoint.noArtisans}
          </p>
        ) : (
          <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
            {artisans.map((artisan) => (
              <li key={artisan.id}>
                <ArtisanSummary artisan={artisan} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
