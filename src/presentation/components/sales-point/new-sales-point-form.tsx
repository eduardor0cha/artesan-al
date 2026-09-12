'use client'

import { useActionState } from 'react'

import { SALES_POINT_TYPES } from '@/domain/sales-point/sales-point-type'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { TextField } from '@/presentation/components/ui/text-field'
import { IDLE_ACTION, type ActionState } from '@/presentation/lib/action-state'
import { messages } from '@/presentation/messages/pt-BR'

type NewSalesPointFormProps = {
  /** The spot the artisan already confirmed on the map, carried through to the action. */
  latitude: number
  longitude: number
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

export function NewSalesPointForm({ latitude, longitude, action }: NewSalesPointFormProps) {
  const [state, submit, pending] = useActionState(action, IDLE_ACTION)

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />

      <TextField
        id="sales-point-name"
        name="name"
        label={messages.panel.newSalesPoint.name}
        hint={messages.panel.newSalesPoint.nameHint}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="sales-point-type" className="font-medium text-stone-900">
          {messages.panel.newSalesPoint.type}
        </label>
        <select
          id="sales-point-type"
          name="type"
          defaultValue="fair"
          className="min-h-11 rounded-lg border border-stone-400 bg-white px-3 text-base text-stone-900"
        >
          {SALES_POINT_TYPES.map((type) => (
            <option key={type} value={type}>
              {messages.salesPoint.types[type]}
            </option>
          ))}
        </select>
      </div>

      <TextField
        id="sales-point-address"
        name="address"
        label={`${messages.panel.newSalesPoint.address} (${messages.panel.optional})`}
        hint={messages.panel.newSalesPoint.addressHint}
      />

      <TextField
        id="sales-point-opening-hours"
        name="openingHours"
        label={`${messages.panel.newSalesPoint.openingHours} (${messages.panel.optional})`}
        hint={messages.panel.newSalesPoint.openingHoursHint}
      />

      <Button type="submit" size="large" disabled={pending}>
        {messages.panel.newSalesPoint.submit}
      </Button>
    </form>
  )
}
