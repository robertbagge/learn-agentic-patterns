import { forwardRef, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../../components/button'
import { Input } from '../../../components/input'
import { Select } from '../../../components/select'
import { useToast } from '../../../components/toast'
import { PRIORITY_OPTIONS, type Priority, type Status } from '../types'

type Props = {
  defaultStatus?: Status
  onCreate: (body: { title: string; priority: Priority; status: Status }) => Promise<unknown>
  onCreated?: () => void
  children?: ReactNode
}

export const TodoCreateFormFields = forwardRef<HTMLInputElement, Props>(function TodoCreateFormFields(
  { defaultStatus = 'todo', onCreate, onCreated, children },
  ref,
) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setTitle('')
    setPriority('medium')
  }, [defaultStatus])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onCreate({ title: trimmed, priority, status: defaultStatus })
      setTitle('')
      setPriority('medium')
      toast.show('Task added')
      onCreated?.()
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to add task', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
      <div className="flex items-center justify-end gap-8">
        {children}
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Adding…' : 'Add task'}
        </Button>
      </div>
    </form>
  )
})
