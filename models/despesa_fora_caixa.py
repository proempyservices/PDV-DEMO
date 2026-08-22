from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class DespesaForaCaixa(Base):

    __tablename__ = "despesas_fora_caixa"

    # =====================================================
    # ID
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # USUÁRIO QUE SOLICITOU
    # =====================================================

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    # =====================================================
    # DESCRIÇÃO
    # =====================================================

    descricao = Column(
        String(150),
        nullable=False
    )

    # =====================================================
    # CATEGORIA
    # =====================================================

    categoria = Column(
        String(100),
        nullable=True
    )

    # =====================================================
    # VALOR SOLICITADO
    # =====================================================

    valor_solicitado = Column(
        Numeric(10, 2),
        nullable=False
    )

    # =====================================================
    # VALOR APROVADO
    # =====================================================

    valor_aprovado = Column(
        Numeric(10, 2),
        nullable=True
    )

    # =====================================================
    # SALDO DA CAIXA NO MOMENTO DO PEDIDO
    # =====================================================

    saldo_caixa = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    # =====================================================
    # ESTADO
    # =====================================================

    estado = Column(
        String(30),
        nullable=False,
        default="pendente"
    )

    # =====================================================
    # OBSERVAÇÃO DO SOLICITANTE
    # =====================================================

    observacao = Column(
        Text,
        nullable=True
    )

    # =====================================================
    # QUEM APROVOU / REJEITOU
    # =====================================================

    aprovado_por = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=True
    )

    # =====================================================
    # OBSERVAÇÃO DA APROVAÇÃO
    # =====================================================

    observacao_aprovacao = Column(
        Text,
        nullable=True
    )

    # =====================================================
    # DATAS
    # =====================================================

    data_solicitacao = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    data_aprovacao = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # =====================================================
    # RELACIONAMENTOS
    # =====================================================

    usuario = relationship(
        "Usuario",
        foreign_keys=[usuario_id]
    )

    aprovador = relationship(
        "Usuario",
        foreign_keys=[aprovado_por]
    )

    def __repr__(self):

        return (
            f"<DespesaForaCaixa "
            f"{self.id} - {self.descricao}>"
        )