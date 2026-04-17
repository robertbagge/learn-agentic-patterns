# base

Starting scaffold for the agentic workflow tutorials. Bare Vite + FastAPI apps, no harness, no conventions.

This is the starting point a learner clones before running a tutorial's driving prompt (e.g. `/plan build a todo app`).

## Structure

- `api/` — FastAPI backend, managed with uv.
- `web/` — Vite frontend, managed with bun.

## Running

Open two terminals:

```bash
mise run api:dev
mise run web:dev
```

Tasks are defined in `mise.toml`. Run `mise tasks` to list all.
