# V7 Audit — Sally, Senior UX Designer

Scope: 3 visible UX novelties from waves 5-7. Read the wave-6 spec, the
HF-6 handler-fix doc, and the shipped source under
`packages/ui/src/canvas-new/toolbox/*`, `ImportDialog.tsx`,
`packages/nmr/src/NmrPanel.tsx`, `design-tokens.css`, and the HF-3
keydown wiring in `App.tsx`.

---

## 1. 2-column grouped toolbox (HF-1 + HF-2)

- **Spec drift, deliberate but unowned.** Spec promises one column at
  56 px with long-press flyouts. Ship is two columns at 80 px min, no
  flyouts, no chevrons. Decision may be defensible (denser) but no doc
  amends the spec — next reviewer reads "one column" and finds two.
  Write an ADR or update the spec. ChemDraw refugees will notice.
- **Dead labels.** Every `ToolDef` carries a 3-letter `label` ("Bz",
  "Cy6", "Txt", "Arw", "SMI", "Mol") that the renderer never shows —
  buttons are icon-only. Either expose them as captions at ≤1280 px
  (the spec's "implicit label" promise) or delete the field.
- **No hover, no `:focus-visible`.** Inline styles transition only on
  the `data-active` flip; there is no hover, no keyboard focus ring.
  Tab through the rail and you cannot tell where you are. Hard fail on
  any a11y audit. Easy fix — move to CSS module + add states.
- **Active fill hardcodes `color: '#000'`** while the dialog HF-5
  introduced `--kd-color-text-inverse` for exactly this. One token,
  not two conventions.
- **Dropped tools have zero affordance.** HF-1 removed lasso, three
  bond variants, atom-picker, curly-arrow without leaving greyed
  "coming soon" stubs (which the spec explicitly designed). A ChemDraw
  refugee finds nothing where lasso should be and no signal it's
  planned — discoverability regression on top of a feature regression.

## 2. Dark / light mode for dialogs + NMR tooltip (HF-5)

- **Native `title` attribute everywhere in the toolbox.** OS-chrome
  tooltip ignores the entire HF-5 work; the peak-tooltip in NmrPanel
  got themed styling, the rail did not. Two tooltip systems.
- **Scrim ratios feel inverted.** Dark scrim `rgba(0,0,0,0.5)`, light
  scrim `rgba(0,0,0,0.25)`. Light themes typically need a *stronger*
  scrim to separate modal from a bright canvas, not weaker. Bump light
  to 0.35-0.4.
- **Token coverage is partial.** Fixed: ImportDialog, MoleculeSearch,
  NMR tooltip. Not audited: ESigModal (P1-05), planned AuditLogPanel,
  PropertyPanel headers, cheatsheet overlay. Calling it "complete
  dark/light mode for dialogs" overstates — it's complete for two.
- **Mixed token + literal-fallback pattern.** Most NmrPanel lines now
  read `var(--kd-color-text-secondary, #a0a0a0)`; border-left stays
  raw `conf.color` (intentional per commit). Fine, but invites future
  contributors to copy whichever pattern they hit first. Document.

## 3. Clean / Refine button + hotkeys (HF-3)

- **Two buttons, one mental model.** Clean (Ctrl+Shift+K, sanitize
  preserving layout) and Refine (Ctrl+Shift+L, recompute 2D coords)
  are sibling icons in the View group with no copy difference at the
  button level — only the title. ChemDraw collapses both into one
  command. Combine with a long-press variant (matches the spec's own
  flyout pattern) or label unambiguously ("Sanitize" / "Re-layout").
- **Silent failure.** `cleanStructure` "leaves the scene untouched on
  empty / network / RDKit / parse failure." No toast, no status flash.
  A user clicks Refine on a complex structure, sees nothing happen,
  and cannot tell whether layout was already optimal or whether the
  backend timed out. Bare minimum: StatusBar message.
- **No disabled state on empty canvas.** Button stays clickable with
  zero atoms; the helper no-ops. Disable button + hotkey when
  `atoms.length === 0`.
- **Wrong group.** Both sit in `view` next to fit-to-view. Fit is a
  viewport op; clean/refine are structural transformations — belong
  with edit (next to undo), so Ctrl+Z immediately rescues a Refine the
  user didn't want, and spatially that's where ChemDraw users hunt.
- **Cheatsheet gap.** Ctrl+Shift+K/L are not in the wave-2
  searchable-shortcut panel — discoverability gap.

---

## Verdict

These are not cosmetic. Three categories matter for the global panel
score:

- **Affordance gaps** (no focus-visible, no hover state, no disabled
  state on Clean/Refine, dropped tools without stubs) — accessibility +
  learnability hit. **−0.2 to −0.3.**
- **Spec / ship drift** (1-col → 2-col, "complete dark mode" that
  isn't, dead `label` field, two tooltip systems) — credibility hit
  for any reviewer who reads the spec then runs the app. **−0.1 to
  −0.2.**
- **Silent failure on Clean/Refine** is the single sharpest edge — a
  pharma reviewer will fail it on first click. **−0.1 alone.**

Net: I'd dock the global UX-flavored score by **−0.3 to −0.5** on a
10-point scale relative to a clean review. Volkov (V6 9.6) probably
still gives a 9.4-9.5 because the wins outweigh; Park (V6 8.6)
plausibly drops to 8.3-8.4 on the silent-failure + ESigModal-still-dark
combo; Yamamoto unchanged because his pedagogical features all
landed. The cumulative panel impact is **roughly −0.1 to −0.2 on the
average**, which sits inside noise but is the easiest 0.2 to recover
before V8: ship focus rings, a single tooltip system, a status-bar
message on Clean/Refine, and update the spec or the ship to match.

— Sally

Confirmation: I made no code edits — this is an audit-only report
saved to `docs/scratch/v7-audit-sally.md`.
