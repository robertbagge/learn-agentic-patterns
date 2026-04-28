# Pull Request Template

The `/pr` skill fills this template with the branch's changes and uses the
result as the PR body.

```markdown
## Summary

<1-3 bullets describing what this PR does, in plain language.>

## Why

<The problem, the constraint, or the decision that motivated this change.
Link to relevant research, plans, or issues if they exist.>

## Changes

<Notable changes by area (api / web / docs / ops). Keep this skimmable —
one line per change, grouped so a reviewer can orient fast.>

## Test plan

- [ ] <What the author ran to verify behaviour locally.>
- [ ] <What CI covers.>
- [ ] <Any manual steps a reviewer should repeat.>

## Risk / rollout

<Optional. Anything risky, data migrations, feature flags, rollback plan.>
```

## How `/pr` fills this

- **Summary / Why / Changes** — generated from the branch's commit messages
  and diff. The capability skill reads the commits in topological order and
  groups them by scope to produce the Changes section.
- **Test plan** — `/pr` seeds the checklist from commit scopes (e.g. if any
  commit touches `api/`, it proposes "run the FastAPI test suite"). The
  user edits the checklist before the PR is opened.
- **Risk / rollout** — omitted unless the branch touches migrations,
  deploys, or flagged code paths. `/pr` asks the user when it detects one
  of those signals.
