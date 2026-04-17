import type { Todo } from '../types'

type Props = {
  todo: Todo
  onToggle: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo)}
        className="h-4 w-4 accent-blue-600"
      />
      <span
        className={
          todo.completed
            ? 'flex-1 text-gray-400 line-through'
            : 'flex-1 text-gray-900'
        }
      >
        {todo.text}
      </span>
      <button
        type="button"
        onClick={() => onDelete(todo)}
        className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600"
        aria-label="Delete todo"
      >
        Delete
      </button>
    </li>
  )
}
