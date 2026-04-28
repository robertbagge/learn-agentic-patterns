import type { Priority } from './types'

export const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-accent-destructive-soft text-accent-destructive',
  medium: 'bg-accent-secondary-soft text-accent-secondary',
  low: 'bg-accent-primary-soft text-accent-primary',
}
