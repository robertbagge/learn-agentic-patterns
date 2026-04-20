import clsx from 'clsx'
import { Button } from '../../../components/button'
import { TrashIcon } from '../icons'
import { PRIORITY_BADGE } from '../priority'
import type { Todo } from '../types'

type Props = {
  todo: Todo
  onRequestDelete: () => void
  hideActions?: boolean
}

export function BoardCard({ todo, onRequestDelete, hideActions = false }: Props) {
  return (
    <article className="flex items-start gap-12 bg-bg-elevated rounded-md p-12 hover:bg-bg-hover">
      <p
        className={clsx(
          'flex-1 min-w-0 text-sm text-text-primary break-words',
          todo.status === 'done' && 'line-through text-text-muted',
        )}
      >
        {todo.title}
      </p>
      <span
        className={clsx(
          'text-[11px] font-bold uppercase tracking-wider px-8 py-4 rounded-pill',
          PRIORITY_BADGE[todo.priority],
        )}
      >
        {todo.priority}
      </span>
      {!hideActions && (
        <Button
          intent="ghost"
          size="sm"
          onClick={onRequestDelete}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Delete "${todo.title}"`}
        >
          <TrashIcon />
        </Button>
      )}
    </article>
  )
}
