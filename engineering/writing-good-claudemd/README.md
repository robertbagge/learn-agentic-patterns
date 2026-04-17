# writing-good-claudemd

The harnessed counterpart to [`base/`](../base/). Same Vite + FastAPI
scaffold, plus a `docs/` tree that gives an AI assistant the context it
needs to match how this team actually builds. A router-style `CLAUDE.md`
(to be added separately) points at the docs below. Run the same driving
prompt here (e.g. `/plan build a todo app`) and compare the output
against `base/` — the difference is what the harness buys you.

## Structure

- `api/` — FastAPI backend, managed with uv.
- `web/` — Vite frontend, managed with bun.
- `docs/` — context to be loaded by `CLAUDE.md`:
  - `project.md` — product identity, users, scope, non-goals.
  - `architecture.md` — process shape, data flow, persistence.
  - `design/` — design system (colours, spacing, radius, typography, icons, rules).
  - `blueprints/web/` — opinionated guide for building with Vite + React + Tailwind (best practices + clean-code principles).

## Setup

Run once after cloning:

```bash
mise trust          # trust this stage's mise config
mise install        # install runtimes (bun, python, uv) pinned in ../mise.toml
mise deps:install   # install api + web dependencies in parallel
```

## Running

Open two terminals:

```bash
mise api:dev
mise web:dev
```

Tasks are defined in `mise.toml`. Run `mise tasks` to list all.
