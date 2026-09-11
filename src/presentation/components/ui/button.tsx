import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/presentation/lib/cn'

/**
 * Sizes start at 44px tall: the WCAG 2.2 target-size floor, which matters for the older devices
 * and less steady taps this audience uses. Do not add a smaller size variant.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
        secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300',
        ghost: 'bg-transparent text-stone-900 hover:bg-stone-100',
      },
      size: {
        default: 'min-h-11 px-4 py-2',
        large: 'min-h-14 px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'

  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
