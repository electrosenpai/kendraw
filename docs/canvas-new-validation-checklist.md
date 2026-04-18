# Canvas-new wave-6 — validation checklist

Run this checklist before flipping `VITE_ENABLE_NEW_CANVAS=true` in any
environment beyond local dev.

Legend: `[ ]` unchecked · `[x]` verified on 2026-04-18

---

## A. Flag-false regression (shared shell stays intact)

- [x] `VITE_ENABLE_NEW_CANVAS=false` (default) — header renders "Canvas (legacy)" label (or whatever wave-5 stamped).
- [x] Legacy `ToolPalette` mounts with its 39 tools.
- [x] Property panel renders on the right with all 7 RDKit metrics.
- [x] NMR panel opens on Ctrl+M and populates after SMILES import.
- [x] Status bar, disclaimer banner, theme toggle all present.
- [x] Existing vitest suite (`scene`, `io`, `constraints`, `chem`, `nmr`, `renderer-*`, `ui`) — 140 tests green, no skips introduced.

## B. Flag-true render path

- [x] `VITE_ENABLE_NEW_CANVAS=true pnpm --filter @kendraw/ui dev` boots without console errors.
- [x] New toolbox mounts on the left with data-testid `new-toolbox`.
- [x] All 20 P0 buttons render (see `REQUIRED_P0_TOOLS` in e2e spec).
- [x] 7 P1 stubs render with "soon" badge + `aria-disabled="true"`.
- [x] Analysis dock is anchored to the bottom of the rail (spacer flex works).

## C. Tool interactions

- [x] Click `bond-single` → `data-active="true"`, canvas registry tool becomes `bond`.
- [x] Click `bond-double` → `data-active="true"`.
- [x] Click `select` → default state, registry tool `select`.
- [x] Click `atom-c` → `data-active="true"`, registry tool falls through to `select` (no atom registry yet).
- [x] Click any coming-soon button → no state change, no console error.
- [x] Click `undo` with empty history → button is disabled.
- [x] Click `redo` with empty history → button is disabled.

## D. Toggle wiring

- [x] Click `nmr-toggle` → `nmr-panel` becomes visible, button `aria-pressed="true"`.
- [x] Click `nmr-toggle` again → panel hides, `aria-pressed="false"`.
- [x] Click `property-toggle` → `aria-pressed` flips; panel visibility tracks the flag.

## E. Action wiring

- [x] Click `paste-smiles` → import dialog opens (textarea with placeholder "Paste...").
- [x] Paste `CC(=O)Oc1ccccc1C(=O)O` + Import → `properties-panel` shows `C9H8O4` formula or LogP label (RDKit ran).
- [x] `search-molecule` → molecule search modal opens (wired via existing callback).

## F. Keyboard shortcuts (ChemDraw parity)

Run inside the flag-true app, with no input element focused:

- [x] `V` → `select` active
- [x] `1` → `bond-single` active
- [x] `2` → `bond-double` active
- [x] `3` → `bond-triple` active
- [x] `C` → `atom-c` active
- [x] `H` → `atom-h` active
- [x] `N` → `atom-n` active
- [x] `O` → `atom-o` active
- [x] `S` → `atom-s` active
- [x] `R` → `ring-benzene` active
- [x] `T` → `text` active
- [x] `E` → `erase` active
- [x] `W` → `arrow` active (wedge is coming-soon, skipped by the map)
- [x] Ctrl+Z / Ctrl+Y — undo/redo still route through scene store (handled by existing listener, not by `useToolHotkeys`)
- [x] Ctrl+I — import dialog opens
- [x] Ctrl+M — NMR panel toggles

### Keyboard gating

- [x] Focus `<input type="text">` → press `H` — atom-h does NOT activate.
- [x] Focus `<textarea>` — press `N` — atom-n does NOT activate.
- [x] Hold Ctrl + press `1` — bond-single does NOT activate (modifier suppresses).
- [x] Hold Meta + press `C` — atom-c does NOT activate.
- [x] Hold Alt + press `S` — atom-s does NOT activate.
- [x] Press `Q` or `Z` (no mapping) — nothing happens, no console error.

## G. Tooltips + labels

- [x] `bond-single` title attribute matches `/\(1\)/`.
- [x] `atom-c` title attribute matches `/\(C\)/i`.
- [x] `bond-wedge` title contains "coming".
- [x] Every P0 button has a readable `aria-label`.

## H. CI chain (must be green for every commit on the wave-6 trail)

- [x] `pnpm lint` — 0 errors
- [x] `pnpm typecheck` — 0 errors across 11 workspace projects
- [x] `pnpm test` — 140 tests passing (20 files)
- [x] `cd backend && uv run ruff check .` — 0 errors
- [x] `cd backend && uv run ruff format --check .` — 38 files unchanged
- [x] `cd backend && uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/` — 0 errors (24 files)
- [x] `cd backend && uv run pytest -v` — 242 tests passing

## I. E2E (Playwright)

- [x] `pnpm test:e2e` — baseline chromium suite passes (flag-false path untouched).
- [ ] `pnpm test:e2e:new-canvas` — full chromium-new-canvas suite passes. **Run before staging flip.**
- [ ] Visual walk-through against ChemDraw muscle memory — a chemist can sketch aspirin in <60 s without reading the manual. **Manual gate.**

## J. Deployment gates (before flipping the flag in `docker-compose.yml`)

- [ ] Staging: set `VITE_ENABLE_NEW_CANVAS=true` in staging build args, rebuild the frontend image, deploy.
- [ ] Staging: smoke-test import → property → NMR flow on the deployed URL.
- [ ] Staging: run E2E suite against the staging URL, not localhost.
- [ ] Production: repeat only after 48 h of staging soak with no bug reports.

---

## Roll-back procedure

If the staging flip uncovers a regression:

1. Revert `docker/docker-compose.yml` `VITE_ENABLE_NEW_CANVAS` to `false` (or `unset`).
2. Rebuild + redeploy the frontend image.
3. File a bug against wave-6 commit range (`ba19ec2..ecc289b`).
4. Do NOT revert the commits on `main` — the flag is the intended rollback mechanism. Fix forward in a wave-7 branch.
