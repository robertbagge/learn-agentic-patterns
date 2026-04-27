# Spacing & Layout

## Spacing Scale

| Token | Value |
|-------|-------|
| `--spacing-2` | 2px |
| `--spacing-4` | 4px |
| `--spacing-6` | 6px |
| `--spacing-8` | 8px |
| `--spacing-12` | 12px |
| `--spacing-16` | 16px |
| `--spacing-20` | 20px |
| `--spacing-24` | 24px |
| `--spacing-32` | 32px |
| `--spacing-48` | 48px |

## Common Usage

| Value | Use for |
|-------|---------|
| 2px | Tight stacks (title + subtitle) |
| 4px | Badge internal padding |
| 8px | Button icon gap, small element groups |
| 12px | Toast/card internal gap, form field spacing |
| 16px | Standard card padding, nav item padding |
| 20px | Card padding (large), section internal gap |
| 24px | Modal padding, content padding |
| 32px | Section gaps, page content padding |
| 48px | Major section gaps, page horizontal padding |

## Layout Principles

1. Use flexbox over absolute positioning -- always
2. `fill_container` for responsive sizing, never hardcode parent dimensions
3. Consistent vertical rhythm: 32px between sections, 16px between related items

## DOs and DON'Ts

**DO:**
- Always use spacing tokens
- Use gap for sibling spacing, padding for container edges
- Keep vertical rhythm consistent within a section

**DON'T:**
- Never use arbitrary spacing values
- Never mix padding and margin concepts
- Never use `--spacing-48` between closely related elements
