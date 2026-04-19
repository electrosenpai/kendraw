# Third-party notices

Kendraw is an independent project. The codebase is MIT-licensed and contains
no third-party source code. This file credits upstream projects whose
**designs, algorithms, or visual conventions** inspired parts of Kendraw.
Each file that takes inspiration from an upstream carries an attribution
comment pointing to the original repository.

## Ketcher — EPAM Systems

- **Project.** Ketcher — web-based 2D chemical structure editor
- **Upstream.** https://github.com/epam/ketcher
- **License.** Apache 2.0
- **Copyright.** © 2010-2025 EPAM Systems
- **Distribution (wave-8+).** npm packages `ketcher-react`,
  `ketcher-standalone`, and `ketcher-core` at `^3.12.0`, declared in
  `packages/ui/package.json`. Bundled into the Kendraw frontend when
  `VITE_USE_KETCHER=true` is set at build or runtime.

### Relationship

Ketcher plays two roles in Kendraw:

1. **Design reference (wave-4 onward).** Kendraw's own clean-room canvas
   (`packages/ui/src/canvas-new/`) reads Ketcher's public sources to
   understand drawing-tool ergonomics (tool abstraction, pointer dispatch
   lifecycle, rubber-band marquee, 15° angle snap, quick-edit panel) and
   re-implements equivalent behaviour from scratch in TypeScript against
   Kendraw's own scene/renderer packages. No Ketcher source code has been
   copied, transformed, or machine-translated into canvas-new.
2. **Embedded drawing engine (wave-8 onward).** When
   `VITE_USE_KETCHER=true`, Kendraw mounts the real Ketcher React editor
   in place of canvas-new and routes its own Properties Panel, NMR
   Panel, import dialogs and export flows to Ketcher's public API
   (`onInit`, `getMolfile`, `setMolecule`, `subscribe('change' |
   'selectionChange')`). The embedded Ketcher runs in standalone mode —
   Indigo chemistry executes in a Web Worker bundled via
   `ketcher-standalone`, with no backend requirement from the Ketcher
   side. Kendraw's own backend (RDKit + Indigo + ChemNMR) continues to
   serve NMR prediction, property computation and template fusion
   independently.

### Files that reference Ketcher

- Every file in `packages/ui/src/canvas-new/` that mirrors a Ketcher
  design choice opens with the header
  `// Design inspired by Ketcher (EPAM Systems, Apache 2.0)`.
- Every file in `packages/ui/src/canvas-ketcher/` that embeds Ketcher
  opens with the header
  `// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as
  Kendraw's drawing engine. Ketcher upstream: https://github.com/epam/ketcher`.

### Apache 2.0 compatibility

The Apache 2.0 licence is compatible with Kendraw's MIT licence for both
design-only reference and npm-dependency redistribution. Apache 2.0
requires preserved copyright and LICENSE notices — those live inside
each Ketcher package's `node_modules/<pkg>/` directory as shipped by
the upstream npm tarball. Kendraw does not modify Ketcher sources.

## Indigo — EPAM Systems

- **Project.** Indigo — cheminformatics toolkit (C++ core, Python bindings)
- **Upstream.** https://github.com/epam/Indigo
- **License.** Apache 2.0
- **Copyright.** © 2009–Present EPAM Systems
- **Distribution.** PyPI package `epam-indigo`, declared in `backend/pyproject.toml` and installed at runtime alongside RDKit.

### Relationship

Indigo runs server-side as a complement to RDKit. Kendraw delegates
high-quality 2D layout and template-fusion (atom- and bond-shared ring
fusion) to Indigo's native `merge` + `mapAtom` + `layout` primitives;
RDKit remains the engine for property calculation, NMR shift
prediction, and SMILES/InChI conversion.

The Indigo binary is loaded via `ctypes` from the upstream wheel — no
Indigo source has been vendored or modified. The wrapper at
`backend/kendraw_chem/indigo_service.py` is independently authored
Kendraw code.

### Apache 2.0 compatibility

Apache 2.0 is compatible with Kendraw's MIT licence; Kendraw redistributes
no Indigo artefacts of its own. Indigo's NOTICE and LICENSE files travel
inside the upstream wheel.

## Other upstream credits

See the `package.json` dependency tree for the full list of libraries
bundled at runtime; each carries its own licence file inside
`node_modules/`.
