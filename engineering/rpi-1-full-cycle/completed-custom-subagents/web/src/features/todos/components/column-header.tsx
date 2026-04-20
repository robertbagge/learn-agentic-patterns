import { Button } from '../../../components/button'

type Props = {
  label: string
  count: number
  onAdd: () => void
}

export function ColumnHeader({ label, count, onAdd }: Props) {
  return (
    <header className="flex items-center justify-between gap-8">
      <div className="flex items-center gap-8">
        <h2 className="font-display text-[20px] font-semibold leading-none text-text-primary">{label}</h2>
        <span className="text-sm text-text-secondary">{count}</span>
      </div>
      <Button intent="ghost" size="sm" onClick={onAdd} aria-label={`Add task to ${label}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </Button>
    </header>
  )
}
