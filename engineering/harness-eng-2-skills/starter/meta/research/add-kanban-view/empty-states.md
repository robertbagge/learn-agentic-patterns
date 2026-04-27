# Empty States and Column Affordances

A survey of how widely-used Kanban tools handle empty columns, add-card
affordances, and first-run states, translated to this single-user todo
app's context.

## TL;DR

- **Every surveyed tool keeps a persistent per-column add affordance**
  (usually a `+` at the top or `+ Add item / Add a card` at the bottom).
  Global "new" controls exist but none of the tools rely on them alone.
- **Empty columns are almost never *visually* empty.** The common shape
  is a column header with count (often `0`), the add affordance still
  visible, and either blank space or the whole column functioning as a
  drop target. Placeholder copy ("Drop here", "No items") is rare in
  the big tools — it shows up more often in bespoke implementations.
- **Two cross-tool divergences matter for this app:** (a) whether empty
  columns are *hidden* by default (Linear, Notion offer toggles;
  GitHub auto-hides under filters; Trello/Jira never hide), and (b)
  where the `+` lives — Linear puts it in the header, Trello/GitHub
  put it at the bottom, Notion does both. The placement decision
  changes how "empty" reads visually.

---

## Per-tool observations

### Linear

- **Empty column:** Columns are shown by default, but a view option
  `Show empty groups` lets users toggle them off. No ghost card or
  drop-zone text documented — the column sits with its header and
  blank body.
- **Add-card affordance:** `+` sign at the **top of the column**, next
  to the column name. Also `c` keyboard shortcut for "create issue",
  and a command-menu entry.
- **Header:** Status name, count. WIP limits exist but "enforcement
  varies by plan" — some tiers display the count against the limit,
  others just show the count.
- **Column customization:** Columns are derived from the Status
  field. Users can hide columns via the `...` menu; renaming/adding
  statuses happens at the workflow settings level, not inline on the
  board.
- **First-run:** Defaults to grouping by Status with the workflow's
  default statuses (Backlog, Todo, In Progress, Done, Cancelled).
  Empty board = empty columns.
- **Drag targets:** Column is the drop target; dropped cards land at
  the top or bottom depending on drop position.
- Sources: [Board layout — Linear docs](https://linear.app/docs/board-layout),
  [ToolStack Linear review](https://toolstackpm.com/tools/linear/features/kanban-boards).

### Trello

- **Empty column ("list"):** No placeholder card. The list shows its
  title, any collapse/menu controls, and the "Add a card" button.
  Community posts note the add-button "sometimes disappears" on
  empty or near-empty lists — i.e., Trello's own implementation has
  had edge-case bugs here.
- **Add-card affordance:** Persistent `+ Add a card` button at the
  **bottom** of every list. Keyboard shortcut `n` while hovering a
  list. Clicking expands an inline input; the input stays open for
  consecutive adds.
- **Header:** List name, `...` menu. Counts are not shown by default
  (you install a Power-Up or use WIP-limit extensions to surface
  them).
- **Column customization:** Add, rename, archive, reorder (drag),
  recolor lists freely. No hard limit.
- **First-run:** New boards created from scratch show empty lists
  ("To Do / Doing / Done" in many templates) or a blank board with a
  single prompt to create the first list.
- **Drag targets:** The whole list body is a drop zone; cards insert
  between existing cards or at top/bottom.
- Sources: [Add and customize cards and lists](https://support.atlassian.com/trello/docs/add-and-customize-cards-and-lists/),
  [Trello 101](https://trello.com/guide/trello-101),
  [Add-button disappears on empty list](https://community.atlassian.com/forums/Trello-questions/Add-Button-sometimes-do-not-work-disappear-when-a-list-have-zero/qaq-p/2799993).

### GitHub Projects (v2)

- **Empty column:** Column is visible with its status label. When a
  filter would otherwise produce an empty column, GitHub *auto-hides*
  it — users have asked for manual hide controls too.
- **Add-card affordance:** `+ Add item` button at the **bottom** of
  each column; supports adding draft issues or linking existing
  issues via typeahead.
- **Header:** Displays `current count / limit` when a column limit
  is configured. Count is highlighted when over the limit.
- **Column customization:** Columns come from the Status (or another
  single-select) field. Add columns inline via `+` at the right edge;
  rename/reorder from field settings.
- **First-run:** Empty board shows the three default statuses (Todo,
  In Progress, Done) with zero items.
- **Drag targets:** Column body is the drop target.
- Sources: [Customizing the board layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout),
  [Hide empty column discussion](https://github.com/orgs/community/discussions/10153).

### Notion

- **Empty column ("group"):** Visible by default. A view option
  `Hide empty groups` collapses them. Column headers show a small
  **gray count number** next to the group name.
- **Add-card affordance:** `+ New` at the **bottom** of every
  group, *and* a top-right `+ New` on the view's header for the
  default group. Per-group inline create uses the grouping property
  to pre-fill the status.
- **Header:** Group name, count, `...` menu for hide/rename-via-
  property.
- **Column customization:** Columns follow whichever property you
  group by; change the grouping to reshape the board. Drag columns
  to reorder. Sub-groups are supported.
- **First-run:** If the database has a Status property, it's used
  automatically; if not, Notion creates one with default values.
- **Drag targets:** Group body is the drop zone.
- Sources: [Board view — Notion help](https://www.notion.com/help/boards),
  [Add column in Notion Kanban](https://www.notionapps.com/blog/notion-kanban-add-column).

### Jira

- **Empty column:** Visible, no placeholder card. Column header
  changes color when WIP constraints are violated: **red** for max
  exceeded, **yellow** for min not met.
- **Add-card affordance:** No persistent per-column `+`. Items come
  from the backlog, a global `Create` button, or (on Kanban boards)
  a `+` near the column header that's less prominent than
  Trello/GitHub's.
- **Header:** Name, count, optional `MIN / MAX` WIP badges. On
  narrow viewports the WIP badge drops but the count remains.
- **Column customization:** Add, rename, reorder (drag from header),
  delete. Column-to-status mapping is explicit.
- **First-run:** New Kanban boards start with `To Do / In Progress /
  Done` mapped to the standard workflow.
- **Drag targets:** Column body; some boards show a subtle tinted
  drop indicator.
- Sources: [Configure columns — Jira Cloud](https://support.atlassian.com/jira-software-cloud/docs/configure-columns/),
  [WIP limit display community thread](https://community.atlassian.com/forums/Jira-questions/Display-wip-limits-on-kanban-board/qaq-p/2546607).

---

## Patterns (what's common across tools)

1. **Persistent per-column add affordance.** Every surveyed tool has
   one. Placement differs (Linear: top; Trello/GitHub/Notion: bottom;
   Jira: least prominent), but none hide it behind a hover alone for
   empty columns.
2. **The whole column body is the drop target.** No tool surveyed
   uses a distinct "ghost card" slot that shrinks the drop area to
   a single rectangle. Empty columns accept drops anywhere in the
   column.
3. **Count lives in the header.** All except Trello-by-default show
   an item count. Notion's gray number style is the minimal form;
   GitHub and Jira overload it with limit info.
4. **Empty-column hiding is an option, not a default.** Linear,
   Notion, and (via filters) GitHub support hiding; Trello and Jira
   don't. When available, it's a view toggle — the state isn't
   destructive.
5. **First-run = three default columns, no cards.** Nobody tries to
   seed Doing; new boards are expected to start empty and get filled
   through use. No tool shows an onboarding splash *inside* a column.

## Divergences (where the tools meaningfully differ)

- **Add-button placement.** Top-of-column (Linear) pairs nicely with
  "newest at top" ordering. Bottom-of-column (Trello, GitHub,
  Notion) pairs with "append to end," which is also the default
  cross-column move policy on most tools.
- **Empty-column copy.** None of the big tools put meaningful
  placeholder text *inside* the column body. Bespoke Kanban
  implementations often do ("No items — drag one here"), but the
  surveyed tools leave empty columns quiet.
- **Count semantics.** Trello shows none by default, Notion a muted
  number, GitHub/Jira a count with limit arithmetic. This
  correlates with each tool's degree of process-formality.
- **Single vs. multi-view.** Trello is board-first. Linear, Notion,
  Jira, and GitHub are list-first with a board *view*. The view
  metaphor affects whether the board has its own "add" concept or
  inherits the list's.

---

## Applied to this app

The app is a single-user personal todo list, currently shipping one
narrow list view with a global `TodoCreateForm` above it (see
`ui-structure.md` §"Current list-view composition"). There is no
`status` field today, so on migration, Doing will be empty for
existing users unless a backfill heuristic runs (see `research.md`
§cross-tension #3).

Four concrete patterns the planner could pick from, each neutral:

### Pattern 1 — "Trello-native"

- Persistent `+ Add a task` at the bottom of each column, inline
  expanding input.
- `TodoCreateForm` is **absorbed into the Todo column** (new items
  always start in Todo), or moved into whichever column is active.
- Empty columns render header + the add button + blank body.
- **Trade-offs:** Familiar, low cognitive overhead. But the existing
  `TodoCreateForm` component is a richer form (title + priority
  select + submit button in a `Card` shell); collapsing it into an
  inline affordance means either shrinking the form or keeping a
  fuller version at the top of Todo. Priority would either move
  inside the inline form or get picked post-creation.

### Pattern 2 — "Linear-native"

- `+` in each column header opens a small create popover.
- `TodoCreateForm` stays **global** (above or in a page header), so
  there are two entry points: global form (always lands in Todo)
  and per-column `+` (lands in that column).
- Empty columns render header-with-`+` and blank body; an optional
  `Hide empty groups` view toggle exists.
- **Trade-offs:** Lowest disruption to the existing component tree —
  `TodoCreateForm` stays intact. But two create affordances mean
  two code paths for creation and a mental "where did I type?"
  moment. Empty Doing on day one is quiet but not defended.

### Pattern 3 — "Global-only create, columns are pure views"

- No per-column add affordance. All creation goes through the
  existing `TodoCreateForm`. New items land in Todo; to move them,
  the user drags.
- Empty columns render header + body with a subtle hint like
  `Drag a task here` centered in the column, only when the column
  is empty.
- **Trade-offs:** Smallest change to existing code (form stays,
  no new popovers). Teaches the drag affordance by making it the
  only path to Doing. But violates a near-universal pattern — every
  surveyed tool has a per-column add, and users habituated to
  Trello/Linear/Notion will hunt for one. Day-one empty Doing is
  explicitly addressed by the hint copy.

### Pattern 4 — "Responsive fallback: stacked columns on narrow"

(Orthogonal to 1–3; addresses the mobile/narrow-screen gap that
`ui-structure.md` flags — zero responsive prefixes today.)

- On `<640px`, columns stack vertically, each rendered as a
  collapsible section with its own header + count + add affordance.
  On `>=640px`, columns sit side-by-side.
- Empty stacked columns collapse to a single-line header
  (`Doing  0  +`) to keep scrolling tight.
- **Trade-offs:** Handles the narrow-screen story Kanban introduces,
  but stacked-column Kanban on mobile is essentially a grouped list
  — close to agent E's "hybrid" option. Could be combined with any
  of patterns 1–3.

### First-run / empty-Doing defense

Independent of the pattern choice, three neutral options for the
day-one empty Doing column (the `research.md` cross-tension #3):

- **Accept emptiness.** Render the column normally with the chosen
  empty state; trust the user to drag. Lowest risk, matches all
  surveyed tools.
- **Soft hint on empty.** Add inline copy only when the column is
  empty ("Items you're working on" / "Drag here to start"). Mild
  product voice; not a pattern any big tool leans on.
- **One-time backfill.** Heuristic seed at migration
  (e.g., highest-priority incomplete item → Doing). Solves day-one
  visually but introduces a migration surface and a guess about
  user intent.

The four patterns + three empty-Doing choices are independent axes;
the planner can mix (e.g., Pattern 2 + soft hint, or Pattern 1 +
accept emptiness + stacked-narrow).

---

## Sources

- [Linear — Board layout docs](https://linear.app/docs/board-layout)
- [Linear Kanban review — ToolStack](https://toolstackpm.com/tools/linear/features/kanban-boards)
- [Trello — Add and customize cards and lists](https://support.atlassian.com/trello/docs/add-and-customize-cards-and-lists/)
- [Trello 101 guide](https://trello.com/guide/trello-101)
- [Trello community — Add button disappears on empty list](https://community.atlassian.com/forums/Trello-questions/Add-Button-sometimes-do-not-work-disappear-when-a-list-have-zero/qaq-p/2799993)
- [GitHub Docs — Customizing the board layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout)
- [GitHub Projects — Hide empty column discussion](https://github.com/orgs/community/discussions/10153)
- [Notion — Board view help](https://www.notion.com/help/boards)
- [NotionApps — Add column in Notion Kanban](https://www.notionapps.com/blog/notion-kanban-add-column)
- [Jira — Configure columns](https://support.atlassian.com/jira-software-cloud/docs/configure-columns/)
- [Jira community — WIP limit display](https://community.atlassian.com/forums/Jira-questions/Display-wip-limits-on-kanban-board/qaq-p/2546607)
