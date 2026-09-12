import Link from 'next/link'

import { buttonVariants } from '@/presentation/components/ui/button'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { requireArtisan } from '../current-artisan'

/**
 * The entrance to the artisan's own area: where they sell, and what they make. The overview of the
 * whole account belongs to the last slice, once there is something to summarise.
 */
export default async function PanelPage() {
  await requireArtisan()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.title}</h1>
        <p className="text-stone-700">{messages.panel.whereISell.lead}</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link href={routes.whereISell} className={buttonVariants({ size: 'large' })}>
          {messages.panel.whereISell.title}
        </Link>

        <Link
          href={routes.myProducts}
          className={buttonVariants({ variant: 'secondary', size: 'large' })}
        >
          {messages.panel.myProducts.title}
        </Link>
      </div>
    </main>
  )
}
