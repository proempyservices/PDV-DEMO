from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    String,
    Text
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class Investimento(Base):

    __tablename__ = "investimentos"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True
    )

    valor = Column(
        Numeric(12, 2),
        nullable=False
    )

    descricao = Column(
        String(200),
        nullable=False
    )

    observacao = Column(
        Text,
        nullable=True
    )

    estado = Column(
        String(30),
        nullable=False,
        default="realizado"
    )

    data_investimento = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    usuario = relationship(
        "Usuario"
    )