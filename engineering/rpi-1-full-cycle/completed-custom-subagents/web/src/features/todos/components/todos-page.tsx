import { useRef } from 'react'
import { useTodos } from '../hooks/use-todos'
import { TodoCreateForm } from './todo-create-form'
import { TodoList } from './todo-list'

export function TodosPage() {
  const { todos, status, error, refetch, create, update, remove } = useTodos()
  const createInputRef = useRef<HTMLInputElement>(null)

  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-32 px-24 py-48">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-[38px] font-bold leading-none tracking-[-1.5px] text-text-primary">
          Todos
        </h1>
        <p className="text-sm text-text-secondary">
          {status === 'success' ? `${todos.length} task${todos.length === 1 ? '' : 's'}` : ' '}
        </p>
      </header>
      <TodoCreateForm ref={createInputRef} onCreate={create} />
      <TodoList
        todos={todos}
        status={status}
        error={error}
        onRetry={() => void refetch()}
        onUpdate={update}
        onRemove={remove}
        onEmptyCreate={() => createInputRef.current?.focus()}
      />
    </main>
  )
}
