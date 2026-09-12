'use client'

import { useActionState } from 'react'

import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { messages } from '@/presentation/messages/pt-BR'

type SignInFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

export function SignInForm({ action }: SignInFormProps) {
  const [state, submit, pending] = useActionState(action, IDLE_ACTION)

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

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
        id="password"
        name="password"
        type="password"
        label={messages.auth.password}
        autoComplete="current-password"
        required
      />

      <Button type="submit" size="large" disabled={pending}>
        {messages.auth.signIn.submit}
      </Button>
    </form>
  )
}
