"""Tests for 1H additive chemical shift tables."""


def test_base_shifts_has_minimum_coverage() -> None:
    """At least 15 proton environments defined."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert len(BASE_SHIFTS) >= 15


def test_methyl_base_shift_approximately_correct() -> None:
    """Methyl base shift should be near 0.9 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 0.7 <= BASE_SHIFTS["methyl"] <= 1.1


def test_aromatic_base_shift_approximately_correct() -> None:
    """Aromatic proton base shift should be near 7.3 ppm (benzene reference)."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 7.0 <= BASE_SHIFTS["aromatic"] <= 7.6


def test_aldehyde_base_shift_approximately_correct() -> None:
    """Aldehyde proton base shift should be near 9.7 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 9.4 <= BASE_SHIFTS["aldehyde"] <= 10.0


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


def test_substituent_increments_all_values_are_floats() -> None:
    """All substituent increment values must be floats."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    for key, value in SUBSTITUENT_INCREMENTS.items():
        assert isinstance(value, float), (
            f"SUBSTITUENT_INCREMENTS[{key!r}] is {type(value)}, expected float"
        )


def test_substituent_increments_minimum_count() -> None:
    """At least 15 substituent types defined (F, Cl, Br, I, OH, OR, etc.)."""
    from kendraw_chem.nmr.shift_tables import SUBSTITUENT_INCREMENTS

    assert len(SUBSTITUENT_INCREMENTS) >= 15


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
    """All AC-required environment types are present."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    required = {
        "methyl", "methylene", "aromatic", "aldehyde", "carboxylic_acid",
    }
    for env in required:
        assert env in BASE_SHIFTS, f"Missing required environment: {env}"
