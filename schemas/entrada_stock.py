from pydantic import BaseModel
from decimal import Decimal


class EntradaStockCreate(BaseModel):

    quantidade: int

    preco_compra: Decimal

    preco_venda: Decimal | None = None