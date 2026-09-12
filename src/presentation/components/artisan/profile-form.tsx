'use client'

import { useActionState } from 'react'

import type { Artisan } from '@/domain/artisan/artisan'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { messages } from '@/presentation/messages/pt-BR'

type ProfileFormProps = {
  artisan: Artisan
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

/**
 * The fields of the public page, in the order a visitor reads them. The name is not among them:
 * it is what the page is addressed by, and moving it would break every link already shared.
 */
export function ProfileForm({ artisan, action }: ProfileFormProps) {
  const [state, submit, pending] = useActionState(action, IDLE_ACTION)

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.done && <Alert variant="success">{messages.panel.profile.saved}</Alert>}

      <p className="text-stone-700">{messages.panel.profile.nameFixed(artisan.name)}</p>

      <TextField
        id="artisan-craft"
        name="craft"
        label={`${messages.panel.profile.craft} (${messages.panel.optional})`}
        hint={messages.panel.profile.craftHint}
        defaultValue={artisan.craft ?? undefined}
      />

      <TextField
        id="artisan-city"
        name="city"
        label={`${messages.panel.profile.city} (${messages.panel.optional})`}
        defaultValue={artisan.city ?? undefined}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="artisan-story" className="font-medium text-stone-900">
          {`${messages.panel.profile.story} (${messages.panel.optional})`}
        </label>
        <p id="artisan-story-hint" className="text-sm text-stone-600">
          {messages.panel.profile.storyHint}
        </p>
        <textarea
          id="artisan-story"
          name="story"
          rows={5}
          defaultValue={artisan.story ?? undefined}
          aria-describedby="artisan-story-hint"
          className="rounded-lg border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        />
      </div>

      <TextField
        id="artisan-phone"
        name="publicPhone"
        type="tel"
        inputMode="numeric"
        label={messages.panel.profile.publicPhone}
        hint={messages.panel.profile.publicPhoneHint}
        defaultValue={artisan.publicPhone}
        required
      />

      <TextField
        id="artisan-sicab"
        name="sicabNumber"
        label={`${messages.panel.profile.sicab} (${messages.panel.optional})`}
        hint={messages.panel.profile.sicabHint}
        defaultValue={artisan.sicabNumber ?? undefined}
      />

      <Button type="submit" size="large" disabled={pending}>
        {messages.panel.profile.submit}
      </Button>
    </form>
  )
}
