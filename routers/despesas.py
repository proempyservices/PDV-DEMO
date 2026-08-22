# =====================================================
# ROUTER DE DESPESAS
# =====================================================

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from decimal import Decimal

from models.despesa_fora_caixa import DespesaForaCaixa
from services.calculo_caixa import calcular_saldo_caixa

from models.despesa import Despesa
from models.usuario import Usuario

from schemas.despesa import (
    DespesaCreate,
    DespesaUpdate,
    DespesaResponse,
    DespesaAprovar,
    DespesaRejeitar,
    DespesaSolicitacaoResponse
)





# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/despesas",
    tags=["Despesas"]
)


# =====================================================
# AUXILIAR
# TRANSFORMAR DESPESA EM RESPOSTA
# =====================================================

def despesa_para_resposta(despesa):

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

        "valor_proposto": despesa.valor_proposto,

        "valor_aprovado": despesa.valor_aprovado,

        "estado": despesa.estado,

        "observacao": despesa.observacao,

        "data_despesa": despesa.data_despesa
    }


# =====================================================
# CRIAR DESPESA DIRETAMENTE
#
# ADMIN
#
# POST /despesas/
# =====================================================

@router.post(
    "/",
    response_model=DespesaResponse
)
async def criar_despesa(
    dados: DespesaCreate,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR USUÁRIO
    # -------------------------------------------------

    resultado = await db.execute(
        select(Usuario).where(
            Usuario.id == dados.usuario_id
        )
    )

    usuario = resultado.scalar_one_or_none()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # -------------------------------------------------
    # VERIFICAR ADMIN
    # -------------------------------------------------

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    if tipo_usuario not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente o administrador "
                "pode criar despesa diretamente"
            )
        )

    # -------------------------------------------------
    # VALIDAR VALOR
    # -------------------------------------------------

    if (
        dados.valor_proposto is None
        or dados.valor_proposto <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor da despesa "
                "deve ser maior que zero"
            )
        )

    # -------------------------------------------------
    # CRIAR
    # -------------------------------------------------

    despesa = Despesa(

        usuario_id=dados.usuario_id,

        descricao=dados.descricao,

        categoria=dados.categoria,

        valor_proposto=dados.valor_proposto,

        valor_aprovado=dados.valor_proposto,

        estado="aprovado",

        observacao=dados.observacao
    )

    db.add(despesa)

    await db.commit()

    await db.refresh(despesa)

    # -------------------------------------------------
    # RECARREGAR COM USUÁRIO
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)
        .options(
            selectinload(Despesa.usuario)
        )
        .where(
            Despesa.id == despesa.id
        )

    )

    despesa = resultado.scalar_one()

    return despesa_para_resposta(despesa)


# =====================================================
# LISTAR DESPESAS DE UM USUÁRIO
#
# GET /despesas/usuario/{usuario_id}
#
# ADMIN / GERENTE
#     -> TODAS
#
# VENDEDOR
#     -> SOMENTE AS SUAS
# =====================================================

@router.get(
    "/usuario/{usuario_id}",
    response_model=list[DespesaResponse]
)
async def listar_despesas(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR USUÁRIO
    # -------------------------------------------------

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

    # -------------------------------------------------
    # TIPO
    # -------------------------------------------------

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # -------------------------------------------------
    # CONSULTA
    # -------------------------------------------------

    consulta = (

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

    )

    # -------------------------------------------------
    # VENDEDOR
    # -------------------------------------------------

    if tipo_usuario == "vendedor":

        consulta = consulta.where(

            Despesa.usuario_id == usuario_id

        )

    # -------------------------------------------------
    # ADMIN / GERENTE
    # -------------------------------------------------

    elif tipo_usuario in [
        "admin",
        "administrador",
        "gerente"
    ]:

        pass

    # -------------------------------------------------
    # OUTRO
    # -------------------------------------------------

    else:

        raise HTTPException(
            status_code=403,
            detail=(
                "Sem permissão para "
                "visualizar despesas"
            )
        )

    # -------------------------------------------------
    # ORDENAR
    # -------------------------------------------------

    consulta = consulta.order_by(
        Despesa.data_despesa.desc()
    )

    resultado = await db.execute(
        consulta
    )

    despesas = resultado.scalars().all()

    return [
        despesa_para_resposta(despesa)
        for despesa in despesas
    ]

# =====================================================
# LISTAR DESPESAS REJEITADAS
#
# GET /despesas/rejeitadas?usuario_id=1
#
# ADMIN / GERENTE
# =====================================================

@router.get(
    "/rejeitadas",
    response_model=list[DespesaResponse]
)
async def listar_rejeitadas(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR USUÁRIO
    # -------------------------------------------------

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

    # -------------------------------------------------
    # TIPO
    # -------------------------------------------------

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # -------------------------------------------------
    # PERMISSÃO
    # -------------------------------------------------

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

    # -------------------------------------------------
    # BUSCAR REJEITADAS
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .where(
            Despesa.estado == "rejeitado"
        )

        .order_by(
            Despesa.data_despesa.desc()
        )

    )

    despesas = (
        resultado
        .scalars()
        .all()
    )

    # -------------------------------------------------
    # RETORNAR
    # -------------------------------------------------

    return [

        despesa_para_resposta(
            despesa
        )

        for despesa in despesas

    ]
# =====================================================
# LISTAR DESPESAS PENDENTES
#
# ADMIN / GERENTE
#
# GET /despesas/pendentes?usuario_id=1
# =====================================================

# =====================================================
# LISTAR DESPESAS PARA ADMIN / GERENTE
#
# GET /despesas/pendentes?usuario_id=1
#
# IMPORTANTE:
# Apesar do nome da rota ser /pendentes,
# ela retorna TODAS as despesas:
#
# - pendente
# - aprovado
# - rejeitado
#
# ADMIN / GERENTE
#     -> vê todas
# =====================================================

@router.get(
    "/pendentes",
    response_model=list[DespesaResponse]
)
async def listar_pendentes(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR USUÁRIO
    # -------------------------------------------------

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

    # -------------------------------------------------
    # TIPO DO USUÁRIO
    # -------------------------------------------------

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # -------------------------------------------------
    # PERMISSÃO
    # -------------------------------------------------

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

    # -------------------------------------------------
    # BUSCAR TODAS AS DESPESAS
    #
    # NÃO FILTRAR POR ESTADO
    #
    # Assim aparecem:
    #
    # pendente
    # aprovado
    # rejeitado
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .order_by(
            Despesa.data_despesa.desc()
        )

    )

    despesas = (
        resultado
        .scalars()
        .all()
    )

    # -------------------------------------------------
    # RETORNAR
    # -------------------------------------------------

    return [

        despesa_para_resposta(
            despesa
        )

        for despesa in despesas

    ]

# =====================================================
# ATUALIZAR DESPESA
#
# PUT /despesas/{id}?usuario_id=1
# =====================================================

@router.put(
    "/{id}",
    response_model=DespesaResponse
)
async def atualizar_despesa(
    id: int,
    usuario_id: int,
    dados: DespesaUpdate,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR USUÁRIO
    # -------------------------------------------------

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

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # -------------------------------------------------
    # BUSCAR DESPESA
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .where(
            Despesa.id == id
        )

    )

    despesa = resultado.scalar_one_or_none()

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Despesa não encontrada"
        )

    # -------------------------------------------------
    # VENDEDOR
    # -------------------------------------------------

    if tipo_usuario == "vendedor":

        if despesa.usuario_id != usuario.id:

            raise HTTPException(
                status_code=403,
                detail=(
                    "Você só pode alterar "
                    "suas próprias despesas"
                )
            )

        if despesa.estado != "pendente":

            raise HTTPException(
                status_code=403,
                detail=(
                    "Despesa aprovada "
                    "não pode ser alterada"
                )
            )

        dados_atualizacao = (
            dados.model_dump(
                exclude_unset=True
            )
        )

        dados_atualizacao.pop(
            "valor_aprovado",
            None
        )

        dados_atualizacao.pop(
            "estado",
            None
        )

    # -------------------------------------------------
    # ADMIN / GERENTE
    # -------------------------------------------------

    elif tipo_usuario in [
        "admin",
        "administrador",
        "gerente"
    ]:

        dados_atualizacao = (
            dados.model_dump(
                exclude_unset=True
            )
        )

    else:

        raise HTTPException(
            status_code=403,
            detail="Sem permissão"
        )

    # -------------------------------------------------
    # APLICAR
    # -------------------------------------------------

    for campo, valor in dados_atualizacao.items():

        setattr(
            despesa,
            campo,
            valor
        )

    await db.commit()

    await db.refresh(despesa)

    # -------------------------------------------------
    # RECARREGAR
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .where(
            Despesa.id == despesa.id
        )

    )

    despesa = resultado.scalar_one()

    return despesa_para_resposta(despesa)


# =====================================================
# SOLICITAR DESPESA
#
# POST /despesas/solicitar
#
# ADMIN
#     -> APROVADA
#
# VENDEDOR
#     -> PENDENTE
#
# GERENTE
#     -> BLOQUEADO
# =====================================================

# =====================================================
# SOLICITAR DESPESA
#
# POST /despesas/solicitar
#
# ADMIN / ADMINISTRADOR
#   -> verifica SOMENTE a própria caixa
#   -> saldo suficiente:
#        cria DESPESA aprovada
#
#   -> saldo insuficiente:
#        cria DESPESA FORA DA CAIXA pendente
#
# VENDEDOR
#   -> cria DESPESA normal pendente
#
# GERENTE
#   -> bloqueado
# =====================================================

@router.post(
    "/solicitar",
    response_model=DespesaSolicitacaoResponse
)

async def solicitar_despesa(
    dados: DespesaCreate,
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

    usuario = resultado.scalar_one_or_none()

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
    # VALIDAR VALOR
    # =================================================

    if dados.valor_proposto is None:

        raise HTTPException(
            status_code=400,
            detail="Informe o valor da despesa"
        )

    if dados.valor_proposto <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor da despesa "
                "deve ser maior que zero"
            )
        )

    valor = Decimal(
        str(dados.valor_proposto)
    )

    # =================================================
    # ADMIN / ADMINISTRADOR
    #
    # IMPORTANTE:
    #
    # O ADMIN PODE TAMBÉM SER VENDEDOR.
    #
    # Por isso verificamos SOMENTE a caixa dele:
    #
    # calcular_saldo_caixa(
    #     db,
    #     usuario.id
    # )
    #
    # NÃO usamos o saldo total das caixas.
    # =================================================

    if tipo_usuario in [
        "admin",
        "administrador"
    ]:

        # =============================================
        # CALCULAR SALDO DA PRÓPRIA CAIXA
        # =============================================

        dados_caixa = await calcular_saldo_caixa(
            db,
            usuario.id
        )

        saldo_proprio = Decimal(
            str(
                dados_caixa.get(
                    "saldo_caixa",
                    0
                )
            )
        )

        # =============================================
        # TEM SALDO SUFICIENTE
        #
        # CRIA DESPESA NORMAL
        # =============================================

        if saldo_proprio >= valor:

            despesa = Despesa(

                usuario_id=usuario.id,

                descricao=dados.descricao,

                categoria=dados.categoria,

                valor_proposto=valor,

                valor_aprovado=valor,

                estado="aprovado",

                observacao=dados.observacao

            )

            db.add(despesa)

            await db.commit()

            await db.refresh(despesa)

            # -----------------------------------------
            # RECARREGAR COM USUÁRIO
            # -----------------------------------------

            resultado = await db.execute(

                select(Despesa)

                .options(
                    selectinload(
                        Despesa.usuario
                    )
                )

                .where(
                    Despesa.id == despesa.id
                )

            )

            despesa = (
                resultado
                .scalar_one()
            )

            return despesa_para_resposta(
                despesa
            )

        # =============================================
        # SALDO INSUFICIENTE
        #
        # CRIAR FORA DA CAIXA
        # =============================================

        despesa_fora = DespesaForaCaixa(

            usuario_id=usuario.id,

            descricao=dados.descricao,

            categoria=dados.categoria,

            valor_solicitado=valor,

            valor_aprovado=None,

            # Saldo da PRÓPRIA caixa
            saldo_caixa=saldo_proprio,

            estado="pendente",

            observacao=dados.observacao

        )

        db.add(despesa_fora)

        await db.commit()

        # =============================================
        # IMPORTANTE
        #
        # O response_model desta rota é
        # DespesaResponse.
        #
        # Mas aqui criamos DespesaForaCaixa.
        #
        # Portanto não podemos retornar diretamente
        # DespesaForaCaixa nesta rota.
        #
        # Para o frontend saber que foi enviada
        # para fora da caixa, retornamos um erro
        # controlado depois do commit NÃO é ideal.
        #
        # Por isso esta implementação deve retornar
        # uma resposta compatível.
        # =============================================

        raise HTTPException(
            status_code=202,
            detail={
                "mensagem": (
                    "Saldo insuficiente na sua própria caixa. "
                    "A despesa foi enviada para aprovação "
                    "como despesa fora da caixa."
                ),
                "saldo_caixa": float(
                    saldo_proprio
                ),
                "valor_solicitado": float(
                    valor
                ),
                "fora_caixa": True
            }
        )

    # =================================================
    # GERENTE
    # =================================================

    elif tipo_usuario == "gerente":

        raise HTTPException(
            status_code=403,
            detail=(
                "O gerente não pode "
                "criar despesas"
            )
        )

    # =================================================
    # VENDEDOR
    #
    # Vendedor continua criando despesa pendente.
    # =================================================

    elif tipo_usuario == "vendedor":

        despesa = Despesa(

            usuario_id=usuario.id,

            descricao=dados.descricao,

            categoria=dados.categoria,

            valor_proposto=valor,

            valor_aprovado=None,

            estado="pendente",

            observacao=dados.observacao

        )

        db.add(despesa)

        await db.commit()

        await db.refresh(despesa)

    # =================================================
    # OUTROS
    # =================================================

    else:

        raise HTTPException(
            status_code=403,
            detail=(
                "Usuário sem permissão "
                "para criar despesa"
            )
        )

    # =================================================
    # RECARREGAR DESPESA NORMAL
    # =================================================

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .where(
            Despesa.id == despesa.id
        )

    )

    despesa = resultado.scalar_one()

    return despesa_para_resposta(
        despesa
    )

# =====================================================
# APAGAR DESPESA
#
# DELETE /despesas/{id}?usuario_id=1
# =====================================================

@router.delete(
    "/{id}"
)
async def apagar_despesa(
    id: int,
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR USUÁRIO
    # -------------------------------------------------

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

    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )

    # -------------------------------------------------
    # BUSCAR DESPESA
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa).where(
            Despesa.id == id
        )

    )

    despesa = resultado.scalar_one_or_none()

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Despesa não encontrada"
        )

    # -------------------------------------------------
    # VENDEDOR
    # -------------------------------------------------

    if tipo_usuario == "vendedor":

        if despesa.usuario_id != usuario.id:

            raise HTTPException(
                status_code=403,
                detail=(
                    "Você só pode apagar "
                    "suas próprias despesas"
                )
            )

        if despesa.estado != "pendente":

            raise HTTPException(
                status_code=403,
                detail=(
                    "Despesa aprovada "
                    "não pode ser removida"
                )
            )

    # -------------------------------------------------
    # ADMIN / GERENTE
    # -------------------------------------------------

    elif tipo_usuario in [
        "admin",
        "administrador",
        "gerente"
    ]:

        pass

    else:

        raise HTTPException(
            status_code=403,
            detail="Sem permissão"
        )

    # -------------------------------------------------
    # APAGAR
    # -------------------------------------------------

    await db.delete(despesa)

    await db.commit()

    return {
        "mensagem": "Despesa removida"
    }


# =====================================================
# APROVAR DESPESA
#
# PUT /despesas/{id}/aprovar?usuario_id=1
#
# ADMIN / GERENTE
# =====================================================

@router.put(
    "/{id}/aprovar",
    response_model=DespesaResponse
)
async def aprovar_despesa(
    id: int,
    usuario_id: int,
    dados: DespesaAprovar,
    db: AsyncSession = Depends(get_db)
):

    # -------------------------------------------------
    # BUSCAR RESPONSÁVEL
    # -------------------------------------------------

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

    tipo_usuario = (
        str(responsavel.tipo or "")
        .strip()
        .lower()
    )

    # -------------------------------------------------
    # PERMISSÃO
    # -------------------------------------------------

    if tipo_usuario not in [
        "admin",
        "administrador",
        "gerente"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Sem permissão para "
                "aprovar despesas"
            )
        )

    # -------------------------------------------------
    # BUSCAR DESPESA
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .where(
            Despesa.id == id
        )

    )

    despesa = resultado.scalar_one_or_none()

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Despesa não encontrada"
        )

    # -------------------------------------------------
    # VERIFICAR SE JÁ ESTÁ APROVADA
    # -------------------------------------------------

    if despesa.estado == "aprovado":

        raise HTTPException(
            status_code=400,
            detail="Esta despesa já está aprovada"
        )

    # -------------------------------------------------
    # VALIDAR VALOR
    # -------------------------------------------------

    if dados.valor_aprovado is None:

        raise HTTPException(
            status_code=400,
            detail="Informe o valor aprovado"
        )

    if dados.valor_aprovado <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor aprovado "
                "deve ser maior que zero"
            )
        )

    # -------------------------------------------------
    # APROVAR
    #
    # IMPORTANTE:
    # Removemos aqui a chamada para:
    #
    # calcular_saldo_caixa()
    #
    # porque essa função não existe no teu projeto.
    #
    # Primeiro fazemos a aprovação funcionar.
    # -------------------------------------------------

    despesa.valor_aprovado = (
        dados.valor_aprovado
    )

    despesa.estado = "aprovado"

    # -------------------------------------------------
    # CATEGORIA
    # -------------------------------------------------

    if dados.categoria is not None:

        despesa.categoria = (
            dados.categoria
        )

    # -------------------------------------------------
    # OBSERVAÇÃO
    # -------------------------------------------------

    if dados.observacao is not None:

        despesa.observacao = (
            dados.observacao
        )

    # -------------------------------------------------
    # GUARDAR
    # -------------------------------------------------

    await db.commit()

    await db.refresh(despesa)

    # -------------------------------------------------
    # RECARREGAR COM USUÁRIO
    # -------------------------------------------------

    resultado = await db.execute(

        select(Despesa)

        .options(
            selectinload(
                Despesa.usuario
            )
        )

        .where(
            Despesa.id == despesa.id
        )

    )

    despesa = resultado.scalar_one()

    return despesa_para_resposta(
        despesa
    )
# =====================================================
# REJEITAR DESPESA
#
# PUT /despesas/{id}/rejeitar?usuario_id=1
#
# ADMIN / GERENTE
#
# A despesa deve estar:
#     pendente
#
# Depois passa para:
#     rejeitado
# =====================================================

@router.put(
    "/{id}/rejeitar",
    response_model=DespesaResponse
)
async def rejeitar_despesa(

    id: int,

    usuario_id: int,

    dados: DespesaRejeitar,

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

    # =================================================
    # VERIFICAR USUÁRIO
    # =================================================

    if not responsavel:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # =================================================
    # TIPO DO USUÁRIO
    # =================================================

    tipo_usuario = (
        str(responsavel.tipo or "")
        .strip()
        .lower()
    )

    # =================================================
    # VERIFICAR PERMISSÃO
    #
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
                "pode rejeitar despesas"
            )
        )

    # =================================================
    # BUSCAR DESPESA
    # =================================================

    resultado = await db.execute(

        select(Despesa)

        .options(

            selectinload(
                Despesa.usuario
            )

        )

        .where(
            Despesa.id == id
        )

    )

    despesa = (
        resultado
        .scalar_one_or_none()
    )

    # =================================================
    # VERIFICAR DESPESA
    # =================================================

    if not despesa:

        raise HTTPException(
            status_code=404,
            detail="Despesa não encontrada"
        )

    # =================================================
    # SOMENTE DESPESA PENDENTE
    # =================================================

    if despesa.estado != "pendente":

        raise HTTPException(
            status_code=400,
            detail=(
                "Esta despesa já foi "
                f"{despesa.estado}"
            )
        )

    # =================================================
    # REJEITAR
    # =================================================

    despesa.estado = "rejeitado"

    # =================================================
    # NÃO EXISTE VALOR APROVADO
    # =================================================

    despesa.valor_aprovado = None

    # =================================================
    # OBSERVAÇÃO DA REJEIÇÃO
    # =================================================

    if dados.observacao is not None:

        despesa.observacao = (
            dados.observacao
        )

    # =================================================
    # GUARDAR NO BANCO
    # =================================================

    await db.commit()

    # =================================================
    # ATUALIZAR OBJETO
    # =================================================

    await db.refresh(
        despesa
    )

    # =================================================
    # RECARREGAR COM USUÁRIO
    #
    # Necessário para:
    # solicitante_nome
    # =================================================

    resultado = await db.execute(

        select(Despesa)

        .options(

            selectinload(
                Despesa.usuario
            )

        )

        .where(
            Despesa.id == despesa.id
        )

    )

    despesa = (
        resultado
        .scalar_one()
    )

    # =================================================
    # RETORNAR
    # =================================================

    return despesa_para_resposta(
        despesa
    )
# =====================================================
# AUXILIAR
# RESPOSTA DA SOLICITAÇÃO DE DESPESA
# =====================================================

def despesa_solicitacao_para_resposta(
    despesa,
    valor,
    tipo="despesa",
    saldo_caixa=None,
    mensagem=None
):

    return {

        "tipo": tipo,

        "id": despesa.id,

        "usuario_id": despesa.usuario_id,

        "descricao": despesa.descricao,

        "categoria": despesa.categoria,

        "valor": valor,

        "estado": despesa.estado,

        "saldo_caixa": saldo_caixa,

        "mensagem": mensagem

    }
