import { useCallback, useEffect, useState } from 'react'
import { todosApi } from '../api'
import type { Todo, TodoCreate, TodoUpdate } from '../types'

type Status = 'loading' | 'success' | 'error'

export type UseTodosResult = {
  todos: Todo[]
  status: Status
  error: string | null
  refetch: () => Promise<void>
  create: (body: TodoCreate) => Promise<Todo>
  update: (id: string, body: TodoUpdate) => Promise<Todo>
  remove: (id: string) => Promise<void>
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setStatus('loading')
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

  return { todos, status, error, refetch, create, update, remove }
}
