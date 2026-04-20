import { useEffect, useRef } from 'react'
import { Button } from '../../../components/button'

type Props = {
  title: string
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  confirming?: boolean
}

export function ConfirmDeleteDialog({ title, open, onCancel, onConfirm, confirming }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onCancel()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onCancel])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-delete-title"
      className="bg-bg-card text-text-primary rounded-lg p-24 border border-border-default backdrop:bg-black/60 max-w-[400px]"
    >
      <div className="flex flex-col gap-16">
        <h2 id="confirm-delete-title" className="font-display text-[16px] font-bold">
          Delete task?
        </h2>
        <p className="text-sm text-text-secondary">
          "{title}" will be removed. This can't be undone.
        </p>
        <div className="flex items-center justify-end gap-8">
          <Button intent="ghost" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button intent="destructive" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
