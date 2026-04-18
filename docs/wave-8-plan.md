# Wave-8 Plan — Ship the Headline

**Source** — `docs/nmr-scientific-review-v7.md` §VI
**Created** — 2026-04-18
**Target end** — 2026-05-02 (~2 weeks)

## Focus

**"Ship the headline."** Wave-7 closed the toolbox click-handler bug (HF-6) but did not flip the feature flag. Wave-8 closes the gap between what shipped in waves 4–7 and what a public-beta visitor actually sees and trusts.

## Verdict-driving conditions (must ship before public-beta announcement)

These are the four items that the panel's V7 verdict is gated on (see `docs/nmr-scientific-review-v7.md` §V.2):

1. **README honesty pass** (W8-S-05) — drop "successor to ChemDraw" wording, relabel pharma-compliance as Experimental, refresh test counters to 677 / 242 / 28+1.
2. **Production observability** (W8-S-03) — Sentry + UptimeRobot + slowapi rate-limit on `/predict`.
3. **AuditLogPanel viewer** (W8-S-02) — read-only React panel + JSONL persistence + dispatcher wiring.
4. **Feedback channel** — `/feedback` endpoint + GitHub Discussions link in footer.

## P0 stories

### W8-S-01 — Flip canvas-new flag to default true

**As a** chemistry student visiting kendraw.fdp.expert
**I want** the new toolbox + ChemDraw hotkeys + clean/refine to be active by default
**So that** what I see matches what the docs and review describe

**AC**:

- `frontend/packages/ui/src/featureFlags.ts` `newCanvas` defaults `true`
- E2E `chromium` and `chromium-new-canvas` projects both pass
- All 28+ e2e specs pass with the new canvas
- Wedge / curly-arrow gap closed (W8-S-04 dependency) before the flip

**Effort**: 4 days (gated on W8-S-04)
**Critère de succès V8**: Volkov V8 ≥ 9.6 (returns to V6 ceiling)

### W8-S-02 — AuditLogPanel viewer + persistence

**As a** lab admin or QA reviewer
**I want** to see the audit chain entries in a read-only panel and have them survive a backend restart
**So that** the audit primitive becomes a feature

**AC**:

- React `AuditLogPanel` component listing entries (hash, parent, reason, actor, ts)
- Persistence: append entries to JSONL `~/.kendraw/audit-{date}.jsonl` on commit + verify chain on app boot
- `kendraw_audit/dispatcher.py` middleware that wraps mutating store commands and pushes to chain
- E2E test: open audit panel after edit, see entry, restart backend, see entry persists
- Backend pytest +5 cases on chain integrity

**Effort**: 1 week
**Critère de succès V8**: Al-Rashid V8 ≥ 8.2

### W8-S-03 — Production observability

**As an** ops admin
**I want** Sentry capturing JS + Python errors, UptimeRobot pinging `/api/health`, and `/predict` rate-limited
**So that** the public beta survives the first surge of traffic

**AC**:

- `@sentry/react` initialised with DSN env var, breadcrumb on tool activation
- `sentry-sdk[fastapi]` initialised in `backend/kendraw_api/main.py`
- `slowapi` rate-limit on `/predict`: 60 req/min/IP
- UptimeRobot URL added to README + `docs/deployment.md`
- Backend pytest: 1 case verifying 429 on burst

**Effort**: 3 days
**Critère de succès V8**: Weber V8 ≥ 9.5

### W8-S-04 — Bond-wedge + curly-arrow tools restored in canvas-new

**As an** organic chemist
**I want** the wedge (single + double + dashed) and curly-arrow tools to work in the new canvas
**So that** flipping the flag does not regress publication-grade structure drawing

**AC**:

- `BondWedgeTool` parity with legacy
- `CurlyArrowTool` parity with legacy with bond/atom snap (wave-3 520f89d behaviour)
- Toolbox group "stereo" populated with wedge variants
- Unit tests + 2 e2e specs

**Effort**: 4 days
**Critère de succès V8**: Duval V8 ≥ 8.9, Marcos V8 ≥ 8.7

### W8-S-05 — README honesty pass + test-counter refresh

**As a** prospective user
**I want** the README to reflect what actually shipped, not aspirational claims
**So that** I don't feel misled when I try the tool

**AC**:

- "Successor to ChemDraw" wording dropped, replaced with positioning consistent with Park's V7 take
- Pharma-compliance section relabelled "Experimental — validation in progress"
- Test counters refreshed: 677 FE / 249 BE / 28+1 e2e
- Beta caveats listed (no audit viewer yet, no SSO, etc.) in a single visible section

**Effort**: 1 day
**Critère de succès V8**: Park V8 ≥ 9.1, Al-Rashid V8 trust signal restored

### W8-S-06 — CDXML round-trip e2e + JCAMP overlay e2e

**As a** TEA / release engineer
**I want** the two highest-trust I/O paths covered by e2e
**So that** the panel-cited claims survive a refactor

**AC**:

- `frontend/e2e/cdxml-roundtrip.spec.ts` exercising export → re-import → assert atom + bond identity
- `frontend/e2e/jcamp-overlay.spec.ts` exercising drag-drop + spectrum render
- Both pass on `chromium` and `chromium-new-canvas` projects

**Effort**: 2 days
**Critère de succès V8**: Murat audit verdict moves from CONDITIONAL to GO

## Total wave-8 effort (P0 only)

≈ **3 weeks of single-developer work** with parallel-execution overlap on independent stories. W8-S-03, W8-S-05, W8-S-06 can run parallel to W8-S-02 and W8-S-04.

## V8 success criteria

Composite arithmetic mean ≥ **9.0**, weighted research mean ≥ **8.85**, with no panelist below **8.0** and Al-Rashid specifically ≥ **8.2**. If those numbers hit, beta status promotes from CONDITIONAL to UNCONDITIONAL.

## Deferred to wave-9

- Multi-page document support (Marcos blocker, large)
- Resolved multiplet rendering (Marcos + Yamamoto P1)
- Python API client for batch use (Chen P0)
- NMRShiftDB2 evaluation harness (Chen P0)
- Stereochemistry micro-geometry polish (Duval P1)
- Backup / restore strategy + multi-tenant isolation (Weber P1)
- Tool-overflow dropdown for non-P0 tools (Park P1, Sally P1)
- Theme-aware tooltip system replacing native `title` (Sally P1)
