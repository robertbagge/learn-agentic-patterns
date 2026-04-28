# Colour System

## Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | #0C0C0C | Base canvas / page background |
| `--bg-card` | #1A1A1A | Card backgrounds, sidebars, modals |
| `--bg-elevated` | #242424 | Inputs, hover states, nested elements |
| `--bg-hover` | #2A2A2A | Interactive hover, pressed states |
| `--bg-input` | #1A1A1A | Input field backgrounds |

## Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | #FFFFFF | Headings, primary content |
| `--text-secondary` | #8A8A8A | Body text, descriptions |
| `--text-muted` | #525252 | Tertiary labels, disabled text |
| `--text-inverse` | #0C0C0C | Text on light/accent backgrounds |

## Accents

| Token | Hex |
|-------|-----|
| `--accent-primary` | #00D4AA |
| `--accent-primary-soft` | #00D4AA20 |
| `--accent-secondary` | #A78BFA |
| `--accent-secondary-soft` | #A78BFA20 |

## Interaction

| Token | Hex |
|-------|-----|
| `--accent-destructive` | #FF453A |
| `--accent-destructive-soft` | #FF453A20 |
| `--accent-neutral` | #8A8A8A |
| `--accent-neutral-soft` | #8A8A8A20 |
| `--accent-ghost` | #FFFFFF |
| `--accent-ghost-soft` | #FFFFFF10 |

## Semantic

| Token | Hex | Soft variant |
|-------|-----|-------------|
| `--color-success` | #32D74B | #32D74B20 |
| `--color-warning` | #FF9F0A | #FF9F0A20 |
| `--color-error` | #FF453A | #FF453A20 |
| `--color-info` | #64D2FF | #64D2FF20 |

## Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border-default` | #2A2A2A | Standard borders, dividers |
| `--border-strong` | #3A3A3A | Emphasized borders |
| `--border-accent` | #00D4AA | Focus rings, active states |

## DOs and DON'Ts

**DO:**
- Always use token variables, never hardcode hex values
- Use `--text-primary` for headings, `--text-secondary` for body
- Use soft variants for tinted backgrounds behind badges
- Use `--border-accent` sparingly for focus and active states

**DON'T:**
- Never use pure white (#FFFFFF) as a background
- Never mix accent colours -- pick one per surface
- Never use `--text-muted` for essential information
