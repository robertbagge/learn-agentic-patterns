# base

Starting scaffold for the agentic workflow tutorials. Bare Vite + FastAPI apps, no harness, no conventions.

This is the starting point a learner clones before running a tutorial's driving prompt (e.g. `/plan build a todo app`).

## Structure

- `api/` — FastAPI backend, managed with uv.
- `web/` — Vite frontend, managed with bun.

## Setup

Run once after cloning:

```bash
mise trust          # trust this stage's mise config
mise install        # install runtimes pinned in mise.toml (bun, python, uv)
mise deps:install   # install api + web dependencies in parallel
```

## Running

Open two terminals:

```bash
mise api:dev
mise web:dev
```

Tasks are defined in `mise.toml`. Run `mise tasks` to list all.
