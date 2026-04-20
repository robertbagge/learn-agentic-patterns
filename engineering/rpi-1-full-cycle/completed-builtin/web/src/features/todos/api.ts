import { api } from '../../lib/api-client'
import type { ReorderBody, Todo, TodoCreate, TodoUpdate } from './types'

export const todosApi = {
  list: () => api.get<Todo[]>('/api/todos/'),
  create: (body: TodoCreate) => api.post<Todo>('/api/todos/', body),
  update: (id: string, body: TodoUpdate) => api.patch<Todo>(`/api/todos/${id}`, body),
  remove: (id: string) => api.delete(`/api/todos/${id}`),
  reorder: (body: ReorderBody) => api.post<Todo[]>('/api/todos/reorder', body),
}
