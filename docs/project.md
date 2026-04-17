# Project

## Context
- `learn-agentic-patterns` is a companion repo for tutorials that teach agentic patterns for working with AI coding assistants.
- Audience: engineers learning agentic workflows, expanding to non-engineering use cases in later modules.
- The running example is a todo app that evolves across tutorials into a small executive assistant.
- Stack: Vite (frontend) + FastAPI (backend), managed with Bun.

## Structure
- Each top-level folder is a self-contained tutorial stage (polyrepo style). Do not share code between folders.
- Stages come in pairs:
  - `<stage>/` — the starting point the learner begins from.
  - `<stage>-done/` — the result after running the tutorial's driving prompt.
- `docs/` holds shared documentation for the repo itself, not for any one stage.
