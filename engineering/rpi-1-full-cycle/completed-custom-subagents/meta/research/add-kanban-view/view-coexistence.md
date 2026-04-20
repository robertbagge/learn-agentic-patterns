# View coexistence vs. replacement

## TL;DR

- Four broad shapes exist: Replace (Kanban only), Toggle (same route), Separate routes/tabs, and Hybrid. They differ most in URL shareability, per-user vs. per-device state, and how many places view-scoped state (filter/search/sort) can live.
- Current app is a single-view SPA with no router, no view preference, and a `completed: bool` on each todo (no `status` column) — so every option except Replace-without-fallback implies introducing *some* notion of "current view" plus a mapping from the existing shape into Kanban columns.
- The main trade-offs are reversibility (Replace is the hardest to walk back), discoverability (Hybrid is the weakest), and state complexity (Toggle and Separate-routes both introduce a persisted-preference question; Separate-routes additionally makes filters naturally view-scoped via URL).

## Current baseline (for context)

`web/src/App.tsx` mounts exactly one page (`TodosPage`) inside a `ToastProvider`. There is no router, no view-switching UI, and no persisted UI preference of any kind. The todo shape (`web/src/features/todos/types.ts`) carries only `completed: boolean` plus `priority`. Kanban columns therefore need to be *derived* (e.g. Todo = not completed & not started, Doing = …, Done = completed) or the model needs a new field — that is agent D's territory, but it shapes what each coexistence option actually *shows* on day one.

## Options

### 1. Replace

Kanban becomes the only view. `TodosPage` renders the board; the list view is removed.

- UX: one mental model, no toggle to learn. Loses the flat list affordance (rapid scan, keyboard-down-the-list editing, compact density). Filtering/sorting semantics change: "sort by priority" in a list is global; in Kanban it's per-column.
- State/persistence: no view preference needed — there is no alternative. Filters become board-global.
- Implementation cost: low in surface area (no toggle UI, no route), but highest product risk because list-only users are forced to adapt.
- Discoverability: N/A — Kanban *is* the app.
- Reversibility: lowest. Reintroducing list later is itself a coexistence decision redone.
- First-load for existing user: their data is list-shaped, so Done column fills with everything `completed=true` and the remainder lands in Todo. Doing would be empty unless a new field is introduced.

### 2. Toggle (same route)

One route, a control (tabs/segmented control/icon buttons) flips the render between list and Kanban. `useTodos` stays shared.

- UX: low cognitive cost, both affordances available. Toggle state is invisible to URL, so links always open in the user's last view (or the default).
- State/persistence: introduces a "view preference" question. Options: in-memory (resets on reload), `localStorage` (per-device, per-browser), API-backed (per-user across devices — but the app has no accounts, so this collapses to per-device anyway given the single-user scope in `docs/project.md`). Filters/search can be shared (one set, both views honour it) or view-scoped (each view has its own). Shared is cheaper and matches the "same data, different lens" framing.
- Implementation cost: low–medium. No router needed.
- Discoverability: medium. The toggle has to be visibly placed.
- Reversibility: high. Either view can be removed or promoted later with minimal blast radius.

### 3. Separate routes / tabs

`/` or `/list` renders the list, `/kanban` renders the board. Requires a router (agent B).

- UX: URL is shareable and bookmarkable ("send me a link to my board"). Back/forward works. Deep-linking to a filter on one view is possible if filters become query params.
- State/persistence: the URL *is* the view preference. Reloading a tab keeps the view. A "default landing route" decision remains (existing users probably land on `/list` to avoid surprise; new users could land on `/kanban`). Filters naturally scope to the view when encoded in the query string; cross-view filter sharing would have to be explicit (e.g. a shared store).
- Implementation cost: medium. Adds a router dependency and a navigation surface.
- Discoverability: high when navigation is a persistent tabset, low when it's only a URL.
- Reversibility: high — routes are cheap to add, rename, or retire.
- First-load for existing user: whichever route is the default. If `/kanban` becomes the default and the data is list-shaped, the initial impression is a two-column board (Todo/Done) with an empty Doing — worth weighing against landing them on the familiar list.

### 4. Hybrid

A middle shape. Examples: a "group by status" toggle *inside* the list that visually lays items out as columns; a compact Kanban strip embedded above the list; a list with a persistent "status" column that mimics Kanban semantics without a separate view.

- UX: potentially the least disruptive, but risks being neither — users looking for Kanban may not recognise the grouped list as one, and list users may find the extra chrome noisy.
- State/persistence: usually a single grouping/layout toggle; fewer preference surfaces.
- Implementation cost: can be the lowest (one component, conditional layout) *or* the highest (embedding a mini-Kanban that still needs DnD), depending on ambition.
- Discoverability: weakest — the Kanban capability is hidden inside the list's affordances.
- Reversibility: high for the grouped-list flavour, lower for the embedded-mini-Kanban flavour.

## Comparison table

| Option | URL-shareable view | View preference persists | Filter scope default | Router needed | Impl. cost | Discoverability | Reversibility |
|---|---|---|---|---|---|---|---|
| Replace | N/A | N/A | Board-global | No | Low | N/A | Low |
| Toggle (same route) | No | Needs explicit storage (local/API) | Shared or view-scoped (choose) | No | Low–Med | Medium | High |
| Separate routes | Yes | Via URL (+ optional default) | View-scoped via query params | Yes | Medium | High (with tabs) | High |
| Hybrid | Partial | Usually one toggle | Shared | No | Low–High | Low | Med–High |

## Cross-cutting questions

- **First-load for existing users**: any non-Replace option must pick a default. Landing existing users on the list preserves continuity; landing them on Kanban showcases the new capability but produces a lopsided board given today's `completed`-only model (Doing will be empty unless agent D introduces a status field or a derivation rule).
- **Filters/search scope**: two coherent stances. (a) *Global* — one filter bar, applies to whichever view is active; cheapest, matches "same data, different lens". (b) *View-scoped* — each view owns its filters (natural fallout of Separate-routes-with-query-params). Mixing the two (some filters shared, some scoped) is possible but adds explanation cost.
- **Per-device vs. per-user preference**: the app is single-user with no accounts (`docs/project.md`), so "per-user" effectively means "per-device" in practice. A `localStorage` preference is sufficient for Toggle; the URL is sufficient for Separate-routes.
- **Interaction with future features**: calendar/reminders (listed as "may come later" non-goals) would likely want their own view slot, which is a mild argument for a shape that already accommodates more than two views (Separate-routes or a Toggle that generalises to N views) rather than a bespoke list/Kanban switch.
