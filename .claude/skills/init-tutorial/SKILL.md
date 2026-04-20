---
name: init-tutorial
description: Scaffold a new tutorial stage under /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/ by copying an existing source (flat stage or nested state) into <new-name>/starter/ and renaming references. Use when the user asks to initialise, scaffold, or start a new tutorial (e.g. "/init-tutorial", "start a new tutorial stage").
argument-hint: "[<source>] [<new-name>]"
---

# init-tutorial

Create a new tutorial at `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/starter/`, optionally
copied from an existing source stage.

New tutorials use the nested shape:

```
/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<tutorial>/
├── starter/                  # always created
├── completed-default/        # optional, added later
└── completed-<variant>/      # optional, added later
```

This skill only sets up `starter/`. Other states are added later as a
tutorial evolves.

## Flow

1. **Read `$ARGUMENTS`.**
   - Two tokens → treat as `<source> <new-name>` and skip the wizard.
   - Otherwise → run the wizard (see below).

2. **Resolve the source path**:
   - `empty` → no source; `starter/` gets created empty.
   - Nested path like `base/completed` or `harness-eng-1-claudemd/starter` → `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<path>/`.
   - Always prepend `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/` if the token doesn't already start with it.
   - **The source must be a leaf state folder**, i.e. contain `api/` or `web/` directly. Tutorial containers (folders that only hold `starter/`/`completed-*/` subdirs) are *not* valid sources — pick a specific state instead. If the user supplies a container, list the states inside it and ask which one to use.

3. **Validate the new name**:
   - Lowercase alphanumerics and hyphens only (`^[a-z][a-z0-9-]*$`).
   - `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/` must not already exist.
   - If invalid, explain and ask again (or abort in arg mode).

4. **Copy**: run
   `/Users/robertbagge/code/misc/learn-agentic-patterns/.claude/skills/init-tutorial/scripts/copy-stage.sh <source-path> /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/starter`
   Skip this step for `empty` — just `mkdir -p /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/starter`.

5. **Rename references**: run
   `/Users/robertbagge/code/misc/learn-agentic-patterns/.claude/skills/init-tutorial/scripts/rename-stage.sh /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/starter <new-name>`
   This updates `api/pyproject.toml` name + description and the top heading of `README.md`, then greps for any remaining mentions of the old name and prints them for manual review.

6. **Report back**. Summarise what was copied, what was renamed, and list any leftover references the user should look at. Suggest next steps — typically `cd /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/starter && mise tasks`.

## Wizard (no args)

Use `AskUserQuestion` for the source, then a plain chat prompt for the name.

**Step 1 — source selection.** Enumerate leaf state folders at runtime:

```bash
# list every 2-deep folder whose parent is /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/
ls -d /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/*/*/ 2>/dev/null
```

Filter to those that directly contain `api/` or `web/` — these are the
valid leaf states. Strip the leading `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/` when labelling
options.

`AskUserQuestion` allows up to 4 options and always surfaces an "Other"
free-text slot. Present the three most relevant states plus `empty` as
options; if the user needs something outside the list, they'll pick
"Other" and type the full path relative to `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/`.

Example:

> **Source for the new tutorial**
> - base/completed *(finished state of the bare scaffold — likely starting point for the next tutorial)*
> - base/starter *(bare scaffold, pre-build)*
> - empty *(no copy — just an empty starter/)*
> - *Other — type a path relative to `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/`*

**Step 2 — new name.** Ask in chat (AskUserQuestion is a poor fit for
free-text): "What should the new tutorial be called? (lowercase, hyphens,
e.g. `rpi-research`, `harness-eng-2-testing`)". Validate per step 3
above before proceeding.

## Constraints

- Never overwrite an existing destination. If `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/<new-name>/` already exists, abort with a clear message.
- Don't `git add` or commit. The user owns the tree.
- Don't modify the source. Copy is one-way.
- Don't try to port a flat source into the nested shape of the destination except by placing it at `starter/` — preserving the source's internal structure one level deep is the whole point.

## Example — arg mode

```
/init-tutorial base/completed rpi-research
```

Expected behaviour:
- Copies `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/base/completed/` → `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/rpi-research/starter/` (skipping node_modules, .venv, lock files, etc.).
- Updates `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/rpi-research/starter/api/pyproject.toml` name to `rpi-research-api`.
- Updates `/Users/robertbagge/code/misc/learn-agentic-patterns/engineering/rpi-research/starter/README.md` title to `# rpi-research`.
- Prints a summary and suggests `cd /Users/robertbagge/code/misc/learn-agentic-patterns/engineering/rpi-research/starter && mise tasks`.

## Example — wizard mode

```
/init-tutorial
```

Expected behaviour:
- Claude enumerates sources, asks which base to use via `AskUserQuestion`.
- Claude asks for the new tutorial name.
- Claude runs the copy and rename scripts.
- Claude reports back.
