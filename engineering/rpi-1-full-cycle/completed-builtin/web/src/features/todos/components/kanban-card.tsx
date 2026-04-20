import { forwardRef, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../../components/button'
import { Select } from '../../../components/select'
import { PRIORITY_OPTIONS, type Priority, type Todo } from '../types'

type ViewProps = {
  todo: Todo
  onRename?: (title: string) => Promise<void> | void
  onPriorityChange?: (priority: Priority) => void
  onRequestDelete?: () => void
  disabled?: boolean
  dragging?: boolean
  style?: CSSProperties
  handleListeners?: DraggableSyntheticListeners
  attributes?: DraggableAttributes
}

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-accent-destructive-soft text-accent-destructive',
  medium: 'bg-accent-secondary-soft text-accent-secondary',
  low: 'bg-accent-primary-soft text-accent-primary',
}

export const KanbanCardView = forwardRef<HTMLDivElement, ViewProps>(function KanbanCardView(
  { todo, onRename, onPriorityChange, onRequestDelete, disabled, dragging, style, handleListeners, attributes },
  ref,
) {
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
    await onRename?.(trimmed)
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

  return (
    <div
      ref={ref}
      style={style}
      {...attributes}
      className={clsx(
        'bg-bg-card rounded-sm border border-border-default flex flex-col',
        dragging && 'shadow-lg ring-2 ring-border-accent',
        todo.status === 'done' && 'opacity-70',
      )}
    >
      <button
        type="button"
        {...handleListeners}
        aria-label={`Drag "${todo.title}"`}
        className={clsx(
          'flex items-center justify-center gap-4 py-4 text-text-muted touch-none',
          'cursor-grab active:cursor-grabbing hover:bg-bg-hover rounded-t-sm',
          'focus-visible:outline-2 focus-visible:outline-border-accent',
          dragging && 'cursor-grabbing',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <div className="flex flex-col gap-8 p-12 pt-4">
        <div className="flex items-start gap-8">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => void commit()}
                onKeyDown={handleKey}
                maxLength={200}
                className="w-full bg-bg-elevated text-text-primary text-sm rounded-sm border border-border-accent px-8 py-4 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={disabled || !onRename}
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
          {onRequestDelete && (
            <Button
              intent="ghost"
              size="sm"
              onClick={onRequestDelete}
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
          )}
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
          {onPriorityChange && (
            <Select
              name={`priority-${todo.id}`}
              value={todo.priority}
              onChange={(e) => onPriorityChange(e.target.value as Priority)}
              options={PRIORITY_OPTIONS}
              disabled={disabled}
              aria-label={`Priority for "${todo.title}"`}
              className="w-[100px]"
            />
          )}
        </div>
      </div>
    </div>
  )
})

type Props = Omit<ViewProps, 'style' | 'handleListeners' | 'attributes'>

export function KanbanCard(props: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.todo.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  }

  return (
    <KanbanCardView
      {...props}
      ref={setNodeRef}
      style={style}
      handleListeners={listeners}
      attributes={attributes}
    />
  )
}
