# Kendraw

**Open-source modern web successor to ChemDraw.** Draw publication-quality molecular structures, reactions, and mechanisms in your browser — free, self-hosted, no account required.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![No Telemetry](https://img.shields.io/badge/telemetry-none-green.svg)](#privacy)

> **Status:** Sprint 0 — infrastructure & proof-of-concept phase. Not yet usable for chemistry work.

---

## Why Kendraw?

- **Free forever** — MIT licensed, no subscription, no license server.
- **Self-hosted** — runs on your laptop, your lab's server, or a Raspberry Pi. No cloud dependency.
- **Modern UX** — glassmorphism dark/light UI, multi-tabs, auto-save, ChemDraw-compatible shortcuts.
- **Publication quality** — SVG/PNG/PDF exports meeting JACS/Angewandte standards.
- **Privacy first** — zero telemetry, zero tracking, zero outbound network calls.

---

## Quick Start

### With Docker (recommended)

```bash
git clone https://github.com/electrosenpai/kendraw.git
cd kendraw/docker
docker compose up
```

Open [http://localhost:8080](http://localhost:8080).

### Development

```bash
# Frontend
pnpm install
pnpm dev              # http://localhost:5173

# Backend
cd backend
uv sync
uv run uvicorn kendraw_api.main:app --reload --port 8081
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full dev setup guide.

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

Kendraw collects **no personal data**, sends **no telemetry**, and makes **no outbound network calls** by default. Your structures stay on your machine. See the [architecture document](docs/architecture-kendraw-2026-04-12.md) section 8 (NFR-008) for details.

---

## Documentation

- [Architecture](docs/architecture-kendraw-2026-04-12.md)
- [Product Requirements](docs/prd-kendraw-2026-04-12.md)
- [UX Design](docs/ux-design-kendraw-2026-04-12.md)
- [Sprint Plan](docs/sprint-plan-kendraw-2026-04-12.md)
- [Contributing](CONTRIBUTING.md)
- [Backend README](backend/README.md)

---

## License

[MIT](LICENSE) — Copyright 2026 Jean-Baptiste Donnette.
