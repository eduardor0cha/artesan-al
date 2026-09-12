import Link from 'next/link'

import type { ReusableSalesPoint } from '@/application/sales-point/find-nearby-sales-points-to-reuse'
import { DEFAULT_SEARCH_CENTER } from '@/application/sales-point/search-nearby-sales-points'
import { LocationPicker } from '@/presentation/components/sales-point/location-picker'
import { NewSalesPointForm } from '@/presentation/components/sales-point/new-sales-point-form'
import { Alert } from '@/presentation/components/ui/alert'
import { Button, buttonVariants } from '@/presentation/components/ui/button'
import { formatDistance } from '@/presentation/lib/format-distance'
import { newSalesPointHref, PANEL_PARAM } from '@/presentation/lib/panel-url'
import { routes } from '@/presentation/lib/routes'
import { parseSearchQuery, type RawSearchParams } from '@/presentation/lib/search-url'
import { messages } from '@/presentation/messages/pt-BR'

import { findNearbySalesPointsToReuse } from '../../../composition'
import { requireArtisan } from '../../../current-artisan'
import { createSalesPoint, sellHere } from '../actions'

/**
 * The flow of ADR 0004, as two steps in one URL: mark the spot, then look at what is already
 * registered there before anything new is created. A fair duplicated by every artisan who sells at
 * it would split one place into a dozen pins on the visitor's map.
 */
export default async function NewSalesPointPage(props: PageProps<'/painel/onde-vendo/novo'>) {
  const artisan = await requireArtisan()
  const params = await props.searchParams
  const spot = spotFrom(params)

  if (!spot) {
    return (
      <Screen>
        <h2 className="text-xl font-semibold text-stone-900">
          {messages.panel.newSalesPoint.pickLocation}
        </h2>
        <LocationPicker
          latitude={DEFAULT_SEARCH_CENTER.latitude}
          longitude={DEFAULT_SEARCH_CENTER.longitude}
          action={routes.newSalesPoint}
        />
      </Screen>
    )
  }

  const nearby = await findNearbySalesPointsToReuse().execute({
    artisanId: artisan.id,
    ...spot,
  })

  if (!nearby.ok) {
    return (
      <Screen>
        <Alert variant="error">{nearby.error.message}</Alert>
        <BackToPicker />
      </Screen>
    )
  }

  // Nothing registered here means there is nothing to offer, so the form opens straight away.
  const creating = nearby.value.length === 0 || first(params[PANEL_PARAM.newPoint]) === '1'

  return (
    <Screen>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-stone-900">
          {messages.panel.newSalesPoint.nearbyTitle}
        </h2>

        {nearby.value.length === 0 ? (
          <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
            {messages.panel.newSalesPoint.nearbyEmpty}
          </p>
        ) : (
          <>
            <p className="text-stone-700">{messages.panel.newSalesPoint.nearbyLead}</p>
            <ul className="flex list-none flex-col gap-3 p-0">
              {nearby.value.map((candidate) => (
                <li key={candidate.salesPoint.id}>
                  <Candidate candidate={candidate} />
                </li>
              ))}
            </ul>
          </>
        )}

        <BackToPicker />
      </section>

      {creating ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900">
            {messages.panel.newSalesPoint.createTitle}
          </h2>
          <NewSalesPointForm {...spot} action={createSalesPoint} />
        </section>
      ) : (
        <Link
          href={newSalesPointHref({ ...spot, creating: true })}
          className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
        >
          {messages.panel.newSalesPoint.noneOfThese}
        </Link>
      )}
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold text-stone-900">
        {messages.panel.newSalesPoint.title}
      </h1>
      {children}
    </main>
  )
}

function BackToPicker() {
  return (
    <Link
      href={routes.newSalesPoint}
      className="self-start text-emerald-800 underline underline-offset-4"
    >
      {messages.panel.newSalesPoint.changeLocation}
    </Link>
  )
}

function Candidate({ candidate }: { candidate: ReusableSalesPoint }) {
  const { salesPoint, distanceMeters, alreadySelling } = candidate

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-emerald-800">
          {messages.salesPoint.types[salesPoint.type]}
        </p>
        <h3 className="text-lg font-semibold text-stone-900">{salesPoint.name}</h3>
        <p className="text-stone-700">{formatDistance(distanceMeters)}</p>
        {salesPoint.address && <p className="text-stone-600">{salesPoint.address}</p>}
      </div>

      {alreadySelling ? (
        <p className="text-stone-700">{messages.panel.newSalesPoint.alreadySelling}</p>
      ) : (
        <form action={sellHere}>
          <input type="hidden" name="salesPointId" value={salesPoint.id} />
          <Button type="submit">{messages.panel.newSalesPoint.sellHere}</Button>
        </form>
      )}
    </article>
  )
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/**
 * The spot the artisan confirmed, or nothing — a malformed pair means the step was never taken,
 * and the map is where it starts.
 */
function spotFrom(params: RawSearchParams): { latitude: number; longitude: number } | null {
  const { latitude, longitude } = parseSearchQuery(params)

  if (latitude === undefined || longitude === undefined) return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return { latitude, longitude }
}
