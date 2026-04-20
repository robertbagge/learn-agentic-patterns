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
import { ErrorState } from '../../../components/error-state'
import { Skeleton } from '../../../components/skeleton'
import { useToast } from '../../../components/toast'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { KanbanCard, KanbanCardView } from './kanban-card'
import { KanbanColumn } from './kanban-column'
import { useDeleteFlow } from '../hooks/use-delete-flow'
import { useKanban } from '../hooks/use-kanban'
import { useTodoMutations } from '../hooks/use-todo-mutations'
import type { UseTodosResult } from '../hooks/use-todos'
import { STATUS_COLUMNS, type Status, type Todo, type TodoUpdate } from '../types'

const STATUS_VALUES: Status[] = STATUS_COLUMNS.map((c) => c.value)
const isStatus = (v: string): v is Status => (STATUS_VALUES as string[]).includes(v)
const STATUS_LABEL: Record<Status, string> = Object.fromEntries(
  STATUS_COLUMNS.map((c) => [c.value, c.label] as const),
) as Record<Status, string>

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
  const { busyIds, rename, prioritize } = useTodoMutations(onUpdate)
  const deleteFlow = useDeleteFlow(onRemove)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const announcements = useMemo(() => {
    const describe = (id: string | number) => {
      const todo = todos.find((t) => t.id === String(id))
      return todo ? `"${todo.title}"` : `card ${id}`
    }
    const describeTarget = (id: string | number) => {
      const str = String(id)
      if (isStatus(str)) return `the ${STATUS_LABEL[str]} column`
      return describe(id)
    }
    return {
      onDragStart: ({ active }: { active: { id: string | number } }) => `Picked up ${describe(active.id)}.`,
      onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
        over
          ? `${describe(active.id)} is over ${describeTarget(over.id)}.`
          : `${describe(active.id)} is no longer over a drop target.`,
      onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
        over
          ? `${describe(active.id)} was dropped over ${describeTarget(over.id)}.`
          : `${describe(active.id)} was dropped outside any column.`,
      onDragCancel: ({ active }: { active: { id: string | number } }) =>
        `Drag of ${describe(active.id)} was cancelled.`,
    }
  }, [todos])

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

    let toStatus: Status
    let toIndex: number

    if (isStatus(overIdStr)) {
      toStatus = overIdStr
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
        accessibility={{ announcements }}
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
                  onRename={(title) => rename(todo, title)}
                  onPriorityChange={(priority) => void prioritize(todo, priority)}
                  onRequestDelete={() => deleteFlow.request(todo)}
                  disabled={busyIds.has(todo.id)}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
        <DragOverlay>
          {activeTodo ? <KanbanCardView todo={activeTodo} dragging /> : null}
        </DragOverlay>
      </DndContext>
      <ConfirmDeleteDialog
        title={deleteFlow.pending?.title ?? ''}
        open={deleteFlow.pending !== null}
        confirming={deleteFlow.deleting}
        onCancel={deleteFlow.cancel}
        onConfirm={() => void deleteFlow.confirm()}
      />
    </>
  )
}
