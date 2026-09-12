'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

type PasswordRecoveryFormProps = {
  requestCode: (state: ActionState, formData: FormData) => Promise<ActionState>
  resetPassword: (state: ActionState, formData: FormData) => Promise<ActionState>
}

/**
 * Asking for the code and using it are two steps of one conversation, so they share a screen and
 * the number is typed once — this audience is on a phone, often with the message app on top of
 * the browser. The number is kept here, in the component, and never put in the URL.
 */
export function PasswordRecoveryForm({ requestCode, resetPassword }: PasswordRecoveryFormProps) {
  const [phone, setPhone] = useState('')
  const [requested, request, requesting] = useActionState(requestCode, IDLE_ACTION)
  const [reset, submitReset, resetting] = useActionState(resetPassword, IDLE_ACTION)

  if (reset.done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">{messages.auth.recovery.done}</Alert>
        <Link href={routes.signIn} className="text-emerald-800 underline underline-offset-4">
          {messages.auth.recovery.backToSignIn}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={request} className="flex flex-col gap-4">
        {requested.error && <Alert variant="error">{requested.error}</Alert>}

        <TextField
          id="phone"
          name="phone"
          label={messages.auth.phone}
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />

        <Button
          type="submit"
          variant={requested.done ? 'secondary' : 'primary'}
          disabled={requesting}
        >
          {requesting ? messages.auth.recovery.sending : messages.auth.recovery.sendCode}
        </Button>
      </form>

      {requested.done && (
        <form action={submitReset} className="flex flex-col gap-4">
          <Alert variant="success">{messages.auth.recovery.sent}</Alert>

          {reset.error && <Alert variant="error">{reset.error}</Alert>}

          <input type="hidden" name="phone" value={phone} />

          <TextField
            id="otp"
            name="otp"
            label={messages.auth.code}
            hint={messages.auth.codeHint}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />

          <TextField
            id="new-password"
            name="newPassword"
            type="password"
            label={messages.auth.newPassword}
            hint={messages.auth.passwordHint}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <Button type="submit" size="large" disabled={resetting}>
            {messages.auth.recovery.submit}
          </Button>
        </form>
      )}
    </div>
  )
}
