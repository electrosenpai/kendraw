"""NMR prediction API endpoint."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from kendraw_chem.nmr import NmrPrediction, NmrService

router = APIRouter(prefix="/compute", tags=["nmr"])

_service = NmrService()


class NmrRequest(BaseModel):
    """Request body for NMR prediction."""

    input: str
    format: str = "smiles"
    nucleus: str = "1H"
    solvent: str = "CDCl3"


@router.post("/nmr", response_model=NmrPrediction)
def predict_nmr(request: NmrRequest) -> NmrPrediction:
    """Predict NMR chemical shifts for a molecular structure."""
    try:
        return _service.predict_nmr(
            request.input,
            format=request.format,
            solvent=request.solvent,
            nucleus=request.nucleus,
        )
    except ValueError as exc:
        status = 413 if "exceeds limit" in str(exc) else 400
        raise HTTPException(status_code=status, detail=str(exc)) from exc
