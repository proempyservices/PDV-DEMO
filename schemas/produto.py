from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal



class ProdutoCreate(BaseModel):

    categoria_id: int

    nome: str

    descricao: str | None = None

    preco_compra: Decimal

    preco_venda: Decimal

    quantidade: int = 0

    stock_minimo: int = 5

    unidade: str = "unidade"



class ProdutoUpdate(BaseModel):

    nome: str | None = None

    descricao: str | None = None

    preco_compra: Decimal | None = None

    preco_venda: Decimal | None = None

    quantidade: int | None = None

    stock_minimo: int | None = None

    ativo: bool | None = None



class ProdutoResponse(BaseModel):

    id: int

    categoria_id: int

    nome: str

    descricao: str | None

    preco_compra: Decimal

    preco_venda: Decimal

    quantidade: int

    stock_minimo: int

    unidade: str

    ativo: bool

    criado_em: datetime
    stock_total: int = 0


    class Config:

        from_attributes = True