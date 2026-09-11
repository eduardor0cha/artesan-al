import Link from 'next/link'

import type { Artisan } from '@/domain/artisan/artisan'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

type ArtisanSummaryProps = {
  artisan: Artisan
  /** The sales point page lists sellers under an h2, the product page names a single maker. */
  headingLevel?: 2 | 3
}

/** How an artisan appears inside someone else's page: enough to recognise them, and a way in. */
export function ArtisanSummary({ artisan, headingLevel = 3 }: ArtisanSummaryProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className="rounded-lg border border-stone-300 bg-white p-4">
      <Heading className="text-lg font-semibold text-stone-900">
        <Link
          href={routes.artisan(artisan.slug)}
          className="underline decoration-emerald-700 underline-offset-4 hover:text-emerald-800"
          aria-label={messages.salesPoint.seeArtisan(artisan.name)}
        >
          {artisan.name}
        </Link>
      </Heading>

      {artisan.craft && <p className="text-stone-700">{artisan.craft}</p>}

      {artisan.city && <p className="text-stone-600">{artisan.city}</p>}
    </article>
  )
}
