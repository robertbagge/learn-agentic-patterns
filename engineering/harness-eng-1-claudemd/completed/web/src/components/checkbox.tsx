import { forwardRef } from 'react'
import clsx from 'clsx'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={clsx(
        'h-16 w-16 rounded-xs border border-border-default bg-bg-elevated',
        'accent-accent-primary cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-border-accent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
})
