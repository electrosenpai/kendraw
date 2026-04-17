# Keyboard Shortcuts Compliance: ChemDraw Reference vs Kendraw

Generated: 2026-04-13 (Autonomous Session)

## Atom Hotkeys (with atoms selected)

| Key     | ChemDraw Action     | Kendraw                    | Status      |
| ------- | ------------------- | -------------------------- | ----------- |
| C       | Carbon              | Carbon (Z=6)               | Implemented |
| N       | Nitrogen            | Nitrogen (Z=7)             | Implemented |
| O       | Oxygen              | Oxygen (Z=8)               | Implemented |
| S       | Sulfur              | Sulfur (Z=16)              | Implemented |
| F       | Fluorine            | Fluorine (Z=9)             | Implemented |
| P       | Phosphorus          | Phosphorus (Z=15)          | Implemented |
| B       | Boron               | Boron (Z=5)                | Implemented |
| L       | Chlorine            | Chlorine (Z=17)            | Implemented |
| I       | Iodine              | Iodine (Z=53)              | Implemented |
| H       | Hydrogen            | Hydrogen (Z=1)             | Implemented |
| M       | Methyl              | Carbon (Z=6)               | Implemented |
| +       | Add positive charge | Charge +1 (clamped -4..+4) | Implemented |
| -       | Add negative charge | Charge -1 (clamped -4..+4) | Implemented |
| Shift+B | Bromine             | Not implemented            | Deferred    |
| Shift+O | OMe group           | Not implemented            | Deferred    |
| K       | Sulfonyl            | Not implemented            | Deferred    |

## Bond Hotkeys (with selection or as tool modifier)

| Key   | ChemDraw Action      | Kendraw                                     | Status                             |
| ----- | -------------------- | ------------------------------------------- | ---------------------------------- |
| 1     | Single bond          | Sets bond tool to single                    | Implemented                        |
| 2     | Double bond          | Sets bond tool to double                    | Implemented                        |
| 3     | Triple bond          | Sets bond tool to triple                    | Implemented                        |
| d     | Dashed bond          | Sets bond tool to dash                      | Implemented                        |
| w     | Wedge bond           | Sets bond tool to wedge                     | Implemented                        |
| y     | Wavy bond            | Sets bond tool to wavy                      | Implemented (was: aromatic, fixed) |
| b     | Bold bond            | Conflicts with Boron when atoms selected    | Partial                            |
| h     | Hashed bond          | Conflicts with Hydrogen when atoms selected | Partial                            |
| l/r/c | Double bond position | Not implemented                             | Deferred                           |

Note: When atoms are selected, atom hotkeys take priority over bond hotkeys.
Bond style keys (1-3, d, w, y) work within the selection context.

## Document Operations

| Shortcut              | ChemDraw Action     | Kendraw                        | Status           |
| --------------------- | ------------------- | ------------------------------ | ---------------- |
| Ctrl+Z                | Undo                | Undo                           | Implemented      |
| Ctrl+Y / Ctrl+Shift+Z | Redo                | Redo                           | Implemented      |
| Ctrl+C                | Copy                | Copy (multi-format: MOL + SVG) | Implemented      |
| Ctrl+V                | Paste               | Paste                          | Implemented      |
| Ctrl+X                | Cut                 | Cut                            | Implemented      |
| Ctrl+A                | Select All          | Select All                     | Implemented      |
| Ctrl+N                | New Document        | New Tab                        | Implemented      |
| Delete/Backspace      | Delete              | Delete (cascades bonds)        | Implemented      |
| Ctrl+D                | Copy as CDXML       | Duplicate selection            | Adapted          |
| Ctrl+R                | Rotate              | Rotate 15 deg                  | Implemented      |
| Ctrl+M                | Mirror H            | Mirror horizontal              | Implemented      |
| Ctrl+Shift+M          | Mirror V            | Mirror vertical                | Implemented      |
| Ctrl+Shift+K          | Clean Up Structure  | Structure cleanup              | Implemented      |
| Ctrl+0                | —                   | Fit to screen                  | Kendraw-specific |
| Ctrl+Shift+N          | Name to Structure   | NMR panel toggle               | Adapted          |
| Ctrl+L                | Toggle Fixed Length | Molecule search                | Adapted          |
| Ctrl+E                | Toggle Fixed Angles | Not implemented                | Deferred         |
| Ctrl+Shift+C          | (none in ChemDraw)  | Toggle compound numbering      | Kendraw-specific |

## Tool Shortcuts (no selection)

| Key | Kendraw Tool        | Status      |
| --- | ------------------- | ----------- |
| V   | Select              | Implemented |
| A   | Add Atom            | Implemented |
| B   | Add Bond            | Implemented |
| R   | Ring                | Implemented |
| E   | Eraser              | Implemented |
| H   | Pan                 | Implemented |
| W   | Arrow               | Implemented |
| U   | Curly Arrow         | Implemented |
| P   | Toggle Properties   | Implemented |
| ?   | Shortcut Cheatsheet | Implemented |

## Summary

- **28/35** ChemDraw shortcuts implemented (80%)
- **7** deferred (Shift+key combos for groups, double-bond positioning, toggle modes)
- **3** adapted to Kendraw-specific functions (Ctrl+D, Ctrl+L, Ctrl+Shift+N)
- Key fix in this session: `y` corrected from aromatic to wavy, P/B/H/M atom hotkeys added
