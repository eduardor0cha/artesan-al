'use server'

import { z } from 'zod'

import { actionFailed, actionSucceeded, type ActionState } from '@/presentation/lib/action-state'
import { messages } from '@/presentation/messages/pt-BR'

import { requestPasswordOtp, resetPasswordWithOtp } from '../composition'

const requestSchema = z.object({ phone: z.string().min(1) })

const resetSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().min(1),
  newPassword: z.string().min(1),
})

export async function requestCode(_state: ActionState, formData: FormData): Promise<ActionState> {
  const input = requestSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm)

  const sent = await requestPasswordOtp().execute(input.data)

  return sent.ok ? actionSucceeded() : actionFailed(sent.error.message)
}

export async function resetPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const input = resetSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm)

  const reset = await resetPasswordWithOtp().execute(input.data)

  return reset.ok ? actionSucceeded() : actionFailed(reset.error.message)
}
