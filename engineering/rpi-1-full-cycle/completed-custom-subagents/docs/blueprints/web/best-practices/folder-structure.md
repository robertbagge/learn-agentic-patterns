# Folder Structure

## Goals

* Easy to navigate for engineers and AI agents
* Explicit dependency direction — nothing reaches upward

## Structure

```
web/src/
├── components/   # Reusable UI building blocks (Button, Input, Card)
├── features/    # Domain modules (todos/, settings/)
├── lib/         # Utilities & thin wrappers (api client, date utils)
└── main.tsx     # App entry: mounts <App />, sets up providers
```

Each feature is a self-contained folder with its own components, hooks,
and types. It exposes its public API through an `index.ts` barrel.

```
features/todos/
├── components/
│   ├── todo-list.tsx
│   └── todo-item.tsx
├── hooks/
│   └── use-todos.ts
├── types.ts
└── index.ts     # Public API: export { TodoList, useTodos, type Todo }
```

## Dependency direction

```
main.tsx
   ↓
features/   →  components/
   ↓             ↓
              lib/
```

* `main.tsx` may import from any layer.
* `features/` may import from other features, from `components/`, and from `lib/`.
* `components/` may import from `components/` and from `lib/`. **Not from `features/`** — a shared Button should not know a Todo exists.
* `lib/` imports only from itself.

## Anti-pattern

`components/` reaching into `features/` is the most common violation. If a
"shared" component needs domain knowledge, it isn't shared — move it into
the feature that owns the domain.
