# Engineering tutorials

Self-contained stages that teach agentic patterns for software engineering. Each stage is a small Vite + FastAPI app — the agent builds or improves it, and you see how the surrounding harness shapes the result.

## Prerequisites

- [Mise](https://mise.jdx.dev/) installed

## Stages

- [base/](base/README.md) — bare scaffold, no stage-local harness. Use this as the control: run a driving prompt here first to see what an AI assistant produces without guidance.

More stages will land as the course develops. Each introduces one harness layer at a time (CLAUDE.md structure, testing conventions, skills, etc.) so you can see each lever in isolation.

Each stage README has the full setup flow. Runtimes (Bun, Python, uv) are pinned in this folder's `mise.toml` and inherited by every stage.
