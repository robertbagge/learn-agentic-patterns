# Drag-and-Drop for the Kanban View

## TL;DR

- **Stack:** React 19.2 + Vite 8 + TypeScript 6 + Tailwind v4 (Bun-managed). Strict ESM, function components, no state library.
- **Recommendation:** Use **`@dnd-kit`** (specifically the `@dnd-kit/core` + `@dnd-kit/sortable` combo, or the newer `@dnd-kit/react` adapter if its 0.x API is acceptable). It is the de-facto community standard in 2026, is actively maintained, has first-class keyboard + touch + screen-reader support, and handles both column-move and within-column reorder out of the box.
- **Runners-up:** Atlassian's `pragmatic-drag-and-drop` is smaller and powers Jira/Trello, but leans lower-level and inherits HTML5 DnD's touch/a11y baggage unless you bolt on its optional packages. Native HTML5 DnD is a non-starter for a Kanban that should work on mobile and for keyboard users.

## 1. Stack context

The `web/` workspace is a Vite 8 SPA using React 19.2 and TypeScript 6, styled with Tailwind v4 via `@tailwindcss/vite`, and lightly componentized with `class-variance-authority` + `clsx`. There is no router, no state library, and no data-fetching library — the app is a single `TodosPage` under a `ToastProvider`. Package manager is Bun (`bun.lock`). The toolchain is ESM-only and tree-shakes well, so bundle cost of any tree-shakeable DnD library is roughly "what you actually import." There is no existing DnD dependency to migrate from.

## 2. Options survey

### Native HTML5 Drag and Drop

The browser's built-in `dragstart`/`dragover`/`drop` API works without dependencies and is fine for "drag a file onto a dropzone." For a Kanban, it has three disqualifying problems, all well-documented:

- **Touch:** The spec is bound to `MouseEvent`. Chrome, Firefox, and Safari do not fire drag events for touchscreens, so mobile users get nothing without a polyfill (`drag-drop-touch`, `mobile-drag-drop`).
- **Accessibility:** No keyboard story, no screen-reader announcements, no focus management. You would have to build an alternative reorder mechanism from scratch to be inclusive.
- **Ergonomics:** The API was designed in IE5 (1999) and is full of quirks (e.g. `dragenter` firing on children, `dataTransfer` restrictions during `dragover`, flaky drop previews). Every serious Kanban UI ends up re-implementing what libraries already solve.

Useful as a primitive; inappropriate as the full solution here.

### @dnd-kit

Actively maintained by Claudéric Demers. Latest `@dnd-kit/core` is stable at 6.3.x; a rewritten `@dnd-kit/react` (0.4.x as of April 2026) is in progress with a simpler hook API but still pre-1.0. React 19 works in practice; there is no hard incompatibility, though you should pin versions and test. The library is pointer-event based (not HTML5 DnD), so touch and stylus work without polyfills, and it ships a `KeyboardSensor` plus `@dnd-kit/accessibility` utilities (live-region announcements, screen-reader instructions). Core is ~6 KB gzipped; `@dnd-kit/sortable` adds the reorder preset used by Kanban columns. Two APIs worth knowing:

- `DndContext` + `useDraggable` / `useDroppable` for arbitrary zones (good for cross-column moves).
- `SortableContext` + `useSortable` for within-column ordering with built-in animation.

Kanban is their canonical example; official and community recipes exist for the Todo/Doing/Done shape.

### pragmatic-drag-and-drop (Atlassian)

Atlassian's successor to `react-beautiful-dnd`, and what they run Jira, Confluence, and Trello on. Core is ~4.7 KB, framework-agnostic (it is a thin layer over HTML5 DnD plus adapters). Actively maintained. Strengths: very small, excellent for huge lists, handles external drag sources (files, text) naturally. Weaknesses: because it uses the native HTML5 API under the hood, touch support and accessibility are *not* free — you need the optional `react-accessibility` package for keyboard/screen-reader support, and mobile behavior depends on browser quirks. API is lower-level than dnd-kit; you write more glue code for a Kanban. Some optional sub-packages still have open issues around React 19.

### react-beautiful-dnd / @hello-pangea/dnd

`react-beautiful-dnd` is **deprecated** and archived by Atlassian; npm emits a warning on install. `@hello-pangea/dnd` is the community fork that kept it alive through React 18. It has the nicest Kanban API of anything ever shipped, but it is a maintenance fork, not a forward-looking project, and Atlassian's own recommended migration path points at pragmatic-drag-and-drop. Not a good choice for a new 2026 codebase.

### react-dnd

Long-running HTML5-based library with a backend abstraction. React 19 support is still tracked as an open issue (#3655) and has lagged. API is heavier (providers, backends, monitor), a poor fit for a small app, and touch needs the separate `react-dnd-touch-backend`. Skip.

### SortableJS / react-sortablejs

Solid, battle-tested JS library with React bindings. Works on touch. Accessibility is weaker than dnd-kit's (no built-in keyboard sensor with screen-reader announcements). Fine for a pure sortable list, less idiomatic in a React 19 + hooks world. Reasonable fallback, not the primary pick.

### formkit/drag-and-drop, Gridstack

Formkit DnD is still pre-1.0 with known mobile and keyboard gaps. Gridstack is grid/dashboard-focused, not list/column-focused. Neither fits a standard Kanban.

## 3. Comparison

| Library | Status (Apr 2026) | Core bundle | Touch | Keyboard / a11y | Kanban fit | React 19 |
|---|---|---|---|---|---|---|
| Native HTML5 | Built in | 0 KB | Broken without polyfill | None | Poor | n/a |
| @dnd-kit | Active, standard | ~6 KB + sortable | First-class (pointer) | Built-in sensor + live regions | Excellent | Works |
| pragmatic-drag-and-drop | Active (Atlassian) | ~4.7 KB | Via HTML5 (caveats) | Via optional package | Good, lower-level | Mostly; some sub-packages lag |
| @hello-pangea/dnd | Community fork | ~30 KB | Yes | Yes | Excellent API | Fork-maintained |
| react-beautiful-dnd | Deprecated | ~30 KB | Yes | Yes | — | No |
| react-dnd | Slow | Medium | Separate backend | Limited | OK | Open issue |
| react-sortablejs | Sustained | Small | Yes | Weak | OK for single list | Compatible |

## 4. Recommendation

Use **`@dnd-kit`** (`@dnd-kit/core` + `@dnd-kit/sortable`, optionally `@dnd-kit/accessibility`). It is the best match for this stack on every axis that matters here: actively maintained, tree-shakeable into a Vite bundle, pointer-event-based so touch works without a polyfill, keyboard and screen-reader support are built in rather than opt-in, and it has a well-known Kanban pattern (one `DndContext`, three `SortableContext`s — one per column — with `rectSortingStrategy` or `verticalListSortingStrategy`). Persistence is orthogonal: on `onDragEnd`, compute the new column + index and write to whatever storage the todos feature already uses.

Pragmatic DnD is the honest runner-up and would be a reasonable pick if bundle size were critical or if we expected to drag files in from outside the app. For a small, local Kanban with Todo/Doing/Done columns, dnd-kit's higher-level ergonomics and accessibility defaults outweigh its slightly larger footprint.

Sources:
- [dnd-kit vs react-beautiful-dnd vs Pragmatic DnD 2026 (PkgPulse)](https://www.pkgpulse.com/blog/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026)
- [Top 5 Drag-and-Drop Libraries for React in 2026 (Puck)](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [dnd-kit GitHub repository](https://github.com/clauderic/dnd-kit)
- [pragmatic-drag-and-drop (Atlassian)](https://github.com/atlassian/pragmatic-drag-and-drop)
- [react-beautiful-dnd deprecation notice](https://github.com/atlassian/react-beautiful-dnd/issues/2672)
- [react-dnd React 19 support issue](https://github.com/react-dnd/react-dnd/issues/3655)
- [HTML Drag and Drop API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Taming the dragon: Accessible drag and drop (React Aria)](https://react-aria.adobe.com/blog/drag-and-drop)
