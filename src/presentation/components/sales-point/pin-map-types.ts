/**
 * What crosses into the pin map. Plain numbers rather than the domain's `Coordinates`, which does
 * not survive the crossing into a Client Component, and a callback the picker owns.
 */
export type PinMapProps = {
  latitude: number
  longitude: number
  onMove: (position: { latitude: number; longitude: number }) => void
}
