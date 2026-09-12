'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { actionSucceeded, actionFailed, type ActionState } from '@/presentation/lib/action-state'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { updateArtisanProfile } from '../../composition'
import { requireArtisan } from '../../current-artisan'

const profileSchema = z.object({
  publicPhone: z.string().min(1),
  craft: z.string().optional(),
  city: z.string().optional(),
  story: z.string().optional(),
  sicabNumber: z.string().optional(),
})

/**
 * Unlike the rest of the panel this one stays on its own screen instead of redirecting: the
 * artisan is likely to write the story in more than one sitting, and landing back on a list would
 * lose the field they were in.
 */
export async function saveProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const artisan = await requireArtisan()
  const input = profileSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm)

  const saved = await updateArtisanProfile().execute({ artisanId: artisan.id, ...input.data })

  if (!saved.ok) return actionFailed(saved.error.message)

  revalidatePath(routes.profile)
  revalidatePath(routes.artisan(saved.value.slug))

  return actionSucceeded()
}
