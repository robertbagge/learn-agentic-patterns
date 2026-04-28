import type { Announcements, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { POSITION_STEP } from './position'
import { STATUS_COLUMNS, type Status, type Todo } from './types'

export type DragMove = { id: string; status: Status; position: number }
export type DragEndResult = { moves: DragMove[] }

const COLUMN_PREFIX = 'column:'
const STATUS_VALUES = new Set<string>(STATUS_COLUMNS.map((c) => c.value))

function parseStatus(candidate: string): Status | null {
  return STATUS_VALUES.has(candidate) ? (candidate as Status) : null
}

type Destination = { status: Status; overCardId: string | null }

function resolveDestination(overId: string, todos: Todo[]): Destination | null {
  if (overId.startsWith(COLUMN_PREFIX)) {
    const status = parseStatus(overId.slice(COLUMN_PREFIX.length))
    return status ? { status, overCardId: null } : null
  }
  const target = todos.find((t) => t.id === overId)
  return target ? { status: target.status, overCardId: target.id } : null
}

function sortedColumn(todos: Todo[], status: Status): Todo[] {
  return todos.filter((t) => t.status === status).sort((a, b) => a.position - b.position)
}

function computeFinalColumn(
  destColumn: Todo[],
  activeTodo: Todo,
  dest: Destination,
): { finalColumn: Todo[]; newIndex: number } {
  const oldIndex = destColumn.findIndex((t) => t.id === activeTodo.id)
  const overIndex =
    dest.overCardId === null
      ? destColumn.length
      : destColumn.findIndex((t) => t.id === dest.overCardId)

  if (oldIndex !== -1) {
    // Same-column: use dnd-kit sortable arrayMove semantics.
    const finalColumn = arrayMove(destColumn, oldIndex, overIndex)
    return { finalColumn, newIndex: finalColumn.findIndex((t) => t.id === activeTodo.id) }
  }

  // Cross-column: insert active at overIndex (or bottom if dropped on the column body).
  const target = overIndex < 0 ? destColumn.length : overIndex
  const finalColumn = [
    ...destColumn.slice(0, target),
    { ...activeTodo, status: dest.status },
    ...destColumn.slice(target),
  ]
  return { finalColumn, newIndex: target }
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
  if (sameColumn && dest.overCardId === activeId) return null

  const destColumn = sortedColumn(todos, dest.status)
  const { finalColumn, newIndex } = computeFinalColumn(destColumn, activeTodo, dest)

  const prev = newIndex === 0 ? 0 : finalColumn[newIndex - 1].position
  const nextItem = finalColumn[newIndex + 1]

  const needsRenumber = nextItem !== undefined && nextItem.position - prev <= 1
  const position = nextItem === undefined ? prev + POSITION_STEP : Math.floor((prev + nextItem.position) / 2)

  if (!needsRenumber) {
    if (sameColumn && activeTodo.position === position) return null
    return { moves: [{ id: activeId, status: dest.status, position }] }
  }

  // Renumber destination column — emit moves only for rows whose status or position actually changes.
  const moves: DragMove[] = []
  for (let i = 0; i < finalColumn.length; i++) {
    const todo = finalColumn[i]
    const newPosition = (i + 1) * POSITION_STEP
    const current = todos.find((t) => t.id === todo.id)
    if (!current || current.position !== newPosition || current.status !== dest.status) {
      moves.push({ id: todo.id, status: dest.status, position: newPosition })
    }
  }
  return moves.length > 0 ? { moves } : null
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
  const activeTodo = todos.find((t) => t.id === activeId)
  if (!activeTodo) return null

  const dest = resolveDestination(overId, todos)
  if (!dest) return null

  const destColumn = sortedColumn(todos, dest.status)
  const { newIndex, finalColumn } = computeFinalColumn(destColumn, activeTodo, dest)
  return {
    label: columnLabel(dest.status),
    index: newIndex + 1,
    size: finalColumn.length,
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
