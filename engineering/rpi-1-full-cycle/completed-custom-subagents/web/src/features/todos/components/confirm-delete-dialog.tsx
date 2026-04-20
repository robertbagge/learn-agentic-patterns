import { Button } from '../../../components/button'
import { Modal } from '../../../components/modal'

type Props = {
  title: string
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  confirming?: boolean
}

export function ConfirmDeleteDialog({ title, open, onCancel, onConfirm, confirming }: Props) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-delete-title">
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
    </Modal>
  )
}
