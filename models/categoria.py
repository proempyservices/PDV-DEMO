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



class Categoria(Base):

    __tablename__ = "categorias"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    nome = Column(
        String(100),
        unique=True,
        nullable=False
    )


    descricao = Column(
        String(255),
        nullable=True
    )


    ativo = Column(
        Boolean,
        default=True
    )


    criado_em = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    produtos = relationship(
        "Produto",
        back_populates="categoria"
    )



    def __repr__(self):

        return f"<Categoria {self.nome}>"