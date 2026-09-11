import type { NearbySalesPointSummary } from '@/application/ports/sales-point-search.query'
import { SearchNearbySalesPoints } from '@/application/sales-point/search-nearby-sales-points'
import { db } from '@/infrastructure/db/client'
import { DrizzleSalesPointSearchQuery } from '@/infrastructure/db/queries/sales-point-search.query'
import { NearbySalesPointsMap } from '@/presentation/components/search/nearby-sales-points-map'
import { RadiusFilter } from '@/presentation/components/search/radius-filter'
import { SalesPointCard } from '@/presentation/components/search/sales-point-card'
import { UseMyLocationButton } from '@/presentation/components/search/use-my-location-button'
import { parseSearchQuery } from '@/presentation/lib/search-url'
import { messages } from '@/presentation/messages/pt-BR'

export default async function Home(props: PageProps<'/'>) {
  // The composition root: this is the only layer allowed to hand a concrete query to a use case.
  const searchNearbySalesPoints = new SearchNearbySalesPoints(new DrizzleSalesPointSearchQuery(db))

  const result = await searchNearbySalesPoints.execute(parseSearchQuery(await props.searchParams))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.app.name}</h1>
        <p className="text-lg text-stone-700">{messages.app.tagline}</p>
      </header>

      {result.ok ? (
        <SearchResults
          // Coordinates is a class, and only plain data survives the crossing into the map.
          center={{
            latitude: result.value.center.latitude,
            longitude: result.value.center.longitude,
          }}
          radiusKilometers={result.value.radius.kilometers}
          salesPoints={result.value.salesPoints}
        />
      ) : (
        <p role="alert" className="rounded-lg border border-stone-300 bg-stone-100 p-4">
          {result.error.message}
        </p>
      )}
    </main>
  )
}

type SearchResultsProps = {
  center: { latitude: number; longitude: number }
  radiusKilometers: number
  salesPoints: readonly NearbySalesPointSummary[]
}

function SearchResults({ center, radiusKilometers, salesPoints }: SearchResultsProps) {
  return (
    <>
      <section aria-label={messages.search.controls} className="flex flex-wrap items-end gap-4">
        <UseMyLocationButton radiusKilometers={radiusKilometers} />
        <RadiusFilter
          latitude={center.latitude}
          longitude={center.longitude}
          radiusKilometers={radiusKilometers}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900">{messages.search.heading}</h2>
          <p className="text-stone-700">{messages.search.resultCount(salesPoints.length)}</p>

          {salesPoints.length === 0 ? (
            <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
              {messages.search.empty}
            </p>
          ) : (
            <ul className="flex list-none flex-col gap-3 p-0">
              {salesPoints.map((summary) => (
                <li key={summary.salesPoint.id}>
                  <SalesPointCard summary={summary} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <NearbySalesPointsMap
          center={center}
          radiusKilometers={radiusKilometers}
          salesPoints={salesPoints.map((summary) => ({
            id: summary.salesPoint.id,
            name: summary.salesPoint.name,
            latitude: summary.salesPoint.coordinates.latitude,
            longitude: summary.salesPoint.coordinates.longitude,
            distanceMeters: summary.distanceMeters,
          }))}
        />
      </div>
    </>
  )
}
