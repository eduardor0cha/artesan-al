import Link from 'next/link'

import type { SalesPoint } from '@/domain/sales-point/sales-point'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

type SalesPointSummaryProps = {
  salesPoint: SalesPoint
  headingLevel?: 2 | 3
  /** Extra lines the host page adds, such as how far the point is from the visitor. */
  children?: React.ReactNode
}

/**
 * A place to buy, as it appears inside a list. The search card wraps this with the distance and
 * who sells there; the artisan and product pages use it on its own.
 */
export function SalesPointSummary({
  salesPoint,
  headingLevel = 3,
  children,
}: SalesPointSummaryProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className="rounded-lg border border-stone-300 bg-white p-4">
      <p className="text-sm font-medium text-emerald-800">
        {messages.salesPoint.types[salesPoint.type]}
      </p>

      <Heading className="text-lg font-semibold text-stone-900">
        <Link
          href={routes.salesPoint(salesPoint.id)}
          className="underline decoration-emerald-700 underline-offset-4 hover:text-emerald-800"
        >
          {salesPoint.name}
        </Link>
      </Heading>

      {children}

      {salesPoint.address && <p className="text-stone-600">{salesPoint.address}</p>}

      {salesPoint.openingHours && <p className="text-stone-600">{salesPoint.openingHours}</p>}
    </article>
  )
}
