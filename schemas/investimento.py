from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class InvestimentoCreate(BaseModel):

    usuario_id: int

    valor: Decimal

    descricao: str

    observacao: str | None = None


class InvestimentoResponse(BaseModel):

    id: int

    usuario_id: int

    valor: Decimal

    descricao: str

    observacao: str | None

    estado: str

    data_investimento: datetime

    class Config:

        from_attributes = True