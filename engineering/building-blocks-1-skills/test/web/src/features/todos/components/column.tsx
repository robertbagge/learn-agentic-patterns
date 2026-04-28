import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ColumnHeader } from './column-header'
import { SortableCard } from './sortable-card'
import type { Status, Todo } from '../types'

type Props = {
  status: Status
  label: string
  todos: Todo[]
  onAdd: (status: Status) => void
  onRequestDelete: (todo: Todo) => void
}

export function Column({ status, label, todos, onAdd, onRequestDelete }: Props) {
  const cards = useMemo(
    () => todos.filter((t) => t.status === status).sort((a, b) => a.position - b.position),
    [todos, status],
  )
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards])
  const { setNodeRef } = useDroppable({ id: `column:${status}` })

  return (
    <section className="flex flex-col gap-12 bg-bg-card rounded-lg p-16">
      <ColumnHeader label={label} count={cards.length} onAdd={() => onAdd(status)} />
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-col gap-8 min-h-32">
          {cards.map((card) => (
            <li key={card.id}>
              <SortableCard todo={card} onRequestDelete={() => onRequestDelete(card)} />
            </li>
          ))}
        </ul>
      </SortableContext>
    </section>
  )
}
