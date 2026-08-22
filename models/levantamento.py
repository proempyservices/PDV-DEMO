from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from database import Base


class Levantamento(Base):

    __tablename__ = "levantamentos"

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

    valor = Column(
        Numeric(10, 2),
        nullable=False
    )

    data = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )