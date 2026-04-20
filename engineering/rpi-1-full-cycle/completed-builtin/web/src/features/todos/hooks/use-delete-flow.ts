import { useCallback, useState } from 'react'
import { useToast } from '../../../components/toast'
import type { Todo } from '../types'

export function useDeleteFlow(onRemove: (id: string) => Promise<void>) {
  const toast = useToast()
  const [pending, setPending] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const request = useCallback((todo: Todo) => setPending(todo), [])
  const cancel = useCallback(() => setPending(null), [])

  const confirm = useCallback(async () => {
    if (!pending) return
    setDeleting(true)
    try {
      await onRemove(pending.id)
      toast.show('Task deleted')
      setPending(null)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete task', 'error')
    } finally {
      setDeleting(false)
    }
  }, [pending, onRemove, toast])

  return { pending, deleting, request, cancel, confirm }
}
