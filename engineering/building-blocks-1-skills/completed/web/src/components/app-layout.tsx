import { cva } from 'class-variance-authority'
import { NavLink, Outlet } from 'react-router'

const tab = cva(
  'inline-flex items-center px-16 py-8 text-sm font-medium rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-border-accent focus-visible:outline-offset-2',
  {
    variants: {
      active: {
        true: 'text-accent-primary',
        false: 'text-text-secondary hover:text-text-primary',
      },
    },
    defaultVariants: { active: false },
  },
)

export function AppLayout() {
  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-16 border-b border-border-default px-32 py-24">
        <h1 className="font-display text-[38px] font-bold leading-none tracking-[-1.5px] text-text-primary">
          Todos
        </h1>
        <nav className="flex gap-8" aria-label="Views">
          <NavLink to="/" end className={({ isActive }) => tab({ active: isActive })}>
            List
          </NavLink>
          <NavLink to="/board" className={({ isActive }) => tab({ active: isActive })}>
            Board
          </NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
