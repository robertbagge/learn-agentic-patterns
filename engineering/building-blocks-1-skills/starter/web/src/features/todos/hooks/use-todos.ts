import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react'
import { todosApi } from '../api'
import { appendPosition } from '../position'
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

type OptimisticSpec<T> = {
  optimistic: (prev: Todo[]) => Todo[]
  request: () => Promise<T>
  reconcile: (result: T) => (prev: Todo[]) => Todo[]
  rollback: (prev: Todo[]) => Todo[]
}

async function withOptimistic<T>(
  setTodos: Dispatch<SetStateAction<Todo[]>>,
  inFlightRef: MutableRefObject<number>,
  spec: OptimisticSpec<T>,
): Promise<T> {
  inFlightRef.current++
  try {
    setTodos(spec.optimistic)
    const result = await spec.request()
    setTodos(spec.reconcile(result))
    return result
  } catch (e) {
    setTodos(spec.rollback)
    throw e
  } finally {
    inFlightRef.current--
  }
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const todosRef = useRef<Todo[]>([])
  const inFlightRef = useRef(0)

  useEffect(() => {
    todosRef.current = todos
  }, [todos])

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
    return withOptimistic(setTodos, inFlightRef, {
      optimistic: (prev) => [
        ...prev,
        {
          id: tempId,
          title: body.title,
          priority: body.priority ?? 'medium',
          status: destStatus,
          position: appendPosition(prev, destStatus),
          created_at: now,
          updated_at: now,
        },
      ],
      request: () => todosApi.create(body),
      reconcile: (serverTodo) => (prev) => prev.map((t) => (t.id === tempId ? serverTodo : t)),
      rollback: (prev) => prev.filter((t) => t.id !== tempId),
    })
  }, [])

  const update = useCallback(async (id: string, body: TodoUpdate) => {
    const snapshot = todosRef.current.find((t) => t.id === id)
    return withOptimistic(setTodos, inFlightRef, {
      optimistic: (prev) => prev.map((t) => (t.id === id ? { ...t, ...body } : t)),
      request: () => todosApi.update(id, body),
      reconcile: (serverTodo) => (prev) => prev.map((t) => (t.id === id ? serverTodo : t)),
      rollback: (prev) => (snapshot ? prev.map((t) => (t.id === id ? snapshot : t)) : prev),
    })
  }, [])

  const move = useCallback(async (id: string, body: TodoMove) => {
    const snapshot = todosRef.current.find((t) => t.id === id)
    return withOptimistic(setTodos, inFlightRef, {
      optimistic: (prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: body.status, position: body.position } : t,
        ),
      request: () => todosApi.move(id, body),
      reconcile: (serverTodo) => (prev) => prev.map((t) => (t.id === id ? serverTodo : t)),
      rollback: (prev) => (snapshot ? prev.map((t) => (t.id === id ? snapshot : t)) : prev),
    })
  }, [])

  const remove = useCallback(async (id: string) => {
    const snapshot = todosRef.current.find((t) => t.id === id)
    await withOptimistic(setTodos, inFlightRef, {
      optimistic: (prev) => prev.filter((t) => t.id !== id),
      request: () => todosApi.remove(id),
      reconcile: () => (prev) => prev,
      rollback: (prev) => {
        if (!snapshot || prev.some((t) => t.id === id)) return prev
        return [...prev, snapshot]
      },
    })
  }, [])

  return { todos, status, error, refetch, create, update, move, remove }
}
