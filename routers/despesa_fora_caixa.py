# =====================================================
# ROUTER DE DESPESAS FORA DA CAIXA
# =====================================================
from sqlalchemy import (
    select,
    func,
    and_
)

from models.caixa import MovimentoCaixa
from models.caixa import Caixa
from datetime import datetime
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload

from database import get_db

from models.usuario import Usuario

from models.despesa_fora_caixa import DespesaForaCaixa

from schemas.despesa_fora_caixa import (
    DespesaForaCaixaCreate,
    DespesaForaCaixaAprovar,
    DespesaForaCaixaRejeitar,
    DespesaForaCaixaResponse
)


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/despesas-fora-caixa",
    tags=["Despesas Fora da Caixa"]
)


# =====================================================
# FUNÇÃO AUXILIAR
# TRANSFORMAR EM RESPOSTA
# =====================================================

def despesa_fora_caixa_para_resposta(despesa):

    return {

        "id": despesa.id,

        "usuario_id": despesa.usuario_id,

        "solicitante_nome": (
            despesa.usuario.nome
            if despesa.usuario
            else None
        ),

        "descricao": despesa.descricao,

        "categoria": despesa.categoria,

        "valor_solicitado": despesa.valor_solicitado,

        "valor_aprovado": despesa.valor_aprovado,

        "saldo_caixa": despesa.saldo_caixa,

        "estado": despesa.estado,

        "observacao": despesa.observacao,

        "aprovado_por": despesa.aprovado_por,

        "aprovador_nome": (
            despesa.aprovador.nome
            if despesa.aprovador
            else None
        ),

        "observacao_aprovacao":
            despesa.observacao_aprovacao,

        "data_solicitacao":
            despesa.data_solicitacao,

        "data_aprovacao":
            despesa.data_aprovacao
    }


async def calcular_valor_disponivel_aprovacao(
    usuario_id: int,
    tipo_usuario: str,
    db: AsyncSession
):
    # =================================================
    # NORMALIZAR TIPO
    # =================================================

    tipo_usuario = (
        str(tipo_usuario or "")
        .strip()
        .lower()
    )

    # =================================================
    # TOTAL RECOLHIDO PELO PRÓPRIO USUÁRIO
    #
    # RECOLHA:
    # vendedor -> gerente
    # vendedor -> admin
    # =================================================

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

    total_recolhido = (
        resultado.scalar()
        or Decimal("0.00")
    )

    total_recolhido = Decimal(
        str(total_recolhido)
    )


    # =================================================
    # TOTAL RETIRADO PELO PRÓPRIO USUÁRIO
    # =================================================

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

    total_retirado = (
        resultado.scalar()
        or Decimal("0.00")
    )

    total_retirado = Decimal(
        str(total_retirado)
    )


    # =================================================
    # DINHEIRO RECEBIDO DOS GERENTES
    #
    # IMPORTANTE:
    #
    # Quando o ADMIN recolhe do gerente, o movimento
    # é criado assim:
    #
    # tipo = RECOLHA_GERENTE
    # responsavel_id = ADMIN
    # caixa_id = CAIXA DO ADMIN
    #
    # Portanto devemos considerar esse dinheiro
    # como disponível para o ADMIN.
    # =================================================

    total_recebido_gerentes = Decimal(
        "0.00"
    )


    if tipo_usuario in [
        "admin",
        "administrador"
    ]:

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

        total_recebido_gerentes = (
            resultado.scalar()
            or Decimal("0.00")
        )

        total_recebido_gerentes = Decimal(
            str(total_recebido_gerentes)
        )


    # =================================================
    # VALOR BASE
    # =================================================

    if tipo_usuario == "gerente":

        # -------------------------------------------------
        # GERENTE
        #
        # Só pode utilizar aquilo que recolheu
        # dos vendedores.
        # -------------------------------------------------

        valor_base = total_recolhido


    elif tipo_usuario in [
        "admin",
        "administrador"
    ]:

        # -------------------------------------------------
        # ADMIN
        #
        # Pode utilizar:
        #
        # 1. Recolhas próprias
        # 2. Retiradas conforme sua regra atual
        # 3. Dinheiro recebido dos gerentes
        # -------------------------------------------------

        valor_base = (

            total_recolhido

            + total_retirado

            + total_recebido_gerentes

        )


    else:

        valor_base = Decimal(
            "0.00"
        )


    # =================================================
    # DESPESAS APROVADAS PELO PRÓPRIO USUÁRIO
    # =================================================

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

    total_despesas = (
        resultado.scalar()
        or Decimal("0.00")
    )

    total_despesas = Decimal(
        str(total_despesas)
    )


    # =================================================
    # DISPONIBILIDADE FINAL
    # =================================================

    valor_disponivel = (

        valor_base
        - total_despesas

    )


    # =================================================
    # NUNCA RETORNAR NEGATIVO
    # =================================================

    if valor_disponivel < 0:

        valor_disponivel = Decimal(
            "0.00"
        )


    # =================================================
    # RESPOSTA
    # =================================================

    return {

        "total_recolhido":
            total_recolhido,

        "total_retirado":
            total_retirado,

        "total_recebido_gerentes":
            total_recebido_gerentes,

        "total_despesas":
            total_despesas,

        "valor_disponivel":
            valor_disponivel

    }

@router.post(
    "/solicitar",
    response_model=DespesaForaCaixaResponse
)
async def solicitar_despesa_fora_caixa(

    dados: DespesaForaCaixaCreate,

    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR USUÁRIO
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == dados.usuario_id
        )

    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO DE USUÁRIO
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # SOMENTE VENDEDOR PODE SOLICITAR
    # =================================================

    # =================================================
    # VENDEDOR / ADMIN / ADMINISTRADOR PODEM SOLICITAR
    # =================================================

    if tipo_usuario not in [
        "vendedor",
        "admin",
        "administrador"
    ]:
        raise HTTPException(
            status_code=403,
            detail=(
                "Somente vendedor ou admin "
                "pode solicitar despesas fora da caixa"
            )
        )

    # =================================================
    # VALIDAR VALOR
    # =================================================

    if (
        dados.valor_solicitado is None
        or dados.valor_solicitado <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor solicitado "
                "deve ser maior que zero"
            )
        )
    # =================================================
    # DEFINIR ESTADO DA DESPESA
    #
    # VENDEDOR:
    #   fica pendente para aprovação
    #
    # ADMIN:
    #   já fica aprovado
    # =================================================

    if tipo_usuario in [
        "admin",
        "administrador"
    ]:

        estado = "pendente"

        valor_aprovado = None

        aprovado_por = None

        data_aprovacao = None

        observacao_aprovacao = None

    else:

        estado = "pendente"

        valor_aprovado = None

        aprovado_por = None

        data_aprovacao = None

        observacao_aprovacao = None

    # =================================================
    # CRIAR DESPESA
    # =================================================

    despesa = DespesaForaCaixa(

        usuario_id=dados.usuario_id,

        descricao=dados.descricao,

        categoria=dados.categoria,

        valor_solicitado=dados.valor_solicitado,

        valor_aprovado=valor_aprovado,

        saldo_caixa=Decimal("0.00"),

        estado=estado,

        observacao=dados.observacao,

        aprovado_por=aprovado_por,

        observacao_aprovacao=observacao_aprovacao,

        data_aprovacao=data_aprovacao
    )

    # =================================================
    # SALVAR
    # =================================================

    db.add(despesa)

    await db.commit()

    await db.refresh(despesa)

    # =================================================
    # RECARREGAR COM USUÁRIO E APROVADOR
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )

        )

        .where(
            DespesaForaCaixa.id == despesa.id
        )
    )

    despesa = (
        resultado
        .scalar_one()
    )

    # =================================================
    # RESPOSTA
    # =================================================

    return despesa_fora_caixa_para_resposta(
        despesa
    )

# =====================================================
# LISTAR DESPESAS
#
# GET
# /despesas-fora-caixa/usuario/{usuario_id}
#
# VENDEDOR:
#   somente suas despesas
#
# ADMIN / GERENTE:
#   todas as despesas
#   incluindo pendentes, aprovadas e rejeitadas
# =====================================================

@router.get(
    "/usuario/{usuario_id}",
    response_model=list[
        DespesaForaCaixaResponse
    ]
)
async def listar_despesas_fora_caixa(

    usuario_id: int,

    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR USUÁRIO LOGADO
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )

    usuario = resultado.scalar_one_or_none()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO DO USUÁRIO
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # CONSULTA BASE
    #
    # NÃO COLOCAR:
    #
    # estado == "pendente"
    #
    # porque queremos também:
    # - aprovado
    # - rejeitado
    # - pendente
    # =================================================

    consulta = (

        select(
            DespesaForaCaixa
        )

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )
        )
    )

    # =================================================
    # VENDEDOR
    #
    # Vê somente as próprias despesas
    # =================================================

    if tipo_usuario == "vendedor":

        consulta = consulta.where(

            DespesaForaCaixa.usuario_id
            == usuario_id

        )

    # =================================================
    # ADMIN / GERENTE
    #
    # Vê TODAS as despesas de TODOS os usuários.
    #
    # IMPORTANTE:
    # NÃO colocar filtro por usuario_id.
    # NÃO colocar filtro por estado.
    # =================================================

    elif tipo_usuario in [
        "admin",
        "administrador",
        "gerente"
    ]:

        pass

    # =================================================
    # OUTROS USUÁRIOS
    # =================================================

    else:

        raise HTTPException(
            status_code=403,
            detail=(
                "Sem permissão para "
                "visualizar despesas"
            )
        )

    # =================================================
    # ORDENAR
    #
    # Mais recentes primeiro
    # =================================================

    consulta = consulta.order_by(

        DespesaForaCaixa
        .data_solicitacao
        .desc()

    )

    # =================================================
    # EXECUTAR
    # =================================================

    resultado = await db.execute(
        consulta
    )

    despesas = (
        resultado
        .scalars()
        .all()
    )

    # =================================================
    # RETORNAR
    # =================================================

    return [

        despesa_fora_caixa_para_resposta(
            despesa
        )

        for despesa in despesas

    ]

# =====================================================
# HISTÓRICO GERAL DE DESPESAS FORA DA CAIXA
# =====================================================

@router.get(
    "/historico-geral",
    response_model=list[
        DespesaForaCaixaResponse
    ]
)
async def historico_geral_despesas_fora_caixa(

    usuario_id: int,

    db: AsyncSession = Depends(get_db)

):

    # =================================================
    # BUSCAR USUÁRIO
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )

    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO DO USUÁRIO
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # CONSULTA
    # =================================================

    consulta = (

        select(
            DespesaForaCaixa
        )

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )

        )
    )

    # =================================================
    # VENDEDOR
    # =================================================

    if tipo_usuario == "vendedor":

        consulta = consulta.where(

            DespesaForaCaixa.usuario_id
            == usuario_id

        )

    # =================================================
    # ADMIN / GERENTE
    # =================================================

    elif tipo_usuario in [
        "admin",
        "administrador",
        "gerente"
    ]:

        # Pode visualizar todas
        pass

    else:

        raise HTTPException(
            status_code=403,
            detail=(
                "Sem permissão para "
                "visualizar o histórico"
            )
        )

    # =================================================
    # ORDENAR
    # =================================================

    consulta = consulta.order_by(

        DespesaForaCaixa
        .data_solicitacao
        .desc()

    )

    # =================================================
    # EXECUTAR
    # =================================================

    resultado = await db.execute(
        consulta
    )

    despesas = (
        resultado
        .scalars()
        .all()
    )

    # =================================================
    # RETORNAR
    # =================================================

    return [

        despesa_fora_caixa_para_resposta(
            despesa
        )

        for despesa in despesas

    ]


# =====================================================
# LISTAR DESPESAS FORA DA CAIXA
# =====================================================

@router.get(
    "/pendentes",
    response_model=list[
        DespesaForaCaixaResponse
    ]
)
async def listar_pendentes(

    usuario_id: int,

    db: AsyncSession = Depends(get_db)

):

    # =================================================
    # BUSCAR USUÁRIO
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )

    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO DO USUÁRIO
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # SOMENTE ADMIN / GERENTE
    # =================================================

    if tipo_usuario not in [
        "admin",
        "administrador",
        "gerente"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente admin ou gerente "
                "pode visualizar esta lista"
            )
        )

    # =================================================
    # BUSCAR TODAS AS DESPESAS FORA DA CAIXA
    #
    # NÃO COLOCAR:
    #
    # .where(
    #     DespesaForaCaixa.estado == "pendente"
    # )
    #
    # Assim aparecem:
    #
    # - pendente
    # - aprovado
    # - rejeitado
    # =================================================

    resultado = await db.execute(

        select(
            DespesaForaCaixa
        )

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )

        )

        .order_by(

            DespesaForaCaixa
            .data_solicitacao
            .desc()

        )

    )

    despesas = (
        resultado
        .scalars()
        .all()
    )

    # =================================================
    # RETORNAR
    # =================================================

    return [

        despesa_fora_caixa_para_resposta(
            despesa
        )

        for despesa in despesas

    ]

# =====================================================
# LISTAR DESPESAS FORA DA CAIXA REJEITADAS
#
# GET
# /despesas-fora-caixa/rejeitadas?usuario_id=1
#
# SOMENTE ADMIN / GERENTE
# =====================================================

@router.get(
    "/rejeitadas",
    response_model=list[
        DespesaForaCaixaResponse
    ]
)
async def listar_rejeitadas_fora_caixa(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR USUÁRIO
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )

    )

    usuario = (
        resultado.scalar_one_or_none()
    )

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO DO USUÁRIO
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # PERMISSÃO
    # =================================================

    if tipo_usuario not in [
        "admin",
        "administrador",
        "gerente"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente admin ou gerente "
                "pode visualizar despesas rejeitadas"
            )
        )

    # =================================================
    # BUSCAR DESPESAS REJEITADAS
    # =================================================

    resultado = await db.execute(

        select(
            DespesaForaCaixa
        )

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )

        )

        .where(
            DespesaForaCaixa.estado
            == "rejeitado"
        )

        .order_by(
            DespesaForaCaixa
            .data_aprovacao
            .desc()
        )

    )

    despesas = (
        resultado
        .scalars()
        .all()
    )

    # =================================================
    # RETORNAR
    # =================================================

    return [

        despesa_fora_caixa_para_resposta(
            despesa
        )

        for despesa in despesas

    ]
# =====================================================
# APROVAR DESPESA
#
# PUT
# /despesas-fora-caixa/{id}/aprovar?usuario_id=1
#
# ADMIN / GERENTE
# =====================================================

@router.put(
    "/{id}/aprovar",
    response_model=DespesaForaCaixaResponse
)
async def aprovar_despesa_fora_caixa(

    id: int,

    usuario_id: int,

    dados: DespesaForaCaixaAprovar,

    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR RESPONSÁVEL
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )

    responsavel = resultado.scalar_one_or_none()

    if not responsavel:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO
    # =================================================

    tipo_usuario = (
        str(responsavel.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # SOMENTE ADMIN / GERENTE
    # =================================================

    if tipo_usuario not in [
        "admin",
        "administrador",
        "gerente"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente admin ou gerente "
                "pode aprovar despesas"
            )
        )

    # =================================================
    # BUSCAR PEDIDO
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )
        )

        .where(
            DespesaForaCaixa.id == id
        )
    )

    despesa = resultado.scalar_one_or_none()

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Pedido não encontrado"
        )

    # =================================================
    # SÓ PODE APROVAR PENDENTE
    # =================================================

    if despesa.estado != "pendente":

        raise HTTPException(
            status_code=400,
            detail=(
                "Este pedido já foi "
                f"{despesa.estado}"
            )
        )

    # =================================================
    # VALIDAR VALOR
    # =================================================

    if (
        dados.valor_aprovado is None
        or dados.valor_aprovado <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor aprovado "
                "deve ser maior que zero"
            )
        )

    # =================================================
    # NÃO PODE APROVAR MAIS
    # QUE FOI SOLICITADO
    # =================================================

    if (
        dados.valor_aprovado
        > despesa.valor_solicitado
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor aprovado não pode "
                "ser maior que o valor solicitado"
            )
        )

    # =================================================
    # APROVAR
    # =================================================

    # =================================================
    # CALCULAR VALOR DISPONÍVEL
    #
    # NÃO CONSULTAMOS Caixa.saldo.
    #
    # CONSULTAMOS OS MOVIMENTOS REALIZADOS
    # PELO PRÓPRIO GERENTE / ADMIN.
    # =================================================

    # =================================================
    # CALCULAR DISPONIBILIDADE DO APROVADOR
    # =================================================

    saldo_aprovacao = (
        await calcular_valor_disponivel_aprovacao(
            usuario_id=responsavel.id,
            tipo_usuario=tipo_usuario,
            db=db
        )
    )

    valor_disponivel = (
        saldo_aprovacao["valor_disponivel"]
    )

    # =================================================
    # VERIFICAR SE PODE APROVAR
    # =================================================

    if dados.valor_aprovado > valor_disponivel:
        raise HTTPException(
            status_code=400,
            detail=(
                "Saldo insuficiente para aprovar "
                "esta despesa. "
                f"Valor disponível: "
                f"{valor_disponivel:.2f}. "
                f"Valor da despesa: "
                f"{dados.valor_aprovado:.2f}."
            )
        )

    # =================================================
    # APROVAR
    # =================================================

    despesa.valor_aprovado = (
        dados.valor_aprovado
    )

    despesa.estado = "aprovado"

    despesa.aprovado_por = (
        responsavel.id
    )

    despesa.observacao_aprovacao = (
        dados.observacao
    )

    despesa.data_aprovacao = (
        datetime.utcnow()
    )

    despesa.estado = "aprovado"

    # =================================================
    # IMPORTANTE
    #
    # ESTA APROVAÇÃO É GRAVADA NA PRÓPRIA
    # TABELA DESPESA_FORA_CAIXA.
    #
    # NÃO ALTERAMOS A TABELA DESPESAS.
    # =================================================

    await db.commit()

    await db.refresh(despesa)

    # =================================================
    # RECARREGAR
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )
        )

        .where(
            DespesaForaCaixa.id == despesa.id
        )
    )

    despesa = resultado.scalar_one()

    return despesa_fora_caixa_para_resposta(
        despesa
    )
# =====================================================
# REJEITAR DESPESA
#
# PUT
# /despesas-fora-caixa/{id}/rejeitar?usuario_id=1
#
# ADMIN / GERENTE
# =====================================================

@router.put(
    "/{id}/rejeitar",
    response_model=DespesaForaCaixaResponse
)
async def rejeitar_despesa_fora_caixa(

    id: int,

    usuario_id: int,

    dados: DespesaForaCaixaRejeitar,

    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR RESPONSÁVEL
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )

    responsavel = (
        resultado
        .scalar_one_or_none()
    )

    if not responsavel:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO
    # =================================================

    tipo_usuario = (
        str(responsavel.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # PERMISSÃO
    # =================================================

    if tipo_usuario not in [
        "admin",
        "administrador",
        "gerente"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente admin ou gerente "
                "pode rejeitar despesas"
            )
        )

    # =================================================
    # BUSCAR PEDIDO
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )

        )

        .where(
            DespesaForaCaixa.id == id
        )
    )

    despesa = (
        resultado
        .scalar_one_or_none()
    )

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Pedido não encontrado"
        )

    # =================================================
    # VERIFICAR ESTADO
    # =================================================

    if despesa.estado != "pendente":

        raise HTTPException(
            status_code=400,
            detail=(
                "Este pedido já foi "
                f"{despesa.estado}"
            )
        )

    # =================================================
    # REJEITAR
    # =================================================

    despesa.estado = "rejeitado"

    despesa.aprovado_por = (
        responsavel.id
    )

    despesa.observacao_aprovacao = (
        dados.observacao
    )

    despesa.data_aprovacao = (
        datetime.utcnow()
    )

    # =================================================
    # GUARDAR
    # =================================================

    await db.commit()

    await db.refresh(
        despesa
    )

    # =================================================
    # RECARREGAR
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(

            selectinload(
                DespesaForaCaixa.usuario
            ),

            selectinload(
                DespesaForaCaixa.aprovador
            )

        )

        .where(
            DespesaForaCaixa.id == despesa.id
        )
    )

    despesa = (
        resultado
        .scalar_one()
    )

    return despesa_fora_caixa_para_resposta(
        despesa
    )


# =====================================================
# APAGAR PEDIDO
#
# DELETE
# /despesas-fora-caixa/{id}?usuario_id=1
#
# VENDEDOR:
#   somente seu pedido pendente
#
# ADMIN / GERENTE:
#   qualquer pedido
# =====================================================

@router.delete(
    "/{id}"
)
async def apagar_despesa_fora_caixa(

    id: int,

    usuario_id: int,

    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR USUÁRIO
    # =================================================

    resultado = await db.execute(

        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )

    usuario = (
        resultado
        .scalar_one_or_none()
    )

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # BUSCAR DESPESA
    # =================================================

    resultado = await db.execute(

        select(
            DespesaForaCaixa
        )

        .where(
            DespesaForaCaixa.id == id
        )
    )

    despesa = (
        resultado
        .scalar_one_or_none()
    )

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Pedido não encontrado"
        )

    # =================================================
    # VENDEDOR
    # =================================================

    if tipo_usuario == "vendedor":

        if (
            despesa.usuario_id
            != usuario.id
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "Você só pode apagar "
                    "seus próprios pedidos"
                )
            )

        if despesa.estado != "pendente":

            raise HTTPException(
                status_code=403,
                detail=(
                    "Somente pedidos pendentes "
                    "podem ser apagados"
                )
            )

    # =================================================
    # ADMIN / GERENTE
    # =================================================

    elif tipo_usuario in [
        "admin",
        "administrador",
        "gerente"
    ]:

        pass

    # =================================================
    # OUTRO
    # =================================================

    else:

        raise HTTPException(
            status_code=403,
            detail="Sem permissão"
        )

    # =================================================
    # APAGAR
    # =================================================

    await db.delete(
        despesa
    )

    await db.commit()

    return {

        "mensagem":
            "Pedido de despesa removido"

    }

# =====================================================
# EDITAR DESPESA FORA DA CAIXA
#
# PUT
# /despesas-fora-caixa/{id}/editar?usuario_id=1
#
# VENDEDOR:
#   somente seu próprio pedido
#   somente enquanto estiver pendente
# =====================================================

@router.put(
    "/{id}/editar",
    response_model=DespesaForaCaixaResponse
)
async def editar_despesa_fora_caixa(

    id: int,

    usuario_id: int,

    dados: DespesaForaCaixaCreate,

    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR USUÁRIO
    # =================================================

    resultado = await db.execute(
        select(Usuario).where(
            Usuario.id == usuario_id
        )
    )

    usuario = resultado.scalar_one_or_none()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # SOMENTE VENDEDOR
    # =================================================

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    if tipo_usuario != "vendedor":

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente o vendedor pode editar "
                "o próprio pedido"
            )
        )

    # =================================================
    # BUSCAR DESPESA
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(
            selectinload(
                DespesaForaCaixa.usuario
            ),
            selectinload(
                DespesaForaCaixa.aprovador
            )
        )

        .where(
            DespesaForaCaixa.id == id
        )
    )

    despesa = resultado.scalar_one_or_none()

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Pedido não encontrado"
        )

    # =================================================
    # SOMENTE O DONO
    # =================================================

    if despesa.usuario_id != usuario_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "Você só pode editar "
                "seus próprios pedidos"
            )
        )

    # =================================================
    # SOMENTE PENDENTE
    # =================================================

    if despesa.estado != "pendente":

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente pedidos pendentes "
                "podem ser editados"
            )
        )

    # =================================================
    # VALIDAR VALOR
    # =================================================

    if (
        dados.valor_solicitado is None
        or dados.valor_solicitado <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor solicitado "
                "deve ser maior que zero"
            )
        )

    # =================================================
    # ATUALIZAR
    # =================================================

    despesa.descricao = dados.descricao

    despesa.categoria = dados.categoria

    despesa.valor_solicitado = (
        dados.valor_solicitado
    )

    despesa.observacao = dados.observacao

    # Continua pendente.
    despesa.estado = "pendente"

    # Não existe aprovação ainda.
    despesa.valor_aprovado = None

    despesa.aprovado_por = None

    despesa.observacao_aprovacao = None

    despesa.data_aprovacao = None

    # =================================================
    # SALVAR
    # =================================================

    await db.commit()

    await db.refresh(despesa)

    # =================================================
    # RECARREGAR RELACIONAMENTOS
    # =================================================

    resultado = await db.execute(

        select(DespesaForaCaixa)

        .options(
            selectinload(
                DespesaForaCaixa.usuario
            ),
            selectinload(
                DespesaForaCaixa.aprovador
            )
        )

        .where(
            DespesaForaCaixa.id == despesa.id
        )
    )

    despesa = resultado.scalar_one()

    return despesa_fora_caixa_para_resposta(
        despesa
    )