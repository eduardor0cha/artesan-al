import type { NearbySalesPointSummary } from '@/application/ports/sales-point-search.query'
import { SalesPointSummary } from '@/presentation/components/sales-point/sales-point-summary'
import { formatDistance } from '@/presentation/lib/format-distance'
import { messages } from '@/presentation/messages/pt-BR'

type SalesPointCardProps = {
  summary: NearbySalesPointSummary
}

export function SalesPointCard({ summary }: SalesPointCardProps) {
  const { salesPoint, distanceMeters, artisanNames, artisanCount } = summary
  const remaining = artisanCount - artisanNames.length

  return (
    <SalesPointSummary salesPoint={salesPoint}>
      <p className="text-stone-700">
        {messages.salesPoint.distanceAway(formatDistance(distanceMeters))}
      </p>

      {artisanNames.length > 0 ? (
        <p className="mt-2 text-stone-700">
          <span className="font-medium">{messages.salesPoint.soldBy}:</span>{' '}
          {artisanNames.join(', ')}
          {remaining > 0 && ` ${messages.salesPoint.andMoreArtisans(remaining)}`}
        </p>
      ) : (
        <p className="mt-2 text-stone-600">{messages.salesPoint.noArtisans}</p>
      )}
    </SalesPointSummary>
  )
}
