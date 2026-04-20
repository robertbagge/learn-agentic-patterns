import { Button } from './button'

type Props = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: Props) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-12 py-32 text-center">
      <div
        aria-hidden="true"
        className="flex h-48 w-48 items-center justify-center rounded-pill bg-accent-destructive-soft text-accent-destructive"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="flex flex-col gap-4">
        <p className="font-display text-[16px] font-bold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
      {onRetry && (
        <Button intent="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
