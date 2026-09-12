import type { ComponentProps } from 'react'

import { cn } from '@/presentation/lib/cn'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  /** Shown under the label, and announced with the field rather than after it. */
  hint?: string
}

/**
 * Label, field and hint as one unit. The label is always visible — a placeholder disappears the
 * moment someone starts typing, which is exactly when a person unsure of the form needs it.
 */
export function TextField({ id, label, hint, className, ...props }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium text-stone-900">
        {label}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-stone-600">
          {hint}
        </p>
      )}

      <input
        id={id}
        aria-describedby={hintId}
        className={cn(
          'min-h-11 rounded-lg border border-stone-400 bg-white px-3 text-base text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700',
          className,
        )}
        {...props}
      />
    </div>
  )
}
