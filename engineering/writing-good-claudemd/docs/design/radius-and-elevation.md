# Radius & Elevation

## Radius Scale

| Token | Value |
|-------|-------|
| `--radius-none` | 0px |
| `--radius-xs` | 4px |
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-pill` | 999px |

## Radius Usage

| Token | Usage |
|-------|-------|
| none (0px) | Dividers, chart bar bottoms |
| xs (4px) | Badges, chart bars, checkboxes, keyboard keys |
| sm (6px) | Buttons, action buttons |
| md (8px) | Nav item backgrounds, search bar |
| lg (12px) | Cards, modals, containers, toasts |
| xl (16px) | Large feature cards (reserved) |
| pill (999px) | Avatars, toggles, progress bars, notification dots |

## Elevation / Depth

Surface hierarchy uses background colour only -- no drop shadows.

| Level | Colour | Usage |
|-------|--------|-------|
| Level 0 | `#0C0C0C` | Base canvas |
| Level 1 | `#1A1A1A` | Cards, sidebars, modals |
| Level 2 | `#242424` | Inputs, hover states, nested elements |
| Level 3 | `#2A2A2A` | Interactive hover, pressed states |

## DOs and DON'Ts

**DO:**
- Use `--radius-lg` for all card-level containers
- Use `--radius-sm` for interactive elements (buttons)
- Match radius to component hierarchy -- larger containers get larger radius

**DON'T:**
- Never use drop shadows -- depth comes from surface colour only
- Never mix radius scales on the same component
- Never round only some corners of a card
