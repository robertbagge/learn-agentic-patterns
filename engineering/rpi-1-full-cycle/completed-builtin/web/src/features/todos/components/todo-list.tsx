import { Button } from '../../../components/button'
import { Card } from '../../../components/card'
import { EmptyState } from '../../../components/empty-state'
import { ErrorState } from '../../../components/error-state'
import { Skeleton } from '../../../components/skeleton'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { TodoItem } from './todo-item'
import { useDeleteFlow } from '../hooks/use-delete-flow'
import { useTodoMutations } from '../hooks/use-todo-mutations'
import type { Todo, TodoUpdate } from '../types'

type Props = {
  todos: Todo[]
  status: 'loading' | 'success' | 'error'
  error: string | null
  onRetry: () => void
  onUpdate: (id: string, body: TodoUpdate) => Promise<Todo>
  onRemove: (id: string) => Promise<void>
  onEmptyCreate: () => void
}

export function TodoList({ todos, status, error, onRetry, onUpdate, onRemove, onEmptyCreate }: Props) {
  const { busyIds, rename, prioritize, toggleDone } = useTodoMutations(onUpdate)
  const deleteFlow = useDeleteFlow(onRemove)

  const total = todos.length
  const completed = todos.filter((t) => t.status === 'done').length

  return (
    <Card>
      <Card.Header
        title="Your tasks"
        subtitle={
          status === 'success'
            ? total === 0
              ? 'Nothing on the list yet.'
              : `${completed} of ${total} complete`
            : undefined
        }
      />
      <Card.Content>
        {status === 'loading' && (
          <div className="flex flex-col gap-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}
        {status === 'error' && <ErrorState message={error ?? 'Could not load todos.'} onRetry={onRetry} />}
        {status === 'success' && total === 0 && (
          <EmptyState
            title="No tasks yet"
            message="Add your first task to get started."
            action={<Button onClick={onEmptyCreate}>Add your first task</Button>}
          />
        )}
        {status === 'success' && total > 0 && (
          <ul className="flex flex-col">
            {todos.map((todo) => (
              <li key={todo.id}>
                <TodoItem
                  todo={todo}
                  onToggle={() => void toggleDone(todo)}
                  onRename={(title) => rename(todo, title)}
                  onPriorityChange={(priority) => void prioritize(todo, priority)}
                  onRequestDelete={() => deleteFlow.request(todo)}
                  disabled={busyIds.has(todo.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
      <ConfirmDeleteDialog
        title={deleteFlow.pending?.title ?? ''}
        open={deleteFlow.pending !== null}
        confirming={deleteFlow.deleting}
        onCancel={deleteFlow.cancel}
        onConfirm={() => void deleteFlow.confirm()}
      />
    </Card>
  )
}
