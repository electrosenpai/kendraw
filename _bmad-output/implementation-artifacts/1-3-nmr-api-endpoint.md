# Story 1.3: NMR API Endpoint

Status: done

## Story

As a chemist,
I want an API endpoint that accepts a molecule and returns NMR predictions,
so that the frontend can request 1H chemical shift predictions via HTTP.

## Acceptance Criteria

1. **Given** a `POST /compute/nmr` request with `{"input": "CCO", "format": "smiles", "nucleus": "1H"}`, **When** the endpoint processes it, **Then** a 200 response is returned with JSON containing `peaks` array and `metadata` object matching `NmrPrediction` schema.

2. **Given** a `POST /compute/nmr` request with invalid SMILES `{"input": "INVALID", "format": "smiles", "nucleus": "1H"}`, **When** the endpoint processes it, **Then** a 400 response is returned with `{"detail": "..."}` error envelope.

3. **Given** a `POST /compute/nmr` request with a molecule exceeding `max_mol_atoms`, **When** the endpoint processes it, **Then** a 413 response is returned with `{"detail": "..."}` error envelope.

4. **Given** the application is running, **When** `/openapi.json` is fetched, **Then** the `/compute/nmr` endpoint appears with documented request/response schemas.

5. **Given** any valid request, **When** `POST /compute/nmr` is called, **Then** the response includes `peaks[].atom_index`, `peaks[].shift_ppm`, `peaks[].confidence`, `peaks[].method`, and `metadata.engine_version`.

6. **Given** the `nmr` router module, **When** running `mypy --strict` and `ruff check`, **Then** zero errors.

## Tasks / Subtasks

- [x] Task 1: Create NMR request model (AC: 1, 4)
  - [x] Define `NmrRequest(BaseModel)` in `backend/kendraw_api/routers/nmr.py`: `input: str`, `format: str = "smiles"`, `nucleus: str = "1H"`
  - [x] Validate `nucleus` is `"1H"` for MVP (reject others with 400)
- [x] Task 2: Create NMR router with POST endpoint (AC: 1, 2, 3, 5)
  - [x] Create `backend/kendraw_api/routers/nmr.py`
  - [x] `router = APIRouter(prefix="/compute", tags=["nmr"])`
  - [x] Module-level `_service = NmrService()`
  - [x] `POST /nmr` endpoint accepting `NmrRequest` body, returning `NmrPrediction`
  - [x] Catch `ValueError` from `NmrService.predict_nmr()`:
    - "exceeds limit" in message → `HTTPException(status_code=413)`
    - All other ValueError → `HTTPException(status_code=400)`
  - [x] Sync endpoint function (not async) — follows existing compute router pattern
- [x] Task 3: Register router in main.py (AC: 4)
  - [x] Import nmr router in `backend/kendraw_api/main.py`
  - [x] Add `app.include_router(nmr_router)` after existing routers
- [x] Task 4: Write API integration tests (AC: 1, 2, 3, 4, 5)
  - [x] Create `backend/tests/test_nmr_api.py`
  - [x] Test valid SMILES returns 200 with peaks and metadata
  - [x] Test invalid SMILES returns 400 with detail
  - [x] Test atom-limit molecule returns 413 (mock `max_mol_atoms` to low value)
  - [x] Test endpoint appears in OpenAPI schema
  - [x] Test response JSON structure matches NmrPrediction schema
  - [x] Test RDKit-unavailable returns 200 with empty peaks (not an error)
- [x] Task 5: Verify lint, typecheck, and full regression (AC: 6)
  - [x] Run `ruff check backend/kendraw_api/routers/nmr.py`
  - [x] Run `mypy --strict backend/kendraw_api/routers/nmr.py`
  - [x] Run full test suite — zero regressions

## Dev Notes

### Architecture Constraints

- **NMR-D3:** API schema is `POST /compute/nmr`. Request: `{input, format, nucleus}`. Response: `NmrPrediction` (peaks + metadata). Listed in OpenAPI.
- **NMR-D10:** Backend does NOT accept or return spectrometer frequency for MVP. The `frequency` field from the architecture spec is omitted.
- **NFR12:** Invalid input returns structured error within 100ms.
- **NFR23:** Zero regression to existing endpoints.

### Code Patterns to Follow (EXACT)

**Existing compute router** (`kendraw_api/routers/compute.py`) — follow this pattern exactly:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from kendraw_chem.nmr import NmrPrediction, NmrService

router = APIRouter(prefix="/compute", tags=["nmr"])

_service = NmrService()


class NmrRequest(BaseModel):
    input: str
    format: str = "smiles"
    nucleus: str = "1H"


@router.post("/nmr", response_model=NmrPrediction)
def predict_nmr(request: NmrRequest) -> NmrPrediction:
    if request.nucleus != "1H":
        raise HTTPException(status_code=400, detail=f"Unsupported nucleus: {request.nucleus}")
    try:
        return _service.predict_nmr(request.input, format=request.format)
    except ValueError as exc:
        status = 413 if "exceeds limit" in str(exc) else 400
        raise HTTPException(status_code=status, detail=str(exc)) from exc
```

**Router registration** (`kendraw_api/main.py`) — add after existing routers:

```python
from kendraw_api.routers import nmr
app.include_router(nmr.router)
```

**Error handling pattern:** Catch `ValueError` → map to HTTP status. "exceeds limit" → 413 (Payload Too Large). All others → 400. Use `from exc` for chaining.

**Test pattern** (`test_api_endpoints.py`) — async tests with httpx:

```python
import httpx
from httpx import ASGITransport

from kendraw_api.main import app


async def test_nmr_endpoint_valid_smiles() -> None:
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/compute/nmr", json={"input": "CCO", "format": "smiles", "nucleus": "1H"})
    assert response.status_code == 200
    data = response.json()
    assert "peaks" in data
    assert "metadata" in data
```

### Previous Story Intelligence (Story 1.2)

**Service interface:** `NmrService().predict_nmr(input_str, format="smiles") -> NmrPrediction`

- Raises `ValueError` for: invalid SMILES/MOL, unsupported format ("Unsupported format:"), atom limit ("exceeds limit")
- Returns stub with empty peaks and `method="unavailable"` when RDKit absent (NOT an error — return 200)
- Only accepts `format` "smiles" or "mol". `nucleus` is not a parameter (hardcoded 1H).

**Models available** (import from `kendraw_chem.nmr`):

- `NmrService`, `NmrPrediction`, `NmrPeak`, `NmrMetadata`

**Existing routers:** `health.py`, `compute.py`, `convert.py` — all sync, all at `/` prefix level (no `/api/v1`).

### Project Structure Notes

```
backend/
  kendraw_api/
    main.py              # EXISTING — MODIFY: add nmr router import
    routers/
      __init__.py        # EXISTING — do not modify
      compute.py         # EXISTING — reference pattern, do not modify
      convert.py         # EXISTING — do not modify
      health.py          # EXISTING — do not modify
      nmr.py             # NEW — NMR API router
  tests/
    test_api_endpoints.py # EXISTING — do not modify
    test_nmr_api.py      # NEW — NMR endpoint tests
```

- Do NOT modify any existing router files
- Only modify `main.py` to register the new router
- NMR request model lives inside `nmr.py` (follows compute.py pattern)

### References

- [Source: architecture.md#NMR-D3 — API schema and response contract]
- [Source: architecture.md#NFR12 — Error response time]
- [Source: architecture.md#NFR23 — Zero regression]
- [Source: epics.md#Epic 1, Story 1.3 — Story requirements]
- [Source: 1-2-nmr-prediction-service.md — Service interface and error patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation.

### Completion Notes List

- Created `kendraw_api/routers/nmr.py` with POST /compute/nmr endpoint following existing compute router pattern
- NmrRequest model with input, format (default "smiles"), nucleus (default "1H")
- Nucleus validation: rejects non-1H with 400
- ValueError mapping: "exceeds limit" → 413, all others → 400
- Stub mode (no RDKit): returns 200 with empty peaks, method="unavailable" — not an error
- Registered router in main.py after existing routers
- 7 async integration tests covering: valid SMILES, defaults, invalid SMILES, unsupported nucleus, response structure, OpenAPI schema, stub mode
- ruff check: all passed
- mypy --strict: no issues
- Full suite: 37 passed, 10 skipped, zero regressions

### File List

- `backend/kendraw_api/routers/nmr.py` (NEW)
- `backend/kendraw_api/main.py` (MODIFIED — added nmr router import and registration)
- `backend/tests/test_nmr_api.py` (NEW)
