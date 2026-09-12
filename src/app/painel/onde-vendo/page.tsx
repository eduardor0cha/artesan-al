import Link from 'next/link'

import { SalesPointSummary } from '@/presentation/components/sales-point/sales-point-summary'
import { Alert } from '@/presentation/components/ui/alert'
import { buttonVariants } from '@/presentation/components/ui/button'
import { PANEL_PARAM, POINT_GONE } from '@/presentation/lib/panel-url'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { findSalesPointsOfArtisan } from '../../composition'
import { requireArtisan } from '../../current-artisan'

export default async function WhereISellPage(props: PageProps<'/painel/onde-vendo'>) {
  const artisan = await requireArtisan()
  const salesPoints = await findSalesPointsOfArtisan(artisan.id)

  const params = await props.searchParams
  const added = salesPoints.find((salesPoint) => salesPoint.id === first(params[PANEL_PARAM.added]))
  const pointGone = first(params[PANEL_PARAM.error]) === POINT_GONE

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.whereISell.title}</h1>
        <p className="text-stone-700">{messages.panel.whereISell.lead}</p>
      </header>

      {added && <Alert variant="success">{messages.panel.whereISell.linked(added.name)}</Alert>}
      {pointGone && <Alert variant="error">{messages.panel.whereISell.pointGone}</Alert>}

      {salesPoints.length === 0 ? (
        <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-700">
          {messages.panel.whereISell.empty}
        </p>
      ) : (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
          {salesPoints.map((salesPoint) => (
            <li key={salesPoint.id}>
              <SalesPointSummary salesPoint={salesPoint} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href={routes.newSalesPoint}
        className={buttonVariants({ size: 'large', className: 'self-start' })}
      >
        {salesPoints.length === 0
          ? messages.panel.whereISell.add
          : messages.panel.whereISell.addAnother}
      </Link>
    </main>
  )
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
