\# Git Rules

\- Never add Co-authored-by or Signed-off-by trailers to git commits. All commits must be authored solely by Jean-Baptiste DONNETTE. Do not include any AI co-authorship mention in commit messages.

## Mandatory CI checks before push

Before EVERY `git push`, run these commands in order from the repo root. If ANY fails, do NOT push.

Frontend (from repo root):

1. `pnpm lint` (zero errors)
2. `pnpm typecheck` (zero errors)
3. `pnpm test` (zero failures)

Backend (from `backend/`): 4. `cd backend && uv run ruff check .` (zero errors) 5. `cd backend && uv run ruff format --check .` (zero reformats) 6. `cd backend && uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/` (zero errors) 7. `cd backend && uv run pytest -v` (zero failures)

## Pre-commit hooks

Husky pre-commit hooks automatically run lint, typecheck, and tests before every commit. The hook also checks for unresolved merge conflict markers and Python syntax errors. If any check fails, the commit is BLOCKED. To bypass in emergencies (not recommended): `git commit --no-verify`

## E2E Tests with Playwright

Before each PR, run E2E tests:

```bash
pnpm test:e2e
```

The E2E tests verify:

- App loads without JS errors
- Backend health, NMR, and properties endpoints respond correctly
- Vite proxy forwards API calls to backend
- Drawing tools (bond, atom) work on canvas
- Undo/redo works after drawing
- SMILES import via import dialog
- NMR panel toggles and loads without errors
- NMR prediction works after molecule import

CI runs these automatically on every PR via `.github/workflows/e2e.yml`.

For debugging: `pnpm test:e2e:headed` or `pnpm test:e2e:debug`

Full local check (all CI + E2E): `./scripts/full-check.sh`
