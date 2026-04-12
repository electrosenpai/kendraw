# Edge Case Review — Kendraw v0.1.0

**Date:** 2026-04-12
**Method:** Exhaustive path enumeration across all packages

---

## 1. Scene Model

| #   | Edge Case                                                                                                                                                                                                                                | Severity     | Tested | Fix                                                                                                                   | Pts |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | --------------------------------------------------------------------------------------------------------------------- | --- |
| 1.1 | Delete atom with N connected bonds — bonds become orphaned (fromAtomId/toAtomId point to non-existent atom). Eraser tool removes bonds first, but Delete key in select mode does NOT.                                                    | 🔴 Critique  | ❌     | In Delete key handler, iterate `page.bonds` and `remove-bond` for any bond referencing the atom before `remove-atom`. | 2   |
| 1.2 | Undo stack grows unbounded — 1000+ operations = 1000 full Document snapshots in memory. On a 500-atom molecule each snapshot is ~50KB, so 1000 ops = ~50MB. No cap.                                                                      | 🟠 Important | ❌     | Add `MAX_UNDO_DEPTH = 200`, shift oldest entry when exceeded.                                                         | 1   |
| 1.3 | Bond between atom and itself — `createBond(a.id, a.id)` is structurally valid. Bond tool guards `targetId !== bondStartAtomRef.current` but nothing prevents it via direct dispatch.                                                     | 🟡 Mineur    | ❌     | Add guard in `applyCommand` case `add-bond`: skip if `fromAtomId === toAtomId`.                                       | 1   |
| 1.4 | Duplicate bonds — clicking bond tool on same pair without hitting existing bond check can create parallel bonds. The existing-bond check uses `Object.values(page.bonds).find()` which is O(n) and races if store updates between reads. | 🟡 Mineur    | ❌     | Add uniqueness guard in `add-bond` reducer or use an adjacency set.                                                   | 1   |
| 1.5 | `activePageIndex` out of bounds — if pages array is mutated and index not updated, `pages[activePageIndex]` returns `undefined`. All page access uses optional chaining, so no crash, but silent no-op.                                  | 🟡 Mineur    | ❌     | Clamp `activePageIndex` in store getState or on page delete.                                                          | 1   |
| 1.6 | Atoms with very large coordinates (1e6+) — spatial index rbush handles this, but canvas rendering will clip. No viewport clamping.                                                                                                       | 🟡 Mineur    | ❌     | Not blocking for MVP. Document in known limitations.                                                                  | 0   |
| 1.7 | `remove-atom` on non-existent ID — destructure `{ [command.id]: _, ...rest }` silently produces same object. No error, but undo stack still records a snapshot.                                                                          | 🟡 Mineur    | ❌     | Skip dispatch if atom doesn't exist (check before push to undo stack).                                                | 1   |

---

## 2. Renderer

| #   | Edge Case                                                                                                                                                                                                                                                        | Severity     | Tested | Fix                                                                                                               | Pts |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | ----------------------------------------------------------------------------------------------------------------- | --- | -------------- | --- |
| 2.1 | Zoom/pan state not applied to renderer — `zoom` and `pan` are React state in Canvas.tsx but the CanvasRenderer has no concept of zoom/pan. It renders at 1:1 in pixel coords. Zoom changes the coordinate mapping for mouse events but NOT the visual rendering. | 🔴 Critique  | ❌     | Apply `ctx.translate(pan.x, pan.y); ctx.scale(zoom, zoom)` in `render()`, or pass viewport transform to renderer. | 3   |
| 2.2 | Arrows not rendered — `CanvasRenderer.render()` iterates `page.bonds` and `page.atoms` but **never touches `page.arrows`**. Arrow/curly-arrow tool dispatches arrows to the store but they're invisible on canvas.                                               | 🔴 Critique  | ❌     | Add arrow rendering loop in `render()` using bezier path + arrowhead.                                             | 3   |
| 2.3 | Annotations not rendered — same as arrows. `page.annotations` ignored by renderer.                                                                                                                                                                               | 🟠 Important | ❌     | Add annotation rendering (rich text at x,y).                                                                      | 2   |
| 2.4 | Valence-invalid atoms not visually highlighted — `valenceIssues` set is computed but never passed to the renderer. No visual indicator on canvas (only status bar text).                                                                                         | 🟠 Important | ❌     | Pass `valenceIssues` to renderer, draw orange ring on invalid atoms.                                              | 1   |
| 2.5 | Overlapping atom labels — two atoms at close proximity render labels on top of each other. No de-overlap or collision avoidance.                                                                                                                                 | 🟡 Mineur    | ❌     | Not blocking for MVP. Known limitation.                                                                           | 0   |
| 2.6 | `syncCanvasSize` calls `ctx.scale(dpr, dpr)` on every resize but doesn't reset previous scale — repeated resizes compound the scale transform.                                                                                                                   | 🟠 Important | ❌     | Call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` instead of `ctx.scale()`.                                           | 1   |
| 2.7 | `render()` called before `attach()` — `lastDoc` is set but canvas/ctx are null. Silent no-op but `setSelectedAtoms` and `setSelectionRect` also call `render()`, creating a chain of no-ops.                                                                     | 🟡 Mineur    | ✅     | Already guarded by `if (!canvas                                                                                   |     | !ctx) return`. |     |

---

## 3. Persistence

| #   | Edge Case                                                                                                                                                                                                                              | Severity     | Tested | Fix                                                                               | Pts |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | --------------------------------------------------------------------------------- | --- |
| 3.1 | IndexedDB quota exceeded — Dexie `put()` will throw `QuotaExceededError`. Auto-save scheduler calls `void this.saveFn(doc)` — the rejected promise is silently swallowed.                                                              | 🟠 Important | ❌     | Catch errors in `flush()`, surface via event/callback to UI (toast notification). | 2   |
| 3.2 | Corrupted/empty JSON in IndexedDB — `restoreFromDB()` calls `db.listDocuments()` which returns `StoredDocument[]`. If `data` field is malformed (missing pages, null atoms), `createSceneStore(record.data)` may produce broken state. | 🟠 Important | ❌     | Validate document schema on load, skip corrupt entries with warning.              | 2   |
| 3.3 | Dexie schema migration — `KendrawDB` declares `version(1)`. If schema changes in v0.2.0, existing IndexedDB data needs migration. No migration path defined.                                                                           | 🟡 Mineur    | ❌     | Not blocking for v0.1.0 but document the migration strategy.                      | 0   |
| 3.4 | Auto-save during rapid edits — scheduler debounces at 3s, but each `schedule()` replaces `pendingDoc`. If user makes 100 edits in 3s, only the last state is saved. This is correct behavior.                                          | ✅ Couvert   | ✅     | By design.                                                                        |     |
| 3.5 | Multiple browser tabs — two tabs sharing the same IndexedDB can overwrite each other's data. No tab-locking or conflict detection.                                                                                                     | 🟡 Mineur    | ❌     | Add tab UUID to document metadata, warn on conflict.                              | 1   |

---

## 4. Import / Export

| #   | Edge Case                                                                                                                                                                                                       | Severity     | Tested                                               | Fix                                                            | Pts            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------- | -------------- | ---------------------------------------------- | --- |
| 4.1 | MOL parser: V3000 format — `parseMolV2000` searches for `V2000` string. A V3000 file returns empty `{ atoms: [], bonds: [] }` with no error message.                                                            | 🟠 Important | ❌                                                   | Detect V3000, throw descriptive error.                         | 1              |
| 4.2 | MOL parser: malformed counts line — `parseInt` on garbage returns `NaN`, `NaN                                                                                                                                   |              | 0` produces 0. Parser returns empty result silently. | 🟡 Mineur                                                      | ❌             | Return error object or throw with line number. | 1   |
| 4.3 | MOL parser: atom lines shorter than 39 chars — `substring(36, 39)` returns empty string, `parseInt` returns NaN, charge becomes 4. Wrong charge on short lines.                                                 | 🟠 Important | ❌                                                   | Guard substring length, default charge to 0 if line too short. | 1              |
| 4.4 | KDX deserialize: invalid JSON — `JSON.parse` throws on malformed input. `deserializeKdx` doesn't catch this.                                                                                                    | 🟠 Important | ❌                                                   | Wrap in try/catch, return structured error.                    | 1              |
| 4.5 | KDX deserialize: wrong `formatVersion` — throws Error but caller may not catch.                                                                                                                                 | 🟡 Mineur    | ✅                                                   | Test exists.                                                   |                |
| 4.6 | SVG export: `<` in atom labels — labels with `<` or `&` produce invalid SVG. `escapeXml` is applied to labels in `renderAtomSVG` — actually handled.                                                            | ✅ Couvert   | ✅                                                   | `escapeXml()` escapes `<`, `>`, `&`.                           |                |
| 4.7 | PNG export via SVG→Image→Canvas: CORS / tainted canvas — if SVG contains external resources (fonts), `canvas.toBlob()` will throw SecurityError. Current SVG uses system fonts so this is unlikely but fragile. | 🟡 Mineur    | ❌                                                   | Inline all fonts or use foreignObject-free SVG.                | 1              |
| 4.8 | Export filename with special chars — `doc.metadata.title` used directly in filename. Title like `C<2>H/5\OH` produces invalid filename.                                                                         | 🟡 Mineur    | ❌                                                   | Sanitize filename: replace `[<>:"/\\                           | ?\*]`with`\_`. | 1                                              |

---

## 5. Chemistry

| #   | Edge Case                                                                                                                                                                       | Severity     | Tested | Fix                                                                 | Pts |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | ------------------------------------------------------------------- | --- |
| 5.1 | Charge with no bound — user can press `+` indefinitely. Charge +100 on a carbon is chemically nonsensical but not guarded.                                                      | 🟡 Mineur    | ❌     | Clamp charge to [-4, +4] range.                                     | 1   |
| 5.2 | MW for unknown atomic number — `ATOMIC_WEIGHTS` has 21 entries. Element Z=21 (Scandium) through Z=118 return weight 0. MW will be wrong for transition metals not in the table. | 🟠 Important | ❌     | Extend ATOMIC_WEIGHTS to all 118 elements or flag unknown elements. | 2   |
| 5.3 | Formula for empty page — returns `""`. Handled correctly.                                                                                                                       | ✅ Couvert   | ✅     |                                                                     |     |
| 5.4 | Valence for aromatic bonds — aromatic bond order is 1.5. `bondOrderSum` accumulates 1.5 per aromatic bond. For benzene carbon: 2 × 1.5 = 3.0, within valence 4. Correct.        | ✅ Couvert   | ❌     | No explicit test but logic is sound.                                |     |
| 5.5 | `computeProperties` called on page with only bonds (no atoms) — `Object.values(page.atoms)` returns `[]`, formula is `""`. Bonds still counted. No crash.                       | 🟡 Mineur    | ❌     | Edge case but harmless.                                             | 0   |

---

## 6. UI / UX

| #   | Edge Case                                                                                                                                                                                                                                                                    | Severity     | Tested | Fix                                                                                      | Pts |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | ---------------------------------------------------------------------------------------- | --- |
| 6.1 | Double-click creates 2 atoms at same position — `handleMouseUp` fires twice on double-click. Two atoms stacked on each other.                                                                                                                                                | 🟠 Important | ❌     | Debounce atom placement or check for existing atom within ATOM_RADIUS.                   | 1   |
| 6.2 | Keyboard shortcuts fire while typing in a modal — `?` opens cheatsheet, then pressing `a` switches to atom tool while the modal is visible. Shortcuts are registered on `window` with no check for active modals.                                                            | 🟠 Important | ❌     | Check `document.activeElement` or add a `modalOpen` flag that suppresses tool shortcuts. | 1   |
| 6.3 | Sub-palette (element picker) positioned `left: 56px, top: 0` absolute — on small screens or when tool palette is near bottom, sub-palette clips off-screen.                                                                                                                  | 🟡 Mineur    | ❌     | Calculate available space, flip position if needed.                                      | 1   |
| 6.4 | 50+ tabs — `workspaceStore` creates a new `SceneStore` + `AutoSaveScheduler` per tab. 50 tabs = 50 active schedulers + 50 undo stacks. Memory pressure.                                                                                                                      | 🟡 Mineur    | ❌     | Lazy-load stores for inactive tabs, or cap tab count.                                    | 2   |
| 6.5 | Bond tool state persistence — `bondStartAtomRef` is not cleared when switching tools. User clicks atom with bond tool, switches to select tool, switches back to bond tool — the ref still holds the first atom.                                                             | 🟠 Important | ❌     | Clear `bondStartAtomRef.current = null` in `updateToolState` when tool changes.          | 1   |
| 6.6 | Ctrl+R conflicts — `r`/`R` key maps to ring tool AND Ctrl+R maps to rotate selection. The ring tool shortcut fires only without modifier, so no conflict. But on Firefox, Ctrl+R is browser reload — `e.preventDefault()` in the handler should block it. Verified: it does. | ✅ Couvert   | ❌     | No issue.                                                                                |     |
| 6.7 | Backspace key deletes atoms even when typing in an input field — no input fields exist currently, but if one is added (e.g., atom label editor), Delete/Backspace handler on `window` will intercept.                                                                        | 🟡 Mineur    | ❌     | Guard with `e.target instanceof HTMLInputElement` check.                                 | 1   |
| 6.8 | `selection` state closed over in keyboard handler — `useEffect` depends on `[selection, store, updateToolState]`. Every selection change re-registers the handler. With 100 atoms selected one-by-one, that's 100 re-registrations. Performance OK but unnecessary.          | 🟡 Mineur    | ❌     | Use `useRef` for selection in the keyboard handler to avoid re-registration.             | 1   |

---

## 7. Reactions / Curly Arrows

| #   | Edge Case                                                                                                                                                                         | Severity     | Tested | Fix                                                                             | Pts |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | ------------------------------------------------------------------------------- | --- |
| 7.1 | Arrow tool: click-click instead of click-drag — first click sets `dragStartRef`, second click creates a zero-length arrow (start === end). Bezier is a point.                     | 🟠 Important | ❌     | Check distance between start and end, skip if < 5px.                            | 1   |
| 7.2 | Curly arrow with start === end — `defaultCurlyGeometry` computes `len = 0`, then `nx = 0, ny = 1` (fallback). Creates a degenerate curve.                                         | 🟡 Mineur    | ❌     | Guard: skip if distance < 5px.                                                  | 1   |
| 7.3 | Arrows stored but not rendered — arrows dispatch to store correctly but **CanvasRenderer doesn't draw them** (see 2.2). User creates arrows that exist in data but are invisible. | 🔴 Critique  | ❌     | See 2.2.                                                                        |     |
| 7.4 | Arrow deletion — no way to select or delete arrows from UI. Arrow type not in `SpatialIndex` (which only indexes atoms). Arrows persist forever unless undo is used.              | 🔴 Critique  | ❌     | Add arrow hit-testing and selection, or at minimum an "undo" path is available. | 3   |

---

## Summary

| Severity            | Count  |
| ------------------- | ------ |
| 🔴 Critique         | 5      |
| 🟠 Important        | 13     |
| 🟡 Mineur           | 16     |
| ✅ Handled          | 5      |
| **Total unhandled** | **34** |

### Critiques (must-fix before v0.1.0 tag)

1. **1.1** — Delete key leaves orphaned bonds
2. **2.1** — Zoom/pan not applied to renderer (visual)
3. **2.2** — Arrows not rendered at all
4. **7.3** — Same as 2.2
5. **7.4** — Arrows cannot be deleted from UI

### Go/No-Go Recommendation

**Conditional GO** — Tag v0.1.0 after fixing the 5 critiques (estimated 12 points / ~24h dev). The 13 important issues are acceptable for a v0.1.0 MVP release with known-limitations documentation. The 16 minor issues should be logged as GitHub issues for v0.1.1 patch.

The critiques are all related to two themes:

1. **Orphaned bonds on delete** — straightforward fix in the keyboard handler
2. **Arrow rendering gap** — arrows are stored in the model but the Canvas renderer doesn't draw them and they can't be selected/deleted

Fixing these 5 would make v0.1.0 a defensible MVP release.
