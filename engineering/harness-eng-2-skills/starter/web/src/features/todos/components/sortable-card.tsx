import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../types'
import { BoardCard } from './board-card'

type Props = {
  todo: Todo
  onRequestDelete: () => void
}

export function SortableCard({ todo, onRequestDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'rounded-md cursor-grabbing focus-visible:outline-2 focus-visible:outline-border-accent focus-visible:outline-offset-2'
          : 'rounded-md cursor-grab focus-visible:outline-2 focus-visible:outline-border-accent focus-visible:outline-offset-2'
      }
      {...attributes}
      {...listeners}
    >
      <BoardCard todo={todo} onRequestDelete={onRequestDelete} />
    </div>
  )
}
