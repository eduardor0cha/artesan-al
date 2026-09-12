import Link from 'next/link'

import { buttonVariants } from '@/presentation/components/ui/button'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { findProductsOfArtisan, findSalesPointsOfArtisan } from '../composition'
import { requireArtisan } from '../current-artisan'

/**
 * The entrance to the artisan's own area, and the answer to the question they arrive with: is my
 * page ready? Each card says what is there today and opens the screen that changes it.
 */
export default async function PanelPage() {
  const artisan = await requireArtisan()
  const [salesPoints, catalogue] = await Promise.all([
    findSalesPointsOfArtisan(artisan.id),
    findProductsOfArtisan(artisan.id),
  ])

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.title}</h1>
        <p className="text-stone-700">{messages.panel.overview.lead}</p>
      </header>

      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        <li>
          <Card
            title={messages.panel.whereISell.title}
            summary={
              salesPoints.length === 0
                ? messages.panel.whereISell.empty
                : messages.panel.overview.salesPointCount(salesPoints.length)
            }
            detail={salesPoints.map((salesPoint) => salesPoint.name).join(' · ')}
            href={routes.whereISell}
            action={
              salesPoints.length === 0
                ? messages.panel.whereISell.add
                : messages.panel.whereISell.title
            }
          />
        </li>

        <li>
          <Card
            title={messages.panel.myProducts.title}
            summary={
              catalogue.length === 0
                ? messages.panel.myProducts.empty
                : messages.panel.overview.productCount(catalogue.length)
            }
            href={routes.myProducts}
            action={
              catalogue.length === 0
                ? messages.panel.myProducts.add
                : messages.panel.myProducts.title
            }
          />
        </li>

        <li className="sm:col-span-2">
          <Card
            title={messages.panel.profile.title}
            summary={
              artisan.craft && artisan.city
                ? `${artisan.craft} · ${artisan.city}`
                : messages.panel.overview.profileIncomplete
            }
            href={routes.profile}
            action={messages.panel.profile.title}
          />
        </li>
      </ul>

      <p className="text-stone-700">
        {messages.panel.overview.seeMyPage}{' '}
        <Link
          href={routes.artisan(artisan.slug)}
          className="text-emerald-800 underline underline-offset-4"
        >
          {routes.artisan(artisan.slug)}
        </Link>
      </p>
    </main>
  )
}

type CardProps = {
  title: string
  summary: string
  /** Extra line under the summary, when there is something concrete to name. */
  detail?: string
  href: string
  action: string
}

function Card({ title, summary, detail, href, action }: CardProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-lg border border-stone-300 bg-white p-4">
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="text-stone-700">{summary}</p>
        {detail && <p className="text-sm text-stone-600">{detail}</p>}
      </div>

      {/* Each card's link says something different, so none of them needs a name of its own. */}
      <Link
        href={href}
        className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
      >
        {action}
      </Link>
    </article>
  )
}
