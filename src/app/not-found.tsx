import type { Metadata } from 'next'
import Link from 'next/link'

import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

export const metadata: Metadata = {
  title: messages.notFound.title,
}

/**
 * Public links are shared by hand and go stale — a removed piece, a mistyped address. Next's own
 * 404 is in English, and this audience reads pt-BR.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold text-stone-900">{messages.notFound.title}</h1>
      <p className="text-stone-700">{messages.notFound.description}</p>
      <Link
        href={routes.search}
        className="self-start text-emerald-800 underline underline-offset-4"
      >
        {messages.navigation.backToSearch}
      </Link>
    </main>
  )
}
