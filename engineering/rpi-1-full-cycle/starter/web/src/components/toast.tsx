import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import clsx from 'clsx'

export type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-24 right-24 z-50 flex flex-col gap-8"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-bg-card border-l-4 border-l-success',
  error: 'bg-bg-card border-l-4 border-l-error',
  info: 'bg-bg-card border-l-4 border-l-info',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const handle = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(handle)
  }, [onDismiss])

  return (
    <div
      role="status"
      className={clsx(
        'pointer-events-auto flex items-center gap-12 rounded-lg px-16 py-12 shadow-sm min-w-[240px]',
        TONE_CLASSES[toast.tone],
      )}
    >
      <span className="text-sm text-text-primary flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-text-secondary hover:text-text-primary text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
