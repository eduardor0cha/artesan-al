import type { Metadata } from 'next'
import Link from 'next/link'

import { SignInForm } from '@/presentation/components/auth/sign-in-form'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { signIn } from './actions'

export const metadata: Metadata = {
  title: messages.auth.signIn.title,
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.auth.signIn.title}</h1>
        <p className="text-stone-700">{messages.auth.signIn.lead}</p>
      </header>

      <SignInForm action={signIn} />

      <div className="flex flex-col gap-2">
        <Link
          href={routes.forgotPassword}
          className="text-emerald-800 underline underline-offset-4"
        >
          {messages.auth.signIn.forgotPassword}
        </Link>

        <p className="text-stone-700">
          {messages.auth.signIn.noAccount}{' '}
          <Link href={routes.signUp} className="text-emerald-800 underline underline-offset-4">
            {messages.auth.signIn.signUpLink}
          </Link>
        </p>
      </div>
    </main>
  )
}
