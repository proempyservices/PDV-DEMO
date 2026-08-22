from sqlalchemy import Column, Integer, Numeric, DateTime
from sqlalchemy.sql import func

from database import Base


class Configuracao(Base):

    __tablename__ = "configuracoes"

    # =====================================================
    # ID
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # PERCENTAGEM DO LUCRO DESTINADA AO SAQUE
    #
    # Exemplo:
    # 50.00 = 50%
    # 40.00 = 40%
    # 30.00 = 30%
    # =====================================================

    percentual_saque = Column(
        Numeric(5, 2),
        nullable=False,
        default=50.00
    )

    # =====================================================
    # DATA DE ATUALIZAÇÃO
    # =====================================================

    data_atualizacao = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )