---
name: commit
description: Create a git commit following this repo's conventions. Use when the user asks to commit changes (e.g. "commit", "commit this", "/commit").
---

# commit

Create a git commit that follows this repo's conventions.

## Steps

1. Read `docs/harness/vcs/commits.md` for the conventions. Follow them exactly.
2. Run `git status`, `git diff` (staged and unstaged), and `git log -5 --oneline` to understand the changes and recent message style.
3. If the diff spans multiple concerns, split into multiple commits.
4. Stage files explicitly by path and create the commit.
5. Report the resulting commit hash.
