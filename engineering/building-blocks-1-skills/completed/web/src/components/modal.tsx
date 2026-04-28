import clsx from 'clsx'
import { useEffect, useRef, type ReactNode } from 'react'

type Size = 'sm' | 'md'

type Props = {
  open: boolean
  onClose: () => void
  labelledBy: string
  size?: Size
  children: ReactNode
}

const sizeClass: Record<Size, string> = {
  sm: 'w-full max-w-md',
  md: 'w-full max-w-xl',
}

export function Modal({ open, onClose, labelledBy, size = 'sm', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={clsx(
        'fixed inset-0 m-auto bg-bg-card text-text-primary rounded-lg p-24 border border-border-default backdrop:bg-black/60',
        sizeClass[size],
      )}
    >
      {children}
    </dialog>
  )
}
