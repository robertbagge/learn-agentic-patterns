import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Status, Todo } from '../types'

type Props = {
  status: Status
  label: string
  todos: Todo[]
  children: ReactNode
}

export function KanbanColumn({ status, label, todos, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section className="bg-bg-elevated rounded-lg p-12 flex flex-col gap-12 flex-1 min-w-[240px]">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-[14px] font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </h3>
        <span className="text-[12px] font-medium text-text-muted bg-bg-card rounded-pill px-8 py-2">
          {todos.length}
        </span>
      </header>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx(
            'flex flex-col gap-8 min-h-[120px] rounded-sm transition-colors',
            isOver && 'bg-bg-hover/50',
          )}
        >
          {todos.length === 0 ? (
            <p className="text-center text-xs text-text-muted py-24">No tasks</p>
          ) : (
            children
          )}
        </div>
      </SortableContext>
    </section>
  )
}
