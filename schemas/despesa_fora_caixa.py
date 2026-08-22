from pydantic import (
    BaseModel,
    ConfigDict
)

from decimal import Decimal
from datetime import datetime


# =====================================================
# CRIAR PEDIDO
# =====================================================

class DespesaForaCaixaCreate(BaseModel):

    usuario_id: int

    descricao: str

    categoria: str | None = None

    valor_solicitado: Decimal

    observacao: str | None = None


# =====================================================
# APROVAR
# =====================================================

class DespesaForaCaixaAprovar(BaseModel):

    valor_aprovado: Decimal

    observacao: str | None = None


# =====================================================
# REJEITAR
# =====================================================

class DespesaForaCaixaRejeitar(BaseModel):

    observacao: str | None = None


# =====================================================
# RESPOSTA
# =====================================================

class DespesaForaCaixaResponse(BaseModel):

    id: int

    usuario_id: int

    solicitante_nome: str | None = None

    descricao: str

    categoria: str | None = None

    valor_solicitado: Decimal

    valor_aprovado: Decimal | None = None

    saldo_caixa: Decimal

    estado: str

    observacao: str | None = None

    aprovado_por: int | None = None

    aprovador_nome: str | None = None

    observacao_aprovacao: str | None = None

    data_solicitacao: datetime

    data_aprovacao: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )