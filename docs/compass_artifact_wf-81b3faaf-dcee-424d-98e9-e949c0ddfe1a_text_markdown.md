# ChemDraw Technical Reference: Implementation Specification for an Open-Source Molecular Editor

## Document purpose and scope

This document reverse-engineers the rendering rules, geometric conventions, file-format internals, algorithmic logic, and interaction model of PerkinElmer/Revvity **ChemDraw** (versions 17–23). Every numeric default, algorithmic phase, and UX behavior described here is sourced from the CDX/CDXML format specification, the official ChemDraw User Guide, the IUPAC 2008 Recommendations, ACS publication guidelines, relevant U.S. patents, and open-source reference implementations (RDKit, CoordGen, Open Babel, pycdxml). The specification is organized along five axes and is intended to be directly consumable in a BMAD / Claude Code workflow for building an equivalent open-source editor.

---

## Master default-value table

All spatial values are in **PostScript points** (1 pt = 1/72 in = 0.3528 mm). Three canonical style sheets ship with ChemDraw; the **ACS Document 1996** preset is the de facto standard for publication work.

| Parameter                  | CDXML Attribute | New Document         | ACS 1996               | Slide/Poster |
| -------------------------- | --------------- | -------------------- | ---------------------- | ------------ |
| Bond length                | `BondLength`    | **30 pt** (1.058 cm) | **14.4 pt** (0.508 cm) | 30 pt        |
| Line width (bond stroke)   | `LineWidth`     | 1 pt                 | **0.6 pt**             | 1.6 pt       |
| Bold width                 | `BoldWidth`     | 2 pt                 | **2.0 pt**             | 4.0 pt       |
| Margin width (label gap)   | `MarginWidth`   | 2 pt                 | **1.6 pt**             | 2.0 pt       |
| Hash spacing               | `HashSpacing`   | 2.7 pt               | **2.5 pt**             | 2.7 pt       |
| Bond spacing (% of length) | `BondSpacing`   | 12%                  | **18%**                | 15%          |
| Chain angle                | `ChainAngle`    | 120°                 | **120°**               | 120°         |
| Atom label font            | `LabelFont`     | Arial                | Arial/Helvetica        | Arial        |
| Atom label size            | `LabelSize`     | 10 pt                | **10 pt**              | 12 pt        |
| Caption size               | `CaptionSize`   | 12 pt                | 10 pt                  | 16 pt        |
| Label face bitmask         | `LabelFace`     | 96 (Formula)         | 96 (Formula)           | 96 (Formula) |
| Wedge wide end             | (computed)      | 3 pt                 | **3 pt**               | 6 pt         |

**Derived quantities** (ACS 1996 values):

- Double-bond offset = 18% × 14.4 = **2.592 pt**
- Wedge wide end = 1.5 × BoldWidth = **3.0 pt**
- Hash count per bond ≈ BondLength / HashSpacing = 14.4 / 2.5 ≈ **5–6 lines**
- HDot indicator diameter = 5 × LineWidth = **3.0 pt**

---

# 1 — Atom rendering and label placement

## 1.1 When to show versus hide an atom label

ChemDraw follows the skeletal-formula convention codified in IUPAC 2008 (Brecher, _Pure Appl. Chem._ **80**, 277–410, 2008). The core rule is: **carbon atoms bonded to two or more other heavy atoms are implicit**—drawn as a vertex with no label. All other atoms require a visible label.

Detailed decision logic:

```
function shouldShowLabel(atom):
  if atom.element ≠ Carbon:        return true   # all heteroatoms labeled
  if atom.charge ≠ 0:              return true   # charged carbon: show "C⁺"
  if atom.isotope is set:          return true   # isotope must be explicit: "¹³C"
  if atom.radical ≠ None:          return true   # radical carbon: show "C·"
  if countVisibleBonds(atom) ≤ 1:  return true   # terminal CH₃, CH₂R
  if LabelDisplay == ForceShow:    return true   # manual override
  return false                                    # implicit vertex
```

In CDXML, a `<n>` (node) element without an `Element` attribute defaults to **carbon (Z = 6)**. A node without a nested `<t>` (text) object renders as an invisible vertex.

## 1.2 Implicit hydrogen management

ChemDraw auto-calculates the number of implicit hydrogens using a standard-valence table. The formula is:

```
implicitH = normalValence − Σ(bondOrders) − |formalCharge|
```

For elements with multiple standard valences (N: 3, 5; S: 2, 4, 6; P: 3, 5), ChemDraw picks the **lowest valence ≥ current bond-order sum**. When the CDXML attribute `NumHydrogens` is explicitly set it overrides the calculation. When the attribute is absent the documentation states: "the number of hydrogens is assumed to be the minimum value necessary to satisfy the valence requirements for the atom."

Hydrogen atoms on **heteroatoms** (N, O, S, …) are always shown in the atom label (e.g., "NH₂", "OH"). Hydrogen atoms on carbon are normally hidden (implicit) unless the carbon itself must be labeled (terminal carbon, charged, isotope-labeled).

## 1.3 Hydrogen placement: left vs. right of atom symbol

ChemDraw uses **automatic label justification** governed by the CDXML `LabelJustification` property (values: Auto, Left, Center, Right, Above, Below; default = Auto).

Algorithm for Auto mode:

```
function determineLabelJustification(atom):
  vectors = [direction from atom to each bonded neighbor]
  avgX = average of all vector X-components

  if avgX > threshold:      # bonds predominantly go right
    return Right             # text right-aligned: "H₂N←bond"
  elif avgX < −threshold:   # bonds predominantly go left
    return Left              # text left-aligned:  "bond→NH₂"
  else:
    return Center            # bonds balanced: center on element symbol
```

When justification is **Right**, the label is _reversed_: "OH" becomes "HO", "NH₂" becomes "H₂N", and multi-fragment nicknames like "OTBS" become "TBSO". ChemDraw tokenizes labels at uppercase-letter boundaries to determine reversal units.

The `LabelAlignment` property (INT8) stores the "frozen" alignment for multi-attached atom labels. When a node gains or loses bonds, `LabelAlignment` preserves the original visual arrangement so that structural modifications (rotate, flip) do not cause unexpected flips.

**IUPAC 2008 rules on label positioning**: bonds must point directly at the element symbol, not at hydrogen or charge decorations. For single-character labels the bond aims at the character center; for multi-character labels it aims at the center of the first letter of the element symbol.

## 1.4 Typographic conventions

**Font**: The default atom-label font is **Arial** (or Helvetica on Mac). ACS 1996 historically specifies Arial/Helvetica for atom labels. Nature Chemistry uses **Arial 6–8 pt**.

**Formula mode** (face bitmask = 96): ChemDraw's default label face sets both the Subscript (bit 5, value 32) and Superscript (bit 6, value 64) bits simultaneously. In this "Formula" mode, **digits within the text run are automatically rendered as subscripts** while letters stay at normal baseline. This is the key mechanism by which typing "NH3" automatically renders as "NH₃".

Complete face bitmask table:

| Bit | Value | Meaning                  |
| --- | ----- | ------------------------ |
| 0   | 1     | Bold                     |
| 1   | 2     | Italic                   |
| 2   | 4     | Underline                |
| 3   | 8     | Outline                  |
| 4   | 16    | Shadow                   |
| 5   | 32    | Subscript                |
| 6   | 64    | Superscript              |
| 5+6 | 96    | Formula (auto-sub/super) |

**Superscript and subscript sizing**: both reduce text size by approximately **25%** (scale factor ≈ 0.75) and shift the baseline up (super) or down (sub) by roughly 33% of the font's cap height.

**Text alignment**: the `p` attribute on a `<t>` element defines the baseline origin point. For Left-justified labels, text extends rightward from this point. For Right-justified labels, text extends leftward. The point coincides with the center of the element symbol in the atom's `<n>` position.

## 1.5 Charges, isotopes, and radicals

**Charges** are stored in CDXML as `Charge` (INT8) on the node. They render as **right superscripts** after the full label including hydrogen count: "NH₃⁺", "O⁻", "Fe²⁺". Per IUPAC 2008 (GR-5), for charges of magnitude > 1 the number precedes the sign: "2+" not "+2". In CDXML text runs, charges use `face="64"` (superscript).

**Isotopes** are stored as `Isotope` (INT16, absolute mass number). They render as **left superscripts** directly preceding the element symbol: "¹⁴C", "²H". An otherwise-implicit carbon must become explicit to show an isotope label.

**Radicals** are stored as `Radical` (UINT8): 0 = None, 1 = Singlet (pair of dots), 2 = Doublet (single dot "·"), 3 = Triplet (two dots). Radical dots render as small filled circles adjacent to the atom label, typically above-right, scaled proportionally to the label font size.

**Example CDXML for NH₂:**

```xml
<n id="5" p="56.52 69.75" Element="7" NumHydrogens="2">
  <t p="52.91 73.65" LabelJustification="Left">
    <s font="3" size="10" face="96">NH2</s>
  </t>
</n>
```

---

# 2 — Bond geometry

## 2.1 Bond length and standard angles

The **ACS 1996 bond length is 14.4 pt** (0.508 cm, 0.2 in). The ChemDraw new-document default is 30 pt (1.058 cm). A commonly cited figure of "0.5083 inches" is incorrect—30 pt = 0.4167 in; the 1.058 cm figure is accurate.

Standard angles by hybridization context:

| Context             | Angle      | Notes                                       |
| ------------------- | ---------- | ------------------------------------------- |
| sp² chain (default) | **120°**   | Zigzag chains; `ChainAngle` attribute       |
| sp³ tetrahedral     | **109.5°** | Clean Up normalizes to this for saturated C |
| sp linear           | **180°**   | Triple bonds, allenes                       |
| 3-membered ring     | 60°        | Cyclopropane                                |
| 4-membered ring     | 90°        | Cyclobutane                                 |
| 5-membered ring     | 108°       | Cyclopentane                                |
| 6-membered ring     | 120°       | Cyclohexane / benzene                       |
| 7-membered ring     | 128.57°    | Cycloheptane                                |
| 8-membered ring     | 135°       | Cyclooctane                                 |

Ring angles are fixed by geometry (interior angle of regular polygon = 180 × (n − 2) / n). Substituent bonds on rings bisect the exocyclic angle per IUPAC 2008 GR-4.2.

## 2.2 Single, double, and triple bond rendering

**Single bonds** are drawn as straight line segments at `LineWidth` thickness (0.6 pt ACS).

**Double bonds** consist of two parallel lines separated by `BondSpacing` percent of `BondLength`. At ACS 1996 settings this yields **2.592 pt** offset. The CDXML `DoublePosition` attribute controls which side receives the second line:

- **Right**: second line to the right (looking from Begin atom to End atom)
- **Left**: second line to the left
- **Center**: both lines equidistant from the bond axis

For endocyclic double bonds the second line is offset **toward the ring center**. For chain double bonds the placement is at the author's discretion. IUPAC 2008 requires double-bond separation ≤ 33% of bond length.

**Triple bonds** use the same `BondSpacing` parameter. They render as three parallel lines: one center line plus two equidistant offset lines. Triple bonds enforce 180° geometry.

## 2.3 Stereochemistry bond types

ChemDraw defines **12 bond display types** via the `Bond_Display` enumeration:

| Value | Name             | Description                                 |
| ----- | ---------------- | ------------------------------------------- |
| 0     | Solid            | Default single bond line                    |
| 1     | Dash             | Evenly dashed line                          |
| 2     | Hash             | Parallel perpendicular lines, uniform width |
| 3     | WedgedHashBegin  | Hashed wedge, narrow at Begin atom          |
| 4     | WedgedHashEnd    | Hashed wedge, narrow at End atom            |
| 5     | Bold             | Thick line at BoldWidth                     |
| 6     | WedgeBegin       | Solid wedge, narrow at Begin atom           |
| 7     | WedgeEnd         | Solid wedge, narrow at End atom             |
| 8     | Wavy             | Sinusoidal bond                             |
| 9     | HollowWedgeBegin | Outline-only wedge, narrow at Begin         |
| 10    | HollowWedgeEnd   | Outline-only wedge, narrow at End           |
| 11    | WavyCross        | Crossed double bond (undefined E/Z)         |

**Solid wedge bonds**: filled triangles tapering from a point at the stereocenter (narrow end = Begin atom) to a wide end at the distal atom. **Wide end width = 1.5 × BoldWidth** (3.0 pt at ACS settings). The narrow end tapers to approximately zero width.

**Hashed wedge bonds**: same triangular envelope, filled with parallel hash lines perpendicular to the bond axis. Hash line spacing = `HashSpacing` (2.5 pt ACS). Lines increase in length from narrow to wide end. Minimum **3 hash lines** for visual clarity (Nature Chemistry guideline).

**Bold bonds**: non-directional, drawn at `BoldWidth` stroke (2.0 pt ACS). Used for relative/racemic stereochemistry.

**Wavy bonds**: sinusoidal curve along the bond axis with constant amplitude = `BoldWidth`. Approximately 5 complete sine waves per standard bond length. Used for unknown or unspecified stereochemistry.

**Stereochemical convention (IUPAC 2006)**: solid wedge = toward viewer (above plane); hashed wedge = away from viewer (below plane). Narrow end **must** be at the stereogenic center. Stereobonds between two stereocenters are strongly discouraged.

## 2.4 Bond shortening near atom labels (MarginWidth)

When a visible atom label is present, bond lines are **shortened by `MarginWidth`** along the bond direction so they do not overlap the text. At ACS 1996 settings this gap is **1.6 pt** per labeled atom end.

```
function renderBond(bond):
  p1 = bond.beginAtom.position
  p2 = bond.endAtom.position
  direction = normalize(p2 − p1)

  if bond.beginAtom.hasVisibleLabel:
    labelBBox = getTextBoundingBox(bond.beginAtom.label)
    # Shorten from p1: advance past label bbox + margin
    p1 = p1 + direction × (labelHalfWidth + MarginWidth)

  if bond.endAtom.hasVisibleLabel:
    labelBBox = getTextBoundingBox(bond.endAtom.label)
    p2 = p2 − direction × (labelHalfWidth + MarginWidth)

  drawLine(p1, p2, width=LineWidth)
```

For implicit (unlabeled) carbons, bonds extend fully to the vertex point with no shortening. `MarginWidth` also controls the **gap at bond crossings**: the rear bond is interrupted with a gap of `MarginWidth` on each side of the crossing point.

## 2.5 Aromatic bond rendering

**Kekulé style** (alternating single/double bonds) is the default for rings drawn normally. The second line of each double bond offsets toward the ring center. This is preferred for most organic chemistry publications.

**Inscribed circle style** is created by holding Ctrl (Win) / Cmd (Mac) while placing a ring. A circle (or arc for partial delocalization) is inscribed within the ring at approximately 60% of the ring radius. IUPAC 2008 recommends inscribed circles only for systems with genuine delocalization ambiguity (e.g., cyclopentadienyl anions, ferrocenes).

---

# 3 — Standards, norms, and file formats

## 3.1 IUPAC 2008 Recommendations

**Full citation**: Brecher, J. "Graphical representation standards for chemical structure diagrams (IUPAC Recommendations 2008)." _Pure and Applied Chemistry_, Vol. 80, No. 2, pp. 277–410, 2008. DOI: 10.1351/pac200880020277

The lead author, Jonathan Brecher, was employed at CambridgeSoft (the company behind ChemDraw), which means ChemDraw's behavior is closely aligned with these recommendations. The companion document on stereochemistry is: Brecher, J. et al. "Graphical representation of stereochemical configuration (IUPAC Recommendations 2006)." _Pure Appl. Chem._, Vol. 78, No. 10, pp. 1897–1970, 2006.

Key IUPAC 2008 numeric guidance:

- Bond line width should approximate the stroke thickness of the atom-label font (the crossbar of a capital "H")
- Acceptable font range: **8–14 pt**, roman fonts (Times, Arial, Helvetica preferred)
- Double-bond separation must not exceed **33% of bond length**
- Bond length must be long enough that inter-atom spacing exceeds twice the atom-label height
- Chain angle: **120°** standard for sp² zigzag chains

## 3.2 ACS Document 1996 guidelines

The "ACS Document 1996" is a built-in ChemDraw style sheet (file `ACS Document 1996.cds`). ACS instructs authors: "If you are using ChemDraw, follow the drawing settings in the ACS-1996 Style Sheet for preparing your artwork." All numeric values are listed in the Master default-value table above. The style is applied via `File → Apply Document Settings from → ACS Document 1996`.

Key ACS requirements beyond ChemDraw defaults: drawing area width of **540 pt** (≈ 19 cm) for 2-column format; all atom labels and captions in the same font family; no color in print publications (black on white only).

## 3.3 CDX and CDXML file format specification

**CDX** (ChemDraw Exchange) is the native binary format. **CDXML** is the semantically identical XML variant. Conversion between them is lossless. CDX was adopted by the U.S. Patent and Trademark Office as a standard chemical format. The specification is public domain and was originally hosted at cambridgesoft.com; a mirror is maintained at https://chemapps.stolaf.edu/iupac/cdx/sdk/.

**Architecture**: both formats are tagged, nested structures: `Document → Page → Fragment → Node/Bond`. CDXML defines **38 object types** and **263 attributes**.

**CDX binary format**: 28-byte header starting with magic bytes `VjCD0100`. Object tags are 2-byte IDs with bit 15 set (≥ 0x8000). Property tags are 2-byte ID + 2-byte length + data payload. Object end marker: tag `0x0000`. All multi-byte integers are little-endian. Coordinates use INT32 in units of **1/65536 of a point** (sub-point precision via fixed-point integer arithmetic).

**CDXML coordinate system**: origin at top-left; X increases rightward; Y increases **downward** (screen coordinates). All distance values in points.

Key CDXML object types:

| XML Tag                    | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `<CDXML>`                  | Document root (contains all drawing defaults as attributes) |
| `<page>`                   | Drawing page                                                |
| `<fragment>`               | Molecular graph container                                   |
| `<n>`                      | Node (atom, nickname, fragment, external connection point)  |
| `<b>`                      | Bond (connection between nodes)                             |
| `<t>`                      | Text block                                                  |
| `<s>`                      | Styled text run (font, size, face attributes)               |
| `<graphic>`                | Geometric shape                                             |
| `<arrow>`                  | Reaction arrow                                              |
| `<bracketedgroup>`         | Bracket notation (polymers, mixtures)                       |
| `<scheme>`                 | Reaction scheme                                             |
| `<step>`                   | Single reaction step                                        |
| `<colortable>` / `<color>` | Color definitions (RGB)                                     |
| `<fonttable>` / `<font>`   | Font definitions                                            |

Key node attributes: `id` (UINT32), `p` (CDXPoint2D), `Element` (INT16, default=6), `NodeType` (Element, GenericNickname, Fragment, ExternalConnectionPoint), `Charge` (INT8), `Isotope` (INT16), `Radical` (UINT8), `NumHydrogens` (UINT16), `LabelDisplay`, `HDot`, `HDash`.

Key bond attributes: `id` (UINT32), `B` (begin node ID), `E` (end node ID), `Order` ("1", "1.5", "2", "3"), `Display` (Solid, Dash, Hash, WedgeBegin, WedgeEnd, Bold, Wavy, etc.), `Display2`, `DoublePosition` (Center, Right, Left), `BondCircularOrdering` (for stereo interpretation).

**Important read/write semantics**: when reading, if a Text object exists within a Node, ChemDraw uses the text as-is and ignores the chemical properties (Element, NumHydrogens). When writing, ChemDraw always writes both the Text object and chemical properties redundantly for interoperability.

Minimal valid CDXML:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE CDXML SYSTEM "http://www.camsoft.com/xml/cdxml.dtd">
<CDXML BondLength="14.4" LineWidth="0.6" BoldWidth="2"
       MarginWidth="1.6" HashSpacing="2.5" BondSpacing="18"
       ChainAngle="120" LabelSize="10" LabelFace="96">
  <fonttable>
    <font id="3" charset="iso-8859-1" name="Arial"/>
  </fonttable>
  <page>
    <fragment>
      <n id="1" p="100 100" Element="7" NumHydrogens="2"/>
      <n id="2" p="114.4 108.31"/>
      <b B="1" E="2"/>
    </fragment>
  </page>
</CDXML>
```

## 3.4 MDL MOL/SDF format (V2000 and V3000)

Originally published by MDL Information Systems (now BIOVIA/Dassault Systèmes). The V2000 format structure consists of a 3-line header, a counts line (`aaabbblllfffcccsssxxxrrrpppiiimmmvvvvvv`), an atom block (x, y, z + symbol + charge + stereo), a bond block (atom1, atom2, type, stereo), and a properties block (M CHG, M RAD, M ISO). V2000 supports a maximum of **999 atoms/bonds**. Bond types: 1=single, 2=double, 3=triple, 4=aromatic. Bond stereo: 0=none, 1=Up (wedge), 4=Either, 6=Down (dash).

**V3000** removes the 999-atom limit, uses free-format fields, supports **enhanced stereochemistry** (AND, OR, ABS groups), and adds biopolymer (SCSR) support. Enhanced stereo groups are critical for patent and pharmaceutical applications.

**SDF** format: multiple MOL records separated by `$$$$`, each with optional key-value data fields (`> <fieldname>`).

**RXN** format: header `$RXN`, followed by reactant/product/agent blocks, each containing embedded MOL files.

**Coordinate system difference**: MOL files use Ångströms with Y increasing **upward**, while CDXML uses points with Y increasing downward. Conversion requires: `mol_y = −cdxml_y × scale_factor`, where the scale factor maps points to Ångströms (typically BondLength in points maps to ~1.5 Å).

## 3.5 SMILES and InChI

ChemDraw supports copy/paste of SMILES (Edit → Copy As → SMILES), InChI, and InChIKey. SMILES follows Daylight/OpenSMILES conventions: uppercase letters for aliphatic atoms, brackets for non-organic-subset atoms, `@`/`@@` for tetrahedral chirality, `/`/`\` for E/Z double bonds. InChI is a canonical identifier, not a structure code—round-trip to the original 2D drawing is not guaranteed.

## 3.6 Information loss during format conversion

**CDX/CDXML → MOL/SDF**: loses all graphical/visual data (colors, fonts, line widths, arrow styles), reaction annotations, TLC plates, spectra, brackets (partially preserved in V3000), page layout, and nickname contractions (expanded to full structure). Preserves: atom connectivity, 2D coordinates, bond orders, stereochemistry, charges, isotopes, radicals.

**CDX/CDXML → SMILES**: additionally loses all 2D coordinates, visual stereo representation (converted to @/@@), and multi-fragment layout. Explicit hydrogens may become implicit.

**MOL → CDX/CDXML**: MOL files lack all graphical styling; default ChemDraw styles must be applied on import.

## 3.7 Third-party CDX/CDXML support

| Tool                  | CDX Read  | CDXML Read     | CDXML Write    |
| --------------------- | --------- | -------------- | -------------- |
| Open Babel            | Partial   | Partial        | No             |
| ChemAxon Marvin       | Yes       | Yes            | Alpha (v24.3+) |
| pycdxml (open source) | Yes       | Yes            | Yes            |
| RDKit                 | No native | Via converters | No             |
| ChemDoodle            | Yes       | Yes            | Yes            |

**pycdxml** (https://github.com/kienerj/pycdxml) is a Python package for CDX/CDXML processing that can convert RDKit molecules to CDXML with style sheet application.

---

# 4 — Algorithms and internal logic

## 4.1 Structure clean-up / auto-layout (Structure Diagram Generation)

ChemDraw's "Clean Up Structure" command (Shift+Cmd+K / Shift+Ctrl+K) implements a Structure Diagram Generation (SDG) algorithm comprehensively described in Harold E. Helson's review chapter ("Structure Diagram Generation," _Reviews in Computational Chemistry_, Vol. 13, pp. 313–398, Wiley-VCH, 1999) and patented in **US Patent 7,912,689 B1** (Helson, filed 2000, granted 2011).

The algorithm has four phases:

**Phase 1 — Perception**: parse connection table; detect ring systems (maximal sets of rings sharing ≥ 1 bond); classify fused, bridged, and spiro systems; detect molecular symmetry using graph automorphism perception (Razinger et al., _J. Chem. Inf. Comput. Sci._ **33**, 197, 1993).

**Phase 2 — Pre-assembly analysis**: derive ideal shapes for ring systems using ring templates or computed regular-polygon geometry; determine bridge arrangements using an "open polygon method" with a potential function; pre-compute optimal bond lengths and angles per fragment.

**Phase 3 — Assembly (layout)**: seed-atom approach where one atom is placed first; neighbors are positioned at aesthetic angles and the document's fixed bond length; each neighbor becomes a seed for subsequent iterations. Ring systems are attached as pre-computed units. Symmetry is expressed during assembly: when an atom belongs to a symmetry orbit, all equivalent atoms are placed simultaneously to preserve symmetry. Mirror planes are aligned horizontally or vertically; rotational symmetry (≥ 3-fold) takes priority over reflection.

**Phase 4 — Post-assembly**: overlap resolution via 2D molecular-dynamics simulation. Predefined optimal bond lengths and angles serve as targets; deviation from targets is interpreted as corrective force; the process iterates until net force on every atom approaches zero (equilibrium). A symmetry term in the force field drives equivalent regions toward identical appearance. Final adjustments rotate the structure so the majority of bonds align to multiples of 15° relative to the horizontal axis.

Implementation pseudocode for the clean-up pipeline:

```
function cleanUpStructure(molecule, settings):
  # Phase 1: Perception
  rings = detectAllRings(molecule)          # SSSR or equivalent
  ringSystems = groupIntoRingSystems(rings)  # fused/bridged clusters
  symmetry = detectAutomorphisms(molecule)

  # Phase 2: Pre-assembly
  for each rs in ringSystems:
    if templateMatch(rs):
      rs.coords = copyTemplateCoords(rs)
    else:
      rs.coords = computeRegularPolygonCoords(rs, settings.bondLength)

  # Phase 3: Assembly
  seed = chooseSeedAtom(molecule)           # prefer ring atom
  placed = {seed: (0, 0)}
  queue = neighbors(seed)
  while queue not empty:
    atom = queue.dequeue()
    if atom in ringSystems:
      placeRingSystem(atom, placed, ringSystems)
    else:
      angle = determineAngle(atom, placed, settings.chainAngle)
      placed[atom] = placed[parent] + polar(settings.bondLength, angle)
    queue.enqueue(unplaced neighbors of atom)
    expressSymmetry(atom, symmetry, placed)

  # Phase 4: Post-assembly
  for iteration in 1..MAX_ITERATIONS:
    forces = computeForces(placed, settings, symmetry)
    if maxForce(forces) < CONVERGENCE_THRESHOLD: break
    applyForces(placed, forces, dampingFactor=0.5)

  rotateToCanonicalOrientation(placed)
  return placed
```

## 4.2 Ring detection and perception

ChemDraw detects ring systems at three levels: individual rings, fused ring systems (two rings sharing exactly one bond), bridged ring systems (two bridgehead atoms connected by multiple paths), and spiro compounds (two rings sharing exactly one atom, treated as separate ring systems in layout).

The classical algorithm for ring perception is **Smallest Set of Smallest Rings (SSSR)**. The number of rings in any SSSR = m − n + c (edges minus nodes plus connected components; the "cycle rank" or Frèrejacque number).

**Zamora (1976)** three-phase algorithm: Phase 1 finds the smallest ring containing each unused atom; Phase 2 finds the smallest ring containing each unused edge; Phase 3 finds unused faces. Runtime is approximately O(n³).

**RP-Path (Lee et al., _PNAS_ 2009, 106, 17355)**: O(n³), uses Path-Included Distance matrices. More robust than earlier methods.

**Critical implementation note**: SSSR is **not unique**—a molecule can have multiple valid SSSRs. In bridged bicyclic systems, for example, three possible rings exist but only two fit in the SSSR, and the choice is arbitrary. For deterministic ring-membership queries, **Unique Ring Families (URF)** or OEChem-style per-atom ring-size queries are recommended. For layout purposes SSSR is adequate.

**Ring templates**: both ChemDraw and open-source tools use pre-computed ideal 2D coordinates for common ring systems (benzene, naphthalene, steroid skeleton, etc.). RDKit's CoordGen library ships with approximately **70 ring templates**. Template matching searches the target molecule for known ring substructures; when found, template coordinates are copied to matching atoms and remaining atoms are cleaned with partial layout.

## 4.3 Valence checking and formal charge calculation

ChemDraw uses a built-in valence table and flags violations with a **red warning box** around the offending atom. Standard valences used:

| Element                 | Standard valences          |
| ----------------------- | -------------------------- |
| C                       | 4                          |
| N                       | 3, 5                       |
| O                       | 2                          |
| S                       | 2, 4, 6                    |
| P                       | 3, 5                       |
| Halogens (F, Cl, Br, I) | 1, (3, 5, 7 for Cl, Br, I) |

Formal charge formula: `formalCharge = groupValenceElectrons − lonePairElectrons − bondCount`

Warnings trigger when: carbon has > 4 bonds; nitrogen has 4 bonds without a formal positive charge; total bond order exceeds any standard valence for the element. The View menu toggle "Chemical Warnings" controls display of these indicators.

## 4.4 Functional group abbreviations (nicknames)

ChemDraw stores abbreviations in a `Nicknames` file (XML or binary) in the ChemDraw Items folder. Each nickname maps a text label to an expanded molecular fragment with defined attachment points. In CDXML, nickname nodes have `NodeType="GenericNickname"` or `NodeType="Fragment"`.

**Core nickname categories and examples**:

- **Alkyl groups**: Me, Et, n-Pr, i-Pr, n-Bu, i-Bu, s-Bu, t-Bu, Cy (cyclohexyl)
- **Aryl groups**: Ph, Bn (benzyl), Tol, Mes (mesityl), Nap (naphthyl)
- **Functional groups**: Ac (acetyl), Bz (benzoyl), CO₂H, CHO, CN, NO₂, OMe, OEt, OAc, NMe₂, CF₃
- **Protecting groups**: Boc, Fmoc, Cbz, TBS (TBDMS), TIPS, TMS, TBDPS, THP, MOM, MEM, SEM, PMB, Tr (trityl), Alloc, Ts (tosyl), Ms (mesyl), Tf (triflyl), Ns (nosyl)
- **Amino acids (3-letter)**: Ala, Arg, Asn, Asp, Cys, Gln, Glu, Gly, His, Ile, Leu, Lys, Met, Phe, Pro, Ser, Thr, Trp, Tyr, Val

**Attachment points**: each nickname defines one or more attachment atoms. Single-attachment nicknames (e.g., Me) connect through one carbon. Multi-attachment nicknames (e.g., phenylene linkers) have two or more connection points. On expansion (`Structure → Expand Label`), the label is replaced with the full substructure connected through designated attachment atoms.

**Label reversal**: nicknames follow the same automatic reversal logic as atom labels. "OTBS" becomes "TBSO" when bonds approach from the right. Reversal tokenizes at uppercase letter boundaries.

**User access**: the `=` key opens the Choose Nickname dialog; `Structure → Define Nickname` creates custom abbreviations; `Structure → Expand Label` expands the selected nickname; `File → List Nicknames` displays all available abbreviations.

## 4.5 Stereocenter detection and CIP assignment

ChemDraw detects stereocenters and assigns CIP labels when `Show Stereochemistry` is enabled (accessible via right-click context menu or Options menu). It computes:

- **(R)** and **(S)** for absolute tetrahedral stereocenters
- **(r)** and **(s)** for pseudo-asymmetric centers (CIP Rule 5)
- **(E)** and **(Z)** for double-bond geometric isomerism

**Stereocenter identification algorithm**:

```
function detectStereocenters(molecule):
  for each atom A with sp3 hybridization and 4 substituents (including implicit H):
    groups = [substituent subgraph for each bond from A]
    if allDistinct(groups, using CIP digraph comparison):
      A.isSterocenter = true
      if hasWedgeOrHashBond(A):
        A.cipLabel = assignRS(A, groups)
      else:
        A.cipLabel = "undefined"
```

**CIP priority assignment** uses the hierarchical digraph approach:

1. Compare atoms directly attached to the stereocenter by atomic number Z (higher Z = higher priority)
2. If tied, expand to the next sphere of atoms, sorting each sphere's atom list by descending Z
3. Multiple bonds are expanded: a double bond A=B creates phantom atoms (A bonded to phantom-B, B bonded to phantom-A)
4. Ring closures insert phantom (duplicate) atoms to keep the tree finite
5. Continue until all ties are broken or groups are confirmed identical

**R/S assignment**: orient the molecule so priority-4 group points away from the viewer. If the priority sequence 1→2→3 traces clockwise, the center is **R** (rectus); counterclockwise is **S** (sinister). Wedge bond direction determines the viewer orientation: solid wedge = toward viewer, hashed wedge = away from viewer.

**E/Z assignment**: for each carbon of a double bond, identify the two substituents and assign CIP priority. If both high-priority groups are on the same side of the double bond, the configuration is **Z**; opposite sides = **E**.

Modern algorithmic CIP implementations follow Hanson, Musacchio & Mayfield's standardization, which handles pseudo-asymmetric centers, mancude ring systems, and edge cases. ChemDoodle validates against Hanson's 300-case test suite with 100% accuracy. For an open-source implementation, RDKit's CIP module or the CDK `centres` package are production-ready starting points.

---

# 5 — User interaction and reference UX

## 5.1 Main drawing tools

ChemDraw's main toolbar contains these tool categories, many with tear-off sub-toolbars (indicated by ▸):

| Tool                      | Function                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| **Lasso**                 | Free-form selection by drawing around objects                                               |
| **Marquee**               | Rectangular selection by dragging diagonally                                                |
| **Structure Perspective** | 3D rotation of selected structure                                                           |
| **Solid Bond**            | Draw single bonds; click-drag creates a new bond                                            |
| **Multiple Bond ▸**       | Double, triple, dashed, bold, wedge, hashed, wavy, hollow wedge bonds                       |
| **Eraser**                | Delete objects by clicking or dragging                                                      |
| **Text**                  | Create atom labels and text captions                                                        |
| **Pen**                   | Freehand shapes, custom arrows, orbitals                                                    |
| **Arrows ▸**              | Reaction arrows, retrosynthetic arrows, equilibrium, curved electron arrows, no-go, dipoles |
| **Orbitals ▸**            | s, p, d, sp, sp², sp³ orbitals, lone pairs                                                  |
| **Drawing Elements ▸**    | Boxes, lines, circles, arcs, rectangles                                                     |
| **Brackets ▸**            | Parentheses, square brackets, curly braces (polymers, mixtures)                             |
| **Chemical Symbols ▸**    | Charges (+/−), radical dots, lone pairs, electron dots                                      |
| **Acyclic Chain**         | Carbon chain of any length (zigzag at ChainAngle)                                           |
| **Rings**                 | Cyclopropane through cyclooctane, benzene (aromatic)                                        |
| **Query Tools ▸**         | Stereochemical flags, free sites, atom-to-atom mapping                                      |
| **Templates ▸**           | Pre-drawn structures from template library                                                  |
| **Table**                 | Create tabular grids                                                                        |

Additional toolbars: BioDraw (biological pathway elements: membranes, DNA, enzymes, receptors), HELM Monomers (amino acid and nucleotide sequences), Style, Highlight Colors, Stoichiometry Grid.

**Bond tool behavior**: click on empty space to place a new atom; drag to define bond direction and endpoint. Click on an existing atom to extend a bond from that atom. The bond tool respects Fixed Length and Fixed Angles settings. Clicking an existing bond increments its order (single → double → triple → single).

**Ring tool behavior**: click to place a complete ring template. Click on an existing atom to fuse the ring to that atom. Click on an existing bond to fuse the ring to that bond edge. Shift+click reverses double-bond placement within the ring. Ctrl/Cmd+click creates an inscribed-circle aromatic ring.

**Chain tool behavior**: click-drag to create a zigzag carbon chain. The number of atoms depends on drag distance. Chain angle follows `ChainAngle` setting (default 120°). Ctrl+drag reverses the chain direction.

## 5.2 Snapping and angular constraints

**Fixed Length mode** (`Ctrl+L` / `Cmd+L`): constrains all new bonds to the document's `BondLength` value. Also used by Clean Up Structure as the target bond length.

**Fixed Angles mode** (`Ctrl+E` / `Cmd+E`): bonds snap to standard chemical geometry angles determined by hybridization context (120° for sp², 109.5° for sp³, 180° for sp). This is chemistry-aware snapping, not a fixed-interval grid.

**Crosshair grid**: toggled via `View → Show Crosshair` (`Cmd+;` or `Ctrl+H`). Grid lines extend from major division marks on rulers. Objects snap to grid intersections when close. Grid spacing depends on the document's measurement units.

**Arrow-key movement**: selected objects move in **1-point increments** per arrow key press. `Alt+Arrow` moves in **10-point increments**. `Shift+drag` constrains movement to horizontal or vertical axis only.

**Alignment tools**: `Object → Align` offers Left/Right/Center horizontal and Top/Bottom/Center vertical alignment. `Object → Distribute` spaces objects evenly.

## 5.3 Template library

Templates are stored as `.ctp` (ChemDraw Template) files in the ChemDraw Items folder. Built-in categories include:

- **Amino Acids** — all 20 standard amino acids (L- and D-forms)
- **Aromatics** — common aromatic ring systems (naphthalene, anthracene, phenanthrene, etc.)
- **Bicyclics** — bicyclic ring systems (norbornane, decalin, etc.)
- **Carbohydrates/Sugars** — mono- and polysaccharide structures
- **Steroids** — steroid skeletons (androstane, cholestane, etc.)
- **Rings** — common ring sizes and fused ring systems
- **Lewis Structures** — Lewis dot diagrams
- **Molecular Orbitals** — orbital diagrams
- **Newman Projections** — conformational representations
- **Fischer Projections** — stereochemical projections
- **Arrow Templates** — reaction-type arrow schemes
- **Lab Equipment/Glassware** — flasks, condensers, distillation apparatus
- **BioDraw** (Professional only) — membranes, DNA helices, enzymes, receptors, tRNA, ribosomes, mitochondria, Golgi bodies, immunoglobulins

Users create custom templates by saving any ChemDraw drawing as a `.ctp` file in the ChemDraw Items folder; it then appears in the Templates menu. Templates can contain any ChemDraw object: atoms, bonds, captions, boxes, arcs, orbitals, arrows, and curves.

## 5.4 Keyboard shortcuts reference

### Document operations

| Action              | Windows      | Mac         |
| ------------------- | ------------ | ----------- |
| New Document        | Ctrl+N       | Cmd+N       |
| Open                | Ctrl+O       | Cmd+O       |
| Save                | Ctrl+S       | Cmd+S       |
| Undo                | Ctrl+Z       | Cmd+Z       |
| Redo                | Shift+Ctrl+Z | Shift+Cmd+Z |
| Cut / Copy / Paste  | Ctrl+X/C/V   | Cmd+X/C/V   |
| Select All          | Ctrl+A       | Cmd+A       |
| Delete              | Delete       | Delete      |
| Copy as CDXML       | Ctrl+D       | Cmd+D       |
| Toggle Fixed Length | Ctrl+L       | Cmd+L       |
| Toggle Fixed Angles | Ctrl+E       | Cmd+E       |

### Structure operations

| Action                        | Windows               | Mac                 |
| ----------------------------- | --------------------- | ------------------- |
| Clean Up Structure            | Shift+Ctrl+K          | Shift+Cmd+K         |
| Name to Structure             | Shift+Ctrl+N          | Shift+Cmd+N         |
| Scale                         | Ctrl+K                | Cmd+K               |
| Group / Ungroup               | Ctrl+G / Shift+Ctrl+G | Cmd+G / Shift+Cmd+G |
| Join                          | Ctrl+J                | Cmd+J               |
| Flip Horizontal               | Shift+Ctrl+H          | Shift+Cmd+H         |
| Flip Vertical                 | Shift+Ctrl+V          | Shift+Cmd+V         |
| Bring to Front / Send to Back | F2 / F3               | F2 / F3             |
| Rotate                        | Ctrl+R                | Cmd+R               |

### Bond hotkeys (with a bond selected)

| Key | Action                     |
| --- | -------------------------- |
| `1` | Plain single bond          |
| `2` | Double bond                |
| `3` | Triple bond                |
| `4` | Quadruple bond             |
| `b` | Bold bond                  |
| `d` | Dashed bond                |
| `h` | Hashed bond                |
| `w` | Wedge bond                 |
| `y` | Wavy bond                  |
| `l` | Double bond position left  |
| `r` | Double bond position right |
| `c` | Center double bond         |
| `f` | Bring bond to front        |

### Atom hotkeys (with an atom selected or hovered)

| Key   | Result                   | Shift+Key | Result           |
| ----- | ------------------------ | --------- | ---------------- |
| C     | Carbon                   | —         | —                |
| N     | Nitrogen                 | —         | —                |
| O     | Oxygen                   | Shift+O   | OMe group        |
| S     | Sulfur                   | —         | —                |
| F     | Fluorine                 | —         | —                |
| P     | Phosphorus               | Ctrl+P    | Ph (phenyl)      |
| B     | Boron                    | Shift+B   | Br (bromine)     |
| L     | Cl (chlorine)            | —         | —                |
| I     | Iodine                   | —         | —                |
| H     | Hydrogen                 | —         | —                |
| M     | Me (methyl)              | —         | —                |
| K     | Sulfonyl                 | Shift+K   | t-Bu             |
| E     | —                        | Shift+E   | CO₂Me            |
| V     | Cyclopropyl sprout       | —         | —                |
| U     | Cyclobutyl sprout        | —         | —                |
| J     | Cyclopentadienyl         | Shift+J   | Phenyl Pi ligand |
| `+`   | Add positive charge      | —         | —                |
| `−`   | Add negative charge      | —         | —                |
| `'`   | Add atom number          | —         | —                |
| `=`   | Choose Nickname dialog   | —         | —                |
| Enter | Open atom label text box | —         | —                |
| `/`   | Atom Properties dialog   | —         | —                |
| `0`   | Sprout 1 bond            | `9`       | Sprout 2 bonds   |
| —     | —                        | `8`       | Sprout 3 bonds   |

Hotkey definitions are stored in an editable XML file at: `ChemDraw Items/hotkeys.xml`. Users can customize all hotkeys via `File → Preferences → Customizing Hotkeys`.

## 5.5 Undo/redo system

ChemDraw implements **unlimited multi-level undo**, constrained only by available RAM and virtual memory. There is no fixed step limit. The undo stack tracks all actions performed **since the last save**; saving the document resets the undo history. `File → Revert` restores the last-saved version entirely. Autosave/autorecovery is configurable (default interval varies; typically 5 minutes) via `File → Preferences → Open/Save`.

Implementation note for an open-source editor: a **command-pattern undo system** is the standard approach. Each user action (add atom, move atom, change bond order, etc.) creates a reversible command object stored on a stack. Undo pops and reverses the top command; redo re-executes it. Grouped operations (e.g., Clean Up Structure modifies many atoms at once) should be wrapped in a single compound command.

## 5.6 Copy/paste behavior

ChemDraw places **multiple representations** on the system clipboard simultaneously:

| Format            | Description                                       |
| ----------------- | ------------------------------------------------- |
| CDX (binary)      | Native ChemDraw format (default clipboard format) |
| CDXML             | XML text representation                           |
| EMF/WMF (Windows) | Vector image for Office applications              |
| PDF (Mac)         | Vector image                                      |
| PNG               | Raster image (for email clients)                  |
| SMILES            | Text string (via Copy As → SMILES)                |
| MOL V2000/V3000   | MDL Molfile text (via Copy As)                    |
| InChI             | IUPAC identifier (via Copy As)                    |

**Smart Paste** (v17.1+): standard Ctrl+V / Cmd+V auto-detects text-format clipboard content (SMILES, MOL, InChI, HELM, CDXML, FASTA) and pastes it as a chemical structure directly.

**OLE embedding**: structures pasted into Microsoft Word or PowerPoint on Windows are embedded as OLE objects. Double-clicking re-opens the structure in ChemDraw for round-trip editing.

**Duplicate via drag**: Ctrl+drag (Win) / Cmd+drag (Mac) copies the selected object. Shift+Ctrl+drag constrains the copy movement to horizontal or vertical axes.

---

# 6 — Open-source implementation recommendations

## 6.1 Recommended technology choices

For implementing equivalent functionality in an open-source molecular editor, the following proven libraries and algorithms are recommended:

**2D layout engine**: Use **CoordGen** (Schrödinger, BSD-licensed, https://github.com/schrodinger/coordgenlibs) as the primary coordinate generator. It excels at drug-like molecules, macrocycles, and metal complexes. Supplement with ring templates (~70 from RDKit/CoordGen repository). RDKit's native `rdDepictor.Compute2DCoords` is a viable alternative with good template matching.

**Ring perception**: Avoid SSSR for deterministic operations. Use **Unique Ring Families (URF)** or per-atom ring-size queries. For layout purposes only, SSSR (RP-Path algorithm, O(n³)) is adequate.

**CIP stereochemistry**: Use RDKit's CIP module or implement the Hanson/Musacchio/Mayfield algorithmic standardization. Validate against Hanson's 300-case test suite.

**File format**: Implement CDXML read/write as the highest priority for ChemDraw interoperability (it is XML and human-readable). Use **pycdxml** as a reference implementation. MOL V2000/V3000 export is essential for broad interoperability. SMILES/InChI for database integration.

## 6.2 Data model architecture

The internal data model should separate **chemical semantics** (atoms, bonds, charges, stereo) from **visual presentation** (positions, styles, colors, fonts), mirroring the CDX/CDXML architecture. Key model entities:

```
Document
  ├── StyleSettings (bondLength, lineWidth, boldWidth, marginWidth, ...)
  ├── FontTable
  ├── ColorTable
  └── Page[]
       └── Fragment[]
            ├── Node[] (element, charge, isotope, radical, numHydrogens, position, labelJustification)
            │    └── TextLabel (styled runs with font, size, face bitmask)
            └── Bond[] (beginNode, endNode, order, displayType, doublePosition)
```

## 6.3 Key rendering algorithms

**Bond rendering with label gap**:

```
function renderBond(bond, settings):
  p1, p2 = bond.begin.pos, bond.end.pos
  dir = normalize(p2 - p1)

  if bond.begin.hasLabel:
    p1 += dir * (halfLabelWidth(bond.begin) + settings.marginWidth)
  if bond.end.hasLabel:
    p2 -= dir * (halfLabelWidth(bond.end) + settings.marginWidth)

  match bond.displayType:
    case Solid:     drawLine(p1, p2, settings.lineWidth)
    case Double:    renderDoubleBond(p1, p2, bond.doublePosition, settings)
    case Triple:    renderTripleBond(p1, p2, settings)
    case WedgeBegin: renderWedge(p1, p2, settings.boldWidth * 1.5, filled=true)
    case WedgedHashBegin: renderHashedWedge(p1, p2, settings)
    case Bold:      drawLine(p1, p2, settings.boldWidth)
    case Wavy:      renderWavyBond(p1, p2, settings.boldWidth)
    case Dash:      drawDashedLine(p1, p2, settings.hashSpacing, settings.lineWidth)
```

**Label justification**:

```
function autoJustify(atom):
  if atom.bonds.length == 0: return Center
  avgX = mean([neighbor.pos.x - atom.pos.x for neighbor in atom.neighbors])
  if avgX > 0.1 * settings.bondLength: return Right  # bonds go right → text right-aligned
  if avgX < -0.1 * settings.bondLength: return Left   # bonds go left → text left-aligned
  return Center
```

**Implicit hydrogen count**:

```
function implicitHydrogens(atom):
  bondOrderSum = sum(bond.order for bond in atom.bonds)
  valences = STANDARD_VALENCES[atom.element]  # e.g., [3, 5] for nitrogen
  targetValence = min(v for v in valences if v >= bondOrderSum + abs(atom.charge))
  return max(0, targetValence - bondOrderSum - abs(atom.charge))
```

---

# 7 — References and sources

**Standards documents**:

- Brecher, J. _Pure Appl. Chem._ **2008**, _80_, 277–410. (IUPAC 2008 Graphical Representation)
- Brecher, J. et al. _Pure Appl. Chem._ **2006**, _78_, 1897–1970. (IUPAC 2006 Stereochemistry)
- ACS Document 1996 Style Sheet (built into ChemDraw; numeric values at https://support.revvitysignals.com/hc/en-us/articles/4408234173332)

**CDX/CDXML format specification**:

- Primary mirror: https://chemapps.stolaf.edu/iupac/cdx/sdk/
- Depth-First introduction: https://depth-first.com/articles/2021/04/07/an-introduction-to-the-chemdraw-cdxml-format/
- Library of Congress entry: https://loc.gov/preservation/digital/formats/fdd/fdd000582.shtml

**SDG algorithms**:

- Helson, H.E. "Structure Diagram Generation." _Rev. Comput. Chem._ **1999**, _13_, 313–398.
- US Patent 7,912,689 B1 (Helson, 2011): https://patents.google.com/patent/US7912689B1/en
- Clark, A.M.; Labute, P.; Santavy, M. _J. Chem. Inf. Model._ **2006**, _46_, 1107–1123.
- Frączek, T. _J. Chem. Inf. Model._ **2016**, _56_, 2320–2335.

**Ring perception**:

- Zamora, A. _J. Chem. Inf. Comput. Sci._ **1976**, _16_, 40.
- Lee, C.J. et al. _PNAS_ **2009**, _106_, 17355.
- Depth-First SSSR analysis: https://depth-first.com/articles/2020/08/31/a-smallest-set-of-smallest-rings/

**Open-source implementations**:

- CoordGen (Schrödinger): https://github.com/schrodinger/coordgenlibs
- pycdxml: https://github.com/kienerj/pycdxml
- RDKit: https://www.rdkit.org/
- Open Babel: https://openbabel.org/

**ChemDraw documentation**:

- ChemDraw 21.0 User Guide: https://chem.beloit.edu/classes/programs/ChemDraw_21_manual.pdf
- ChemDraw 17.0 User Guide: https://library.columbia.edu/content/dam/libraryweb/locations/dsc/Software%20Subpages/ChemDraw_17_manual.pdf
- Revvity Signals Support: https://support.revvitysignals.com/
- Nature Chemistry structure guide: https://www.nature.com/documents/nr-chemical-structures-guide.pdf
- Revvity Tips and Tricks eBook: https://revvitysignals.com/sites/default/files/2023-11/rs-chemdraw-tips-and-tricks-eBook-11-17-23.pdf
