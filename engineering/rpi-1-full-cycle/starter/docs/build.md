# Build and tasks

Task running is managed by [mise](https://mise.jdx.dev/). Runtimes (Bun,
Python, uv) and every runnable command live in `mise.toml` — at the stage
root for stage-specific tasks, and in `../mise.toml` for shared runtimes.

## Running

```bash
mise dev             # run api and web dev servers in parallel
mise api:dev         # FastAPI dev server only (http://localhost:$API_PORT)
mise web:dev         # Vite dev server only
mise deps:install    # install both api and web dependencies
mise api:deps:install
mise web:deps:install
```

Run `mise tasks` to see the full list with descriptions.

## Adding commands

If a command does not exist for what you are trying to do, it's fine to
run it directly with the underlying runner (uv, bun, etc.) while
debugging — but always add it as a `[tasks.*]` entry in `mise.toml` once
the command is repeated, needs to run in CI, or might be run by another
human.

This keeps three things in sync:

- What a human runs locally
- What CI runs
- What this doc describes

Drift between any two is the pattern we're avoiding.
