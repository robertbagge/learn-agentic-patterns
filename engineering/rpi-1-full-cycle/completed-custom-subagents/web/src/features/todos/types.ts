export type Priority = 'low' | 'medium' | 'high'

export type Todo = {
  id: string
  title: string
  priority: Priority
  completed: boolean
  created_at: string
  updated_at: string
}

export type TodoCreate = {
  title: string
  priority?: Priority
}

export type TodoUpdate = {
  title?: string
  priority?: Priority
  completed?: boolean
}

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]
