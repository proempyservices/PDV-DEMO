from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base



class Produto(Base):

    __tablename__ = "produtos"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    categoria_id = Column(
        Integer,
        ForeignKey("categorias.id"),
        nullable=False
    )


    nome = Column(
        String(150),
        nullable=False
    )


    descricao = Column(
        String(255),
        nullable=True
    )


    preco_compra = Column(
        Numeric(10,2),
        nullable=False
    )


    preco_venda = Column(
        Numeric(10,2),
        nullable=False
    )


    quantidade = Column(
        Integer,
        default=0
    )


    stock_minimo = Column(
        Integer,
        default=5
    )


    unidade = Column(
        String(50),
        default="unidade"
    )


    ativo = Column(
        Boolean,
        default=True
    )


    criado_em = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    categoria = relationship(
        "Categoria",
        back_populates="produtos"
    )



    def __repr__(self):

        return f"<Produto {self.nome}>"