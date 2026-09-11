import type { NearbySalesPointSummary } from '@/application/ports/sales-point-search.query'
import { formatDistance } from '@/presentation/lib/format-distance'
import { messages } from '@/presentation/messages/pt-BR'

type SalesPointCardProps = {
  summary: NearbySalesPointSummary
}

export function SalesPointCard({ summary }: SalesPointCardProps) {
  const { salesPoint, distanceMeters, artisanNames, artisanCount } = summary
  const remaining = artisanCount - artisanNames.length

  return (
    <article className="rounded-lg border border-stone-300 bg-white p-4">
      <p className="text-sm font-medium text-emerald-800">
        {messages.salesPoint.types[salesPoint.type]}
      </p>

      <h3 className="text-lg font-semibold text-stone-900">{salesPoint.name}</h3>

      <p className="text-stone-700">
        {messages.salesPoint.distanceAway(formatDistance(distanceMeters))}
      </p>

      {salesPoint.address && <p className="text-stone-600">{salesPoint.address}</p>}

      {salesPoint.openingHours && <p className="text-stone-600">{salesPoint.openingHours}</p>}

      {artisanNames.length > 0 ? (
        <p className="mt-2 text-stone-700">
          <span className="font-medium">{messages.salesPoint.soldBy}:</span>{' '}
          {artisanNames.join(', ')}
          {remaining > 0 && ` ${messages.salesPoint.andMoreArtisans(remaining)}`}
        </p>
      ) : (
        <p className="mt-2 text-stone-600">{messages.salesPoint.noArtisans}</p>
      )}
    </article>
  )
}
