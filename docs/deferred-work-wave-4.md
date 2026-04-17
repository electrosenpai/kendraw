# Wave-4 Deferred Work

> Companion to `docs/implementation-report-wave-4.md`. Items below are
> intentionally out of scope for wave-4 — either they require infra
> that wave-4 should not introduce, or they are obvious follow-ups
> that the wave-4 P1 stories made *easier* but did not themselves
> deliver. Each item names the wave it is targeted to and the source
> story it spun out of, so wave-5 planning can ingest this file
> directly into its backlog.

## NMR (P1-01 / P1-02 / P1-03 follow-ups)

### W4-D-01 — JCAMP-DX ASDF decompression
**Source.** P1-03 (`packages/io/src/jcamp-dx.ts`).
**Why deferred.** ~95 % of files exported by Bruker / JEOL /
MestReNova use AFFN. The ASDF (ASCII Squeezed Difference Form)
encoding is the next 4 % and requires an explicit decoder that
is non-trivial to implement correctly. Wave-4 chose to refuse
ASDF rather than guess, so callers never silently render the
wrong spectrum.
**Target.** Wave-5 NMR sweep.
**Done when.** `parseJcampDx1D` accepts an ASDF body and the
parser tests cover SQZ + DIF + DUP characters and Y-checksum
verification.

### W4-D-02 — JCAMP-DX 2D NMR planes (NTUPLES)
**Source.** P1-03.
**Why deferred.** 2D NMR planes (HSQC, HMBC, COSY, NOESY)
require a fundamentally different in-memory shape (matrix
instead of 1D array) and a contour-plot renderer. Out of scope
for the wave-4 "import 1D overlay" goal.
**Target.** Wave-6 NMR-2D wave.

### W4-D-03 — Multiplet roof effect & 2nd-order patterns
**Source.** P1-02.
**Why deferred.** P1-02 ships first-order multiplet readability
(line list + integration). The roof effect (asymmetric line
intensities when Δν / J is small) and full AB / ABX simulation
require a quantum-mechanical density-matrix step the predictor
does not yet expose. Worth doing, but bigger than a wave-4 P1.
**Target.** Wave-5 NMR sweep, behind `roofEffect` flag.

### W4-D-04 — Embed JCAMP overlay into CDXML export
**Source.** P1-03 + P1-06.
**Why deferred.** ChemDraw's CDXML schema can carry an embedded
spectrum but the layout requirements are non-trivial (PageSplitter,
SpectrumPlot block). Punted to wave-5 to keep P1-06 focused on
structure round-trip.

## Compliance (P1-04 / P1-05 follow-ups)

### W4-D-05 — Per-user cryptographic identity
**Source.** P1-04, P1-05.
**Why deferred.** Wave-4 ships tamper-evidence (SHA-256 chain) but
not non-repudiation. Adding per-user keypair signatures to each
audit entry needs a key-management layer (where keys live, how
they rotate, how revocation surfaces in `verifyAuditChain`).
That belongs in wave-5 with the identity / SSO scope, not as
incidental work.
**Done when.** `AuditEntry` carries an `actorSignature` field
that wraps an EdDSA signature over `hash`, and a published key
registry lets `verifyAuditChain` check it.

### W4-D-06 — Audit log persistence to IndexedDB
**Source.** P1-04.
**Why deferred.** `InMemoryAuditLog` is the data primitive; a
production deployment needs a durable sink. Adding a Dexie table
and a flush-on-append wrapper is straightforward but trivially
risky to get wrong (UI freezes during big appends, losing tail
on tab close). Wave-5 will pair this with W4-D-07 below.
**Target.** Wave-5 compliance hardening.

### W4-D-07 — Wire audit log into the command dispatch chokepoint
**Source.** P1-04 + P1-05 (the implementation plan called for a
"dispatch wrapper").
**Why deferred.** The wave-4 implementation focused on the data
primitives + tests + a standalone modal. Plumbing every command
in `packages/scene/src/store.ts` through an audit-emitting
wrapper is a cross-cutting refactor that warrants its own PR
with an explicit before/after performance baseline (we do not
want the audit dispatch to add latency to the hot path).
**Done when.** Every mutation that flows through
`SceneStore.dispatch` produces an `AuditEntry`, with a payload
diff small enough for production use (< 200 bytes typical).

### W4-D-08 — `AuditLogPanel.tsx` viewer
**Source.** P1-04.
**Why deferred.** No viewer means the chain is invisible to the
end user even though it is recording correctly. A minimal viewer
(table of entries + verify button + "broken at seq N" indicator)
is a wave-5 quality-of-life follow-up.
**Done when.** A panel under Settings > Audit shows the
current document's audit chain and runs `verifyAuditChain` with
a green / red indicator.

### W4-D-09 — Server-side lock enforcement
**Source.** P1-05.
**Why deferred.** Browser-only lock state is by definition
client-trusted. A multi-user deployment must replicate the
lock state on the backend so that user B genuinely cannot
mutate a record user A has signed. Backend story.
**Target.** Wave-5 / backend track.

### W4-D-10 — E-sig modal: app-level wiring
**Source.** P1-05.
**Why deferred.** `ESigModal` is a pure component; opening it on
the right gesture (file menu "Lock & sign…", keyboard shortcut)
is an `App.tsx` change that is cleaner to do alongside W4-D-07
when the dispatch wrapper exists.

## Regulated export (P1-06 follow-ups)

### W4-D-11 — R-group / Markush attachment points in CDXML
**Source.** P1-06 (and Al-Khatib's pharma blocker).
**Why deferred.** Kendraw does not yet have an R-group / Markush
data model in `packages/scene/src/types.ts`. Adding the model is
a P0 item for wave-5; once it exists, exporting it as CDXML's
`<n NodeType="GenericNickname">` attachment-point convention is
straightforward.
**Done when.** A scene with an R-group node serialises to CDXML
with the correct attachment-point geometry and a wave-5 Al-Khatib
review marks the Markush blocker closed.

### W4-D-12 — CDXML stereo descriptors beyond wedge/hash
**Source.** P1-06.
**Why deferred.** P1-06 covers the visual stereo display the
chemist draws (wedge / hash / hollow-wedge). Atom-parity / bond-
parity descriptors (the "C@1" semantics) need the chem layer to
canonicalise them first. Wave-5 chem story.

### W4-D-13 — PDF/A-1b export for eCTD submissions
**Source.** Reid (regulatory) blocker, partially addressed by
P1-06.
**Why deferred.** PDF/A-1b is an entirely different export path
(PDF-rendering pipeline + font embedding + colour-profile
embedding). Out of scope for wave-4. Reid flagged CDXML as the
hard blocker for v1; PDF/A-1b is the v1.1 follow-up.
**Target.** Wave-5 export track.

### W4-D-14 — Curly arrow geometry preservation in CDXML
**Source.** P1-06.
**Why deferred.** ChemDraw's `<arrow>` element does not encode
the bezier control points the way our `Arrow.geometry` does;
proper round-trip requires emitting `<curve>` + `<arrowhead>`
pairs. Currently we degrade curly-radical / curly-pair arrows
to straight `<arrow>` elements with a documentation note.
**Target.** Wave-5 CDXML completeness pass.

## Documentation & tooling

### W4-D-15 — Update `docs/keyboard-shortcuts-compliance.md` to 35/35
**Source.** Wave-4 final deliverables.
**Why deferred.** Wave-4 added the `D` (DEPT cycle) and
`Shift+I` (integration toggle) shortcuts in the NMR panel. The
compliance doc still reflects the wave-3 31/35 score. Folded
into the same commit as this file's wave-4 final deliverable.
**Target.** Same wave (this commit batch).

### W4-D-16 — Refresh `docs/benchmark-kendraw-vs-chemdraw-v0.3.0.md`
**Source.** All wave-4 P1s.
**Why deferred.** Re-running the panel takes 3-4 hours of
roundtable time. Worth doing once wave-5 is also planned so the
panel can score "what shipped" + "what is planned next" in the
same sitting.
**Target.** Start of wave-5.

### W4-D-17 — Pharma-side compliance posture page
**Source.** P1-04 + P1-05 + Reid / Kumar feedback.
**Why deferred.** A proper "What Kendraw's Beta compliance
primitives do (and do not) cover" page belongs in `docs/` so
that prospective regulated-environment users can read it before
adopting. Out of scope for the implementation report itself.
**Target.** Wave-5 docs sweep.

## Wave-4 redraw — deferred stories

### W4-R-04 — HoverIcon atom + bond
**Source.** P0 redraw backlog.
**Why deferred.** Wave-4 shipped the shell (W4-R-01), tool
abstraction (W4-R-02), render parity (W4-R-03), snap utility
(W4-R-05), and marquee selection (W4-R-06). HoverIcon requires
a new renderer overlay layer (hovered atom / hovered bond ring)
that does not yet exist in `@kendraw/renderer-canvas` — adding
it without a dedicated design pass on dark/light affordance
colours risks visual regression on the legacy canvas that
shares the renderer.
**Target.** Wave-5 opening — pair with `renderer.setHoveredAtom()`
+ `renderer.setHoveredBond()` API additions.

### W4-R-07 — Drag-move selection with atomic undo
**Source.** P0 redraw backlog.
**Why deferred.** The drag-move command requires wiring a
reversible `move-atoms` command into `@kendraw/scene` that
coalesces intermediate positions so the history stack grows by
a single entry per drag. The coalescing policy touches the
undo/redo contract used by every existing tool in the legacy
canvas and needs a separate design review before we change the
command surface.
**Target.** Wave-5 — ships alongside the shared command
coalescer refactor.

### W4-R-08 — Quick-edit `/` panel
**Source.** P0 redraw backlog.
**Why deferred.** Depends on W4-R-04 (hit-test + hover state
required to know which atom `/` is quick-editing). Deferring R-04
automatically defers R-08.
**Target.** Wave-5, immediately after W4-R-04 lands.
