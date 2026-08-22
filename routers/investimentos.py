from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy import (
    select,
    func
)

from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from models.usuario import Usuario
from models.caixa import Caixa, MovimentoCaixa
from models.investimento import Investimento
from models.lucro_saque import LucroSaque
from models.despesa_fora_caixa import DespesaForaCaixa

from schemas.investimento import (
    InvestimentoCreate,
    InvestimentoResponse
)


router = APIRouter(
    prefix="/investimentos",
    tags=["Investimentos"]
)


# ==========================================================
# CALCULAR LUCRO DE SAQUE AINDA DISPONÍVEL
# ==========================================================

async def calcular_lucro_saque_disponivel(
    db: AsyncSession
):

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    LucroSaque.valor_enviado
                    -
                    LucroSaque.valor_sacado
                ),
                0
            )
        )

    )

    valor = (
        resultado.scalar()
        or Decimal("0.00")
    )

    valor = Decimal(
        str(valor)
    )

    if valor < Decimal("0.00"):

        valor = Decimal("0.00")


    return valor.quantize(
        Decimal("0.01")
    )


# ==========================================================
# CALCULAR DINHEIRO BASE DO ADMIN
#
# IMPORTANTE:
#
# O INVESTIMENTO NÃO É DESCONTADO AQUI.
#
# Isso significa que esta função NÃO altera
# a caixa por causa do investimento.
# ==========================================================

async def calcular_dinheiro_admin(
    db: AsyncSession,
    usuario_id: int
):

    # ======================================================
    # RECOLHIDO PELO ADMIN
    # ======================================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    MovimentoCaixa.valor
                ),
                0
            )
        )
        .where(
            MovimentoCaixa.responsavel_id
            == usuario_id
        )
        .where(
            MovimentoCaixa.tipo
            == "RECOLHA"
        )

    )

    admin_recolhido = (
        resultado.scalar()
        or Decimal("0.00")
    )

    admin_recolhido = Decimal(
        str(admin_recolhido)
    )


    # ======================================================
    # RETIRADAS DO ADMIN
    # ======================================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    MovimentoCaixa.valor
                ),
                0
            )
        )
        .where(
            MovimentoCaixa.responsavel_id
            == usuario_id
        )
        .where(
            MovimentoCaixa.tipo
            == "RETIRADA"
        )

    )

    admin_retirado = (
        resultado.scalar()
        or Decimal("0.00")
    )

    admin_retirado = Decimal(
        str(admin_retirado)
    )


    # ======================================================
    # DESPESAS DO ADMIN
    # ======================================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    DespesaForaCaixa.valor_aprovado
                ),
                0
            )
        )
        .where(
            DespesaForaCaixa.aprovado_por
            == usuario_id
        )
        .where(
            DespesaForaCaixa.estado
            == "aprovado"
        )

    )

    admin_despesas = (
        resultado.scalar()
        or Decimal("0.00")
    )

    admin_despesas = Decimal(
        str(admin_despesas)
    )


    # ======================================================
    # DINHEIRO RECEBIDO DOS GERENTES
    # ======================================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    MovimentoCaixa.valor
                ),
                0
            )
        )
        .join(
            Caixa,
            MovimentoCaixa.caixa_id
            == Caixa.id
        )
        .where(
            Caixa.usuario_id
            == usuario_id
        )
        .where(
            MovimentoCaixa.tipo
            == "RECOLHA_GERENTE"
        )

    )

    admin_recebido_gerentes = (
        resultado.scalar()
        or Decimal("0.00")
    )

    admin_recebido_gerentes = Decimal(
        str(admin_recebido_gerentes)
    )


    # ======================================================
    # LUCROS JÁ SACADOS
    # ======================================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    LucroSaque.valor_sacado
                ),
                0
            )
        )
        .where(
            LucroSaque.usuario_id
            == usuario_id
        )

    )

    admin_lucros_sacados = (
        resultado.scalar()
        or Decimal("0.00")
    )

    admin_lucros_sacados = Decimal(
        str(admin_lucros_sacados)
    )


    # ======================================================
    # TOTAL BASE DO ADMIN
    #
    # NÃO DESCONTAR INVESTIMENTO AQUI.
    # ======================================================

    total_admin = (

        admin_recolhido

        + admin_retirado

        + admin_recebido_gerentes

        - admin_despesas

        - admin_lucros_sacados

    )


    if total_admin < Decimal("0.00"):

        total_admin = Decimal(
            "0.00"
        )


    return total_admin.quantize(
        Decimal("0.01")
    )


# ==========================================================
# CALCULAR INVESTIMENTOS JÁ REALIZADOS
# ==========================================================

async def calcular_investimentos_realizados(
    db: AsyncSession,
    usuario_id: int
):

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    Investimento.valor
                ),
                0
            )
        )
        .where(
            Investimento.usuario_id
            == usuario_id
        )
        .where(
            Investimento.estado
            == "realizado"
        )

    )

    valor = (
        resultado.scalar()
        or Decimal("0.00")
    )


    return Decimal(
        str(valor)
    ).quantize(
        Decimal("0.01")
    )


# ==========================================================
# CRIAR INVESTIMENTO
# ==========================================================

@router.post(
    "/",
    response_model=InvestimentoResponse
)
async def criar_investimento(

    dados: InvestimentoCreate,

    db: AsyncSession = Depends(get_db)

):

    # ======================================================
    # BUSCAR USUÁRIO
    # ======================================================

    resultado = await db.execute(

        select(Usuario)
        .where(
            Usuario.id
            == dados.usuario_id
        )

    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )


    if usuario is None:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )


    # ======================================================
    # SOMENTE ADMIN
    # ======================================================

    tipo = str(
        usuario.tipo or ""
    ).strip().lower()


    if tipo not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente o Admin pode "
                "realizar investimentos."
            )
        )


    # ======================================================
    # VALIDAR VALOR
    # ======================================================

    try:

        valor = Decimal(
            str(
                dados.valor or 0
            )
        ).quantize(
            Decimal("0.01")
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Valor de investimento inválido."
        )


    if valor <= Decimal("0.00"):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor do investimento "
                "deve ser maior que zero."
            )
        )


    # ======================================================
    # CALCULAR SALDO BASE
    # ======================================================

    saldo_admin = await calcular_dinheiro_admin(

        db,

        usuario.id

    )


    # ======================================================
    # LUCRO DE SAQUE RESERVADO
    # ======================================================

    lucro_saque_disponivel = (

        await calcular_lucro_saque_disponivel(
            db
        )

    )


    # ======================================================
    # INVESTIMENTOS ANTERIORES
    # ======================================================

    investimentos_realizados = (

        await calcular_investimentos_realizados(
            db,
            usuario.id
        )

    )


    # ======================================================
    # DISPONÍVEL PARA INVESTIR
    # ======================================================

    disponivel_investimento = (

        saldo_admin

        - lucro_saque_disponivel

        - investimentos_realizados

    )


    if disponivel_investimento < Decimal("0.00"):

        disponivel_investimento = Decimal(
            "0.00"
        )


    # ======================================================
    # VALIDAR VALOR
    # ======================================================

    if valor > disponivel_investimento:

        raise HTTPException(

            status_code=400,

            detail=(
                "Valor superior ao dinheiro "
                "disponível para investimento. "
                f"Disponível: "
                f"{disponivel_investimento:.2f} MT."
            )

        )


    # ======================================================
    # BUSCAR CAIXA DO ADMIN
    # ======================================================

    resultado = await db.execute(

        select(Caixa)
        .where(
            Caixa.usuario_id
            == usuario.id
        )

    )

    caixa = (
        resultado
        .scalar_one_or_none()
    )


    # ======================================================
    # CRIAR CAIXA SE NÃO EXISTIR
    # ======================================================

    if caixa is None:

        caixa = Caixa(

            usuario_id=usuario.id,

            saldo=Decimal(
                "0.00"
            )

        )

        db.add(caixa)

        await db.flush()


    # ======================================================
    # SALDO ANTERIOR
    #
    # SOMENTE PARA HISTÓRICO.
    # ======================================================

    saldo_anterior = saldo_admin


    # ======================================================
    # CRIAR INVESTIMENTO
    # ======================================================

    investimento = Investimento(

        usuario_id=usuario.id,

        valor=valor,

        descricao=dados.descricao,

        observacao=dados.observacao,

        estado="realizado"

    )

    db.add(
        investimento
    )

    await db.flush()


    # ======================================================
    # REGISTRAR MOVIMENTO
    #
    # ATENÇÃO:
    #
    # NÃO ALTERAMOS caixa.saldo.
    #
    # saldo_depois fica igual ao saldo_anterior
    # apenas para registrar que o investimento
    # não mexeu no saldo da caixa.
    # ======================================================

    movimento = MovimentoCaixa(

        caixa_id=caixa.id,

        tipo="INVESTIMENTO",

        descricao=(
            f"Investimento: "
            f"{dados.descricao}"
        ),

        valor=valor,

        saldo_anterior=saldo_anterior,

        saldo_depois=saldo_anterior,

        responsavel_id=usuario.id,

        observacao=dados.observacao

    )

    db.add(
        movimento
    )


    # ======================================================
    # COMMIT
    # ======================================================

    await db.commit()


    await db.refresh(
        investimento
    )


    return investimento


# ==========================================================
# DADOS DISPONÍVEIS PARA INVESTIMENTO
# ==========================================================

@router.get(
    "/dashboard/disponivel"
)
async def dinheiro_disponivel_investimento(

    usuario_id: int,

    db: AsyncSession = Depends(get_db)

):

    # ======================================================
    # BUSCAR USUÁRIO
    # ======================================================

    resultado = await db.execute(

        select(Usuario)
        .where(
            Usuario.id
            == usuario_id
        )

    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )


    if usuario is None:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )


    # ======================================================
    # SOMENTE ADMIN
    # ======================================================

    tipo = str(
        usuario.tipo or ""
    ).strip().lower()


    if tipo not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Somente o Admin."
        )


    # ======================================================
    # SALDO BASE
    # ======================================================

    saldo_admin = await calcular_dinheiro_admin(

        db,

        usuario_id

    )


    # ======================================================
    # LUCRO RESERVADO
    # ======================================================

    lucro_saque = (

        await calcular_lucro_saque_disponivel(
            db
        )

    )


    # ======================================================
    # INVESTIMENTOS JÁ FEITOS
    # ======================================================

    investimentos = (

        await calcular_investimentos_realizados(
            db,
            usuario_id
        )

    )


    # ======================================================
    # DISPONÍVEL
    # ======================================================

    disponivel_investimento = (

        saldo_admin

        - lucro_saque

        - investimentos

    )


    if disponivel_investimento < Decimal("0.00"):

        disponivel_investimento = Decimal(
            "0.00"
        )


    # ======================================================
    # RETORNO
    # ======================================================

    return {

        "saldo_admin":
            float(
                saldo_admin
            ),

        "lucro_saque_reservado":
            float(
                lucro_saque
            ),

        "investimentos_realizados":
            float(
                investimentos
            ),

        "disponivel_investimento":
            float(
                disponivel_investimento
            )

    }

# ==========================================================
# LISTAR INVESTIMENTOS
# ==========================================================

@router.get(
    "/",
    response_model=list[InvestimentoResponse]
)
async def listar_investimentos(

    usuario_id: int,

    db: AsyncSession = Depends(get_db)

):

    # ======================================================
    # BUSCAR USUÁRIO
    # ======================================================

    resultado = await db.execute(

        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )

    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )

    if usuario is None:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )

    # ======================================================
    # SOMENTE ADMIN
    # ======================================================

    tipo = str(
        usuario.tipo or ""
    ).strip().lower()

    if tipo not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Somente o Admin."
        )

    # ======================================================
    # BUSCAR INVESTIMENTOS
    # ======================================================

    resultado = await db.execute(

        select(Investimento)
        .where(
            Investimento.usuario_id == usuario_id
        )
        .order_by(
            Investimento.id.desc()
        )

    )

    investimentos = (
        resultado
        .scalars()
        .all()
    )

    return investimentos