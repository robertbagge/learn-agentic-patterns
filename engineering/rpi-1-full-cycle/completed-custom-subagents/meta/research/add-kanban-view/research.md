# Kanban Mode — Research Synthesis

Neutral survey across eleven research agents. Each topic has a dedicated
file in this directory; this document is the connective tissue — what
the decisions are, how they depend on each other, and where the real
frictions live. No recommendations.

Detail files:

**Round 1 — core topics**
- [A. State & persistence](state-and-persistence.md)
- [B. UI structure & routing](ui-structure.md)
- [C. Drag-and-drop](drag-and-drop.md)
- [D. Data model](data-model.md)
- [E. View coexistence vs. replacement](view-coexistence.md)
- [F. Column ordering](column-ordering.md)

**Round 2 — adjacent concerns**
- [G. Optimistic UI / caching strategy](optimistic-ui.md)
- [H. Concurrent-edit / multi-tab behaviour](concurrent-edits.md)
- [I. Empty states & column affordances (Linear-style)](empty-states.md)
- [J. Touch / mobile behaviour](touch-mobile.md)
- [K. Keyboard / accessibility fallback](accessibility.md)

---

## TL;DR

- **Nothing about Kanban maps cleanly onto the current app.** There is
  no status enum (only `completed: bool`), no position field, no
  router, no navigation chrome, no responsive breakpoints, no
  client-side state library, and no optimistic update or cache layer.
  Every topic touches net-new surface area.
- **Four cascading decisions dominate everything else**: (D) how status
  is represented, (F) how intra-column order is represented, (E)
  whether Kanban coexists with the list view or replaces it, and
  (K) what WCAG conformance target applies. The fourth is new in round
  2 and it has outsized impact — **WCAG 2.2 SC 2.5.7 (AA) explicitly
  names task boards and requires a non-drag alternative**, which
  reshapes the UI (per-card status control becomes primary, drag
  becomes the mouse-convenience overlay).
- **The "refetch-after-every-mutation + server-side sort" friction
  (A, F) remains the largest architectural decision.** Round 2 added
  detail: the server race is not theoretical (all routes are sync
  `def`, FastAPI threadpools them, H has a worked lost-update), and
  `JsonFileStorage.save` is also non-atomic (truncate then write — a
  crash mid-save corrupts the file). Fixing correctness is cheap
  (`version: int` + 409 or reuse of existing `updated_at`); masking
  latency is where the architectural shift lives (options in G).
- **Product-level design concerns are less load-bearing than they
  looked.** I surveyed Linear, Trello, GitHub Projects, Notion, Jira:
  none backfill empty columns, none use placeholder copy inside
  empty columns, all have a persistent per-column add affordance. The
  "empty Doing on day one" tension softens to "accept emptiness, which
  is the industry default." Mobile layout has no consensus, but the
  smallest increment (desktop-first + vertical stack fallback) is
  known and cheap.

---

## Current state at a glance

- **Stack:** React 19.2 + Vite 8 + TS 6 + Tailwind v4, FastAPI backend,
  JSON-file persistence. Single page, no router, single `useState`
  inside `useTodos`
  (`web/src/features/todos/hooks/use-todos.ts:17-20`).
- **Data shape:** `id, title, priority, completed, created_at,
  updated_at` on server (`api/todos/schemas.py:43-49`) and client
  (`web/src/features/todos/types.ts:3-10`). No `status`, no
  `position`, no `version`.
- **Persistence:** `api/todos.json` rewritten whole on every save,
  non-atomic `open("w")` + `json.dump` (`api/core/storage.py:21-23`).
  No schema version, no migration layer.
- **Server handlers:** all sync `def`
  (`api/todos/router.py:10-28`), dispatched on FastAPI's threadpool —
  requests genuinely interleave. `TodoService.update` is
  read-modify-write with no locking (`api/todos/service.py:42-51`).
- **UI:** `App → ToastProvider → TodosPage` with `max-w-[720px]`
  (`web/src/features/todos/components/todos-page.tsx:11`). Zero
  Tailwind responsive prefixes across the codebase. No tabs, no menus,
  no nav.
- **Mutation pattern:** every create/update/delete awaits a full-list
  `refetch()`. No optimistic UI, no debounce, no cache
  (`web/src/features/todos/hooks/use-todos.ts:39-63`). Server re-sorts
  `(priority desc, created_at asc)` on every list read
  (`api/todos/service.py:22-25`).
- **Accessibility baseline:** modest but correct — polite toast live
  region (`web/src/components/toast.tsx:42-43`), `role="alert"` on
  error state, native `<dialog>` with `showModal()` for confirms,
  `aria-label` on icon-only controls. No audit, no CI a11y checks.

---

## Decision graph

```
  (K) WCAG target:  2.2 AA  vs.  keyboard-usable only
       │
       ├── if AA ──► non-drag primary (Select on card or "Move to…")
       │            drag becomes secondary
       │
  (D) Data model: how is status represented?
       │
       ├──► (F) Ordering: per-column rank representation
       │         │
       │         └──► server sort policy change (F+A)
       │
       ├──► (E) Coexistence: replace / toggle / routes / hybrid
       │         │
       │         └──► (B) UI hosting: where the view(s) live
       │                  │
       │                  └──► (I) Add affordances & empty states
       │                  └──► (J) Mobile layout strategy
       │
       ├──► (A) State & persistence: does refetch policy change?
       │         │
       │         └──► (G) Optimistic UI: 5 options, 0–13 KB gz
       │
       └──► (H) Concurrent-edit handling: status quo or version+409?
                 │
                 └──► (C) DnD library: @dnd-kit recommended; mostly
                             independent of the above
```

K is a product/compliance decision that gates everything downstream —
if AA is the target, the whole UI emphasis shifts from "drag is the
action" to "drag is a shortcut." D, E, F are the next tier. G and H are
the architectural decisions. B, I, J are design decisions. C is the
most decoupled.

---

## Cross-topic tensions and frictions

### 1. Refetch-after-mutation vs. drag-to-move (A, G, F)

Every mutation triggers a full-list `refetch()`
(`use-todos.ts:42, 52, 60`); the server re-sorts on every read
(`service.py:22-25`). A drag that writes a new column/rank, then
awaits a GET that discards it, snaps back. Options from G:

- Keep refetch; make server authoritative for column + rank (0 KB,
  matches pattern, visible pause unavoidable).
- Hand-rolled optimistic reducer (0 KB, scales poorly — cancel in-
  flight refetch, serialise concurrent mutations, snapshot both
  columns for rollback are all manual).
- TanStack Query v5 (~13.4 KB gz; `onMutate`/`onError` primitives
  already solve the edge cases).
- SWR 2.x (~4.2 KB gz; `optimisticData` + `rollbackOnError`).
- Zustand / Jotai + manual fetch (~1.2 / ~4 KB gz; store is the
  cache).

All five are viable. None fix the server race (H) — they only mask
latency.

### 2. The server race is real, not theoretical (H)

All todo routes are `def`, not `async def`, so FastAPI threadpools
them. H has a worked lost-update: tab A's toggle and tab B's rename on
the same row interleave, A's toggle is lost, both return 200. Reorder
amplifies this: array-of-IDs columns lose whole column rewrites;
position/rank fields lose a move to midpoint collision.

Cheapest proportionate fix: `version: int` on the record (or reuse
existing `updated_at`), rejected on mismatch with 409, client retries
via the refetch plumbing that already exists. BroadcastChannel for
multi-tab is a cosmetic add-on, not a correctness fix. Server-side
locks only work within one uvicorn worker.

**Bonus bug surfaced by H:** `JsonFileStorage.save` is not atomic —
`open("w")` truncates, then `json.dump` writes. A crash mid-write
leaves a partial/empty file. Canonical fix: write-tempfile +
`os.replace`. Independent of concurrency, compounds it.

### 3. Empty Doing column on day one — softens (D, E, I)

D flagged this, E flagged this, I went and checked what real tools
do. **None of Linear, Trello, GitHub Projects, Notion, or Jira
backfills empty columns**, none use placeholder copy inside empty
columns, all show headers + counts (usually `0`) and a persistent
add affordance. First-run experience in every big tool = empty
columns, filled through use. "Accept emptiness" is the industry
default; backfill-heuristic is a bespoke pattern that adds risk. The
round-1 tension weakens.

### 4. Accessibility reshapes the UI emphasis (K)

WCAG 2.2 SC 2.5.7 (AA) explicitly calls out task boards and requires
a single-pointer (non-drag) alternative. WCAG 2.1 SC 2.1.1 (A) only
requires keyboard-reachability. The two targets produce different
designs:

- **AA target:** per-card status `<Select>` (reuses existing
  `select.tsx`) or "Move to…" menu is *primary*; drag is the mouse
  convenience overlay. This matches Linear/GitHub/Notion, which all
  treat the property-panel status change as canonical.
- **Keyboard-usable only:** `@dnd-kit`'s `KeyboardSensor` alone is
  sufficient. Announcements still need overriding (defaults leak
  UUIDs and ship English-only).

Either way, dnd-kit's built-in announcements must be customised via
the `announcements` prop to use `todo.title` and position-of-N
phrasing.

### 5. Server sort vs. manual rank (F, E)

If Kanban introduces manual rank, the existing
`(priority, created_at)` sort must be bypassed for the board or
replaced as authoritative. Coexistence choice (E) determines whether
both views need to agree: Replace and Toggle collapse to one ordering,
Separate-routes could keep two.

### 6. Layout cap vs. three columns (B, I, J)

`max-w-[720px]` on `todos-page.tsx:11` is the main structural
constraint. Three columns want to widen or remove this cap, which
introduces the codebase's first responsive breakpoints (currently
zero `sm:`/`md:`/`lg:` prefixes anywhere in `src/`). Mobile is a
concrete design question: horizontal scroll (Trello/Jira/GitHub —
"annoying on small screens" per Trello user research), vertical stack
(Notion — "no columns on mobile"), or swipe-snap (Linear, Basecamp —
most work, conflicts with touch drag).

### 7. Checkbox affordance under tri-state (D, K, I)

The `completed` checkbox (`todo-item.tsx:70-75`) is the only current
"state change" affordance. Under tri-state, it becomes awkward.
Cycling the checkbox is explicitly discouraged by K (loses native
semantics, surprising). The cleanest replacement per K is a per-card
status `<Select>` that reuses `web/src/components/select.tsx` —
identical pattern to the existing priority select. I's "Pattern 2 —
Linear-native" keeps `TodoCreateForm` global and adds a header `+`
per column; combined with a per-card status Select, the checkbox
simply goes away.

### 8. Touch DnD requires configuration (C, J)

C confirmed `@dnd-kit` works on touch; J verified the specifics:
`TouchSensor` with ~250 ms activation delay + 5 px tolerance,
`touch-action: manipulation` on cards, AutoScroller plugin enabled
for horizontal containers. iOS Safari does **not** support the
Vibration API — haptics are Android-only on the web.

---

## Topic summaries

### A. State & persistence

Server-owned state, JSON-file persistence, full-list refetch after
every mutation, no optimistic UI. `useTodos` is the single state seam
and trivially consumable by a Kanban view. What it does *not* expose
is a reorder/move mutation, bulk update, or cached snapshots. Backend
has no reorder endpoint and `service.update` has no locking.

### B. UI structure & view routing

No router of any kind. Two hosting points for a second view: inside
`TodosPage` (reusing `useTodos`) or one level up in `App`. Both work
structurally. Main constraints: 720px max-width and zero responsive
breakpoints — Kanban introduces the codebase's first `sm:`/`md:`
rules. Styling is Tailwind v4, dark-only.

### C. Drag-and-drop

Recommendation (the one call C was permitted to make): **`@dnd-kit`**
(`@dnd-kit/core` + `@dnd-kit/sortable`). Pointer-event based so touch
works without polyfill, built-in keyboard sensor and live-region
announcements, canonical Kanban pattern (one `DndContext`, one
`SortableContext` per column). Core ~6 KB gzip. Runner-up:
pragmatic-drag-and-drop (smaller, but HTML5-DnD-based so touch/a11y
need extra packages). Rejected: `react-beautiful-dnd` (archived),
`react-dnd` (React 19 support lagging), native HTML5.

### D. Data model

Today: `completed: bool`. Four options:

- **A.** Replace `completed` with `status: Literal["todo","doing","done"]`
  — cleanest, breaking.
- **B.** Add `status`, derive `completed` — pragmatic middle.
- **C.** Keep `completed`, add `in_progress: bool` — smallest diff,
  invites illegal combos.
- **D.** Derive from `completed` alone — fails requirement.

Migration is cheap in absolute terms (single JSON file) but not zero
— `TodoResponse.model_validate` on legacy rows raises unless defaults
or read-time migration.

### E. View coexistence vs. replacement

Four shapes, none blocked by current code:

- **Replace** — lowest surface area, hardest to reverse.
- **Toggle (same route)** — introduces view-preference question
  (localStorage for single-user-no-accounts app).
- **Separate routes** — URL-shareable, filters naturally scope via
  query params, requires a router.
- **Hybrid** — least disruptive or most expensive depending on
  ambition; weakest discoverability.

### F. Column ordering

No manual-order concept today. Five representations:

- Array of IDs per status — O(n) splice, lost-update risk.
- Integer position with gaps — O(1) move, needs renumber pass.
- Float position between neighbours — O(1) move, precision limit.
- LexoRank strings — O(1) move, rare bucket rebalance.
- Linked-list pointers — O(1) writes, O(n) reads, cycle risk.

Cross-column move policy (top / bottom / preserve) is orthogonal to
representation; bottom-of-destination is the usual default.

### G. Optimistic UI / caching strategy

Five options:

| Option | New deps (gz) | New concepts | Reversibility |
|---|---|---|---|
| 1. Refetch + server-authoritative | 0 KB | server move route + rank | high |
| 2. Hand-rolled reducer in `useTodos` | 0 KB | snapshot/restore by hand | high |
| 3. TanStack Query v5 | ~13.4 KB | `useQuery`, `useMutation`, keys | moderate |
| 4. SWR 2.x | ~4.2 KB | `useSWR`, `optimisticData` | moderate |
| 5. Zustand/Jotai + fetch | ~1.2 / ~4 KB | store, actions | moderate |

Option 1 is the only one with zero client-side architecture change.
Cross-column reorder (two fields change) is the hard case: single
`PATCH` endpoint accepting both atomically means one rollback target;
two-request design doubles the partial-failure surface.

### H. Concurrent-edit / multi-tab behaviour

Race is real: sync `def` handlers + threadpool = interleaved
requests; `service.update` has no locking; worked lost-update example
for single-row edits. Reorder amplifies: array-of-IDs lose whole
column rewrites; rank fields collide on midpoints.

Options: status quo (document last-writer-wins) · `version` / ETag +
409 (proportionate, uses existing `updated_at` for a zero-schema-
change weak form) · server-side lock (breaks across workers) ·
BroadcastChannel (UX polish, not a correctness fix) · SSE/WebSocket
(heavier, forward-compat) · CRDT (overkill).

Bonus: `JsonFileStorage.save` is non-atomic; canonical fix is
write-tempfile + `os.replace`.

### I. Empty states & column affordances

Surveyed Linear, Trello, GitHub Projects, Notion, Jira. Patterns:

- Every tool has a persistent per-column add affordance (Linear at
  top, Trello/GitHub/Notion at bottom, Jira least prominent).
- Empty columns are almost never *visually* empty — header + count +
  add affordance + blank body. No placeholder copy.
- Count in header is universal; WIP-limit arithmetic varies.
- Empty-column hiding is a view toggle, never destructive.
- First-run = empty columns. **Nobody backfills.**

Four patterns for this app:

1. **Trello-native** — bottom add button per column, absorb
   `TodoCreateForm` into Todo column.
2. **Linear-native** — `+` in column header, `TodoCreateForm` stays
   global (two entry points).
3. **Global-only create, columns are pure views** — no per-column
   add; drag is the only path to Doing.
4. **Responsive fallback** — stacked columns on narrow (orthogonal
   to 1–3).

Plus three empty-Doing handling options (accept emptiness · soft
hint · one-time heuristic backfill).

### J. Touch / mobile behaviour

Layout patterns (no industry consensus):

| Pattern | Examples | DnD interaction |
|---|---|---|
| Horizontal scroll | Trello, Jira, GitHub Projects | Hardest — page scrolls *and* cards drag |
| Stacked columns | Notion mobile | Easiest — pure vertical reorder |
| Single-column + picker | Many mobile PM apps | DnD trivial; cross-column = menu |
| Carousel / swipe-snap | Linear, Basecamp | Hardest — swipe and drag gestures conflict |

`@dnd-kit` verified: `TouchSensor` with `{ delay: 200, tolerance: 5 }`,
`touch-action: manipulation` on cards, AutoScroller plugin supports
horizontal containers. iOS lacks Vibration API.

Smallest increment: desktop-first three columns + vertical stack
fallback (or horizontal scroll, one class addition). Swipe-snap /
haptics / "Move to…" sheet are a separate project.

### K. Keyboard / accessibility

WCAG 2.2 SC 2.5.7 (AA) requires non-drag alternative for task boards.
WCAG 2.1 SC 2.1.1 (A) only requires keyboard-reachability.

`@dnd-kit` `KeyboardSensor` gives Space/Enter pick-up + drop, arrows
to move, Escape to cancel. Default announcements leak raw UUIDs and
ship English-only — must override via `announcements` prop.

Non-drag alternatives (K's table):

| Alternative | WCAG | Cost | Reuse here |
|---|---|---|---|
| Per-card status `<Select>` | 2.1.1 + 2.5.7 | Low | Drop-in; matches `todo-item.tsx:110-118` priority pattern |
| "Move to…" menu | 2.1.1 + 2.5.7 | Medium (no menu primitive exists) | New UI |
| Keyboard shortcuts (`J`/`K`, `1`/`2`/`3`) | 2.1.1 only | Medium | New global handler |
| Cycling checkbox | Technically keyboard | Surprising | **Not recommended** |
| Edit-mode change | 2.1.1 + 2.5.7 | High (multi-step) | Extends existing edit |

Linear, GitHub, Notion all converge on "drag for mouse, per-card
status control for everything else." Strongest fit here: per-card
`<Select>` (reuses `web/src/components/select.tsx` exactly as the
priority select uses it).

Minimum bar proposed by K (6 points):

1. Every card reachable by Tab with visible focus.
2. Status change possible without drag (Select or "Move to…").
3. `@dnd-kit` `KeyboardSensor` + custom `announcements` prop with
   title + position-of-N.
4. Reuse toast region to announce non-drag moves; `aria-live` on
   column counts.
5. Focus stays on moved card; Escape cancels keyboard drag.
6. Reuse `ConfirmDeleteDialog`'s `<dialog>` + `showModal()` pattern
   for any new modal.

---

## Open decisions the user will need to make

Roughly in dependency order:

1. **WCAG conformance target** (from K): 2.2 AA (non-drag mandatory) or
   2.1 keyboard-usable. This is the new top-of-graph decision —
   shapes (K), affects the choice in (D) about whether the checkbox
   survives, and influences (I) pattern selection.
2. **Status representation** (from D): A, B, or C.
3. **Migration posture**: Pydantic defaults vs. read-time backfill vs.
   `schema_version`.
4. **Ordering representation** (from F): array-of-IDs vs. position
   field vs. LexoRank.
5. **Coexistence shape** (from E): replace / toggle / routes / hybrid.
6. **UI hosting point** (from B): inside `TodosPage` vs. one level up.
7. **Refetch vs. optimistic** (from G): keep round-trip-per-mutation
   + server-authoritative (option 1), or adopt a cache layer
   (options 3–4 most likely).
8. **Concurrent-edit handling** (from H): document status quo, or
   `version: int` / `updated_at`-as-etag with 409.
9. **Storage atomicity** (from H, independent): fix the non-atomic
   `open("w")` + `json.dump` with tempfile + `os.replace`, or
   accept.
10. **Server sort policy** (from F, A): bypass `(priority, created_at)`
    for the board, or replace entirely with manual rank.
11. **Cross-column move policy** (from F): append-bottom (default),
    prepend-top, or preserve-index.
12. **DnD library** (from C): accept `@dnd-kit` recommendation or
    consider `pragmatic-drag-and-drop`.
13. **Empty-column pattern** (from I): Trello-native (1) / Linear-
    native (2) / global-only (3); plus stacked fallback (4) as an
    independent axis.
14. **Empty-Doing day-one handling** (from I): accept / soft hint /
    heuristic backfill.
15. **Mobile layout strategy** (from J): desktop-first + vertical
    stack (smallest), desktop-first + horizontal scroll (parity with
    desktop), or swipe-snap (most work, separate project).
16. **Non-drag primary affordance** (from K, if AA): per-card Select
    (cheapest), "Move to…" menu, or both.
17. **Focus destination after move** (from K): stay on card (default),
    column header, or source location.

---

## What remains unresearched

At this point the research covers the codebase, library choices,
data-model options, UX patterns, a11y conformance, concurrency, and
mobile. Genuinely unaddressed and potentially worth a third round if
scope expands:

- **Undo/redo for moves.** Kanban boards frequently ship undo
  (Linear/Trello both have it); no existing undo infrastructure to
  reuse. Affects UX expectations but not correctness.
- **Bulk operations / multi-select.** Kanban boards frequently allow
  selecting multiple cards for a batch move. Not requested; worth
  naming.
- **Card detail view.** On many boards clicking a card opens a
  detail modal. Current app edits inline (`todo-item.tsx:31-55`);
  Kanban may want to preserve or replace this pattern.
- **Testing strategy for drag interactions.** Playwright/RTL patterns
  for DnD differ meaningfully from normal UI tests. Likely needed
  before implementation, not planning.

None are blocking; all can be deferred until implementation begins.
