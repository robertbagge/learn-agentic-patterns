import type { Status, Todo } from './types'

export const POSITION_STEP = 1000

export function appendPosition(todos: Todo[], destStatus: Status): number {
  let maxPos = 0
  for (const t of todos) {
    if (t.status === destStatus && t.position > maxPos) maxPos = t.position
  }
  return maxPos + POSITION_STEP
}
