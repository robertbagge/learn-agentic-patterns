---
name: pr
description: Push the current branch and open a PR with a filled-in description. Use when the user asks to open a PR or ship a branch. Refuses on main.
allowed-tools: Bash, Read
---

# pr

Push the current branch and open a pull request with the description
rendered from this repo's PR template.

## Flow

1. **Refuse on `main`.** If `git branch --show-current` returns `main`
   (or `master`), stop and tell the user to create a feature branch
   first. Do not push, do not open a PR.

2. **Push the branch.** Run `git push -u origin HEAD`. If the push is
   rejected (non-fast-forward, protected branch, etc.), report the error
   and stop — do not try to force-push or rebase automatically.

3. **Render the PR body.** Read
   `docs/harness/vcs/pr-template.md` and fill each section from the
   branch's commits (`git log main..HEAD`) and diff (`git diff main...HEAD`):
   - **Summary** — 1–3 bullets from the commits, grouped by scope.
   - **Why** — from body lines in commits, or ask the user if none present.
   - **Changes** — one line per notable change, grouped by area (api / web / docs / ops).
   - **Test plan** — seed from commit scopes; let the user edit before opening.
   - **Risk / rollout** — include only if the diff touches migrations,
     deploys, or flagged code paths.
   Write the rendered body to a temp file (`mktemp`) so multi-line content
   stays clean.

4. **Pick a PR title.** Use the first commit's subject (Conventional
   Commits format) as the default title. Show it to the user and accept a
   change if they want one.

5. **Delegate to `pr-vcs`.** Invoke the infra wrapper with the title and
   body file:

   ```
   .claude/skills/pr-vcs/scripts/create-pr.sh "<title>" <body-file>
   ```

6. **Report.** Print the PR URL `pr-vcs` returned. Clean up the temp body
   file.

## Constraints

- Never opens draft PRs by default. If the user asks for a draft, note
  that the current infra wrapper does not support it and ask whether to
  extend `pr-vcs` or open non-draft.
- Never force-pushes. If the branch and remote have diverged, stop and
  ask.
