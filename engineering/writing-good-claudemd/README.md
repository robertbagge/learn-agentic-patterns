# base

The control scaffold — a bare Vite + FastAPI project with no stage-local harness. This is where you run a tutorial's driving prompt (e.g. `/plan build a todo app`) to see what an AI assistant produces without guidance, before comparing against harnessed stages.

The repo root carries a deliberately minimal `CLAUDE.md` (stage-isolation rules only) so this control stays clean.

## Structure

- `api/` — FastAPI backend, managed with uv.
- `web/` — Vite frontend, managed with bun.

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
