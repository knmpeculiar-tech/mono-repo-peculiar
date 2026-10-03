# Git standards

## Commits

- Write commit messages that explain *why*, not just what changed — the diff already
  shows what changed.
- One logical change per commit; don't bundle an unrelated fix into a feature commit.
- Never commit `.env`, real credentials, or generated artifacts (`node_modules`,
  `.next`, `dist`) — see root `.gitignore`.

## Branching

- `main` is the default branch.
- Once there's more than one contributor or a deployed environment to protect, work in
  feature branches (`feat/...`, `fix/...`) and merge via PR rather than pushing directly
  to `main`.

## Safety

- Never force-push, hard-reset, or rewrite history on `main` without explicit
  confirmation.
- Never commit without being asked to — staging/reviewing a diff is not the same as
  committing it.
