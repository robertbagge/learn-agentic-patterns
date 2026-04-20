import { useCallback, useEffect, useRef, useState } from 'react'
import { todosApi } from '../api'
import { computeDropPosition } from '../position'
import type { Status, Todo, TodoCreate, TodoMove, TodoUpdate } from '../types'

type LoadStatus = 'loading' | 'success' | 'error'

export type UseTodosResult = {
  todos: Todo[]
  status: LoadStatus
  error: string | null
  refetch: () => Promise<void>
  create: (body: TodoCreate) => Promise<Todo>
  update: (id: string, body: TodoUpdate) => Promise<Todo>
  move: (id: string, body: TodoMove) => Promise<Todo>
  remove: (id: string) => Promise<void>
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const snapshotsRef = useRef<Map<string, Todo>>(new Map())
  const tempIdsRef = useRef<Set<string>>(new Set())
  const inFlightRef = useRef(0)

  const refetch = useCallback(async () => {
    if (inFlightRef.current > 0) return
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

  const create = useCallback(async (body: TodoCreate) => {
    const tempId = `temp-${crypto.randomUUID()}`
    const destStatus: Status = body.status ?? 'todo'
    const now = new Date().toISOString()

    inFlightRef.current++
    tempIdsRef.current.add(tempId)

    try {
      setTodos((prev) => {
        const { position } = computeDropPosition(prev, destStatus, null)
        const optimistic: Todo = {
          id: tempId,
          title: body.title,
          priority: body.priority ?? 'medium',
          status: destStatus,
          position,
          created_at: now,
          updated_at: now,
        }
        return [...prev, optimistic]
      })

      const serverTodo = await todosApi.create(body)
      setTodos((prev) => prev.map((t) => (t.id === tempId ? serverTodo : t)))
      tempIdsRef.current.delete(tempId)
      return serverTodo
    } catch (e) {
      setTodos((prev) => prev.filter((t) => t.id !== tempId))
      tempIdsRef.current.delete(tempId)
      throw e
    } finally {
      inFlightRef.current--
    }
  }, [])

  const update = useCallback(async (id: string, body: TodoUpdate) => {
    inFlightRef.current++
    let snapshot: Todo | undefined

    try {
      setTodos((prev) => {
        const current = prev.find((t) => t.id === id)
        if (current) {
          snapshot = current
          snapshotsRef.current.set(id, current)
        }
        return prev.map((t) => (t.id === id ? { ...t, ...body } : t))
      })

      const serverTodo = await todosApi.update(id, body)
      setTodos((prev) => prev.map((t) => (t.id === id ? serverTodo : t)))
      snapshotsRef.current.delete(id)
      return serverTodo
    } catch (e) {
      if (snapshot) setTodos((prev) => prev.map((t) => (t.id === id ? snapshot! : t)))
      snapshotsRef.current.delete(id)
      throw e
    } finally {
      inFlightRef.current--
    }
  }, [])

  const move = useCallback(async (id: string, body: TodoMove) => {
    inFlightRef.current++
    let snapshot: Todo | undefined

    try {
      setTodos((prev) => {
        const current = prev.find((t) => t.id === id)
        if (current) {
          snapshot = current
          snapshotsRef.current.set(id, current)
        }
        return prev.map((t) =>
          t.id === id ? { ...t, status: body.status, position: body.position } : t,
        )
      })

      const serverTodo = await todosApi.move(id, body)
      setTodos((prev) => prev.map((t) => (t.id === id ? serverTodo : t)))
      snapshotsRef.current.delete(id)
      return serverTodo
    } catch (e) {
      if (snapshot) setTodos((prev) => prev.map((t) => (t.id === id ? snapshot! : t)))
      snapshotsRef.current.delete(id)
      throw e
    } finally {
      inFlightRef.current--
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    inFlightRef.current++
    let snapshot: Todo | undefined

    try {
      setTodos((prev) => {
        const current = prev.find((t) => t.id === id)
        if (current) {
          snapshot = current
          snapshotsRef.current.set(id, current)
        }
        return prev.filter((t) => t.id !== id)
      })

      await todosApi.remove(id)
      snapshotsRef.current.delete(id)
    } catch (e) {
      if (snapshot) {
        setTodos((prev) => {
          if (prev.some((t) => t.id === id)) return prev
          return [...prev, snapshot!]
        })
      }
      snapshotsRef.current.delete(id)
      throw e
    } finally {
      inFlightRef.current--
    }
  }, [])

  return { todos, status, error, refetch, create, update, move, remove }
}
