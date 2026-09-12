import Link from 'next/link'

import { buttonVariants } from '@/presentation/components/ui/button'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { requireArtisan } from '../current-artisan'

/**
 * The entrance to the artisan's own area. It offers the one thing that has to happen first: until
 * there is somewhere to find them, a profile shows a visitor nothing. The overview of the whole
 * account belongs to the last slice, once there is a catalogue to summarise.
 */
export default async function PanelPage() {
  await requireArtisan()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.title}</h1>
        <p className="text-stone-700">{messages.panel.whereISell.lead}</p>
      </header>

      <Link
        href={routes.whereISell}
        className={buttonVariants({ size: 'large', className: 'self-start' })}
      >
        {messages.panel.whereISell.title}
      </Link>
    </main>
  )
}
