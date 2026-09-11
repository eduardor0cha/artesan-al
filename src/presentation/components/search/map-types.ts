/**
 * What crosses into the map. Plain numbers and strings rather than the domain's `Coordinates`:
 * these props are serialised on their way to a Client Component, and a class instance does not
 * survive that crossing.
 */
export type MapSalesPoint = {
  id: string
  name: string
  latitude: number
  longitude: number
  distanceMeters: number
}

export type NearbySalesPointsMapProps = {
  center: { latitude: number; longitude: number }
  radiusKilometers: number
  salesPoints: MapSalesPoint[]
}
