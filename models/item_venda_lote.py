from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    ForeignKey
)

from sqlalchemy.orm import relationship

from database import Base


class ItemVendaLote(Base):

    __tablename__ = "itens_venda_lote"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    item_venda_id = Column(
        Integer,
        ForeignKey("itens_venda.id"),
        nullable=False
    )

    lote_id = Column(
        Integer,
        ForeignKey("lotes_produto.id"),
        nullable=False
    )

    quantidade = Column(
        Integer,
        nullable=False
    )

    preco_compra = Column(
        Numeric(10, 2),
        nullable=False
    )

    preco_venda = Column(
        Numeric(10, 2),
        nullable=False
    )

    item_venda = relationship(
        "ItemVenda",
        back_populates="lotes"
    )

    lote = relationship(
        "LoteProduto"
    )