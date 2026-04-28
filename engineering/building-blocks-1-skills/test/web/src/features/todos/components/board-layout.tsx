import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export function BoardLayout({ children }: Props) {
  return <div className="grid grid-cols-3 gap-16">{children}</div>
}
