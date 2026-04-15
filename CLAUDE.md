\# Git Rules

\- Never add Co-authored-by or Signed-off-by trailers to git commits. All commits must be authored solely by Jean-Baptiste DONNETTE. Do not include any AI co-authorship mention in commit messages.

## Mandatory CI checks before push

Before EVERY `git push`, run these commands in order from the repo root. If ANY fails, do NOT push.

Frontend (from repo root):

1. `pnpm lint` (zero errors)
2. `pnpm typecheck` (zero errors)
3. `pnpm test` (zero failures)

Backend (from `backend/`): 4. `cd backend && uv run ruff check .` (zero errors) 5. `cd backend && uv run ruff format --check .` (zero reformats) 6. `cd backend && uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/` (zero errors) 7. `cd backend && uv run pytest -v` (zero failures)
