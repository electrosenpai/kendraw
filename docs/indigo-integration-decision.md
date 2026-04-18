# Indigo integration — decision record

**Date.** 2026-04-18
**Status.** Accepted, shipped in commit `0f4bc92` (wrapper) + `c513ae5` (fuse endpoint).
**Author.** Jean-Baptiste Donnette

## Decision

Adopt EPAM Indigo as a **complementary** cheminformatics engine alongside RDKit. Indigo is invoked for:

- **High-quality 2D layout** — `Indigo.layout()` routinely beats RDKit's `Compute2DCoords` on fused polycyclic systems.
- **Native template fusion** — `merge() + mapAtom()` produces a clean, rewired molecule with no overlap. The previous local-only fusion in `@kendraw/scene` is correct topologically but produces "chelou" (off) layouts on bond-fusion.

RDKit remains the engine for:

- Property calculation (`compute_from_smiles`)
- NMR shift prediction (whole shift-table + multiplicity stack)
- SMILES / InChI conversion
- `/structure/clean` (sanitize + Compute2DCoords)

## Why both, not "switch to Indigo"

| Concern              | RDKit                  | Indigo                                     |
| -------------------- | ---------------------- | ------------------------------------------ |
| 2D layout quality    | Adequate               | **Excellent** on fused systems             |
| Native template fuse | No public API          | **`merge` + `mapAtom`** is idiomatic       |
| NMR / shift tables   | Used by `kendraw_chem` | Not present                                |
| SMILES / InChI       | Production-grade       | Production-grade                           |
| Threading            | Process-safe           | **Single-instance-per-thread** (TLS req'd) |
| License              | BSD-3                  | Apache 2.0                                 |

Killing RDKit would force porting NMR + properties; sticking with RDKit alone leaves layout quality on the table. Both libraries cohabit cleanly in the same Python process — verified by `test_indigo_and_rdkit_cohabit_in_same_process`.

## Threading note

Per Indigo's own docs:

> Using a single `Indigo` instance across multiple threads is prohibited.

FastAPI sync endpoints run in Starlette's threadpool. The wrapper at `backend/kendraw_chem/indigo_service.py` therefore holds **one `Indigo()` per thread via `threading.local()`** rather than the singleton pattern the upstream README suggests. Verified by `test_indigo_thread_local_yields_distinct_instances`.

## Surface area shipped

| Layer                | File                                                     | Tests                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------- |
| Backend wrapper      | `backend/kendraw_chem/indigo_service.py`                 | `tests/test_indigo_service.py` (6)          |
| Backend fuse methods | `IndigoService.fuse_template_atom` / `_bond`             | `tests/test_fuse_template_indigo.py` (12)   |
| HTTP endpoint        | `POST /structure/fuse-template`                          | included in `test_fuse_template_indigo.py`  |
| Frontend helper      | `packages/ui/src/canvas-new/templateFusion.ts`           | `__tests__/templateFusion.test.ts` (7)      |
| Tool wiring          | `packages/ui/src/canvas-new/tools/ringTool.ts`           | manual + E2E                                |
| End-to-end           | `e2e/canvas-new/template-fusion.spec.ts`                 | 3 (auto-skip outside `VITE_ENABLE_NEW_CANVAS=true`) |

Backend test count: **267** (was 249, +6 indigo wrapper +12 fuse).
Frontend test count: **192** (was 184, +8 templateFusion).

## Licence + attribution

Indigo ships as `epam-indigo` on PyPI under Apache 2.0. The Apache 2.0 NOTICE / LICENSE files travel inside the wheel; Kendraw redistributes no Indigo artefacts of its own. Attribution is recorded in `docs/THIRD-PARTY-NOTICES.md` alongside the existing Ketcher entry.

## Rejected alternatives

- **Switch entire backend to Indigo.** Would require porting the NMR shift table + multiplicity engine (≥ 1k lines + 50+ regression tests). Out of scope for a hotfix wave.
- **Use OpenBabel for layout.** Layout quality below Indigo on fused systems; Python bindings have known thread-safety issues without TLS guards.
- **Compute layout in the browser via RDKit.js / Indigo.js WASM.** Bundle size cost (~3-8 MB) and no shared engine with the NMR pipeline.

## Follow-ups (not blocking)

- Consider replacing `/structure/clean(mode='full')` Compute2DCoords backend with Indigo's `layout()` when available; currently the cleanup button still uses RDKit.
- Expose template-anchor selection in the toolbox UI (the API supports it; the ring tool currently always uses the default anchor `[0]` / `[0, 1]`).
- Hook Indigo's `dearomatize()` into the kekulé toggle so single-bond-style users can flip polycyclic systems on demand.
