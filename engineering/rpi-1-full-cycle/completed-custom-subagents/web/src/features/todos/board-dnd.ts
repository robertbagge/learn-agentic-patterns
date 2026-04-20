import type { Announcements, DragEndEvent } from '@dnd-kit/core'
import { computeDropPosition } from './position'
import { STATUS_COLUMNS, type Status, type Todo } from './types'

export type DragMove = { id: string; status: Status; position: number }
export type DragEndResult = { moves: DragMove[] }

const COLUMN_PREFIX = 'column:'
const POSITION_STEP = 1000

function resolveDestination(
  overId: string,
  todos: Todo[],
): { status: Status; overCardId: string | null } | null {
  if (overId.startsWith(COLUMN_PREFIX)) {
    const status = overId.slice(COLUMN_PREFIX.length) as Status
    return { status, overCardId: null }
  }
  const target = todos.find((t) => t.id === overId)
  if (!target) return null
  return { status: target.status, overCardId: target.id }
}

function sortedColumn(todos: Todo[], status: Status): Todo[] {
  return todos.filter((t) => t.status === status).sort((a, b) => a.position - b.position)
}

export function handleDragEnd(event: DragEndEvent, todos: Todo[]): DragEndResult | null {
  const { active, over } = event
  if (!over) return null

  const activeId = String(active.id)
  const overId = String(over.id)
  const activeTodo = todos.find((t) => t.id === activeId)
  if (!activeTodo) return null

  const dest = resolveDestination(overId, todos)
  if (!dest) return null

  const sameColumn = activeTodo.status === dest.status
  const droppedOnSelf = dest.overCardId === activeId
  if (sameColumn && droppedOnSelf) return null

  const { position, needsRenumber } = computeDropPosition(todos, dest.status, dest.overCardId)

  if (!needsRenumber) {
    if (sameColumn && activeTodo.position === position) return null
    return { moves: [{ id: activeId, status: dest.status, position }] }
  }

  const destColumn = sortedColumn(todos, dest.status).filter((t) => t.id !== activeId)
  const insertIndex =
    dest.overCardId === null
      ? destColumn.length
      : Math.max(
          0,
          destColumn.findIndex((t) => t.id === dest.overCardId),
        )
  const finalOrder: Todo[] = [
    ...destColumn.slice(0, insertIndex),
    activeTodo,
    ...destColumn.slice(insertIndex),
  ]

  const moves: DragMove[] = finalOrder.map((t, i) => ({
    id: t.id,
    status: dest.status,
    position: (i + 1) * POSITION_STEP,
  }))

  return { moves }
}

function columnLabel(status: Status): string {
  return STATUS_COLUMNS.find((c) => c.value === status)?.label ?? status
}

function announceTarget(
  overId: string | null,
  todos: Todo[],
  activeId: string,
): { label: string; index: number; size: number } | null {
  if (overId === null) return null
  let destStatus: Status | null = null
  let overCardId: string | null = null
  if (overId.startsWith(COLUMN_PREFIX)) {
    destStatus = overId.slice(COLUMN_PREFIX.length) as Status
  } else {
    const target = todos.find((t) => t.id === overId)
    if (!target) return null
    destStatus = target.status
    overCardId = target.id
  }

  const columnAfter = sortedColumn(todos, destStatus).filter((t) => t.id !== activeId)
  const insertIndex =
    overCardId === null
      ? columnAfter.length
      : Math.max(
          0,
          columnAfter.findIndex((t) => t.id === overCardId),
        )
  return {
    label: columnLabel(destStatus),
    index: insertIndex + 1,
    size: columnAfter.length + 1,
  }
}

export function makeAnnouncements(todos: Todo[]): Announcements {
  const titleFor = (id: string) => todos.find((t) => t.id === id)?.title ?? 'task'
  return {
    onDragStart({ active }) {
      return `Picked up task "${titleFor(String(active.id))}".`
    },
    onDragOver({ active, over }) {
      const activeId = String(active.id)
      const title = titleFor(activeId)
      if (!over) return `Task "${title}" is no longer over a droppable area.`
      const info = announceTarget(String(over.id), todos, activeId)
      if (!info) return `Task "${title}" is no longer over a droppable area.`
      return `Task "${title}" is over ${info.label}, position ${info.index} of ${info.size}.`
    },
    onDragEnd({ active, over }) {
      const activeId = String(active.id)
      const title = titleFor(activeId)
      if (!over) return `Task "${title}" dropped outside any column. Drag cancelled.`
      const info = announceTarget(String(over.id), todos, activeId)
      if (!info) return `Task "${title}" dropped outside any column. Drag cancelled.`
      return `Task "${title}" dropped in ${info.label} at position ${info.index} of ${info.size}.`
    },
    onDragCancel({ active }) {
      return `Drag cancelled. Task "${titleFor(String(active.id))}" returned to its original position.`
    },
  }
}
