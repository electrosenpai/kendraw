"""Structure cleanup router — Wave-7 HF-3 + Wave-8 HF-D2.

POST /structure/clean: normalize or recompute 2D coordinates for a MOL V2000.
POST /structure/fuse-template: merge a template ring onto a scene atom or bond
using Indigo's native merge + mapAtom + layout (delivers naphthalene from
benzene + benzene, toluene from methyl + benzene, etc.).
"""

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from kendraw_chem.indigo_service import IndigoService
from kendraw_chem.structure import CleanResult, StructureService

router = APIRouter(prefix="/structure", tags=["structure"])

_service = StructureService()
_indigo = IndigoService()


class CleanRequest(BaseModel):
    mol_block: str
    mode: Literal["quick", "full"] = "quick"


@router.post("/clean", response_model=CleanResult)
def clean(req: CleanRequest) -> CleanResult:
    return _service.clean(req.mol_block, req.mode)


class FuseRequest(BaseModel):
    """Request body for /structure/fuse-template.

    `mode='atom'`: vertex-share — `target_index` is a scene atom index.
    `mode='bond'`: edge-share — `target_index` is a scene bond index.
    `template_anchors` overrides which template atom(s) anchor the merge:
      - `mode='atom'`: optional 1-tuple, default (0,)
      - `mode='bond'`: optional 2-tuple, default (0, 1)
    """

    mol_block: str
    template_smiles: str
    mode: Literal["atom", "bond"]
    target_index: int
    template_anchors: tuple[int, ...] | None = None


class FuseResponse(BaseModel):
    mol_block: str
    success: bool
    error: str | None = None


@router.post("/fuse-template", response_model=FuseResponse)
def fuse_template(req: FuseRequest) -> FuseResponse:
    if not _indigo.is_available():
        raise HTTPException(status_code=503, detail="Indigo not available")
    if not req.mol_block.strip():
        raise HTTPException(status_code=400, detail="Empty mol_block")
    if not req.template_smiles.strip():
        raise HTTPException(status_code=400, detail="Empty template_smiles")
    try:
        if req.mode == "atom":
            anchor = req.template_anchors[0] if req.template_anchors else 0
            fused = _indigo.fuse_template_atom(
                req.mol_block,
                req.template_smiles,
                req.target_index,
                anchor,
            )
        else:
            if req.template_anchors and len(req.template_anchors) >= 2:
                a, b = req.template_anchors[0], req.template_anchors[1]
            else:
                a, b = 0, 1
            fused = _indigo.fuse_template_bond(
                req.mol_block,
                req.template_smiles,
                req.target_index,
                a,
                b,
            )
        return FuseResponse(mol_block=fused, success=True)
    except (IndexError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        # Surface engine errors back to the caller without a 5xx so the UI can
        # fall back to local fusion gracefully.
        return FuseResponse(mol_block=req.mol_block, success=False, error=str(exc))
