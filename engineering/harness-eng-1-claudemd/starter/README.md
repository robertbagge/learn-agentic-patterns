# Harness Engineering 1 - Writing a good CLAUDE.MD

The harnessed counterpart to [`base/starter`](../../base/starter/). Same Vite + FastAPI
scaffold, plus a router-style `CLAUDE.md` and a `docs/` tree that together
give an AI assistant the context it needs to match how this team actually
builds. Run the same driving prompt here (e.g. `/plan build a todo app`)
and compare the output against `base/starter` — the difference is what the
harness buys you.

## Structure

- `api/` — FastAPI backend, managed with uv.
- `web/` — Vite frontend, managed with bun.
- `CLAUDE.md` — router that points at the docs below.
- `docs/` — context loaded by `CLAUDE.md`:
  - `project.md` — product identity, users, scope, non-goals.
  - `architecture.md` — process shape, data flow, persistence.
  - `design/` — design system (colours, spacing, radius, typography, icons, rules).
  - `blueprints/web/` — opinionated guide for building with Vite + React + Tailwind (best practices + clean-code principles).
  - `rules.md` — Claude behavioural rules (placeholder).
  - `build.md` — mise task runner and how to add new commands.

## Setup

Run once after cloning:

```bash
mise trust          # trust this stage's mise config
mise install        # install runtimes (bun, python, uv) pinned in ../../mise.toml
mise deps:install   # install api + web dependencies in parallel
```

## Running

Open two terminals:

```bash
mise api:dev
mise web:dev
```

Tasks are defined in `mise.toml`. Run `mise tasks` to list all.
