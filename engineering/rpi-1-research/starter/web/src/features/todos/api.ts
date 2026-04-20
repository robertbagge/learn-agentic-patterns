import { api } from '../../lib/api-client'
import type { Todo, TodoCreate, TodoUpdate } from './types'

export const todosApi = {
  list: () => api.get<Todo[]>('/api/todos/'),
  create: (body: TodoCreate) => api.post<Todo>('/api/todos/', body),
  update: (id: string, body: TodoUpdate) => api.patch<Todo>(`/api/todos/${id}`, body),
  remove: (id: string) => api.delete(`/api/todos/${id}`),
}
