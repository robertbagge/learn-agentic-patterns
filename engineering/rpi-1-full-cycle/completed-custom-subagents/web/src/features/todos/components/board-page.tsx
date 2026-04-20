import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Button } from '../../../components/button'
import { ErrorState } from '../../../components/error-state'
import { Skeleton } from '../../../components/skeleton'
import { useToast } from '../../../components/toast'
import { handleDragEnd, makeAnnouncements } from '../board-dnd'
import { useTodos } from '../hooks/use-todos'
import { STATUS_COLUMNS, type Status, type Todo } from '../types'
import { BoardCard } from './board-card'
import { BoardLayout } from './board-layout'
import { Column } from './column'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { TodoCreateDialog } from './todo-create-dialog'

export function BoardPage() {
  const { todos, status, error, refetch, create, move, remove } = useTodos()
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [createFor, setCreateFor] = useState<Status | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const announcements = useMemo(() => makeAnnouncements(todos), [todos])
  const activeCard = activeId ? todos.find((t) => t.id === activeId) ?? null : null

  const handleAdd = (columnStatus: Status) => {
    setCreateFor(columnStatus)
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEndEvent = async (event: DragEndEvent) => {
    const dragged = todos.find((t) => t.id === String(event.active.id))
    const result = handleDragEnd(event, todos)
    setActiveId(null)
    if (!result || !dragged) return

    const primary = result.moves.find((m) => m.id === dragged.id)
    const destLabel = STATUS_COLUMNS.find((c) => c.value === primary?.status)?.label ?? ''
    try {
      for (const m of result.moves) {
        await move(m.id, { status: m.status, position: m.position })
      }
      if (primary && primary.status !== dragged.status) {
        toast.show(`Moved "${dragged.title}" to ${destLabel}`)
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to move task', 'error')
      // Resync from server: a multi-move batch may have partially applied.
      await refetch()
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
      {status === 'loading' && (
        <BoardLayout>
          {STATUS_COLUMNS.map(({ value, label }) => (
            <section
              key={value}
              className="flex flex-col gap-12 bg-bg-card rounded-lg p-16"
              aria-busy="true"
            >
              <h2 className="font-display text-[20px] font-semibold leading-none text-text-primary">
                {label}
              </h2>
              <div className="flex flex-col gap-8">
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
              </div>
            </section>
          ))}
        </BoardLayout>
      )}
      {status === 'error' && (
        <ErrorState message={error ?? 'Could not load the board.'} onRetry={() => void refetch()} />
      )}
      {status === 'success' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          accessibility={{ announcements }}
          onDragStart={handleDragStart}
          onDragEnd={(event) => void handleDragEndEvent(event)}
          onDragCancel={() => setActiveId(null)}
        >
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
          <DragOverlay>
            {activeCard ? (
              <BoardCard todo={activeCard} onRequestDelete={() => {}} hideActions />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <ConfirmDeleteDialog
        title={pendingDelete?.title ?? ''}
        open={pendingDelete !== null}
        confirming={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
      <TodoCreateDialog
        open={createFor !== null}
        defaultStatus={createFor ?? 'todo'}
        onCreate={create}
        onClose={() => setCreateFor(null)}
      />
    </main>
  )
}
