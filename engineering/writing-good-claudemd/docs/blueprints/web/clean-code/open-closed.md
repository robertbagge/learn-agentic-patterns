# Open-Closed Principle (OCP) in React

## Overview

The Open-Closed Principle states that components should be open for extension
but closed for modification. In React, this means using composition, children
props, and render props to allow components to be extended with new behavior
without changing their source code.

## Core Concept

In React, OCP means:

* Use composition over modification
* Leverage children and render props for flexibility
* Create plugin-like systems with component maps
* Design components to accept new variants without editing
* Use discriminated unions for extensible behavior

## Implementation Example

### Scaffolding for Examples

```typescript
// types.ts
interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
}

interface IconProps {
  size?: number
  color?: string
}
```

### BAD — Switch Statement Modification (OCP violation)

> Adding new notification types requires modifying the component.

```typescript
function NotificationItem({ notification }: { notification: Notification }) {
  // VIOLATION: Must edit this switch for every new type
  const getIcon = () => {
    switch (notification.type) {
      case 'info':
        return <InfoIcon />
      case 'warning':
        return <WarningIcon />
      case 'error':
        return <ErrorIcon />
      case 'success':
        return <CheckIcon />
      default:
        return null
    }
  }

  // VIOLATION: Must edit this switch for every new style
  const getVariant = () => {
    switch (notification.type) {
      case 'info':
        return 'info'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      case 'success':
        return 'success'
      default:
        return 'default'
    }
  }

  // VIOLATION: Must edit component to add new behaviors
  const handlePress = () => {
    switch (notification.type) {
      case 'error':
        console.error('Error clicked:', notification.message)
        break
      case 'warning':
        console.warn('Warning clicked:', notification.message)
        break
      default:
        console.log('Notification clicked:', notification.message)
    }
  }

  return (
    <div className="flex gap-3 p-3" onClick={handlePress}>
      <div>{getIcon()}</div>
      <div className="flex-1">
        <h4>{notification.title}</h4>
        <p>{notification.message}</p>
      </div>
    </div>
  )
}

// VIOLATION: Adding a new type requires editing the component
// What if we want to add 'debug', 'critical', or custom types?
```

### GOOD — Composition-Based Extension (OCP compliant)

> New notification types can be added without modifying existing components.

```typescript
type Logger = {
  info: (msg: string, meta?: unknown) => void
  warn: (msg: string, meta?: unknown) => void
  error: (msg: string, meta?: unknown) => void
}

type Renderer = {
  icon: React.ComponentType<IconProps>
  variant: string
  onClick?: (n: Notification) => void
}

// Small factory so behaviors depend on injected logger, not console.*
function buildDefaultRenderers(logger: Logger): Record<string, Renderer> {
  return {
    info:    { icon: InfoIcon,    variant: 'info',
      onClick: (n) => logger.info(n.message, n) },
    warning: { icon: WarningIcon, variant: 'warning',
      onClick: (n) => logger.warn(n.message, n) },
    error:   { icon: ErrorIcon,   variant: 'error',
      onClick: (n) => logger.error(n.message, n) },
    success: { icon: CheckIcon,   variant: 'success' },
  }
}

function NotificationItem({ n, r }: { n: Notification; r: Renderer }) {
  const Icon = r.icon
  return (
    <div className="flex gap-3 p-3" onClick={() => r.onClick?.(n)}>
      <div><Icon size={20} /></div>
      <div className="flex-1">
        <h4>{n.title}</h4>
        <p>{n.message}</p>
      </div>
    </div>
  )
}

function NotificationList({
  notifications,
  renderers,
  logger,
}: {
  notifications: Notification[]
  renderers?: Partial<Record<string, Renderer>>
  logger: Logger
}) {
  const base = React.useMemo(() => buildDefaultRenderers(logger), [logger])
  const rmap = { ...base, ...renderers }
  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => {
        const r = rmap[n.type] || rmap.info
        return r ? <NotificationItem key={n.id} n={n} r={r} /> : null
      })}
    </div>
  )
}

// Extension without modifying components
const renderersOverride = (logger: Logger):
  Partial<Record<string, Renderer>> => ({
  critical: {
    icon: AlertIcon,
    variant: 'critical',
    onClick: (n) => {
      alertService.send(n); logger.error(`CRITICAL: ${n.message}`, n)
    },
  },
  debug: {
    icon: BugIcon,
    variant: 'debug',
    onClick: (n) => logger.info('Debug clicked', n),
  },
})

// Usage
<NotificationList
  notifications={items}
  logger={logger}
  renderers={renderersOverride(logger)}
/>
```

## When to Apply OCP in React

### Apply OCP for

* Components that will gain new visual/behavioral variants (buttons, alerts, cards)
* Lists/grids that render heterogeneous item types
* Form builders with dynamic field types/renderers
* Notification/toast systems, command palettes, dashboards
* Theming/branding points where projects override visuals/behavior

### Relaxed Requirements for

* One-off internal components with fixed behavior
* Prototypes/MVPs where change risk is low
* Components with only a 1-2 stable variants
* Hot paths where extra indirection would hurt performance

## Anti-patterns to Avoid

1. **Giant switch statements** that must be edited for every new type
2. **Boolean prop explosion** (`primary`, `warning`, `ghost`, `outline`, …)
   instead of a single `variant`
3. **Inheritance chains**; prefer composition and small extension
   points
4. **Hidden singletons** (logger/router/theme imported directly) making
   extension require source edits
5. **Variant-specific props on the base component** (base shouldn’t know “criticalOnly”)
6. **Blind prop spreading** that masks incompatible contracts between variants
7. **No graceful fallback** for unknown types (should degrade to a default renderer)
8. Variant behavior must not change base prop semantics (LSP).
Keep callback signatures and controlled props consistent across variants

## React-Specific OCP Techniques

1. **Children/slots** for content extension (`header`, `footer`, `actions`)
2. **Render props/callbacks** to inject behavior (`renderItem`,
   `renderEmpty`)
3. **Component maps** (or a small registry) to plug in type→renderer without
   edits
4. **Dependency injection** via props/context (e.g., `logger`, `theme`)
   instead of deep imports
5. **Discriminated unions** for variant configs (`{ kind: 'warning', … }`)
6. **Lazy-load per variant** to keep bundles lean (e.g., icons/components)
7. **Memoize extension points** (`useMemo` for maps) to avoid re-renders
8. **Keep LSP intact**: all variants honor the same base prop
   names/semantics; no hidden side effects

## Key Takeaways

* Start simple; adopt OCP when you hit the “rule of three” or expect plugins/overrides
* Prefer composition (children/slots, render props) over editing components
* Expose small, explicit extension points (single `variant` prop, renderer maps)
* Preserve LSP: keep prop names/semantics consistent; no hidden side effects
* Inject cross-cutting deps via props/context (e.g., `logger`), not deep imports
* Provide a safe default/fallback for unknown variants
* Memoize extension maps and lazy-load heavy variant code for performance
* Document the extension surface and test all variants against a shared contract

## Related Best Practices

For component composition and patterns, see
[best-practices.md](../best-practices/index.md)
