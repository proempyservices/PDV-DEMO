from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decimal import Decimal

from database import get_db

from models.configuracao import Configuracao

from schemas.configuracao import (
    ConfiguracaoResponse,
    ConfiguracaoUpdate
)


router = APIRouter(
    prefix="/configuracoes",
    tags=["Configurações"]
)


# ==========================================================
# BUSCAR CONFIGURAÇÃO
# ==========================================================

@router.get(
    "/",
    response_model=ConfiguracaoResponse
)
async def buscar_configuracao(
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Configuracao)
        .order_by(
            Configuracao.id.asc()
        )
        .limit(1)
    )

    configuracao = (
        resultado
        .scalar_one_or_none()
    )

    # ------------------------------------------------------
    # SE AINDA NÃO EXISTIR
    # CRIAR COM 50%
    # ------------------------------------------------------

    if configuracao is None:

        configuracao = Configuracao(
            percentual_saque=Decimal("50.00")
        )

        db.add(configuracao)

        await db.commit()

        await db.refresh(configuracao)

    return configuracao


# ==========================================================
# ALTERAR PERCENTAGEM
# ==========================================================

@router.put(
    "/",
    response_model=ConfiguracaoResponse
)
async def alterar_configuracao(
    dados: ConfiguracaoUpdate,
    db: AsyncSession = Depends(get_db)
):

    percentual = Decimal(
        str(dados.percentual_saque)
    )

    # ------------------------------------------------------
    # SEGURANÇA
    # ------------------------------------------------------

    if percentual < Decimal("0"):

        raise HTTPException(
            status_code=400,
            detail="A percentagem não pode ser negativa."
        )

    if percentual > Decimal("100"):

        raise HTTPException(
            status_code=400,
            detail="A percentagem não pode ser superior a 100%."
        )

    # ------------------------------------------------------
    # BUSCAR CONFIGURAÇÃO
    # ------------------------------------------------------

    resultado = await db.execute(
        select(Configuracao)
        .order_by(
            Configuracao.id.asc()
        )
        .limit(1)
    )

    configuracao = (
        resultado
        .scalar_one_or_none()
    )

    # ------------------------------------------------------
    # CRIAR SE NÃO EXISTIR
    # ------------------------------------------------------

    if configuracao is None:

        configuracao = Configuracao(
            percentual_saque=percentual
        )

        db.add(configuracao)

    # ------------------------------------------------------
    # ATUALIZAR
    # ------------------------------------------------------

    else:

        configuracao.percentual_saque = percentual

    await db.commit()

    await db.refresh(configuracao)

    return configuracao