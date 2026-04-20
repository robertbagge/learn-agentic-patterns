import { useCallback, useMemo } from 'react'
import type { ReorderBody, Status, Todo } from '../types'
import { STATUS_COLUMNS } from '../types'
import type { UseTodosResult } from './use-todos'

export type KanbanColumns = Record<Status, Todo[]>

export type UseKanbanResult = {
  columns: KanbanColumns
  moveCard: (id: string, toStatus: Status, toIndex: number) => Promise<void>
}

function groupByStatus(todos: Todo[]): KanbanColumns {
  const columns: KanbanColumns = { todo: [], doing: [], done: [] }
  for (const todo of todos) columns[todo.status].push(todo)
  for (const key of STATUS_COLUMNS) {
    columns[key.value].sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position
      return a.created_at.localeCompare(b.created_at)
    })
  }
  return columns
}

export function useKanban(todos: Todo[], reorder: UseTodosResult['reorder']): UseKanbanResult {
  const columns = useMemo(() => groupByStatus(todos), [todos])

  const moveCard = useCallback(
    async (id: string, toStatus: Status, toIndex: number) => {
      const moving = todos.find((t) => t.id === id)
      if (!moving) return
      const fromStatus = moving.status

      const nextDest = columns[toStatus].filter((t) => t.id !== id)
      const clampedIndex = Math.max(0, Math.min(toIndex, nextDest.length))
      nextDest.splice(clampedIndex, 0, moving)
      const destIds = nextDest.map((t) => t.id)

      const crossColumn = fromStatus !== toStatus
      const nextSource = crossColumn ? columns[fromStatus].filter((t) => t.id !== id) : null
      const sourceIds = nextSource?.map((t) => t.id) ?? null

      const optimistic = todos.map((todo) => {
        if (todo.id === id) return { ...todo, status: toStatus, position: clampedIndex }
        if (crossColumn && todo.status === fromStatus) {
          const idx = nextSource!.findIndex((t) => t.id === todo.id)
          return idx >= 0 ? { ...todo, position: idx } : todo
        }
        if (todo.status === toStatus) {
          const idx = nextDest.findIndex((t) => t.id === todo.id)
          return idx >= 0 ? { ...todo, position: idx } : todo
        }
        return todo
      })

      const destBody: ReorderBody = { status: toStatus, ordered_ids: destIds }
      await reorder(destBody, optimistic)
      if (crossColumn && sourceIds) {
        await reorder({ status: fromStatus, ordered_ids: sourceIds })
      }
    },
    [todos, columns, reorder],
  )

  return { columns, moveCard }
}
