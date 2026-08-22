from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db

from schemas.entrada_stock import EntradaStockCreate

from schemas.produto import (
    ProdutoCreate,
    ProdutoUpdate,
    ProdutoResponse
)

from models.produto import Produto
from models.lote_produto import LoteProduto
from models.item_venda_lote import ItemVendaLote


router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)


# ==========================================================
# SINCRONIZAR PRODUTO COM O LOTE FIFO ATUAL
# ==========================================================
#
# REGRA:
#
# O stock REAL está nos LoteProduto.
#
# Produto.quantidade representa somente:
#
#     primeiro lote disponível
#
# Produto.preco_compra representa:
#
#     preço de compra do primeiro lote
#
# Produto.preco_venda representa:
#
#     preço de venda do primeiro lote
#
# ==========================================================

async def sincronizar_produto_com_lotes(
    produto: Produto,
    db: AsyncSession
):

    resultado = await db.execute(

        select(LoteProduto)

        .where(
            LoteProduto.produto_id == produto.id,
            LoteProduto.quantidade_atual > 0
        )

        .order_by(
            LoteProduto.id.asc()
        )

        .limit(1)
    )

    lote_atual = (
        resultado.scalar_one_or_none()
    )

    # ======================================================
    # NÃO EXISTE NENHUM LOTE
    # ======================================================

    if lote_atual is None:

        produto.quantidade = 0

        return produto

    # ======================================================
    # SINCRONIZAR COM O PRIMEIRO LOTE FIFO
    # ======================================================

    produto.quantidade = int(
        lote_atual.quantidade_atual or 0
    )

    produto.preco_compra = (
        lote_atual.preco_compra
    )

    produto.preco_venda = (
        lote_atual.preco_venda
    )

    return produto


# ==========================================================
# LISTAR PRODUTOS
# ==========================================================

@router.get(
    "/",
    response_model=list[ProdutoResponse]
)
async def listar_produtos(
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(
        select(Produto)
    )

    produtos = resultado.scalars().all()

    # ======================================================
    # SINCRONIZAR EM MEMÓRIA
    # ======================================================

    for produto in produtos:

        await sincronizar_produto_com_lotes(
            produto,
            db
        )

    # ======================================================
    # IMPORTANTE:
    #
    # NÃO fazemos commit aqui.
    #
    # GET não deve modificar stock.
    # ======================================================

    return produtos


# ==========================================================
# CRIAR PRODUTO
# ==========================================================

@router.post(
    "/",
    response_model=ProdutoResponse
)
async def criar_produto(
    dados: ProdutoCreate,
    db: AsyncSession = Depends(get_db)
):

    try:

        # ==================================================
        # VALIDAR PREÇO DE COMPRA
        # ==================================================

        if dados.preco_compra <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "O preço de compra "
                    "deve ser maior que zero."
                )
            )

        # ==================================================
        # VALIDAR PREÇO DE VENDA
        # ==================================================

        if dados.preco_venda <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "O preço de venda "
                    "deve ser maior que zero."
                )
            )

        # ==================================================
        # VALIDAR QUANTIDADE
        # ==================================================

        if dados.quantidade < 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "A quantidade não pode "
                    "ser negativa."
                )
            )

        # ==================================================
        # CRIAR PRODUTO
        # ==================================================

        produto = Produto(

            categoria_id=dados.categoria_id,

            nome=dados.nome,

            descricao=dados.descricao,

            preco_compra=dados.preco_compra,

            preco_venda=dados.preco_venda,

            quantidade=0,

            stock_minimo=dados.stock_minimo,

            unidade=dados.unidade,

            ativo=True
        )

        db.add(produto)

        await db.flush()

        # ==================================================
        # CRIAR LOTE INICIAL
        # ==================================================

        if dados.quantidade > 0:

            lote = LoteProduto(

                produto_id=produto.id,

                quantidade_inicial=dados.quantidade,

                quantidade_atual=dados.quantidade,

                preco_compra=dados.preco_compra,

                preco_venda=dados.preco_venda
            )

            db.add(lote)

            await db.flush()

        # ==================================================
        # SINCRONIZAR PRODUTO
        # ==================================================

        await sincronizar_produto_com_lotes(
            produto,
            db
        )

        # ==================================================
        # COMMIT
        # ==================================================

        await db.commit()

        await db.refresh(produto)

        return produto

    except HTTPException:

        await db.rollback()

        raise

    except Exception as error:

        await db.rollback()

        print(
            "ERRO AO CRIAR PRODUTO:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao criar produto."
        )


# ==========================================================
# ENTRADA DE STOCK
#
# CADA ENTRADA = NOVO LOTE
# ==========================================================

@router.post(
    "/{produto_id}/entrada-stock"
)
async def entrada_stock(
    produto_id: int,
    dados: EntradaStockCreate,
    db: AsyncSession = Depends(get_db)
):

    try:

        # ==================================================
        # VALIDAR QUANTIDADE
        # ==================================================

        if dados.quantidade <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "A quantidade deve ser "
                    "maior que zero."
                )
            )

        # ==================================================
        # VALIDAR PREÇO DE COMPRA
        # ==================================================

        if dados.preco_compra <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "O preço de compra "
                    "deve ser maior que zero."
                )
            )

        # ==================================================
        # BUSCAR PRODUTO
        # ==================================================

        resultado = await db.execute(

            select(Produto)

            .where(
                Produto.id == produto_id
            )

            .with_for_update()
        )

        produto = (
            resultado.scalar_one_or_none()
        )

        if produto is None:

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        # ==================================================
        # PREÇO DE VENDA DO NOVO LOTE
        # ==================================================

        if dados.preco_venda is not None:

            if dados.preco_venda <= 0:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "O preço de venda "
                        "deve ser maior que zero."
                    )
                )

            preco_venda_lote = (
                dados.preco_venda
            )

        else:

            # Se não foi informado,
            # usa o preço atual do produto.

            preco_venda_lote = (
                produto.preco_venda
            )

        # ==================================================
        # CRIAR NOVO LOTE
        # ==================================================

        lote = LoteProduto(

            produto_id=produto.id,

            quantidade_inicial=dados.quantidade,

            quantidade_atual=dados.quantidade,

            preco_compra=dados.preco_compra,

            preco_venda=preco_venda_lote
        )

        db.add(lote)

        await db.flush()

        # ==================================================
        # SINCRONIZAR
        #
        # Se o produto estava sem stock:
        #
        #     novo lote passa a ser o lote atual.
        #
        # Se ainda existia stock:
        #
        #     mantém o lote FIFO atual.
        # ==================================================

        await sincronizar_produto_com_lotes(
            produto,
            db
        )

        # ==================================================
        # COMMIT
        # ==================================================

        await db.commit()

        await db.refresh(produto)

        await db.refresh(lote)

        return {

            "mensagem":
                "Stock adicionado com sucesso",

            "produto_id":
                produto.id,

            "lote_id":
                lote.id,

            "quantidade_adicionada":
                dados.quantidade,

            "stock_atual":
                produto.quantidade,

            "preco_compra":
                produto.preco_compra,

            "preco_venda":
                produto.preco_venda
        }

    except HTTPException:

        await db.rollback()

        raise

    except Exception as error:

        await db.rollback()

        print(
            "ERRO AO ADICIONAR STOCK:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Erro interno ao adicionar stock."
            )
        )


# ==========================================================
# BUSCAR PRÓXIMO LOTE
# ==========================================================

@router.get(
    "/{produto_id}/proximo-lote"
)
async def buscar_proximo_lote(
    produto_id: int,
    db: AsyncSession = Depends(get_db)
):

    # ======================================================
    # VERIFICAR PRODUTO
    # ======================================================

    resultado = await db.execute(

        select(Produto)

        .where(
            Produto.id == produto_id
        )
    )

    produto = (
        resultado.scalar_one_or_none()
    )

    if produto is None:

        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado."
        )

    # ======================================================
    # BUSCAR LOTES
    # ======================================================

    resultado = await db.execute(

        select(LoteProduto)

        .where(

            LoteProduto.produto_id == produto_id,

            LoteProduto.quantidade_atual > 0
        )

        .order_by(
            LoteProduto.id.asc()
        )
    )

    lotes = resultado.scalars().all()

    # ======================================================
    # NÃO EXISTE PRÓXIMO LOTE
    # ======================================================

    if len(lotes) < 2:

        return {
            "existe": False
        }

    # ======================================================
    # SEGUNDO LOTE FIFO
    # ======================================================

    proximo_lote = lotes[1]

    return {

        "existe": True,

        "produto_id":
            produto.id,

        "lote_id":
            proximo_lote.id,

        "quantidade":
            proximo_lote.quantidade_atual,

        "preco_compra":
            proximo_lote.preco_compra,

        "preco_venda":
            proximo_lote.preco_venda
    }


# ==========================================================
# SINCRONIZAR LOTE ATUAL
# ==========================================================

@router.post(
    "/{produto_id}/sincronizar-lote"
)
async def sincronizar_lote_atual(
    produto_id: int,
    db: AsyncSession = Depends(get_db)
):

    try:

        resultado = await db.execute(

            select(Produto)

            .where(
                Produto.id == produto_id
            )

            .with_for_update()
        )

        produto = (
            resultado.scalar_one_or_none()
        )

        if produto is None:

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        # ==================================================
        # SINCRONIZAR
        # ==================================================

        await sincronizar_produto_com_lotes(
            produto,
            db
        )

        await db.commit()

        await db.refresh(produto)

        # ==================================================
        # BUSCAR LOTE ATUAL
        # ==================================================

        resultado = await db.execute(

            select(LoteProduto)

            .where(

                LoteProduto.produto_id == produto.id,

                LoteProduto.quantidade_atual > 0
            )

            .order_by(
                LoteProduto.id.asc()
            )

            .limit(1)
        )

        lote_atual = (
            resultado.scalar_one_or_none()
        )

        # ==================================================
        # SEM STOCK
        # ==================================================

        if lote_atual is None:

            return {

                "mensagem":
                    "Não existem mais lotes disponíveis",

                "produto_id":
                    produto.id,

                "lote_id":
                    None,

                "quantidade":
                    0,

                "preco_compra":
                    produto.preco_compra,

                "preco_venda":
                    produto.preco_venda
            }

        # ==================================================
        # RETORNAR
        # ==================================================

        return {

            "mensagem":
                "Produto atualizado com o lote atual",

            "produto_id":
                produto.id,

            "lote_id":
                lote_atual.id,

            "quantidade":
                lote_atual.quantidade_atual,

            "preco_compra":
                lote_atual.preco_compra,

            "preco_venda":
                lote_atual.preco_venda
        }

    except HTTPException:

        await db.rollback()

        raise

    except Exception as error:

        await db.rollback()

        print(
            "ERRO AO SINCRONIZAR LOTE:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao sincronizar lote."
        )


# ==========================================================
# BUSCAR PRODUTO
# ==========================================================

@router.get(
    "/{produto_id}",
    response_model=ProdutoResponse
)
async def buscar_produto(
    produto_id: int,
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(

        select(Produto)

        .where(
            Produto.id == produto_id
        )
    )

    produto = (
        resultado.scalar_one_or_none()
    )

    if produto is None:

        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado."
        )

    # ======================================================
    # SINCRONIZAR SOMENTE EM MEMÓRIA
    # ======================================================

    await sincronizar_produto_com_lotes(
        produto,
        db
    )

    return produto


# ==========================================================
# ATUALIZAR PRODUTO
# ==========================================================
#
# IMPORTANTE:
#
# ESTA ROTA NÃO ALTERA STOCK.
#
# Stock só pode ser alterado através de:
#
#     POST /produtos/{id}/entrada-stock
#
# ou
#
#     venda
#
# ==========================================================

@router.put(
    "/{produto_id}",
    response_model=ProdutoResponse
)
async def atualizar_produto(
    produto_id: int,
    dados: ProdutoUpdate,
    db: AsyncSession = Depends(get_db)
):

    try:

        # ==================================================
        # BUSCAR PRODUTO
        # ==================================================

        resultado = await db.execute(

            select(Produto)

            .where(
                Produto.id == produto_id
            )

            .with_for_update()
        )

        produto = (
            resultado.scalar_one_or_none()
        )

        if produto is None:

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        # ==================================================
        # CAMPOS RECEBIDOS
        # ==================================================

        campos = dados.model_dump(
            exclude_unset=True
        )

        # ==================================================
        # PROTEGER STOCK
        # ==================================================
        #
        # ESTA É A CORREÇÃO PRINCIPAL.
        #
        # Se o frontend enviar:
        #
        #     {"quantidade": 0}
        #
        # NÃO vamos colocar o stock em zero.
        #
        # ==================================================

        if "quantidade" in campos:

            raise HTTPException(

                status_code=400,

                detail=(
                    "A quantidade não pode ser "
                    "alterada diretamente. "
                    "Use a entrada de stock."
                )
            )

        # ==================================================
        # VALIDAR PREÇOS
        # ==================================================

        if (
            "preco_compra" in campos
            and campos["preco_compra"] <= 0
        ):

            raise HTTPException(

                status_code=400,

                detail=(
                    "O preço de compra "
                    "deve ser maior que zero."
                )
            )

        if (
            "preco_venda" in campos
            and campos["preco_venda"] <= 0
        ):

            raise HTTPException(

                status_code=400,

                detail=(
                    "O preço de venda "
                    "deve ser maior que zero."
                )
            )

        # ==================================================
        # CAMPOS CONTROLADOS PELOS LOTES
        # ==================================================

        campos_controlados = {
            "quantidade",
            "preco_compra",
            "preco_venda"
        }

        # ==================================================
        # ATUALIZAR CAMPOS CADASTRAIS
        # ==================================================

        for campo, valor in campos.items():

            if campo in campos_controlados:
                continue

            if hasattr(produto, campo):

                setattr(
                    produto,
                    campo,
                    valor
                )

        # ==================================================
        # PREÇO DE COMPRA
        #
        # Se o sistema permitir corrigir preço manualmente,
        # atualizamos os lotes.
        # ==================================================

        if "preco_compra" in campos:

            resultado = await db.execute(

                select(LoteProduto)

                .where(
                    LoteProduto.produto_id == produto.id
                )
            )

            lotes = resultado.scalars().all()

            for lote in lotes:

                lote.preco_compra = (
                    campos["preco_compra"]
                )

        # ==================================================
        # PREÇO DE VENDA
        # ==================================================

        if "preco_venda" in campos:

            resultado = await db.execute(

                select(LoteProduto)

                .where(
                    LoteProduto.produto_id == produto.id
                )
            )

            lotes = resultado.scalars().all()

            for lote in lotes:

                lote.preco_venda = (
                    campos["preco_venda"]
                )

        # ==================================================
        # SINCRONIZAR
        # ==================================================

        await db.flush()

        await sincronizar_produto_com_lotes(
            produto,
            db
        )

        # ==================================================
        # COMMIT
        # ==================================================

        await db.commit()

        await db.refresh(produto)

        return produto

    except HTTPException:

        await db.rollback()

        raise

    except Exception as error:

        await db.rollback()

        print(
            "ERRO AO ATUALIZAR PRODUTO:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao atualizar produto."
        )


# ==========================================================
# REMOVER PRODUTO
# ==========================================================

@router.delete(
    "/{produto_id}"
)
async def remover_produto(
    produto_id: int,
    db: AsyncSession = Depends(get_db)
):

    try:

        # ==================================================
        # BUSCAR PRODUTO
        # ==================================================

        resultado = await db.execute(

            select(Produto)

            .where(
                Produto.id == produto_id
            )

            .with_for_update()
        )

        produto = (
            resultado.scalar_one_or_none()
        )

        if produto is None:

            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado."
            )

        # ==================================================
        # BUSCAR LOTES
        # ==================================================

        resultado = await db.execute(

            select(LoteProduto)

            .where(
                LoteProduto.produto_id == produto_id
            )
        )

        lotes = resultado.scalars().all()

        # ==================================================
        # VERIFICAR VENDAS
        # ==================================================

        for lote in lotes:

            resultado = await db.execute(

                select(ItemVendaLote)

                .where(
                    ItemVendaLote.lote_id == lote.id
                )
            )

            alocacoes = (
                resultado.scalars().all()
            )

            if alocacoes:

                raise HTTPException(

                    status_code=400,

                    detail=(
                        "Não é possível apagar este "
                        "produto porque existem vendas "
                        "associadas aos seus lotes."
                    )
                )

        # ==================================================
        # APAGAR LOTES
        # ==================================================

        for lote in lotes:

            await db.delete(lote)

        # ==================================================
        # APAGAR PRODUTO
        # ==================================================

        await db.delete(produto)

        # ==================================================
        # COMMIT
        # ==================================================

        await db.commit()

        return {

            "mensagem":
                "Produto e seus lotes foram "
                "removidos com sucesso",

            "produto_id":
                produto_id
        }

    except HTTPException:

        await db.rollback()

        raise

    except Exception as error:

        await db.rollback()

        print(
            "ERRO AO REMOVER PRODUTO:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao remover produto."
        )