from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from kendraw_chem.compute import ComputeService, MolecularProperties

router = APIRouter(prefix="/compute", tags=["compute"])

_service = ComputeService()


class ComputeFromSmilesRequest(BaseModel):
    smiles: str


class ComputeFromMolRequest(BaseModel):
    mol_block: str


@router.post("/properties/smiles", response_model=MolecularProperties)
def compute_from_smiles(req: ComputeFromSmilesRequest) -> MolecularProperties:
    try:
        return _service.compute_from_smiles(req.smiles)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/properties/mol", response_model=MolecularProperties)
def compute_from_mol(req: ComputeFromMolRequest) -> MolecularProperties:
    try:
        return _service.compute_from_mol(req.mol_block)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
