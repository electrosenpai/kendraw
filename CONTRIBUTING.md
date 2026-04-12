# Contributing to Kendraw

Thank you for your interest in contributing! Kendraw is an open-source project and welcomes contributions of all kinds.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Python** >= 3.11
- **uv** (`pip install uv`)
- **Docker** (optional, for testing deployment)

## Setup (5 commands)

```bash
git clone https://github.com/electrosenpai/kendraw.git
cd kendraw
pnpm install          # frontend dependencies
cd backend && uv sync # backend dependencies
cd ..
pnpm dev              # start frontend dev server
```

Backend dev server (separate terminal):

```bash
cd backend
uv run uvicorn kendraw_api.main:app --reload --port 8081
```

## Verify your setup

```bash
pnpm typecheck        # TypeScript strict — 0 errors
pnpm test             # Vitest — all pass
pnpm format:check     # Prettier — all clean
cd backend
uv run ruff check .   # Ruff lint — 0 errors
uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/  # mypy strict
uv run pytest         # pytest — all pass
```

## Project structure

```
kendraw/
├── packages/           # Frontend (pnpm workspaces, TypeScript)
│   ├── scene/          # Domain model (framework-agnostic)
│   ├── chem/           # Chemistry lib adapter (RDKit.js / OpenChemLib)
│   ├── renderer-canvas/# Canvas 2D screen renderer
│   ├── renderer-svg/   # SVG export renderer
│   ├── persistence/    # IndexedDB via Dexie
│   ├── io/             # File format parsers/writers
│   ├── api-client/     # Backend REST client
│   └── ui/             # React 18 app
├── backend/            # Python (FastAPI + RDKit)
├── docker/             # Dockerfiles + docker-compose
└── docs/               # Architecture, PRD, sprint plan
```

For full architectural context: [docs/architecture-kendraw-2026-04-12.md](docs/architecture-kendraw-2026-04-12.md)

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). A `commitlint` hook enforces this on every commit.

```
feat(scene): add Bond model with order and style types
fix(renderer-canvas): correct DPR scaling on HiDPI displays
chore(ci): add license-checker to frontend workflow
docs: update deployment guide
test(io): add MOL v2000 round-trip property tests
```

## Pull request checklist

- [ ] All CI checks pass (typecheck, lint, test, format, license)
- [ ] Tests written for new code (coverage >= 80% on compute paths)
- [ ] No GPL/LGPL/AGPL dependencies introduced
- [ ] Commit messages follow conventional commits
- [ ] PR description explains *why*, not just *what*

## Architecture Decision Records

Major technical decisions are documented as ADRs in `docs/adr/`. If your contribution involves a significant architectural choice, please create or update the relevant ADR.

## Code of Conduct

Be kind, be constructive, be patient. We're building something for chemists who can't afford ChemDraw. That mission matters more than any technical disagreement.

## Questions?

Open an issue or reach out to [@electrosenpai](https://github.com/electrosenpai).
