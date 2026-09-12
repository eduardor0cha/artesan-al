'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { Cpf } from '@/domain/artisan/cpf'
import { signInWithCpf, signOut as endSession } from '@/infrastructure/auth/session'
import { actionFailed, type ActionState } from '@/presentation/lib/action-state'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

const signInSchema = z.object({
  cpf: z.string().min(1),
  password: z.string().min(1),
})

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  const input = signInSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm)

  const cpf = Cpf.create(input.data.cpf)

  // A CPF that is not a document cannot match any account, and saying so here saves a round trip
  // to the password hasher. The message stays the same either way.
  if (!cpf.ok || !(await signInWithCpf(cpf.value.digits, input.data.password))) {
    return actionFailed(messages.auth.signIn.failed)
  }

  redirect(routes.panel)
}

export async function signOut(): Promise<void> {
  await endSession()

  redirect(routes.signIn)
}
