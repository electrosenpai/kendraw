from fastapi import APIRouter
from pydantic import BaseModel

from kendraw_chem.convert import ConvertService, ConversionResult

router = APIRouter(prefix="/convert", tags=["convert"])

_service = ConvertService()


class ConvertRequest(BaseModel):
    input_data: str
    input_format: str
    output_format: str


@router.post("/", response_model=ConversionResult)
def convert(req: ConvertRequest) -> ConversionResult:
    return _service.convert(req.input_data, req.input_format, req.output_format)
