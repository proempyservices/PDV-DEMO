from decimal import Decimal
from datetime import datetime
from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from models.venda import Venda, ItemVenda
from models.despesa import Despesa
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException
from decimal import Decimal
from models.despesa_fora_caixa import DespesaForaCaixa
from models.lucro_saque import LucroSaque
from database import get_db

from models.usuario import Usuario
from models.caixa import Caixa, MovimentoCaixa

from schemas.caixa import (
    RecolherCaixa,
    RetirarCaixa
)

from services.calculo_caixa import calcular_saldo_caixa


router = APIRouter(
    prefix="/caixa",
    tags=["Caixa"]
)



# =====================================================
# MINHA CAIXA
# =====================================================

@router.get("/minha/{usuario_id}")
async def minha_caixa(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )

    usuario = resultado.scalar_one_or_none()


    if not usuario:
        raise HTTPException(
            404,
            "Usuário não encontrado"
        )


    dados = await calcular_saldo_caixa(
        db,
        usuario_id
    )



    resultado = await db.execute(

        select(MovimentoCaixa)

        .join(Caixa)

        .where(
            Caixa.usuario_id == usuario_id
        )

        .order_by(
            MovimentoCaixa.data_movimento.desc()
        )

    )


    movimentos = resultado.scalars().all()



    return {

        "usuario_id": usuario.id,

        "nome": usuario.nome,

        "tipo": usuario.tipo,


        "vendas": float(
            dados.get(
                "vendas",
                0
            )
        ),


        "despesas": float(
            dados.get(
                "despesas",
                0
            )
        ),


        "retirado": float(
            dados.get(
                "retirado",
                0
            )
        ),


        "saldo_atual": float(
            dados.get(
                "saldo_caixa",
                0
            )
        ),


        "movimentos": [

            {

                "tipo": item.tipo,

                "descricao": item.descricao,

                "valor": float(
                    item.valor
                ),

                "data": item.data_movimento,

                "observacao": item.observacao

            }

            for item in movimentos

        ]

    }





# =====================================================
# TODAS AS CAIXAS
# ADMIN / GERENTE
# =====================================================

@router.get("/todas")
async def todas_caixas(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )


    admin = resultado.scalar_one_or_none()



    if not admin:

        raise HTTPException(
            404,
            "Usuário não encontrado"
        )



    if admin.tipo not in [
        "admin",
        "gerente"
    ]:

        raise HTTPException(
            403,
            "Sem permissão"
        )



    resultado = await db.execute(
        select(Usuario)
    )


    usuarios = resultado.scalars().all()



    lista = []



    for usuario in usuarios:


        dados = await calcular_saldo_caixa(
            db,
            usuario.id
        )



        lista.append({

            "usuario_id": usuario.id,

            "nome": usuario.nome,

            "tipo": usuario.tipo,


            "vendas": float(
                dados.get(
                    "vendas",
                    0
                )
            ),


            "despesas": float(
                dados.get(
                    "despesas",
                    0
                )
            ),


            "retirado": float(
                dados.get(
                    "retirado",
                    0
                )
            ),


            "saldo": float(
                dados.get(
                    "saldo_caixa",
                    0
                )
            )

        })



    return lista





# =====================================================
# RECOLHER DINHEIRO DO VENDEDOR
# ADMIN / GERENTE
# =====================================================

# =====================================================
# RECOLHER DINHEIRO
#
# GERENTE:
#   pode recolher de vendedores
#
# ADMIN:
#   pode recolher de vendedores
#   pode recolher dinheiro dos gerentes
# =====================================================

@router.post("/recolher")
async def recolher_caixa(
    dados: RecolherCaixa,
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # =====================================================
    # BUSCAR RESPONSÁVEL PELA RECOLHA
    # =====================================================

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )

    responsavel = resultado.scalar_one_or_none()

    if not responsavel:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )


    tipo_responsavel = (
        str(responsavel.tipo or "")
        .strip()
        .lower()
    )


    # =====================================================
    # SOMENTE ADMIN / GERENTE
    # =====================================================

    if tipo_responsavel not in [
        "admin",
        "administrador",
        "gerente"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Sem permissão"
        )


    # =====================================================
    # VALIDAR VALOR
    # =====================================================

    if dados.valor <= 0:

        raise HTTPException(
            status_code=400,
            detail="O valor deve ser maior que zero"
        )


    # =====================================================
    # BUSCAR USUÁRIO ALVO
    # =====================================================

    resultado = await db.execute(

        select(Usuario)
        .where(
            Usuario.id == dados.vendedor_id
        )

    )

    alvo = resultado.scalar_one_or_none()


    if not alvo:

        raise HTTPException(
            status_code=404,
            detail="Usuário da caixa não encontrado"
        )


    tipo_alvo = (
        str(alvo.tipo or "")
        .strip()
        .lower()
    )


    # =====================================================
    # ADMIN RECOLHENDO DINHEIRO DO GERENTE
    #
    # IMPORTANTE:
    # GERENTE NÃO TEM CAIXA.
    #
    # Portanto NÃO criamos Caixa para o gerente.
    # =====================================================

    # =====================================================
    # ADMIN RECOLHENDO DINHEIRO DO GERENTE
    # =====================================================

    if tipo_alvo == "gerente":

        # -------------------------------------------------
        # SOMENTE ADMIN PODE RECOLHER DO GERENTE
        # -------------------------------------------------

        if tipo_responsavel not in [
            "admin",
            "administrador"
        ]:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Somente o admin pode "
                    "recolher dinheiro do gerente"
                )
            )

        # -------------------------------------------------
        # BUSCAR CAIXA DO ADMIN
        # -------------------------------------------------

        resultado = await db.execute(

            select(Caixa)

            .where(
                Caixa.usuario_id == responsavel.id
            )

        )

        caixa_admin = (
            resultado.scalar_one_or_none()
        )

        # -------------------------------------------------
        # CRIAR CAIXA DO ADMIN SE NECESSÁRIO
        # -------------------------------------------------

        if not caixa_admin:
            caixa_admin = Caixa(

                usuario_id=responsavel.id,

                saldo=Decimal("0.00")

            )

            db.add(caixa_admin)

            await db.flush()

        # -------------------------------------------------
        # TOTAL RECOLHIDO PELO GERENTE
        # -------------------------------------------------

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
                == alvo.id
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

        # -------------------------------------------------
        # DESPESAS APROVADAS PELO GERENTE
        # -------------------------------------------------

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
                == alvo.id
            )

            .where(
                DespesaForaCaixa.estado
                == "aprovado"
            )

        )

        despesas = (
                resultado.scalar()
                or Decimal("0.00")
        )

        despesas = Decimal(
            str(despesas)
        )

        # -------------------------------------------------
        # QUANTO ESTE GERENTE JÁ ENTREGOU AO ADMIN
        #
        # NÃO usamos gerente_id porque essa coluna
        # não existe no MovimentoCaixa.
        #
        # O ID fica gravado na descrição.
        # -------------------------------------------------

        marcador_gerente = (
            f"RECOLHA_GERENTE|gerente_id={alvo.id}|"
        )

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
                MovimentoCaixa.tipo
                == "RECOLHA_GERENTE"
            )

            .where(
                MovimentoCaixa.descricao.like(
                    marcador_gerente + "%"
                )
            )

        )

        total_entregue = (
                resultado.scalar()
                or Decimal("0.00")
        )

        total_entregue = Decimal(
            str(total_entregue)
        )

        # -------------------------------------------------
        # DINHEIRO DISPONÍVEL DO GERENTE
        # -------------------------------------------------

        valor_disponivel = (

                total_recolhido

                - despesas

                - total_entregue

        )

        if valor_disponivel < 0:
            valor_disponivel = Decimal(
                "0.00"
            )

        # -------------------------------------------------
        # VALIDAR VALOR
        # -------------------------------------------------

        valor_recolher = Decimal(
            str(dados.valor)
        )

        if valor_recolher <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O valor deve ser "
                    "maior que zero."
                )
            )

        if valor_recolher > valor_disponivel:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Valor maior que o dinheiro "
                    "disponível do gerente. "
                    f"Disponível: "
                    f"{valor_disponivel:.2f} MT"
                )
            )

        # -------------------------------------------------
        # SALDO ATUAL DO ADMIN
        # -------------------------------------------------

        dados_saldo_admin = (
            await calcular_saldo_caixa(
                db,
                responsavel.id
            )
        )

        saldo_admin_anterior = Decimal(
            str(
                dados_saldo_admin.get(
                    "saldo_caixa",
                    0
                )
            )
        )

        saldo_admin_depois = (
                saldo_admin_anterior
                + valor_recolher
        )

        # -------------------------------------------------
        # DESCRIÇÃO
        #
        # Guardamos o ID do gerente aqui porque
        # MovimentoCaixa não possui gerente_id.
        # -------------------------------------------------

        descricao_recolha = (

            f"RECOLHA_GERENTE|"
            f"gerente_id={alvo.id}|"
            f"Gerente: {alvo.nome}"

        )

        # -------------------------------------------------
        # REGISTRAR NA CAIXA DO ADMIN
        # -------------------------------------------------

        movimento = MovimentoCaixa(

            caixa_id=caixa_admin.id,

            tipo="RECOLHA_GERENTE",

            descricao=descricao_recolha,

            valor=valor_recolher,

            saldo_anterior=saldo_admin_anterior,

            saldo_depois=saldo_admin_depois,

            responsavel_id=responsavel.id,

            observacao=dados.observacao

        )

        db.add(movimento)

        await db.commit()

        # -------------------------------------------------
        # NOVO SALDO DO GERENTE
        # -------------------------------------------------

        novo_disponivel = (

                valor_disponivel
                - valor_recolher

        )

        # -------------------------------------------------
        # RESPOSTA
        # -------------------------------------------------

        return {

            "mensagem":
                "Dinheiro do gerente recolhido",

            "gerente_id":
                alvo.id,

            "gerente_nome":
                alvo.nome,

            "valor_recolhido":
                float(valor_recolher),

            "disponivel_anterior":
                float(valor_disponivel),

            "novo_disponivel":
                float(novo_disponivel),

            "admin_id":
                responsavel.id,

            "admin_saldo_anterior":
                float(
                    saldo_admin_anterior
                ),

            "admin_saldo_depois":
                float(
                    saldo_admin_depois
                )

        }

    # A PARTIR DAQUI:
    # RECOLHA NORMAL DE VENDEDOR
    # =====================================================

    if tipo_alvo != "vendedor":

        raise HTTPException(
            status_code=400,
            detail=(
                "Usuário inválido para recolha. "
                "Selecione um vendedor ou gerente."
            )
        )


    # =====================================================
    # GERENTE OU ADMIN RECOLHENDO DO VENDEDOR
    # =====================================================

    resultado = await db.execute(

        select(Caixa)

        .where(
            Caixa.usuario_id == alvo.id
        )

    )

    caixa = (
        resultado.scalar_one_or_none()
    )


    # =====================================================
    # CRIAR CAIXA DO VENDEDOR
    # =====================================================

    if not caixa:

        caixa = Caixa(
            usuario_id=alvo.id,
            saldo=Decimal("0.00")
        )

        db.add(caixa)

        await db.flush()


    # =====================================================
    # CALCULAR SALDO DO VENDEDOR
    # =====================================================

    saldo = await calcular_saldo_caixa(
        db,
        alvo.id
    )

    saldo_atual = Decimal(
        str(
            saldo["saldo_caixa"]
        )
    )


    # =====================================================
    # NOVO SALDO
    # =====================================================

    novo_saldo = (

        saldo_atual

        - dados.valor

    )


    # =====================================================
    # REGISTRAR RECOLHA
    # =====================================================

    movimento = MovimentoCaixa(

        caixa_id=caixa.id,

        tipo="RECOLHA",

        descricao="Entrega ao gerente/admin",

        valor=dados.valor,

        saldo_anterior=saldo_atual,

        saldo_depois=novo_saldo,

        responsavel_id=responsavel.id,

        observacao=dados.observacao

    )


    db.add(movimento)

    await db.commit()


    # =====================================================
    # RESPOSTA
    # =====================================================

    return {

        "mensagem":
            "Recolha realizada",

        "vendedor_id":
            alvo.id,

        "vendedor_nome":
            alvo.nome,

        "valor_recolhido":
            float(dados.valor),

        "saldo_anterior":
            float(saldo_atual),

        "novo_saldo":
            float(novo_saldo)

    }

# =====================================================
# RETIRAR DA PRÓPRIA CAIXA
# ADMIN / GERENTE
# =====================================================

@router.post("/retirar")
async def retirar_caixa(
    dados: RetirarCaixa,
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )


    usuario = resultado.scalar_one_or_none()



    if not usuario:

        raise HTTPException(
            404,
            "Usuário não encontrado"
        )



    resultado = await db.execute(
        select(Caixa)
        .where(
            Caixa.usuario_id == usuario_id
        )
    )


    caixa = resultado.scalar_one_or_none()



    if not caixa:

        caixa = Caixa(
            usuario_id=usuario_id,
            saldo=Decimal("0.00")
        )

        db.add(caixa)

        await db.flush()



    saldo = await calcular_saldo_caixa(
        db,
        usuario_id
    )



    saldo_atual = Decimal(
        str(
            saldo["saldo_caixa"]
        )
    )



    if dados.valor > saldo_atual:

        raise HTTPException(
            400,
            "Valor maior que saldo disponível"
        )



    movimento = MovimentoCaixa(

        caixa_id=caixa.id,

        tipo="RETIRADA",

        descricao="Retirada da própria caixa",

        valor=dados.valor,

        saldo_anterior=saldo_atual,

        saldo_depois=
            saldo_atual - dados.valor,

        responsavel_id=usuario.id,

        observacao=dados.observacao

    )



    db.add(movimento)


    await db.commit()



    return {

        "mensagem":
            "Retirada realizada",

        "novo_saldo":
            float(
                saldo_atual - dados.valor
            )

    }


# =====================================================
# HISTÓRICO GERAL
# ADMIN / GERENTE
# =====================================================

@router.get("/historico")
async def historico_geral(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # verificar permissão

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )

    usuario = resultado.scalar_one_or_none()


    if not usuario:
        raise HTTPException(
            404,
            "Usuário não encontrado"
        )


    if usuario.tipo not in [
        "admin",
        "gerente"
    ]:
        raise HTTPException(
            403,
            "Sem permissão"
        )


    historico = []


    # =====================================
    # MOVIMENTOS DE CAIXA
    # =====================================

    resultado = await db.execute(

        select(
            MovimentoCaixa,
            Usuario.nome
        )

        .join(
            Caixa,
            MovimentoCaixa.caixa_id == Caixa.id
        )

        .join(
            Usuario,
            Caixa.usuario_id == Usuario.id
        )

        .order_by(
            MovimentoCaixa.data_movimento.desc()
        )

    )


    for movimento, nome in resultado.all():

        historico.append({

            "nome": nome,

            "tipo": movimento.tipo,

            "valor": float(
                movimento.valor
            ),

            "data": movimento.data_movimento,

            "observacao":
                movimento.observacao or ""

        })


    # =====================================
    # VENDAS
    # =====================================

    resultado = await db.execute(

        select(Venda)

        .options(

            selectinload(
                Venda.usuario
            ),

            selectinload(
                Venda.itens
            )
            .selectinload(
                ItemVenda.produto
            )

        )

        .order_by(
            Venda.data_venda.desc()
        )

    )


    vendas = resultado.scalars().all()


    for venda in vendas:


        produtos = []


        for item in venda.itens:

            produtos.append(
                f"{item.quantidade} {item.produto.nome}"
            )


        historico.append({

            "nome":
                venda.usuario.nome,

            "tipo":
                "VENDA",

            "valor":
                float(venda.total),

            "data":
                venda.data_venda,

            "observacao":
                ", ".join(produtos)

        })


    # =====================================
    # DESPESAS APROVADAS
    # =====================================

    resultado = await db.execute(


        select(
            Despesa,
            Usuario.nome
        )

        .join(
            Usuario,
            Despesa.usuario_id == Usuario.id
        )

        .where(
            Despesa.estado == "aprovado"
        )

        .order_by(
            Despesa.data_despesa.desc()
        )


    )

    despesas = resultado.all()

    for despesa, nome_usuario in despesas:


            historico.append({

                "nome":
                    nome_usuario,

                "tipo":
                    "DESPESA",

                "valor":
                    float(
                        despesa.valor_aprovado
                        or 0
                    ),

                "data":
                    despesa.data_despesa,

                "observacao":
                    despesa.descricao

            })


    # ordenar tudo por data

    historico.sort(
        key=lambda x: x["data"],
        reverse=True
    )

    return historico

# =====================================================
# DINHEIRO TOTAL RECOLHIDO
#
# ADMIN:
#   - retiradas da própria caixa
#   - recolhas feitas pelo admin
#   - recolhas feitas pelos gerentes
#
# GERENTE:
#   - somente recolhas feitas pelo próprio gerente
#
# VENDEDOR:
#   - 0
# =====================================================

# =====================================================
# DINHEIRO TOTAL RECOLHIDO
#
# VENDEDOR:
#   - 0
#
# GERENTE:
#   - soma das RECOLHAS feitas pelo gerente
#
# ADMIN:
#   - RECOLHAS feitas pelo próprio admin
#   - RECOLHAS_GERENTE recebidas dos gerentes
#
# IMPORTANTE:
#   RECOLHA_GERENTE:
#       responsavel_id = ID DO GERENTE
#       caixa_id       = CAIXA DO ADMIN
#
#   Não existe gerente_id em MovimentoCaixa.
# =====================================================

# =====================================================
# DINHEIRO TOTAL DISPONÍVEL NO SISTEMA
#
# IMPORTANTE:
#
# Este endpoint é usado pelo CARD "Dinheiro Recolhido".
#
# O valor representa o TOTAL disponível entre:
#
#     ADMIN + GERENTES
#
# Uma transferência:
#
#     GERENTE -> ADMIN
#
# NÃO aumenta o total.
#
# Exemplo:
#
# Antes:
#     Gerente = 400
#     Admin   = 335
#     Total   = 735
#
# Depois de recolher 100 do gerente:
#
#     Gerente = 300
#     Admin   = 435
#     Total   = 735
#
# =====================================================

@router.get("/dashboard/dinheiro-recolhido")
async def dinheiro_recolhido(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # =================================================
    # BUSCAR USUÁRIO LOGADO
    # =================================================

    resultado = await db.execute(

        select(Usuario)

        .where(
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


    tipo_usuario = (
        str(usuario.tipo or "")
        .strip()
        .lower()
    )


    # =================================================
    # VENDEDOR
    # =================================================

    if tipo_usuario == "vendedor":

        return {

            "dinheiro_recolhido":
                0.0

        }


    # =================================================
    # GERENTE
    #
    # Para o gerente, mostrar somente o que ele
    # possui disponível depois de:
    #
    # RECOLHAS
    # - DESPESAS
    # - ENTREGAS AO ADMIN
    # =================================================

    if tipo_usuario == "gerente":

        # ---------------------------------------------
        # RECOLHIDO DOS VENDEDORES
        # ---------------------------------------------

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
                == usuario.id
            )

            .where(
                MovimentoCaixa.tipo
                == "RECOLHA"
            )

        )

        recolhido = (
            resultado.scalar()
            or Decimal("0.00")
        )

        recolhido = Decimal(
            str(recolhido)
        )


        # ---------------------------------------------
        # DESPESAS
        # ---------------------------------------------

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
                == usuario.id
            )

            .where(
                DespesaForaCaixa.estado
                == "aprovado"
            )

        )

        despesas = (
            resultado.scalar()
            or Decimal("0.00")
        )

        despesas = Decimal(
            str(despesas)
        )


        # ---------------------------------------------
        # JÁ ENTREGUE AO ADMIN
        # ---------------------------------------------

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
                == usuario.id
            )

            .where(
                MovimentoCaixa.tipo
                == "RECOLHA_GERENTE"
            )

        )

        entregue = (
            resultado.scalar()
            or Decimal("0.00")
        )

        entregue = Decimal(
            str(entregue)
        )


        # ---------------------------------------------
        # DISPONÍVEL
        # ---------------------------------------------

        total = (

            recolhido
            - despesas
            - entregue

        )


        if total < 0:

            total = Decimal(
                "0.00"
            )


        return {

            "dinheiro_recolhido":
                float(total)

        }


    # =================================================
    # ADMIN
    #
    # O CARD DO ADMIN DEVE REPRESENTAR:
    #
    #     ADMIN DISPONÍVEL
    #     +
    #     GERENTES DISPONÍVEIS
    #
    # Assim uma transferência entre gerente e admin
    # não altera o total geral.
    # =================================================

    if tipo_usuario in [
        "admin",
        "administrador"
    ]:


        # =================================================
        # TOTAL DOS ADMINISTRADORES
        # =================================================

        resultado = await db.execute(

            select(Usuario)

            .where(
                Usuario.tipo.in_([
                    "admin",
                    "administrador"
                ])
            )

        )

        admins = (
            resultado.scalars().all()
        )


        total_admin = Decimal(
            "0.00"
        )


        # =================================================
        # CALCULAR CADA ADMIN
        # =================================================

        for admin in admins:

            # ---------------------------------------------
            # RECOLHAS FEITAS PELO ADMIN
            # ---------------------------------------------

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
                    == admin.id
                )

                .where(
                    MovimentoCaixa.tipo
                    == "RECOLHA"
                )

            )

            recolhido = (
                resultado.scalar()
                or Decimal("0.00")
            )

            recolhido = Decimal(
                str(recolhido)
            )


            # ---------------------------------------------
            # RETIRADAS DO ADMIN
            # ---------------------------------------------

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
                    == admin.id
                )

                .where(
                    MovimentoCaixa.tipo
                    == "RETIRADA"
                )

            )

            retirado = (
                resultado.scalar()
                or Decimal("0.00")
            )

            retirado = Decimal(
                str(retirado)
            )


            # ---------------------------------------------
            # DESPESAS DO ADMIN
            # ---------------------------------------------

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
                    == admin.id
                )

                .where(
                    DespesaForaCaixa.estado
                    == "aprovado"
                )

            )

            despesas = (
                resultado.scalar()
                or Decimal("0.00")
            )

            despesas = Decimal(
                str(despesas)
            )


            # ---------------------------------------------
            # DINHEIRO RECEBIDO DOS GERENTES
            #
            # RECOLHA_GERENTE fica na CAIXA DO ADMIN.
            #
            # Portanto procuramos pelo caixa do admin.
            # ---------------------------------------------

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
                    == admin.id
                )

                .where(
                    MovimentoCaixa.tipo
                    == "RECOLHA_GERENTE"
                )

            )

            recebido_gerentes = (
                resultado.scalar()
                or Decimal("0.00")
            )

            recebido_gerentes = Decimal(
                str(recebido_gerentes)
            )


            # ---------------------------------------------
            # TOTAL DO ADMIN
            # ---------------------------------------------

            saldo_admin = (

                recolhido
                + retirado
                + recebido_gerentes
                - despesas

            )


            if saldo_admin < 0:

                saldo_admin = Decimal(
                    "0.00"
                )


            total_admin += saldo_admin


        # =================================================
        # TOTAL DOS GERENTES
        # =================================================

        resultado = await db.execute(

            select(Usuario)

            .where(
                Usuario.tipo == "gerente"
            )

        )

        gerentes = (
            resultado.scalars().all()
        )


        total_gerentes = Decimal(
            "0.00"
        )


        # =================================================
        # CALCULAR SALDO DE CADA GERENTE
        # =================================================

        for gerente in gerentes:

            # ---------------------------------------------
            # RECOLHIDO DOS VENDEDORES
            # ---------------------------------------------

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
                    == gerente.id
                )

                .where(
                    MovimentoCaixa.tipo
                    == "RECOLHA"
                )

            )

            recolhido = (
                resultado.scalar()
                or Decimal("0.00")
            )

            recolhido = Decimal(
                str(recolhido)
            )


            # ---------------------------------------------
            # DESPESAS DO GERENTE
            # ---------------------------------------------

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
                    == gerente.id
                )

                .where(
                    DespesaForaCaixa.estado
                    == "aprovado"
                )

            )

            despesas = (
                resultado.scalar()
                or Decimal("0.00")
            )

            despesas = Decimal(
                str(despesas)
            )


            # ---------------------------------------------
            # ENTREGUE AO ADMIN
            # ---------------------------------------------

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
                    == gerente.id
                )

                .where(
                    MovimentoCaixa.tipo
                    == "RECOLHA_GERENTE"
                )

            )

            entregue = (
                resultado.scalar()
                or Decimal("0.00")
            )

            entregue = Decimal(
                str(entregue)
            )


            # ---------------------------------------------
            # DISPONÍVEL DO GERENTE
            # ---------------------------------------------

            saldo_gerente = (

                recolhido
                - despesas
                - entregue

            )


            if saldo_gerente < 0:

                saldo_gerente = Decimal(
                    "0.00"
                )


            total_gerentes += (
                saldo_gerente
            )


        # =================================================
        # TOTAL GERAL
        #
        # ESTE É O VALOR DO CARD
        #
        # A transferência gerente -> admin:
        #
        #     - diminui total_gerentes
        #     + aumenta total_admin
        #
        # Resultado: TOTAL GERAL NÃO MUDA.
        # =================================================

        total_geral = (

            total_admin
            + total_gerentes

        )


        if total_geral < 0:

            total_geral = Decimal(
                "0.00"
            )


        # =================================================
        # LOG
        # =================================================

        print(
            "====================================="
        )

        print(
            "DINHEIRO RECOLHIDO - CARD"
        )

        print(
            "TOTAL ADMIN:",
            total_admin
        )

        print(
            "TOTAL GERENTES:",
            total_gerentes
        )

        print(
            "TOTAL GERAL:",
            total_geral
        )

        print(
            "====================================="
        )


        return {

            "dinheiro_recolhido":
                float(total_geral),

            "total_admin":
                float(total_admin),

            "total_gerentes":
                float(total_gerentes),

            "total_geral":
                float(total_geral)

        }


    # =================================================
    # OUTROS TIPOS
    # =================================================

    raise HTTPException(

        status_code=403,

        detail="Sem permissão"

    )

@router.get("/dashboard/dinheiro-recolhido-gerentes")
async def dinheiro_recolhido_gerentes(
    usuario_id: int,
    db: AsyncSession = Depends(get_db)
):

    # =====================================================
    # BUSCAR USUÁRIO LOGADO
    # =====================================================

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )

    usuario_logado = (
        resultado.scalar_one_or_none()
    )

    if not usuario_logado:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    tipo_logado = (
        str(usuario_logado.tipo or "")
        .strip()
        .lower()
    )

    if tipo_logado not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Somente admin pode acessar"
        )


    # =====================================================
    # BUSCAR ADMINS
    # =====================================================

    resultado = await db.execute(

        select(Usuario)

        .where(
            Usuario.tipo.in_([
                "admin",
                "administrador"
            ])
        )

        .order_by(
            Usuario.id.asc()
        )

    )

    admins = resultado.scalars().all()


    # =====================================================
    # BUSCAR GERENTES
    # =====================================================

    resultado = await db.execute(

        select(Usuario)

        .where(
            Usuario.tipo == "gerente"
        )

        .order_by(
            Usuario.nome.asc()
        )

    )

    gerentes = resultado.scalars().all()


    # =====================================================
    # FUNÇÃO AUXILIAR
    # CALCULAR SALDO DISPONÍVEL DO GERENTE
    # =====================================================

    async def calcular_gerente(
        gerente_id: int
    ):

        # =================================================
        # RECOLHAS FEITAS PELO GERENTE
        # DOS VENDEDORES
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
                == gerente_id
            )

            .where(
                MovimentoCaixa.tipo
                == "RECOLHA"
            )

        )

        recolhido = (
            resultado.scalar()
            or Decimal("0.00")
        )

        recolhido = Decimal(
            str(recolhido)
        )


        # =================================================
        # DESPESAS APROVADAS PELO GERENTE
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
                == gerente_id
            )

            .where(
                DespesaForaCaixa.estado
                == "aprovado"
            )

        )

        despesas = (
            resultado.scalar()
            or Decimal("0.00")
        )

        despesas = Decimal(
            str(despesas)
        )


        # =================================================
        # QUANTO O GERENTE JÁ ENTREGOU AO ADMIN
        # =================================================

        marcador_gerente = (
            f"RECOLHA_GERENTE|"
            f"gerente_id={gerente_id}|"
        )

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
                MovimentoCaixa.tipo
                == "RECOLHA_GERENTE"
            )

            .where(
                MovimentoCaixa.descricao.like(
                    marcador_gerente + "%"
                )
            )

        )

        entregue = (
            resultado.scalar()
            or Decimal("0.00")
        )

        entregue = Decimal(
            str(entregue)
        )


        # =================================================
        # DISPONÍVEL DO GERENTE
        # =================================================

        disponivel = (
            recolhido
            - despesas
            - entregue
        )

        if disponivel < Decimal("0.00"):

            disponivel = Decimal(
                "0.00"
            )


        return {

            "recolhido":
                recolhido,

            "despesas":
                despesas,

            "entregue":
                entregue,

            "total":
                disponivel

        }


    # =====================================================
    # VALORES DOS ADMINS
    # =====================================================

    admin_recolhido = Decimal(
        "0.00"
    )

    admin_retirado = Decimal(
        "0.00"
    )

    admin_despesas = Decimal(
        "0.00"
    )

    admin_recebido_gerentes = Decimal(
        "0.00"
    )

    admin_investimentos = Decimal(
        "0.00"
    )


    # =====================================================
    # CALCULAR MOVIMENTOS DOS ADMINS
    # =====================================================

    for admin in admins:

        # =================================================
        # RECOLHAS NORMAIS FEITAS PELO ADMIN
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
                == admin.id
            )

            .where(
                MovimentoCaixa.tipo
                == "RECOLHA"
            )

        )

        valor = (
            resultado.scalar()
            or Decimal("0.00")
        )

        admin_recolhido += Decimal(
            str(valor)
        )


        # =================================================
        # RETIRADAS DO ADMIN
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
                == admin.id
            )

            .where(
                MovimentoCaixa.tipo
                == "RETIRADA"
            )

        )

        valor = (
            resultado.scalar()
            or Decimal("0.00")
        )

        admin_retirado += Decimal(
            str(valor)
        )


        # =================================================
        # DESPESAS DO ADMIN
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
                == admin.id
            )

            .where(
                DespesaForaCaixa.estado
                == "aprovado"
            )

        )

        valor = (
            resultado.scalar()
            or Decimal("0.00")
        )

        admin_despesas += Decimal(
            str(valor)
        )


        # =================================================
        # INVESTIMENTOS DO ADMIN
        #
        # IMPORTANTE:
        #
        # Todo investimento criado em
        # investimentos.py gera:
        #
        # MovimentoCaixa.tipo = "INVESTIMENTO"
        #
        # Portanto esse dinheiro deve sair
        # do total disponível do Admin.
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
                == admin.id
            )

            .where(
                MovimentoCaixa.tipo
                == "INVESTIMENTO"
            )

        )

        valor = (
            resultado.scalar()
            or Decimal("0.00")
        )

        admin_investimentos += Decimal(
            str(valor)
        )


    # =====================================================
    # DINHEIRO RECEBIDO DOS GERENTES
    #
    # RECOLHA_GERENTE:
    # GERENTE -> ADMIN
    # =====================================================

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
            == usuario_logado.id
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


    # =====================================================
    # LUCROS JÁ SACADOS
    # =====================================================

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
            == usuario_logado.id
        )

    )

    admin_lucros_sacados = (
        resultado.scalar()
        or Decimal("0.00")
    )

    admin_lucros_sacados = Decimal(
        str(admin_lucros_sacados)
    )


    # =====================================================
    # DISPONÍVEL DO ADMIN
    #
    # RECOLHIDO
    #     +
    # RETIRADO
    #     +
    # RECEBIDO DOS GERENTES
    #     -
    # DESPESAS
    #     -
    # LUCROS SACADOS
    #     -
    # INVESTIMENTOS
    # =====================================================

    total_admin = (

        admin_recolhido

        + admin_retirado

        + admin_recebido_gerentes

        - admin_despesas

        - admin_lucros_sacados

        - admin_investimentos

    )


    if total_admin < Decimal("0.00"):

        total_admin = Decimal(
            "0.00"
        )


    # =====================================================
    # GERENTES
    # =====================================================

    gerentes_resposta = []

    total_gerentes = Decimal(
        "0.00"
    )


    for gerente in gerentes:

        dados = await calcular_gerente(
            gerente.id
        )

        total_gerentes += (
            dados["total"]
        )


        gerentes_resposta.append({

            "id":
                gerente.id,

            "nome":
                gerente.nome,

            "total_recolhido":
                float(
                    dados["total"]
                ),

            "recolhido":
                float(
                    dados["recolhido"]
                ),

            "despesas":
                float(
                    dados["despesas"]
                ),

            "entregue":
                float(
                    dados["entregue"]
                )

        })


    # =====================================================
    # TOTAL GERAL
    # =====================================================

    total_geral = (

        total_admin
        + total_gerentes

    )


    if total_geral < Decimal("0.00"):

        total_geral = Decimal(
            "0.00"
        )


    # =====================================================
    # LOG
    # =====================================================

    print(
        "====================================="
    )

    print(
        " DINHEIRO RECOLHIDO - DETALHES"
    )

    print(
        "ADMIN RECOLHIDO:",
        admin_recolhido
    )

    print(
        "ADMIN RETIRADO:",
        admin_retirado
    )

    print(
        "ADMIN DESPESAS:",
        admin_despesas
    )

    print(
        "ADMIN RECEBIDO GERENTES:",
        admin_recebido_gerentes
    )

    print(
        "ADMIN LUCROS SACADOS:",
        admin_lucros_sacados
    )

    print(
        "ADMIN INVESTIMENTOS:",
        admin_investimentos
    )

    print(
        "ADMIN DISPONÍVEL:",
        total_admin
    )

    print(
        "GERENTES DISPONÍVEL:",
        total_gerentes
    )

    print(
        "TOTAL GERAL:",
        total_geral
    )

    print(
        "====================================="
    )


    # =====================================================
    # RESPOSTA
    # =====================================================

    return {

        "admin": {

            "id":
                usuario_logado.id,

            "nome":
                usuario_logado.nome,

            "retirado":
                float(
                    admin_retirado
                ),

            "recolhido":
                float(
                    admin_recolhido
                ),

            "recebido_gerentes":
                float(
                    admin_recebido_gerentes
                ),

            "despesas":
                float(
                    admin_despesas
                ),

            "lucros_sacados":
                float(
                    admin_lucros_sacados
                ),

            "investimentos":
                float(
                    admin_investimentos
                ),

            "total":
                float(
                    total_admin
                )

        },

        "gerentes":
            gerentes_resposta,

        "total_gerentes":
            float(
                total_gerentes
            ),

        "total_geral":
            float(
                total_geral
            )

    }
@router.get("/dashboard/vendas-dia")
async def vendas_dia(
    usuario_id: int | None = None,
    db: AsyncSession = Depends(get_db)
):

    hoje = datetime.now().date()

    # =====================================
    # BUSCAR USUÁRIO
    # =====================================

    usuario = None

    if usuario_id is not None:

        resultado = await db.execute(
            select(Usuario)
            .where(
                Usuario.id == usuario_id
            )
        )

        usuario = resultado.scalar_one_or_none()

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

    # =====================================
    # BUSCAR TODAS AS VENDAS
    # =====================================

    consulta = select(Venda).order_by(
        Venda.data_venda.desc()
    )

    # =====================================
    # FILTRAR VENDEDOR
    # =====================================

    if (
        usuario is not None
        and usuario.tipo == "vendedor"
    ):

        consulta = consulta.where(
            Venda.usuario_id == usuario.id
        )

    resultado = await db.execute(
        consulta
    )

    vendas = resultado.scalars().all()

    print("=====================================")
    print(" VENDAS ENCONTRADAS:", len(vendas))
    print(" HOJE:", hoje)
    print("=====================================")

    total = Decimal("0.00")

    for venda in vendas:

        print(
            "VENDA:",
            venda.id,
            "USUARIO:",
            venda.usuario_id,
            "TOTAL:",
            venda.total,
            "DATA:",
            venda.data_venda
        )

        if venda.data_venda:

            data_venda = venda.data_venda

            if hasattr(data_venda, "date"):

                data_venda = data_venda.date()

            if data_venda == hoje:

                total += Decimal(
                    str(venda.total or 0)
                )

    print("=====================================")
    print("TOTAL VENDAS HOJE:", total)
    print("=====================================")

    return {
        "vendas_dia": float(total)
    }

