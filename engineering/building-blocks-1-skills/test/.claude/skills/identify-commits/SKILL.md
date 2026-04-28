---
name: identify-commits
description: Partition the current working tree into the smallest coherent commit chunks. Use when a diff spans multiple concerns and needs to be split.
allowed-tools: Bash, Read
---

# identify-commits

Given a messy working tree, propose the smallest coherent commit chunks
the user can ship. Output is a plan the user approves (or edits) before
any commit runs.

## Flow

1. **Read the diff surface.** Run the deterministic diff parse:

   ```bash
   .claude/skills/identify-commits/scripts/diff-summary.sh
   ```

   This prints a list of changed files with per-file line counts
   (insertions + deletions) and whether each is staged, unstaged, or
   untracked. The script is mechanical — treat its output as the ground
   truth for what changed.

2. **Read the conventions.** Read `docs/harness/vcs/commits.md` so the
   proposed commit messages follow this repo's format.

3. **Cluster by concern.** Group the changed files into chunks where each
   chunk is one coherent idea (one type + scope). Signals:
   - Files in the same module/package usually belong together.
   - Schema + endpoint + UI for the same feature are typically **three
     chunks**, not one, so each can be reverted independently.
   - Pure refactors, docs-only changes, and test-only changes are their
     own chunks.
   - Generated / lockfile changes go in a `chore` chunk on their own.

4. **Draft a proposed message per chunk.** Conventional Commits format,
   imperative mood, under 72 chars, scope when localised.

5. **Output the plan.** Present as a numbered list the user can accept or
   edit:

   ```
   1. feat(api): add due_date to Todo model
      files: api/app/models.py, api/tests/test_models.py

   2. feat(api): expose due_date on /todos endpoint
      files: api/app/routes/todos.py, api/tests/test_todos.py

   3. feat(web): show due_date on cards
      files: web/src/components/Card.tsx, web/src/styles/card.css
   ```

6. **Wait for approval.** Do not run any commits. Hand the approved plan
   to whoever called this skill (usually `/commit-and-push`, occasionally
   the user directly).

## Constraints

- Do not stage anything. Staging is the commit step's job.
- Do not skip files. Every changed file must appear in exactly one chunk.
- Propose three-ish chunks for typical changes; if the diff is actually
  one concern, say so and propose a single chunk.
