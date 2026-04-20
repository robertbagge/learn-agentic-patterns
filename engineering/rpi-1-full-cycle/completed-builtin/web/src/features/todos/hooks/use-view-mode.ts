import { useCallback, useEffect, useState } from 'react'

export type ViewMode = 'list' | 'kanban'

const STORAGE_KEY = 'todos.view'

function readStored(): ViewMode {
  if (typeof window === 'undefined') return 'list'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === 'kanban' ? 'kanban' : 'list'
}

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(() => readStored())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const setMode = useCallback((next: ViewMode) => setModeState(next), [])

  return [mode, setMode]
}
