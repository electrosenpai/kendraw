Exhaustive Molecular Geometry Constraints
For High-Precision 3D Molecular Drawing

Apply the following exhaustive set of structural constraints, organized by category. When multiple constraints compete, resolve conflicts by energy minimization logic: prioritize bond lengths first, then valence angles, then torsion angles, then steric clashes, then electrostatic optimization.

1. Bond Lengths
   Use the following equilibrium bond lengths (in angstroms). These values correspond to gas-phase experimental data or high-level ab initio optimized geometries. When a bond appears in a conjugated or aromatic system, use the aromatic value. For bonds in strained rings (3- or 4-membered), apply the strained correction.

1.1 Carbon–Carbon Bonds

1.2 Carbon–Hydrogen Bonds

1.3 Carbon–Oxygen Bonds

1.4 Carbon–Nitrogen Bonds

1.5 Heteroatom Bonds (N, O, S, P, Halogens)

2. Valence Angles (Bond Angles)
   Place atoms so that the angles between bonded triplets match the values below. Angles are defined as A–B–C where B is the central atom. For ring systems, use the ring-specific values which differ from open-chain defaults.

2.1 Tetrahedral Centers (sp3)

2.2 Trigonal Planar Centers (sp2)

2.3 Linear Centers (sp)

2.4 Five-Membered Heterocyclic Ring Angles

3. Torsion (Dihedral) Angles
   Torsion angles define rotation around the B–C bond in an A–B–C–D sequence. They are critical for determining 3D conformation. Use the following values for lowest-energy conformers unless a specific conformation is requested.

3.1 Acyclic sp3–sp3 Torsions

3.2 sp2-Involving Torsions

3.3 Ring System Torsions

3.4 Peptide and Nucleic Acid Backbone Torsions

4. Planarity Constraints
   Certain molecular fragments must be strictly planar or near-planar. Enforce the following out-of-plane deviation limits:

5. Steric Constraints (Van der Waals Radii and Clash Detection)
   No two non-bonded atoms may approach closer than the sum of their van der Waals radii minus a tolerance. Use the following radii and enforce minimum non-bonded distances. 1,4-interactions (atoms separated by three bonds) use a reduced check (0.70× vdW sum). Hydrogen-bonded pairs have specific shorter allowed distances (see Section 6).

5.1 Van der Waals Radii

5.2 Minimum Non-Bonded Distances

Steric clash resolution rule: If placing an atom at its ideal bond length and angle would create a clash (distance < minimum), adjust the torsion angle first. If the clash persists across all rotamers, slightly increase the bond angle (up to +3°). Bond length is the last parameter to adjust and only in extreme cases.

6. Electrostatic and Non-Covalent Interaction Constraints
   When hydrogen bonds, salt bridges, or other electrostatic interactions are present (or requested), enforce these geometric criteria in addition to the covalent constraints above.

6.1 Hydrogen Bond Geometry

6.2 Other Non-Covalent Interactions

7. Special Structural Motifs

7.1 Peptide / Protein Backbone
The peptide bond is planar (ω ≈ 180° for trans, 0° for cis). The Ramachandran plot constrains φ/ψ to specific regions: α-helix (φ ≈ −57°, ψ ≈ −47°), β-sheet (φ ≈ –120°, ψ ≈ +130°), left-handed helix (φ ≈ +57°, ψ ≈ +47°). Glycine has expanded regions. Proline is restricted (φ ≈ −63° ± 10°).

7.2 Nucleic Acid Sugar Pucker
Ribose/deoxyribose adopts C2'-endo (B-form DNA, δ ≈ 144°) or C3'-endo (A-form DNA/RNA, δ ≈ 84°). The pseudorotation angle P and amplitude τm define pucker: C3'-endo P ≈ 18°, C2'-endo P ≈ 162°, τm ≈ 35–40°.

7.3 Metal Coordination Geometries

7.4 Common Metal–Ligand Bond Lengths

8. Chirality and Stereochemistry
   When a molecule contains stereocenters, enforce the correct handedness. For R/S assignments, use Cahn–Ingold–Prelog priority rules and place atoms accordingly. For E/Z alkenes, the higher-priority groups define the configuration. For axial chirality (allenes, biaryl atropisomers), enforce the correct torsion angle sign. For sugar and amino acid residues, use the conventional absolute configurations (D-sugars, L-amino acids) unless otherwise specified.

9. Global Consistency Rules

Ring closure: After building a ring atom-by-atom, the final bond must close to within ±0.02 Å of its target length and the ring angles must be self-consistent.
Hybridization consistency: An atom's hybridization determines its angle set. Never mix sp3 angles with sp2 bond lengths on the same atom.
Hydrogen count: Every heavy atom must have exactly the number of hydrogens required to satisfy its valence (unless charged or radical).
Formal charges: If a formal charge exists, adjust geometry accordingly (e.g., NH4+ is tetrahedral, NO2⁻ is bent ~115°, carboxylate is symmetric).
Resonance structures: For delocalized systems, use averaged bond lengths (e.g., carboxylate C–O = 1.25 Å, not one at 1.21 and one at 1.36).
Symmetry: If the molecule has symmetry (e.g., benzene D6h, methane Td), enforce identical parameters for symmetry-equivalent atoms.
Conflict priority: Bond length > Valence angle > Torsion angle > Non-bonded distance > Electrostatic optimization.

10. Output Format
    Produce output as a table of: Atom index, Element symbol, x (Å), y (Å), z (Å), along with a connectivity table listing each bond (atom pair, bond order). Optionally, also produce the Z-matrix (internal coordinates: bond length, angle, dihedral for each atom relative to previously defined atoms). Report any residual steric clashes (distance < minimum) and their severity.

PROMPT END
| Bond Type | Context / Motif | Length (Å) | Tolerance (Å) |
| C–C (sp3–sp3) | Alkane chain (ethane-like) | 1.535 | ±0.005 |
| C–C (sp3–sp3) | Cyclopropane (strained) | 1.510 | ±0.005 |
| C–C (sp3–sp3) | Cyclobutane (strained) | 1.548 | ±0.005 |
| C–C (sp3–sp3) | Neopentane (branched) | 1.537 | ±0.005 |
| C–C (sp3–sp2) | Alkyl–vinyl / alkyl–carbonyl | 1.510 | ±0.008 |
| C–C (sp2–sp2) | 1,3-Butadiene (conjugated) | 1.467 | ±0.005 |
| C=C (sp2–sp2) | Ethylene / isolated alkene | 1.337 | ±0.005 |
| C=C (sp2–sp2) | Conjugated diene (internal) | 1.349 | ±0.005 |
| C≡C (sp–sp) | Acetylene / terminal alkyne | 1.203 | ±0.003 |
| C≡C (sp–sp) | Internal alkyne | 1.210 | ±0.003 |
| C–C (aromatic) | Benzene ring | 1.397 | ±0.002 |
| C–C (aromatic) | Naphthalene (C1–C2) | 1.381 | ±0.003 |
| C–C (aromatic) | Naphthalene (C2–C3) | 1.417 | ±0.003 |
| C–C (aromatic) | Pyridine ring | 1.395 | ±0.003 |
| C–C (aromatic) | Furan ring (C2–C3) | 1.361 | ±0.003 |
| C–C (aromatic) | Furan ring (C3–C4) | 1.431 | ±0.003 |
| Bond Type | Context / Motif | Length (Å) | Tolerance |
| C(sp3)–H | Methane / alkane | 1.094 | ±0.003 |
| C(sp2)–H | Ethylene / alkene | 1.087 | ±0.003 |
| C(sp2)–H | Benzene / aromatic | 1.084 | ±0.003 |
| C(sp)–H | Acetylene / terminal alkyne | 1.063 | ±0.003 |
| C(sp2)–H | Aldehyde C–H | 1.114 | ±0.005 |
| Bond Type | Context / Motif | Length (Å) | Tolerance |
| C–O (sp3) | Alcohol / ether (methanol) | 1.430 | ±0.005 |
| C–O (sp3) | Epoxide (strained) | 1.436 | ±0.005 |
| C–O (sp2) | Ester C–O–C | 1.344 | ±0.005 |
| C–O (sp2) | Carboxylic acid C–OH | 1.355 | ±0.005 |
| C–O (phenol) | Phenol Ar–OH | 1.362 | ±0.005 |
| C=O | Aldehyde / ketone | 1.210 | ±0.005 |
| C=O | Carboxylic acid | 1.214 | ±0.005 |
| C=O | Ester carbonyl | 1.206 | ±0.005 |
| C=O | Amide carbonyl | 1.235 | ±0.005 |
| C=O | Carboxylate anion (each) | 1.250 | ±0.003 |
| Bond Type | Context / Motif | Length (Å) | Tolerance |
| C–N (sp3) | Amine (methylamine) | 1.474 | ±0.005 |
| C–N (sp2) | Amide C–N | 1.335 | ±0.005 |
| C–N (aromatic) | Pyridine C–N | 1.338 | ±0.003 |
| C–N (aromatic) | Pyrrole C–N | 1.370 | ±0.003 |
| C–N (aromatic) | Imidazole C2–N | 1.325 | ±0.005 |
| C=N | Imine / Schiff base | 1.279 | ±0.005 |
| C≡N | Nitrile | 1.158 | ±0.003 |
| C–N (guanidinium) | Guanidinium (each C–N) | 1.330 | ±0.005 |
| Bond Type | Context / Motif | Length (Å) | Tolerance |
| O–H | Water / alcohol | 0.960 | ±0.003 |
| N–H | Amine / amide | 1.010 | ±0.005 |
| S–H | Thiol | 1.340 | ±0.005 |
| C–S (sp3) | Thioether | 1.820 | ±0.005 |
| C=S | Thioketone / thioamide | 1.680 | ±0.005 |
| C–S (aromatic) | Thiophene C2–S | 1.714 | ±0.005 |
| S–S | Disulfide bridge | 2.050 | ±0.010 |
| P–O (single) | Phosphate ester | 1.593 | ±0.005 |
| P=O | Phosphoryl | 1.485 | ±0.005 |
| P–O (delocalized) | Phosphate anion (each) | 1.520 | ±0.005 |
| C–F | Fluoroalkane | 1.390 | ±0.005 |
| C–Cl | Chloroalkane | 1.781 | ±0.005 |
| C–Br | Bromoalkane | 1.945 | ±0.005 |
| C–I | Iodoalkane | 2.162 | ±0.005 |
| N=O | Nitro group (each N=O) | 1.226 | ±0.005 |
| N–O | Nitro group N–(O⁻) | 1.226 | ±0.005 |
| S=O | Sulfoxide | 1.485 | ±0.005 |
| S=O | Sulfone (each) | 1.431 | ±0.005 |
| Central Atom | Context / Motif | Angle (°) | Tolerance |
| C(sp3) | Ideal tetrahedral (methane) | 109.47 | ±0.5 |
| C(sp3) | Ethane (H–C–H) | 107.5 | ±1.0 |
| C(sp3) | Ethane (H–C–C) | 111.0 | ±1.0 |
| C(sp3) | Isopropyl (C–C–C) | 112.0 | ±1.5 |
| C(sp3) | Cyclopropane ring | 60.0 | exact |
| C(sp3) | Cyclobutane ring | 88.0 | ±2.0 |
| C(sp3) | Cyclopentane ring | 104.0 | ±3.0 |
| C(sp3) | Cyclohexane ring (chair) | 111.4 | ±0.5 |
| N(sp3) | Amine (H–N–H in NH3) | 107.0 | ±1.0 |
| N(sp3) | Amine (C–N–C in trimethylamine) | 110.9 | ±1.0 |
| O(sp3) | Water (H–O–H) | 104.5 | ±0.5 |
| O(sp3) | Ether (C–O–C, dimethyl ether) | 111.7 | ±1.0 |
| O(sp3) | Alcohol (C–O–H, methanol) | 108.5 | ±1.0 |
| S(sp3) | Thioether (C–S–C) | 99.0 | ±2.0 |
| S(sp3) | H–S–H (H2S) | 92.1 | ±0.5 |
| P(sp3) | Phosphine (H–P–H) | 93.3 | ±1.0 |
| Central Atom | Context / Motif | Angle (°) | Tolerance |
| C(sp2) | Ideal trigonal planar (BF3-like) | 120.0 | ±0.5 |
| C(sp2) | Ethylene (H–C=C) | 121.3 | ±0.5 |
| C(sp2) | Ethylene (H–C–H) | 117.4 | ±0.5 |
| C(sp2) | Aldehyde (H–C=O) | 121.8 | ±1.0 |
| C(sp2) | Aldehyde (R–C=O) | 124.0 | ±1.0 |
| C(sp2) | Ketone (C–C=O) | 121.5 | ±1.0 |
| C(sp2) | Ketone (C–C–C across carbonyl) | 117.0 | ±1.5 |
| C(sp2) | Amide (O=C–N) | 122.5 | ±1.0 |
| C(sp2) | Amide (R–C–N) | 115.0 | ±1.0 |
| C(sp2) | Carboxylic acid (O=C–O) | 123.0 | ±1.0 |
| C(sp2) | Benzene ring (internal C–C–C) | 120.0 | ±0.3 |
| C(sp2) | Pyridine ring (C–N–C) | 117.0 | ±0.5 |
| C(sp2) | Pyridine ring (N–C–C) | 123.5 | ±0.5 |
| N(sp2) | Amide (C–N–H) | 119.0 | ±1.0 |
| N(sp2) | Amide (H–N–H, primary) | 118.0 | ±1.5 |
| N(sp2) | Pyrrole N (C–N–C) | 109.8 | ±0.5 |
| Central Atom | Context / Motif | Angle (°) | Tolerance |
| C(sp) | Alkyne (R–C≡C) | 180.0 | ±0.5 |
| C(sp) | Nitrile (C–C≡N) | 180.0 | ±0.5 |
| C(sp) | Allene central C | 180.0 | ±0.5 |
| C(sp) | Isocyanate (–N=C=O) | 180.0 | ±1.0 |
| N(sp) | Azide central N | 180.0 | ±1.0 |
| Ring | Angle Position | Angle (°) | Tolerance |
| Furan | O–C2–C3 | 110.7 | ±0.5 |
| Furan | C2–C3–C4 | 106.1 | ±0.5 |
| Furan | C5–O–C2 | 106.5 | ±0.5 |
| Thiophene | S–C2–C3 | 111.5 | ±0.5 |
| Thiophene | C2–C3–C4 | 112.5 | ±0.5 |
| Thiophene | C5–S–C2 | 92.2 | ±0.5 |
| Pyrrole | N–C2–C3 | 107.7 | ±0.5 |
| Pyrrole | C2–C3–C4 | 107.4 | ±0.5 |
| Pyrrole | C5–N–C2 | 109.8 | ±0.5 |
| Imidazole | N1–C2–N3 | 112.0 | ±0.5 |
| Imidazole | C4–C5–N1 | 105.3 | ±0.5 |
| Motif (A–B–C–D) | Preferred Angle (°) | Alt. Angles (°) | Energy Barrier (kcal/mol) |
| H–C–C–H (ethane) | 180 (anti) or ±60 (gauche) | ±60 gauche | ~2.9 |
| CH3–C–C–CH3 (butane) | 180 (anti preferred) | ±65 gauche | ~3.8 |
| H–C–O–H (methanol) | 180 (anti) or ±60 (gauche) | ±60 | ~1.1 |
| C–C–O–H (ethanol) | ±180 (anti) | ±60 (gauche) | ~1.0 |
| H–C–C–OH (ethanol) | 180 (anti) | ±60 | ~1.0 |
| C–C–N–H (ethylamine) | 180 (anti) or ±60 | ±60 | ~2.0 |
| C–C–C–C (alkane chain) | 180 (anti) | ±65 | ~3.5 |
| F–C–C–F (1,2-difluoroethane) | ±60 (gauche preferred!) | 180 anti | gauche effect |
| C–C–S–H (ethanethiol) | ±60 (gauche) | 180 | ~1.3 |
| C–S–S–C (disulfide) | ±90 | — | ~8–12 |
| Motif | Preferred Angle (°) | Notes |
| H–C=C–H (ethylene) | 0 (cis) or 180 (trans) | Planar, no free rotation; specify E/Z |
| C–C=C–C (substituted alkene) | 0 or 180 | E/Z isomerism; planar within ±5° |
| C–C(=O)–C (ketone) | 0 and 180 | Carbonyl plane; substituents syn/anti |
| O=C–N–H (amide) | 0 (trans) or 180 (cis) | Trans strongly preferred (~5 kcal/mol) |
| O=C–O–H (carboxylic acid) | 0 (syn, preferred) | Syn preferred by ~5 kcal/mol |
| O=C–O–C (ester) | 0 (s-cis) or 180 (s-trans) | s-trans usually preferred |
| C–C(ar)–C(ar)–C (biphenyl) | ±44 | Twisted due to ortho H clash |
| C(ar)–C(ar)–O–H (phenol) | 0 (coplanar) | OH in ring plane |
| C(ar)–C(ar)–N–H (aniline) | ~±30–40 | Slight pyramidalization at N |
| Ring / Conformation | Torsion Pattern | Values (°) |
| Cyclohexane (chair) | All ring torsions | ±55.7 alternating +/– |
| Cyclohexane (boat) | Varies | 0, ±55, etc. |
| Cyclopentane (envelope) | 4 atoms coplanar, 1 out | ~±25–40 |
| Cyclopentane (twist) | Pseudorotation | ~25 each |
| Cycloheptane (twist-chair) | Complex | Variable, ~40–70 |
| Benzene / aromatics | All ring torsions | 0.0 (perfectly planar) |
| Pyranose (chair, 4C1) | All ring torsions | ±55–60 alternating |
| Furanose (envelope) | Similar to cyclopentane | ~±30–40 |
| Proline ring | Envelope / twist | Endo/exo pucker Cγ |
| Angle Name | Definition (A–B–C–D) | Typical Range (°) | Notes |
| φ (phi) | C(–)–N–Cα–C(=O) | –180 to +180 | Ramachandran allowed regions |
| ψ (psi) | N–Cα–C(=O)–N(+) | –180 to +180 | Ramachandran allowed regions |
| ω (omega) | Cα–C(=O)–N–Cα(+) | 180 (trans) / 0 (cis) | Trans dominant; cis ~0.03% (Pro ~5%) |
| χ1 (chi1) | N–Cα–Cβ–Cγ | ±60, 180 | Rotameric states g+, g–, t |
| α (alpha) | O3'–P–O5'–C5' | –150 to −60 | DNA/RNA backbone |
| β (beta) | P–O5'–C5'–C4' | 130 to 200 | DNA/RNA backbone |
| γ (gamma) | O5'–C5'–C4'–C3' | 30 to 90 | DNA/RNA backbone (+sc) |
| δ (delta) | C5'–C4'–C3'–O3' | 75–165 | Correlates with sugar pucker |
| ε (epsilon) | C4'–C3'–O3'–P | 160–260 | DNA/RNA backbone |
| ζ (zeta) | C3'–O3'–P–O5' | –100 to −30 | BII conformation if ~−90 |
| χ (chi, nucleic) | O4'–C1'–N9/N1–C4/C2 | anti: –170 to −60 | syn possible for purines |
| Fragment | Planarity Requirement | Max Out-of-Plane Deviation |
| Aromatic rings (benzene, pyridine, etc.) | Strictly planar | < 0.01 Å |
| Amide group (–C(=O)–NH–) | Planar (N lone pair conjugation) | < 0.05 Å |
| Carboxylate (–COO⁻) | Planar | < 0.02 Å |
| Guanidinium (–C(=NH)(NH2)2⁺) | Planar (all 3 N in plane) | < 0.03 Å |
| Nitro group (–NO2) | Planar | < 0.02 Å |
| Ester (–C(=O)–O–) | Planar (O lone pair conjugated) | < 0.05 Å |
| Urea (–NH–C(=O)–NH–) | Planar (both N conjugated) | < 0.05 Å |
| Enol form (–C=C–OH) | Planar (conjugated system) | < 0.05 Å |
| Conjugated dienes | Tend toward coplanarity (s-trans or s-cis) | < 0.1 Å within each double bond |
| Peptide bond plane | Cα(i)–C(=O)–N–Cα(i+1) planar | < 0.05 Å |
| Sp2 carbon with 3 substituents | Trigonal planar at C | Sum of angles = 360° ± 1° |
| Atom | vdW Radius (Å) | Source |
| H | 1.20 | Bondi (1964) |
| C | 1.70 | Bondi |
| N | 1.55 | Bondi |
| O | 1.52 | Bondi |
| F | 1.47 | Bondi |
| P | 1.80 | Bondi |
| S | 1.80 | Bondi |
| Cl | 1.75 | Bondi |
| Br | 1.85 | Bondi |
| I | 1.98 | Bondi |
| Atom Pair | Min Distance (Å) | Context |
| H…H | 2.00 | Non-bonded (sum vdW = 2.40, 0.83×) |
| C…H | 2.40 | Non-bonded |
| C…C | 3.00 | Non-bonded |
| C…N | 2.90 | Non-bonded |
| C…O | 2.80 | Non-bonded |
| N…N | 2.70 | Non-bonded |
| O…O | 2.60 | Non-bonded |
| H…H (1,4) | 1.80 | Geminal / 1,4 separated |
| Any (1,3) | N/A | Excluded (constrained by angle) |
| Aromatic H…ortho H | 2.00 | Critical for biphenyl-type systems |
| Type (D–H…A) | D…A Distance (Å) | H…A Distance (Å) | D–H…A Angle (°) |
| O–H…O (strong) | 2.50–2.80 | 1.50–1.90 | 160–180 |
| O–H…O (moderate) | 2.80–3.20 | 1.90–2.30 | 140–180 |
| N–H…O (amide–carbonyl) | 2.80–3.10 | 1.80–2.20 | 150–180 |
| N–H…N | 2.80–3.10 | 1.80–2.20 | 150–180 |
| O–H…N | 2.70–3.00 | 1.70–2.10 | 150–180 |
| C–H…O (weak) | 3.00–3.50 | 2.20–2.80 | 120–180 |
| N–H…S | 3.30–3.60 | 2.30–2.70 | 140–180 |
| O–H…F | 2.50–2.80 | 1.50–1.90 | 150–180 |
| Interaction Type | Geometry | Distance / Angle |
| Salt bridge (COO⁻…NH3⁺) | N…O distance | 2.70–3.50 Å; no strict angle |
| π–π stacking (parallel) | Ring centroid–centroid | 3.3–4.0 Å; offset 1.0–2.0 Å |
| π–π stacking (T-shaped) | Edge-to-face | Centroid dist ~5.0 Å; angle ~90° |
| Cation–π | Cation above ring centroid | 3.0–4.0 Å perpendicular |
| Halogen bond (C–X…Y) | σ-hole directed | X…Y: 2.8–3.5 Å; C–X…Y ~160–180° |
| Chalcogen bond (C=O…S) | σ-hole on S | O…S: 3.0–3.5 Å |
| CH–π interaction | H pointing toward ring | H…centroid: 2.5–3.0 Å |
| Lone pair–π (anion–π) | Anion over electron-poor ring | 3.0–3.5 Å perpendicular |
| Coordination Number | Geometry | Ideal Angles |
| 2 | Linear | 180° |
| 3 | Trigonal planar | 120° |
| 4 | Tetrahedral | 109.47° |
| 4 | Square planar | 90° (cis), 180° (trans) |
| 5 | Trigonal bipyramidal | 90° (ax-eq), 120° (eq-eq), 180° (ax-ax) |
| 5 | Square pyramidal | 90° (base), ~100° (apex-base) |
| 6 | Octahedral | 90° (cis), 180° (trans) |
| Metal–Ligand | Typical Length (Å) | Context |
| Fe(II)–N (porphyrin) | 2.00–2.07 | Heme group |
| Fe(III)–O | 1.80–2.10 | Oxide / hydroxide |
| Zn(II)–N (His) | 2.00–2.15 | Enzyme active site |
| Zn(II)–S (Cys) | 2.30–2.35 | Zinc finger |
| Zn(II)–O | 1.95–2.10 | Carboxylate coordination |
| Mg(II)–O (water) | 2.05–2.15 | Hydrated ion |
| Ca(II)–O | 2.30–2.50 | EF-hand proteins |
| Cu(II)–N | 1.95–2.05 | Blue copper proteins |
| Cu(I)–S | 2.10–2.25 | Cupredoxins |
| Pt(II)–N | 2.00–2.05 | Cisplatin-type |
| Pt(II)–Cl | 2.30–2.33 | Cisplatin-type |
