# Styling — Tailwind Patterns

This app uses **Tailwind CSS** (v4) as its styling system. All components
consume theme tokens exposed as CSS variables and utility classes.

## Setup

Tailwind v4 is wired in through the Vite plugin. There is no PostCSS config
and no `tailwind.config.js` for the common case — tokens live in CSS.

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

## Design tokens

Declare tokens in an `@theme` block. Tailwind generates utility classes and
CSS variables from them automatically.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-bg: #f2f2f2;
  --color-text: #111;
  --color-primary: #3b82f6;

  --radius-sm: 3px;
  --radius-md: 6px;

  --spacing-sm: 4px;
  --spacing-md: 8px;
  --spacing-lg: 12px;
}
```

Use them anywhere:

```tsx
<div className="bg-bg text-text rounded-md p-md">Hello</div>

/* or via the CSS var directly */
<div style={{ color: 'var(--color-text)' }}>…</div>
```

## Dark mode

Define a `dark` variant that toggles on an ancestor class:

```css
/* src/index.css */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-bg: #f2f2f2;
  --color-text: #111;
}

.dark {
  --color-bg: #111;
  --color-text: #eee;
}
```

Toggle by adding/removing the `dark` class on `<html>`. Components stay
unchanged because they consume the same token names.

## Reusable components

For repeated variants, don't stack classnames at every callsite. Lift to
a component that exposes a typed variant API. Use
[`class-variance-authority`](https://cva.style) (`cva`) for this:

```tsx
// components/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center rounded-sm font-medium',
  {
    variants: {
      intent: {
        primary: 'bg-primary text-white',
        secondary: 'bg-transparent text-primary border border-primary',
      },
      size: {
        sm: 'px-sm py-sm text-sm',
        md: 'px-md py-sm text-base',
        lg: 'px-lg py-md text-lg',
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

Callers use props, not classnames:

```tsx
<Button intent="secondary" size="lg">Cancel</Button>
```

## Interactive styles

Use state prefixes:

```tsx
<button
  className="
    bg-primary text-white
    hover:bg-primary/90
    active:bg-primary/80
    focus-visible:outline-2 focus-visible:outline-primary
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
<div className="flex flex-col gap-md md:flex-row md:gap-lg">
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
  fragment the design. Add a token or use the closest scale value.
* **Classname pile-ups repeated across files** — if the same 8-class
  string appears in five components, that's a missing component. Lift to
  a `cva`-backed component with a typed variant API.
* **Hardcoded hex or px** (`style={{ color: '#333' }}`) — breaks dark mode
  and theme consistency. Use tokens.
* **`@apply` for reusable components** — prefer a React component with
  `cva`; it keeps the variant API in TypeScript where the rest of the app
  can see it.
* **Inline `style={{...}}`** — prefer classes. Reserve inline styles for
  values that genuinely change at runtime (e.g. a computed `transform`).
* **Styling with `!important`** — almost always a sign of specificity
  working as designed and the callsite trying to override a
  component-owned variant. Lift the variant into the component's API.
