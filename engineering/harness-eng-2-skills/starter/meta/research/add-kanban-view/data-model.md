# Data Model: Adding a Kanban Mode

## TL;DR

- Today a todo is a **boolean `completed` flag** (`api/todos/schemas.py:47`, `web/src/features/todos/types.ts:7`) — it cleanly models two states (open / done) but has no room for the middle Kanban column (Doing).
- Kanban needs **three mutually exclusive states** (Todo / Doing / Done). Two viable options: (1) add a first-class `status` enum and derive `completed` for back-compat, or (2) keep `completed` and add a narrow `in_progress: bool` flag. Option 1 is cleaner; option 2 is lower-risk for migration.
- Persisted data is a plain JSON array on disk (`api/todos.json`, loaded by `api/core/storage.py:15-19`). There is **no schema version, no migration layer, no DB**. On first load under a new model, any missing field either needs a default in Pydantic or a one-shot read-time coercion in `TodoService.list` / `JsonFileStorage.load`.

---

## 1. Current task shape

Server (Pydantic) — `api/todos/schemas.py`:

| Field | Type | Default | Source |
|---|---|---|---|
| `id` | `str` (UUID4) | generated in service | `schemas.py:44`, `service.py:30` |
| `title` | `str` (1–200, stripped, non-blank) | required | `schemas.py:15`, `:18-24` |
| `priority` | `Literal["low","medium","high"]` | `"medium"` | `schemas.py:7`, `:16` |
| `completed` | `bool` | `False` on create | `schemas.py:47`, `service.py:33` |
| `created_at` | `datetime` (ISO-8601 UTC str in storage) | `_now()` on create | `schemas.py:48`, `service.py:28,34` |
| `updated_at` | `datetime` | `_now()` on create/update | `schemas.py:49`, `service.py:35,48` |

`TodoCreate` (`schemas.py:14`) accepts only `title` + `priority`; `TodoUpdate` (`schemas.py:27`) accepts `title`, `priority`, `completed` — all optional, patched via `model_dump(exclude_unset=True)` (`service.py:46`).

Client mirror — `web/src/features/todos/types.ts:3-10` (`Todo`), `:12-15` (`TodoCreate`), `:17-21` (`TodoUpdate`). Shapes are identical to the server.

Sample persisted row — `api/todos.json:2-9`:

```json
{ "id": "735f335d-...", "title": "Buy tuna", "priority": "medium",
  "completed": false, "created_at": "2026-04-17T22:44:53...", "updated_at": "..." }
```

## 2. How "done" is represented today

A single boolean: `completed: bool` (`schemas.py:47`). Two possible states: `false` (open) or `true` (done). The UI drives it via a checkbox toggle (`web/src/features/todos/components/todo-item.tsx:70-75`, `todo-list.tsx:44-48`) and renders with strikethrough styling (`todo-item.tsx:95`). The stats line "X of N complete" is a simple filter (`todo-list.tsx:76-77`).

Kanban instead needs **three** exclusive buckets: `todo`, `doing`, `done`. A bool is insufficient — no distinction between "not started" and "in progress".

## 3. Migration impact on persisted data

Storage is a raw JSON file (`api/core/storage.py:11-23`) with no version tag. Pydantic validates on the wire, not on disk reads — `storage.load()` returns `list[dict]` that flows straight into `service.list()` (`service.py:20-25`) which re-sorts and returns dicts. The dicts are only re-validated when `TodoResponse.model_validate(...)` is called at the edge (`router.py:12,17,22`).

Implications for first-load under a new model:

- **Old rows lack the new field.** If `TodoResponse` declares a required `status` field, `model_validate` on legacy rows raises `ValidationError` → the `GET /todos/` endpoint breaks.
- **Fix options:** (a) give the new field a default on `TodoResponse` so missing keys fall back; (b) do a read-time migration inside `JsonFileStorage.load` or `TodoService.list` that fills in the field and re-saves once; (c) bump a `schema_version` key on the file and migrate lazily. All three are cheap because the file is small and single-tenant.
- **Write path** already uses `todo.update(patch)` + re-save (`service.py:47-49`), so any new field will be persisted correctly after the first update.

## 4. Options for status representation

| Option | Shape | Pros | Cons |
|---|---|---|---|
| **A. Enum `status`** (replace `completed`) | `status: Literal["todo","doing","done"]`, default `"todo"` | One source of truth; extensible (add `"blocked"` later); natural for Kanban | Breaking for API clients; must migrate legacy rows (`completed:false → "todo"`, `true → "done"`); UI checkbox semantics change |
| **B. Enum `status` + keep `completed` as derived** | Add `status`; keep writing `completed = (status == "done")` | Back-compatible reads for anything still keyed on `completed`; migration path: derive `status` from `completed` on first read | Two fields to keep in sync; risk of drift if only one is patched via `TodoUpdate` |
| **C. Add narrow `in_progress: bool`** | Keep `completed`; add `in_progress`, default `false` | Smallest diff; trivial migration (missing key → `false`) | Two booleans modelling a tri-state invites illegal combos (`in_progress && completed`); needs validator to forbid them; doesn't extend past 3 columns |
| **D. Derived columns from `completed` only** | No schema change; Todo+Doing share the `completed:false` bucket | Zero migration | Fails requirement — can't distinguish Todo from Doing; not actually Kanban |

**Recommendation direction:** Option A is the cleanest long-term model; Option B is the pragmatic middle ground if other code or external consumers depend on `completed`.

## 5. Derived vs. stored state

Kanban columns **cannot** be derived from the current `completed` bool alone — you lose the Todo/Doing split. Something tri-state must be stored. However, `completed` itself can become **derived** from `status` (option B) so the UI's existing filter (`todo-list.tsx:76-77`) and any external readers keep working without change.

Priority-based bucketing is unrelated (`service.py:9,22-25`) and can remain a within-column sort concern (agent F's territory).

## 6. Ripple effects

- **Validation (`schemas.py`)** — `TodoCreate` needs a default for the new field; `TodoUpdate` needs to accept status transitions; if option C, add a `model_validator` rejecting `in_progress && completed`.
- **Serialization** — `TodoResponse` (`schemas.py:43`) and the TS `Todo` (`types.ts:3`) must add the new field in lockstep; the API client (`web/src/features/todos/api.ts`) is type-only so it updates automatically.
- **Service layer (`service.py:27-40`)** — `create()` hard-codes `"completed": False`; swap to `"status": "todo"` (or set both under option B).
- **Storage (`core/storage.py`)** — optionally add a one-shot upgrade on `load()` to backfill legacy rows; otherwise rely on Pydantic defaults.
- **UI filtering / stats** — `todo-list.tsx:76-77` computes `completed = todos.filter(t => t.completed).length`; under option A this becomes `status === 'done'`. The Kanban view itself will partition by status; the existing list view can either stay bool-based (option B) or switch to the enum (option A).
- **Toggle semantics (`todo-list.tsx:44-48`, `todo-item.tsx:70-75`)** — the checkbox currently flips a bool; under a tri-state it either becomes a status-cycling control or is replaced by the column drag (agent A/B's concern, but worth flagging that the data change removes the natural "toggle" affordance).
- **Sorting** — `service.list()` sorts by `(priority desc, created_at asc)` (`service.py:22-25`) and is status-agnostic, so it keeps working; Kanban column order is a separate concern.
