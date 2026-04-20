import clsx from 'clsx'
import type { ViewMode } from '../hooks/use-view-mode'

type Props = {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'kanban', label: 'Kanban' },
]

export function ViewModeToggle({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex rounded-sm border border-border-default bg-bg-elevated p-2"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'px-12 py-4 text-sm rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-border-accent',
              active ? 'bg-bg-card text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
