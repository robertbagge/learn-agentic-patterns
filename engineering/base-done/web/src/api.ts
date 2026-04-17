import type { Todo, TodoCreate, TodoUpdate } from './types'

const BASE = `http://localhost:${import.meta.env.VITE_API_PORT}`

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function listTodos(): Promise<Todo[]> {
  return fetch(`${BASE}/todos`).then(json<Todo[]>)
}

export function createTodo(body: TodoCreate): Promise<Todo> {
  return fetch(`${BASE}/todos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json<Todo>)
}

export function updateTodo(id: string, body: TodoUpdate): Promise<Todo> {
  return fetch(`${BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json<Todo>)
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${BASE}/todos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
}
