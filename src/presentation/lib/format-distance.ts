import { messages } from '../messages/pt-BR'

const kilometersFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/**
 * Below a kilometre people think in metres and above it in kilometres, so the unit follows the
 * distance instead of forcing "0,3 km" on someone standing three blocks away.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} ${messages.units.meters}`
  }

  return `${kilometersFormat.format(meters / 1000)} ${messages.units.kilometers}`
}
