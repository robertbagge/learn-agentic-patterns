# Styling — Tailwind Patterns

This app uses **Tailwind CSS** (v4) as its styling system. All components
consume tokens defined in the design system — see
[`docs/design/`](../../design/) for the authoritative list of colours,
spacing, radius, and typography tokens.

`styling.md` covers *how* those tokens are wired into Tailwind and the
component patterns that consume them. It does not restate the tokens;
that lives in `docs/design/`.

## Setup

Tailwind v4 is wired in through the Vite plugin. There is no PostCSS
config and no `tailwind.config.js` — tokens live in CSS.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

Import that CSS once from `src/main.tsx`. Done.

## Exposing design tokens as Tailwind utilities

The design system declares raw CSS variables (`--bg-card`, `--text-primary`,
`--accent-primary`, etc.). To make them available as Tailwind utility
classes (`bg-card`, `text-text-primary`, `bg-accent-primary`), map them
into an `@theme` block under Tailwind's namespaced prefixes (`--color-*`,
`--spacing-*`, `--radius-*`, `--font-*`).

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Surfaces — see docs/design/colours.md */
  --color-bg-primary: #0C0C0C;
  --color-bg-card: #1A1A1A;
  --color-bg-elevated: #242424;
  --color-bg-hover: #2A2A2A;

  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #8A8A8A;
  --color-text-muted: #525252;
  --color-text-inverse: #0C0C0C;

  /* Accents */
  --color-accent-primary: #00D4AA;
  --color-accent-destructive: #FF453A;

  /* Borders */
  --color-border-default: #2A2A2A;
  --color-border-accent: #00D4AA;

  /* Spacing — see docs/design/spacing-and-layout.md */
  --spacing-2: 2px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;

  /* Radius — see docs/design/radius-and-elevation.md */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;
}
```

That block is the single place where design tokens become Tailwind
utilities. Keep it authoritative: if a new token lands in `docs/design/`,
add it here; never invent parallel tokens in component files.

Use them anywhere:

```tsx
<div className="bg-card text-text-primary rounded-lg p-16">Hello</div>

/* or reference the CSS var directly when a utility is not expressive enough */
<div style={{ color: 'var(--color-text-primary)' }}>…</div>
```

## Reusable components

For repeated variants, don't stack classnames at every callsite. Lift to
a component that exposes a typed variant API. Use
[`class-variance-authority`](https://cva.style) (`cva`) for this:

```tsx
// components/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center rounded-sm font-medium',
  {
    variants: {
      intent: {
        primary: 'bg-accent-primary text-text-inverse',
        secondary: 'bg-transparent text-text-primary border border-border-default',
        ghost: 'bg-transparent text-text-primary',
        destructive: 'bg-accent-destructive text-text-primary',
      },
      size: {
        sm: 'px-8 py-4 text-sm',
        md: 'px-12 py-8 text-base',
        lg: 'px-16 py-12 text-lg',
      },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  }
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>

export function Button({ intent, size, className, ...props }: Props) {
  return <button className={button({ intent, size, className })} {...props} />
}
```

The four intents map directly to the button hierarchy in
[`docs/design/rules.md`](../../design/rules.md). Callers use props,
not classnames:

```tsx
<Button intent="destructive" size="lg">Delete</Button>
```

## Interactive styles

Use state prefixes:

```tsx
<button
  className="
    bg-accent-primary text-text-inverse
    hover:bg-bg-hover
    focus-visible:outline-2 focus-visible:outline-border-accent
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  Submit
</button>
```

Cover `hover:`, `active:`, `focus-visible:`, and `disabled:` whenever the
element is interactive.

## Responsive design

Tailwind is mobile-first. Plain classes apply at all sizes; `sm:` / `md:` /
`lg:` / `xl:` apply at that breakpoint and above.

```tsx
<div className="flex flex-col gap-12 md:flex-row md:gap-20">
  <Sidebar />
  <Content />
</div>
```

Override breakpoints in `@theme` if the defaults don't match the design.

```css
@theme {
  --breakpoint-md: 860px;
}
```

## Anti-patterns

* **Arbitrary values like `p-[17px]`** — break the token scale and
  fragment the design. Use a design-system spacing token or revisit the
  design.
* **Inventing tokens in component files** — every token belongs in
  `@theme`, and every `@theme` entry must correspond to a token in
  `docs/design/`. Drift between the two ends in colour-by-accident.
* **Classname pile-ups repeated across files** — if the same 8-class
  string appears in five components, that's a missing component. Lift to
  a `cva`-backed component with a typed variant API.
* **Hardcoded hex or px** (`style={{ color: '#333' }}`) — breaks theme
  consistency. Use tokens.
* **`@apply` for reusable components** — prefer a React component with
  `cva`; it keeps the variant API in TypeScript where the rest of the app
  can see it.
* **Inline `style={{...}}` for static values** — prefer classes. Reserve
  inline styles for values that genuinely change at runtime (e.g. a
  computed `transform`).
* **Styling with `!important`** — almost always a sign of specificity
  working as designed and the callsite trying to override a
  component-owned variant. Lift the variant into the component's API.
