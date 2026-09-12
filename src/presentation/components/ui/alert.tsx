import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/presentation/lib/cn'

const alertVariants = cva('rounded-lg border p-4', {
  variants: {
    variant: {
      error: 'border-red-300 bg-red-50 text-red-900',
      success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      info: 'border-stone-300 bg-stone-100 text-stone-800',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
})

type AlertProps = ComponentProps<'p'> & VariantProps<typeof alertVariants>

/**
 * What went wrong, or what has just worked, said in one sentence. The default role is `alert` so
 * a screen reader announces it when it appears — the answer to a form submission arrives long
 * after the tap that caused it.
 */
export function Alert({ className, variant, role = 'alert', ...props }: AlertProps) {
  return <p role={role} className={cn(alertVariants({ variant }), className)} {...props} />
}
