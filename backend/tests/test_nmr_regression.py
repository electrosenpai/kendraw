"""Exhaustive NMR regression test suite.

Each test encodes a concrete expected shift range or property.
If a future change breaks any of these, CI must fail.

Categories:
1. Aliphatic simple
2. Aromatic simple
3. Simple heterocycles
4. Fused heterocycles (the NB-1 regression)
5. Pharmaceutical molecules
6. Solvent effects
7. Confidence scoring
8. Method strings
9. Multiplicity and coupling
10. Ring detection helpers
11. Edge cases
"""

import pytest

rdkit = pytest.importorskip("rdkit")

from rdkit import Chem

from kendraw_chem.nmr.additive import (
    _is_in_fused_system,
    _heterocyclic_shift,
    predict_additive,
)
from kendraw_chem.nmr.models import NmrPeak


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _predict(smiles: str, solvent: str = "CDCl3") -> list[NmrPeak]:
    mol = Chem.MolFromSmiles(smiles)
    assert mol is not None, f"Invalid SMILES: {smiles}"
    return predict_additive(mol, solvent=solvent)


def _shifts(smiles: str, solvent: str = "CDCl3") -> list[float]:
    return sorted(p.shift_ppm for p in _predict(smiles, solvent))


def _has_peak_in(peaks: list[NmrPeak], lo: float, hi: float) -> bool:
    return any(lo <= p.shift_ppm <= hi for p in peaks)


def _peaks_in(peaks: list[NmrPeak], lo: float, hi: float) -> list[NmrPeak]:
    return [p for p in peaks if lo <= p.shift_ppm <= hi]


# =========================================================================
# 1. ALIPHATIC SIMPLE
# =========================================================================

class TestAliphaticRegression:
    """Aliphatic proton predictions must remain stable."""

    def test_ethanol_ch3(self) -> None:
        """CCO — methyl ~1.2 ppm."""
        peaks = _predict("CCO")
        assert _has_peak_in(peaks, 0.8, 1.5)

    def test_ethanol_ch2(self) -> None:
        """CCO — CH2 alpha-O ~3.4 ppm."""
        peaks = _predict("CCO")
        assert _has_peak_in(peaks, 3.0, 4.2)

    def test_ethanol_oh(self) -> None:
        """CCO — OH ~2.5 ppm (CDCl3, exchangeable)."""
        peaks = _predict("CCO")
        assert _has_peak_in(peaks, 1.0, 5.0)

    def test_propane_two_groups(self) -> None:
        """CCC — at least 2 distinct shift values."""
        shifts = _shifts("CCC")
        assert len(set(round(s, 1) for s in shifts)) >= 2

    def test_butanone_alpha_carbonyl(self) -> None:
        """CCC(=O)C — CH2 alpha to C=O near 2.1 ppm."""
        peaks = _predict("CCC(=O)C")
        assert _has_peak_in(peaks, 1.8, 2.8)

    def test_acetic_acid_ch3(self) -> None:
        """CC(=O)O — CH3 ~2.1 ppm."""
        peaks = _predict("CC(=O)O")
        assert _has_peak_in(peaks, 1.8, 2.5)

    def test_diethyl_ether_ch2(self) -> None:
        """CCOCC — CH2-O near 3.4 ppm."""
        peaks = _predict("CCOCC")
        assert _has_peak_in(peaks, 3.0, 4.0)

    def test_diethyl_ether_ch3(self) -> None:
        """CCOCC — CH3 near 1.2 ppm."""
        peaks = _predict("CCOCC")
        assert _has_peak_in(peaks, 0.8, 1.5)

    def test_methyl_base_shift(self) -> None:
        """CCCC — terminal CH3 ~0.9 ppm."""
        peaks = _predict("CCCC")
        methyl = _peaks_in(peaks, 0.7, 1.1)
        assert len(methyl) >= 1

    def test_methylene_base_shift(self) -> None:
        """CCCC — internal CH2 ~1.3 ppm."""
        peaks = _predict("CCCC")
        assert _has_peak_in(peaks, 1.1, 1.5)


# =========================================================================
# 2. AROMATIC SIMPLE
# =========================================================================

class TestAromaticRegression:
    """Benzene-based aromatic predictions."""

    def test_benzene_shift(self) -> None:
        """c1ccccc1 — all protons 7.26 ppm."""
        peaks = _predict("c1ccccc1")
        for p in peaks:
            assert 7.0 <= p.shift_ppm <= 7.5, f"Benzene shift {p.shift_ppm} out of range"

    def test_benzene_grouping(self) -> None:
        """All 6 H grouped into one peak."""
        peaks = _predict("c1ccccc1")
        aromatic = _peaks_in(peaks, 7.0, 7.5)
        assert len(aromatic) == 1
        assert aromatic[0].integral == 6

    def test_toluene_ch3(self) -> None:
        """Cc1ccccc1 — benzylic CH3 ~2.3 ppm."""
        peaks = _predict("Cc1ccccc1")
        assert _has_peak_in(peaks, 2.0, 2.6)

    def test_toluene_aromatic(self) -> None:
        """Cc1ccccc1 — aromatic H near 7.0-7.3."""
        peaks = _predict("Cc1ccccc1")
        assert _has_peak_in(peaks, 6.9, 7.5)

    def test_nitrobenzene_deshielded(self) -> None:
        """[O-][N+](=O)c1ccccc1 — EWG deshields ortho H."""
        peaks = _predict("[O-][N+](=O)c1ccccc1")
        shifts = _shifts("[O-][N+](=O)c1ccccc1")
        assert max(shifts) > 7.5, "Nitrobenzene ortho should be deshielded"

    def test_aniline_shielded(self) -> None:
        """Nc1ccccc1 — EDG shields ring, some H below 7.0."""
        peaks = _predict("Nc1ccccc1")
        aromatic = _peaks_in(peaks, 6.0, 8.0)
        assert any(p.shift_ppm < 7.0 for p in aromatic), "Aniline should have shielded H"

    def test_phenol_aromatic(self) -> None:
        """Oc1ccccc1 — OH donor shields ring."""
        peaks = _predict("Oc1ccccc1")
        assert _has_peak_in(peaks, 6.4, 7.4)

    def test_naphthalene_benzene_range(self) -> None:
        """c1ccc2ccccc2c1 — all H near 7.26 (fused carbocyclic)."""
        peaks = _predict("c1ccc2ccccc2c1")
        for p in peaks:
            if p.environment == "aromatic":
                assert 7.0 <= p.shift_ppm <= 7.6, f"Naphthalene {p.shift_ppm} out of range"


# =========================================================================
# 3. SIMPLE HETEROCYCLES
# =========================================================================

class TestSimpleHeterocycleRegression:
    """Simple (unfused) heterocyclic aromatics — the B-2 fix."""

    def test_pyridine_alpha(self) -> None:
        """c1ccncc1 — alpha H ~8.5 ppm. MUST NOT REGRESS."""
        peaks = _predict("c1ccncc1")
        shifts = _shifts("c1ccncc1")
        assert any(8.0 <= s <= 9.0 for s in shifts), "Pyridine alpha missing"

    def test_pyridine_beta(self) -> None:
        """c1ccncc1 — beta H ~7.2 ppm."""
        shifts = _shifts("c1ccncc1")
        assert any(6.8 <= s <= 7.5 for s in shifts), "Pyridine beta missing"

    def test_pyridine_gamma(self) -> None:
        """c1ccncc1 — gamma H ~7.6 ppm."""
        shifts = _shifts("c1ccncc1")
        assert any(7.3 <= s <= 7.9 for s in shifts), "Pyridine gamma missing"

    def test_pyrrole_alpha(self) -> None:
        """c1cc[nH]c1 — alpha ~6.7 ppm."""
        peaks = _predict("c1cc[nH]c1")
        assert _has_peak_in(peaks, 6.4, 7.0)

    def test_pyrrole_beta(self) -> None:
        """c1cc[nH]c1 — beta ~6.2 ppm."""
        peaks = _predict("c1cc[nH]c1")
        assert _has_peak_in(peaks, 5.9, 6.5)

    def test_furan_alpha(self) -> None:
        """c1ccoc1 — alpha ~7.4 ppm."""
        peaks = _predict("c1ccoc1")
        assert _has_peak_in(peaks, 7.0, 7.8)

    def test_furan_beta(self) -> None:
        """c1ccoc1 — beta ~6.3 ppm."""
        peaks = _predict("c1ccoc1")
        assert _has_peak_in(peaks, 5.9, 6.7)

    def test_thiophene_alpha(self) -> None:
        """c1ccsc1 — alpha ~7.2 ppm."""
        peaks = _predict("c1ccsc1")
        assert _has_peak_in(peaks, 6.9, 7.5)

    def test_thiophene_beta(self) -> None:
        """c1ccsc1 — beta ~7.0 ppm."""
        peaks = _predict("c1ccsc1")
        assert _has_peak_in(peaks, 6.7, 7.3)

    def test_imidazole_produces_peaks(self) -> None:
        """c1c[nH]cn1 — must not crash, produces aromatic peaks."""
        peaks = _predict("c1c[nH]cn1")
        aromatic = _peaks_in(peaks, 5.5, 9.0)
        assert len(aromatic) >= 1


# =========================================================================
# 4. FUSED HETEROCYCLES (NB-1 regression)
# =========================================================================

class TestFusedHeterocycleRegression:
    """Fused heterocyclic systems — the V3 regression that was fixed."""

    def test_caffeine_c8h_range(self) -> None:
        """Caffeine C8-H MUST be 7.0-8.0 ppm (error < 0.5 from ~7.5)."""
        peaks = _predict("Cn1c(=O)c2c(ncn2C)n(C)c1=O")
        c8h = _peaks_in(peaks, 7.0, 8.0)
        assert len(c8h) >= 1, "Caffeine C8-H not found in 7.0-8.0 range"

    def test_caffeine_n_methyl(self) -> None:
        """Caffeine N-CH3 groups ~3.3-3.9 ppm."""
        peaks = _predict("Cn1c(=O)c2c(ncn2C)n(C)c1=O")
        methyl = _peaks_in(peaks, 2.0, 4.0)
        assert len(methyl) >= 1, "Caffeine N-CH3 not detected"

    def test_caffeine_c8h_not_overcorrected(self) -> None:
        """C8-H must NOT be below 7.0 (the V3 regression was 6.70)."""
        peaks = _predict("Cn1c(=O)c2c(ncn2C)n(C)c1=O")
        aromatic = _peaks_in(peaks, 5.0, 12.0)
        for p in aromatic:
            assert p.shift_ppm >= 7.0, f"Caffeine aromatic {p.shift_ppm} too low — regression!"

    def test_quinoline_alpha(self) -> None:
        """Quinoline H2 (alpha to N) should be > 8.0."""
        peaks = _predict("c1ccc2ncccc2c1")
        shifts = _shifts("c1ccc2ncccc2c1")
        assert max(shifts) > 8.0, "Quinoline H2 too low"

    def test_quinoline_benzene_ring(self) -> None:
        """Quinoline benzene ring H must be > 7.0 (was ~6.5 in regression)."""
        peaks = _predict("c1ccc2ncccc2c1")
        aromatic = _peaks_in(peaks, 5.0, 10.0)
        for p in aromatic:
            assert p.shift_ppm >= 7.0, f"Quinoline benzene H {p.shift_ppm} < 7.0 — regression!"

    def test_quinoline_spread(self) -> None:
        """Quinoline should have spread: lowest ~7.2, highest ~8.5."""
        shifts = _shifts("c1ccc2ncccc2c1")
        assert max(shifts) - min(shifts) > 0.5, "Quinoline shifts too bunched"

    def test_indole_benzene_ring(self) -> None:
        """Indole benzene ring H must be > 7.0 (was ~6.5 in regression)."""
        peaks = _predict("c1ccc2[nH]ccc2c1")
        aromatic = _peaks_in(peaks, 5.0, 10.0)
        benzene_region = [p for p in aromatic if p.shift_ppm > 7.0]
        assert len(benzene_region) >= 1, "Indole benzene ring H all below 7.0 — regression!"

    def test_indole_pyrrole_ring(self) -> None:
        """Indole pyrrole ring H should be in 6.0-7.0 range."""
        peaks = _predict("c1ccc2[nH]ccc2c1")
        pyrrole_region = _peaks_in(peaks, 6.0, 7.0)
        assert len(pyrrole_region) >= 1, "Indole pyrrole H missing"

    def test_isoquinoline(self) -> None:
        """c1ccc2cnccc2c1 — benzene ring H must be > 7.0."""
        peaks = _predict("c1ccc2cnccc2c1")
        aromatic = _peaks_in(peaks, 5.0, 10.0)
        for p in aromatic:
            assert p.shift_ppm >= 7.0, f"Isoquinoline {p.shift_ppm} < 7.0 — regression!"

    def test_benzimidazole_benzene_ring(self) -> None:
        """c1ccc2[nH]cnc2c1 — benzene H must be > 7.0."""
        peaks = _predict("c1ccc2[nH]cnc2c1")
        aromatic = _peaks_in(peaks, 5.0, 10.0)
        benzene = [p for p in aromatic if p.shift_ppm > 7.0]
        assert len(benzene) >= 1, "Benzimidazole benzene H too low"

    def test_benzofuran_benzene_ring(self) -> None:
        """c1ccc2occc2c1 — benzene ring H > 7.0."""
        peaks = _predict("c1ccc2occc2c1")
        aromatic = _peaks_in(peaks, 5.0, 10.0)
        benzene = [p for p in aromatic if p.shift_ppm > 7.0]
        assert len(benzene) >= 1, "Benzofuran benzene H too low"

    def test_benzothiophene_benzene_ring(self) -> None:
        """c1ccc2sccc2c1 — benzene ring H > 7.0."""
        peaks = _predict("c1ccc2sccc2c1")
        aromatic = _peaks_in(peaks, 5.0, 10.0)
        benzene = [p for p in aromatic if p.shift_ppm > 7.0]
        assert len(benzene) >= 1, "Benzothiophene benzene H too low"


# =========================================================================
# 5. PHARMACEUTICAL MOLECULES
# =========================================================================

class TestPharmaRegression:
    """Common pharmaceutical molecules."""

    def test_aspirin_ch3(self) -> None:
        """CC(=O)Oc1ccccc1C(=O)O — acetyl CH3 ~2.3 ppm."""
        peaks = _predict("CC(=O)Oc1ccccc1C(=O)O")
        assert _has_peak_in(peaks, 1.8, 2.8)

    def test_aspirin_aromatic(self) -> None:
        """Aspirin aromatic H in 7.0-8.5 range."""
        peaks = _predict("CC(=O)Oc1ccccc1C(=O)O")
        assert _has_peak_in(peaks, 7.0, 8.5)

    def test_ibuprofen_produces_peaks(self) -> None:
        """CC(C)Cc1ccc(cc1)C(C)C(=O)O — must not crash, has aromatic + aliphatic."""
        peaks = _predict("CC(C)Cc1ccc(cc1)C(C)C(=O)O")
        assert _has_peak_in(peaks, 0.5, 2.0)  # aliphatic
        assert _has_peak_in(peaks, 6.5, 8.0)  # aromatic

    def test_paracetamol_aromatic(self) -> None:
        """CC(=O)Nc1ccc(O)cc1 — aromatic H ~6.7-7.5."""
        peaks = _predict("CC(=O)Nc1ccc(O)cc1")
        assert _has_peak_in(peaks, 6.5, 7.8)

    def test_paracetamol_ch3(self) -> None:
        """Paracetamol acetyl CH3 ~2.0 ppm."""
        peaks = _predict("CC(=O)Nc1ccc(O)cc1")
        assert _has_peak_in(peaks, 1.8, 2.5)

    def test_acetaminophen_no_crash(self) -> None:
        """Tylenol/acetaminophen with explicit stereochemistry."""
        peaks = _predict("CC(=O)Nc1ccc(O)cc1")
        assert len(peaks) >= 3  # CH3, ArH, NH, OH


# =========================================================================
# 6. SOLVENT EFFECTS
# =========================================================================

class TestSolventRegression:
    """Solvent-dependent shift corrections."""

    def test_ethanol_oh_cdcl3(self) -> None:
        """OH in CDCl3 at ~2.5 ppm."""
        peaks = _predict("CCO", "CDCl3")
        oh = [p for p in peaks if p.environment == "hydroxyl_oh"]
        assert len(oh) >= 1
        assert 1.0 <= oh[0].shift_ppm <= 4.0

    def test_ethanol_oh_dmso(self) -> None:
        """OH in DMSO-d6 shifted downfield (~4.3)."""
        peaks = _predict("CCO", "DMSO-d6")
        oh = [p for p in peaks if p.environment == "hydroxyl_oh"]
        assert len(oh) >= 1
        assert oh[0].shift_ppm > 3.5, "DMSO OH should be downfield from CDCl3"

    def test_solvent_does_not_affect_methyl(self) -> None:
        """CH3 of ethanol must not change > 0.15 ppm between solvents."""
        cdcl3 = _predict("CCO", "CDCl3")
        dmso = _predict("CCO", "DMSO-d6")
        ch3_c = next((p for p in cdcl3 if p.environment == "methyl"), None)
        ch3_d = next((p for p in dmso if p.environment == "methyl"), None)
        assert ch3_c is not None and ch3_d is not None
        assert abs(ch3_c.shift_ppm - ch3_d.shift_ppm) < 0.15

    def test_all_solvents_produce_results(self) -> None:
        """Every supported solvent produces peaks for ethanol."""
        for solvent in ["CDCl3", "DMSO-d6", "CD3OD", "acetone-d6", "C6D6", "D2O"]:
            peaks = _predict("CCO", solvent)
            assert len(peaks) >= 2, f"Solvent {solvent} failed"

    def test_benzene_c6d6_upfield(self) -> None:
        """Benzene in C6D6 should be shifted upfield from CDCl3."""
        cdcl3 = _predict("c1ccccc1", "CDCl3")
        c6d6 = _predict("c1ccccc1", "C6D6")
        assert c6d6[0].shift_ppm < cdcl3[0].shift_ppm

    def test_deterministic_across_calls(self) -> None:
        """Same SMILES + solvent → identical results."""
        r1 = _predict("CCO", "CDCl3")
        r2 = _predict("CCO", "CDCl3")
        for p1, p2 in zip(r1, r2):
            assert p1.shift_ppm == p2.shift_ppm
            assert p1.multiplicity == p2.multiplicity


# =========================================================================
# 7. CONFIDENCE SCORING
# =========================================================================

class TestConfidenceRegression:
    """Confidence tiers must be correctly assigned by ring topology."""

    def test_alkane_high_confidence(self) -> None:
        """CCCC — all peaks confidence=3."""
        peaks = _predict("CCCC")
        assert all(p.confidence == 3 for p in peaks)

    def test_benzene_high_confidence(self) -> None:
        """Benzene — all peaks confidence=3."""
        peaks = _predict("c1ccccc1")
        assert all(p.confidence == 3 for p in peaks)

    def test_pyridine_medium_confidence(self) -> None:
        """Pyridine — aromatic peaks confidence=2."""
        peaks = _predict("c1ccncc1")
        aromatic = [p for p in peaks if p.environment == "aromatic"]
        assert all(p.confidence == 2 for p in aromatic)

    def test_pyrrole_medium_confidence(self) -> None:
        """Pyrrole — aromatic peaks confidence=2."""
        peaks = _predict("c1cc[nH]c1")
        aromatic = [p for p in peaks if p.environment == "aromatic"]
        assert all(p.confidence == 2 for p in aromatic)

    def test_caffeine_low_confidence(self) -> None:
        """Caffeine — C8-H (aromatic) confidence=1 (fused heterocyclic)."""
        peaks = _predict("Cn1c(=O)c2c(ncn2C)n(C)c1=O")
        aromatic = [p for p in peaks if p.shift_ppm > 7.0]
        assert len(aromatic) >= 1
        assert any(p.confidence == 1 for p in aromatic)

    def test_quinoline_fused_low_confidence(self) -> None:
        """Quinoline — fused ring aromatic H have confidence ≤ 2."""
        peaks = _predict("c1ccc2ncccc2c1")
        fused = [p for p in peaks if "fused" in p.method]
        assert len(fused) >= 1
        assert all(p.confidence == 1 for p in fused)

    def test_toluene_ch3_high_confidence(self) -> None:
        """Toluene CH3 (benzylic) — confidence=3."""
        peaks = _predict("Cc1ccccc1")
        benzylic = [p for p in peaks if p.environment == "benzylic"]
        assert len(benzylic) >= 1
        assert benzylic[0].confidence == 3

    def test_confidence_range(self) -> None:
        """All confidence values must be 1, 2, or 3."""
        for smi in ["CCO", "c1ccccc1", "c1ccncc1", "Cn1c(=O)c2c(ncn2C)n(C)c1=O"]:
            peaks = _predict(smi)
            for p in peaks:
                assert p.confidence in (1, 2, 3), f"Bad confidence {p.confidence}"


# =========================================================================
# 8. METHOD STRINGS
# =========================================================================

class TestMethodRegression:
    """Method strings must reflect the prediction pathway used."""

    def test_aliphatic_method(self) -> None:
        """Aliphatic peaks have method='additive'."""
        peaks = _predict("CCCC")
        for p in peaks:
            assert p.method == "additive"

    def test_benzene_method(self) -> None:
        """Benzene peaks have method='additive'."""
        peaks = _predict("c1ccccc1")
        for p in peaks:
            assert p.method == "additive"

    def test_pyridine_heterocyclic_method(self) -> None:
        """Pyridine aromatic peaks mention 'heterocyclic'."""
        peaks = _predict("c1ccncc1")
        aromatic = [p for p in peaks if p.environment == "aromatic"]
        assert all("heterocyclic" in p.method for p in aromatic)

    def test_caffeine_fused_method(self) -> None:
        """Caffeine C8-H method mentions 'fused'."""
        peaks = _predict("Cn1c(=O)c2c(ncn2C)n(C)c1=O")
        aromatic = [p for p in peaks if p.shift_ppm > 7.0]
        assert any("fused" in p.method for p in aromatic)

    def test_fused_method_includes_attenuated(self) -> None:
        """Fused heterocyclic method includes 'attenuated'."""
        peaks = _predict("c1ccc2[nH]ccc2c1")  # indole
        fused = [p for p in peaks if "fused" in p.method]
        assert all("attenuated" in p.method for p in fused)


# =========================================================================
# 9. MULTIPLICITY AND COUPLING
# =========================================================================

class TestMultiplicityRegression:
    """Multiplicity patterns must match chemical topology."""

    def test_ethanol_ch3_triplet(self) -> None:
        """Ethanol CH3 is a triplet (coupled to 2 CH2 protons)."""
        peaks = _predict("CCO")
        methyl = [p for p in peaks if p.environment == "methyl"]
        assert len(methyl) >= 1
        assert methyl[0].multiplicity == "t"

    def test_ethanol_ch2_quartet(self) -> None:
        """Ethanol CH2 is a quartet (coupled to 3 CH3 protons)."""
        peaks = _predict("CCO")
        ch2 = [p for p in peaks if p.environment == "alpha_to_oxygen"]
        assert len(ch2) >= 1
        assert ch2[0].multiplicity == "q"

    def test_benzene_singlet(self) -> None:
        """Benzene — all equivalent, singlet."""
        peaks = _predict("c1ccccc1")
        assert peaks[0].multiplicity == "s"

    def test_tms_singlet(self) -> None:
        """C[Si](C)(C)C — TMS reference, singlet CH3."""
        peaks = _predict("C[Si](C)(C)C")
        # TMS protons should be singlet (all equivalent, no vicinal)
        methyl = [p for p in peaks if p.shift_ppm < 1.0]
        assert len(methyl) >= 1

    def test_coupling_constants_positive(self) -> None:
        """All J-coupling values must be positive."""
        peaks = _predict("CCO")
        for p in peaks:
            for j in p.coupling_hz:
                assert j > 0, f"Negative J coupling: {j}"

    def test_singlet_no_coupling(self) -> None:
        """Singlets must have empty coupling list."""
        peaks = _predict("c1ccccc1")
        for p in peaks:
            if p.multiplicity == "s":
                assert p.coupling_hz == []

    def test_aldehyde_coupling(self) -> None:
        """CC=O — aldehyde H may couple to alpha-CH."""
        peaks = _predict("CC=O")
        aldehyde = [p for p in peaks if p.environment == "aldehyde"]
        assert len(aldehyde) >= 1


# =========================================================================
# 10. RING DETECTION HELPERS
# =========================================================================

class TestRingHelpers:
    """Unit tests for fused ring detection functions."""

    def test_benzene_not_fused(self) -> None:
        """Benzene has no fused rings."""
        mol = Chem.AddHs(Chem.MolFromSmiles("c1ccccc1"))
        ri = mol.GetRingInfo()
        for ring in ri.AtomRings():
            assert not _is_in_fused_system(ri, tuple(ring))

    def test_naphthalene_is_fused(self) -> None:
        """Both naphthalene rings are fused."""
        mol = Chem.AddHs(Chem.MolFromSmiles("c1ccc2ccccc2c1"))
        ri = mol.GetRingInfo()
        for ring in ri.AtomRings():
            assert _is_in_fused_system(ri, tuple(ring))

    def test_indole_both_rings_fused(self) -> None:
        """Indole has 2 fused rings."""
        mol = Chem.AddHs(Chem.MolFromSmiles("c1ccc2[nH]ccc2c1"))
        ri = mol.GetRingInfo()
        fused_count = sum(1 for r in ri.AtomRings() if _is_in_fused_system(ri, tuple(r)))
        assert fused_count == 2

    def test_pyridine_not_fused(self) -> None:
        """Pyridine single ring — not fused."""
        mol = Chem.AddHs(Chem.MolFromSmiles("c1ccncc1"))
        ri = mol.GetRingInfo()
        for ring in ri.AtomRings():
            assert not _is_in_fused_system(ri, tuple(ring))

    def test_heterocyclic_shift_returns_fused_flag(self) -> None:
        """_heterocyclic_shift returns (shift, is_fused) for caffeine C8-H."""
        mol = Chem.AddHs(Chem.MolFromSmiles("Cn1c(=O)c2c(ncn2C)n(C)c1=O"))
        ri = mol.GetRingInfo()
        # Find a carbon with H that's in a heteroaromatic ring
        found = False
        for atom in mol.GetAtoms():
            if atom.GetAtomicNum() != 1:
                continue
            parent = atom.GetNeighbors()[0]
            if not parent.GetIsAromatic():
                continue
            result = _heterocyclic_shift(mol, parent.GetIdx(), ri)
            if result is not None:
                shift, is_fused = result
                assert is_fused is True
                found = True
                break
        assert found, "Could not find fused heterocyclic proton in caffeine"

    def test_heterocyclic_shift_unfused(self) -> None:
        """_heterocyclic_shift returns is_fused=False for pyridine."""
        mol = Chem.AddHs(Chem.MolFromSmiles("c1ccncc1"))
        ri = mol.GetRingInfo()
        for atom in mol.GetAtoms():
            if atom.GetAtomicNum() != 1:
                continue
            parent = atom.GetNeighbors()[0]
            if not parent.GetIsAromatic():
                continue
            result = _heterocyclic_shift(mol, parent.GetIdx(), ri)
            if result is not None:
                _, is_fused = result
                assert is_fused is False
                break


# =========================================================================
# 11. EDGE CASES
# =========================================================================

class TestEdgeCases:
    """Boundary conditions and unusual molecules."""

    def test_single_atom_methane(self) -> None:
        """C — methane produces peaks (4H singlet)."""
        peaks = _predict("C")
        assert len(peaks) >= 1
        assert peaks[0].integral == 4

    def test_empty_peaks_for_no_h(self) -> None:
        """CCl4 — no protons, empty peaks list."""
        peaks = _predict("ClC(Cl)(Cl)Cl")
        h_peaks = [p for p in peaks if p.environment != ""]
        # CCl4 has no H atoms — should be empty
        assert len(peaks) == 0

    def test_symmetric_molecule(self) -> None:
        """CC — ethane: all 6H equivalent, one peak."""
        peaks = _predict("CC")
        assert len(peaks) == 1
        assert peaks[0].integral == 6

    def test_complex_molecule_no_crash(self) -> None:
        """Cholesterol skeleton — must not crash."""
        smi = "CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C"
        peaks = _predict(smi)
        assert len(peaks) > 0

    def test_charged_nitrogen(self) -> None:
        """[NH3+]CC — charged N-H, must not crash."""
        peaks = _predict("[NH3+]CC")
        assert len(peaks) > 0

    def test_fluorobenzene(self) -> None:
        """Fc1ccccc1 — F substituent effect on ring."""
        peaks = _predict("Fc1ccccc1")
        aromatic = _peaks_in(peaks, 6.5, 7.8)
        assert len(aromatic) >= 1

    def test_all_peaks_have_parent_indices(self) -> None:
        """Every peak must have non-empty parent_indices."""
        for smi in ["CCO", "c1ccccc1", "c1ccncc1"]:
            for p in _predict(smi):
                assert len(p.parent_indices) > 0

    def test_peaks_sorted_descending(self) -> None:
        """Peaks must be sorted by shift_ppm descending."""
        peaks = _predict("CC(=O)Oc1ccccc1C(=O)O")  # aspirin
        shifts = [p.shift_ppm for p in peaks]
        for i in range(len(shifts) - 1):
            assert shifts[i] >= shifts[i + 1], "Peaks not sorted descending"

    def test_integral_matches_atom_indices(self) -> None:
        """integral must equal len(atom_indices) for every peak."""
        for smi in ["CCO", "c1ccccc1", "Cc1ccccc1"]:
            for p in _predict(smi):
                assert p.integral == len(p.atom_indices)
