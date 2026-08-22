from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


# =====================================================
# VENDA
# =====================================================

class Venda(Base):

    __tablename__ = "vendas"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    total = Column(
        Numeric(10, 2),
        nullable=False
    )

    valor_entregue = Column(
        Numeric(10, 2),
        nullable=False
    )

    troco = Column(
        Numeric(10, 2),
        nullable=False
    )

    data_venda = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    usuario = relationship(
        "Usuario",
        backref="vendas"
    )

    itens = relationship(
        "ItemVenda",
        back_populates="venda",
        cascade="all, delete-orphan"
    )


# =====================================================
# ITEM VENDA
# =====================================================

class ItemVenda(Base):

    __tablename__ = "itens_venda"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    venda_id = Column(
        Integer,
        ForeignKey("vendas.id"),
        nullable=False
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False
    )

    quantidade = Column(
        Integer,
        nullable=False
    )

    preco_unitario = Column(
        Numeric(10, 2),
        nullable=False
    )

    subtotal = Column(
        Numeric(10, 2),
        nullable=False
    )

    venda = relationship(
        "Venda",
        back_populates="itens"
    )

    produto = relationship(
        "Produto"
    )

    lotes = relationship(
        "ItemVendaLote",
        back_populates="item_venda",
        cascade="all, delete-orphan"
    )