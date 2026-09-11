import { Button } from '@/presentation/components/ui/button'
import { SEARCH_PARAM } from '@/presentation/lib/search-url'
import { messages } from '@/presentation/messages/pt-BR'

/** Round distances a person recognises. Anything else typed into the URL still works. */
const RADIUS_OPTIONS_KM = [1, 5, 10, 25, 50]

type RadiusFilterProps = {
  latitude: number
  longitude: number
  radiusKilometers: number
}

/**
 * A plain GET form rather than a client component: it changes the search by navigating, so it
 * works with JavaScript disabled and leaves the result page shareable.
 */
export function RadiusFilter({ latitude, longitude, radiusKilometers }: RadiusFilterProps) {
  const options = [...new Set([...RADIUS_OPTIONS_KM, radiusKilometers])].sort((a, b) => a - b)

  return (
    <form method="get" action="/" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name={SEARCH_PARAM.latitude} value={latitude} />
      <input type="hidden" name={SEARCH_PARAM.longitude} value={longitude} />

      <div className="flex flex-col gap-1">
        <label htmlFor="search-radius" className="font-medium text-stone-900">
          {messages.search.radius}
        </label>
        <select
          id="search-radius"
          name={SEARCH_PARAM.radius}
          defaultValue={String(radiusKilometers)}
          className="min-h-11 rounded-lg border border-stone-400 bg-white px-3 text-base text-stone-900"
        >
          {options.map((kilometers) => (
            <option key={kilometers} value={kilometers}>
              {messages.search.radiusOption(String(kilometers))}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="secondary">
        {messages.search.submit}
      </Button>
    </form>
  )
}
