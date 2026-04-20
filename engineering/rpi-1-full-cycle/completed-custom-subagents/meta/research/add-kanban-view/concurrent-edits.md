# Concurrent-Edit / Multi-Tab Behaviour — Research (Topic H)

## TL;DR

- **The current read-modify-write path is racy today, but benignly so — single-row patches rarely collide on the same record.** `TodoService.update` reads the whole list, mutates one row, and rewrites the whole file with no locking (`api/todos/service.py:42-51`); `JsonFileStorage.save` is an in-place `open("w")` truncate-then-write, so a crash mid-write can also corrupt the file (`api/core/storage.py:21-23`). A Kanban reorder escalates this from "two single-row edits race" to "two whole-column reorders silently clobber each other."
- **Optimistic concurrency (version/ETag + 409) is the cheapest correctness fix on this stack.** One `version: int` on the record (or on the list as a whole for reorders), checked on write, rejected with 409 on mismatch — FastAPI + JSON file carries it without new infrastructure. BroadcastChannel complements but does not replace it; SSE/WebSocket and CRDT are forward-compatible but out of proportion for a single-user app.
- **Two existing subtleties to name explicitly.** (i) `@lru_cache` on `get_storage` (`api/todos/dependencies.py:14-16`) caches the `JsonFileStorage` *instance*, not data — it's an object singleton and does not itself cause staleness, but it also gives no mutex. (ii) FastAPI dispatches sync handlers in its threadpool (all todo routes are `def`, not `async def` — `api/todos/router.py:10-28`), so two tabs' requests genuinely interleave at the Python level; this is not a theoretical race.

## Current failure surface

### What actually races

`TodoService.update` is textbook read-modify-write (`api/todos/service.py:42-51`):

```
items = self._storage.load()        # (1) read whole list from disk
for todo in items:
    if todo["id"] == todo_id:
        patch = data.model_dump(exclude_unset=True)
        todo.update(patch)           # (2) mutate in memory
        todo["updated_at"] = _now()
        self._storage.save(items)    # (3) rewrite whole file
        return todo
```

There is no lock, no version check, no file-level atomicity. FastAPI runs each request as a sync callable on a threadpool thread (handlers are `def`, `api/todos/router.py:10-28`), so two in-flight PATCHes on the same uvicorn process fully interleave. The Python GIL prevents torn objects, but it does not serialise the three-step sequence above.

### Worked lost-update example (today, single-row)

Today the blast radius is small because most edits touch disjoint rows, but it's still possible to lose one:

1. Tab A: user toggles `completed` on todo X → `PATCH /todos/X {completed: true}` enters the server.
2. Server A: executes (1), loads `[{X, title:"t", completed:false}, {Y, ...}]`.
3. Tab B: user renames todo X → `PATCH /todos/X {title:"renamed"}` enters the server.
4. Server B: executes (1), loads the same snapshot (B hasn't seen A's write yet).
5. Server A: executes (2)+(3), writes `[{X, title:"t", completed:true}, {Y, ...}]` to disk.
6. Server B: executes (2)+(3), writes `[{X, title:"renamed", completed:false}, {Y, ...}]` to disk.

A's toggle is lost. Both requests return 200. Neither client sees the anomaly until the next refetch, which happens to echo B's state. Because `useTodos` refetches after every mutation (`web/src/features/todos/hooks/use-todos.ts:42, 52, 60`), there is a small visual hint (A's toggle briefly shows then reverts), but the server state is wrong.

### How reorder amplifies this

An array-of-IDs column representation (option F#1 in `column-ordering.md`) writes the entire column order on every move. A worked lost-update:

1. Column state: `[A, B, C, D]`.
2. Tab 1: drags `A` to the bottom → intended `[B, C, D, A]`.
3. Tab 2: drags `D` to the top → intended `[D, A, B, C]`.
4. Both tabs read `[A, B, C, D]` before either writes. Whichever PATCH lands second wins *the entire column*, and the other tab's drag is silently discarded.

Integer/float/LexoRank positions (F#2–#4) have a smaller but non-zero collision surface: two tabs can independently pick the same midpoint between the same two neighbours, ending up with duplicate ranks. The move isn't lost, but the ordering becomes ambiguous and the next sort is non-deterministic.

## Options surveyed

| Option | What race remains | Infra cost | Fit for FastAPI + JSON | Forward-compat to multi-user |
|---|---|---|---|---|
| Status quo (last-write-wins) | All lost-updates above | Zero | Native | None — gets worse |
| Optimistic `version` / ETag + 409 | None at server (client retries) | +1 field, +1 header, +1 error path | Excellent — pure Pydantic + FastAPI | Direct — same pattern scales |
| Server-side advisory lock (e.g. `fcntl.flock` or `threading.Lock`) around `save` | None at single process | Low code; serialises writes | Good for 1 uvicorn worker; breaks across workers unless filesystem lock | Partial — needs DB-level lock anyway |
| BroadcastChannel / `storage` event (client-only) | Server race unchanged | Pure client; ~20 LOC | Additive — orthogonal to backend | None — purely cosmetic |
| SSE / WebSocket push | Server race unchanged unless combined with versioning | Medium — new endpoint, client reconnect logic | Reasonable (FastAPI has `StreamingResponse` / `WebSocket`) | Direct — canonical multi-user path |
| CRDT / op-based sync | None (convergent by construction) | High — library + op log + merge rules | Overkill; JSON-file + no DB makes op log awkward | Excellent but disproportionate |

### 1. Status quo (last-write-wins)

No code change. Documented above: toggle↔rename on the same row loses one write; two reorders of the same column lose one reorder entirely. Acceptable only if reorder operations are serialised at the UI level (e.g. board is read-only in a second tab).

### 2. Optimistic concurrency — `version: int` or `If-Match`

Add `version: int = 0` to each todo (`TodoResponse`, `TodoUpdate`). On PATCH, service checks that the body's `version` matches the stored record's; increments on save; returns 409 if mismatched. For reorder, the natural granularity is a per-column version (or a single list-level version for array-of-IDs).

Client handling on 409: refetch, reconcile (for a drag, the user sees the column jump back to its now-authoritative state and re-drags; for a single-field edit, a toast like "another tab changed this — try again"). Because `useTodos` already refetches after every mutation (`use-todos.ts:42, 52, 60`), the "refetch on conflict" branch reuses existing plumbing. No new infra, no new dependencies.

Race that remains: strictly none at the server boundary. Between refetch and retry the client can race with itself, but that's a UX question not a correctness one.

### 3. Per-record / file-level server lock

Wrap `storage.load`+`storage.save` in a `threading.Lock()` inside `JsonFileStorage`, or `fcntl.flock` on the file. Simple, serialises all writes.

Caveats: `threading.Lock` only covers one process; if uvicorn is ever started with `--workers > 1`, the lock does nothing and you need filesystem `flock` or an external mutex. Also, the `@lru_cache` dependency (`api/todos/dependencies.py:14-16`) returns the same `JsonFileStorage` instance within a process, so an instance-level `Lock` would actually work as long as uvicorn stays single-worker — but this is load-bearing invisibly, which is a smell.

Race that remains: none within one worker; inter-worker races unless `flock`.

### 4. BroadcastChannel / `storage` event for tab sync

Pure client concern. When tab A mutates, post a message on a `BroadcastChannel("todos")`; other tabs listen and call `refetch()`. Keeps tabs' UIs aligned without SSE. Does **not** fix the server race (two tabs can still issue racing PATCHes before either broadcast arrives), so it's a UX polish on top of one of the server-side options, not an alternative to them.

### 5. Server-Sent Events / WebSocket push

Push mutations from server to all connected tabs. Eliminates staleness between tabs because each tab sees the authoritative sequence of events. Does not, by itself, prevent two tabs from *submitting* conflicting writes — you still need versioning server-side for that. Heaviest of the options here but the only one that scales naturally to multi-user.

### 6. CRDT / operation-based sync

Worth naming for completeness. An op-log with a CRDT merge function (e.g. RGA for lists) gives conflict-free reorder by construction. Disproportionate for single-user and requires rethinking the JSON-file persistence model — every op is a record, not a snapshot.

## Existing-code failure modes worth flagging

- **`@lru_cache(maxsize=1)` on `get_storage` (`api/todos/dependencies.py:14-16`)** caches the `JsonFileStorage` *object*, not its data. `JsonFileStorage.load` still re-reads the file on every call (`api/core/storage.py:15-19`), so there is no staleness risk from the cache. But it also provides no synchronization; if anyone later adds an in-memory cache inside `JsonFileStorage`, the `lru_cache` suddenly matters for correctness. Name it.
- **`JsonFileStorage.save` is not atomic (`api/core/storage.py:21-23`).** `open(path, "w")` truncates immediately; a crash or kill between truncate and `json.dump` completion leaves an empty or partial file. The canonical fix is write-to-tempfile + `os.replace` — atomic on POSIX, cheap to add. Independent of the concurrency question but compounds it: a mid-write crash during a reorder loses the entire list.
- **Sync handlers on a threadpool (`api/todos/router.py:10-28`).** All routes are `def`, not `async def`, so uvicorn hands them to the default threadpool and requests genuinely interleave. If handlers were `async def` and storage were still sync, the interleaving would be coarser (one runs to completion between `await`s) — but neither is true here. The interleaving race is real.
- **No `updated_at` check, no `If-Modified-Since`.** The record already has `updated_at` (`api/todos/schemas.py:43-49`); a trivial first step toward optimistic concurrency is to require PATCH bodies to echo the last-seen `updated_at` and reject on mismatch. Weaker than a monotonic `version` (clock skew, same-millisecond writes) but zero-schema-change.

## Summary for the Kanban call

If reorder ships with the status quo, document "last tab to drop wins" as accepted behaviour and pair it with a BroadcastChannel refetch to at least make the loss visible quickly. If correctness matters, `version`-based optimistic concurrency is the proportionate fix on this stack and composes cleanly with any of the five ordering representations in `column-ordering.md`. Everything heavier (locks across workers, SSE, CRDT) is appropriate only if the app's single-user assumption changes.
