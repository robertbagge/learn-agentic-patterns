# UI Structure & View Routing

## TL;DR

- **No router of any kind.** `App.tsx` unconditionally renders a single `TodosPage`; there are no route libraries, hash routes, or URL-driven state anywhere in `web/`.
- **Single page with one narrow column.** `TodosPage` (`web/src/features/todos/components/todos-page.tsx:11`) is capped at `max-w-[720px]` and stacks `header` + `TodoCreateForm` + `TodoList` vertically. There are no navigation primitives (no tabs, toggles, or menus) that currently host a view switcher.
- **Tailwind v4 only, zero responsive breakpoints used.** All styling is utility classes via `@tailwindcss/vite` with tokens defined in `web/src/index.css`. No `sm:`/`md:`/`lg:` prefixes appear anywhere in `src/`, so multi-column layouts would introduce the first responsive rules in the codebase.

## Entry and top-level tree

Entry is `web/index.html:11` loading `web/src/main.tsx:6`, which mounts `<App />` into `#root` under `<StrictMode>`. `App` (`web/src/App.tsx:4-10`) wires exactly two nodes:

```
<ToastProvider>         // web/src/components/toast.tsx:26
  <TodosPage />         // web/src/features/todos/components/todos-page.tsx:6
</ToastProvider>
```

`ToastProvider` is the only global context provider. There is no layout/chrome component between `App` and the page — `TodosPage` owns its own `<main>`, header, and padding.

## Component tree (rough sketch)

```
App
└── ToastProvider (context + fixed toast stack)
    └── TodosPage                         (features/todos/components/todos-page.tsx)
        ├── useTodos()                    (features/todos/hooks/use-todos.ts:17)
        ├── <header>  "Todos" + count
        ├── TodoCreateForm                (forwardRef for focus)
        │   └── Card { Header, Input, Select, Actions > Button }
        └── TodoList
            └── Card
                ├── Card.Header  "Your tasks" + "N of M complete"
                └── Card.Content
                    ├── Skeleton*3        (status=loading)
                    ├── ErrorState        (status=error)
                    ├── EmptyState        (success + empty)
                    └── <ul> TodoItem*    (success + items)
                          └── Checkbox / inline edit / Select / Button
                └── ConfirmDeleteDialog   (<dialog> element, modal)
```

## Routing approach

None. A grep for `router|Route|navigate|useNavigate|Link|hash|#/|history` across `web/src/` returns zero matches. `package.json` (`web/package.json:12-19`) has no router dependency — only `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`. Vite config (`web/vite.config.ts`) is the default React + Tailwind setup with no SPA-specific fallback rules.

## Current list-view composition

The split is shallow-presentational-over-one-container:

- **Container:** `TodosPage` calls `useTodos()` and owns a `createInputRef` used to focus the add-form from the empty state (`todos-page.tsx:8, 28`). It passes handlers (`create`, `update`, `remove`, `refetch`) down as props.
- **Presentational-ish children:** `TodoCreateForm` and `TodoList` receive callbacks but also hold local UI state (`submitting`, `pendingDelete`, `busyIds`, edit drafts). `TodoList` additionally owns the delete-confirmation dialog and wraps mutation calls in `withBusy` (`todo-list.tsx:28-42`).
- **Shared chrome:** The only "layout" is the `<main>` in `TodosPage`. The generic `Card` (`web/src/components/card.tsx`) is the section shell used by both the create form and the list.

A second view that shares `useTodos` / `ToastProvider` would naturally slot **inside `TodosPage`** (replacing or flanking `<TodoList>`) or **one level up in `App`** (alongside/replacing `<TodosPage>`) — both are viable insertion points from a pure-structure standpoint.

## Navigation primitives

There are none. No `nav`, no tab component, no segmented control, no menu, no header links. The only interactive chrome elements are `Button` (`web/src/components/button.tsx`, CVA-based with `primary|secondary|ghost|destructive` intents) and `Select`. Any view switcher would be new UI; the design tokens (`--color-accent-primary`, `--radius-pill`, etc. in `index.css:3-67`) are available but no pattern exists to copy.

## Styling approach

- **Tailwind CSS v4** via `@tailwindcss/vite` (`vite.config.ts:3`, `package.json:13`). Theme tokens are declared in CSS `@theme { ... }` inside `web/src/index.css:3-67` — colours, spacing (2–48px scale), radius, and fonts.
- **No CSS modules, no styled-components, no CSS-in-JS.** All styles are utility classes, often composed with `clsx` and occasionally CVA (`button.tsx:4-22`).
- **Layout constraints that matter for a multi-column view:**
  - `TodosPage` hardcodes `max-w-[720px]` and `px-24 py-48` (`todos-page.tsx:11`). A three-column Kanban would want a wider cap (or full-width).
  - The design system is dark-only (`--color-bg-primary: #0C0C0C`); no light-mode variants to keep in sync.
  - `docs/design/spacing-and-layout.md:32-37` mandates flexbox over absolute positioning and `fill_container` for responsive sizing — relevant for drag-and-drop columns.

## Responsive behavior

Effectively none. The codebase uses **zero** Tailwind responsive prefixes — a grep for `sm:|md:|lg:|xl:` finds matches only inside token names (`rounded-lg`, `text-sm`, `size: sm`) and arbitrary-value classes (`min-w-[240px]`, `max-w-[400px]`), never as breakpoint modifiers. On narrow widths the page just shrinks within its 720px cap; there is no stacking, collapse, or mobile-specific treatment to preserve. A Kanban view would be defining the responsive story from scratch.

## Relevant files

- `web/src/App.tsx`
- `web/src/main.tsx`
- `web/src/index.css`
- `web/src/features/todos/components/todos-page.tsx`
- `web/src/features/todos/components/todo-list.tsx`
- `web/src/features/todos/components/todo-create-form.tsx`
- `web/src/features/todos/components/todo-item.tsx`
- `web/src/features/todos/hooks/use-todos.ts`
- `web/src/components/{card,button,toast,select,input,empty-state,error-state,skeleton,checkbox}.tsx`
- `web/package.json`, `web/vite.config.ts`
- `docs/design/spacing-and-layout.md`
