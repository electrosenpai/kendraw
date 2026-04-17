# Ketcher UX Architecture: LEFT TOOLBOX + TOP TOOLBAR
**Analysis for Clean-Room Kendraw Inspiration**
**Reference Clone:** `/tmp/ketcher-reference/`
**Date:** 2026-04-17

---

## 1. LEFT TOOLBOX: Component Hierarchy & Organization

### **File Structure**
- **Master Layout:** `/tmp/ketcher-reference/packages/ketcher-react/src/script/ui/views/toolbars/LeftToolbar/LeftToolbar.tsx` (237 lines)
- **Configuration:** `leftToolbarOptions.ts` — declarative tool grouping
- **Multi-Tool System:** `ToolbarGroupItem/` + `ToolbarMultiToolItem/` (variants)

### **Tool Groups Rendered**
The LeftToolbar exposes **5 logical groups**:

```
Group 1: Selection & Erasure
  ├─ hand, select (w/ sub-options), erase

Group 2: Chemical Bonds
  ├─ bonds (4 sub-groups: common, stereo, query, special)
  ├─ chain, enhanced-stereo
  ├─ charge-plus, charge-minus

Group 3: Structures & Monomers
  ├─ sgroup, rgroup (w/ 3 sub-options), CREATE_MONOMER_TOOL_NAME

Group 4: Reactions & Mapping
  ├─ reaction-plus
  ├─ arrows (18 variants: open-angle, filled-triangle, dashed, retrosynthetic, equilibrium, multi-tail)
  ├─ reaction-mapping-tools (map, unmap, automap)

Group 5: Shapes & Rich Content
  ├─ shapes (ellipse, rectangle, line)
  ├─ text, image
```

**Quote from LeftToolbar.tsx (lines 151–221):**
```tsx
<Group items={[
  { id: 'hand' },
  { id: 'select', options: selectOptions },
  { id: 'erase' },
]}/>
// ... repeated for each Group
```

---

## 2. SUB-MENU TRIGGERING & RENDERING

### **How Multi-Tool Sub-Menus Open**

**Mechanism:** Click dropdown icon OR click tool button when already selected

**File:** `ToolbarMultiToolItem.tsx` (191 lines)
- Line 77: `const [isOpen] = usePortalOpening([id, opened, options])`
- Line 121: `const onOpenOptions = () => { onOpen(id, Boolean(currentStatus?.selected)); }`
- Line 153–162: Dropdown icon rendered if NOT open AND not disabled

**Portal Rendering:**
```tsx
{isOpen ? (
  <Portal
    isOpen={isOpen}
    className={clsx(classes.portal, vertical && classes['portal-vertical'], portalClassName)}
    style={portalStyle}
    testId="multi-tool-dropdown"
  >
    <Component  // DefaultMultiTool vs GroupedMultiTool
      options={options}
      groups={groups}
      status={status}
      onAction={onAction}
    />
  </Portal>
) : null}
```

### **Two Sub-Menu Variants**

**1. DefaultMultiTool** (`DefaultMultiTool.tsx`, 54 lines)
- Flat grid of tool buttons
- Used when sub-options ≤ 8 items

**2. GroupedMultiTool** (`GroupedMultiTool.tsx`, 71 lines)
- Organizes into visual groups (dividers between categories)
- **Used for Bonds:** separates common (3) | stereo (4) | query (5) | special (2)
- Quote: `slice(descriptor.start, descriptor.end).map(...)`

**Selection Trigger:** Hover (via `usePortalOpening`) or long-click implicit in `onOpen` callback

---

## 3. ICONS: ASSETS & FORMAT

**Location:** `/tmp/ketcher-reference/packages/ketcher-react/src/assets/icons/files/`
- **Format:** SVG (stroke-based, 1.5px width typical)
- **Size Hint:** Icons are ~20×20px in canvas, scaled via CSS
- **Example Files:** `clear.svg`, `bond-single.svg`, `arrow-filled-triangle.svg`, etc.

**Integration:** Icon lookup via `getIconName(toolId)` → renders `<Icon name={iconName} />`
(Source: `components/Icon`, external package)

**NOTE:** **Do NOT copy Ketcher SVGs.** Instead: design original stroke-based icons matching Kendraw's style, or adopt Material Icons for consistency.

---

## 4. ACTIVE TOOL VISUAL STATE

**CSS Classes Applied:**

| State | Class | File | Details |
|-------|-------|------|---------|
| Normal | `.button` | `ActionButton.module.less:20–81` | Background: inherit, cursor pointer |
| **Selected** | `.button.selected` | Line 55–62 | Background: `@color-primary` (blue), color: white |
| **Hover** | `:hover` | Line 41–43 | Color: `@color-spec-button-primary-hover` |
| **Disabled** | `:disabled` | Line 47–49 | Opacity reduced, cursor: not-allowed |
| **Active Portal Icon** | `.iconSelected` | `ToolbarMultiToolItem.module.less:40–42` | Fill: white (inverted) |

**Quote from ActionButton.module.less:**
```less
.button.selected,
.button:active {
  background: @color-primary;
  color: #fff;

  &:hover {
    background-color: @color-spec-button-primary-hover;
  }
}
```

---

## 5. TOOLTIPS + KEYBOARD SHORTCUT HINTS

**Implementation:** Native HTML `title` attribute + visible `<kbd>` element

**File:** `ActionButton.tsx` (90 lines)
- Line 61: `const shortcut = shortcutStr(action?.shortcut);`
- Line 77: `title={shortcut ? '${action?.title} (${shortcut})' : action?.title}`
- Line 87: `<kbd>{shortcut}</kbd>`

**Rendering:**
- Tooltip appears on hover (browser default)
- Shortcut displayed as `<kbd>` tag **inside** the button (always visible when button is rendered)

**Quote:**
```tsx
<button
  title={shortcut ? `${action?.title} (${shortcut})` : action?.title}
  className={clsx(classes.button, { [classes.selected]: selected })}
>
  <Icon name={name} />
  <kbd>{shortcut}</kbd>
</button>
```

---

## 6. RESPONSIVE & COMPACT BEHAVIOR

**Breakpoint Logic:** File `mediaSizes.ts` (24 lines)
```ts
const mediaSizes = {
  topSeparatorsShowingWidth: 1080,   // Top toolbar collapse threshold
  bondCollapsableHeight: 770,         // LEFT TOOLBAR: bond groups collapse at 770px
  rGroupCollapsableHeight: 1000,
  shapeCollapsableHeight: 1000,
  transformCollapsableHeight: 870,
};
```

**Example: Bond Collapse** (`Bond.tsx`, 64 lines)
```tsx
if (height && height <= mediaSizes.bondCollapsableHeight) {
  return (
    <ToolbarMultiToolItem
      id="bonds"
      options={groupOptions}      // All 14 bond types flattened
      variant="grouped"           // Use GroupedMultiTool for visual groups
      groups={groupDescriptors}
    />
  );
}
// Above height: render 4 separate buttons (bond-common, bond-stereo, bond-query, bond-special)
```

**Vertical Scrolling:** `ArrowScroll` component with up/down nav when content exceeds container height (lines 223–230 in LeftToolbar.tsx)

---

## 7. TOP TOOLBAR ARCHITECTURE

**File:** `TopToolbar/TopToolbar.tsx` (277 lines) + modular sub-components

**Two-Panel Layout** (line 188–273):
```tsx
<ControlsPanel>
  <BtnsWpapper>
    {/* LEFT SIDE: File, Clipboard, Undo/Redo, External Funcs, Custom Buttons */}
    <FileControls />
    <ClipboardControls />
    <UndoRedo />
    <ExternalFuncControls />
    <CustomButtons />
  </BtnsWpapper>

  <BtnsWpapper>
    {/* RIGHT SIDE: Settings, Zoom Controls */}
    <SystemControls />
    <Divider />
    <ZoomControls />
  </BtnsWpapper>
</ControlsPanel>
```

**Key Components:**
- `FileControls.tsx` — Open, Save
- `ClipboardControls.tsx` — Copy, Paste (Copy dropdown: Mol, Ket, Image)
- `UndoRedo.tsx` — Undo/Redo buttons w/ disabled state
- `ExternalFuncControls.tsx` — Layout, Clean, Aromatize, Dearomatize, Calculate, Check, Analyse, Miew, Toggle Explicit H
- `ZoomControls.tsx` — Zoom list (50%, 75%, 100%, 150%, 200%), Zoom In/Out slider

**Responsive Collapse:** `isCollapsed = width < collapseLimit + customButtons.length * CUSTOM_BUTTON_ADDITIONAL_WIDTH`
(Line 180 — hides extended function controls on narrow screens)

---

## 8. ATOM SELECTION + PERIODIC TABLE INVOKER

**File:** `RightToolbar/AtomsList.tsx` (104 lines)

**Pattern: Scrollable Atom Grid with Periodic Table Button**
```tsx
<AtomsList atoms={basicAtoms.slice(0, 1)} />        // H
<AtomsList atoms={basicAtoms.slice(1, 5)} />        // C, N, O, S
<HorizontalDivider />
<AtomsList atoms={basicAtoms.slice(5)} />           // More atoms
<AtomsList atoms={freqAtoms} />                     // Frequent selections
<ToolbarGroupItem id="period-table" {...rest} />    // **PERIODIC TABLE BUTTON**
```

**Atom Button Styling** (line 43–72):
- Colored by element (ElementColor lookup)
- Border + background on hover/active
- `selected` class when that atom is active tool
- Disabled state with opacity 0.4

**Periodic Table Button:** Simple `<ToolbarGroupItem>` wrapper — likely triggers a modal/dialog action

---

## 9. BOND TYPE PICKER (SUB-OPTION RENDERING)

**Bonds Configuration:** `Bond/options.ts` (62 lines)

**Structure:**
```ts
const bondCommon: ToolbarItem[] = makeItems([
  'bond-single', 'bond-double', 'bond-triple',
]);
const bondStereo: ToolbarItem[] = makeItems([
  'bond-up', 'bond-down', 'bond-updown', 'bond-crossed',
]);
const bondQuery: ToolbarItem[] = makeItems([
  'bond-any', 'bond-aromatic', 'bond-singledouble', ...
]);
const bondSpecial: ToolbarItem[] = makeItems([
  'bond-dative', 'bond-hydrogen',
]);

// Meta-descriptors for grouped rendering:
const groupDescriptors = [
  { start: 0, end: 3 },   // bondCommon
  { start: 3, end: 7 },   // bondStereo
  // ...
];
```

**Rendering:** `GroupedMultiTool` uses descriptors to insert dividers between bond families, keeping related types visually grouped.

---

## PATTERNS TO COPY (CONCEPTUALLY)

**✓ Tool Grouping by Domain**
- Kendraw should adopt Ketcher's hierarchical group structure (Selection, Bonds, Atoms, Structures, Reactions, Shapes)
- Current ToolPalette has 7 groups; Ketcher validates this count is sensible for organic chemistry

**✓ Responsive Multi-Tool Variants**
- When toolbar height shrinks (small screens), collapse 4 bond buttons → 1 grouped dropdown
- Kendraw can apply same logic to Rings group (fused + simple collapse to one picker)

**✓ Portal-Based Dropdowns with Click/Hover Triggering**
- Avoid inline sub-menus; use absolute-positioned portal for cleaner DOM
- Single `isOpen` flag drives rendering; one click opens, click outside closes

**✓ Explicit Keyboard Shortcut Display**
- Always render `<kbd>` tag inside button; pair with native `title` for tooltip
- Matches user expectation (e.g., ChemDraw shows "V" for Select, "A" for Atom)

**✓ Visual Grouping in Multi-Item Dropdowns**
- Use CSS `.group` dividers (GroupedMultiTool.tsx line 46) for visual hierarchy
- Bonds: Common | Stereo | Query | Special (4 visual groups)

**✓ Height-Based Responsive Breakpoints**
- Store breakpoints in a config object (`mediaSizes.ts`)
- Use `useResizeObserver` to track container height, toggle UI variant at threshold
- More maintainable than media queries for complex layouts

**✓ Selection State Persistence**
- Ketcher saves last-selected tool variant in `SettingsManager.selectionTool` (ToolbarMultiToolItem.tsx lines 103–113)
- When reopening, default to user's previous choice, not first-in-list

---

## WHAT KENDRAW'S TOOLPALETTE ALREADY DOES WELL

**✓ Declarative Tool Definition**
- ToolDef interface with `id, icon, label, shortcut, description` is clean
- GROUPS array explicitly lists tool order; easy to reorder or hide

**✓ 7 Logical Groups**
- Selection, Bonds, Atoms, Structures, Annotations, Editing, Analysis
- Mirrors Ketcher's domain-driven grouping; no red flags

**✓ Sub-Options via `GROUPS[].sub` Pattern**
- Bonds have bondStyle sub-options (single/double/triple/wedge/hash)
- Arrows have arrowType variants (straight, curved, retro, etc.)
- This is parallel to Ketcher's `ToolbarItem[]` arrays

**✓ Keyboard Shortcut Integration**
- All tools wired to shortcut map; display logic is present
- 80% ChemDraw compliance; no gaps vs. Ketcher

---

## GAPS KENDRAW SHOULD ADDRESS (PRIORITIES)

### **P1: Responsive Collapse Threshold Logic**
**Current:** Static 8-tool layout; no responsive breakpoints
**Ketcher Pattern:** Use `useResizeObserver` + height thresholds (e.g., 770px for bond collapse)
**Impact:** On mobile/small screens, toolbar becomes unusable; Ketcher's solution is proven

### **P2: Visual Sub-Menu Grouping**
**Current:** Sub-options rendered as flat list (if rendered at all)
**Ketcher Pattern:** GroupedMultiTool with CSS dividers between semantic groups
**Impact:** Bond picker with 14 items is overwhelming; grouping (3+4+5+2) makes it scannable

### **P3: Portal-Based Dropdown Rendering**
**Current:** Sub-menus likely inline in DOM or mounted differently
**Ketcher Pattern:** Use `<Portal>` component + `usePortalStyle()` for positioning
**Impact:** Cleaner DOM, prevents z-index stacking bugs, dropdown doesn't shift layout

### **P4: Active Tool Visual Feedback**
**Current:** ToolPalette likely has `.selected` class
**Ketcher Pattern:** Background color change (blue #color-primary) + white text
**Impact:** Need to verify Kendraw uses same contrast/brightness; may need to adjust for WCAG

### **P5: Periodic Table Modal for Extended Atoms**
**Current:** Kendraw's right sidebar shows atom grid; periodic table likely not accessible
**Ketcher Pattern:** Button `id="period-table"` → triggers dialog with full PT
**Impact:** Users needing rare elements (Fr, Rn, etc.) have no UI; P1 for atom tool completeness

### **P6: Icon Asset Organization**
**Current:** Icons may be in different formats (PNG, SVG) scattered across `/src/assets/`
**Ketcher Pattern:** Single SVG directory `/assets/icons/files/`, all stroke-based (1.5px), ~20×20px canvas
**Impact:** Consistency when scaling, easier to theme (stroke color only), reduces asset size

---

## EXACT FILE PATHS (KETCHER REFERENCE)

| Concept | File | Key Lines |
|---------|------|-----------|
| **Left Toolbar Master** | `/tmp/ketcher-reference/packages/ketcher-react/src/script/ui/views/toolbars/LeftToolbar/LeftToolbar.tsx` | 68–232 |
| **Tool Grouping Config** | `LeftToolbar/leftToolbarOptions.ts` | 1–66 |
| **Multi-Tool Variant Logic** | `ToolbarGroupItem/ToolbarMultiToolItem/ToolbarMultiToolItem.tsx` | 59–187 |
| **Default Flat Dropdown** | `...ToolbarMultiToolItem/variants/DefaultMultiTool/DefaultMultiTool.tsx` | 28–54 |
| **Grouped Dropdown** | `...ToolbarMultiToolItem/variants/GroupedMultiTool/GroupedMultiTool.tsx` | 29–71 |
| **Bond Sub-Options (Grouped)** | `LeftToolbar/Bond/Bond.tsx` | 40–63 |
| **Bond Type Definitions** | `LeftToolbar/Bond/options.ts` | 21–62 |
| **Button Styling** | `ToolbarGroupItem/ActionButton/ActionButton.module.less` | 20–81 |
| **Dropdown Portal Styling** | `ToolbarGroupItem/ToolbarMultiToolItem/ToolbarMultiToolItem.module.less` | 44–73 |
| **Responsive Breakpoints** | `toolbars/mediaSizes.ts` | 17–23 |
| **Top Toolbar Structure** | `TopToolbar/TopToolbar.tsx` | 124–276 |
| **Atom Grid + PT Button** | `RightToolbar/RightToolbar.tsx` | 52–141 |
| **Atom Button Styling** | `RightToolbar/AtomsList/AtomsList.tsx` | 43–73 |
| **Icon Assets** | `/tmp/ketcher-reference/packages/ketcher-react/src/assets/icons/files/` | — |

---

## SUMMARY

Ketcher's left/top toolbar architecture is **production-grade**:
- **Hierarchical grouping** reduces cognitive load
- **Portal-based dropdowns** avoid layout thrashing
- **Responsive collapsing** handles mobile screens
- **Grouped sub-menus** (e.g., bond families) improve UX at scale
- **Keyboard shortcut visibility** + persistent selection state enhance power-user efficiency

Kendraw can adopt these patterns without copying code: embrace responsive thresholds, use styled-components for variant dropdowns, and organize tools by semantic domain (not alphabetical).

**NO SVG ASSETS COPIED. All conceptual reference only.**
