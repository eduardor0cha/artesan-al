export const SALES_POINT_TYPES = ['fair', 'workshop', 'store', 'cooperative'] as const

export type SalesPointType = (typeof SALES_POINT_TYPES)[number]

/**
 * A fair or a cooperative gathers many artisans, so it is created once and reused; a workshop
 * belongs to a single artisan. The distinction drives the duplicate check when someone registers a
 * new point near an existing one.
 */
export function isSharedSalesPoint(type: SalesPointType): boolean {
  return type === 'fair' || type === 'cooperative'
}
