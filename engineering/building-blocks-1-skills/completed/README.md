# building-blocks-1-skills-skills

Same Vite + FastAPI scaffold + router-style CLAUDE.md + docs tree as
[`rpi-1-full-cycle/completed-custom-subagents`](../../rpi-1-full-cycle/completed-custom-subagents/),
with **one additional harness layer on top: a skills tree under
`.claude/skills/`**. This stage is the reference material for the skills
architecture walkthrough — read each SKILL.md, classify it as infra /
capability / orchestration by description shape, then build an analogous
skill in your own repo.

## The skills layer

Six skills, three layers:

| Skill | Layer | Shape |
|---|---|---|
| `commit-vcs` | Infra | Wraps `git add` + `git commit`. Thin shell script. |
| `pr-vcs` | Infra | Wraps `gh pr create`. Thin shell script. |
| `commit` | Capability | Writes a Conventional-Commits message, delegates to `commit-vcs`. |
| `pr` | Capability | Pushes the branch, fills the PR template, delegates to `pr-vcs`. |
| `identify-commits` | Capability | Partitions a messy working tree into the smallest coherent commit chunks. |
| `commit-and-push` | Orchestration | `/identify-commits` → `/commit` per chunk → `/pr`. |

Classify each one yourself before reading the table: open the SKILL.md,
read only the description line, and ask which layer it belongs to. The
description *shape* is the signal — infra names a system + call shape,
capability names an outcome, orchestration names a workflow. The router
picks the right layer because user intents don't phrase themselves in
mechanical-wrapper terms; nothing in the SKILL.md claims "internal" or
constrains who can call it.

### Try the orchestration

To feel the stack end-to-end, make a small multi-file change first so
there's a real working diff to chunk. Suggested prompt:

> *"Add an optional `due_date` field to todos — API model, endpoint response, and UI display."*

This naturally splits into ~3 commits (schema/model, endpoint, UI) — the
shape `identify-commits` is designed for. Then run:

```
/commit-and-push
```

Expect: `identify-commits` proposes the chunks → you approve or edit the
plan → `commit` runs per chunk → `pr` pushes the branch and opens a PR
with the template filled in. (The final step needs a live `gh` auth and
a real remote; skip it if you're running the walkthrough offline.)

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
  - `harness/vcs/` — Conventional Commits rules + PR template, read by the commit and PR skills.
- `.claude/skills/` — the six skills described above.

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
