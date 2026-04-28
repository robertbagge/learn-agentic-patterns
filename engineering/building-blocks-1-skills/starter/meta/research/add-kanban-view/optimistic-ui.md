# Topic G — Optimistic UI / Caching Strategy

## TL;DR

- **The current pattern is a cache-less write-through:** every mutation
  in `useTodos` awaits a full-list `refetch()`
  (`web/src/features/todos/hooks/use-todos.ts:39-63`), and the server
  re-sorts on every read (`api/todos/service.py:20-25`). A drag-and-drop
  Kanban interaction will visibly pause and, in the cross-column case,
  snap back unless either the server becomes authoritative for column
  + rank *or* the client stops trusting the refetch as the source of
  truth between drop and round-trip.
- **Five options surveyed, three shapes:** (1) keep the refetch and push
  all ordering responsibility server-side, (2) hand-roll an optimistic
  reducer inside `useTodos`, (3) adopt a query/cache library (TanStack
  Query or SWR), (4) adopt a client store (Zustand / Jotai) and treat
  fetch as a side effect. (1) avoids any new client machinery; (2)–(4)
  all introduce the codebase's first client-side cache or store.
- **Cross-column reorder is the hard case** because two fields change
  (column membership + intra-column rank) and the write can partially
  fail — the card can land in the new column with a stale rank, or
  land at all. Rollback strategy and server response shape matter more
  than the specific library.

---

## Current-state recap (context for each option)

- `useTodos` holds a single `useState<Todo[]>` and re-`GET`s the whole
  list after every mutation
  (`web/src/features/todos/hooks/use-todos.ts:17-20, 39-63`).
- `todosApi.update` is a `PATCH` with `exclude_unset=True` semantics on
  the server (`api/todos/service.py:42-51`), so partial writes work.
- Server re-sorts `(priority desc, created_at asc)` on every list read
  (`api/todos/service.py:20-25`); the client never picks an order.
- Per-row `busyIds` disables inputs during the round-trip
  (`web/src/features/todos/components/todo-list.tsx:24-26, 28-42`).
- No existing query, cache, or client-store dependency — `package.json`
  has React, Vite, Tailwind, and the toast/dialog primitives only.

---

## Options

### 1. Keep refetch, make server authoritative for column + rank

The server stores `status` and a rank field, accepts a move
endpoint, and returns the new ordering. `refetch()` still runs but now
echoes the write instead of overwriting it.

- **Bundle cost:** 0 KB. No new deps.
- **Code shape:** new `/todos/{id}/move` route, a `position`/`rank`
  field in `Todo`, and `service.list()` sorting by `(status, rank)` on
  the board path (see Topic F).
- **Cross-column reorder:** a single request carries both fields; if it
  fails, the card stays in place because the optimistic move never
  happened. Drop-to-drop latency is two round-trips (PATCH + GET).
- **DX:** matches the existing pattern; zero new concepts for a
  single-dev teaching repo.
- **Reversibility:** high — does not touch client architecture.
- **Caveat:** the visible pause is unavoidable. Acceptable for local
  dev, noticeable over a real network.

### 2. Hand-rolled optimistic reducer in `useTodos`

Extend the hook: on `update`/`move`, apply the patch to local state
first, fire the request, then reconcile.

- **Bundle cost:** 0 KB.
- **State shape sketch:** keep `todos: Todo[]` plus a `pending: Map<id,
  Todo>` of pre-mutation snapshots. `update()` writes the optimistic
  value into `todos`, stores the old value in `pending`, and on
  `catch` restores from `pending`. On success, clear the entry. For
  a cross-column move this means snapshotting both source and
  destination columns' ordering, because rank shifts ripple.
- **Cross-column reorder:** the hand-rolled path has to encode the
  same invariants a library gives for free — cancel in-flight
  refetches (otherwise the stale GET clobbers the optimistic write),
  serialise concurrent mutations on the same id, and decide whether
  later mutations layer on top of the optimistic value or the
  confirmed one.
- **DX:** fine for one or two mutations; scales poorly. The edge cases
  (rapid successive drags, mutation-during-refetch, error after a
  successful newer mutation) are exactly what TanStack Query and SWR
  solved upstream.
- **Reversibility:** high — contained to one file.

### 3. TanStack Query (react-query v5)

`useMutation` with `onMutate` to write the optimistic cache,
`onError` to rollback, `onSettled` to invalidate. `useQuery` replaces
the `useEffect(refetch)` pattern.

- **Bundle cost:** ~13.4 KB gzipped for `@tanstack/react-query` v5
  ([Bundlephobia][bp], v5 dropped ~10 % vs v4 by dropping legacy
  browser targets).
- **React 19 support:** yes, v5 supports React 19 and ships with it as
  the typical 2026 default ([PkgPulse 2026][pkgpulse-rq],
  [TanStack 2026 notes][byteiota]).
- **Cross-column reorder:** `onMutate` receives the move payload,
  cancels in-flight queries for the list key, writes the optimistic
  column+rank into the cache, and returns a rollback context.
  `onError` restores from context. `onSettled` triggers a refetch,
  which will only land a user-visible change if the server disagreed
  with the optimistic state.
- **DX:** canonical pattern, heavily documented, devtools included.
  Highest concept load (queries, query keys, stale time, cache time,
  invalidation) for a single-file feature like this.
- **Reversibility:** moderate — once `useQuery` is the data source
  throughout `todos-page.tsx` and `todo-list.tsx`, going back means
  reintroducing the hook's manual state.

### 4. SWR

`useSWR` replaces the fetch. `useSWRMutation` with `optimisticData`
(function form for functional updates) and `rollbackOnError: true`
(the default) covers the optimistic path.

- **Bundle cost:** ~4.2 KB gzipped, roughly a third of TanStack
  Query's footprint ([PkgPulse 2026][pkgpulse-swr]).
- **React 19 support:** yes; SWR 2.x is stable and in active use in
  2026.
- **Cross-column reorder:** `optimisticData` accepts a function that
  receives current cache data — sufficient for a two-field update.
  Rollback is automatic when the fetcher throws. Coordinating
  optimistic writes across multiple cache keys (if the board uses a
  key-per-column) is more manual than TanStack Query
  ([Refine 2025 comparison][refine], [dev.to 2026][dev-swr-vs-tq]).
- **DX:** smaller API surface; the stale-while-revalidate mental model
  is a natural fit for a single-cache-key app. No devtools story
  comparable to TanStack Query.
- **Reversibility:** similar to TanStack Query. Lighter to rip out by
  virtue of fewer touchpoints.

### 5. Zustand / Jotai + manual fetch

A client store owns `todos`; API calls live in store actions and
treat the network as a side effect. No query-cache concept; the store
*is* the cache.

- **Bundle cost:** Zustand ~1.2 KB gzipped, ~20 M weekly downloads;
  Jotai ~4 KB gzipped, atomic model
  ([PkgPulse state-of-state 2026][pkgpulse-state]).
- **Code shape:** a `useTodosStore` with `todos`, `move(id, col,
  rank)`, `update(id, patch)`, each action optimistically mutating
  store state, firing the request, and rolling back on catch. Fetch
  stays manual — no background revalidation, no dedupe, no retry.
- **Cross-column reorder:** same invariants as option 2 (snapshot,
  restore on error, serialise) — the store just gives a tidier home
  for the logic than `useTodos` does.
- **DX:** attractive for apps where state is the problem;
  over-engineered when the only state is one fetched list. Common
  pairing in 2026 is *TanStack Query + Zustand*, with Query owning
  server state and Zustand owning UI state
  ([dev.to state 2026][dev-state]).
- **Reversibility:** moderate — store becomes the data seam for
  several components.

---

## Comparison matrix

| Option | New deps (gz) | New API concepts | Cross-column rollback | Handles stale-refetch race | Touchpoints in repo |
|---|---|---|---|---|---|
| 1. Refetch + server-authoritative | 0 KB | server move route + rank field | N/A (no optimistic state) | N/A | `api/todos/*`, `useTodos`, types |
| 2. Hand-rolled reducer | 0 KB | snapshot/restore by hand | manual (snapshot both columns) | manual (cancel refetch) | `useTodos` |
| 3. TanStack Query v5 | ~13.4 KB | `useQuery`, `useMutation`, query keys, invalidation | `onMutate` → context → `onError` | built-in (`cancelQueries`) | provider in `App`, data seam in `TodosPage`, every mutator |
| 4. SWR 2.x | ~4.2 KB | `useSWR`, `useSWRMutation`, `optimisticData`, `mutate` | `optimisticData` fn + `rollbackOnError` (default) | built-in (dedupe + revalidation) | `useTodos` rewrite, per-key strategy |
| 5. Zustand / Jotai + fetch | ~1.2 KB / ~4 KB | store, selectors, actions | manual inside store action | manual | store module, `useTodos` callers |

| Option | React 19 (April 2026) | Test surface added | Reversibility |
|---|---|---|---|
| 1 | n/a (no client change) | server-side tests for move/rank | high |
| 2 | unchanged | reducer unit tests | high |
| 3 | supported | provider wrapper in tests, query-key discipline | moderate |
| 4 | supported | SWR cache reset in tests | moderate |
| 5 | supported | store-reset helper in tests | moderate |

---

## Notes on the hard case (cross-column reorder, partial failure)

- Two fields change: `status` and `rank`. A single `PATCH` endpoint
  that accepts both atomically means one request, one rollback target.
  A two-request design (set status, then set rank) doubles the partial-
  failure surface — the card can end up in the new column with the old
  rank.
- Under option 1, the visible snap-back on failure is automatic because
  the optimistic state never existed. Under options 2–5, the rollback
  has to restore not just the moved card but the ranks it displaced in
  both columns.
- The server's current `read-modify-write` without locking
  (`api/todos/service.py:42-51`, called out in
  `state-and-persistence.md`) means two near-simultaneous moves can
  silently overwrite each other regardless of client strategy.
  Optimistic UI can mask this locally; it does not fix it.

---

Sources:
- [Bundlephobia — @tanstack/react-query][bp]
- [PkgPulse — TanStack Query vs SWR vs Apollo 2026][pkgpulse-rq]
- [PkgPulse — State of React State Management 2026][pkgpulse-state]
- [PkgPulse — SWR bundle size reference][pkgpulse-swr]
- [TanStack 2026 — byteiota][byteiota]
- [Refine — React Query vs TanStack vs SWR 2025][refine]
- [dev.to — SWR vs TanStack Query 2026][dev-swr-vs-tq]
- [dev.to — State Management in 2026][dev-state]
- [SWR 2.0 announcement (optimisticData / rollbackOnError)](https://swr.vercel.app/blog/swr-v2)

[bp]: https://bundlephobia.com/package/@tanstack/react-query
[pkgpulse-rq]: https://www.pkgpulse.com/blog/tanstack-query-vs-swr-vs-apollo-2026
[pkgpulse-state]: https://www.pkgpulse.com/blog/state-of-react-state-management-2026
[pkgpulse-swr]: https://www.pkgpulse.com/blog/tanstack-query-vs-swr-vs-apollo-2026
[byteiota]: https://byteiota.com/tanstack-2026-full-stack-revolution-with-query-router/
[refine]: https://refine.dev/blog/react-query-vs-tanstack-query-vs-swr-2025/
[dev-swr-vs-tq]: https://dev.to/jake_kim_bd3065a6816799db/swr-vs-tanstack-query-2026-which-react-data-fetching-library-should-you-choose-342c
[dev-state]: https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge
