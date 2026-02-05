import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-md shadow-[rgb(var(--primary)/0.25)] hover:bg-[rgb(var(--primary)/0.9)] hover:shadow-lg hover:shadow-[rgb(var(--primary)/0.3)]',
        destructive:
          'bg-red-600 text-white shadow-md hover:bg-red-700',
        outline:
          'border border-[rgb(var(--border))] bg-transparent hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]',
        secondary:
          'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] hover:bg-[rgb(var(--secondary)/0.8)]',
        ghost:
          'hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]',
        link:
          'text-[rgb(var(--primary))] underline-offset-4 hover:underline',
        success:
          'bg-emerald-600 text-white shadow-md hover:bg-emerald-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
