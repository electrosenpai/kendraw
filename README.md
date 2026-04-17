# Kendraw

**Open-source modern web successor to ChemDraw.** Draw publication-quality molecular structures, predict NMR spectra, and compute molecular properties from your browser or a self-hosted Docker stack — free, MIT, no account, no telemetry.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![No Telemetry](https://img.shields.io/badge/telemetry-none-green.svg)](#privacy)

> **Status:** active development. The drawing editor, the ¹H/¹³C NMR module, the molecular property panel, and the import/export pipeline are all usable today. See the scientific review and roadmap below for the honest state of each area.

---

## Why Kendraw

- **Free forever** — MIT licensed, no subscription, no license server, no per-seat fee.
- **Browser or Docker** — runs in any modern browser for local use, or as a two-container stack (`@kendraw/ui` + FastAPI backend) on your own server.
- **NMR that beats ChemDraw in several dimensions** — color-coded DEPT visualization, bidirectional atom ↔ peak highlighting, per-peak confidence markers, native PNG/SVG/CSV export. ChemDraw only exports a screenshot.
- **Transparent confidence** — every NMR prediction ships with a 3-level confidence score and a tooltip that spells out the environment, the multiplicity rule, and the coupling constants used.
- **Privacy first** — zero telemetry, zero tracking, zero outbound calls. Your structures never leave your machine unless you explicitly import from PubChem.

---

## Features

### Chemical drawing

Current ChemDraw feature-parity: **43%** across 176 audited features (54 implemented, 45 partial, 77 missing, 14 areas where Kendraw is objectively superior). Post-session recalculation: **~52%**. Full matrix: [`docs/chemdraw-exhaustive-comparison.md`](docs/chemdraw-exhaustive-comparison.md).

- Canvas 2D + SVG renderer with spatial index and hit-testing
- Single / double / triple / aromatic / wedge / dash / hashed-wedge / wavy / dative bonds
- Flip H/V, rotate 15°, structure cleanup
- Fused ring templates — naphthalene, indole, quinoline, purine, steroid
- Reaction arrows (forward, equilibrium, reversible, resonance) + curly arrows (full-head / half-head)
- Text annotation tool with free text / formula mode / bold / italic
- Lone-pair dot display on heteroatoms
- Document style presets — ACS 1996, ACS Nano, RSC, Wiley/Angewandte, Nature
- Multi-tab workspace, IndexedDB auto-save

### Molecular properties

Backend endpoints powered by RDKit 2026.3.1+, surfaced live in the `PropertyPanel`.

- Molecular formula (Hill ordering) and molecular weight
- Exact monoisotopic mass
- LogP (Crippen), tPSA
- Hydrogen-bond donors / acceptors (HBD, HBA)
- Lipinski rule-of-five flag
- Canonical SMILES
- InChI and InChIKey
- Real-time valence warnings

### NMR prediction

Composite score from the 8-expert scientific review V5: **8.3 / 10 raw**, **7.8 / 10 research-weighted** (source: [`docs/nmr-scientific-review-v5.md`](docs/nmr-scientific-review-v5.md)). Previous review V4 was 7.4 raw — a +0.9 jump driven by ¹³C prediction, DEPT, and the import fixes.

- ¹H and ¹³C chemical shift prediction — additive method + RDKit, 15 proton environments and 30+ carbon environments
- Multiplet rendering with J-coupling — s, d, t, q, quint, sext, sept, m plus dd / ddd convolved with Pascal intensities
- Frequency selector — 300 / 400 / 500 / 600 MHz with live Δppm = J / ν₀ recomputation
- DEPT classification visualized in-panel — CH₃ / CH₂ / CH / C color-coded with inversion
- Bidirectional atom ↔ peak highlighting
- Per-peak confidence markers (high / medium / low) with detailed hover tooltips
- 6 solvents — CDCl₃, DMSO-d₆, CD₃OD, acetone-d₆, C₆D₆, D₂O
- Proton numbering (H-1, H-2, …) synchronized between structure and peak list
- Signal table (7 columns: H#, shift, multiplicity, J, integral, assignment, confidence)
- Export PNG, SVG, CSV natively (ChemDraw only offers a screenshot)

### Import / export

- SMILES smart paste and import via dialog (frontend `layout2D()` with ring detection + spring relaxation)
- MOL V2000 import/export with correct Y-axis handling
- SDF multi-molecule handling via the PubChem path
- CDXML import (ChemDraw round-trip, export currently missing — tracked as a P1 dealbreaker)
- PubChem search with autocomplete, 2D coordinates, name / SMILES / formula lookup
- Canvas export — PNG, SVG, PDF (A4 landscape, centered, high-resolution) with arrows and annotations preserved

### Developer experience

- pnpm monorepo with 11 workspace packages (`ui`, `chem`, `constraints`, `io`, `nmr`, `persistence`, `renderer-canvas`, `renderer-svg`, `scene`, `api-client`, `scene-poc`)
- TypeScript 6 strict mode across every package
- Python 3.11 + FastAPI 0.115 + Pydantic 2 + mypy strict on the backend
- **407 frontend unit tests** across 9 Vitest workspaces (scene 192, io 66, nmr 60, constraints 45, renderer-canvas 13, renderer-svg 12, persistence 10, chem 6, ui 3)
- **228 backend unit tests** (pytest)
- **21 Playwright E2E specs** split across p0-smoke, p1-critical, p2-features, p3-edge, and regression suites
- Husky pre-commit hook running all 7 CI checks (eslint, tsc, vitest, ruff check, ruff format, mypy, pytest) before every commit
- GitHub Actions CI + Playwright E2E workflow
- Docker Compose + Traefik + Let's Encrypt production stack (deployed at `kendraw.fdp.expert`)

---

## Installation

### Docker (recommended)

```bash
git clone https://github.com/electrosenpai/kendraw.git
cd kendraw/docker
docker compose up
```

Open [http://localhost:8080](http://localhost:8080).

### Local development

```bash
# Frontend (requires Node >= 20, pnpm >= 9)
pnpm install
pnpm dev              # http://localhost:5173

# Backend (requires Python >= 3.11, uv)
cd backend
uv sync
uv run uvicorn kendraw_api.main:app --reload --port 8081

# Both at once
pnpm dev:full
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [`docs/getting-started.md`](docs/getting-started.md) for the full setup.

---

## Keyboard shortcuts

**28 of 35 ChemDraw shortcuts implemented (80% parity)** — full matrix in [`docs/keyboard-shortcuts-compliance.md`](docs/keyboard-shortcuts-compliance.md).

All shortcuts are disabled while typing in text inputs, textareas, or contenteditable fields, so atom/bond hotkeys never collide with annotation editing, the search bar, or the import dialog.

Atoms (with selection): `C N O S F P B L I H M` + `+` / `-` for charges
Bonds (with selection or as tool modifier): `1 2 3 d w y`
Document: `Ctrl+Z / Y / C / V / X / A / N`, `Ctrl+M` mirror H, `Ctrl+Shift+M` mirror V, `Ctrl+R` rotate 15°, `Ctrl+Shift+K` cleanup, `Ctrl+0` fit to screen
Tools: `V A B R E H W U P ?`

---

## Scientific validation

- **NMR scientific review V5** — 8 independent expert reviewers (organic, synthesis, biomolecular, NMR methodology, pharma, academic, education), composite score **8.3 raw / 7.8 weighted**. Read it: [`docs/nmr-scientific-review-v5.md`](docs/nmr-scientific-review-v5.md). Prior iterations: V4 (7.4), V3, V2 also in `docs/`.
- **Roadmap to 10** — remaining path distilled from the same panel: [`docs/kendraw-roadmap-to-10.md`](docs/kendraw-roadmap-to-10.md).
- **ChemDraw exhaustive comparison** — 176 features audited against the 27-page ChemDraw Professional reference: [`docs/chemdraw-exhaustive-comparison.md`](docs/chemdraw-exhaustive-comparison.md).
- **Benchmarks vs ChemDraw** — [`docs/benchmark-kendraw-vs-chemdraw-v0.1.0.md`](docs/benchmark-kendraw-vs-chemdraw-v0.1.0.md).

---

## Cite this work

If you use Kendraw in your research, please cite it:

```bibtex
@software{donnette_kendraw_2026,
  author       = {Donnette, Jean-Baptiste},
  title        = {Kendraw: Open-source modern web successor to ChemDraw},
  year         = {2026},
  url          = {https://github.com/electrosenpai/kendraw},
  license      = {MIT}
}
```

A `CITATION.cff` file is included at the root of this repository for automated citation tools.

---

## Privacy

Kendraw collects **no personal data**, sends **no telemetry**, and makes **no outbound network calls** unless you explicitly trigger a PubChem search. Your structures stay on your machine. See [`docs/architecture-kendraw-2026-04-12.md`](docs/architecture-kendraw-2026-04-12.md) section 8 (NFR-008) for details.

---

## Contributing

Read [CLAUDE.md](CLAUDE.md) first — it defines the mandatory CI checks that run before every push, the pre-commit hook behaviour, and the E2E test requirements. Then see [CONTRIBUTING.md](CONTRIBUTING.md) for workflow conventions.

---

## Documentation

- [Architecture](docs/architecture-kendraw-2026-04-12.md)
- [Product Requirements](docs/prd-kendraw-2026-04-12.md)
- [UX Design](docs/ux-design-kendraw-2026-04-12.md)
- [Sprint Plan](docs/sprint-plan-kendraw-2026-04-12.md)
- [API endpoints map](docs/api-endpoints-map.md)
- [Deployment (Traefik)](docs/deployment-traefik.md)
- [Backend README](backend/README.md)

---

## License

[MIT](LICENSE) — Copyright 2026 Jean-Baptiste Donnette.
