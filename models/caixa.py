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



# ======================================
# CAIXA ATUAL DO USUARIO
# ======================================

class Caixa(Base):

    __tablename__ = "caixas"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        unique=True,
        nullable=False
    )


    saldo = Column(
        Numeric(10,2),
        default=0,
        nullable=False
    )


    data_criacao = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    usuario = relationship(
        "Usuario",
        back_populates="caixa"
    )


    movimentos = relationship(
        "MovimentoCaixa",
        back_populates="caixa"
    )



# ======================================
# HISTORICO DA CAIXA
# ======================================

class MovimentoCaixa(Base):

    __tablename__ = "movimentos_caixa"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    caixa_id = Column(
        Integer,
        ForeignKey("caixas.id"),
        nullable=False
    )


    tipo = Column(
        String(30),
        nullable=False
    )


    descricao = Column(
        String(150),
        nullable=False
    )


    valor = Column(
        Numeric(10,2),
        nullable=False
    )


    saldo_anterior = Column(
        Numeric(10,2),
        nullable=False
    )


    saldo_depois = Column(
        Numeric(10,2),
        nullable=False
    )


    responsavel_id = Column(
        Integer,
        ForeignKey("usuarios.id")
    )


    observacao = Column(
        Text,
        nullable=True
    )


    data_movimento = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    caixa = relationship(
        "Caixa",
        back_populates="movimentos"
    )


    responsavel = relationship(
        "Usuario"
    )
