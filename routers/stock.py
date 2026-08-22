from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db

from models.produto import Produto
from models.lote_produto import LoteProduto


router = APIRouter(
    prefix="/stock",
    tags=["Stock"]
)


# =====================================================
# LISTAR STOCK
# =====================================================
#
# O STOCK REAL VEM DOS LOTES
#
# NÃO usar:
# Produto.quantidade
#
# Usar:
# SUM(LoteProduto.quantidade_atual)
#
# Exemplo:
#
# Camisa = 6
# Calça  = 2
#
# O stock será:
#
# Camisa -> 6
# Calça  -> 2
#
# =====================================================

@router.get("/")
async def listar_stock(
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(

        select(

            Produto.id,

            Produto.nome,

            Produto.categoria_id,

            Produto.stock_minimo,

            Produto.preco_compra,

            Produto.preco_venda,

            func.coalesce(
                func.sum(
                    LoteProduto.quantidade_atual
                ),
                0
            ).label(
                "stock_total"
            )

        )

        .outerjoin(
            LoteProduto,
            LoteProduto.produto_id == Produto.id
        )

        .group_by(

            Produto.id,

            Produto.nome,

            Produto.categoria_id,

            Produto.stock_minimo,

            Produto.preco_compra,

            Produto.preco_venda

        )

        .order_by(
            Produto.id.asc()
        )

    )


    resultados = resultado.all()


    return [

        {
            "id": id,

            "produto_id": id,

            "nome": nome,

            "categoria_id": categoria_id,

            "stock_minimo":
                int(stock_minimo or 0),

            "preco_compra":
                float(preco_compra or 0),

            "preco_venda":
                float(preco_venda or 0),

            "stock_total":
                int(stock_total or 0)

        }

        for (

            id,

            nome,

            categoria_id,

            stock_minimo,

            preco_compra,

            preco_venda,

            stock_total

        ) in resultados

    ]


# =====================================================
# STOCK DOS LOTES
# =====================================================
#
# Soma:
#
# LoteProduto.quantidade_atual
#
# agrupada por produto.
#
# =====================================================

@router.get("/lotes")
async def listar_stock_lotes(
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(

        select(

            Produto.id,

            Produto.nome,

            func.coalesce(
                func.sum(
                    LoteProduto.quantidade_atual
                ),
                0
            ).label(
                "stock_lotes"
            )

        )

        .outerjoin(
            LoteProduto,
            LoteProduto.produto_id == Produto.id
        )

        .group_by(

            Produto.id,

            Produto.nome

        )

        .order_by(
            Produto.id.asc()
        )

    )


    resultados = resultado.all()


    return [

        {
            "id": id,

            "produto_id": id,

            "nome": nome,

            "stock_lotes":
                int(stock_lotes or 0)

        }

        for (

            id,

            nome,

            stock_lotes

        ) in resultados

    ]


# =====================================================
# STOCK BAIXO
# =====================================================
#
# O stock baixo também usa os LOTES.
#
# =====================================================

@router.get("/baixo")
async def stock_baixo(
    db: AsyncSession = Depends(get_db)
):

    resultado = await db.execute(

        select(

            Produto.id,

            Produto.nome,

            Produto.stock_minimo,

            func.coalesce(
                func.sum(
                    LoteProduto.quantidade_atual
                ),
                0
            ).label(
                "stock_total"
            )

        )

        .outerjoin(

            LoteProduto,

            LoteProduto.produto_id ==
            Produto.id

        )

        .group_by(

            Produto.id,

            Produto.nome,

            Produto.stock_minimo

        )

        .having(

            func.coalesce(
                func.sum(
                    LoteProduto.quantidade_atual
                ),
                0
            )

            <=

            Produto.stock_minimo

        )

        .order_by(
            Produto.id.asc()
        )

    )


    resultados = resultado.all()


    return [

        {
            "id": id,

            "produto_id": id,

            "nome": nome,

            "stock_minimo":
                int(stock_minimo or 0),

            "stock_total":
                int(stock_total or 0)

        }

        for (

            id,

            nome,

            stock_minimo,

            stock_total

        ) in resultados

    ]


# =====================================================
# QUANTIDADE DE TIPOS DE PRODUTOS EM STOCK
# =====================================================
#
# IMPORTANTE:
#
# Isto NÃO soma as unidades.
#
# Exemplo:
#
# Camisa = 6
# Calça  = 2
#
# Resultado:
#
# quantidade_produtos = 2
#
# =====================================================

# =====================================================
# QUANTIDADE DE TIPOS DE PRODUTOS EM STOCK
# =====================================================

@router.get("/quantidade-produtos")
async def quantidade_produtos_em_stock(
    db: AsyncSession = Depends(get_db)
):

    # ---------------------------------------------
    # Agrupar stock dos lotes por produto
    # ---------------------------------------------

    subquery = (

        select(

            LoteProduto.produto_id,

            func.sum(
                LoteProduto.quantidade_atual
            ).label(
                "stock_total"
            )

        )

        .group_by(
            LoteProduto.produto_id
        )

        .subquery()

    )


    # ---------------------------------------------
    # CONTAR PRODUTOS QUE POSSUEM STOCK
    #
    # IMPORTANTE:
    # Não somar quantidades.
    #
    # Conta apenas os produtos cujo stock_total > 0.
    # ---------------------------------------------

    resultado = await db.execute(

        select(
            func.count(
                Produto.id
            )
        )

        .join(
            subquery,
            subquery.c.produto_id == Produto.id
        )

        .where(
            subquery.c.stock_total > 0
        )

    )


    quantidade = resultado.scalar_one() or 0


    return {
        "quantidade_produtos": int(quantidade)
    }