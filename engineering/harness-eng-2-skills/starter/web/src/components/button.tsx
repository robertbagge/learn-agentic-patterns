import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center rounded-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-border-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      intent: {
        primary: 'bg-accent-primary text-text-inverse hover:brightness-110 active:brightness-95',
        secondary: 'bg-transparent text-text-primary border border-border-default hover:bg-bg-hover',
        ghost: 'bg-transparent text-text-primary hover:bg-bg-hover',
        destructive: 'bg-accent-destructive text-text-primary hover:brightness-110 active:brightness-95',
      },
      size: {
        sm: 'px-8 py-4 text-sm gap-6',
        md: 'px-12 py-8 text-sm gap-8',
        lg: 'px-16 py-12 text-base gap-8',
      },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  },
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { intent, size, className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={button({ intent, size, className })} {...props} />
})
