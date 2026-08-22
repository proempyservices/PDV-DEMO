from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime



class RecolherCaixa(BaseModel):

    vendedor_id: int

    valor: Decimal

    observacao: str | None = None



class RetirarCaixa(BaseModel):

    valor: Decimal

    observacao: str | None = None



class MovimentoResponse(BaseModel):

    nome: str

    tipo: str

    valor: Decimal

    data: datetime

    observacao: str | None = None


    class Config:

        from_attributes = True



class CaixaUsuarioResponse(BaseModel):

    usuario_id: int

    nome: str

    tipo: str

    vendas: Decimal

    despesas: Decimal

    recolhido: Decimal

    saldo: Decimal

    movimentos: list[MovimentoResponse] = []


    class Config:

        from_attributes = True