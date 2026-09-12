import type { Metadata } from 'next'

import { PasswordRecoveryForm } from '@/presentation/components/auth/password-recovery-form'
import { messages } from '@/presentation/messages/pt-BR'

import { requestCode, resetPassword } from './actions'

export const metadata: Metadata = {
  title: messages.auth.recovery.title,
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-stone-900">{messages.auth.recovery.title}</h1>
        <p className="text-stone-700">{messages.auth.recovery.lead}</p>
      </header>

      <PasswordRecoveryForm requestCode={requestCode} resetPassword={resetPassword} />
    </main>
  )
}
