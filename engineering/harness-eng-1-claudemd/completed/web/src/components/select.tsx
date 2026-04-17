import { forwardRef } from 'react'
import clsx from 'clsx'

type Option = { value: string; label: string }

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string
  options: Option[]
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, id, options, className, ...props },
  ref,
) {
  const selectId = id ?? props.name
  return (
    <div className="flex flex-col gap-6">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={clsx(
          'bg-bg-elevated text-text-primary text-sm rounded-sm border border-border-default px-12 py-8',
          'focus:outline-none focus:border-border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
})
