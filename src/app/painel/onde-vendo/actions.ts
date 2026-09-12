'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { actionFailed, typedValues, type ActionState } from '@/presentation/lib/action-state'
import { POINT_GONE, whereISellHref } from '@/presentation/lib/panel-url'
import { routes } from '@/presentation/lib/routes'
import { messages } from '@/presentation/messages/pt-BR'

import { linkArtisanToSalesPoint, registerSalesPoint } from '../../composition'
import { requireArtisan } from '../../current-artisan'

const sellHereSchema = z.object({ salesPointId: z.uuid() })

const newSalesPointSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  address: z.string().optional(),
  openingHours: z.string().optional(),
})

/**
 * "I sell here too", from the list of points already registered around the artisan. It stays a
 * plain form post with no state to render back, so it keeps working with JavaScript disabled;
 * what went wrong travels in the query string of the screen it lands on.
 */
export async function sellHere(formData: FormData): Promise<void> {
  // The session is checked here, not by the screen that drew the form: an action is reachable by
  // a direct POST (ADR 0009).
  const artisan = await requireArtisan()
  const input = sellHereSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) redirect(whereISellHref({ error: POINT_GONE }))

  const linked = await linkArtisanToSalesPoint().execute({
    artisanId: artisan.id,
    salesPointId: input.data.salesPointId,
  })

  if (!linked.ok) redirect(whereISellHref({ error: POINT_GONE }))

  revalidatePath(routes.whereISell)
  redirect(whereISellHref({ added: linked.value.id }))
}

export async function createSalesPoint(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const artisan = await requireArtisan()
  const typed = typedValues(formData)
  const input = newSalesPointSchema.safeParse(Object.fromEntries(formData))

  if (!input.success) return actionFailed(messages.auth.incompleteForm, typed)

  const registered = await registerSalesPoint().execute({ artisanId: artisan.id, ...input.data })

  if (!registered.ok) return actionFailed(registered.error.message, typed)

  revalidatePath(routes.whereISell)
  redirect(whereISellHref({ added: registered.value.id }))
}
