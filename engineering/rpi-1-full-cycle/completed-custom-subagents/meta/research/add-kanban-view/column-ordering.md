# Column Ordering — Research (Topic F)

## TL;DR

- Today there is no manual order. The backend sorts on every `list()` by
  `(priority desc, created_at asc)` in `api/todos/service.py:20-25`, and the
  frontend renders the server's order verbatim (`web/src/features/todos/components/todo-list.tsx:108-121`).
  Introducing Kanban columns means introducing a new, persisted concept the
  codebase does not currently carry: per-column manual sort.
- Four representations are plausible — array-of-IDs-per-status, integer
  positions with gaps, floating-point positions, and LexoRank-style strings.
  Linked-list pointers are a distant fifth. Each trades off move cost against
  rebalancing and concurrent-edit safety.
- Cross-column moves need an explicit policy (top vs bottom vs preserve).
  There is no prior precedent to copy from; the current single-list sort
  hides the question entirely.

## Current ordering (baseline)

- **Server-side sort.** `TodoService.list` returns items sorted by priority
  rank then `created_at` ascending (`api/todos/service.py:22-25`,
  `PRIORITY_RANK` at `api/todos/service.py:9`). Storage itself preserves
  insertion order — `storage.append` in `api/todos/service.py:38` and
  `JsonFileStorage.save` in `api/core/storage.py:21-23` just serialise the
  list — but callers never see that raw order.
- **No position field.** `TodoResponse`/`TodoCreate`/`TodoUpdate` carry
  `id, title, priority, completed, created_at, updated_at` and nothing else
  (`api/todos/schemas.py:14-49`). The frontend `Todo` mirrors those fields
  (`web/src/features/todos/types.ts:3-10`).
- **No client re-sort, no filters.** `useTodos` stores `todos` as-received
  (`web/src/features/todos/hooks/use-todos.ts:26-33`); `TodoList` maps over
  the array with no sort/filter step (`todo-list.tsx:109`). A grep for
  `sort|order|position|rank` across `api/` and `web/src/` finds only the
  one server-side sort.
- **Implication for Kanban.** A manual-order concept has to be added
  everywhere — schema, storage, list endpoint, and client render — because
  nothing analogous exists today.

## Representation options

### 1. Array of IDs per status

Store `{ todo: [id, ...], doing: [id, ...], done: [id, ...] }` alongside (or
instead of) per-item position. Tasks remain in `todos.json`; a sibling
structure owns order.

- Insert/move: O(n) splice of a small list, but requires writing the whole
  array back. Since the entire JSON file is rewritten on every save already
  (`core/storage.py:21-23`), this is not a regression.
- Concurrent edits: classic lost-update risk. Two tabs each reading then
  writing the list will clobber each other's reorders. Mitigation is
  last-writer-wins or optimistic versioning.
- Rebalancing: none — ordering is positional.
- Migration: add one file/section; seed with current priority-sorted list.

### 2. Integer `position` with gaps (e.g. 100, 200, 300)

Each todo gets a `position: int` (or `order: int`). Insert between neighbours
by picking the midpoint.

- Insert/move: O(1) for a single-item update; only that row is written.
- Concurrent edits: two clients can still pick the same midpoint. Safe enough
  single-user across tabs if writes are sequential; not robust multi-user.
- Rebalancing: eventually required — gaps collapse after enough inserts
  between the same two neighbours. Needs a periodic or on-demand
  renumber pass.
- Migration: one new field + backfill.

### 3. Float `position` between neighbours

Same as #2 but pick `(prev + next) / 2`.

- Insert/move: O(1) and never needs a gap strategy up-front.
- Concurrent edits: same midpoint collision risk as integers.
- Rebalancing: floats exhaust precision after ~50 sequential inserts in the
  same slot. Plan for renumber.
- Migration: one new field + backfill.

### 4. LexoRank-style strings (e.g. Jira's approach)

Lexicographic string keys (`"0|hzzzzz:"`), rebalanced in ranges.

- Insert/move: O(1) per move; `mid(prev, next)` generates a string strictly
  between two neighbours.
- Concurrent edits: still possible for two clients to pick identical
  midpoints, but the string space is vast, so rebalancing is rare. Some
  implementations add bucket-splits to contain contention.
- Rebalancing: infrequent but non-trivial; a bucket-full event forces a
  rewrite of that bucket's entries.
- Migration: new string field; seed values during backfill.

### 5. Linked-list pointers (`prevId` / `nextId`)

Each todo knows its neighbour(s).

- Insert/move: O(1) pointer rewrites, but a move touches 3–4 records
  (old prev, old next, new prev, new next). Hard to make atomic against a
  JSON-file storage that rewrites everything anyway.
- Concurrent edits: cycles and orphans are possible mid-write; recovery
  code is annoying.
- Rebalancing: none.
- Migration: two new fields, but traversal cost means every list read walks
  the chain — worse than sort-by-number.

## Comparison

| Option            | Insert/move cost | Concurrent-edit safety | Rebalancing | Migration from today |
|-------------------|------------------|------------------------|-------------|----------------------|
| Array of IDs      | O(n) write of list | Lost-update risk on concurrent writes | None | Low — one structure |
| Integer + gaps    | O(1) single row    | Midpoint collisions possible | Periodic renumber | Low — one field |
| Float between     | O(1) single row    | Midpoint collisions possible | Precision renumber | Low — one field |
| LexoRank strings  | O(1) single row    | Rare collisions; bucket splits | Infrequent | Medium — tricky gen code |
| Linked list       | O(1) writes, O(n) read | Cycle/orphan risk | None | Medium — two fields, traversal |

## Cross-column move semantics

Three reasonable policies for Todo → Doing (and similar):

1. **Append to destination bottom** — simplest; new card ends up at the
   natural "I just moved this" position. Matches how most physical
   boards work.
2. **Prepend to destination top** — makes "just moved" cards visible;
   common in tools optimised for active review.
3. **Preserve prior index** — insert at the same ordinal position the card
   held in its source column. Surprising when columns have different
   lengths; generally a bad default.

Recommendation for the planning stage: pick one default (append to bottom is
the usual choice), but note that all three representations support any
policy — the policy is independent of the representation.

## Interaction with existing features

- The current `(priority, created_at)` sort (`service.py:22-25`) must be
  replaced or bypassed for Kanban. If the list view is kept, the service
  needs two read paths (sorted for list, position-ordered for board), or
  the ordering must become authoritative and the list view switches to the
  same order.
- No filter features exist to conflict with, so manual order can be the
  sole ordering signal within each column without reconciliation work.
- Priority becomes purely informational on a board (a badge on the card)
  rather than a sort key, unless explicitly kept as a secondary signal.
