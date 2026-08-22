from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime



class ItemVendaCreate(BaseModel):

    produto_id: int

    quantidade: int



class VendaCreate(BaseModel):

    usuario_id: int

    itens: list[ItemVendaCreate]

    valor_entregue: Decimal



class ItemVendaResponse(BaseModel):

    id: int

    produto_id: int

    quantidade: int

    preco_unitario: Decimal

    subtotal: Decimal


    class Config:

        from_attributes = True



class VendaResponse(BaseModel):

    id: int

    usuario_id: int

    total: Decimal

    valor_entregue: Decimal

    troco: Decimal

    data_venda: datetime

    itens: list[ItemVendaResponse]


    class Config:

        from_attributes = True