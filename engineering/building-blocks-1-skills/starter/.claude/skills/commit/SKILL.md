---
name: commit
description: Create a git commit following this repo's conventions (Conventional Commits). Use when the user asks to commit changes. Optional file list scopes the commit.
allowed-tools: Bash, Read
argument-hint: "[files...]"
---

# commit

Create a single git commit that follows this repo's commit conventions.

## Flow

1. **Scope the change.**
   - If the user passed a file list as arguments, those are the files to
     commit (stage them via `commit-vcs`).
   - Otherwise, commit whatever is already staged. If nothing is staged
     and no files were passed, ask the user what to commit — do not guess.

2. **Read the conventions.** Read
   `docs/harness/vcs/commits.md` for the Conventional-Commits rules this
   repo follows. Respect every `DONT` listed there (notably: no
   `Co-Authored-By: Claude`).

3. **Understand the diff.** Run `git status` and `git diff --cached`
   (or `git diff -- <files>` if a file list was passed and nothing is
   staged yet). Read the actual changes — do not rely on file names alone.

4. **Draft the message.**
   - Pick the right `<type>` (feat / fix / refactor / docs / test / chore).
   - Add a `<scope>` when the change is localised to one area (e.g. `api`,
     `web`, `docs`).
   - Write the description in the imperative mood, under 72 characters,
     no trailing period.
   - Add a body only if the *why* is non-obvious from the diff.

5. **Delegate to `commit-vcs`.** Invoke the infra wrapper with the message
   and (if applicable) the file list:

   ```
   .claude/skills/commit-vcs/scripts/commit.sh "<message>" [<files>]
   ```

6. **Report.** Print the commit hash `commit-vcs` returned, plus the
   subject line.

## Constraints

- One commit per invocation. If the diff spans multiple concerns, stop
  and suggest `/identify-commits` instead.
- Never amends a previous commit unless the user explicitly asks.
