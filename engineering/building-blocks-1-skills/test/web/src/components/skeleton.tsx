import clsx from 'clsx'

type Props = {
  className?: string
}

export function Skeleton({ className }: Props) {
  return <div className={clsx('bg-bg-elevated rounded-sm animate-pulse', className)} />
}
