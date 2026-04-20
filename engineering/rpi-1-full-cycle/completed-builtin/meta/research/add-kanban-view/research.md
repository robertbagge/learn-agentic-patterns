# Research — Add a Kanban mode

A Kanban view alongside the existing list: three columns (**Todo / Doing / Done**), drag-and-drop between and within columns, persisted server-side. Single-user, single-device — no realtime, no optimistic-UI gymnastics.

## 1. Current shape (what we work with)

- `api/` — FastAPI, `TodoService` over `JsonFileStorage` (`api/todos.json`). Routes: `GET/POST/PATCH/DELETE /api/todos/…`. Service sorts by `(-priority, created_at)`.
- `web/` — React 19 + Vite + Tailwind v4. Single `TodosPage` → `TodoCreateForm` + `TodoList` (flat list of `TodoItem`). Hook `useTodos` does fetch-after-mutate. No client cache, no DnD lib installed.
- Todo shape: `{ id, title, priority, completed: bool, created_at, updated_at }`.

Two gaps for Kanban: only 2-state (`completed`), no per-item ordering.

## 2. Data model — the key decision

Replace `completed: bool` with `status: "todo" | "doing" | "done"` and add an integer `position` used to sort **within** a column. Rationale:

- A Kanban column **is** the status. Keeping `completed` alongside `status` doubles the state and invites skew (`completed=true, status="doing"` is meaningless). The rules doc explicitly discourages backwards-compat shims in this repo.
- `position: int` ascending inside a column is the simplest reorder model; with a single-user JSON file we can afford to renumber the affected column on each drop (O(N) where N ≤ ~20). No need for fractional indices à la Trello.
- `priority` stays — it is orthogonal (urgency, not workflow state) and already drives a visible badge.

One-time migration inside `TodoService.list()` / load path: if a todo lacks `status`, set `status = "done" if completed else "todo"`; if it lacks `position`, assign the index it has under today's `(-priority, created_at)` sort within its derived column, then persist. `completed` is then dropped from the schema.

Sort order after migration: within each column, `(position asc, created_at asc)` as a tiebreaker. Cross-column sort is not needed — the UI slices by column.

## 3. API changes

### Schemas (`api/todos/schemas.py`)
- `Status = Literal["todo", "doing", "done"]`
- `TodoCreate`: drop `completed` (n/a); add optional `status: Status = "todo"`.
- `TodoUpdate`: drop `completed`; add `status: Status | None`, `position: int | None` (useful for single-item moves but the reorder endpoint below is the primary path).
- `TodoResponse`: replace `completed` with `status`; add `position: int`.

### Routes (`api/todos/router.py`)
- Existing `GET / POST / PATCH / DELETE` keep working; `PATCH` now accepts `status` / `position`.
- **New:** `POST /api/todos/reorder` with body `{ status: Status, ordered_ids: list[str] }`. Atomically:
  1. For each id in `ordered_ids`, set `status` to the given column and `position` to its index.
  2. Validates every id exists and that ids spanning a cross-column move have had their status updated in the same call.
  
  A single reorder call covers both "dropped into a new column" and "reshuffled within a column" — the client always sends the final state of the target column; if it is a cross-column move, it also sends a second reorder call for the source column (or a single call that accepts both columns — see §6 tradeoffs).

### Service (`api/todos/service.py`)
- Add `reorder(status, ordered_ids)` that loads, mutates in-memory, and saves once — keeps the "thin route, service owns logic" pattern the blueprint asks for.
- Add `_migrate(items)` helper called from `list()` on first load.

### Errors
- Reuse `TodoNotFound`. Add `InvalidReorder` (subclass of `ValidationError` in `core/exceptions.py`) for id mismatches / unknown ids in a reorder payload.

## 4. Frontend shape

Keep the list view; add a mode toggle so nothing regresses:

```
TodosPage
 ├─ <ViewModeToggle /> (list | kanban)  — lives in the page header
 ├─ <TodoCreateForm />
 └─ <TodoList /> | <KanbanBoard />
```

### New files under `web/src/features/todos/`
- `components/kanban-board.tsx` — container: consumes `useTodos`, groups by `status`, wires up DnD context, renders three `<KanbanColumn>`s.
- `components/kanban-column.tsx` — header (title + count), droppable region, ordered list of `<KanbanCard>`s.
- `components/kanban-card.tsx` — slimmer `TodoItem`: title (click-to-edit), priority badge, delete icon. No status checkbox (column **is** the status). Status changes happen via drag.
- `hooks/use-kanban.ts` — thin wrapper on top of `useTodos` that exposes `moveCard(id, toStatus, toIndex)` which computes the new `ordered_ids` list(s) and calls `todosApi.reorder(...)`. Keeps `KanbanBoard` presentational (SRP — fetching in a hook, rendering in the component, per `component-structure.md`).
- `api.ts` — add `reorder(body)`.
- `types.ts` — replace `completed` with `status`, add `position`. Add `STATUS_COLUMNS: { value: Status; label: string }[]` used by the board.

### View-mode persistence
`localStorage["todos.view"] = "list" | "kanban"`. One `useState` + `useEffect` in `TodosPage`. No context needed — a single page owns it.

## 5. Drag-and-drop library choice

Evaluated three options; picking `@dnd-kit/core` + `@dnd-kit/sortable`.

| Option | Pros | Cons |
|---|---|---|
| **@dnd-kit/core + sortable** ★ | Keyboard DnD out of the box (`KeyboardSensor` + arrow keys + space/esc). `useSortable` + `SortableContext` is the textbook multi-column kanban recipe. ~15k stars, well-documented kanban examples. | Core 6.3.1 is from ~a year ago; `@dnd-kit/react` (newer ground-up rewrite) is at 0.4.0 and not stable. Core does work with React 19 in practice; we stay on core. |
| **@atlaskit/pragmatic-drag-and-drop** | Actively developed (backs Jira/Trello), ~4.7 kB core, framework-agnostic. | Low-level: we'd write keyboard a11y, drop indicators, and animations ourselves. Overkill for a single-user toy app — violates KISS. |
| **HTML5 DnD directly** | Zero deps. | Cross-browser quirks, broken on touch, no built-in keyboard a11y. Not worth it. |
| react-beautiful-dnd | — | Deprecated; don't use. |

Packages to add: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. Install with `bun add` in `web/` and add a `mise` task only if a new repeated command emerges (per `build.md`).

### DnD wiring sketch
```
<DndContext onDragEnd={handleDragEnd} sensors={[PointerSensor, KeyboardSensor]}>
  {columns.map(col => (
    <SortableContext id={col} items={idsIn(col)} strategy={verticalListSortingStrategy}>
      <KanbanColumn status={col}>
        {todosIn(col).map(t => <KanbanCard key={t.id} todo={t} />)}
      </KanbanColumn>
    </SortableContext>
  ))}
  <DragOverlay>{active && <KanbanCard todo={active} dragging />}</DragOverlay>
</DndContext>
```
`handleDragEnd` resolves source column / dest column / dest index from `over.data`, then calls `useKanban.moveCard(...)`.

## 6. Interaction details & tradeoffs

- **Optimistic vs refetch.** The existing hook refetches after every mutation — fine for a network-local single user, but a cross-column drop would flash (card snaps back, then reappears in the new column). Apply the drop optimistically inside `useKanban` (update local array before awaiting `reorder`), rollback on error via toast. Keep `useTodos.refetch` as-is for the list view.
- **One reorder call or two on cross-column moves?** Two calls (source column + destination column) is the cleanest API — each request is "here is the final state of this column". Alternative: extend `/reorder` to accept an array of `{status, ordered_ids}` and handle both in one save. Pick the single-column form first; upgrade only if a visible race shows up.
- **Priority vs position.** Once `position` exists, drag order wins. Priority stays as a badge and as the default position at creation (new `high`-priority card is inserted at the top of `todo`; new `low` at the bottom). Document this in the hook, not as a fancy server rule.
- **Mobile.** `PointerSensor` with an `activationConstraint` of `{ distance: 6 }` lets tap-to-edit still work. Columns stack vertically under `md`.
- **State requirement from `docs/design/rules.md`.** Kanban page must still cover loading (skeleton columns), empty (per-column "No tasks" placeholder — not blocking, doesn't need a CTA per column; page-level empty state keeps the single CTA), error (top-level `ErrorState`), success (toast on drop, auto-dismiss).

## 7. Rollout order

1. **API:** schemas → service (`reorder` + migration) → router → smoke test against `todos.json`.
2. **Types + api client** on the web: `Status`, `position`, `todosApi.reorder`.
3. **Kanban components + hook** behind a `kanban` view mode; list view untouched.
4. **View toggle** in `TodosPage`, `localStorage` persistence.
5. **Polish:** drag overlay styling (reuse `Card` + `bg-bg-elevated` + `border-border-accent`), keyboard announcements, column count badges.

Each step is independently shippable. Step 1 alone keeps the list view working with the new data model (list groups all `todo`+`doing` as "incomplete" and `done` as "complete" for compatibility, or — simpler — the list view filters `status !== "done"` and shows done below). Decide that during step 3.

## 8. Open questions (worth confirming before building)

- Should the list view **survive** at all, or should Kanban replace it? "Kanban *mode*" in the prompt suggests both; confirm before committing to the toggle.
- Should the `Doing` column be capped (WIP limit)? Classic Kanban says yes, but it's out of scope for a single-user toy unless asked.
- When a card is toggled from the list view, which column does it go to? Proposal: `todo ↔ done` (skip `doing`) to preserve the old checkbox semantics.

## 9. Sources

- [Top 5 Drag-and-Drop Libraries for React in 2026 — Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [@dnd-kit vs react-beautiful-dnd vs Pragmatic DnD — PkgPulse 2026](https://www.pkgpulse.com/blog/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026)
- [dnd kit homepage](https://dndkit.com/)
- [@dnd-kit/core on npm](https://www.npmjs.com/package/@dnd-kit/core)
- [Atlassian Pragmatic drag-and-drop](https://github.com/atlassian/pragmatic-drag-and-drop)
- [Building a Drag-and-Drop Kanban Board with React and dnd-kit — LogRocket](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/)
