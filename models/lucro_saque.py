from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from models.levantamento import Levantamento
from database import Base


class LucroSaque(Base):

    __tablename__ = "lucros_saque"

    # =====================================================
    # ID
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # USUÁRIO / CLIENTE
    # =====================================================

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True
    )

    # =====================================================
    # VENDA QUE GEROU O LUCRO
    # =====================================================

    venda_id = Column(
        Integer,
        ForeignKey("vendas.id"),
        nullable=False,
        index=True
    )

    # =====================================================
    # LUCRO GERADO
    # =====================================================

    lucro_gerado = Column(
        Numeric(12, 2),
        nullable=False
    )

    # =====================================================
    # PERCENTAGEM USADA PARA O SAQUE
    #
    # Exemplo:
    # 50.00 = 50%
    # 40.00 = 40%
    # =====================================================

    percentual_saque = Column(
        Numeric(5, 2),
        nullable=False
    )

    # =====================================================
    # VALOR ENVIADO PARA SAQUE
    # =====================================================

    valor_enviado = Column(
        Numeric(12, 2),
        nullable=False
    )

    # =====================================================
    # QUANTO JÁ FOI SACADO
    # =====================================================

    valor_sacado = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    # =====================================================
    # DATA
    # =====================================================

    data_criacao = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )