from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Usuario(Base):

    __tablename__ = "usuarios"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    nome = Column(
        String(100),
        nullable=False
    )


    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )


    senha_hash = Column(
        String(255),
        nullable=False
    )


    tipo = Column(
        String(30),
        default="vendedor"
    )


    ativo = Column(
        Boolean,
        default=True
    )


    criado_em = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    # ==========================
    # RELACIONAMENTO COM CAIXA
    # ==========================

    caixa = relationship(
        "Caixa",
        back_populates="usuario",
        uselist=False
    )


    # ==========================
    # MOVIMENTOS FEITOS PELO USUARIO
    # ==========================

    movimentos_caixa = relationship(
        "MovimentoCaixa",
        back_populates="responsavel"
    )


    def __repr__(self):

        return f"<Usuario {self.nome}>"