# Getting Started with Kendraw

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11 (for backend, optional)
- uv (for backend dependency management, optional)

## Quick Start (Frontend Only)

```bash
git clone https://github.com/electrosenpai/kendraw.git
cd kendraw
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

## With Backend

```bash
# Terminal 1: Frontend
pnpm dev

# Terminal 2: Backend
cd backend
uv sync
uv run uvicorn kendraw_api.main:app --host 0.0.0.0 --port 8081
```

## With Docker

```bash
cd docker
docker compose up
```

Frontend: http://localhost:8080
Backend: http://localhost:8081/health

## Development

```bash
pnpm lint          # ESLint
pnpm format        # Prettier auto-fix
pnpm format:check  # Prettier check
pnpm typecheck     # TypeScript
pnpm test          # Vitest
pnpm build         # Production build
```

## Project Structure

```
kendraw/
├── packages/
│   ├── scene/            # Scene model, commands, undo/redo
│   ├── renderer-canvas/  # Canvas 2D renderer
│   ├── renderer-svg/     # SVG export renderer
│   ├── persistence/      # IndexedDB via Dexie
│   ├── io/               # MOL v2000, KDX serialization
│   ├── chem/             # Molecular property computation
│   ├── api-client/       # Backend API client
│   └── ui/               # React 18 application
├── backend/              # FastAPI backend
├── docker/               # Docker configuration
└── docs/                 # Documentation
```
