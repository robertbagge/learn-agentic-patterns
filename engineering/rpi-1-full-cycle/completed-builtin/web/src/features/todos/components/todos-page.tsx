import { useRef } from 'react'
import { useTodos } from '../hooks/use-todos'
import { useViewMode } from '../hooks/use-view-mode'
import { KanbanBoard } from './kanban-board'
import { TodoCreateForm } from './todo-create-form'
import { TodoList } from './todo-list'
import { ViewModeToggle } from './view-mode-toggle'

export function TodosPage() {
  const { todos, status, error, refetch, create, update, remove, reorder } = useTodos()
  const [mode, setMode] = useViewMode()
  const createInputRef = useRef<HTMLInputElement>(null)

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-32 px-24 py-48">
      <header className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[38px] font-bold leading-none tracking-[-1.5px] text-text-primary">
            Todos
          </h1>
          <p className="text-sm text-text-secondary">
            {status === 'success' ? `${todos.length} task${todos.length === 1 ? '' : 's'}` : ' '}
          </p>
        </div>
        <ViewModeToggle value={mode} onChange={setMode} />
      </header>
      <TodoCreateForm ref={createInputRef} onCreate={create} />
      {mode === 'list' ? (
        <TodoList
          todos={todos}
          status={status}
          error={error}
          onRetry={() => void refetch()}
          onUpdate={update}
          onRemove={remove}
          onEmptyCreate={() => createInputRef.current?.focus()}
        />
      ) : (
        <KanbanBoard
          todos={todos}
          status={status}
          error={error}
          onRetry={() => void refetch()}
          onUpdate={update}
          onRemove={remove}
          onReorder={reorder}
        />
      )}
    </main>
  )
}
