import { useState } from 'react'
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
import { ErrorState } from '../../../components/error-state'
import { Skeleton } from '../../../components/skeleton'
import { useToast } from '../../../components/toast'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { KanbanCard } from './kanban-card'
import { KanbanColumn } from './kanban-column'
import { useKanban } from '../hooks/use-kanban'
import type { UseTodosResult } from '../hooks/use-todos'
import { STATUS_COLUMNS, type Status, type Todo, type TodoUpdate } from '../types'

type Props = {
  todos: Todo[]
  status: 'loading' | 'success' | 'error'
  error: string | null
  onRetry: () => void
  onUpdate: (id: string, body: TodoUpdate) => Promise<Todo>
  onRemove: (id: string) => Promise<void>
  onReorder: UseTodosResult['reorder']
}

export function KanbanBoard({ todos, status, error, onRetry, onUpdate, onRemove, onReorder }: Props) {
  const toast = useToast()
  const { columns, moveCard } = useKanban(todos, onReorder)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const withBusy = async <T,>(id: string, fn: () => Promise<T>): Promise<T | undefined> => {
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
  }

  const handleRename = (todo: Todo, title: string) =>
    withBusy(todo.id, async () => {
      await onUpdate(todo.id, { title })
      toast.show('Task updated')
    })

  const handlePriority = (todo: Todo, priority: Todo['priority']) =>
    withBusy(todo.id, async () => {
      await onUpdate(todo.id, { priority })
      toast.show('Priority updated')
    })

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await onRemove(pendingDelete.id)
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

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    if (activeIdStr === overIdStr) return

    const moving = todos.find((t) => t.id === activeIdStr)
    if (!moving) return

    const statusKeys = STATUS_COLUMNS.map((c) => c.value) as Status[]
    let toStatus: Status
    let toIndex: number

    if (statusKeys.includes(overIdStr as Status)) {
      toStatus = overIdStr as Status
      toIndex = columns[toStatus].length
    } else {
      const overTodo = todos.find((t) => t.id === overIdStr)
      if (!overTodo) return
      toStatus = overTodo.status
      const destList = columns[toStatus]
      const overIndex = destList.findIndex((t) => t.id === overIdStr)
      toIndex = overIndex >= 0 ? overIndex : destList.length
    }

    if (moving.status === toStatus && columns[toStatus][toIndex]?.id === activeIdStr) return

    try {
      await moveCard(activeIdStr, toStatus, toIndex)
    } catch {
      toast.show("Couldn't move card", 'error')
    }
  }

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) ?? null : null

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-16 md:flex-row">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.value} className="flex flex-col gap-12 flex-1 bg-bg-elevated rounded-lg p-12">
            <Skeleton className="h-16 w-[80px]" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return <ErrorState message={error ?? 'Could not load todos.'} onRetry={onRetry} />
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-col gap-16 md:flex-row">
          {STATUS_COLUMNS.map((col) => (
            <KanbanColumn key={col.value} status={col.value} label={col.label} todos={columns[col.value]}>
              {columns[col.value].map((todo) => (
                <KanbanCard
                  key={todo.id}
                  todo={todo}
                  onRename={(title) => handleRename(todo, title)}
                  onPriorityChange={(priority) => void handlePriority(todo, priority)}
                  onRequestDelete={() => setPendingDelete(todo)}
                  disabled={busyIds.has(todo.id)}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
        <DragOverlay>
          {activeTodo ? (
            <KanbanCard
              todo={activeTodo}
              onRename={() => {}}
              onPriorityChange={() => {}}
              onRequestDelete={() => {}}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <ConfirmDeleteDialog
        title={pendingDelete?.title ?? ''}
        open={pendingDelete !== null}
        confirming={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
