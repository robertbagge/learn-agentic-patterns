export type Priority = 'low' | 'medium' | 'high'
export type Status = 'todo' | 'doing' | 'done'

export type Todo = {
  id: string
  title: string
  priority: Priority
  status: Status
  position: number
  created_at: string
  updated_at: string
}

export type TodoCreate = {
  title: string
  priority?: Priority
  status?: Status
}

export type TodoUpdate = {
  title?: string
  priority?: Priority
  status?: Status
}

export type TodoMove = {
  status: Status
  position: number
}

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export const STATUS_COLUMNS: readonly { value: Status; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'doing', label: 'Doing' },
  { value: 'done', label: 'Done' },
] as const
