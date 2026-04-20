# Touch & Mobile Behaviour for a Kanban View

## TL;DR

- **Real Kanban apps split sharply on phones.** Trello/Jira/GitHub Projects keep the desktop horizontal-scroll layout and rely on native swipe; Linear and Basecamp's Card Table go one-column-per-screen with column-snap; Notion gives up on columns on phones entirely and renders the board as a single vertical stack. There is no industry consensus.
- **`@dnd-kit` handles the mechanics well on touch**, but only if you configure it deliberately: a `TouchSensor` (or `PointerSensor` with a `delay`) at roughly 200–250 ms with ~5 px tolerance, `touch-action: manipulation` (or `none` on a handle) to disambiguate from native scroll, and the built-in AutoScroller plugin, which already supports horizontal containers with an `x`/`y` threshold (default 20%).
- **For a 720 px-cap, zero-breakpoint codebase, the smallest honest increment is desktop-first.** Ship three columns side-by-side above a breakpoint, and on phones either fall back to horizontal scroll (cheapest, reuses the same DOM) or stack columns vertically (simplest on touch, no DnD edge cases, works without any responsive DnD tuning). A full swipe-snap/column-picker experience is a second iteration, not part of the minimum increment.

## 1. Layout patterns for multi-column boards on narrow viewports

| Pattern | Example(s) | When it works | When it fails | DnD interaction |
|---|---|---|---|---|
| **Horizontal scroll** (one long scrollable row) | Trello mobile web, Jira Cloud board, GitHub Projects board, Miro | Desktop parity; board power-users who know the structure | Phone users report it is "annoying" / slow to locate a card, per Trello UX research; fat-finger overscroll | Hardest: page scrolls horizontally *and* you want drag to move cards between columns; needs auto-scroll at both edges |
| **Stacked columns** (vertical stack, each column is a titled section) | Notion mobile board view (falls back to single column), most "responsive collapse" patterns | Low-effort responsive story, no new gestures, DnD is a pure vertical reorder per column | No simultaneous view of flow across columns — Kanban loses some of its point | Easiest: one `SortableContext` per column, vertical strategy, drag moves items between vertically stacked columns |
| **Single-column focus + column picker / segmented control** | Common in mobile PM apps; Linear uses a similar "grouping/filter" lens | Users who work one lane at a time (e.g. "Doing today") | Discoverability of cross-column moves; needs a "Move to…" sheet | DnD within the focused column is trivial; cross-column move becomes a menu action, not a drag |
| **Carousel / swipe-snap between columns** | Linear mobile, Basecamp Card Table ("each screen fits one column"), iPhone stock Reminders lists | One-column-per-screen, feels native, CSS scroll-snap handles the motion | Conflicts directly with touch-drag: the gesture to pan between columns is also the gesture to drag a card | Hardest to get right: either require a long-press to initiate drag so short swipes pan, or sacrifice cross-column drag and expose a "Move to…" action |

Observations from real apps:

- **Linear** on mobile uses horizontal scrolling between columns; docs confirm boards scroll horizontally and mention Shift-scroll on desktop ([Linear Board layout docs](https://linear.app/docs/board-layout)).
- **Trello** keeps horizontal scroll on mobile web; user research ([Carol Lien, Trello toggle view](https://carollien.com/trello-toggle-view/); [Atlassian community](https://community.atlassian.com/forums/Trello-questions/Is-there-a-way-to-vertically-scroll-the-entire-board-or-all/qaq-p/1069391)) repeatedly flags it as frustrating on small screens.
- **Jira** Cloud board preserves horizontal scroll + configurable swimlanes; swimlanes are horizontal categorisations and don't collapse on phones ([Atlassian swimlanes](https://support.atlassian.com/jira-software-cloud/docs/configure-swimlanes/)).
- **GitHub Projects** offers board layout on mobile apps and lets you drag between columns ([GitHub Projects board layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout)); narrow-viewport behaviour is effectively horizontal scroll.
- **Notion** explicitly drops columns on phones — "there are no columns on mobile, and any column structure… will be collapsed to a single column" ([Notion mobile help](https://www.notion.com/help/notion-for-mobile)). Boards fall back to a vertical list grouped by status.
- **Basecamp Card Table** chose the swipe-snap pattern, with subtle haptic feedback on pickup/drop ([37signals: Bringing Card Table to the small screen](https://dev.37signals.com/bringing-card-table-to-the-small-screen/)).

## 2. Touch DnD ergonomics

- **Long-press to initiate drag.** `@dnd-kit`'s `TouchSensor` exposes `activationConstraint.delay` + `tolerance`; community sources report a default of ~250 ms / 5 px, and the issue tracker confirms 0 ms delay is possible when touch-action is set correctly ([dnd-kit #1398](https://github.com/clauderic/dnd-kit/issues/1398)). Typical Kanban values in the wild: 150 ms feels twitchy, 250 ms is the sweet spot, 500 ms starts feeling sluggish. iOS Reminders/Files uses ~500 ms; Basecamp uses ~250 ms with haptics.
- **Auto-scroll while dragging.** `@dnd-kit` ships an AutoScroller plugin that detects the nearest scrollable ancestor and scrolls when the pointer enters the outer 20% of the container (`threshold: { x: 0.2, y: 0.2 }`, `acceleration: 25`). It works for horizontal containers — this is the plugin you need if you pick horizontal-scroll layout ([AutoScroller docs](https://dndkit.com/extend/plugins/auto-scroller)).
- **Press-hold vs native scroll.** `@dnd-kit` recommends `touch-action: manipulation` on draggables, or `touch-action: none` on a dedicated drag handle so the surrounding list can still scroll ([Pointer sensor docs](https://dndkit.com/api-documentation/sensors/pointer), [Touch sensor docs](https://dndkit.com/api-documentation/sensors/touch)). Touch events can `preventDefault` inside `touchmove`, which is why the Touch sensor is preferred over the Pointer sensor on phones.
- **Tremor / reduced dexterity.** A long-press-then-drag gesture is hard for users with hand tremor; the accepted mitigation is a secondary "Move to…" action sheet on tap (covered in the accessibility topic). This is not mutually exclusive with DnD.
- **Alternative: tap-hold → action sheet.** Several mobile task apps skip card-dragging entirely in favour of a tap/long-press that opens a "Move to column" menu. Cheaper to ship, accessible by default, loses the tactile satisfaction of DnD.

## 3. Visual feedback for touch

- **Lift animation + shadow.** Standard pattern: scale ~1.02–1.05, elevate shadow on pickup, translucent "ghost" in the source column. `@dnd-kit`'s `DragOverlay` renders the dragged element outside the DOM tree so transforms don't fight layout.
- **Drop-zone highlighting.** Column tint (e.g. a faint `--color-accent-primary` background) on the hovered column; a placeholder gap in the target list.
- **Haptic feedback.** Available via `navigator.vibrate()` on Android Chrome and most Chromium mobile browsers; iOS Safari does **not** support the Vibration API, so iOS users only get haptics inside PWAs via the iOS haptic hooks or on drag-pickup through native behaviours. Use sparingly — Vibration API guidance is "only on meaningful events: success, error, long-press confirmation, drag snap" ([MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API); [web-haptics overview](https://blog.openreplay.com/haptic-feedback-for-web-apps-with-the-vibration-api/)).
- **Low-end Android performance.** `DragOverlay` + CSS transforms is cheap; avoid per-frame React state updates. `@dnd-kit`'s built-in `closestCorners` / `closestCenter` collision detection is O(n) in draggables, fine for dozens of cards but worth measuring if a column grows to hundreds.

## 4. `@dnd-kit` specifics verified

- **Auto-scroll at viewport edges:** yes, via AutoScroller plugin; independent `x` and `y` thresholds; works on horizontal containers ([AutoScroller docs](https://dndkit.com/extend/plugins/auto-scroller)).
- **Touch sensor activation:** `activationConstraint: { delay, tolerance }` or `{ distance }`; delay is milliseconds, tolerance is pixels of motion that aborts the drag ([TouchSensor docs](https://dndkit.com/api-documentation/sensors/touch)).
- **Horizontal scroll containers:** supported; the Kanban example in the repo uses `horizontalListSortingStrategy` for columns and vertical strategies within each column.
- **React 19:** works in practice per the drag-and-drop.md sibling research; pin versions, test on real devices. The newer `@dnd-kit/react` 0.x rewrite has an experimental TouchSensor alternative ([dnd-kit #1723](https://github.com/clauderic/dnd-kit/issues/1723)).

## 5. Application to this app

The codebase today is a single `TodosPage` capped at `max-w-[720px]` with **zero** Tailwind responsive prefixes (see `ui-structure.md`). Any Kanban view invents the responsive story from scratch. Trade-offs of the plausible paths, ordered by increment size:

1. **Desktop-first, single fallback.** Ship three fixed-width columns side-by-side on desktop (remove/raise the `max-w-[720px]` cap for the board view only). On phones, fall back to **vertical stacking** — each column becomes a titled section, `SortableContext` per section, drag works vertically across sections. Zero new gestures, no auto-scroll edge cases, no swipe/drag disambiguation. Cheapest to implement, ugliest on desktop→mobile transition (you lose the "flow" mental model on phones).
2. **Desktop-first with horizontal-scroll fallback.** Same desktop layout; on phones the three columns live in an `overflow-x-auto` container. Reuses the exact same DOM as desktop. Requires the AutoScroller plugin to be enabled and the page-level `touch-action` rules tuned so that drag inside a card doesn't start a page pan. Matches Trello/Jira/GitHub behaviour — and inherits their known "annoying on small screens" UX.
3. **Mobile-first carousel / swipe-snap.** Scroll-snap between one-column-per-screen views, haptics on pickup, long-press drag. Matches Linear/Basecamp. Most work by far: breakpoints, snap behaviour, drag-vs-swipe disambiguation, and likely a "Move to…" action as a drag alternative.

For a minimal codebase whose design system is dark-only, has no router, and currently does not ship a single breakpoint, option **1** is the smallest honest increment; option **2** is a one-class addition on top of that (`md:flex` + `overflow-x-auto`) and is probably the right target if the team wants parity with desktop behaviour. Option 3 is a separate project.

Recommended minimum: do option 1 (or 2), skip haptics, use `@dnd-kit`'s `TouchSensor` with `{ delay: 200, tolerance: 5 }` and `touch-action: manipulation` on the card, enable AutoScroller with defaults. Treat swipe-snap, haptics, and a "Move to…" sheet as follow-ups.

## Sources

- [Linear Board layout](https://linear.app/docs/board-layout)
- [Trello horizontal scroll UX research (Carol Lien)](https://carollien.com/trello-toggle-view/)
- [Atlassian community: vertical scroll on Trello](https://community.atlassian.com/forums/Trello-questions/Is-there-a-way-to-vertically-scroll-the-entire-board-or-all/qaq-p/1069391)
- [Atlassian: Configure swimlanes (Jira)](https://support.atlassian.com/jira-software-cloud/docs/configure-swimlanes/)
- [GitHub Projects: Customizing board layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout)
- [Notion: Notion for mobile](https://www.notion.com/help/notion-for-mobile)
- [37signals: Bringing Card Table to the small screen](https://dev.37signals.com/bringing-card-table-to-the-small-screen/)
- [@dnd-kit AutoScroller plugin](https://dndkit.com/extend/plugins/auto-scroller)
- [@dnd-kit Touch sensor](https://dndkit.com/api-documentation/sensors/touch)
- [@dnd-kit Pointer sensor](https://dndkit.com/api-documentation/sensors/pointer)
- [dnd-kit issue #1398 — touch activation delay](https://github.com/clauderic/dnd-kit/issues/1398)
- [dnd-kit issue #1723 — experimental TouchSensor alternative](https://github.com/clauderic/dnd-kit/issues/1723)
- [MDN: Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [OpenReplay: Haptic feedback with the Vibration API](https://blog.openreplay.com/haptic-feedback-for-web-apps-with-the-vibration-api/)
