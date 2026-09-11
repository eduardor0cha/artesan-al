/**
 * What crosses into the map of a single point. Plain numbers rather than the domain's
 * `Coordinates`: these props are serialised on their way to a Client Component, and a class
 * instance does not survive that crossing.
 */
export type SalesPointMapProps = {
  name: string
  latitude: number
  longitude: number
}
