import { useMemo } from 'react'
import { BoardCard } from './board-card'
import { ColumnHeader } from './column-header'
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

  return (
    <section className="flex flex-col gap-12 bg-bg-card rounded-lg p-16">
      <ColumnHeader label={label} count={cards.length} onAdd={() => onAdd(status)} />
      <ul className="flex flex-col gap-8">
        {cards.map((card) => (
          <li key={card.id}>
            <BoardCard todo={card} onRequestDelete={() => onRequestDelete(card)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
