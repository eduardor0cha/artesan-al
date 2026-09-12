import Link from 'next/link'

import { ProfileForm } from '@/presentation/components/artisan/profile-form'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { requireArtisan } from '../../current-artisan'
import { saveProfile } from './actions'

export default async function ProfilePage() {
  const artisan = await requireArtisan()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <nav aria-label={messages.panel.title}>
        <Link href={routes.panel} className="text-emerald-800 underline underline-offset-4">
          {messages.panel.title}
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.panel.profile.title}</h1>
        <p className="text-stone-700">{messages.panel.profile.lead}</p>
      </header>

      <ProfileForm artisan={artisan} action={saveProfile} />
    </main>
  )
}
