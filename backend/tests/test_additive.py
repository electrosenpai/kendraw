"""Tests for additive 1H NMR prediction module."""

import pytest

rdkit = pytest.importorskip("rdkit")


def test_ethanol_returns_peaks() -> None:
    """Ethanol (CCO) should produce peaks for CH3, CH2, and OH."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCO")
    peaks = predict_additive(mol)
    assert len(peaks) > 0
    shifts = [p.shift_ppm for p in peaks]
    # Ethanol should have shifts spanning low-field OH and high-field CH3
    assert min(shifts) < 2.0  # CH3 region
    assert max(shifts) > 2.0  # OH or CH2-O region


def test_ethanol_all_peaks_have_additive_method() -> None:
    """All peaks from additive predictor have method='additive'."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCO")
    peaks = predict_additive(mol)
    for peak in peaks:
        assert peak.method == "additive"


def test_benzene_equivalent_protons_grouped() -> None:
    """Benzene aromatic protons should be grouped (same shift, same env)."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("c1ccccc1")
    peaks = predict_additive(mol)
    # All 6 H atoms are equivalent — should produce 1 peak with 6 indices
    aromatic_peaks = [p for p in peaks if 7.0 <= p.shift_ppm <= 7.6]
    assert len(aromatic_peaks) == 1
    assert len(aromatic_peaks[0].atom_indices) == 6


def test_simple_alkane_methyl_shift() -> None:
    """Butane (CCCC) terminal methyls should be near 0.9 ppm."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCCC")
    peaks = predict_additive(mol)
    methyl_peaks = [p for p in peaks if 0.7 <= p.shift_ppm <= 1.1]
    assert len(methyl_peaks) > 0


def test_simple_alkane_methylene_shift() -> None:
    """Butane (CCCC) internal methylenes should be near 1.3 ppm."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCCC")
    peaks = predict_additive(mol)
    methylene_peaks = [p for p in peaks if 1.1 <= p.shift_ppm <= 1.5]
    assert len(methylene_peaks) > 0


def test_deterministic_output() -> None:
    """Same mol produces identical output on repeated calls."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCO")
    result1 = predict_additive(mol)
    result2 = predict_additive(mol)
    assert len(result1) == len(result2)
    for p1, p2 in zip(result1, result2, strict=True):
        assert p1.shift_ppm == p2.shift_ppm
        assert p1.atom_indices == p2.atom_indices
        assert p1.confidence == p2.confidence


def test_peaks_sorted_by_shift_descending() -> None:
    """Peaks should be sorted by shift_ppm descending."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCO")
    peaks = predict_additive(mol)
    shifts = [p.shift_ppm for p in peaks]
    assert shifts == sorted(shifts, reverse=True)


def test_confidence_values_are_valid() -> None:
    """All confidence values must be 1, 2, or 3."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CCO")
    peaks = predict_additive(mol)
    for peak in peaks:
        assert peak.confidence in (1, 2, 3)


def test_aldehyde_shift() -> None:
    """Acetaldehyde (CC=O) aldehyde H should be near 9.7 ppm."""
    from rdkit import Chem

    from kendraw_chem.nmr.additive import predict_additive

    mol = Chem.MolFromSmiles("CC=O")
    peaks = predict_additive(mol)
    high_field_peaks = [p for p in peaks if p.shift_ppm > 9.0]
    assert len(high_field_peaks) >= 1
