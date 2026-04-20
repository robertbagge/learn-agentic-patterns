import { useCallback, useEffect, useState } from 'react'
import { todosApi } from '../api'
import type { ReorderBody, Todo, TodoCreate, TodoUpdate } from '../types'

type LoadStatus = 'loading' | 'success' | 'error'

export type UseTodosResult = {
  todos: Todo[]
  status: LoadStatus
  error: string | null
  refetch: (opts?: { quiet?: boolean }) => Promise<void>
  create: (body: TodoCreate) => Promise<Todo>
  update: (id: string, body: TodoUpdate) => Promise<Todo>
  remove: (id: string) => Promise<void>
  reorder: (body: ReorderBody, optimisticNext?: Todo[]) => Promise<Todo[]>
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setStatus('loading')
    setError(null)
    try {
      const items = await todosApi.list()
      setTodos(items)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load todos')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const create = useCallback(
    async (body: TodoCreate) => {
      const todo = await todosApi.create(body)
      await refetch()
      return todo
    },
    [refetch],
  )

  const update = useCallback(
    async (id: string, body: TodoUpdate) => {
      const todo = await todosApi.update(id, body)
      await refetch()
      return todo
    },
    [refetch],
  )

  const remove = useCallback(
    async (id: string) => {
      await todosApi.remove(id)
      await refetch()
    },
    [refetch],
  )

  const reorder = useCallback(
    async (body: ReorderBody, optimisticNext?: Todo[]) => {
      if (optimisticNext) setTodos(optimisticNext)
      try {
        const items = await todosApi.reorder(body)
        setTodos(items)
        return items
      } catch (e) {
        await refetch({ quiet: true })
        throw e
      }
    },
    [refetch],
  )

  return { todos, status, error, refetch, create, update, remove, reorder }
}
