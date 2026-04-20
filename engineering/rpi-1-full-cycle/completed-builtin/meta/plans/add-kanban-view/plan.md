# Plan: Add Kanban mode to the todo app

## Context

The todo app today has one view (a flat list) with a boolean `completed` field. The user wants a Kanban mode — three columns (Todo / Doing / Done), drag cards between columns to change status, drag within a column to reorder, list view still available via a toggle, persisted the same way as the list view (JSON file via API).

Three confirmed decisions drive the shape of this plan:
1. **Replace** `completed: bool` with `status: "todo" | "doing" | "done"` — no backcompat. A one-time migration in `TodoService` rewrites `api/todos.json` on first load.
2. **List view checkbox** maps `todo ↔ done` (skips `doing`). `doing` is only reachable via Kanban drag.
3. **View-mode toggle** persists in `localStorage["todos.view"]`.

Full prior research lives at `meta/research/add-kanban-view/research.md`; it covers the data-model rationale, DnD library comparison, and tradeoffs. This plan is its execution shape.

---

## API changes

### `api/todos/schemas.py`
- Add `Status = Literal["todo", "doing", "done"]`.
- `TodoCreate`: add `status: Status = "todo"`.
- `TodoUpdate`: **remove** `completed`; add `status: Status | None = None`, `position: int | None = Field(default=None, ge=0)`.
- `TodoResponse`: replace `completed: bool` with `status: Status`; add `position: int`.
- New `ReorderRequest(AppBaseModel)`: `status: Status`, `ordered_ids: list[str]`.

### `api/todos/service.py` — `TodoService`
- Module constant `STATUSES = ("todo", "doing", "done")`.
- `list()`: call `_migrate_if_needed()` first. Return items sorted by `(position asc, created_at asc)` — UI buckets by `status`.
- `create(data)`: `status = data.status`; `position = max_position_in(status) + 1`. Drop `"completed": False`.
- `update(todo_id, data)`: unchanged shape. If the patch changes `status` without `position`, compute `position = max_position_in(new_status) + 1` so the card lands at the bottom of the new column.
- New `reorder(body: ReorderRequest) -> list[dict]`:
  1. Load items. Validate every id in `ordered_ids` exists → else raise `InvalidReorder`.
  2. For each id in order: set `status = body.status`, `position = index`, `updated_at = _now()`.
  3. Save once. Return full list.
- New `_migrate_if_needed(items) -> None`: if any item has key `completed` or is missing `status`/`position`, derive `status = "done" if completed else "todo"`, drop `completed`, assign `position` as index under today's `(-PRIORITY_RANK, created_at)` sort *within each derived column*, then save. Idempotent: no-op on an already-migrated file.

### `api/todos/router.py`
- Keep `GET / POST / PATCH /{id} / DELETE /{id}` unchanged.
- Add `POST /reorder` → `reorder_todos(body: ReorderRequest, service: TodoServiceDep) -> list[TodoResponse]`.

### `api/todos/exceptions.py`
- Add `class InvalidReorder(ValidationError): pass`. `ValidationError` already maps to HTTP 422 via `api/core/exceptions.py` `STATUS_MAP`.

### `api/todos.json`
- Not hand-edited. First `GET` after deploy triggers `_migrate_if_needed` and rewrites the file. Existing three items (all `completed: false`) become `status: "todo"` with `position` 0..2 under `(-priority, created_at)`.

---

## Web changes

### Dependencies
Run once in `web/`: `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.

### `web/src/features/todos/types.ts` (edit)
- `Status = 'todo' | 'doing' | 'done'`.
- `Todo`: replace `completed` with `status: Status`; add `position: number`.
- `TodoCreate`: add `status?: Status`.
- `TodoUpdate`: drop `completed`; add `status?: Status`, `position?: number`.
- Export `STATUS_COLUMNS: { value: Status; label: string }[]` — `[{todo,'Todo'},{doing,'Doing'},{done,'Done'}]`.
- Export `ReorderBody = { status: Status; ordered_ids: string[] }`.

### `web/src/features/todos/api.ts` (edit)
- Add `reorder: (body: ReorderBody) => api.post<Todo[]>('/api/todos/reorder', body)`.

### `web/src/features/todos/hooks/use-todos.ts` (edit)
- Keep public shape; add `reorder(body: ReorderBody): Promise<Todo[]>`.
- `reorder` calls `todosApi.reorder`, then `setTodos(result)` directly — **do not** call `refetch()`. A `refetch` would flip `status` to `'loading'` and unmount the board mid-drag.
- Accept an optional `optimisticNext?: Todo[]` so callers can write locally *before* the await.
- On failure: call `refetch()` unconditionally to resync, then rethrow so the caller can toast.

### `web/src/features/todos/hooks/use-kanban.ts` (new)
- `useKanban(todos, reorder) => { columns, moveCard }`.
- `columns: Record<Status, Todo[]>` — derived via `useMemo`, bucketed by `status`, each bucket sorted by `(position, created_at)`.
- `moveCard(id, toStatus, toIndex)`:
  1. Snapshot current todos.
  2. Compute next `columns` after the move; derive destination `ordered_ids`, plus source `ordered_ids` if cross-column.
  3. Call `reorder({ status: destStatus, ordered_ids: destOrderedIds }, optimisticNext)`.
  4. If cross-column, chain a second `reorder` for the source column.
  5. On any error: `toast.error("Couldn't move card")`. (Rollback is handled by `useTodos.reorder`'s refetch-on-failure.)

### `web/src/features/todos/hooks/use-view-mode.ts` (new)
- Returns `[mode, setMode]`. Reads `localStorage['todos.view']` on init; writes on change. Fallback `'list'` on missing/invalid value.

### `web/src/features/todos/components/view-mode-toggle.tsx` (new)
- Props `{ value: 'list' | 'kanban'; onChange }`. Segmented control built from existing `Button` primitive.

### `web/src/features/todos/components/kanban-board.tsx` (new)
- Props: `{ todos, status, error, onReorder, onUpdate, onRemove, onRetry }` — mirrors `TodoList`'s handler shape.
- Owns the `DndContext` and one `SortableContext` per column. Uses `useKanban(todos, onReorder).moveCard` from `handleDragEnd`.
- `DndContext` config:
  - Sensors: `useSensor(PointerSensor, { activationConstraint: { distance: 6 } })` + `useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })`.
  - Collision: `closestCorners`.
  - `DragOverlay` renders a cloned `<KanbanCard todo={active} dragging />` while `activeId` is set, else `null`.
- `handleDragEnd(event)`: resolve `overStatus` — if `over.id` is a status string (empty column via `useDroppable`), use it; otherwise look up the todo's status in the current `columns`. Compute `toIndex` from the destination column's current ordering. Call `moveCard`.
- State coverage: loading → three skeleton columns; error → single top-level `ErrorState` with `onRetry`; empty → per-column "No tasks" text (page-level `EmptyState` with CTA already sits above via `TodoCreateForm`).

### `web/src/features/todos/components/kanban-column.tsx` (new)
- Props: `{ status, label, todos, onUpdate, onRemove }`.
- Header: `label` + count badge.
- `useDroppable({ id: status })` on the column body so empty columns accept drops.
- `SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}` wraps the cards.

### `web/src/features/todos/components/kanban-card.tsx` (new)
- Props: `{ todo, onUpdate, onRemove, dragging? }`.
- Slim `TodoItem`: click-to-edit title (reuse pattern from `todo-item.tsx`), priority select/badge, delete button. **No checkbox** — the column is the status.
- `useSortable({ id: todo.id })`. `dragging` (used only in the `DragOverlay` clone) adds `shadow-lg` + `ring`.

### `web/src/features/todos/components/todos-page.tsx` (edit)
- Add `const [mode, setMode] = useViewMode()`.
- Render `<ViewModeToggle value={mode} onChange={setMode} />` in the header next to the task count.
- Render `<TodoList …>` or `<KanbanBoard …>` based on `mode`. Same `useTodos()` instance — switching views does **not** refetch.

### `web/src/features/todos/components/todo-item.tsx` (edit — list view adaptation)
- Replace `todo.completed` reads with `todo.status === 'done'`.
- Checkbox: `checked={todo.status === 'done'}`; `onToggle` → `onUpdate(id, { status: todo.status === 'done' ? 'todo' : 'done' })`. `doing` is unreachable from list view by design.
- Strikethrough + `aria-label` updated to match.

### `web/src/features/todos/components/todo-list.tsx` (edit)
- No structural change. Passes the updated `onToggle` through.

---

## Rollout order (each independently shippable)

1. **API**: schemas → service (`reorder` + migration) → router → smoke-test via `curl`.
2. **Web types + api client + `useTodos.reorder`** + rewire `todo-item.tsx` to `status`. List view works on the new shape.
3. **Kanban components + `use-kanban`**, mounted behind a `mode === 'kanban'` branch (not yet reachable).
4. **View-mode toggle + `use-view-mode`** in `todos-page.tsx` — Kanban becomes user-reachable and persists.
5. **Polish**: drag-overlay styling (`Card` + `bg-bg-elevated` + `border-border-accent`), column count badges, per-column empty placeholders, skeleton columns.

---

## Verification

Run both dev servers: `mise run dev` (from `completed-builtin/`). Port is `9006` for the API (per `mise.toml`).

Manual script:
1. `curl http://localhost:9006/api/todos/` — items return with `status` and `position`; `completed` is gone. Inspect `api/todos.json` — migration persisted.
2. List view (default). Check a `todo` item → strikethrough, `status: "done"`. Uncheck → back to `todo`.
3. Create a new item → appears at bottom of its status column on the server; list order reflects `position`.
4. Toggle to Kanban via the header control → three columns, items bucketed. Reload → still on Kanban (localStorage).
5. Drag a card from Todo to Doing → drops cleanly, no snap-back; column counts update. Reload → persisted.
6. Drag within Done to reorder → persists.
7. Keyboard DnD: Tab to card → Space → Arrow keys → Space to drop.
8. Stop the API mid-drag → drop fails → error toast + board resyncs via refetch.
9. `curl -X POST :9006/api/todos/reorder -H 'content-type: application/json' -d '{"status":"todo","ordered_ids":["bogus"]}'` → 422 `InvalidReorder`.

Run `mise run check` at the end — byte-compiles the API and runs the web TS build.

Blueprint docs to consult during implementation:
- `docs/blueprints/web/best-practices/component-structure.md` — hook owns fetching, component owns rendering.
- `docs/blueprints/web/best-practices/state-management.md` — optimistic update + rollback shape.
- `docs/blueprints/web/best-practices/error-handling.md` — toast on rollback, `ErrorState` at board level.

---

## Critical files

- `api/todos/schemas.py`
- `api/todos/service.py`
- `api/todos/router.py`
- `api/todos/exceptions.py`
- `web/src/features/todos/types.ts`
- `web/src/features/todos/api.ts`
- `web/src/features/todos/hooks/use-todos.ts`
- `web/src/features/todos/hooks/use-kanban.ts` *(new)*
- `web/src/features/todos/hooks/use-view-mode.ts` *(new)*
- `web/src/features/todos/components/kanban-board.tsx` *(new)*
- `web/src/features/todos/components/kanban-column.tsx` *(new)*
- `web/src/features/todos/components/kanban-card.tsx` *(new)*
- `web/src/features/todos/components/view-mode-toggle.tsx` *(new)*
- `web/src/features/todos/components/todos-page.tsx`
- `web/src/features/todos/components/todo-item.tsx`

---

## Tricky bits

- **`DragOverlay` vs refetch.** `useTodos.reorder` must `setTodos` from the endpoint response, never call `refetch()` on the happy path — a loading flip would unmount the board mid-gesture.
- **Two-call cross-column moves.** If the source-column call fails after the destination one succeeded, state is partially consistent. Recovery: `refetch` on any reorder failure, then toast. The server tolerates position gaps since every reorder rewrites the column.
- **Migration idempotency.** `_migrate_if_needed` must guard with `if "completed" in item or "status" not in item` and only save when something changed — otherwise every `list()` rewrites the file.
- **Activation constraint.** Without `{ distance: 6 }` on `PointerSensor`, clicking the card title to edit would start a drag.
- **`useDroppable` on empty columns.** Without it, a column emptied by the last drag can't receive a new drop.

---

## Out of scope

- WIP limits, realtime/websockets, multi-user sync.
- Assignees, due dates, labels, comments, or any per-card metadata beyond `title`, `priority`, `status`, `position`, `created_at`, `updated_at`.
- Single-call cross-column reorder (using two sequential `/reorder` calls).
- Fractional positioning / lexorank — integer renumbering is fine at N ≤ ~20.
- Tests — project has no test framework; not adding one here.
- `doing` transition from the list view checkbox — deliberately `todo ↔ done` only.
