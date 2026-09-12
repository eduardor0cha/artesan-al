import { messages } from '@/presentation/messages/pt-BR'

import { requireArtisan } from '../current-artisan'

/**
 * The entrance to the artisan's own area. What can be done from here arrives with the slices that
 * build it — where they sell, then the catalogue.
 */
export default async function PanelPage() {
  await requireArtisan()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.title}</h1>
    </main>
  )
}
