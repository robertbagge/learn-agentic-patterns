---
name: branch-vcs
description: Run git checkout -b with a given branch name. Thin shell wrapper.
allowed-tools: Bash
argument-hint: "<branch-name>"
---

# branch-vcs

Infra-layer wrapper around `git checkout -b`. Does not decide *what* to
name the branch — it just runs the shell call with the name it's given.

## When this runs

Invoked by the `branch` capability skill once that skill has assembled
the full branch name from the type prefix and slug. You usually do not
invoke this directly — the capability layer is where judgment lives.

## How to use

Delegate to the script:

```bash
.claude/skills/branch-vcs/scripts/checkout.sh "<branch-name>"
```

- `<branch-name>` — the fully assembled `<type>/<slug>` (e.g. `feat/add-date-filtering`).

## Contract

- One call shape: `git checkout -b "$name"`.
- Never validates the name format — that's the capability layer's job.
- Prints the branch name on success.
- Fails (and prints to stderr) if the branch already exists.
