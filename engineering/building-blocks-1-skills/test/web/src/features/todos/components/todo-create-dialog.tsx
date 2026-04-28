import { Button } from '../../../components/button'
import { Modal } from '../../../components/modal'
import { STATUS_COLUMNS, type Status, type Todo, type TodoCreate } from '../types'
import { TodoCreateFormFields } from './todo-create-form-fields'

type Props = {
  open: boolean
  defaultStatus: Status
  onCreate: (body: TodoCreate) => Promise<Todo>
  onClose: () => void
}

export function TodoCreateDialog({ open, defaultStatus, onCreate, onClose }: Props) {
  const label = STATUS_COLUMNS.find((c) => c.value === defaultStatus)?.label ?? ''
  const heading = defaultStatus === 'todo' ? 'New task' : `Add task to ${label}`

  return (
    <Modal open={open} onClose={onClose} labelledBy="todo-create-dialog-title" size="md">
      <div className="flex flex-col gap-16">
        <h2 id="todo-create-dialog-title" className="font-display text-[16px] font-bold">
          {heading}
        </h2>
        {open && (
          <TodoCreateFormFields
            defaultStatus={defaultStatus}
            onCreate={onCreate}
            onCreated={onClose}
          >
            <Button intent="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
          </TodoCreateFormFields>
        )}
      </div>
    </Modal>
  )
}
