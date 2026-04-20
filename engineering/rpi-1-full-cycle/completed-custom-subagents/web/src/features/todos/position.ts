import type { Status, Todo } from './types'

export type DropResult = { position: number; needsRenumber: boolean }

const POSITION_STEP = 1000

export function computeDropPosition(
  todos: Todo[],
  destStatus: Status,
  overId: string | null,
): DropResult {
  const column = todos
    .filter((t) => t.status === destStatus)
    .sort((a, b) => a.position - b.position)

  if (overId === null) {
    const last = column[column.length - 1]
    return { position: (last?.position ?? 0) + POSITION_STEP, needsRenumber: false }
  }

  const index = column.findIndex((t) => t.id === overId)
  if (index === -1) {
    const last = column[column.length - 1]
    return { position: (last?.position ?? 0) + POSITION_STEP, needsRenumber: false }
  }

  const prev = index === 0 ? 0 : column[index - 1].position
  const next = column[index].position
  const position = Math.floor((prev + next) / 2)
  return { position, needsRenumber: next - prev <= 1 }
}
