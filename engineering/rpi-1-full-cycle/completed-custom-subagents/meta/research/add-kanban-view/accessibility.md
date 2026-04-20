# Keyboard-only Movement & Accessibility Fallback

## TL;DR

- Drag-and-drop alone is not shippable. **WCAG 2.2 SC 2.5.7 (Dragging Movements, Level AA)** explicitly names task boards and requires a single-pointer (non-drag) alternative, and **WCAG 2.1 SC 2.1.1 (Keyboard, Level A)** requires every DnD outcome to be reachable from the keyboard. The board needs a non-drag path in addition to drag, not as a later polish.
- `@dnd-kit` gives a `KeyboardSensor` (Space/Enter to pick up and drop, arrows to move, Escape to cancel) plus live-region announcements out of the box, but the announcements ship in English only and use IDs (`"Picked up draggable item X"`) — they must be overridden via the `announcements` prop to produce position-aware, human-meaningful messages like `"Moved Buy tuna to Doing, position 2 of 5."` ([dnd-kit keyboard sensor](https://dndkit.com/api-documentation/sensors/keyboard), [dnd-kit accessibility](https://dndkit.com/guides/accessibility)).
- The most robust non-drag primary path for this codebase is a **"Move to…" menu on each card** combined with the **existing `Select` component for column/status**. Both are keyboard-native, screen-reader friendly, reuse components already in `web/src/components/`, and compose cleanly with drag-and-drop for mouse users. No audit has been done; flag AA-vs-keyboard-only scope to the user before building.

---

## Current accessibility baseline

The app has modest but correct a11y hygiene on the few things that exist. Grepping `aria-*`/`role`/`htmlFor` across `web/src/` finds: a polite live region wrapping the toast stack (`web/src/components/toast.tsx:42-43`, individual toasts `role="status"` at `:68`, close-button label at `:78`); `role="alert"` on the error state (`web/src/components/error-state.tsx:11`) and decorative-icon `aria-hidden` on empty/error illustrations (`empty-state.tsx:26`, `error-state.tsx:13`); `label htmlFor` wired into both form primitives (`input.tsx:16`, `select.tsx:19`); and explicit `aria-label` on every icon-only or ambiguous control in `todo-item.tsx` — the checkbox toggle (`:74`), the priority select (`:116`), and the destructive delete button (`:124`). The delete dialog uses the native `<dialog>` element with `aria-labelledby` (`confirm-delete-dialog.tsx:36`) and `showModal()`, so the browser handles focus trap and background inert-ing (`:18`). The checkbox primitive is a real `<input type="checkbox">` (`checkbox.tsx:13`) and inherits full keyboard + screen-reader semantics; the inline edit on `todo-item.tsx` handles Enter/Escape at `:58-65`. There is no skip-link, no landmark beyond a single `<main>`, no focus-visible audit, no reduced-motion handling, and no automated a11y testing in CI.

## @dnd-kit KeyboardSensor — what you get, what you don't

Default key bindings on `@dnd-kit/core`'s `KeyboardSensor`: Space or Enter picks the item up and, on a second press, drops it; Escape cancels and restores the item; arrow keys move in 25 px increments ([dnd-kit keyboard sensor](https://dndkit.com/api-documentation/sensors/keyboard)). The `@dnd-kit/sortable` preset overrides arrow-key handling via `getNextCoordinates` so arrows snap to the next sortable position rather than moving by pixels, which is what makes within-column reorder work. Cross-column behaviour is not free — you must compose multiple `SortableContext`s or collision-detection so that horizontal arrows jump columns; otherwise the keyboard user is stuck in the column they started in. The activator element must be focusable, which means the card itself (or a dedicated drag handle) must have `tabIndex={0}` and visible focus.

Announcements: `@dnd-kit/core` renders an off-screen polite live region and ships built-in strings such as `"Picked up draggable item {id}."`, `"Draggable item {id} was moved over droppable area {id}."`, `"Draggable item {id} was dropped over droppable area {id}"`, and `"Dragging was cancelled..."` ([dnd-kit accessibility](https://dndkit.com/guides/accessibility)). Three caveats that matter for this app: (1) strings are English-only — i18n is opt-in via the `announcements` prop; (2) the defaults leak raw IDs (UUIDv4 here) instead of titles, so a screen-reader user hears `"Picked up draggable item 735f335d-..."` unless overridden; (3) position-of-N phrasing ("item 3 of 7 in Doing") is recommended but not built-in — you compute it yourself in the announcement callbacks. Long-list ergonomics are also a concern: moving a card from the top of Todo to the bottom of Done via arrow keys is many keystrokes and the user has no "jump to end" shortcut by default.

## Non-DnD alternatives

`SC 2.5.7` approves several single-pointer patterns and calls out task boards specifically: "A task board that allows users to drag and drop items between columns also provides an additional pop-up menu after tapping or clicking on items for moving the selected element to another column." ([WCAG 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)). The survey below treats non-drag paths as *primary* and drag as the mouse-convenience overlay, which is the pattern Linear, GitHub Projects, and Notion converge on.

| Alternative | WCAG fit | Cognitive cost | Discoverability | Composes with DnD | Reuse in this codebase |
|---|---|---|---|---|---|
| **"Move to…" menu per card** (button or context menu opening a list of target columns) | Satisfies 2.1.1 and 2.5.7 cleanly; pattern explicitly named in 2.5.7 understanding doc | Low — matches user mental model ("move this to Doing") | High — a visible button is self-describing; context menu needs a hint | Excellent; users can drag *or* menu and both round-trip through the same mutation | No Menu/Popover primitive exists; would be new UI, but can be built on `<button>` + a simple list (no combobox semantics needed) |
| **Keyboard shortcuts** (`J`/`K` to navigate cards, `1`/`2`/`3` or `H`/`L` to set column, `?` to show cheatsheet) | Satisfies 2.1.1; by itself does **not** satisfy 2.5.7 (single-pointer, not keyboard) | Medium — learnable but not discoverable | Low unless a cheatsheet is provided; Linear uses `S` to open a status picker (see below) which hybridises this with a menu | Great; Linear-style shortcuts layer on top of any pointer path | Nothing exists; would need a global key handler + help dialog |
| **Status dropdown on the card** (existing `<Select>` with Todo/Doing/Done) | Satisfies 2.1.1 and 2.5.7 | Low — same component the user already uses for priority | High — always visible on every card | Excellent | Drop-in reuse of `web/src/components/select.tsx:11-42`; same pattern as the priority select at `todo-item.tsx:110-118` |
| **Cycling the existing checkbox** (tri-state: Todo → Doing → Done → Todo) | Technically keyboard-reachable, but replaces a native checkbox with a custom widget; ARIA `aria-checked="mixed"` exists but is semantically "partially checked", not "in progress" | High — surprising; hides the middle state behind a toggle | Medium — the control is visible, the behaviour is not | Poor — the affordance implies binary done/not-done, and competes with drag semantics | Would replace `todo-item.tsx:70-75` checkbox; loses native semantics; **not recommended** |
| **Edit-mode on the card** (open edit form, change status via dropdown, save) | Satisfies 2.1.1 and 2.5.7 | High — multi-step for a frequent action | Low for this purpose; edit is discoverable but users don't associate "edit" with "move column" | Redundant with the dropdown alternative — would only be the path if the card had no visible status control | Mechanism exists (`todo-item.tsx:31-55` already opens an edit affordance on title click) but extending it for status would duplicate the dropdown option at higher cost |

Tool precedent, as of April 2026: Linear's `S` opens an inline status picker and `Cmd/Ctrl+Option+1–9` jumps directly to a numbered state ([Linear keyboard shortcuts](https://keycombiner.com/collections/linear/), [Linear board layout docs](https://linear.app/docs/board-layout)); GitHub Projects documents drag-between-columns for the board ([GitHub Projects view layouts](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view)) and changes status via the item's property panel; Notion documents general block movement with `Cmd/Ctrl+Shift+Arrow` and edits board-card status through the card's property list rather than a dedicated shortcut ([Notion shortcuts](https://www.notion.com/help/keyboard-shortcuts)). The common thread is: drag for mouse, a per-card status control for everything else; dedicated shortcuts are a third layer aimed at power users and always backed by a menu.

## Announcements / live regions

`@dnd-kit/core` covers drag events once you localise its strings. Beyond that, the Kanban view should announce:

- **Card created** — currently the `ToastProvider` live region at `web/src/components/toast.tsx:42-43` is the codebase's only polite region; today it announces the "Marked complete" / "Priority updated" toasts. Piggy-backing on it for "Task created in Todo" is free.
- **Card moved via non-drag path** — when a user changes status via the dropdown or "Move to…" menu, dnd-kit's announcer is not involved. The toast region is the natural place; the message should carry the destination column and position (`"Buy tuna moved to Doing, position 2 of 5"`).
- **Column count changes** — the "N of M complete" line in `todo-list.tsx:87` is visual only. If kept in Kanban form it should have an `aria-live="polite"` wrapper or a dedicated status region per column so a screen reader hears "Doing: 3 items" when counts change.
- **Error states** — already covered by `role="alert"` on `ErrorState` (`error-state.tsx:11`) and toast error messages (`toast.tsx`). The pattern is reusable for failed moves.

A single app-wide polite region (the toast one) is sufficient; a second assertive region should be avoided unless we have a genuinely interrupting error, to keep screen-reader chatter low.

## Focus management

Focus destination after a move is a product call. Three reasonable options, ranked by disruption: (1) keep focus on the moved card in its new column — best for rapid successive moves, matches Linear's behaviour after `S`-then-pick; (2) focus the destination column header or the card's new neighbour — better if the card becomes offscreen; (3) return focus to the source location — only appropriate for undo-centric flows. Option (1) should be the default; implement by re-focusing the card's DOM node after the state update via a `ref` or `data-id`-based selector, matching the pattern used in `todo-item.tsx:35-40` for the edit input.

The existing `ConfirmDeleteDialog` (`confirm-delete-dialog.tsx:12-57`) uses the native `<dialog>` + `showModal()` API, which gives free focus trap, Escape-to-cancel (intercepted at `:25-28`), background inert, and `aria-labelledby`. Any Kanban confirmation (e.g. "Move all Done cards to Archive?") should reuse this pattern rather than rolling a new modal. For a lighter "Move to…" menu, a focus-trapped dialog is overkill — a popover that closes on outside-click/Escape and returns focus to the trigger button is enough.

## Application to this app

- No a11y audit has been performed. This is a teaching repo with a single user and the existing pass is "reasonable defaults, not certified." That context matters for scope-setting.
- **Flag for the user**: is the bar WCAG 2.2 AA (which pulls in SC 2.5.7 and makes a non-drag alternative mandatory) or "keyboard-usable" (which satisfies 2.1.1 but not 2.5.7)? The work differs — AA adds a mouse-click-without-drag path and means the `KeyboardSensor` alone is not sufficient evidence. Either way, non-drag alternatives are also needed for touch users with fine-motor constraints.
- **Suggested minimum bar to ship the Kanban mode** (assuming keyboard-usable, recommending AA):
  1. Every card reachable by Tab in a predictable order; visible focus via `focus-visible` (codebase already uses `focus-visible:outline-border-accent` on the checkbox and edit button — extend to cards).
  2. Status change possible without drag — either a per-card `<Select>` (cheapest, reuses `select.tsx`) or a "Move to…" button, **not** only a tri-state checkbox cycle.
  3. `@dnd-kit` configured with `KeyboardSensor` and a custom `announcements` prop that uses `todo.title` and position-of-N phrasing.
  4. Toast region reused to announce non-drag moves; `aria-live` on column counts.
  5. Focus stays on the moved card after a non-drag move; Escape cancels an in-progress keyboard drag.
  6. `ConfirmDeleteDialog`-style `<dialog>` for any new modal; popover-style menus return focus to trigger on close.

These six points together satisfy SC 2.1.1 for sure and SC 2.5.7 provided point 2 is implemented. Shortcuts (`J`/`K`, numeric status jumps) are optional polish that can ship later without blocking the minimum bar.

## Sources

- [WCAG 2.1 SC 2.1.1 Keyboard (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
- [WCAG 2.2 SC 2.5.7 Dragging Movements (Level AA)](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [dnd-kit KeyboardSensor reference](https://dndkit.com/api-documentation/sensors/keyboard)
- [dnd-kit accessibility guide](https://dndkit.com/guides/accessibility)
- [Linear keyboard shortcuts (KeyCombiner collection)](https://keycombiner.com/collections/linear/)
- [Linear board layout docs](https://linear.app/docs/board-layout)
- [GitHub Projects view layout docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view)
- [Notion keyboard shortcuts](https://www.notion.com/help/keyboard-shortcuts)
