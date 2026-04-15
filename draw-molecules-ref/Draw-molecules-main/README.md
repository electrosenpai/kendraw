# Draw-molecules

`Draw-molecules` is an interactive molecular drawing application inspired by ChemDraw, built with `React`, `TypeScript`, `Vite`, and `OpenChemLib`.

The project combines structure drawing, constraint-aware refinement, live chemical analysis, and predicted NMR visualization in a single desktop-friendly web interface.

## Features

- Interactive molecular editor with atom, bond, chain, ring, text, arrow, pan, and selection tools
- Constraint-aware drawing helpers for cleaner bond placement and structure refinement
- Proton numbering overlays to connect the drawn structure with NMR assignments
- Predicted `1H` and `13C` NMR spectra with solvent selection, signal detail, and multiplet views
- Analytical report export in HTML with print / PDF preview
- Structured analytical exports in `JSON`, `1H CSV`, and `13C CSV`

## Tech stack

- `React 19`
- `TypeScript`
- `Vite`
- `OpenChemLib`
- `nmr-predictor`
- `nmr-simulation`
- `Vitest`

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the full test suite:

```bash
npm test
```

Run the NMR benchmark suite:

```bash
npm run nmr:benchmark
```

## Current focus

The current implementation already covers the first major product layers:

- ergonomic molecular drawing
- constraint-aware cleanup and refine workflows
- live RMN prediction and assignment navigation
- report, preview, PDF-oriented printing, and data export workflows

The remaining work is mostly product polish and deeper analytical extensions.
