import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/presentation/components/ui/button'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { requireArtisan } from '../current-artisan'
import { signOut } from '../entrar/actions'

export const metadata: Metadata = {
  title: messages.panel.title,
  robots: { index: false, follow: false },
}

/**
 * The frame around every panel screen. It reads the session for the greeting, but the barrier is
 * each page and each action calling `requireArtisan` on its own: a layout does not re-run on every
 * navigation, and an action is reachable without any layout at all.
 */
export default async function PanelLayout({ children }: LayoutProps<'/painel'>) {
  const artisan = await requireArtisan()

  return (
    <>
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="font-medium text-stone-900">{messages.panel.greeting(artisan.name)}</p>

          <nav aria-label={messages.panel.title} className="flex flex-wrap items-center gap-2">
            <Link
              href={routes.panel}
              className="min-h-11 content-center px-2 text-emerald-800 underline underline-offset-4"
            >
              {messages.panel.title}
            </Link>

            <Link
              href={routes.artisan(artisan.slug)}
              className="min-h-11 content-center px-2 text-emerald-800 underline underline-offset-4"
            >
              {messages.panel.myPublicPage}
            </Link>

            <form action={signOut}>
              <Button type="submit" variant="ghost">
                {messages.auth.signOut}
              </Button>
            </form>
          </nav>
        </div>
      </header>

      {children}
    </>
  )
}
