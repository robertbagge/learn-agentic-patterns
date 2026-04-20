import { useEffect, useRef } from 'react'
import { Button } from '../../../components/button'
import { STATUS_COLUMNS, type Status, type Todo, type TodoCreate } from '../types'
import { TodoCreateFormFields } from './todo-create-form-fields'

type Props = {
  open: boolean
  defaultStatus: Status
  onCreate: (body: TodoCreate) => Promise<Todo>
  onClose: () => void
}

export function TodoCreateDialog({ open, defaultStatus, onCreate, onClose }: Props) {
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
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  const label = STATUS_COLUMNS.find((c) => c.value === defaultStatus)?.label ?? ''
  const heading = defaultStatus === 'todo' ? 'New task' : `Add task to ${label}`

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="todo-create-dialog-title"
      className="bg-bg-card text-text-primary rounded-lg p-24 border border-border-default backdrop:bg-black/60 max-w-[400px]"
    >
      <div className="flex flex-col gap-16">
        <h2 id="todo-create-dialog-title" className="font-display text-[16px] font-bold">
          {heading}
        </h2>
        <TodoCreateFormFields
          defaultStatus={defaultStatus}
          onCreate={onCreate}
          onCreated={onClose}
        >
          <Button intent="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
        </TodoCreateFormFields>
      </div>
    </dialog>
  )
}
