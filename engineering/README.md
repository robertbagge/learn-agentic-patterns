# Engineering tutorials

Self-contained stages that teach agentic patterns for software engineering. Each stage is a small Vite + FastAPI app — the agent builds or improves it, and you see how the surrounding harness shapes the result.

## Prerequisites

- [Mise](https://mise.jdx.dev/) installed

## Stages

- [base/](base/README.md) — bare scaffold, no stage-local harness. Use this as the control: run a driving prompt here first to see what an AI assistant produces without guidance.
- [harness-eng-1-claudemd/](harness-eng-1-claudemd/README.md) — harnessed stage: adds a `docs/` tree (project, architecture, design system, web blueprint) on top of the `base/` scaffold. Run the same driving prompt here and compare the output against `base/` to see what a good harness buys you.

More stages will land as the course develops — each introduces one additional harness layer (testing conventions, skills, etc.) so you can see each lever in isolation.

Each stage README has the full setup flow. Runtimes (Bun, Python, uv) are pinned in this folder's `mise.toml` and inherited by every stage.
