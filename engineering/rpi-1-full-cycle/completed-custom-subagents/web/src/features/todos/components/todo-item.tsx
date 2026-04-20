import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { Checkbox } from '../../../components/checkbox'
import { Select } from '../../../components/select'
import { Button } from '../../../components/button'
import { PRIORITY_OPTIONS, type Priority, type Todo } from '../types'

type Props = {
  todo: Todo
  onToggle: () => void
  onRename: (title: string) => Promise<void> | void
  onPriorityChange: (priority: Priority) => void
  onRequestDelete: () => void
  disabled?: boolean
}

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-accent-destructive-soft text-accent-destructive',
  medium: 'bg-accent-secondary-soft text-accent-secondary',
  low: 'bg-accent-primary-soft text-accent-primary',
}

export function TodoItem({
  todo,
  onToggle,
  onRename,
  onPriorityChange,
  onRequestDelete,
  disabled,
}: Props) {
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

  return (
    <div className="flex items-center gap-12 py-12 border-b border-border-default last:border-b-0">
      <Checkbox
        checked={todo.status === 'done'}
        onChange={onToggle}
        disabled={disabled}
        aria-label={`Mark "${todo.title}" ${todo.status === 'done' ? 'incomplete' : 'complete'}`}
      />
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
            disabled={disabled}
            className={clsx(
              'w-full text-left text-sm truncate rounded-sm px-8 py-4 -mx-8',
              'hover:bg-bg-hover focus-visible:outline-2 focus-visible:outline-border-accent',
              todo.status === 'done' && 'line-through text-text-muted',
            )}
          >
            {todo.title}
          </button>
        )}
      </div>
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
        options={PRIORITY_OPTIONS}
        disabled={disabled}
        aria-label={`Priority for "${todo.title}"`}
        className="w-[100px]"
      />
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
    </div>
  )
}
