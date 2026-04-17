import { useEffect, useState, type FormEvent } from 'react'

import TodoItem from './components/TodoItem'
import { createTodo, deleteTodo, listTodos, updateTodo } from './api'
import type { Todo } from './types'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listTodos()
      .then(setTodos)
      .catch((err) => console.error('load todos failed', err))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    try {
      const created = await createTodo({ text })
      setTodos((prev) => [...prev, created])
      setDraft('')
    } catch (err) {
      console.error('create todo failed', err)
    }
  }

  async function handleToggle(todo: Todo) {
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed })
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      console.error('toggle todo failed', err)
    }
  }

  async function handleDelete(todo: Todo) {
    try {
      await deleteTodo(todo.id)
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    } catch (err) {
      console.error('delete todo failed', err)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Todos</h1>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing?"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing yet. Add your first todo above.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
