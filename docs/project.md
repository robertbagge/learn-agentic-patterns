# Project

## Context
- `learn-agentic-patterns` is a companion repo for tutorials that teach harness engineering for AI coding assistants.
- Grouped by skill domain (not audience). A product person can follow the engineering domain tutorials if the patterns interest them, and vice versa.
- Stack: Vite + Bun (frontend), FastAPI + uv (backend), mise for runtimes and task running.

## Structure
- Tutorials are grouped by skill domain at the top level (e.g. `engineering/`).
- Within a grouping, each folder is a self-contained tutorial stage (polyrepo style). Do not share code between stage folders.
- A tutorial may ship a paired `<stage>-done/` folder showing the reference outcome after running its driving prompt.
- `docs/` holds shared documentation for the repo itself, not for any one stage.
