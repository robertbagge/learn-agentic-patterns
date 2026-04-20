import { forwardRef, useState, type FormEvent } from 'react'
import { Button } from '../../../components/button'
import { Card } from '../../../components/card'
import { Input } from '../../../components/input'
import { Select } from '../../../components/select'
import { useToast } from '../../../components/toast'
import { PRIORITY_OPTIONS, type Priority } from '../types'

type Props = {
  onCreate: (body: { title: string; priority: Priority }) => Promise<unknown>
}

export const TodoCreateForm = forwardRef<HTMLInputElement, Props>(function TodoCreateForm(
  { onCreate },
  ref,
) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onCreate({ title: trimmed, priority })
      setTitle('')
      setPriority('medium')
      toast.show('Task added')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to add task', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <Card.Header title="Add a task" subtitle="Capture what's next." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <Input
          ref={ref}
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          maxLength={200}
          disabled={submitting}
          autoComplete="off"
        />
        <Select
          label="Priority"
          name="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          options={PRIORITY_OPTIONS}
          disabled={submitting}
        />
        <Card.Actions>
          <Button type="submit" disabled={submitting || !title.trim()}>
            {submitting ? 'Adding…' : 'Add task'}
          </Button>
        </Card.Actions>
      </form>
    </Card>
  )
})
