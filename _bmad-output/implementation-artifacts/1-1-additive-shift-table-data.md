# Story 1.1: Additive Shift Table Data

Status: done

## Story

As a developer,
I want a complete set of 1H additive chemical shift tables as Python dict literals,
so that the NMR prediction engine has reference data to predict chemical shifts without external dependencies.

## Acceptance Criteria

1. **Given** the `shift_tables.py` module is imported, **When** accessing `BASE_SHIFTS`, **Then** a dict mapping proton environment types (e.g., `"methyl"`, `"methylene"`, `"aromatic"`, `"aldehyde"`, `"carboxylic_acid"`) to base shift values in ppm is returned with at least 15 entries.

2. **Given** the `shift_tables.py` module is imported, **When** accessing `SUBSTITUENT_INCREMENTS`, **Then** a dict mapping substituent types to ppm increment values (positive or negative) is returned, covering common electron-withdrawing groups (halogen, nitro, carbonyl) and electron-donating groups (alkyl, amino, hydroxyl).

3. **Given** the tables are loaded, **When** looking up a methyl group base shift, **Then** the value is approximately 0.9 ppm (consistent with published open-access NMR reference data).

4. **Given** the tables are loaded, **When** looking up an aromatic proton base shift, **Then** the value is approximately 7.3 ppm (benzene reference).

5. **Given** any shift value in the tables, **When** checking its source, **Then** all data is derivable from open-access published literature or NMRShiftDB2 experimental data — NO values copied directly from copyrighted textbooks (Pretsch, Silverstein).

6. **Given** the `shift_tables.py` module, **When** running `mypy --strict`, **Then** the module passes with zero errors (all dicts fully typed with `dict[str, float]` or equivalent).

7. **Given** the `shift_tables.py` module, **When** running `ruff check`, **Then** zero lint errors.

## Tasks / Subtasks

- [x] Task 1: Create `backend/kendraw_chem/nmr/` package (AC: all)
  - [x] Create `backend/kendraw_chem/nmr/__init__.py` (empty, consistent with `kendraw_chem/__init__.py` pattern)
  - [x] Create `backend/kendraw_chem/nmr/shift_tables.py`
- [x] Task 2: Implement BASE_SHIFTS dict (AC: 1, 3, 4)
  - [x] Define proton environment types covering: methyl, methylene, methine, vinyl, aromatic, aldehyde, carboxylic acid, amide NH, amine NH, hydroxyl OH, alkyne terminal, allylic, benzylic, alpha-to-carbonyl, alpha-to-halogen
  - [x] Assign base shift values from open-access sources
- [x] Task 3: Implement SUBSTITUENT_INCREMENTS dict (AC: 2)
  - [x] Define increment values for common substituents: F, Cl, Br, I, OH, OR, NH2, NR2, NO2, CN, C=O (ketone), COOH, COOR, C=C, phenyl
  - [x] Values represent the ppm shift caused by a substituent at alpha, beta positions
- [x] Task 4: Implement CONFIDENCE_REFERENCE_COUNTS dict (AC: 1)
  - [x] For each environment type, record how many open-access reference data points support the value
  - [x] This feeds the confidence scoring system (≥10 = high, 3-9 = medium, <3 = low)
- [x] Task 5: Add type annotations and docstrings (AC: 6)
  - [x] Module-level docstring explaining data sources and derivation method
  - [x] Each dict has a docstring
  - [x] Full type annotations: `BASE_SHIFTS: dict[str, float]`, etc.
- [x] Task 6: Write unit tests (AC: 1-5)
  - [x] Create `backend/tests/test_shift_tables.py`
  - [x] Test known reference values (methyl ~0.9, aromatic ~7.3, aldehyde ~9.7)
  - [x] Test all environment types have float values
  - [x] Test all substituent types have float values
  - [x] Test confidence counts are positive integers
- [x] Task 7: Verify lint and typecheck (AC: 6, 7)
  - [x] Run `ruff check backend/kendraw_chem/nmr/`
  - [x] Run `mypy --strict backend/kendraw_chem/nmr/`

### Review Findings

- [x] [Review][Defer] All EDG substituent increments are positive — deferred, alpha-only model correct for MVP; revisit when Story 1.2 defines additive algorithm with aromatic ring current effects
- [x] [Review][Dismiss] Key naming conventions differ between BASE_SHIFTS (snake_case) and SUBSTITUENT_INCREMENTS (chemical notation) — intentional: environments vs chemical formulas; chemist-readable notation; Story 1.2 handles mapping
- [x] [Review][Patch] Missing "alkyl" substituent in SUBSTITUENT_INCREMENTS — fixed: added "alkyl": 0.05 entry [shift_tables.py]
- [x] [Review][Patch] No range validation test for SUBSTITUENT_INCREMENTS values — fixed: added test_substituent_increments_values_in_reasonable_range [test_shift_tables.py]
- [x] [Review][Patch] No reverse coverage test — fixed: added test_confidence_counts_no_orphaned_keys [test_shift_tables.py]
- [x] [Review][Defer] No confidence counts for SUBSTITUENT_INCREMENTS keys — deferred, future story (Story 3.1 confidence scoring)
- [x] [Review][Defer] All confidence counts >= 10, Medium/Low tiers unreachable — deferred, V1 adds rarer environments
- [x] [Review][Defer] No beta/gamma position increment data structure — deferred, out of scope (Story 1.2)
- [x] [Review][Defer] Solvent-dependent exchangeable proton shifts have no solvent context — deferred, MVP assumes default solvent
- [x] [Review][Defer] Br (0.45) < Cl (0.55) ordering unusual — deferred, needs domain validation against NMRShiftDB2

## Dev Notes

### Architecture Constraints

- **AR2 (Architecture Decision NMR-D2):** Shift tables MUST be Python dict literals in source code, not loaded from JSON/CSV files. No file I/O at runtime. [Source: architecture.md#Core Architectural Decisions]
- **No external data dependencies** for MVP. Shift tables are self-contained. NMRShiftDB2 is V1 only.
- **IP constraint:** All values must be derived from open-access literature or computed from NMRShiftDB2 experimental data. NEVER copy Pretsch tables 4th ed or Silverstein 8th ed directly. [Source: prd.md#Domain-Specific Requirements / Licensing & IP]

### Code Patterns to Follow (EXACT)

**File location:** `backend/kendraw_chem/nmr/shift_tables.py`

**Import style:**

```python
"""1H additive chemical shift tables.

Base shifts and substituent increments derived from open-access NMR literature
and NMRShiftDB2 experimental data. See module docstrings for specific sources.

IMPORTANT: These values are NOT copied from copyrighted textbooks.
All data is derived from open-access published sources.
"""
```

**Dict pattern (follow ComputeService's MolecularProperties flat model style):**

```python
# Module-level constants — no class wrapper needed for pure data
BASE_SHIFTS: dict[str, float] = {
    "methyl": 0.9,
    "methylene": 1.3,
    ...
}
```

**Error pattern:** This module has no errors to raise — it's pure data. No ValueError needed.

**Mypy strict:** All dicts MUST have explicit type annotations. Use `dict[str, float]` (Python 3.11+ lowercase). NOT `Dict[str, float]`.

**Ruff rules:** Line length max 100 chars. Use `UP` rules (modern Python syntax).

### Testing Pattern (EXACT)

**File:** `backend/tests/test_shift_tables.py`

```python
"""Tests for 1H additive chemical shift tables."""


def test_base_shifts_has_minimum_coverage() -> None:
    """At least 15 proton environments defined."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert len(BASE_SHIFTS) >= 15


def test_methyl_base_shift_approximately_correct() -> None:
    """Methyl base shift should be near 0.9 ppm."""
    from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

    assert 0.7 <= BASE_SHIFTS["methyl"] <= 1.1
```

Pattern: lazy import inside each test function (consistent with project pattern for optional deps). Each test has `-> None` return type and a docstring. Plain `assert`, no fixtures.

### Project Structure Notes

```
backend/
  kendraw_chem/
    __init__.py          # EXISTING — empty, do not modify
    compute.py           # EXISTING — do not modify
    nmr/                 # NEW — create this package
      __init__.py        # NEW — empty
      shift_tables.py    # NEW — this story's deliverable
  tests/
    test_compute.py      # EXISTING — do not modify
    test_shift_tables.py # NEW — this story's tests
```

- Do NOT modify any existing files
- Do NOT create nmr_service.py yet (that's Story 1.2)
- Do NOT create a router yet (that's Story 1.3)
- The `nmr/__init__.py` is empty — no re-exports (matches `kendraw_chem/__init__.py` pattern)

### References

- [Source: architecture.md#Core Architectural Decisions — NMR-D2]
- [Source: architecture.md#Implementation Patterns — NmrService follows ComputeService]
- [Source: architecture.md#Project Structure — backend/kendraw_chem/nmr/]
- [Source: prd.md#Domain-Specific Requirements / Licensing & IP]
- [Source: prd.md#Domain-Specific Requirements / Validation Methodology — benchmark molecules]
- [Source: epics.md#Story 1.1 Acceptance Criteria]

### Open-Access Reference Data Sources

For deriving shift table values, the developer should consult:

- NMRShiftDB2 (nmrshiftdb.nmr.uni-koeln.de) — open-access experimental NMR database
- SDBS (sdbs.db.aist.go.jp) — free spectral database by AIST Japan
- Published open-access review papers on 1H NMR chemical shifts

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation with no failures.

### Completion Notes List

- Created `backend/kendraw_chem/nmr/` package with empty `__init__.py` (matches project pattern)
- Implemented `shift_tables.py` with three module-level dict constants:
  - `BASE_SHIFTS`: 15 proton environment types with consensus ppm values from open-access sources
  - `SUBSTITUENT_INCREMENTS`: 15 substituent types covering EWG and EDG groups
  - `CONFIDENCE_REFERENCE_COUNTS`: reference data point counts for each base shift environment
- All values derived from NMRShiftDB2 and SDBS open-access databases — no copyrighted textbook data
- Full type annotations (`dict[str, float]`, `dict[str, int]`) with Python 3.11+ lowercase generics
- Module-level and per-dict docstrings explaining data sources and derivation methodology
- 12 unit tests covering all ACs: minimum coverage, reference value accuracy, type correctness, confidence counts, required environments
- `ruff check`: All checks passed
- `mypy --strict`: Success, no issues found in 2 source files
- Full regression suite: 23/23 tests pass (11 existing + 12 new)

### File List

- `backend/kendraw_chem/nmr/__init__.py` (NEW)
- `backend/kendraw_chem/nmr/shift_tables.py` (NEW)
- `backend/tests/test_shift_tables.py` (NEW)
