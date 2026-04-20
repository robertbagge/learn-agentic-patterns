import { useState } from 'react'
import { Button } from '../../../components/button'
import { useToast } from '../../../components/toast'
import { useTodos } from '../hooks/use-todos'
import { STATUS_COLUMNS, type Status, type Todo } from '../types'
import { BoardLayout } from './board-layout'
import { Column } from './column'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

export function BoardPage() {
  const { todos, remove } = useTodos()
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = (_status: Status) => {
    // wired in Phase 7 (TodoCreateDialog)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await remove(pendingDelete.id)
      toast.show('Task deleted')
      setPendingDelete(null)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete task', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="flex flex-col gap-32 px-32 py-48">
      <header className="flex items-center justify-between gap-16">
        <h1 className="font-display text-[38px] font-bold leading-none tracking-[-1.5px] text-text-primary">
          Board
        </h1>
        <Button intent="primary" size="md" onClick={() => handleAdd('todo')}>
          + New task
        </Button>
      </header>
      <BoardLayout>
        {STATUS_COLUMNS.map(({ value, label }) => (
          <Column
            key={value}
            status={value}
            label={label}
            todos={todos}
            onAdd={handleAdd}
            onRequestDelete={setPendingDelete}
          />
        ))}
      </BoardLayout>
      <ConfirmDeleteDialog
        title={pendingDelete?.title ?? ''}
        open={pendingDelete !== null}
        confirming={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </main>
  )
}
