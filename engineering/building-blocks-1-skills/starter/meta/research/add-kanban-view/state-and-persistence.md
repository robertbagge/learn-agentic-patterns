# Topic A — Current State Management and Persistence

## TL;DR

- **Server-owned state, no client store.** The only source of truth is a JSON file on the API (`api/todos.json`), served via FastAPI. The web app holds a transient copy in a single `useState` inside `useTodos`; there is no Redux/Zustand/Context/React-Query layer, and no `localStorage`/`IndexedDB` usage.
- **Write-through + full refetch per mutation.** Every create/update/delete calls the API, then `refetch()`s the full list. There is no optimistic update, no debouncing, no unload flush — each user action is one HTTP round-trip followed by a `GET /api/todos/`.
- **No ordering concept, no reorder mutation.** The server sorts by `(priority desc, created_at asc)` on every read (`api/todos/service.py:21-25`); there is no `position`/`status`/`column` field on the todo and no endpoint that accepts an ordering payload. A Kanban view will rub against this sort-on-read and the absence of any write path for order.

## Where state lives

- **Backend (authoritative):** a flat JSON array on disk at `api/todos.json`, loaded/saved by `JsonFileStorage` (`api/core/storage.py:11-23`). The storage dependency is cached per-process with `@lru_cache` (`api/todos/dependencies.py:14-16`), but the cached object is just the `JsonFileStorage` instance — every call still reads the file from disk (`api/core/storage.py:15-19`). There is no in-memory cache of todos and no DB.
- **Frontend:** one `useState<Todo[]>` list plus `status` and `error` flags, all inside the `useTodos` hook (`web/src/features/todos/hooks/use-todos.ts:17-20`). `TodosPage` instantiates the hook once (`web/src/features/todos/components/todos-page.tsx:7`) and passes the array + mutators down by prop. No Context, no global store, no caching layer.
- **Local component state (ephemeral):** `TodoList` tracks `pendingDelete`, `deleting`, and a `busyIds: Set<string>` for per-row in-flight indicators (`web/src/features/todos/components/todo-list.tsx:24-26`). `TodoItem` holds its own inline-edit `draft`/`editing` state (`web/src/features/todos/components/todo-item.tsx:31-33`). `TodoCreateForm` has its own `title`/`priority`/`submitting` (`web/src/features/todos/components/todo-create-form.tsx:17-19`). None of this persists.

## How mutations happen

- **Add:** `create()` in the hook POSTs and then awaits `refetch()` (`web/src/features/todos/hooks/use-todos.ts:39-46`); server assigns `id`, `created_at`, `updated_at`, and defaults `completed: false` (`api/todos/service.py:27-40`).
- **Toggle / rename / priority change:** all funnel through a single `update()` that PATCHes and refetches (`web/src/features/todos/hooks/use-todos.ts:48-55`). `TodoList.handleToggle`/`handleRename`/`handlePriority` wrap the call with `withBusy` for per-row disabling and toast feedback (`web/src/features/todos/components/todo-list.tsx:44-60`). The backend `update` applies `model_dump(exclude_unset=True)` so partial patches work (`api/todos/service.py:42-51`).
- **Delete:** two-step — `TodoList` stages a `pendingDelete`, the dialog confirms, then `onRemove` calls DELETE + refetch (`web/src/features/todos/components/todo-list.tsx:62-74`, `web/src/features/todos/hooks/use-todos.ts:57-63`).
- **Reorder:** not implemented anywhere. No drag handlers, no `position` field on `Todo` (`web/src/features/todos/types.ts:3-10`), no API route for moving (`api/todos/router.py`). Server order is recomputed on every list read.

## Persistence — read and write paths

- **Read path on app start:** `App` renders `TodosPage` → `useTodos` mounts → `useEffect(() => void refetch(), [refetch])` fires once (`web/src/features/todos/hooks/use-todos.ts:35-37`) → `GET /api/todos/` → router maps through `service.list()` which calls `storage.load()` and returns the sorted array (`api/todos/router.py:10-12`, `api/todos/service.py:20-25`, `api/core/storage.py:15-19`).
- **Write path:** every mutation is immediate and synchronous from the service's perspective — the service mutates the list in memory and calls `storage.save()` which rewrites the whole file with `json.dump(..., indent=2)` (`api/core/storage.py:21-23`, `api/todos/service.py:37-58`). There is no batching, no debounce, no queue, no `beforeunload` handler. Each click = one file rewrite.
- **After-write refresh:** the hook always awaits `refetch()` after a successful mutation (`web/src/features/todos/hooks/use-todos.ts:42, 52, 60`), meaning every action costs two round-trips and a full list re-render. No optimistic UI.

## Existing abstractions a Kanban view would touch

- **`useTodos` hook** is the one shared state seam. Its shape — `{ todos, status, error, refetch, create, update, remove }` (`web/src/features/todos/hooks/use-todos.ts:7-15`) — is consumable by a Kanban view as-is: grouping by a client-derived column key over `todos` is trivial. What it does *not* expose is reorder, bulk update, or cached snapshots for optimistic moves.
- **`todosApi`** is a thin CRUD wrapper (`web/src/features/todos/api.ts:4-9`); adding a reorder/move endpoint means extending both this file and `api/todos/router.py` + `service.py`.
- **`withBusy` / `busyIds`** (`web/src/features/todos/components/todo-list.tsx:28-42`) gives per-row disable-while-mutating; a drag would need similar or optimistic equivalents.
- **`TodoResponse`/`Todo` types** are the shared contract (`api/todos/schemas.py:43-49`, `web/src/features/todos/types.ts:3-10`) — no `status`/`column`/`position` fields today.

## Friction points for a Kanban mode (observational, not prescriptive)

- **Server-enforced sort on every read** (`api/todos/service.py:21-25`) overrides any client-side ordering after the next `refetch()`. The current refetch-after-every-mutation policy (`web/src/features/todos/hooks/use-todos.ts:42, 52, 60`) means even a successful optimistic drop would snap back unless the server learns about column/position.
- **No ordering field** in `Todo` (`web/src/features/todos/types.ts:3-10`) nor in the on-disk rows (`api/todos.json`) — Kanban column membership and intra-column rank have nowhere to live today.
- **Full-list rewrite on every save** (`api/core/storage.py:21-23`) is fine for single-row edits but means a multi-row reorder still serializes the whole file; also, two concurrent PATCHes race (read-modify-write with no locking in `service.update`, `api/todos/service.py:42-51`).
- **No optimistic UI or cache** — every drag would visibly pause for two round-trips under the current pattern. There is no existing query/mutation library to hook into.
- **`toggle completed`** is the only existing signal that loosely resembles a column transition (`web/src/features/todos/components/todo-list.tsx:44-48`); a Kanban "Done" column would overlap semantically with `completed: true`, but that overlap is outside this topic's scope.
