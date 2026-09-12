import type { Metadata } from 'next'
import Link from 'next/link'

import { SignUpForm } from '@/presentation/components/auth/sign-up-form'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { signUp } from './actions'

export const metadata: Metadata = {
  title: messages.auth.signUp.title,
  // Account screens are of no use to a search engine and carry personal data forms.
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.auth.signUp.title}</h1>
        <p className="text-stone-700">{messages.auth.signUp.lead}</p>
      </header>

      <SignUpForm action={signUp} />

      <p className="text-stone-700">
        {messages.auth.signUp.haveAccount}{' '}
        <Link href={routes.signIn} className="text-emerald-800 underline underline-offset-4">
          {messages.auth.signUp.signInLink}
        </Link>
      </p>
    </main>
  )
}
