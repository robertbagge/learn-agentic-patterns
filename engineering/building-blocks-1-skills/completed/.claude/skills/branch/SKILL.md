---
name: branch
description: Create a new feature branch using this repo's Conventional-Commits naming (feat/, fix/, refactor/). Use when the user asks to start work on a new task or create a feature branch.
allowed-tools: Bash, Read
argument-hint: "<short-description>"
---

# branch

Create a feature branch that follows this repo's branch-naming
conventions, then check it out.

## Flow

1. **Read the conventions.** Read
   `docs/harness/vcs/branches.md` for the naming rules this repo
   follows. Respect every `DONT` listed there.

2. **Derive the branch-name.** Apply the rules in `branches.md` to the user's
   description: lowercase, alphanumerics + hyphens only, collapse runs
   of hyphens, trim leading/trailing hyphens. Keep it short (3–5 words).

3. **Delegate to `branch-vcs`.** Invoke the `/branch-vcs <branch-name>`:

4. **Report.** Print the branch name `branch-vcs` returned.

## Constraints

- One branch per invocation.
- Always go through `branch-vcs`.
