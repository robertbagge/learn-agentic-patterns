import type { ReactNode } from 'react'

type Props = {
  title: string
  message?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, message, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-12 py-32 text-center">
      {icon ?? <DefaultIcon />}
      <div className="flex flex-col gap-4">
        <p className="font-display text-[16px] font-bold text-text-primary">{title}</p>
        {message && <p className="text-sm text-text-secondary">{message}</p>}
      </div>
      {action}
    </div>
  )
}

function DefaultIcon() {
  return (
    <div
      aria-hidden="true"
      className="flex h-48 w-48 items-center justify-center rounded-pill bg-accent-primary-soft text-accent-primary"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </div>
  )
}
