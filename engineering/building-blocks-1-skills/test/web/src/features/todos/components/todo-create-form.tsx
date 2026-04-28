import { forwardRef } from 'react'
import { Card } from '../../../components/card'
import type { Priority } from '../types'
import { TodoCreateFormFields } from './todo-create-form-fields'

type Props = {
  onCreate: (body: { title: string; priority: Priority }) => Promise<unknown>
}

export const TodoCreateForm = forwardRef<HTMLInputElement, Props>(function TodoCreateForm(
  { onCreate },
  ref,
) {
  return (
    <Card>
      <Card.Header title="Add a task" subtitle="Capture what's next." />
      <TodoCreateFormFields ref={ref} defaultStatus="todo" onCreate={onCreate} />
    </Card>
  )
})
