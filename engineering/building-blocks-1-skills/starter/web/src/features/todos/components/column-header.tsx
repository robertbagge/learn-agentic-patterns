import { Button } from '../../../components/button'
import { PlusIcon } from '../icons'

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
        <PlusIcon />
      </Button>
    </header>
  )
}
