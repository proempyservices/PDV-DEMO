from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class LoteProduto(Base):

    __tablename__ = "lotes_produto"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False
    )

    quantidade_inicial = Column(
        Integer,
        nullable=False
    )

    quantidade_atual = Column(
        Integer,
        nullable=False
    )

    preco_compra = Column(
        Numeric(12, 2),
        nullable=False
    )

    # =====================================
    # PREÇO DE VENDA DO LOTE
    # =====================================

    preco_venda = Column(
        Numeric(12, 2),
        nullable=False
    )

    # =====================================
    # RELACIONAMENTO COM VENDAS
    # =====================================

    alocacoes = relationship(
        "ItemVendaLote",
        back_populates="lote"
    )
