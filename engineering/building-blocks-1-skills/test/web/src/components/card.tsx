import type { ReactNode } from 'react'
import clsx from 'clsx'

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <section className={clsx('bg-bg-card rounded-lg p-20 flex flex-col gap-16', className)}>
      {children}
    </section>
  )
}

type HeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}

Card.Header = function CardHeader({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="flex items-start justify-between gap-16">
      <div className="flex flex-col gap-2">
        <h2 className="text-[20px] leading-none font-semibold font-display text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

Card.Content = function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('flex flex-col gap-12', className)}>{children}</div>
}

Card.Actions = function CardActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-8">{children}</div>
}
