'use client'

import { useActionState } from 'react'

import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { messages } from '@/presentation/messages/pt-BR'

type SignUpFormProps = {
  /** The Server Action lives in `app/`, which this layer must not import, so it arrives as a prop. */
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

export function SignUpForm({ action }: SignUpFormProps) {
  const [state, submit, pending] = useActionState(action, IDLE_ACTION)

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <TextField
        id="name"
        name="name"
        label={messages.auth.name}
        hint={messages.auth.nameHint}
        autoComplete="name"
        required
      />

      <TextField
        id="cpf"
        name="cpf"
        label={messages.auth.cpf}
        hint={messages.auth.cpfHint}
        inputMode="numeric"
        autoComplete="username"
        required
      />

      <TextField
        id="phone"
        name="phone"
        label={messages.auth.phone}
        hint={messages.auth.phoneHint}
        inputMode="tel"
        autoComplete="tel"
        required
      />

      <TextField
        id="password"
        name="password"
        type="password"
        label={messages.auth.password}
        hint={messages.auth.passwordHint}
        autoComplete="new-password"
        minLength={8}
        required
      />

      <Button type="submit" size="large" disabled={pending}>
        {messages.auth.signUp.submit}
      </Button>
    </form>
  )
}
