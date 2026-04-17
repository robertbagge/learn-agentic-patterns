# Component Usage Rules

## Button Hierarchy

One primary action per surface. Never compete for attention.

| Priority | Variant | Use for |
|----------|---------|---------|
| 1 | Primary | Main CTA -- Save, Create, Submit, Confirm |
| 2 | Secondary | Alternative actions, secondary paths |
| 3 | Ghost | Inline actions, navigation links, Cancel |
| 4 | Destructive | Delete, Remove, Disconnect -- always with confirmation |
| 5 | Icon Only | Toolbar actions, overflow menus, compact UI |

## Form Patterns

1. **Labels above inputs** -- always place the label above the input field. Never use floating labels or inline placeholders as the only label.
2. **Vertical stacking** -- stack form fields vertically with 16px gap. Only go horizontal for short, related fields (first/last name).
3. **Actions at the bottom** -- place submit/cancel buttons at the bottom-right of the form. Cancel on left, primary action on right.

## Card Composition

Cards are the primary container. Every card follows a consistent anatomy:

| Zone | Content |
|------|---------|
| Header | Title + subtitle + optional action |
| Content | Primary content area -- flexible height |
| Actions | Right-aligned buttons -- max 2 visible |

## State Requirements

Every data-driven surface must account for all possible states.

| State | Requirements |
|-------|-------------|
| Loading | Skeleton or spinner. Never a blank screen. |
| Empty | Illustration + message + CTA to create first item. |
| Error | Clear message + retry action. Never just "Something went wrong". |
| Success | Toast confirmation. Auto-dismiss after 4s. Always dismissible. |

## DOs and DON'Ts

**DO:**
- One primary action per surface -- everything else is secondary or ghost
- Use cards as the universal container -- never float content on bare backgrounds
- Design all 4 states: loading, empty, error, success
- Right-align action buttons in cards and modals
- Confirm all destructive actions with a dialog
- Use consistent padding: 20px for cards, 32px for page content

**DON'T:**
- Never put two primary buttons on the same surface
- Never use a modal for non-blocking information -- use a toast instead
- Never disable a button without explaining why (use tooltip)
- Never nest cards inside cards -- use sections within a single card
- Never use icon-only buttons without tooltips in primary UI
- Never silently fail -- every action needs visible feedback
