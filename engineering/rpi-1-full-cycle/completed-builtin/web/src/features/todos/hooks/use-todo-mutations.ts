import { useMemo } from 'react'
import { useToast } from '../../../components/toast'
import { useBusyIds } from './use-busy-ids'
import type { Todo, TodoUpdate } from '../types'

type UpdateFn = (id: string, body: TodoUpdate) => Promise<Todo>

export function useTodoMutations(update: UpdateFn) {
  const toast = useToast()
  const { busyIds, withBusy } = useBusyIds()

  const handlers = useMemo(
    () => ({
      rename: (todo: Todo, title: string) =>
        withBusy(todo.id, async () => {
          await update(todo.id, { title })
          toast.show('Task updated')
        }),
      prioritize: (todo: Todo, priority: Todo['priority']) =>
        withBusy(todo.id, async () => {
          await update(todo.id, { priority })
          toast.show('Priority updated')
        }),
      toggleDone: (todo: Todo) =>
        withBusy(todo.id, async () => {
          const done = todo.status === 'done'
          await update(todo.id, { status: done ? 'todo' : 'done' })
          toast.show(done ? 'Marked incomplete' : 'Marked complete')
        }),
    }),
    [update, toast, withBusy],
  )

  return { busyIds, ...handlers }
}
