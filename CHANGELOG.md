# Changelog

All notable changes to Kendraw will be documented in this file.

## [0.1.0] — 2026-04-12

### Added

- **Drawing Engine**: Canvas 2D renderer with atoms (CPK colors, 25 elements), bonds (single/double/triple/wedge/dash/aromatic), and charge display
- **Scene Model**: Immutable scene model with Immer structural sharing, command bus with 11 command types
- **Undo/Redo**: Unlimited snapshot-based undo/redo with full state restore
- **Selection**: Spatial index (R-tree via rbush), single-click and rectangle-drag selection, shift-extend
- **Multi-document**: Tab-based multi-document workspace with auto-save to IndexedDB (Dexie)
- **Persistence**: Automatic 3-second debounced save, restore-on-reload
- **Ring Library**: 8 ring templates (benzene, cyclohexane, cyclopentane, cyclopropane, furan, pyridine, pyrrole, thiophene)
- **Valence Validator**: Real-time valence checking for common organic elements
- **Clipboard**: Copy/paste with ID remapping and position offset
- **Transforms**: Rotation with snap-to-angle (15/30/45/90), horizontal and vertical mirror
- **File I/O**: MOL v2000 parser/writer with round-trip support, KDX native format serialization
- **SVG Export**: Publication-quality SVG export with atom/bond rendering and Dublin Core metadata injection
- **Property Panel**: Real-time molecular formula (Hill system), molecular weight, atom/bond count
- **Frontend Chemistry**: Molecular formula and MW computation from scene data
- **Reaction Arrows**: Arrow model (forward, equilibrium, reversible, curly) with Bezier geometry
- **Annotations**: Rich text annotation model with arrow anchoring
- **Bezier Utilities**: Evaluate, bounding box, length, and default curvature generation
- **Design System**: Glasswerk CSS tokens with dark/light theme, glassmorphic panels
- **Tool Palette**: 4 tools (Select/Atom/Eraser/Pan) with keyboard shortcuts
- **Keyboard Shortcuts**: 15+ ChemDraw-compatible shortcuts with cheatsheet modal (?)
- **About Page**: Citation splash with BibTeX copy
- **Backend API**: FastAPI with /compute/properties (formula, MW, SMILES, InChI) and /convert (MOL/SDF/SMILES/InChI)
- **API Client**: Typed fetch wrapper for backend endpoints
- **i18n**: Message catalog with EN/FR translations
- **Backend Detection**: useBackendAvailability hook for static demo mode
- **Docker**: docker-compose with frontend (nginx) and backend (FastAPI)
- **CI**: GitHub Actions for lint, typecheck, test, build, license check
- **Release**: Automated release workflow with GHCR image push
- **Performance**: Codified benchmarks (500 atoms < 500ms, hitTest < 5ms)
- **Documentation**: Getting started, deployment, browser support, accessibility guides

### Infrastructure

- pnpm monorepo with 9 frontend packages
- TypeScript strict mode with noUncheckedIndexedAccess
- ESLint + Prettier + commitlint
- 150+ unit tests across all packages
- Vitest test runner
