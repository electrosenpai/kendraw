"""NMR benchmark tests — 5 reference molecules with known experimental data.

Validates shift ranges, multiplicity, and integral counts against
established NMR reference values (NMRShiftDB2, SDBS).
"""

import pytest

rdkit = pytest.importorskip("rdkit")

from rdkit import Chem  # noqa: E402

from kendraw_chem.nmr.additive import predict_additive  # noqa: E402


def _predict(smiles: str, solvent: str = "CDCl3"):
    mol = Chem.MolFromSmiles(smiles)
    return predict_additive(mol, solvent=solvent)


def _find_peak_in_range(peaks, lo: float, hi: float):
    """Find a peak with shift_ppm in [lo, hi]."""
    for p in peaks:
        if lo <= p.shift_ppm <= hi:
            return p
    return None


# -----------------------------------------------------------------------
# Ethanol (CCO)
# Expected: CH3 triplet ~1.18, CH2 quartet ~3.69, OH singlet ~2.5 (CDCl3)
# -----------------------------------------------------------------------


class TestEthanol:
    def setup_method(self) -> None:
        self.peaks = _predict("CCO")

    def test_three_distinct_signals(self) -> None:
        assert len(self.peaks) == 3

    def test_methyl_shift_range(self) -> None:
        p = _find_peak_in_range(self.peaks, 0.5, 1.5)
        assert p is not None, "Missing methyl peak in 0.5-1.5 ppm"
        assert p.integral == 3

    def test_methyl_multiplicity(self) -> None:
        p = _find_peak_in_range(self.peaks, 0.5, 1.5)
        assert p is not None
        assert p.multiplicity == "t", f"Expected triplet, got {p.multiplicity}"

    def test_methylene_shift_range(self) -> None:
        p = _find_peak_in_range(self.peaks, 2.8, 4.2)
        assert p is not None, "Missing CH2 peak in 2.8-4.2 ppm"
        assert p.integral == 2

    def test_methylene_multiplicity(self) -> None:
        p = _find_peak_in_range(self.peaks, 2.8, 4.2)
        assert p is not None
        assert p.multiplicity == "q", f"Expected quartet, got {p.multiplicity}"

    def test_hydroxyl_present(self) -> None:
        # OH can overlap with other peaks, just check it exists
        oh_peaks = [p for p in self.peaks if p.environment == "hydroxyl_oh"]
        assert len(oh_peaks) == 1
        assert oh_peaks[0].multiplicity == "s"
        assert oh_peaks[0].integral == 1

    def test_total_integral(self) -> None:
        total = sum(p.integral for p in self.peaks)
        assert total == 6  # 3 + 2 + 1


# -----------------------------------------------------------------------
# Isopropanol (CC(C)O)
# Expected: 2xCH3 doublet ~1.15, CH septet ~3.83, OH singlet
# -----------------------------------------------------------------------


class TestIsopropanol:
    def setup_method(self) -> None:
        self.peaks = _predict("CC(C)O")

    def test_signal_count(self) -> None:
        assert len(self.peaks) >= 2  # At least CH3 + CH + OH

    def test_equivalent_methyls(self) -> None:
        p = _find_peak_in_range(self.peaks, 0.5, 1.5)
        assert p is not None
        assert p.integral == 6, f"Expected 6H for equivalent methyls, got {p.integral}"

    def test_methyl_multiplicity(self) -> None:
        p = _find_peak_in_range(self.peaks, 0.5, 1.5)
        assert p is not None
        assert p.multiplicity == "d", f"Expected doublet, got {p.multiplicity}"

    def test_methine_shift_range(self) -> None:
        p = _find_peak_in_range(self.peaks, 2.8, 4.5)
        assert p is not None, "Missing CH peak in 2.8-4.5 ppm"
        assert p.integral == 1

    def test_methine_multiplicity(self) -> None:
        p = _find_peak_in_range(self.peaks, 2.8, 4.5)
        assert p is not None
        assert p.multiplicity == "sept", f"Expected septet, got {p.multiplicity}"


# -----------------------------------------------------------------------
# Acetaldehyde (CC=O)
# Expected: CH3 doublet ~2.20, CHO quartet ~9.79
# -----------------------------------------------------------------------


class TestAcetaldehyde:
    def setup_method(self) -> None:
        self.peaks = _predict("CC=O")

    def test_two_signals(self) -> None:
        assert len(self.peaks) == 2

    def test_methyl_shift(self) -> None:
        p = _find_peak_in_range(self.peaks, 1.5, 3.5)
        assert p is not None
        assert p.integral == 3

    def test_methyl_multiplicity(self) -> None:
        p = _find_peak_in_range(self.peaks, 1.5, 3.5)
        assert p is not None
        assert p.multiplicity == "d", f"Expected doublet, got {p.multiplicity}"

    def test_aldehyde_shift(self) -> None:
        p = _find_peak_in_range(self.peaks, 9.0, 10.5)
        assert p is not None, "Missing aldehyde peak in 9-10.5 ppm"
        assert p.integral == 1

    def test_aldehyde_multiplicity(self) -> None:
        p = _find_peak_in_range(self.peaks, 9.0, 10.5)
        assert p is not None
        assert p.multiplicity == "q", f"Expected quartet, got {p.multiplicity}"


# -----------------------------------------------------------------------
# Ethyl Acetate (CCOC(C)=O)
# Expected: CH3 triplet ~1.26, OCH2 quartet ~4.12, COCH3 singlet ~2.05
# -----------------------------------------------------------------------


class TestEthylAcetate:
    def setup_method(self) -> None:
        self.peaks = _predict("CCOC(C)=O")

    def test_three_signals(self) -> None:
        assert len(self.peaks) == 3

    def test_terminal_methyl(self) -> None:
        """Terminal CH3 should be a triplet around 1.0-1.5 ppm."""
        p = _find_peak_in_range(self.peaks, 0.5, 1.6)
        assert p is not None, "Missing terminal methyl peak"
        assert p.integral == 3
        assert p.multiplicity == "t", f"Expected triplet, got {p.multiplicity}"

    def test_oxy_methylene(self) -> None:
        """OCH2 should be a quartet around 3.0-4.6 ppm."""
        p = _find_peak_in_range(self.peaks, 3.0, 4.8)
        assert p is not None, "Missing OCH2 peak"
        assert p.integral == 2
        assert p.multiplicity == "q", f"Expected quartet, got {p.multiplicity}"

    def test_acetyl_singlet(self) -> None:
        """COCH3 should be a singlet around 1.8-3.0 ppm."""
        acetyl = [p for p in self.peaks if p.multiplicity == "s" and p.integral == 3]
        assert len(acetyl) >= 1, "Missing acetyl singlet"
        assert 1.5 <= acetyl[0].shift_ppm <= 3.5


# -----------------------------------------------------------------------
# tert-Butanol (CC(C)(C)O)
# Expected: 3xCH3 singlet ~1.28, OH singlet
# -----------------------------------------------------------------------


class TestTertButanol:
    def setup_method(self) -> None:
        self.peaks = _predict("CC(C)(C)O")

    def test_signal_count(self) -> None:
        assert len(self.peaks) >= 2  # tert-butyl + OH

    def test_tert_butyl_singlet(self) -> None:
        p = _find_peak_in_range(self.peaks, 0.5, 1.8)
        assert p is not None, "Missing tert-butyl peak"
        assert p.integral == 9, f"Expected 9H for tert-butyl, got {p.integral}"
        assert p.multiplicity == "s", f"Expected singlet, got {p.multiplicity}"

    def test_hydroxyl(self) -> None:
        oh = [p for p in self.peaks if p.environment == "hydroxyl_oh"]
        assert len(oh) == 1
        assert oh[0].integral == 1
        assert oh[0].multiplicity == "s"


# -----------------------------------------------------------------------
# Solvent effect validation
# -----------------------------------------------------------------------


class TestSolventEffects:
    def test_dmso_shifts_oh_downfield(self) -> None:
        """DMSO-d6 should shift ethanol OH significantly downfield vs CDCl3."""
        cdcl3 = _predict("CCO", solvent="CDCl3")
        dmso = _predict("CCO", solvent="DMSO-d6")
        oh_cdcl3 = next(p for p in cdcl3 if p.environment == "hydroxyl_oh")
        oh_dmso = next(p for p in dmso if p.environment == "hydroxyl_oh")
        assert oh_dmso.shift_ppm > oh_cdcl3.shift_ppm + 0.5

    def test_c6d6_shifts_aromatic_upfield(self) -> None:
        """C6D6 should shift aromatic protons upfield vs CDCl3."""
        cdcl3 = _predict("c1ccccc1", solvent="CDCl3")
        c6d6 = _predict("c1ccccc1", solvent="C6D6")
        ar_cdcl3 = next(p for p in cdcl3 if p.environment == "aromatic")
        ar_c6d6 = next(p for p in c6d6 if p.environment == "aromatic")
        assert ar_c6d6.shift_ppm < ar_cdcl3.shift_ppm

    def test_all_solvents_produce_results(self) -> None:
        """All 6 solvents produce valid predictions."""
        from kendraw_chem.nmr.shift_tables import SOLVENT_IDS

        for sid in SOLVENT_IDS:
            peaks = _predict("CCO", solvent=sid)
            assert len(peaks) > 0, f"No peaks for solvent {sid}"
