# services/estoque.py

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.produto import Produto
from models.lote_produto import LoteProduto


# ============================================================
# SINCRONIZAR PRODUTO COM OS LOTES
# ============================================================

async def sincronizar_produto_com_lotes(
    produto: Produto,
    db: AsyncSession
):
    """
    Mantém a tabela produtos sincronizada com lotes_produto.

    REGRAS:

    1. Produto.quantidade
       = soma da quantidade atual de TODOS os lotes.

    2. Produto.preco_compra
       = preço de compra do primeiro lote disponível.

    3. Produto.preco_venda
       = preço de venda do primeiro lote disponível.

    4. Os lotes são considerados pela ordem FIFO:
       lote mais antigo primeiro.

    5. Lotes com quantidade 0 são ignorados
       para determinar os preços atuais.

    6. Os dados históricos dos lotes NÃO são alterados.
    """

    # ========================================================
    # BUSCAR LOTES DO PRODUTO
    # ========================================================

    resultado = await db.execute(

        select(LoteProduto)

        .where(
            LoteProduto.produto_id == produto.id
        )

        .order_by(
            LoteProduto.id.asc()
        )

    )

    lotes = resultado.scalars().all()

    # ========================================================
    # CALCULAR STOCK TOTAL
    #
    # O stock da tabela produtos representa a soma
    # de todos os lotes.
    # ========================================================

    stock_total = sum(

        lote.quantidade_atual

        for lote in lotes

        if lote.quantidade_atual is not None

    )

    produto.quantidade = stock_total

    # ========================================================
    # ENCONTRAR PRIMEIRO LOTE DISPONÍVEL
    #
    # FIFO
    #
    # Exemplo:
    #
    # Lote 1 → 0 unidades
    # Lote 2 → 5 unidades
    # Lote 3 → 10 unidades
    #
    # O lote atual será o Lote 2.
    # ========================================================

    lote_atual = next(

        (
            lote

            for lote in lotes

            if lote.quantidade_atual is not None
            and lote.quantidade_atual > 0
        ),

        None

    )

    # ========================================================
    # ATUALIZAR PREÇOS NA TABELA PRODUTOS
    # ========================================================

    if lote_atual is not None:

        produto.preco_compra = (
            lote_atual.preco_compra
        )

        produto.preco_venda = (
            lote_atual.preco_venda
        )

    # ========================================================
    # CASO NÃO EXISTA NENHUM LOTE COM STOCK
    #
    # Não apagamos os preços do produto.
    #
    # A quantidade ficará 0.
    #
    # Os preços permanecem como último preço conhecido.
    # ========================================================

    # ========================================================
    # RETORNAR PRODUTO ATUALIZADO
    # ========================================================

    return produto


# ============================================================
# SINCRONIZAR PELO ID DO PRODUTO
# ============================================================

async def sincronizar_produto_por_id(
    produto_id: int,
    db: AsyncSession
):

    # ========================================================
    # BUSCAR PRODUTO
    # ========================================================

    resultado = await db.execute(

        select(Produto)

        .where(
            Produto.id == produto_id
        )

        .with_for_update()

    )

    produto = resultado.scalar_one_or_none()

    if produto is None:
        return None

    # ========================================================
    # SINCRONIZAR
    # ========================================================

    await sincronizar_produto_com_lotes(
        produto,
        db
    )

    return produto