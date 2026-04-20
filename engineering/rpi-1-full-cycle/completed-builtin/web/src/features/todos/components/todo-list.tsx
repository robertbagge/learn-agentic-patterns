import { useState } from 'react'
import { Button } from '../../../components/button'
import { Card } from '../../../components/card'
import { EmptyState } from '../../../components/empty-state'
import { ErrorState } from '../../../components/error-state'
import { Skeleton } from '../../../components/skeleton'
import { useToast } from '../../../components/toast'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { TodoItem } from './todo-item'
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
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const withBusy = async <T,>(id: string, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusyIds((prev) => new Set(prev).add(id))
    try {
      return await fn()
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Something went wrong', 'error')
      return undefined
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleToggle = (todo: Todo) =>
    withBusy(todo.id, async () => {
      const done = todo.status === 'done'
      await onUpdate(todo.id, { status: done ? 'todo' : 'done' })
      toast.show(done ? 'Marked incomplete' : 'Marked complete')
    })

  const handleRename = (todo: Todo, title: string) =>
    withBusy(todo.id, async () => {
      await onUpdate(todo.id, { title })
      toast.show('Task updated')
    })

  const handlePriority = (todo: Todo, priority: Todo['priority']) =>
    withBusy(todo.id, async () => {
      await onUpdate(todo.id, { priority })
      toast.show('Priority updated')
    })

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await onRemove(pendingDelete.id)
      toast.show('Task deleted')
      setPendingDelete(null)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete task', 'error')
    } finally {
      setDeleting(false)
    }
  }

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
                  onToggle={() => void handleToggle(todo)}
                  onRename={(title) => handleRename(todo, title)}
                  onPriorityChange={(priority) => void handlePriority(todo, priority)}
                  onRequestDelete={() => setPendingDelete(todo)}
                  disabled={busyIds.has(todo.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
      <ConfirmDeleteDialog
        title={pendingDelete?.title ?? ''}
        open={pendingDelete !== null}
        confirming={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Card>
  )
}
