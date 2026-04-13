"""Tests for 1H additive chemical shift tables."""


def test_base_shifts_has_minimum_coverage() -> None:
    """At least 18 proton environments defined."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert len(BASE_SHIFTS) >= 18


def test_methyl_base_shift_approximately_correct() -> None:
    """Methyl base shift should be near 0.9 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 0.7 <= BASE_SHIFTS["methyl"] <= 1.1


def test_aromatic_base_shift_approximately_correct() -> None:
    """Aromatic proton base shift should be near 7.26 ppm (benzene reference)."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 7.0 <= BASE_SHIFTS["aromatic"] <= 7.6


def test_aldehyde_base_shift_approximately_correct() -> None:
    """Aldehyde proton base shift should be near 9.7 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 9.4 <= BASE_SHIFTS["aldehyde"] <= 10.0


def test_alpha_to_oxygen_shift_approximately_correct() -> None:
    """Alpha-to-oxygen base shift should be near 3.4 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 3.0 <= BASE_SHIFTS["alpha_to_oxygen"] <= 4.0


def test_alpha_to_nitrogen_shift_approximately_correct() -> None:
    """Alpha-to-nitrogen base shift should be near 2.6 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 2.2 <= BASE_SHIFTS["alpha_to_nitrogen"] <= 3.2


def test_thiol_shift_approximately_correct() -> None:
    """Thiol SH base shift should be near 1.6 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 1.0 <= BASE_SHIFTS["thiol_sh"] <= 2.5


def test_base_shifts_all_values_are_floats() -> None:
    """All base shift values must be floats."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    for key, value in BASE_SHIFTS.items():
        assert isinstance(value, float), f"BASE_SHIFTS[{key!r}] is {type(value)}, expected float"


def test_base_shifts_values_in_reasonable_range() -> None:
    """All base shift values should be in 0-15 ppm range."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    for key, value in BASE_SHIFTS.items():
        assert 0.0 <= value <= 15.0, f"BASE_SHIFTS[{key!r}] = {value} out of range"


def test_substituent_increments_has_common_groups() -> None:
    """Substituent increments cover common EWG and EDG groups."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    ewg = {"Cl", "Br", "NO2", "CN", "C=O_ketone"}
    edg = {"NH2", "OH", "alkyl"}
    for group in ewg | edg:
        assert group in SUBSTITUENT_INCREMENTS, f"Missing substituent: {group}"


def test_substituent_increments_includes_sulfur() -> None:
    """Substituent increments include SH and SR."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    assert "SH" in SUBSTITUENT_INCREMENTS
    assert "SR" in SUBSTITUENT_INCREMENTS


def test_substituent_increments_all_values_are_floats() -> None:
    """All substituent increment values must be floats."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    for key, value in SUBSTITUENT_INCREMENTS.items():
        assert isinstance(value, float), (
            f"SUBSTITUENT_INCREMENTS[{key!r}] is {type(value)}, expected float"
        )


def test_substituent_increments_minimum_count() -> None:
    """At least 17 substituent types defined."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    assert len(SUBSTITUENT_INCREMENTS) >= 17


def test_substituent_increments_values_in_reasonable_range() -> None:
    """All substituent increment values should be in -2.0 to 2.0 ppm range."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    for key, value in SUBSTITUENT_INCREMENTS.items():
        assert -2.0 <= value <= 2.0, (
            f"SUBSTITUENT_INCREMENTS[{key!r}] = {value} out of range"
        )


def test_confidence_counts_are_positive_integers() -> None:
    """All confidence reference counts must be positive integers."""
    from kendraw_chem.nmr.shift_tables import CONFIDENCE_REFERENCE_COUNTS

    for key, value in CONFIDENCE_REFERENCE_COUNTS.items():
        assert isinstance(value, int), (
            f"CONFIDENCE_REFERENCE_COUNTS[{key!r}] is {type(value)}, expected int"
        )
        assert value > 0, f"CONFIDENCE_REFERENCE_COUNTS[{key!r}] = {value}, must be positive"


def test_confidence_counts_cover_all_base_shift_keys() -> None:
    """Every base shift environment has a confidence count."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS, CONFIDENCE_REFERENCE_COUNTS

    for key in BASE_SHIFTS:
        assert key in CONFIDENCE_REFERENCE_COUNTS, (
            f"Missing confidence count for base shift environment: {key}"
        )


def test_confidence_counts_no_orphaned_keys() -> None:
    """Every confidence count key must exist in BASE_SHIFTS."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS, CONFIDENCE_REFERENCE_COUNTS

    for key in CONFIDENCE_REFERENCE_COUNTS:
        assert key in BASE_SHIFTS, (
            f"Orphaned confidence key not in BASE_SHIFTS: {key}"
        )


def test_base_shifts_required_environments() -> None:
    """All required environment types are present."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    required = {
        "methyl", "methylene", "aromatic", "aldehyde", "carboxylic_acid",
        "alpha_to_oxygen", "alpha_to_nitrogen", "thiol_sh",
    }
    for env in required:
        assert env in BASE_SHIFTS, f"Missing required environment: {env}"


def test_solvent_ids_defined() -> None:
    """SOLVENT_IDS contains at least 6 solvents."""
    from kendraw_chem.nmr.shift_tables import SOLVENT_IDS

    assert len(SOLVENT_IDS) >= 6
    assert "CDCl3" in SOLVENT_IDS
    assert "DMSO-d6" in SOLVENT_IDS
    assert "D2O" in SOLVENT_IDS


def test_solvent_proton_offsets_keys_match_solvent_ids() -> None:
    """Every solvent ID has a proton offset table."""
    from kendraw_chem.nmr.shift_tables import SOLVENT_IDS, SOLVENT_PROTON_OFFSETS

    for sid in SOLVENT_IDS:
        assert sid in SOLVENT_PROTON_OFFSETS, f"Missing proton offsets for {sid}"


def test_cdcl3_offsets_are_empty() -> None:
    """CDCl3 is the reference solvent with zero offsets."""
    from kendraw_chem.nmr.shift_tables import SOLVENT_PROTON_OFFSETS

    assert SOLVENT_PROTON_OFFSETS["CDCl3"] == {}


def test_dmso_hydroxyl_offset_positive() -> None:
    """DMSO-d6 shifts hydroxyl OH significantly downfield."""
    from kendraw_chem.nmr.shift_tables import SOLVENT_PROTON_OFFSETS

    offset = SOLVENT_PROTON_OFFSETS["DMSO-d6"].get("hydroxyl_oh", 0.0)
    assert offset > 0.5, "DMSO-d6 should significantly shift OH downfield"


def test_aromatic_substituent_effects_defined() -> None:
    """Aromatic substituent effects table has common groups."""
    from kendraw_chem.nmr.shift_tables import AROMATIC_SUBSTITUENT_EFFECTS

    required = {"NH2", "OH", "NO2", "Cl", "alkyl"}
    for group in required:
        assert group in AROMATIC_SUBSTITUENT_EFFECTS, f"Missing aromatic effect: {group}"
        effect = AROMATIC_SUBSTITUENT_EFFECTS[group]
        assert "ortho" in effect
        assert "meta" in effect
        assert "para" in effect


def test_j_coupling_constants_defined() -> None:
    """J-coupling constants table has common coupling types."""
    from kendraw_chem.nmr.shift_tables import J_COUPLING_CONSTANTS

    assert "vicinal_sp3_sp3" in J_COUPLING_CONSTANTS
    assert "vicinal_aromatic_ortho" in J_COUPLING_CONSTANTS
    assert 5.0 <= J_COUPLING_CONSTANTS["vicinal_sp3_sp3"] <= 9.0


def test_solvent_residual_peaks_defined() -> None:
    """Solvent residual peaks are defined for all solvents."""
    from kendraw_chem.nmr.shift_tables import SOLVENT_IDS, SOLVENT_RESIDUAL_PEAKS

    for sid in SOLVENT_IDS:
        assert sid in SOLVENT_RESIDUAL_PEAKS, f"Missing residual peak for {sid}"
        peaks = SOLVENT_RESIDUAL_PEAKS[sid]
        assert len(peaks) >= 1
        assert "shift" in peaks[0]
        assert "label" in peaks[0]
