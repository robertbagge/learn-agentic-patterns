import { useCallback, useState } from 'react'
import { useToast } from '../../../components/toast'

export function useBusyIds() {
  const toast = useToast()
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const withBusy = useCallback(
    async <T,>(id: string, fn: () => Promise<T>): Promise<T | undefined> => {
      setBusyIds((prev) => new Set(prev).add(id))
      try {
        return await fn()
      } catch (err) {
        toast.show(err instanceof Error ? err.message : 'Something went wrong', 'error')
        return undefined
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [toast],
  )

  return { busyIds, withBusy }
}
