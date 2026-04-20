import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../../components/button'
import { Select } from '../../../components/select'
import { PRIORITY_OPTIONS, type Priority, type Todo } from '../types'

type Props = {
  todo: Todo
  onRename: (title: string) => Promise<void> | void
  onPriorityChange: (priority: Priority) => void
  onRequestDelete: () => void
  disabled?: boolean
  dragging?: boolean
}

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-accent-destructive-soft text-accent-destructive',
  medium: 'bg-accent-secondary-soft text-accent-secondary',
  low: 'bg-accent-primary-soft text-accent-primary',
}

export function KanbanCard({
  todo,
  onRename,
  onPriorityChange,
  onRequestDelete,
  disabled,
  dragging,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setDraft(todo.title)
  }, [todo.title])

  const commit = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === todo.title) {
      setDraft(todo.title)
      setEditing(false)
      return
    }
    await onRename(trimmed)
    setEditing(false)
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(todo.title)
      setEditing(false)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-bg-card rounded-sm border border-border-default p-12 flex flex-col gap-8 cursor-grab',
        'touch-none select-none',
        dragging && 'shadow-lg ring-2 ring-border-accent cursor-grabbing',
        todo.status === 'done' && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-8">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => void commit()}
              onKeyDown={handleKey}
              onPointerDown={(e) => e.stopPropagation()}
              maxLength={200}
              className="w-full bg-bg-elevated text-text-primary text-sm rounded-sm border border-border-accent px-8 py-4 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={disabled}
              className={clsx(
                'w-full text-left text-sm rounded-sm px-4 py-2 -mx-4',
                'hover:bg-bg-hover focus-visible:outline-2 focus-visible:outline-border-accent',
                todo.status === 'done' && 'line-through text-text-muted',
              )}
            >
              {todo.title}
            </button>
          )}
        </div>
        <Button
          intent="ghost"
          size="sm"
          onClick={onRequestDelete}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={disabled}
          aria-label={`Delete "${todo.title}"`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </Button>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span
          className={clsx(
            'text-[11px] font-bold uppercase tracking-wider px-8 py-4 rounded-pill',
            PRIORITY_BADGE[todo.priority],
          )}
        >
          {todo.priority}
        </span>
        <Select
          name={`priority-${todo.id}`}
          value={todo.priority}
          onChange={(e) => onPriorityChange(e.target.value as Priority)}
          onPointerDown={(e) => e.stopPropagation()}
          options={PRIORITY_OPTIONS}
          disabled={disabled}
          aria-label={`Priority for "${todo.title}"`}
          className="w-[100px]"
        />
      </div>
    </div>
  )
}
