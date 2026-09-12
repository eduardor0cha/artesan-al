'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { signInWithCpf } from '@/infrastructure/auth/session'
import { actionFailed, type ActionState } from '@/presentation/lib/action-state'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { signUpArtisan } from '../composition'

/**
 * Shape only. Whether the CPF is a document and the number is a mobile is decided by the domain,
 * which is also where the message the artisan reads comes from.
 */
const signUpSchema = z.object({
  name: z.string().min(1),
  cpf: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(1),
})

export async function signUp(_state: ActionState, formData: FormData): Promise<ActionState> {
  const input = signUpSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm)

  const created = await signUpArtisan().execute(input.data)

  if (!created.ok) return actionFailed(created.error.message)

  // The account was just created with this pair, so a failure here is the session store, not the
  // credentials: the artisan signs in from the sign-in screen and keeps the account either way.
  if (!(await signInWithCpf(input.data.cpf.replace(/\D/g, ''), input.data.password))) {
    redirect(routes.signIn)
  }

  redirect(routes.panel)
}
