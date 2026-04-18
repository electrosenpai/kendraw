"""Structure cleanup router — Wave-7 HF-3.

POST /structure/clean: normalize or recompute 2D coordinates for a MOL V2000.
"""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from kendraw_chem.structure import CleanResult, StructureService

router = APIRouter(prefix="/structure", tags=["structure"])

_service = StructureService()


class CleanRequest(BaseModel):
    mol_block: str
    mode: Literal["quick", "full"] = "quick"


@router.post("/clean", response_model=CleanResult)
def clean(req: CleanRequest) -> CleanResult:
    return _service.clean(req.mol_block, req.mode)
