import clsx from 'clsx'
import { Button } from '../../../components/button'
import { PRIORITY_BADGE } from '../priority'
import type { Todo } from '../types'

type Props = {
  todo: Todo
  onRequestDelete: () => void
}

export function BoardCard({ todo, onRequestDelete }: Props) {
  return (
    <article
      tabIndex={0}
      className="flex items-start gap-12 bg-bg-elevated rounded-md p-12 hover:bg-bg-hover focus-visible:outline-2 focus-visible:outline-border-accent focus-visible:outline-offset-2"
    >
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
      <Button
        intent="ghost"
        size="sm"
        onClick={onRequestDelete}
        aria-label={`Delete "${todo.title}"`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </Button>
    </article>
  )
}
