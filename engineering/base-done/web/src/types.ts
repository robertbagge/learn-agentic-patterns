export type Todo = {
  id: string
  text: string
  completed: boolean
  created_at: string
}

export type TodoCreate = {
  text: string
}

export type TodoUpdate = {
  text?: string
  completed?: boolean
}
