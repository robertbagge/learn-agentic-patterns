---
name: commit-and-push
description: Decompose the working tree into clean commits and open a PR. Use when the user asks to ship the current change end-to-end.
---

# commit-and-push

End-to-end ship flow: messy working tree → clean commit chunks → pushed
branch → open PR.

## Flow

This skill is pure composition — it only invokes capability-layer skills.

1. **Plan the chunks.** Invoke `/identify-commits`. It reads the working
   tree, proposes the smallest coherent commit chunks, and waits for the
   user to approve or edit the plan. Capture the approved plan.

2. **(Conditional) Create branch.** If you are not on a feature branch,
   invoke `/branch` to create one. The branch name should reflect the
   overall intent of the change, not the individual commit chunks.

3. **Commit each chunk.** For each chunk in the approved plan, in order:

   ```
   /commit <chunk.files...>
   ```

   The capability skill stages the listed files, writes a
   Conventional-Commits message, and invokes `commit-vcs` to create the
   commit. Collect the commit hash it reports.

4. **Open the PR.** Invoke `/pr`. It refuses if we're on `main`, pushes
   the branch, renders the PR body from
   `docs/harness/vcs/pr-template.md`, and invokes `pr-vcs` to open the PR.

5. **Report.** Print one line per commit (`<hash>  <subject>`) followed
   by the PR URL from `/pr`.

## Constraints

- Never invokes infra skills (`commit-vcs`, `pr-vcs`) directly. Always goes
  through the capability layer.
- If the user has not approved `/identify-commits`' plan, stop. The
  orchestration is a coordinator, not a decision-maker.
- If any step fails, stop and report where. Do not try to recover — let
  the user decide whether to retry the failing chunk, reshape the plan,
  or abandon.
