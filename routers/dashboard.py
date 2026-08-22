from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from models.produto import Produto
from models.lote_produto import LoteProduto
from models.venda import Venda
from models.despesa import Despesa


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
async def dashboard(
    db: AsyncSession = Depends(get_db)
):

    hoje = datetime.now().date()


    # =====================================================
    # VENDAS HOJE
    # =====================================================

    result = await db.execute(

        select(
            func.sum(
                Venda.total
            )
        )

        .where(
            func.date(
                Venda.data_venda
            ) == hoje
        )

    )

    vendas_hoje = result.scalar() or 0


    # =====================================================
    # TOTAL PRODUTOS
    # =====================================================
    #
    # IMPORTANTE:
    #
    # Aqui NÃO somamos as quantidades.
    #
    # Cada produto com stock disponível
    # conta apenas como 1 produto.
    #
    # Exemplo:
    #
    # Camisa = 2 unidades  -> 1 produto
    # Calsas = 30 unidades -> 1 produto
    #
    # =====================================================

    subquery_stock = (

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


    result = await db.execute(

        select(
            func.count(
                Produto.id
            )
        )

        .join(
            subquery_stock,

            subquery_stock.c.produto_id
            == Produto.id

        )

        .where(

            subquery_stock.c.stock_total > 0

        )

    )


    produtos_total = (
        result.scalar() or 0
    )


    # =====================================================
    # PRODUTOS BAIXO STOCK
    # =====================================================

    result = await db.execute(

        select(
            Produto
        )

        .where(
            Produto.quantidade
            <=
            Produto.stock_minimo
        )

    )


    produtos_baixo_stock = (
        result.scalars().all()
    )


    baixo_stock_total = (
        len(produtos_baixo_stock)
    )


    # =====================================================
    # PRODUTOS NOVOS
    # ÚLTIMOS 30 DIAS
    # =====================================================

    data_inicio = (

        datetime.now()
        -
        timedelta(days=30)

    )


    result = await db.execute(

        select(
            func.count(
                Produto.id
            )
        )

        .where(

            Produto.criado_em
            >=
            data_inicio

        )

    )


    produtos_novos = (
        result.scalar() or 0
    )


    # =====================================================
    # DESPESAS HOJE
    # SOMENTE DESPESAS APROVADAS
    # =====================================================

    result = await db.execute(

        select(

            func.sum(
                Despesa.valor_aprovado
            )

        )

        .where(

            func.date(
                Despesa.data_despesa
            )
            ==
            hoje

        )

        .where(

            Despesa.estado
            ==
            "aprovado"

        )

    )


    despesas = (
        result.scalar() or 0
    )


    # =====================================================
    # LUCRO
    # =====================================================

    lucro = (
        vendas_hoje
        -
        despesas
    )


    # =====================================================
    # RETORNO DASHBOARD
    # =====================================================

    return {

        "vendas_hoje":
            float(
                vendas_hoje
            ),


        "despesas_hoje":
            float(
                despesas
            ),


        "lucro_hoje":
            float(
                lucro
            ),


        "stock": {

            # =================================================
            # QUANTIDADE DE TIPOS DE PRODUTOS EM STOCK
            #
            # NÃO é quantidade de unidades.
            #
            # Exemplo:
            #
            # Wisk     = 1  -> conta 1
            # Camisa   = 2  -> conta 1
            # 2M       = 19 -> conta 1
            # Calsas   = 30 -> conta 1
            # Cerveja  = 0  -> não conta
            #
            # TOTAL = 4
            # =================================================

            "total":
                int(
                    produtos_total
                ),


            # =================================================
            # PRODUTOS CRIADOS NOS ÚLTIMOS 30 DIAS
            # =================================================

            "produtos_novos":
                int(
                    produtos_novos
                ),


            # =================================================
            # NÚMERO DE PRODUTOS COM BAIXO STOCK
            # =================================================

            "baixo_stock_total":
                int(
                    baixo_stock_total
                ),


            # =================================================
            # LISTA DE ALERTAS
            # =================================================

            "baixo_stock": [

                {

                    "id":
                        p.id,

                    "nome":
                        p.nome,

                    "quantidade":
                        p.quantidade,

                    "stock_minimo":
                        p.stock_minimo

                }

                for p
                in produtos_baixo_stock

            ]

        }

    }