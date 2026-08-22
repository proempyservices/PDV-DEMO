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


class Despesa(Base):

    __tablename__ = "despesas"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    # =================================================
    # USUÁRIO QUE CRIOU / SOLICITOU
    # =================================================

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )


    descricao = Column(
        String(150),
        nullable=False
    )


    categoria = Column(
        String(100),
        nullable=True
    )


    # =================================================
    # VALOR PROPOSTO
    # =================================================

    valor_proposto = Column(
        Numeric(10, 2),
        nullable=True
    )


    # =================================================
    # VALOR APROVADO
    # =================================================

    valor_aprovado = Column(
        Numeric(10, 2),
        nullable=True
    )


    observacao = Column(
        Text,
        nullable=True
    )


    # =================================================
    # ESTADO
    # =================================================

    estado = Column(
        String(30),
        nullable=False,
        default="pendente"
    )


    # =================================================
    # DATA
    # =================================================

    data_despesa = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    # =================================================
    # RELACIONAMENTO COM USUÁRIO
    # =================================================

    usuario = relationship(
        "Usuario",
        backref="despesas"
    )


    def __repr__(self):

        return f"<Despesa {self.descricao}>"