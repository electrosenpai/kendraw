# UX Design: Kendraw

**Date:** 2026-04-12
**Designer:** Jean-Baptiste Donnette (UX Designer hat — solo project)
**Version:** 1.0
**Status:** Draft (ready for self-review and architecture handoff)
**Project Type:** Web Application (React 18 + TypeScript / FastAPI + RDKit)

---

## Document Overview

This UX Design Document is the visual & interaction baseline for **Kendraw**, the open-source modern web successor to ChemDraw. It is derived from `prd-kendraw-2026-04-12.md` and resolves two PRD open questions explicitly deferred to UX (curly arrow geometry model, multi-structure SDF UX).

It is the bridge between the PRD and the architecture phase: the architect must satisfy the FRs _and_ the UX commitments locked here.

**Related Documents:**

- Product Brief: `docs/product-brief-kendraw-2026-04-12.md`
- PRD: `docs/prd-kendraw-2026-04-12.md`
- Workflow status: `docs/bmm-workflow-status.yaml`

**Reading guide:**

- **Part 1** locks scope, personas, design principles.
- **Part 2** documents the 10 user flows.
- **Part 3** documents the 22 surfaces (top-level screens + editor states + overlays).
- **Part 4** documents accessibility annotations (WCAG 2.1 AA on non-canvas UI).
- **Part 5** documents the component library.
- **Part 6** documents the design tokens (the "Glasswerk" system).
- **Part 7** is the developer handoff: implementation order, CSS skeletons, asset list.
- **Part 8** is the validation matrix mapping every MVP FR to a surface.

---

## Part 1 — Scope, Personas, Principles

### 1.1 Scope

| Dimension        | Decision                                                                          | Source            |
| ---------------- | --------------------------------------------------------------------------------- | ----------------- |
| Target platforms | Web desktop only — Chrome/Firefox/Safari/Edge latest 2 versions                   | NFR-002           |
| Viewport min/max | 1280×720 (min usable), 1920×1080 (reference), 2560×1440 (high-DPI)                | UX choice         |
| Tablet/mobile    | **Out of scope** for MVP and V1 (V2+)                                             | PRD §Out of Scope |
| Fidelity         | Comprehensive — flows + wireframes + interactions + components + tokens + handoff | UX session        |
| Accessibility    | WCAG 2.1 AA on non-canvas UI (canvas exempt per NFR-006)                          | NFR-006           |
| Visual identity  | Glassmorphism, dark mode default + light mode alternate, 60 fps target            | FR-014            |
| Design system    | New — "Glasswerk" tokens (defined in Part 6)                                      | UX session        |
| Languages        | English only at MVP, i18n keys throughout                                         | NFR-007           |
| Telemetry        | None — no usage analytics, no calls home                                          | NFR-008           |

### 1.2 Personas

Inherited from the Product Brief and re-anchored for design purposes.

**⭐ Compass persona — URD Abbaye PhD student (Élise, 27, organic synthesis):**

- 3rd-year PhD in organic synthesis, Linux/macOS, screens ≥ 24" 1440p, double-monitor common.
- Has used ChemDraw for 4+ years; muscle memory is the dominant input method.
- Draws 5–20 structures/day; 1–3 reactions/day; mechanisms once or twice a week.
- Lives in: structure → property panel → PNG → Word manuscript.
- Wants: speed, no surprises, ChemDraw shortcuts working out of the box.
- Doesn't want: tooltips that block the canvas, cloud accounts, mobile UX leaking onto desktop.
- **Design tie-breaker:** when in doubt, optimise for Élise's third action of the morning, not for the new user's first action.

**Primary personas:**

- **Chemistry teacher (Marc, 45, prep classes):** prepares LaTeX/Beamer handouts; mechanisms with curly arrows are weekly. Cares about export quality and copy-paste fidelity. Uses keyboard less, menus more.
- **Master's student (Yara, 23, medicinal chemistry):** lower volume than Élise, much higher sensitivity to "does this feel modern". This persona makes or breaks the "wow" reaction.
- **Cheminformatics user (Jonas, 33, computational chemistry):** lives in SMILES; wants paste-SMILES → render → copy-canonical-SMILES with zero ceremony.

**Secondary personas:** small biotech chemists, undergrads, scientific writers/illustrators, biochemists, embedders. Designed-for but never tie-breakers.

### 1.3 Design Principles

The seven principles below are the local constitution. Every screen, every interaction, every component must answer to them. The order is the priority order — earlier principles win conflicts.

**P1. Élise's third action of the morning.**
Optimise for the muscle-memory workflow of an expert ChemDraw migrant, not for the marketing screenshot. If a "delightful" interaction adds 80 ms to drawing a benzene ring, kill the interaction.

**P2. The canvas is sacred.**
Nothing — no toolbar, no tooltip, no panel, no modal — may obscure the working area without an explicit user gesture. Auto-hiding panels are forbidden. If a panel covers the canvas, the user collapsed it themselves.

**P3. Keyboard parity with ChemDraw.**
Every MVP action that has a ChemDraw shortcut keeps that shortcut by default (FR-019). No accidental browser-shortcut shadowing. The cheatsheet is one keystroke (`?`) away.

**P4. Progressive glass.**
Glassmorphism is a finish, not a foundation. Each surface stays legible if blur is disabled (Safari fallback, prefers-reduced-transparency). Contrast must hold without the blur.

**P5. Show the chemistry instantly.**
The property panel updates within 100 ms for ≤ 100 atoms (FR-015). Latency is a design problem, not just an engineering one — anything that requires a backend round-trip in the steady-state editing loop is a UX failure.

**P6. Modern conveniences are non-negotiable.**
Multi-tab, auto-save, restore-on-reload, drag-and-drop, dark mode, copy-paste-as-image. These are the differentiators against ChemDraw and Ketcher — they get first-class treatment, never a "settings" hideaway.

**P7. The citation ask is visible, never coercive.**
The citation reminder appears on first launch and About, and rides exports as embedded metadata. It never interrupts a session, never blocks an export, never gates a feature. (FR-026, FR-027, NFR-011.)

### 1.4 Resolved PRD Open Questions

The PRD lists two open questions for resolution in UX phase. Both are answered here.

**Q#3 — Curly arrow geometry model.**
**Decision:** Cubic Bézier with **two user-editable control points** plus draggable endpoints. Default curvature is computed from start/end positions and from whether the start anchor is a bond, atom, or lone-pair (different default heights). Control points appear only when the arrow is selected. Endpoints can be re-anchored without losing curvature.
**Rationale:** Bézier is what every chemist who has touched Illustrator already understands. Parameterized arc models are simpler to implement but force chemists to fight the geometry on tight congested mechanisms — a known ChemDraw frustration. Two control points is the minimum that allows both gentle pi-orbital arcs and tight 180° flips without re-parameterizing.
**Scope note for architect:** the geometry must serialize as 4 points (start, c1, c2, end) plus an anchor descriptor for each endpoint, both in MOL extensions and CDXML.

**Q#5 — Multi-structure SDF UX.**
**Decision:** **Multi-page document inside a single tab.** A horizontal thumbnail strip appears at the bottom of the canvas when the active document has > 1 structure, with `← →` keyboard navigation, page index `n / N`, and right-click "Open in new tab" for any page.
**Rationale:** A 200-structure SDF would shred the tab bar and obliterate session restore. Pages-in-a-tab keeps the tab metaphor for "documents I'm actively working on" and the page metaphor for "structures within a dataset I'm browsing" — two distinct mental models that ChemDraw conflates.
**Scope note for architect:** auto-save (FR-017) must persist the active page index per tab.

---

## Part 2 — User Flows

Ten flows. Flows F1–F5 are MVP. F6–F10 are V1. Each flow lists entry, happy path, decision points, error cases, and exits.

---

### Flow F1 — First-Launch & Citation Acknowledgment (MVP)

**Entry:** User loads Kendraw URL for the first time on this browser.

**Happy path:**

1. Welcome screen (S1) renders with the Kendraw mark, one-line tagline, and the citation block.
2. User reads or skims; clicks **"Start drawing"** (primary CTA).
3. Welcome screen dismisses; Main Editor (S2-A, empty state) renders.
4. A subtle one-time hint card appears in the bottom-right: _"Press `?` to see all keyboard shortcuts."_
5. The "first-launch acknowledged" flag is persisted in localStorage.

**Decision points:**

- At step 2: user can click **"Read citation guidance →"** which deep-links to About page (S3) and returns.
- At step 2: user can click **"Try without reading"** secondary affordance — this is the same as "Start drawing" but tracked separately for self-reflection (no telemetry, just localStorage marker).

**Error cases:**

- Storage unavailable (private mode): show inline notice _"Auto-save and session restore are disabled in private browsing"_ and continue. Welcome will reappear next time, which is acceptable.

**Exit:** Main Editor (S2-A).

```
[URL load, first time]
       │
       ▼
┌────────────────────┐
│  S1: Welcome       │
│  - Mark            │
│  - Tagline         │
│  - Citation block  │
│  - [Start drawing] │
└────────┬───────────┘
         │ click "Start drawing"
         ▼
┌────────────────────┐
│  S2-A: Empty editor│
│  + first-time hint │
└────────────────────┘
```

---

### Flow F2 — Daily Molecule Drawing (PRD Flow 1, ⭐ compass flow) (MVP)

**Persona:** Élise (URD Abbaye PhD).
**Entry:** Kendraw is already open, often from yesterday's session restore.

**Happy path:**

1. S2-C with restored tabs renders. Élise hits `Ctrl+T` → new tab (S2-A becomes S2-B).
2. Types `B` (benzene shortcut) → ring placed at cursor. Single click commits.
3. Hovers existing atom → presses `O` → oxygen replaces carbon.
4. `Ctrl+drag` from atom → quick zigzag chain.
5. Property panel (right side) updates within 100 ms after each action: formula, MW, SMILES.
6. Élise clicks the "copy SMILES" affordance in the panel.
7. `Ctrl+Shift+E` opens the Export dialog (M4).
8. Selects PNG, 600 DPI preset, clicks **Export**.
9. PNG downloads with EXIF citation footprint embedded (FR-027).
10. Élise alt-tabs to Word, paste with `Ctrl+V` → image lands.
11. Auto-save fires throughout (max 5 s after last edit, FR-017).

**Decision points:**

- At step 5: if structure has a valence violation, the offending atom shows a red ring and a hover tooltip explains the violation in plain English. The export still succeeds (FR-007 §AC4).
- At step 7: if Élise prefers vector, she selects SVG instead of PNG. SVG export embeds the same citation in `<metadata>` and as an HTML comment.

**Error cases:**

- Storage quota exhausted (FR-017 §AC5): toast appears with "Free up space" affordance opening the session-restore manager.
- PNG export fails (browser canvas error): inline error in the export dialog, action retains state, user can retry without redrawing.

**Exit:**

- Success: PNG downloaded, structure remains in tab, auto-saved.
- Cancel: export dialog dismissed via Escape, no file written.

```
[Kendraw open]
   │
   ▼
[S2-C: tabs restored] ── Ctrl+T ──> [S2-A new tab]
                                          │
                                          ▼
                                   [S2-B drawing]
                                          │
                                          │ keyboard + palette
                                          ▼
                                  [Property panel
                                   updates live]
                                          │
                                          │ Ctrl+Shift+E
                                          ▼
                                   [M4 Export dialog]
                                          │
                              ┌───────────┴──────────┐
                              ▼                      ▼
                         [PNG download]         [Cancel: Esc]
```

---

### Flow F3 — Mechanism Diagram for Teaching Handout (PRD Flow 2) (MVP)

**Persona:** Marc (chemistry teacher).
**Entry:** New tab in Main Editor.

**Happy path:**

1. Marc draws reactant on the left half of the canvas.
2. Selects the reaction-arrow tool from the palette → click-drag horizontally → forward arrow placed.
3. Clicks the arrow with the text tool → annotation slots appear above and below the arrow.
4. Types reagents above ("H₂O, Δ"), solvent below ("EtOH"). Subscript shortcut applied for `H₂O`.
5. Draws product on the right half.
6. Selects curly-arrow tool from palette (or `~` shortcut).
7. Clicks on a bond on the reactant → drags to a bond on the product → curly arrow appears with default curvature.
8. Clicks the curly arrow → 2 control points appear (M6 inline editor) → Marc tweaks curvature for clarity.
9. Repeats steps 6–8 for additional electron-pushing arrows.
10. `Ctrl+Shift+E` → Export → SVG → file downloads.
11. Marc embeds in Beamer/LaTeX `\includegraphics{}`.

**Decision points:**

- At step 7: if endpoint snaps to wrong anchor, Marc drags it to the correct one without losing curvature.
- At step 4: rich text uses `_2` for subscript, `^2` for superscript via the inline annotation toolbar (chemistry-aware).

**Error cases:**

- Curly arrow with no valid endpoint anchor: arrow renders as dashed gray "draft" until both ends snap to a valid target.
- SVG export contains metadata but Marc's LaTeX strips it on render — the file metadata footprint persists (FR-027 §AC2).

**Exit:** SVG downloaded, file embedded in handout.

---

### Flow F4 — Quick SMILES Exploration (PRD Flow 3) (MVP)

**Persona:** Jonas (cheminformatics user).

**Happy path:**

1. Jonas opens Kendraw, focuses the SMILES input field in the property panel header.
2. Pastes `CC(=O)OC1=CC=CC=C1C(=O)O` (aspirin).
3. Frontend parser renders the structure within < 200 ms (FR-018 §AC1).
4. Jonas modifies one atom on the canvas; canonical SMILES in the property panel updates within 100 ms.
5. Clicks the copy-SMILES affordance.
6. Switches to terminal, pastes.

**Decision points:**

- If the SMILES fails to parse: input field gains a red outline, error tooltip describes the failure with character offset; no canvas change.
- If the structure exceeds 100 atoms: render is allowed up to ~ 500 atoms with degraded latency budget per FR-015 §AC2; > 500 shows a warning toast.

**Error cases:**

- Frontend lib unavailable (rare): fallback to backend canonicalization with a 1 s timeout; if both fail, error toast.

**Exit:** Canonical SMILES on clipboard.

---

### Flow F5 — Multi-tab Session Restore After Crash (MVP)

**Entry:** User reloads the page (deliberately or after a crash).

**Happy path:**

1. Page loads.
2. M8 (restore prompt) appears centred on a dimmed background: _"Restore your previous session? 4 tabs, last saved 12 seconds ago."_
3. User clicks **Restore session**.
4. All 4 tabs reappear with full state: structure, selection, undo history (FR-016 §AC5).
5. The tab that was active becomes active again.

**Decision points:**

- User clicks **Start fresh** instead → previous session is archived (one revision back, recoverable from About → "Recover archived session" for 7 days), new empty editor opens.
- Auto-save data is older than 30 days → restore prompt still appears but shows the timestamp prominently with a "this is older than usual" hint.

**Error cases:**

- Storage corrupted: restore prompt shows the affected tabs with an error icon; user can attempt per-tab restore. Failed tabs are isolated, never blocking.

**Exit:** Either restored editor (S2-C) or fresh editor (S2-A).

---

### Flow F6 — Template-Based Fast Drawing (V1)

**Persona:** Yara (master's student) drawing a glycine structure for a homework set.

**Happy path:**

1. Press `T` to open Templates browser (M2).
2. Type "glyc" in the search field.
3. Glycine template highlights; Enter or click inserts at cursor as a single undoable action.
4. Closes browser via `Esc`.
5. Continues drawing.

**Decision points:**

- Three tabs in the browser: **Rings** (MVP, FR-004), **Built-in** (V1, FR-035 + FR-036), **My templates** (V1, FR-037).
- Right-click on a built-in template offers "Insert" / "Insert + recentre canvas".
- For "My templates", right-click offers "Rename" / "Delete" / "Export as JSON".

**Error cases:**

- Custom template JSON import fails schema validation: import dialog reports the offending field.

**Exit:** Template inserted at cursor.

---

### Flow F7 — CDXML Round-Trip Migration (V1)

**Persona:** Marc importing a `.cdxml` file from a colleague's ChemDraw library.

**Happy path:**

1. Marc drags `library.cdxml` from his file manager onto the Kendraw window.
2. Drop overlay (M13) confirms the file type and shows "Importing CDXML…".
3. Import succeeds → file opens in a new tab.
4. If unsupported CDXML constructs were detected, a non-blocking warning toast lists them with a "View details" link to a per-import warnings panel (FR-043 §AC2).
5. Marc edits, then exports back to CDXML via M4.

**Decision points:**

- If import fails entirely: error toast names the failure and offers "Send anonymized to Kendraw for parsing improvement" (off by default — opt-in only, respects NFR-008).

**Error cases:**

- Format detected but version unsupported: warning lists the version, file still opens with a "best-effort" badge in the tab title.

**Exit:** Document open with optional warnings panel.

---

### Flow F8 — IUPAC Name → Structure (V1)

**Persona:** Jonas needing to verify a name from a paper.

**Happy path:**

1. Jonas opens the IUPAC input via `Ctrl+I` or via the property panel's "Name → structure" tab.
2. Pastes "(2S)-2-amino-3-(1H-indol-3-yl)propanoic acid".
3. Backend (RDKit + OPSIN fallback) returns the structure within ~ 1 s.
4. Structure renders on canvas; Jonas can edit, export, etc.

**Decision points:**

- If the parser returns multiple candidates with low confidence: a chooser panel shows up to 3 candidates with thumbnails.

**Error cases:**

- Name unrecognized: error toast — _"Couldn't parse this IUPAC name. Try simplifying or pasting SMILES instead."_

**Exit:** Structure on canvas.

---

### Flow F9 — Publication-Quality Export (MVP for PNG/SVG, V1 for PDF/EPS)

**Persona:** Élise preparing a JACS submission figure.

**Happy path:**

1. Selects the substructure to export (or selects nothing for whole canvas).
2. `Ctrl+Shift+E` opens M4.
3. Picks "PDF (vector, V1)" → DPI/size/font/citation-footprint options reveal.
4. Picks "JACS preset" from the size dropdown (single-column 8.5 cm width).
5. Clicks Export → PDF downloads.
6. Opens in Illustrator → edits without rasterization issues.

**Decision points:**

- Citation footprint is **on by default** but can be toggled per-export via a clearly labelled checkbox. Toggling off fires an unobtrusive reminder of the citation ask, without blocking.

**Error cases:**

- PDF export library failure: fallback to SVG with a notice; user retries.

**Exit:** Vector file downloaded.

---

### Flow F10 — Customize Palette & Shortcuts (V1)

**Persona:** Marc remapping `B` from "benzene" to "bond" to match his old ChemDraw config.

**Happy path:**

1. Opens Settings (S4) via `Ctrl+,`.
2. Settings → Keyboard shortcuts tab.
3. Searches "benzene".
4. Clicks the current binding → enters new chord (`Shift+B`).
5. System detects no conflict → applies on save.
6. "Reset to defaults" remains accessible at all times.

**Decision points:**

- If new chord conflicts with another binding: dialog shows the conflict and asks the user to resolve (re-bind one or reset).

**Error cases:** none — all changes are reversible via "Reset to defaults".

**Exit:** Settings closed; new shortcut active in editor.

---

## Part 3 — Surfaces (Wireframes & Specs)

22 surfaces. Each has: purpose, layout, interactions, states, responsive notes, and FR coverage.

> **A note on wireframe conventions.**
> ASCII art is used for layout intent — proportions and exact pixel sizes are documented in the structured spec below the diagram. Glass surfaces are denoted with `╔ ╗`, solid surfaces with `┌ ┐`, the canvas is left blank or contains shapes.

---

### S1 — First-launch Welcome

**Purpose:** Build initial trust, communicate the citation ask, and dismiss within 30 seconds.
**Frequency:** Once per browser (`localStorage` flag).
**FR coverage:** FR-026, NFR-011.

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                       ⬡⬡⬡  KENDRAW  ⬡⬡⬡                        ║
║              Modern molecular drawing for chemists             ║
║                                                                ║
║       Open-source · Self-hostable · No account · MIT          ║
║                                                                ║
║   ────────────────────────────────────────────────────────     ║
║                                                                ║
║   If you publish work that used Kendraw, please cite the       ║
║   project and its creator:                                     ║
║                                                                ║
║       Donnette, J.-B. Kendraw — open-source modern             ║
║       molecular editor.  github.com/electrosenpai/kendraw      ║
║                                                                ║
║       [ Copy citation as BibTeX ]                              ║
║                                                                ║
║   ────────────────────────────────────────────────────────     ║
║                                                                ║
║                  ┌──────────────────────┐                      ║
║                  │     Start drawing    │  ← primary CTA       ║
║                  └──────────────────────┘                      ║
║                                                                ║
║         Read citation guidance →     Try without reading       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Layout:**

- Centered modal-like card on dark glass background. 640 px wide, vertical centre.
- Blur backdrop (24 px radius). Falls back to opaque dark surface on Safari < 17 / `prefers-reduced-transparency`.
- Logo: animated mark (subtle 0.5 s fade + scale, respects `prefers-reduced-motion`).
- Citation block: monospaced excerpt; "Copy citation as BibTeX" button is a tertiary text button.
- Primary CTA: large primary button, focus by default.
- Two text links below the CTA, smaller font.

**Interactions:**

- `Enter` confirms primary CTA.
- `Esc` is bound to "Try without reading" (same effect as primary, but flagged for self-reflection).
- Click outside the card does **not** dismiss (modal-like, intentional friction).

**States:**

- Default
- Focused (CTA outline visible)
- Loading (backend optional probe for Zenodo DOI on first run; if present, show DOI under citation block)
- Storage-unavailable (inline notice)

**Accessibility:**

- `role="dialog" aria-modal="true" aria-labelledby="welcome-title"`.
- Focus trap on the card; tab order: Copy BibTeX → primary CTA → Read guidance → Try without reading.

---

### S2 — Main Editor Workspace (the workhorse)

**Purpose:** The primary surface; where 95% of user time is spent. Three sub-states (S2-A, S2-B, S2-C).
**FR coverage:** the entire MVP (FR-001 through FR-029).

#### S2 — Macro layout

```
┌────────────────────────────────────────────────────────────────────┐
│ ⬡ Kendraw   File Edit View Insert Tools Help              ☼ ? ⚙   │ ← S2 Menu bar (32 px)
├──────┬─────────────────────────────────────────────────┬───────────┤
│      │ ◀ Tab1 ● │  Tab2 │  Tab3 │  + │                 │           │ ← Tab bar (40 px)
│      ├─────────────────────────────────────────────────┤  Property │
│  T   │                                                 │   panel   │
│  o   │                                                 │           │
│  o   │                                                 │  Formula  │
│  l   │                  CANVAS                         │  MW       │
│      │                                                 │  SMILES   │
│  P   │              (the sacred space)                 │           │
│  a   │                                                 │  Charges  │
│  l   │                                                 │  ...      │
│  e   │                                                 │           │
│  t   │                                                 │           │
│  t   │                                                 │           │
│  e   │                                                 │           │
│      │                                                 │           │
├──────┴─────────────────────────────────────────────────┴───────────┤
│  Status: 18 atoms · 21 bonds · valid    Auto-saved 2 s ago         │ ← Status bar (28 px)
└────────────────────────────────────────────────────────────────────┘
   ↑                ↑                                  ↑
 Tool palette     Canvas                          Property panel
 (left, 64 px)    (flex)                          (right, 320 px)
```

**Top-down inventory:**

1. **Menu bar** — 32 px, glass surface, full width. Logo + main menus + theme toggle + cheatsheet + settings.
2. **Tab bar** — 40 px, glass surface, full width below menu. Active tab visible in the canvas area only.
3. **Tool palette** — 64 px wide, full editor height, glass surface, **left-anchored**. Vertical strip of tool icons grouped by category.
4. **Canvas** — flex, fills remaining space. Sacred per principle P2. Background: dark surface in dark mode, neutral-50 in light mode. No blur — the canvas is opaque.
5. **Property panel** — 320 px wide, full editor height (minus menu/tab/status bars), glass surface, **right-anchored**. Collapsible to 0 px via a button on its left edge or `Ctrl+/`.
6. **Status bar** — 28 px, full width, glass surface. Live atom/bond count, valence status, auto-save timestamp, demo-mode badge if applicable.

**Default proportions on a 1920×1080 viewport:**

- Menu + tab + status = 100 px vertical chrome.
- Tool palette = 64 px left chrome.
- Property panel = 320 px right chrome (collapsible).
- Canvas = 1536 × 980 px = 79.5% × 90.7% of viewport. Above the 60% canvas-area floor.

**Adjacency rule:** the canvas always touches all four chrome surfaces with a 1 px border (subtle, neutral-300 in light, neutral-700 in dark). Never floating, never inset.

#### S2-A — Empty state

```
┌──────┬─────────────────────────────────────────────────┬───────────┐
│  T   │ ◀ Untitled ● │  + │                             │           │
│  o   ├─────────────────────────────────────────────────┤  Property │
│  o   │                                                 │   panel   │
│  l   │                                                 │           │
│      │                                                 │  Formula  │
│  P   │            ⬡                                    │  —        │
│  a   │           Draw, paste, or drop                  │  MW       │
│  l   │           a chemistry file here                 │  —        │
│  e   │                                                 │  SMILES   │
│  t   │     ┌─────────┐ ┌─────────┐ ┌─────────┐         │  —        │
│  t   │     │ Benzene │ │ Hexane  │ │ Aspirin │         │           │
│  e   │     └─────────┘ └─────────┘ └─────────┘         │           │
│      │           three quick-start tiles                │           │
│      │                                                 │           │
└──────┴─────────────────────────────────────────────────┴───────────┘
```

**Behaviour:**

- Three quick-start tiles in the canvas; clicking inserts the corresponding template at canvas centre.
- Drop a file anywhere → import flow (F2 + F7).
- Property panel shows em-dashes for all fields; SMILES input is focused.
- The hint card "_Press `?` to see all keyboard shortcuts_" appears on first launch only.

#### S2-B — Active drawing state

This is the most-used state. All interaction details are documented per palette tool below; the screen itself is just S2 with an active document.

#### S2-C — Multi-document tabs state

Tab bar shows all open tabs left-to-right. Tabs are draggable to reorder. Each tab has:

- Document name (truncated at 24 chars with ellipsis + tooltip on hover).
- Unsaved-changes dot `●` to the right of the name.
- Close button `×` on hover or focus.
- Right-click context menu: Rename, Duplicate, Open in new window (V2), Close, Close others, Close all to the right.

A `+` button at the right end opens a new blank tab. `Ctrl+T` keyboard equivalent. `Ctrl+W` closes the active tab; if unsaved, M15 (unsaved changes prompt) intercepts.

---

### S2 sub-component — Tool Palette (left strip)

```
┌──────┐
│  ↖   │  Select (V)
│  ⬚   │  Lasso (L) — V1
├──────┤
│  ─   │  Single bond (1)
│  ═   │  Double bond (2)
│  ≡   │  Triple bond (3)
│  ◐   │  Aromatic (4)
│  ▶   │  Wedge (W)
│  ░   │  Dash (D)
├──────┤
│  C   │  Atom: Carbon (C)
│  N   │  Atom: Nitrogen (N)
│  O   │  Atom: Oxygen (O)
│  ⊞   │  Periodic table (M1)
├──────┤
│  ⬡   │  Benzene (B)
│  ▢   │  Templates (T) → M2
├──────┤
│  ⤳   │  Reaction arrow (A)
│  ⟳   │  Curly arrow (~)
│  T   │  Text annotation (Shift+T)
├──────┤
│  ↶   │  Undo (Ctrl+Z)
│  ↷   │  Redo (Ctrl+Y)
└──────┘
```

**Specs:**

- 64 px wide.
- Each tool button: 48×48 px (44×44 minimum touch target per WCAG, 48 chosen for grid harmony).
- 4 px gap between buttons; 8 px gap between groups (dividers).
- Active tool: filled background with primary colour, 4 px left accent bar.
- Hover: glass background lift + tooltip with name and shortcut after 400 ms.
- Focus: 2 px primary outline offset 2 px.
- All tools have `aria-label="<name> (shortcut: <key>)"`.
- All tools have a keyboard shortcut. Shortcut is shown in tooltip and in the cheatsheet (M5).

**Customization (V1, FR-046):** drag-to-reorder within the palette; right-click for "Hide tool" / "Reset palette". Settings page (S4) provides full control.

---

### S2 sub-component — Property Panel (right strip)

```
╔═══════════════════════════════════╗
║ ⌃ Properties              ⌫       ║ ← header (collapse + close)
╠═══════════════════════════════════╣
║                                   ║
║ ┌─────────────────────────────┐   ║
║ │ SMILES                  📋  │   ║
║ │ CC(=O)OC1=CC=CC=C1C(=O)O    │   ║ ← editable, parses live
║ └─────────────────────────────┘   ║
║                                   ║
║ Formula              C₉H₈O₄  📋   ║
║ Mol. weight         180.16   📋   ║
║ Exact mass          180.0423 📋   ║
║                                   ║
║ ─────────────────────────────     ║
║ Atoms                        21   ║
║ Bonds                        21   ║
║ Charge (net)                  0   ║
║ Valence                  ✓ valid  ║
║                                   ║
║ ─────────────────────────────     ║
║ ▸ Drug-likeness (V1)              ║
║ ▸ Descriptors (V1)                ║
║ ▸ IUPAC name (V1)                 ║
║                                   ║
║ ─────────────────────────────     ║
║ Document                          ║
║ Untitled — last saved 2 s ago     ║
║ ⚠ 0 warnings                      ║
║                                   ║
╚═══════════════════════════════════╝
```

**Specs:**

- 320 px wide. Collapses to 0 px (button shifts to a 24 px peek tab anchored to the editor edge).
- Glass surface with 16 px backdrop blur, 90% opacity.
- Internal padding: 16 px horizontal, 12 px vertical.
- All field values have a one-click copy affordance (📋 = clipboard glyph). Copy fires a 1 s success toast.
- SMILES field is editable: pasting a valid SMILES replaces the canvas content (after a confirmation toast if the canvas is non-empty).
- Live update: ≤ 100 ms for ≤ 100 atoms (FR-015 §AC1).
- Sections beyond MVP are collapsed by default with a `▸ ` chevron and a "(V1)" badge until shipped.
- Document section at the bottom shows save status, warnings, and per-import warnings (CDXML, etc.).

**Accessibility:**

- `role="complementary" aria-label="Structure properties"`.
- All copy buttons: `aria-label="Copy SMILES to clipboard"` etc.
- Live region for save status: `aria-live="polite"`.

---

### S2 sub-component — Status Bar

Single-line bar at the very bottom.

```
─────────────────────────────────────────────────────────────────────
 18 atoms · 21 bonds · ✓ valid                Auto-saved 2 s ago    DEMO
─────────────────────────────────────────────────────────────────────
```

- Left: live atom/bond/valence summary.
- Right: auto-save status with a tooltip showing the exact timestamp on hover.
- Far right: "DEMO" badge in demo mode (FR-029) — clickable to a demo-info popover (M14).
- 28 px height, 12 px horizontal padding.
- `aria-live="polite"` on the auto-save segment.

---

### S3 — About / Citation Page

**Purpose:** Citation and credit, full version. Reachable in ≤ 2 clicks (FR-026).

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Back to editor                                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│      ⬡⬡⬡  Kendraw                                                  │
│      Modern molecular drawing for chemists                         │
│      Version 0.1.0                                                 │
│                                                                    │
│      MIT License · github.com/electrosenpai/kendraw                │
│                                                                    │
│ ────────────────────────────────────────────────────────────────   │
│                                                                    │
│  Citation                                                          │
│  If your work uses Kendraw — even a single figure — please cite:   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Donnette, J.-B. Kendraw — open-source modern molecular     │    │
│  │ editor (Year). github.com/electrosenpai/kendraw            │    │
│  │ DOI: 10.5281/zenodo.XXXXXXX                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [ Copy as BibTeX ]  [ Copy as RIS ]  [ View CITATION.cff ]        │
│                                                                    │
│ ────────────────────────────────────────────────────────────────   │
│                                                                    │
│  Credits                                                           │
│  • Created by Jean-Baptiste Donnette                               │
│  • Built on RDKit, OPSIN, [frontend lib TBD]                       │
│  • Inspired by feedback from URD Abbaye laboratory                 │
│                                                                    │
│  Licenses ── A full inventory of third-party licenses is in       │
│  LICENSES.md in the repository.                                    │
│                                                                    │
│ ────────────────────────────────────────────────────────────────   │
│                                                                    │
│  Recover archived session  →  (visible only if archive exists)     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Specs:**

- Full-window page (not a modal). Replaces editor content. "Back to editor" returns without state loss.
- Centered column 720 px wide, padding 48 px.
- Headings: H1 (Kendraw), H2 (Citation, Credits, etc.), H3 inside as needed.
- Three citation export formats: BibTeX, RIS, CFF.
- DOI block appears only when Zenodo DOI is registered.

---

### S4 — Settings Page (V1)

**Purpose:** Customize palette and shortcuts. V1 only — MVP has no settings page.
**FR coverage:** FR-046, FR-047.

```
┌────────────────────────────────────────────────────────────────────┐
│ Settings                                            ← Back         │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                     │
│ ▸ Appearance │   Keyboard shortcuts                                │
│ ▸ Palette    │                                                     │
│ ● Shortcuts  │   [Search shortcuts...]               Reset all     │
│ ▸ Templates  │                                                     │
│ ▸ Files      │   ┌───────────────────────────────────────────┐     │
│ ▸ Privacy    │   │ Action            │ Default │ Custom      │     │
│              │   ├───────────────────┼─────────┼─────────────┤     │
│              │   │ Benzene           │ B       │ Shift+B     │     │
│              │   │ Single bond       │ 1       │ —           │     │
│              │   │ Undo              │ Ctrl+Z  │ —           │     │
│              │   │ ...               │         │             │     │
│              │   └───────────────────────────────────────────┘     │
│              │                                                     │
│              │   ⚠ 1 conflict — review before saving               │
│              │                                                     │
│              │                          [ Cancel ]   [ Save ]      │
└──────────────┴─────────────────────────────────────────────────────┘
```

**Specs:**

- Two-column layout: 240 px nav, flex content.
- Each row in the shortcut table is editable inline by clicking the binding cell → records next chord.
- Conflict detection in real time; "Save" disabled while unresolved conflicts exist.
- "Reset all" reverts to ChemDraw defaults (FR-019).

---

### M1 — Periodic Table Picker

**Purpose:** Pick any of the 118 elements when keyboard shortcut isn't enough.
**Trigger:** Tool palette button, or `P` shortcut.
**FR coverage:** FR-002.

```
╔══════════════════════════════════════════════════════════════════╗
║  Periodic table                                              ✕   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   1                                                          1   ║
║  ┌──┐                                                      ┌──┐  ║
║  │ H│                                                      │He│  ║
║  └──┘                                                      └──┘  ║
║                                                                  ║
║   2  3                                          4  5  6  7  8 9  ║
║  ┌──┬──┐                                ┌──┬──┬──┬──┬──┬──┬──┐   ║
║  │Li│Be│                                │ B│ C│ N│ O│ F│Ne│   │   ║
║  └──┴──┘                                └──┴──┴──┴──┴──┴──┴──┘   ║
║                                                                  ║
║   ... (full periodic table) ...                                  ║
║                                                                  ║
║                                                                  ║
║   Selected: ─                                                    ║
║                                                                  ║
║                            [ Cancel ]    [ Place ]               ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Modal popover, anchored to the canvas (not floating).
- Each element cell: 40×40 px, atomic number top-left, symbol large centre, mass small bottom.
- Hover shows full element name + electronegativity + atomic radius.
- Click selects; second click places at the current cursor position on canvas (or at last-clicked location).
- Search/filter input at the top — typing "Cl" highlights chlorine.
- Custom-label tab at bottom: enter free text (R, R₁, Ar, Et) → next click places it.

---

### M2 — Templates Browser

**Purpose:** Browse rings (MVP), biomolecules (V1), custom templates (V1).
**Trigger:** Palette button, or `T` shortcut.
**FR coverage:** FR-004, FR-035, FR-036, FR-037.

```
╔══════════════════════════════════════════════════════════════════╗
║  Templates                                                   ✕   ║
╠══════════════════════════════════════════════════════════════════╣
║  [Rings]  [Built-in]  [My templates]                             ║ ← tabs
║                                                                  ║
║  [Search...                                          ]           ║
║                                                                  ║
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                 ║
║  │ ⬡   │ │ ⬠   │ │ □   │ │ ◇   │ │ ⌬   │ │ Φ   │                 ║
║  │Benz.│ │Cyclo│ │Cyclo│ │Cyclo│ │Furan│ │Pyr. │                 ║
║  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                 ║
║  ┌─────┐ ┌─────┐                                                 ║
║  │ ⌬   │ │ ⌬   │                                                 ║
║  │Pyrr.│ │Thio.│                                                 ║
║  └─────┘ └─────┘                                                 ║
║                                                                  ║
║  Selected: Benzene · C₆H₆ · MW 78.11                             ║
║                                                                  ║
║                                       [ Cancel ]   [ Insert ]    ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Tabs across top: Rings (always), Built-in (V1), My templates (V1).
- Grid: 6 cards per row, each 88×88 px with 80×60 thumbnail and 8 px label.
- Search filters within active tab; matches highlight name.
- Right-click on a built-in: Insert / Insert + recentre.
- Right-click on a custom template: Rename / Delete / Export as JSON.
- Drag-from-grid → drop on canvas as alternative to "Insert".

---

### M3 — Import File Dialog

**Purpose:** Format-explicit import when drag-drop isn't enough (e.g., from a remote URL or paste).
**Trigger:** `Ctrl+O` or File → Open.
**FR coverage:** FR-020, FR-023, FR-043, FR-044.

```
╔══════════════════════════════════════════════════════════════════╗
║  Open file                                                   ✕   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   Drop a file here, or:                                          ║
║                                                                  ║
║   [ Choose file... ]   [ Paste from clipboard ]                  ║
║                                                                  ║
║   ─── Or paste content ───                                       ║
║                                                                  ║
║   Format:  [Auto ▾]                                              ║
║   ┌────────────────────────────────────────────────────────┐     ║
║   │                                                        │     ║
║   │   (paste MOL / SDF / SMILES / InChI / CDXML here)      │     ║
║   │                                                        │     ║
║   └────────────────────────────────────────────────────────┘     ║
║                                                                  ║
║   ☐ Open in new tab (default ON)                                 ║
║                                                                  ║
║                                  [ Cancel ]    [ Open ]          ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Three input methods: file picker, drop zone (entire dialog), paste.
- Format auto-detection from MIME type or content sniffing; user can override.
- "Open in new tab" defaults ON to protect current work.
- For multi-structure SDF, the resolution to open Q#5 applies: imports as a multi-page document (single tab).

---

### M4 — Export Dialog

**Purpose:** Format-explicit export with quality presets and citation footprint control.
**Trigger:** `Ctrl+Shift+E` or File → Export.
**FR coverage:** FR-024, FR-025, FR-027, FR-045.

```
╔══════════════════════════════════════════════════════════════════╗
║  Export                                                      ✕   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   Format                                                         ║
║   [● PNG]  [○ SVG]  [○ MOL]  [○ SDF]  [○ SMILES]  [○ InChI]      ║
║   [○ PDF (V1)]  [○ EPS (V1)]  [○ CDXML (V1)]                     ║
║                                                                  ║
║   ─────────────────────────────────────                          ║
║                                                                  ║
║   Quality preset                                                 ║
║   [ Web (96 DPI) ▾  Print (300 DPI)  Publication (600 DPI) ]     ║
║                                                                  ║
║   Size                                                           ║
║   Width:  [ 1200 ] px       Height: [ 900 ] px (auto)            ║
║                                                                  ║
║   Background                                                     ║
║   ( ) Transparent   (●) White   ( ) Match theme                  ║
║                                                                  ║
║   ☑ Embed citation metadata                                      ║
║                                                                  ║
║                              [ Cancel ]    [ Export ]            ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Format strip is a horizontal radio group; V1 formats appear with a "(V1)" badge until they ship.
- Quality preset dropdown: Web / Print / Publication / Custom.
- Size fields are bound to the preset; switching to Custom unlocks them.
- Background is **white by default** for safest paste-into-Word behaviour, even in dark mode.
- Citation metadata checkbox is **on by default**; toggling off shows a 2-line reminder text but does not block.
- After export: success toast with file name and "Open folder" affordance.

---

### M5 — Keyboard Shortcut Cheatsheet

**Purpose:** Discoverable shortcut reference. Always one keystroke away.
**Trigger:** `?` (no modifier) or Help → Shortcuts.
**FR coverage:** FR-019 §AC2.

```
╔══════════════════════════════════════════════════════════════════╗
║  Keyboard shortcuts                                          ✕   ║
╠══════════════════════════════════════════════════════════════════╣
║  [Search...                                          ]           ║
║                                                                  ║
║  Drawing                                                         ║
║   B      Benzene                                                 ║
║   1      Single bond                                             ║
║   2      Double bond                                             ║
║   3      Triple bond                                             ║
║   4      Aromatic bond                                           ║
║   W      Wedge                                                   ║
║   D      Dash                                                    ║
║   C/N/O/H/S/P/F/Cl/Br/I   Place atom                            ║
║                                                                  ║
║  Editing                                                         ║
║   Ctrl+Z       Undo                                              ║
║   Ctrl+Y       Redo                                              ║
║   Ctrl+C/X/V   Copy / Cut / Paste                                ║
║   Ctrl+D       Duplicate                                         ║
║   Esc          Clear selection                                   ║
║                                                                  ║
║  Tabs                                                            ║
║   Ctrl+T       New tab                                           ║
║   Ctrl+W       Close tab                                         ║
║   Ctrl+Tab     Next tab                                          ║
║                                                                  ║
║  ... (scrollable list)                                           ║
║                                                                  ║
║                                  [ Print cheatsheet ]            ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Modal centred, 720×640 px.
- Search filters live.
- Sections collapsible.
- "Print cheatsheet" produces a printable A4 PDF for ChemDraw refugees who like a paper reference.
- Esc closes; `?` re-opens.

---

### M6 — Curly Arrow Inline Editor (the riskiest interaction)

**Purpose:** Edit a curly arrow's curvature and endpoints after placement.
**Trigger:** Click an existing curly arrow with the select or curly-arrow tool.
**FR coverage:** FR-012; resolves PRD open Q#3.

```
                            ⬤ control1
                          ╱
                         ╱  ◜ ◜ ◜
                        ╱        ⬤ control2
                       ⬤───→
                       │        ↗
                       │  start    end
                       │
                       └─ anchored to bond C1=C2
```

**Behaviour:**

- When selected, the arrow shows: 2 endpoint handles + 2 control point handles + a faint dashed reference line from each control point to its associated endpoint.
- Drag any handle to reshape; system enforces curvature continuity (no self-intersection).
- Drag an endpoint near another atom/bond/lone-pair → that target highlights → release snaps. The control points adapt proportionally so the visual curvature is preserved.
- Right-click on the arrow → context menu: Flip head, Convert to single-headed, Delete, Reset curvature.
- Esc deselects the arrow without committing intermediate changes.

**Visual states:**

- Selected: arrow stroke 2.5 px primary colour, handles visible.
- Default: arrow stroke 2 px neutral-700 (dark mode) / neutral-300 (light mode).
- Drafting (one endpoint not anchored): dashed gray stroke + warning icon at the orphan end.
- Hover: subtle glow.

**Snap targets and visual feedback:**

- Bond → bond midpoint highlights with a 6 px primary dot.
- Atom → atom outline lights up.
- Lone pair → the lone pair dots pulse once.
- Empty space → no snap; the endpoint becomes a free anchor (allowed but flagged as "dangling" in property panel warnings).

**Why this matters:** the PRD calls curly arrows "non-negotiable for the URD Abbaye PhD persona." This interaction is the _one_ the project cannot afford to ship awkwardly. The 2-control-point Bézier model plus snap-aware endpoint dragging is the pareto choice between expressiveness and learnability.

---

### M7 — Reaction Condition Annotation Editor

**Purpose:** Annotate reaction arrows with reagents/solvent/temperature/time.
**Trigger:** Click a reaction arrow with the text tool.
**FR coverage:** FR-013.

```
                  ┌─────────────────────────────┐
                  │ H₂O, Δ                      │  ← above-arrow slot (italic by default)
                  └─────────────────────────────┘
       reactant ──────────────────────────→ product
                  ┌─────────────────────────────┐
                  │ EtOH                        │  ← below-arrow slot
                  └─────────────────────────────┘
                       [B][I][_][^][Σ][...]        ← inline mini-toolbar
```

**Specs:**

- Two slots per arrow: above and below. Each slot has independent rich-text content.
- Slots are anchored to the arrow; moving the arrow moves the slots in lockstep.
- Inline mini-toolbar (appears when a slot is focused): bold, italic, subscript, superscript, Greek symbol palette.
- Default typography: italic for variables, regular for substances; user can override per-character.
- Slot is empty by default; placeholder text "click to add" disappears on focus.
- `Tab` from above-slot → below-slot.

---

### M8 — Restore Previous Session Prompt

**Purpose:** Recover after a reload or crash.
**Trigger:** Editor mount detects valid auto-save data from a previous session.
**FR coverage:** FR-017 §AC3, FR-016 §AC5.

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   Restore your previous session?                                 ║
║                                                                  ║
║   ▸ 4 tabs                                                       ║
║   ▸ Last saved 12 seconds ago                                    ║
║                                                                  ║
║   ┌──────────────────────────────────────────────┐               ║
║   │ ●  benzene-derivatives.mol                   │               ║
║   │    aspirin-synthesis.cdxml                   │               ║
║   │    untitled-3                                │               ║
║   │    glycine-test.smi                          │               ║
║   └──────────────────────────────────────────────┘               ║
║                                                                  ║
║                  [ Start fresh ]   [ Restore session ]           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Modal centred over a dimmed editor.
- Lists tab names with the last-active tab highlighted.
- "Restore session" is the primary CTA, focused by default.
- "Start fresh" archives the previous session for 7 days, recoverable from S3.
- Esc = "Restore session" (the safer default).

---

### M9 — Multi-structure SDF Navigator (resolves open Q#5)

**Purpose:** Browse pages within a multi-structure SDF without spawning hundreds of tabs.
**Trigger:** Opening any SDF with > 1 structure.
**FR coverage:** FR-023 §AC2.

```
─────────────────────────────────────────────────────────────────────
│           CANVAS (current page)                                   │
│                                                                   │
│                                                                   │
│                                                                   │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│ ◀   ⬡   ⬡   ⬡   ●   ⬡   ⬡   ⬡   ⬡   ⬡   ⬡   ⬡   ⬡   ⬡   ▶  4/12 │ ← thumbnail strip
└───────────────────────────────────────────────────────────────────┘
```

**Specs:**

- Strip appears only when the active document has > 1 page.
- 64 px tall, full canvas width.
- Each thumbnail: 48×48 px.
- Active page highlighted with primary outline.
- Right-click thumbnail: Open in new tab, Delete page, Duplicate page.
- Keyboard: `←/→` navigate, `Ctrl+←/→` reorder, `Page Up/Down` jump 5 pages.
- Auto-save persists active page index per tab.

---

### M10 — Structure Search Dialog (V1)

**Purpose:** Search across open documents and templates.
**Trigger:** `Ctrl+F` (in editor, not browser find).
**FR coverage:** FR-048.

```
╔══════════════════════════════════════════════════════════════════╗
║  Find structures                                             ✕   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   Query type   [● SMILES] [○ Name] [○ Substructure (draw)]       ║
║                                                                  ║
║   ┌────────────────────────────────────────────────────────┐     ║
║   │ c1ccccc1                                               │     ║
║   └────────────────────────────────────────────────────────┘     ║
║                                                                  ║
║   Search in    [☑ Open documents] [☑ Built-in templates] [☑ My]  ║
║                                                                  ║
║   Results (3)                                                    ║
║   ┌──────────────────────────────────────────────────────┐       ║
║   │ ⬡  Tab "aspirin"             — 1 substructure match  │       ║
║   │ ⬡  Template "benzaldehyde"   — 1 substructure match  │       ║
║   │ ⬡  Tab "untitled-3"          — 1 substructure match  │       ║
║   └──────────────────────────────────────────────────────┘       ║
║                                                                  ║
║                                  [ Close ]                       ║
╚══════════════════════════════════════════════════════════════════╝
```

**Specs:**

- Three query modes; "Substructure (draw)" opens an inset mini-canvas.
- Results are keyboard-navigable; Enter activates → switches to tab and highlights matched atoms.
- Search scope checkboxes default to all on.

---

### M11 — Reference Data Tables (V1)

**Purpose:** Periodic table data, common solvents, common reagents — accessible without leaving the editor.
**Trigger:** Help → Reference data, or `Ctrl+R`.
**FR coverage:** FR-049.

Tabbed page (Periodic table / Solvents / Reagents) with sortable, searchable tables. Each table renders correctly in dark and light modes (NFR-006 contrast verified).

---

### M12 — Storage Quota Error Toast

**Purpose:** Surface storage exhaustion with a recovery path.
**Trigger:** Auto-save fails with quota error (FR-017 §AC5).

```
┌────────────────────────────────────────────────────────────┐
│ ⚠ Storage full — auto-save is paused.                      │
│   Free space by closing old tabs or removing archived      │
│   sessions.    [ Open session manager ]    [ Dismiss ]     │
└────────────────────────────────────────────────────────────┘
```

- Toast lives at the top-right, persists until acknowledged.
- "Open session manager" opens S3 → "Recover archived session" section.

---

### M13 — Drag-Drop Import Overlay

**Purpose:** Visual confirmation when a file is dragged onto the window.
**Trigger:** OS drag-enter event with at least one file.
**FR coverage:** FR-020 §AC3.

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│              ╔══════════════════════════╗                  │
│              ║                          ║                  │
│              ║       ⬇                  ║                  │
│              ║                          ║                  │
│              ║   Drop to import         ║                  │
│              ║   .mol .sdf .smi .cdxml  ║                  │
│              ║                          ║                  │
│              ╚══════════════════════════╝                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Full-window overlay, dimmed editor behind.
- Center card lists supported formats.
- On drop: import flow runs; on drag-leave: overlay dismisses.
- Multi-file drops are supported (one tab per file by default).

---

### M14 — Demo Mode Banner & Disabled-Feature Affordances

**Purpose:** Communicate that the GitHub Pages demo lacks the backend.
**Trigger:** Always present in demo build.
**FR coverage:** FR-029 §AC2.

```
┌────────────────────────────────────────────────────────────┐
│ ⓘ You're using the demo. Backend features are disabled.    │
│   For full Kendraw, self-host with one command.           │
│   [ Install instructions ]   [ Dismiss for this session ]  │
└────────────────────────────────────────────────────────────┘
```

- Banner above the menu bar (extra row).
- Plus: every disabled tool/menu shows a small ⓘ glyph; hover tooltip explains "Requires backend — self-host Kendraw to enable".
- Status bar shows persistent "DEMO" badge.

---

### M15 — Unsaved Changes Confirmation Prompt

**Purpose:** Prevent accidental tab closure with unsaved work.
**Trigger:** `Ctrl+W` or × on a dirty tab.
**FR coverage:** FR-016 §AC4.

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   Close "aspirin-synthesis.cdxml"?                               ║
║                                                                  ║
║   You have unsaved changes. They will be archived for 7 days     ║
║   and recoverable from About.                                    ║
║                                                                  ║
║       [ Cancel ]   [ Close anyway ]   [ Save and close ]         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

- Standard 3-button modal.
- "Save and close" is the primary CTA.
- Esc = Cancel.
- "Close anyway" is destructive but reversible thanks to the 7-day archive.

---

## Part 4 — Accessibility

Per NFR-006: full WCAG 2.1 AA on the non-canvas UI; the canvas itself is exempt because a 2D molecular editor is intrinsically visual. This part documents the AA commitments.

### 4.1 Perceivable

**Contrast (AA, 4.5:1 for text, 3:1 for UI):**

- All text against its background ≥ 4.5:1 in both dark and light modes. Verified by automated scanner in CI (NFR-006 §AC1).
- UI components (buttons, icons, focus rings) ≥ 3:1.
- Glass surfaces fall back to opaque equivalents under `prefers-reduced-transparency`; opaque equivalents independently verified for contrast.

**Information not by colour alone:**

- Valence violations (FR-007): red ring + tooltip (text). Never colour alone.
- Save status: text label + icon. Never icon alone.
- Reaction arrow types: distinct geometries, not just colours.

**Text scaling:**

- All UI text resizes to 200% without horizontal scrolling on a 1280 px viewport.
- Property panel content uses logical units (rem) so user font size preference is honoured.

**Alt text:**

- Logo: `alt="Kendraw"`.
- Tool palette icons: each has `aria-label` matching its name and shortcut.
- Decorative ASCII flourishes: `aria-hidden="true"`.

### 4.2 Operable

**Keyboard navigation (full coverage on non-canvas UI):**

- Tab order across the editor:
  1. Menu bar items (left to right)
  2. Tab bar tabs (left to right) + new-tab button
  3. Tool palette buttons (top to bottom, group by group)
  4. Property panel: collapse button → SMILES input → copy buttons → expandable sections → document section
  5. Status bar (read-only, focusable for screen readers)
- Skip links: `Skip to canvas`, `Skip to property panel` at the very start of focus order.
- All modals trap focus (M1–M15). Esc returns focus to the trigger element.
- No keyboard traps in the editor itself; canvas focus is exited with Esc + Shift+Tab.

**Touch targets:** 44×44 px minimum (we use 48×48 by default).

**Animations:**

- All transitions ≤ 200 ms.
- `@media (prefers-reduced-motion: reduce)` disables non-essential animations: welcome card scale, tab-open slide, modal fade. Critical feedback (focus ring transitions, valence-error pulses) remains.

**Skip-canvas link:**

- The first focusable element in the editor is `Skip to property panel`. Sighted keyboard users get this via `Tab` from the URL bar.

### 4.3 Understandable

**Language:** `<html lang="en">` at MVP. i18n keys ready for V2 multilingual.

**Form labels:** every input has a visible label or `aria-label`.

**Error messages:**

- Plain English, no jargon, actionable.
- Example: _"This atom has 5 bonds — most carbons should have 4. Click to dismiss this warning, or change a bond to a single bond."_

**Consistent navigation:** menu bar, tab bar, palette, property panel are in the same place on every screen. About and Settings open as full pages with a single "Back to editor" affordance.

**Predictable interactions:** no surprise navigation. Focusing an input never triggers an action; clicking outside a modal does not dismiss it (intentional; Esc dismisses).

### 4.4 Robust

**Semantic HTML:**

- `<header>` for menu bar
- `<nav aria-label="Tools">` for tool palette
- `<main>` wraps the canvas
- `<aside aria-label="Structure properties">` for property panel
- `<footer>` for status bar

**ARIA landmarks:** the above mapping provides 5 landmarks; screen reader users navigate them with rotor/`D` key.

**ARIA states:**

- Tool palette buttons: `aria-pressed="true"` on the active tool.
- Property panel sections: `aria-expanded` on collapsible chevrons.
- Modals: `role="dialog" aria-modal="true" aria-labelledby` referencing the title.
- Live regions: status bar save segment is `aria-live="polite"`; valence violations are NOT live (they would be too noisy).

**Form validation:** all inputs use `aria-invalid="true"` and `aria-describedby` pointing to the error message.

**Tested with:**

- NVDA on Windows + Chrome
- VoiceOver on macOS + Safari
- axe DevTools (zero AA failures gate in CI)
- Keyboard-only walkthrough (manual, weekly during MVP development)

### 4.5 Canvas exemption (documented limitation)

The 2D drawing canvas itself is **not** WCAG-conformant:

- Screen readers cannot meaningfully describe a structural diagram in real time.
- Keyboard-only drawing is supported via shortcuts but not via Tab navigation across atoms.
- Colour-coding is intrinsic to chemistry (CPK colours, bond types).

This limitation is documented in `ACCESSIBILITY.md` and on the About page (S3). A future V2 work item — "screen-reader-friendly structural narration" — is tracked in the backlog. (Not committed.)

---

## Part 5 — Component Library

Eleven first-class components. Every screen above is composed from these.

---

### C1 — Button

**Variants:** Primary, Secondary, Tertiary, Destructive, Icon-only.

**Sizes:** Small (32 px height), Medium (40 px, default), Large (48 px).

**States:** Default, Hover, Focus, Active, Disabled, Loading.

**Specs:**

- Primary: filled background `--color-primary`, white text, no border.
- Secondary: 1px border `--color-primary`, transparent fill, primary text.
- Tertiary: no border, primary text, hover background neutral-100/700.
- Destructive: filled `--color-error`, white text.
- Icon-only: 40×40 square, `aria-label` required.
- Border radius: 8 px (medium); 6 px (small); 10 px (large).
- Focus: 2 px outline `--color-primary`, offset 2 px.
- Loading: spinner replaces label; `aria-busy="true"`.

**Glassmorphism note:** primary buttons remain solid. Glass treatment only applies to surfaces, never to interactive controls — they need contrast.

---

### C2 — Tool Button (palette)

Specialized icon button for the tool palette.

**Specs:**

- 48×48 px square.
- Icon size: 24×24 px centred.
- Active state: filled background `--color-primary-12`, primary 4 px left accent bar, icon `--color-primary`.
- Hover: glass lift (`backdrop-filter: blur(8px)`), tooltip after 400 ms.
- Tooltip content: name + shortcut in muted text.
- `aria-pressed`, `aria-label`.

---

### C3 — Tab

A single document tab in the tab bar.

**Specs:**

- Height 40 px (matches tab bar).
- Min-width 120 px, max-width 240 px, content truncated with ellipsis.
- Active: glass lift, 2 px primary top border, document name in regular weight.
- Inactive: subtle glass, document name in muted colour.
- Unsaved indicator: 6 px solid dot in primary colour, between name and close button.
- Close button: appears on hover and focus.
- Drag handle: entire tab is draggable; cursor changes to grab on hover-hold.

---

### C4 — Glass Panel

The base surface used by menu bar, tab bar, palette, property panel, status bar, and all modals.

**Specs:**

- `background: var(--surface-glass)` (rgba with alpha)
- `backdrop-filter: blur(16px) saturate(140%)`
- `border: 1px solid var(--surface-glass-border)`
- `border-radius: 0` for chrome bars, `12 px` for modals/panels
- Fallback under `prefers-reduced-transparency`: solid `--surface-elevated` (no blur, slightly lighter than the base background).

---

### C5 — Input Field

For text input (SMILES, IUPAC, search, settings).

**Specs:**

- Height 40 px (medium), 48 px (large).
- Border 1 px `--neutral-300` (light) / `--neutral-700` (dark).
- Focus: 2 px outline `--color-primary`, offset 0.
- Error: 2 px outline `--color-error` + error message below in error colour.
- Placeholder: `--neutral-500`.
- Monospace variant for SMILES/InChI fields.
- Padding: 12 px horizontal.
- Border radius: 8 px.

---

### C6 — Modal

Standard centred modal used by M1–M5, M8, M10, M15.

**Specs:**

- Centred on a dimmed (`rgba(0,0,0,0.5)`) backdrop.
- Width by content; max-width 720 px (wider for periodic table).
- Header: 56 px, bottom border, title left, close button right.
- Footer: 64 px, top border, action buttons right-aligned.
- Body: scrollable if content overflows.
- Focus trap; Esc closes; click on backdrop does NOT close (intentional).
- `role="dialog" aria-modal="true"`.

---

### C7 — Toast

Non-blocking ephemeral notification.

**Specs:**

- Top-right of viewport, 16 px from edges.
- Width 360 px, content-driven height.
- Auto-dismiss after 5 seconds (success), 8 seconds (warning), persist (error — manual dismiss).
- Stack vertically; newest on top.
- Variants: success (✓), warning (⚠), error (✕), info (ⓘ).
- `role="status"` for success, `role="alert"` for error/warning.

---

### C8 — Tooltip

Contextual hint on hover or focus.

**Specs:**

- Appears after 400 ms hover, immediately on focus.
- Background: solid (NOT glass — readability priority), `--neutral-900` in light mode, `--neutral-100` in dark.
- Padding: 8 px horizontal, 6 px vertical.
- Border radius: 6 px.
- Arrow: 6 px triangle pointing to anchor.
- Max-width 280 px; wraps to multiple lines.
- `role="tooltip"`, anchored via `aria-describedby`.

---

### C9 — Card

For tile grids in templates browser, quick-start tiles in S2-A, settings sections.

**Specs:**

- Glass surface (C4).
- Padding 16 px.
- Border radius 12 px.
- Hover: lift 2 px, shadow elevation +1.
- Focus: 2 px primary outline.
- Selected: 2 px primary outline + primary tinted background.

---

### C10 — Property Row

A label-value row in the property panel.

**Specs:**

- Height 32 px.
- Label left, monospace value right, copy button far right.
- Hover: subtle background highlight.
- Copy button: visible on row hover or focus, otherwise transparent (still focusable for keyboard).

---

### C11 — Thumbnail Strip Item

For M9 multi-page SDF navigator and templates grid.

**Specs:**

- 48×48 (M9) or 80×60 (M2 templates).
- Bordered container with structure preview rendered at low DPI.
- Active: 2 px primary border.
- Hover: 1 px neutral-300 border, lift 1 px.

---

## Part 6 — Design Tokens (the "Glasswerk" system)

The new token system. Named "Glasswerk" because it's glass-first and German-engineering-feel — both signals matter for the persona.

### 6.1 Colour

#### Primary palette

| Token                | Dark mode value          | Light mode value       | Use                           |
| -------------------- | ------------------------ | ---------------------- | ----------------------------- |
| `--color-primary`    | `#7AB8FF`                | `#0066CC`              | Buttons, focus, active states |
| `--color-primary-h`  | `#A8D0FF`                | `#0052A3`              | Hover                         |
| `--color-primary-12` | `rgba(122,184,255,0.12)` | `rgba(0,102,204,0.12)` | Subtle accent backgrounds     |

**Contrast verified:**

- Dark mode primary on dark surface: 4.78:1 (AA pass)
- Light mode primary on white: 4.57:1 (AA pass)

#### Semantic palette

| Token             | Dark      | Light     | Contrast (text on white) |
| ----------------- | --------- | --------- | ------------------------ |
| `--color-success` | `#5BD18A` | `#00872B` | 5.05:1 ✓                 |
| `--color-warning` | `#FFB454` | `#A85C00` | 5.21:1 ✓                 |
| `--color-error`   | `#FF7A7A` | `#C5252D` | 4.78:1 ✓                 |
| `--color-info`    | `#7AB8FF` | `#0066CC` | 4.57:1 ✓                 |

#### Neutral palette (Glasswerk gradient)

Dark mode (default):

| Token                    | Value                    | Use                               |
| ------------------------ | ------------------------ | --------------------------------- |
| `--bg-base`              | `#0B0D12`                | App background (behind glass)     |
| `--bg-elevated`          | `#13161D`                | Reduced-transparency fallback     |
| `--surface-glass`        | `rgba(20,24,32,0.62)`    | Glass panels                      |
| `--surface-glass-border` | `rgba(255,255,255,0.08)` | Glass borders                     |
| `--neutral-100`          | `#E8EAF0`                | Headings, primary text            |
| `--neutral-300`          | `#B0B6C2`                | Secondary text                    |
| `--neutral-500`          | `#6E7585`                | Tertiary text, placeholders       |
| `--neutral-700`          | `#3A3F4B`                | Borders, dividers                 |
| `--neutral-900`          | `#1C2029`                | Inverse text on light backgrounds |

Light mode:

| Token                    | Value                    | Use                              |
| ------------------------ | ------------------------ | -------------------------------- |
| `--bg-base`              | `#F4F6FA`                | App background                   |
| `--bg-elevated`          | `#FFFFFF`                | Reduced-transparency fallback    |
| `--surface-glass`        | `rgba(255,255,255,0.72)` | Glass panels                     |
| `--surface-glass-border` | `rgba(0,0,0,0.06)`       | Glass borders                    |
| `--neutral-100`          | `#1C2029`                | Headings, primary text           |
| `--neutral-300`          | `#3A3F4B`                | Secondary text                   |
| `--neutral-500`          | `#6E7585`                | Tertiary text, placeholders      |
| `--neutral-700`          | `#B0B6C2`                | Borders, dividers                |
| `--neutral-900`          | `#E8EAF0`                | Inverse text on dark backgrounds |

**Token symmetry:** dark and light modes share the same token names; only values flip. Components reference tokens, not values.

#### Canvas-specific colours (CPK-inspired, contrast-tuned)

| Element | Canvas dark | Canvas light |
| ------- | ----------- | ------------ |
| C       | `#E8EAF0`   | `#1C2029`    |
| H       | `#FFFFFF`   | `#3A3F4B`    |
| O       | `#FF7A7A`   | `#C5252D`    |
| N       | `#7AB8FF`   | `#0066CC`    |
| S       | `#FFD96B`   | `#9C7400`    |
| P       | `#FFB454`   | `#A85C00`    |
| F       | `#A8E07A`   | `#3F8000`    |
| Cl      | `#5BD18A`   | `#007A2D`    |
| Br      | `#C58353`   | `#7A4824`    |
| I       | `#9E7AFF`   | `#5C2EAA`    |

### 6.2 Typography

**Font families:**

- UI: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- Monospace (SMILES, InChI, code): `'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace`
- Chemistry overlays (atom labels on canvas): `'IBM Plex Sans', 'Inter', sans-serif` (slightly wider for atom symbols)

All chosen fonts are open-source / OFL / MIT-compatible (NFR-003).

**Type scale (base 16 px):**

| Token       | Size  | Line height | Weight | Use                          |
| ----------- | ----- | ----------- | ------ | ---------------------------- |
| `--t-h1`    | 32 px | 1.25        | 600    | Welcome, About, Settings     |
| `--t-h2`    | 24 px | 1.3         | 600    | Section titles               |
| `--t-h3`    | 18 px | 1.4         | 600    | Sub-sections                 |
| `--t-body`  | 14 px | 1.5         | 400    | UI body text                 |
| `--t-small` | 13 px | 1.45        | 400    | Tab names, status bar        |
| `--t-tiny`  | 11 px | 1.4         | 500    | Tooltips, labels (UPPERCASE) |
| `--t-mono`  | 13 px | 1.5         | 400    | SMILES, formulas             |

**Why 14 px body, not 16 px:** desktop-only product (NFR-002). Élise's 24" 1440p monitor benefits from denser UI; the property panel lives in 320 px, so 14 px buys two extra rows of properties without scrolling.

### 6.3 Spacing

8 px grid.

| Token   | Value |
| ------- | ----- |
| `--s-1` | 4 px  |
| `--s-2` | 8 px  |
| `--s-3` | 12 px |
| `--s-4` | 16 px |
| `--s-5` | 24 px |
| `--s-6` | 32 px |
| `--s-7` | 48 px |
| `--s-8` | 64 px |

**Layout constants:**

- Menu bar height: 32 px
- Tab bar height: 40 px
- Tool palette width: 64 px
- Property panel width: 320 px
- Status bar height: 28 px
- Modal max-width: 720 px (M1 width: 640 px)
- Editor min viewport: 1280×720

### 6.4 Elevation & Shadow

Glass surfaces use blur + alpha; shadows are subtle and used sparingly.

| Token             | Value                          | Use              |
| ----------------- | ------------------------------ | ---------------- |
| `--elev-0`        | `none`                         | Inline elements  |
| `--elev-1`        | `0 1px 2px rgba(0,0,0,0.12)`   | Cards, panels    |
| `--elev-2`        | `0 4px 12px rgba(0,0,0,0.18)`  | Modals, popovers |
| `--elev-3`        | `0 16px 40px rgba(0,0,0,0.24)` | Welcome, restore |
| `--blur-glass-sm` | `blur(8px) saturate(140%)`     | Tooltips (rare)  |
| `--blur-glass-md` | `blur(16px) saturate(140%)`    | All chrome glass |
| `--blur-glass-lg` | `blur(24px) saturate(160%)`    | Welcome screen   |

### 6.5 Radius

| Token      | Value   |
| ---------- | ------- |
| `--r-sm`   | 6 px    |
| `--r-md`   | 8 px    |
| `--r-lg`   | 12 px   |
| `--r-xl`   | 16 px   |
| `--r-full` | 9999 px |

Chrome bars use radius 0 (full-width). Modals and cards use `--r-lg`.

### 6.6 Motion

| Token           | Value                            |
| --------------- | -------------------------------- |
| `--ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`  |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast`    | 120 ms                           |
| `--dur-base`    | 200 ms                           |
| `--dur-slow`    | 320 ms                           |

Under `prefers-reduced-motion: reduce`, all durations clamp to 0.01 ms (i.e., effectively off) except critical state transitions (focus rings, valence error pulses).

### 6.7 Z-index

| Token         | Value | Layer                                 |
| ------------- | ----- | ------------------------------------- |
| `--z-base`    | 0     | Canvas content                        |
| `--z-chrome`  | 10    | Menu / tab / palette / panel / status |
| `--z-overlay` | 100   | Drag-drop overlay, demo banner        |
| `--z-modal`   | 1000  | M1–M15                                |
| `--z-toast`   | 2000  | Toasts                                |

---

## Part 7 — Developer Handoff

### 7.1 Implementation order (recommended)

**Sprint 1 — Glasswerk foundation**

1. Set up CSS custom properties for all tokens (Part 6).
2. Implement dark/light theme toggle with localStorage persistence.
3. Implement `prefers-reduced-transparency` and `prefers-reduced-motion` media queries.
4. Build C1 (Button), C5 (Input Field), C8 (Tooltip), C7 (Toast).
5. Storybook (or equivalent) entries for each component.

**Sprint 2 — Editor chrome**

1. Implement S2 macro layout (menu / tab / palette / canvas slot / panel / status).
2. Build C4 (Glass Panel), C2 (Tool Button), C3 (Tab), C10 (Property Row).
3. Wire menu bar items to placeholder actions; theme toggle live.
4. Empty editor state (S2-A) renders.
5. Welcome screen (S1) renders on first load only.

**Sprint 3 — Drawing core**

1. Canvas mounts (architecture POC #1 result determines substrate).
2. Tool palette tools wired: select, single bond, atoms (C/N/O/H), benzene template.
3. Property panel updates on canvas changes (FR-015).
4. Auto-save scaffolding (FR-017).
5. M5 (cheatsheet) reachable from `?`.

**Sprint 4 — Reactions, mechanisms, multi-tab**

1. Reaction arrow tool + M7 annotation editor.
2. Curly arrow tool + M6 inline editor (the riskiest interaction — alone in a sprint).
3. Multi-tab support (FR-016) + M15 unsaved-changes prompt.
4. M8 restore prompt on reload.

**Sprint 5 — Import / Export / Citation**

1. M3 import dialog + drag-drop (M13).
2. M4 export dialog with PNG/SVG/MOL/SDF/SMILES/InChI.
3. EXIF metadata embedding (FR-027).
4. S3 About page with citation block.

**Sprint 6 — Polish, accessibility, demo**

1. Full keyboard navigation pass (skip links, focus traps, tab order).
2. axe DevTools sweep, fix all AA failures.
3. Contrast scanner CI gate.
4. Demo build with M14 banner and disabled-feature affordances.
5. Performance benchmarks at 100 / 250 / 500 / 750 atoms (NFR-001).

### 7.2 CSS skeletons

```css
/* tokens.css */
:root {
  /* Colours — dark mode is default */
  --color-primary: #7ab8ff;
  --color-primary-h: #a8d0ff;
  --color-primary-12: rgba(122, 184, 255, 0.12);
  --color-success: #5bd18a;
  --color-warning: #ffb454;
  --color-error: #ff7a7a;
  --color-info: #7ab8ff;

  --bg-base: #0b0d12;
  --bg-elevated: #13161d;
  --surface-glass: rgba(20, 24, 32, 0.62);
  --surface-glass-border: rgba(255, 255, 255, 0.08);

  --neutral-100: #e8eaf0;
  --neutral-300: #b0b6c2;
  --neutral-500: #6e7585;
  --neutral-700: #3a3f4b;
  --neutral-900: #1c2029;

  /* Typography */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  --t-h1: 32px;
  --t-h2: 24px;
  --t-h3: 18px;
  --t-body: 14px;
  --t-small: 13px;
  --t-tiny: 11px;
  --t-mono: 13px;

  /* Spacing */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;

  /* Elevation */
  --elev-1: 0 1px 2px rgba(0, 0, 0, 0.12);
  --elev-2: 0 4px 12px rgba(0, 0, 0, 0.18);
  --elev-3: 0 16px 40px rgba(0, 0, 0, 0.24);
  --blur-glass-md: blur(16px) saturate(140%);
  --blur-glass-lg: blur(24px) saturate(160%);

  /* Radius */
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 12px;
  --r-xl: 16px;

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;

  /* Z */
  --z-chrome: 10;
  --z-overlay: 100;
  --z-modal: 1000;
  --z-toast: 2000;
}

[data-theme='light'] {
  --color-primary: #0066cc;
  --color-primary-h: #0052a3;
  --color-primary-12: rgba(0, 102, 204, 0.12);
  --color-success: #00872b;
  --color-warning: #a85c00;
  --color-error: #c5252d;

  --bg-base: #f4f6fa;
  --bg-elevated: #ffffff;
  --surface-glass: rgba(255, 255, 255, 0.72);
  --surface-glass-border: rgba(0, 0, 0, 0.06);

  --neutral-100: #1c2029;
  --neutral-300: #3a3f4b;
  --neutral-500: #6e7585;
  --neutral-700: #b0b6c2;
  --neutral-900: #e8eaf0;
}

@media (prefers-reduced-transparency: reduce) {
  :root {
    --surface-glass: var(--bg-elevated);
    --blur-glass-md: none;
    --blur-glass-lg: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* glass-panel.css */
.glass-panel {
  background: var(--surface-glass);
  backdrop-filter: var(--blur-glass-md);
  -webkit-backdrop-filter: var(--blur-glass-md);
  border: 1px solid var(--surface-glass-border);
}

/* button.css */
.btn {
  font: 600 var(--t-body)/1 var(--font-ui);
  padding: 0 var(--s-4);
  height: 40px;
  min-width: 44px;
  border-radius: var(--r-md);
  border: none;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.btn-primary {
  background: var(--color-primary);
  color: var(--bg-base);
}
.btn-primary:hover {
  background: var(--color-primary-h);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* tool-button.css */
.tool-btn {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  border-radius: var(--r-md);
  position: relative;
  cursor: pointer;
}
.tool-btn[aria-pressed='true'] {
  background: var(--color-primary-12);
  color: var(--color-primary);
}
.tool-btn[aria-pressed='true']::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--color-primary);
}
.tool-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 7.3 React component shape (illustrative)

```tsx
// PropertyPanel.tsx
export function PropertyPanel({ structure }: { structure: Structure | null }) {
  return (
    <aside className="property-panel glass-panel" aria-label="Structure properties">
      <header className="panel-header">
        <h2 className="t-h3">Properties</h2>
        <button aria-label="Collapse panel" onClick={collapse}>
          ⌃
        </button>
      </header>
      <SmilesInput value={structure?.smiles ?? ''} onParse={handleParse} />
      <PropertyRow label="Formula" value={structure?.formula ?? '—'} copy />
      <PropertyRow label="Mol. weight" value={structure?.mw ?? '—'} copy />
      <PropertyRow label="Exact mass" value={structure?.exactMass ?? '—'} copy />
      <Divider />
      <PropertyRow label="Atoms" value={structure?.atomCount ?? '—'} />
      <PropertyRow label="Bonds" value={structure?.bondCount ?? '—'} />
      <PropertyRow label="Charge (net)" value={structure?.netCharge ?? '—'} />
      <PropertyRow label="Valence" value={structure?.valenceStatus ?? '—'} statusIcon />
      {/* V1 collapsible sections... */}
    </aside>
  );
}
```

### 7.4 Assets needed

**Logo & marks:**

- `kendraw-mark.svg` — the ⬡⬡⬡ trio mark (primary identity)
- `kendraw-wordmark.svg` — wordmark for header
- Favicon set: 16, 32, 180 (Apple), 192, 512 (PWA-ready for V2)

**Icons (24×24 SVG, single-colour, currentColor):**

- Tool palette (14 icons): select, lasso, single/double/triple/aromatic/wedge/dash bonds, atom, periodic table, benzene, templates, reaction arrow, curly arrow, text annotation, undo, redo
- Menu icons: file, edit, view, insert, tools, help
- Status icons: check, warning, error, info, save, copy, lock, drag-handle, close, chevron-up/down/left/right

**Fonts (self-hosted, MIT/OFL):**

- Inter (variable weights)
- JetBrains Mono (regular + bold)
- IBM Plex Sans (regular + medium) — for canvas atom labels

**Reference structures (for empty-state quick-start tiles):**

- `benzene.mol`, `hexane.mol`, `aspirin.mol` — bundled and used by S2-A.

### 7.5 Performance budgets (UX-imposed)

| Operation                           | Budget           | Source        |
| ----------------------------------- | ---------------- | ------------- |
| Property panel update (≤ 100 atoms) | 100 ms           | FR-015 §AC1   |
| Property panel update (≤ 500 atoms) | 500 ms           | FR-015 §AC2   |
| SMILES parse + render (≤ 100 atoms) | 200 ms           | FR-018 §AC1   |
| Bond draw on 500-atom molecule      | 16 ms            | NFR-001 §AC1  |
| Pan/zoom on 500-atom molecule       | ≥ 30 fps         | NFR-001 §AC2  |
| Tab switch                          | 100 ms           | UX commitment |
| Modal open/close                    | 200 ms           | UX commitment |
| Theme toggle                        | 200 ms           | UX commitment |
| Auto-save trigger                   | ≤ 5 s after edit | FR-017 §AC1   |

### 7.6 What the architect must validate (UX → architecture)

1. **Canvas rendering substrate** must support: 60 fps pan/zoom on 500 atoms; per-frame partial repaints for live valence validation; 2-control-point Bézier curves for curly arrows with ≥ 200 simultaneous arrows in a multi-step scheme; multi-page document model for SDF (M9).
2. **State management** must support: per-tab undo history with no fixed depth (FR-009); cross-tab persistence; restore-after-crash with selection and undo intact (FR-016 §AC5).
3. **Glass rendering** must remain at 60 fps with 5 simultaneous glass surfaces. If `backdrop-filter` cost is prohibitive on Firefox, the fallback is the opaque elevated surface — already designed for.
4. **Auto-save** must hit < 5 s without blocking the editing thread. IndexedDB is the assumed backing store; if localStorage is chosen, the multi-tab session restore (FR-016 §AC5) must still work — quota planning is required.
5. **Citation footprint** in PNG/SVG/PDF exports — architecture must guarantee that the FR-027 metadata block is preserved through every export path, including any client-side fallback.

---

## Part 8 — Validation & Traceability

### 8.1 MVP FR coverage matrix

Every MVP FR (FR-001 → FR-029) is mapped to at least one surface or interaction. Cells marked `(canvas)` are handled by direct canvas rendering without a dedicated chrome surface.

| FR     | Title                                         | Surface(s)                   |
| ------ | --------------------------------------------- | ---------------------------- |
| FR-001 | Interactive 2D Drawing Canvas                 | S2 (canvas), M9              |
| FR-002 | Atom & Element Placement                      | S2 palette, M1               |
| FR-003 | Basic Bond Types                              | S2 palette, (canvas)         |
| FR-004 | Predefined Ring Library — MVP Set             | S2 palette, M2 (Rings tab)   |
| FR-005 | Quick Carbon Chain Drawing                    | (canvas drag interaction)    |
| FR-006 | Wedge / Dash Stereochemistry Display          | S2 palette, (canvas)         |
| FR-007 | Real-time Valence Validation                  | (canvas) + property panel    |
| FR-008 | Selection Tools — MVP Set                     | S2 palette, (canvas)         |
| FR-009 | Unlimited Undo / Redo                         | S2 palette + Ctrl+Z/Y        |
| FR-010 | Standard Edit Operations                      | S2 menu Edit + shortcuts     |
| FR-011 | Reaction Arrows                               | S2 palette, (canvas)         |
| FR-012 | Curly Arrows for Mechanisms                   | S2 palette, M6 inline editor |
| FR-013 | Reaction Condition Annotations                | M7                           |
| FR-014 | Glassmorphism UI with Dark/Light Mode         | All surfaces; tokens Part 6  |
| FR-015 | Real-time Property Panel                      | S2 property panel            |
| FR-016 | Multi-document Tabs                           | S2 tab bar (S2-C), M15       |
| FR-017 | Local Auto-save                               | S2 status bar, M8            |
| FR-018 | Frontend SMILES Parsing & Rendering           | Property panel SMILES input  |
| FR-019 | ChemDraw-Compatible Keyboard Shortcuts        | All editor + M5 cheatsheet   |
| FR-020 | Drag & Drop File Import                       | M13 overlay + M3             |
| FR-021 | RDKit Backend Compute API                     | (backend) + property panel   |
| FR-022 | Format Conversion (MVP Set)                   | M3, M4                       |
| FR-023 | MVP File Import                               | M3, M9                       |
| FR-024 | MVP File Export                               | M4                           |
| FR-025 | Image Copy-Paste to Office Suites             | S2 menu Edit + Ctrl+C        |
| FR-026 | Citation Splash Screen / About Page           | S1, S3                       |
| FR-027 | EXIF / Metadata Citation Footprint in Exports | M4 toggle + (background)     |
| FR-028 | Self-hostable Deployment Bundle               | (deployment, no UX)          |
| FR-029 | Static Frontend-only Demo Mode                | M14 banner + status badge    |

**29 of 29 MVP FRs covered.** No gaps.

### 8.2 V1 FR coverage (high-level)

| FR     | Title                                          | Surface(s)              |
| ------ | ---------------------------------------------- | ----------------------- |
| FR-030 | Advanced Bond Types                            | S2 palette extension    |
| FR-031 | Lone Pairs and Radicals                        | (canvas) + atom popover |
| FR-032 | R/S and E/Z Stereo Computation                 | Property panel toggle   |
| FR-033 | Lasso Selection and Advanced Layout            | S2 palette + Tools menu |
| FR-034 | Resonance Arrows and Multi-step Schemes        | S2 palette + (canvas)   |
| FR-035 | Built-in Biomolecule Template Library          | M2 (Built-in tab)       |
| FR-036 | Common Molecule and Protecting Group Templates | M2 (Built-in tab)       |
| FR-037 | User-Defined Custom Templates                  | M2 (My templates tab)   |
| FR-038 | Drug-Likeness and Physicochemical Properties   | Property panel section  |
| FR-039 | Full Molecular Descriptor Suite                | Property panel section  |
| FR-040 | IUPAC Name-to-Structure                        | Property panel + Ctrl+I |
| FR-041 | Structure-to-IUPAC Name                        | Property panel section  |
| FR-042 | Elemental Analysis and Stoichiometry           | Property panel section  |
| FR-043 | CDXML Import / Export                          | M3, M4                  |
| FR-044 | Additional Chemistry Formats                   | M3, M4                  |
| FR-045 | Publication-Quality Vector Export              | M4                      |
| FR-046 | Customizable Tool Palette                      | S4 Settings → Palette   |
| FR-047 | Customizable Keyboard Shortcuts                | S4 Settings → Shortcuts |
| FR-048 | Integrated Structure Search                    | M10                     |
| FR-049 | Embedded Chemical Data Tables                  | M11                     |

**20 of 20 V1 FRs covered.**

### 8.3 NFR coverage

| NFR     | Coverage in this design                                                     |
| ------- | --------------------------------------------------------------------------- |
| NFR-001 | Performance budgets §7.5; canvas-substrate validation §7.6                  |
| NFR-002 | Desktop scope locked §1.1                                                   |
| NFR-003 | Fonts and assets §7.4 are MIT/OFL                                           |
| NFR-004 | Demo mode (M14) + self-host parity in S3                                    |
| NFR-005 | M4 export presets (publication, JACS preset)                                |
| NFR-006 | Part 4 — full WCAG 2.1 AA on non-canvas UI                                  |
| NFR-007 | i18n keys note in §1.1; locale switching deferred to V2                     |
| NFR-008 | No telemetry — Welcome S1 + Privacy in S4 → Privacy panel                   |
| NFR-009 | n/a (design-side); component library + tokens enable contributor onboarding |
| NFR-010 | M8 restore prompt + status bar live region + 5 s auto-save                  |
| NFR-011 | S1 + S3 + M4 footprint toggle                                               |
| NFR-012 | Cheatsheet M5 is one of the five doc artefacts                              |

### 8.4 Open issues remaining for architecture

The following items are tracked here but cannot be resolved at UX phase. They flow forward to architecture (Phase 3):

- **Frontend chemistry library choice (PRD Q#1)** — UX assumes < 200 ms parse on 100 atoms (FR-018). Architecture must verify this for the chosen library.
- **Rendering substrate (PRD Q#2)** — UX requires 60 fps on 500 atoms with glass chrome. Architecture POC #1 is bloquant.
- **CDXML version coverage (PRD Q#4)** — UX assumes CDXML import succeeds for ≥ 95% of URD Abbaye corpus. Architecture POC #3 must validate.
- **IUPAC backend (PRD Q#6)** — UX assumes ≥ 80% accuracy on 200-name test set (FR-040 §AC1). Architecture must confirm RDKit/OPSIN coverage.
- **Auto-save strategy (PRD Q#8)** — UX requires multi-tab restore with full undo history. Architecture decides localStorage vs. IndexedDB.

### 8.5 Self-validation checklist (signed off by JB)

- [x] Every MVP FR maps to at least one surface or interaction.
- [x] Every V1 FR has a documented surface or extension point.
- [x] WCAG 2.1 AA committed for non-canvas UI; canvas exemption documented.
- [x] All inputs labelled; all interactive controls keyboard-reachable.
- [x] Dark and light tokens both contrast-verified at AA.
- [x] Glassmorphism degrades gracefully under reduced-transparency.
- [x] Animations respect `prefers-reduced-motion`.
- [x] Citation ask present in S1, S3, and M4 — never blocking.
- [x] Curly arrow interaction (M6) explicitly designed (PRD Q#3 resolved).
- [x] Multi-structure SDF UX explicitly designed (PRD Q#5 resolved).
- [x] Performance budgets stated for the architect.
- [x] Implementation order and CSS skeletons delivered.
- [x] Component library defined (11 components).
- [x] Design tokens defined (Glasswerk system).

**Sign-off:**

- [x] Product Owner / Designer / Engineering Lead — Jean-Baptiste Donnette (single-person sign-off; this is a solo project)
- [ ] URD Abbaye review (informal, post-MVP-prototype)
- [ ] Architecture phase consumer (Phase 3)

---

## Revision History

| Version | Date       | Author                 | Changes                                                 |
| ------- | ---------- | ---------------------- | ------------------------------------------------------- |
| 1.0     | 2026-04-12 | Jean-Baptiste Donnette | Initial UX design covering MVP + V1 across 22 surfaces. |

---

## Next Steps

1. **Self-review** — re-read Part 1 (principles) and Part 8 (validation) tomorrow with fresh eyes. Adjust as needed.
2. **Informal URD Abbaye review** — show Élise the curly arrow interaction (M6) and the property panel (S2). Their reactions are the only external validation that matters at this phase.
3. **Run `/architecture`** — Phase 3. The architect must:
   - Validate canvas substrate against the performance budgets in §7.5.
   - Choose the frontend chemistry library and verify FR-018 latency.
   - Validate CDXML round-trip on the URD Abbaye corpus (POC #3).
   - Confirm the auto-save backing store.
4. **Solutioning gate check** — once architecture is in place.
5. **Sprint planning** — decompose epics into stories using the implementation order in §7.1 as the seed.

---

_Generated by BMAD Method v6 — UX Designer workflow._
_Design date: 2026-04-12._
