from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from database import get_db

from models.caixa import Caixa, MovimentoCaixa
from models.usuario import Usuario
from models.venda import Venda, ItemVenda
from models.produto import Produto
from models.lote_produto import LoteProduto
from models.item_venda_lote import ItemVendaLote
from models.lucro_saque import LucroSaque
from models.configuracao import Configuracao
from models.levantamento import Levantamento

from schemas.venda import VendaCreate, VendaResponse


router = APIRouter(
    prefix="/vendas",
    tags=["Vendas"]
)


# ==========================================================
# SINCRONIZAR PRODUTO COM O LOTE FIFO ATUAL
# ==========================================================

async def sincronizar_produto_com_lotes(
    produto: Produto,
    db: AsyncSession
):
    """
    Atualiza o produto com os dados do primeiro lote
    disponível em FIFO.
    """

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

    lote_atual = resultado.scalar_one_or_none()

    # ------------------------------------------------------
    # NÃO EXISTE LOTE DISPONÍVEL
    # ------------------------------------------------------

    if lote_atual is None:
        produto.quantidade = 0
        return produto

    # ------------------------------------------------------
    # EXISTE LOTE DISPONÍVEL
    # ------------------------------------------------------

    produto.quantidade = int(
        lote_atual.quantidade_atual or 0
    )

    produto.preco_compra = Decimal(
        str(
            lote_atual.preco_compra or 0
        )
    )

    produto.preco_venda = Decimal(
        str(
            lote_atual.preco_venda or 0
        )
    )

    return produto


# ==========================================================
# REGISTRAR LUCRO DA VENDA
# ==========================================================

async def registrar_lucro_venda(
    usuario_id: int,
    venda_id: int,
    total_venda: Decimal,
    custo_total: Decimal,
    db: AsyncSession
):
    """
    Registra o lucro gerado pela venda.

    O percentual destinado ao saque é buscado
    automaticamente na tabela Configuracao.
    """

    # ======================================================
    # CALCULAR LUCRO
    # ======================================================

    lucro_gerado = (
        total_venda
        -
        custo_total
    )

    lucro_gerado = lucro_gerado.quantize(
        Decimal("0.01")
    )

    # ======================================================
    # PROTEÇÃO
    # ======================================================

    if lucro_gerado <= Decimal("0.00"):
        return None

    # ======================================================
    # BUSCAR CONFIGURAÇÃO
    # ======================================================

    resultado = await db.execute(
        select(Configuracao)
        .order_by(
            Configuracao.id.asc()
        )
        .limit(1)
    )

    configuracao = (
        resultado.scalar_one_or_none()
    )

    # ======================================================
    # SE NÃO EXISTIR CONFIGURAÇÃO
    # USAR 50%
    # ======================================================

    if configuracao is None:

        configuracao = Configuracao(
            percentual_saque=Decimal("50.00")
        )

        db.add(configuracao)

        await db.flush()

    # ======================================================
    # PERCENTUAL
    # ======================================================

    percentual_saque = Decimal(
        str(
            configuracao.percentual_saque or 0
        )
    )

    # ======================================================
    # CALCULAR VALOR ENVIADO
    # ======================================================

    valor_enviado = (
        lucro_gerado
        *
        percentual_saque
        /
        Decimal("100")
    )

    valor_enviado = valor_enviado.quantize(
        Decimal("0.01")
    )

    # ======================================================
    # CRIAR REGISTRO
    # ======================================================

    registro = LucroSaque(
        usuario_id=usuario_id,
        venda_id=venda_id,
        lucro_gerado=lucro_gerado,
        percentual_saque=percentual_saque,
        valor_enviado=valor_enviado,
        valor_sacado=Decimal("0.00")
    )

    db.add(registro)

    await db.flush()

    return registro


# ==========================================================
# CRIAR VENDA
# ==========================================================

@router.post(
    "/",
    response_model=VendaResponse
)
async def criar_venda(
    dados: VendaCreate,
    db: AsyncSession = Depends(get_db)
):

    try:

        # ==================================================
        # VALIDAR USUÁRIO
        # ==================================================

        resultado = await db.execute(
            select(Usuario)
            .where(
                Usuario.id == dados.usuario_id
            )
        )

        usuario = resultado.scalar_one_or_none()

        if usuario is None:

            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

        # ==================================================
        # VALIDAR ITENS
        # ==================================================

        if not dados.itens:

            raise HTTPException(
                status_code=400,
                detail="Adicione produtos ao carrinho."
            )

        # ==================================================
        # TOTAIS
        # ==================================================

        total = Decimal("0.00")

        custo_total_venda = Decimal("0.00")

        itens_processados = []

        # ==================================================
        # PROCESSAR CADA ITEM
        # ==================================================

        for item in dados.itens:

            quantidade_pedida = int(
                item.quantidade
            )

            if quantidade_pedida <= 0:

                raise HTTPException(
                    status_code=400,
                    detail="Quantidade inválida."
                )

            # ==================================================
            # BUSCAR PRODUTO COM LOCK
            # ==================================================

            resultado = await db.execute(
                select(Produto)
                .where(
                    Produto.id == item.produto_id
                )
                .with_for_update()
            )

            produto = resultado.scalar_one_or_none()

            if produto is None:

                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Produto ID "
                        f"{item.produto_id} "
                        f"não encontrado."
                    )
                )

            # ==================================================
            # BUSCAR LOTES DISPONÍVEIS
            # FIFO
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
                .with_for_update()
            )

            lotes = resultado.scalars().all()

            # ==================================================
            # STOCK REAL DOS LOTES
            # ==================================================

            quantidade_disponivel = sum(
                int(
                    lote.quantidade_atual or 0
                )
                for lote in lotes
            )

            # ==================================================
            # VALIDAR STOCK
            # ==================================================

            if quantidade_disponivel < quantidade_pedida:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuficiente: "
                        f"{produto.nome}. "
                        f"Disponível: "
                        f"{quantidade_disponivel}. "
                        f"Pedido: "
                        f"{quantidade_pedida}."
                    )
                )

            # ==================================================
            # VERIFICAR LOTE
            # ==================================================

            if not lotes:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"O produto "
                        f"{produto.nome} "
                        f"não possui stock disponível."
                    )
                )

            # ==================================================
            # PRIMEIRO LOTE
            # ==================================================

            lote_atual = lotes[0]

            preco_venda = Decimal(
                str(
                    lote_atual.preco_venda or 0
                )
            )

            if preco_venda <= 0:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Preço inválido para "
                        f"{produto.nome}."
                    )
                )

            # ==================================================
            # SUBTOTAL
            # ==================================================

            subtotal_item = (
                preco_venda
                *
                Decimal(
                    str(
                        quantidade_pedida
                    )
                )
            )

            # ==================================================
            # CONSUMIR LOTES FIFO
            # ==================================================

            quantidade_restante = quantidade_pedida

            custo_item = Decimal("0.00")

            movimentos = []

            for lote in lotes:

                if quantidade_restante <= 0:
                    break

                quantidade_disponivel_lote = int(
                    lote.quantidade_atual or 0
                )

                quantidade_lote = min(
                    quantidade_disponivel_lote,
                    quantidade_restante
                )

                if quantidade_lote <= 0:
                    continue

                # ------------------------------------------
                # PREÇO DE COMPRA
                # ------------------------------------------

                preco_compra = Decimal(
                    str(
                        lote.preco_compra or 0
                    )
                )

                # ------------------------------------------
                # CUSTO DO LOTE
                # ------------------------------------------

                custo_lote = (
                    preco_compra
                    *
                    Decimal(
                        str(
                            quantidade_lote
                        )
                    )
                )

                custo_item += custo_lote

                # ------------------------------------------
                # REDUZIR QUANTIDADE DO LOTE
                # ------------------------------------------

                lote.quantidade_atual = (
                    quantidade_disponivel_lote
                    -
                    quantidade_lote
                )

                # ------------------------------------------
                # REGISTRAR MOVIMENTO
                # ------------------------------------------

                movimentos.append(
                    {
                        "lote_id": lote.id,
                        "quantidade": quantidade_lote,
                        "preco_compra": preco_compra,
                        "preco_venda": preco_venda
                    }
                )

                quantidade_restante -= quantidade_lote

            # ==================================================
            # SEGURANÇA
            # ==================================================

            if quantidade_restante > 0:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Não foi possível consumir "
                        f"todo o stock de "
                        f"{produto.nome}."
                    )
                )

            # ==================================================
            # SINCRONIZAR PRODUTO
            # ==================================================

            await sincronizar_produto_com_lotes(
                produto,
                db
            )

            # ==================================================
            # GUARDAR ITEM PROCESSADO
            # ==================================================

            itens_processados.append(
                {
                    "produto_id": produto.id,
                    "quantidade": quantidade_pedida,
                    "preco_unitario": preco_venda,
                    "subtotal": subtotal_item,
                    "custo": custo_item,
                    "movimentos": movimentos
                }
            )

            # ==================================================
            # TOTAL DA VENDA
            # ==================================================

            total += subtotal_item

            # ==================================================
            # CUSTO TOTAL DA VENDA
            # ==================================================

            custo_total_venda += custo_item

        # ==================================================
        # VALOR ENTREGUE
        # ==================================================

        valor_entregue = Decimal(
            str(
                dados.valor_entregue or 0
            )
        )

        if valor_entregue < 0:

            raise HTTPException(
                status_code=400,
                detail="Valor entregue inválido."
            )

        # ==================================================
        # VALIDAR PAGAMENTO
        # ==================================================

        if valor_entregue < total:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Valor entregue insuficiente. "
                    f"Total: {total:.2f} MT. "
                    f"Entregue: "
                    f"{valor_entregue:.2f} MT."
                )
            )

        # ==================================================
        # CALCULAR TROCO
        # ==================================================

        troco = (
            valor_entregue
            -
            total
        )

        # ==================================================
        # CRIAR VENDA
        # ==================================================

        venda = Venda(
            usuario_id=dados.usuario_id,
            total=total,
            valor_entregue=valor_entregue,
            troco=troco
        )

        db.add(venda)

        # Precisamos do ID da venda antes de
        # registrar o lucro.

        await db.flush()

        # ==================================================
        # CRIAR ITENS DA VENDA
        # ==================================================

        for item in itens_processados:

            item_venda = ItemVenda(
                venda_id=venda.id,

                produto_id=item["produto_id"],

                quantidade=item["quantidade"],

                preco_unitario=item["preco_unitario"],

                subtotal=item["subtotal"]
            )

            db.add(item_venda)

            await db.flush()

            # ==============================================
            # REGISTRAR LOTES UTILIZADOS
            # ==============================================

            for movimento in item["movimentos"]:

                movimento_lote = ItemVendaLote(
                    item_venda_id=item_venda.id,

                    lote_id=movimento["lote_id"],

                    quantidade=int(
                        movimento["quantidade"]
                    ),

                    preco_compra=movimento["preco_compra"],

                    preco_venda=movimento["preco_venda"]
                )

                db.add(movimento_lote)

        # ==================================================
        # REGISTRAR LUCRO
        # ==================================================

        await registrar_lucro_venda(
            usuario_id=dados.usuario_id,
            venda_id=venda.id,
            total_venda=total,
            custo_total=custo_total_venda,
            db=db
        )

        # ==================================================
        # COMMIT
        # ==================================================

        await db.commit()

        # ==================================================
        # RECARREGAR VENDA
        # ==================================================

        resultado = await db.execute(
            select(Venda)
            .options(
                selectinload(
                    Venda.itens
                )
                .selectinload(
                    ItemVenda.produto
                )
            )
            .where(
                Venda.id == venda.id
            )
        )

        venda = resultado.scalar_one()

        return venda

    # ======================================================
    # ERRO DE VALIDAÇÃO
    # ======================================================

    except HTTPException:

        await db.rollback()

        raise

    # ======================================================
    # ERRO INTERNO
    # ======================================================

    except Exception as error:

        await db.rollback()

        print(
            "ERRO AO CRIAR VENDA:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao finalizar a venda."
        )


# ==========================================================
# DASHBOARD - VENDAS DO DIA
# ==========================================================

@router.get(
    "/dashboard/vendas-dia"
)
async def vendas_dia(

    usuario_id: int | None = None,

    db: AsyncSession = Depends(get_db)

):

    hoje = datetime.now(
        ZoneInfo("Africa/Maputo")
    ).date()

    usuario = None

    # ==================================================
    # VERIFICAR USUÁRIO
    # ==================================================

    if usuario_id is not None:

        resultado = await db.execute(
            select(Usuario)
            .where(
                Usuario.id == usuario_id
            )
        )

        usuario = (
            resultado.scalar_one_or_none()
        )

        if usuario is None:

            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

    # ==================================================
    # CONSULTA
    # ==================================================

    consulta = select(Venda)

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

    # ==================================================
    # SOMAR
    # ==================================================

    total = Decimal("0.00")

    for venda in vendas:

        if not venda.data_venda:
            continue

        data_venda = venda.data_venda

        if data_venda.tzinfo is None:

            data_venda = data_venda.replace(
                tzinfo=ZoneInfo("Africa/Maputo")
            )

        else:

            data_venda = data_venda.astimezone(
                ZoneInfo("Africa/Maputo")
            )

        if data_venda.date() == hoje:

            total += Decimal(
                str(
                    venda.total or 0
                )
            )

    return {
        "vendas_dia": float(total)
    }


# ==========================================================
# DASHBOARD - VENDAS POR VENDEDOR
# ==========================================================

@router.get(
    "/dashboard/vendas-vendedores"
)
async def vendas_por_vendedor(

    usuario_id: int,

    db: AsyncSession = Depends(get_db)

):

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )

    usuario = (
        resultado.scalar_one_or_none()
    )

    if usuario is None:

        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    consulta = (
        select(Venda)
        .options(
            selectinload(
                Venda.usuario
            ),
            selectinload(
                Venda.itens
            ).selectinload(
                ItemVenda.produto
            )
        )
    )

    # ==================================================
    # VENDEDOR
    # ==================================================

    if usuario.tipo == "vendedor":

        consulta = consulta.where(
            Venda.usuario_id == usuario.id
        )

    # ==================================================
    # GERENTE
    # ==================================================

    elif usuario.tipo == "gerente":

        consulta = (
            consulta
            .join(
                Usuario,
                Venda.usuario_id == Usuario.id
            )
            .where(
                Usuario.tipo == "vendedor"
            )
        )

    # ==================================================
    # BUSCAR
    # ==================================================

    resultado = await db.execute(
        consulta.order_by(
            Venda.data_venda.desc()
        )
    )

    vendas = resultado.scalars().all()

    dados = {}

    for venda in vendas:

        if venda.usuario is None:
            continue

        nome = venda.usuario.nome

        data = venda.data_venda.strftime(
            "%d/%m/%Y"
        )

        chave = (
            nome
            +
            "_"
            +
            data
        )

        if chave not in dados:

            dados[chave] = {
                "vendedor": nome,
                "data": data,
                "total": 0,
                "produtos": []
            }

        dados[chave]["total"] += float(
            venda.total or 0
        )

        for item in venda.itens:

            if item.produto is None:
                continue

            dados[chave]["produtos"].append(
                {
                    "produto": item.produto.nome,

                    "quantidade": item.quantidade,

                    "subtotal": float(
                        item.subtotal or 0
                    )
                }
            )

    return list(
        dados.values()
    )


# ==========================================================
# DEBUG VENDAS
# ==========================================================

@router.get(
    "/dashboard/debug-vendas"
)
async def debug_vendas(

    db: AsyncSession = Depends(get_db)

):

    resultado = await db.execute(
        select(Venda)
        .order_by(
            Venda.id.desc()
        )
    )

    vendas = resultado.scalars().all()

    resultado_final = []

    for venda in vendas:

        resultado_final.append(
            {
                "id": venda.id,

                "usuario_id": venda.usuario_id,

                "total": float(
                    venda.total or 0
                ),

                "data_venda": str(
                    venda.data_venda
                ),

                "tipo_data": str(
                    type(
                        venda.data_venda
                    )
                )
            }
        )

    return resultado_final


# ==========================================================
# LISTAR VENDAS
# ==========================================================

@router.get("/")
async def listar_vendas(

    db: AsyncSession = Depends(get_db)

):

    resultado = await db.execute(
        select(Venda)
        .options(
            selectinload(
                Venda.itens
            )
        )
        .order_by(
            Venda.id.desc()
        )
    )

    vendas = (
        resultado
        .scalars()
        .all()
    )

    return vendas


# ==========================================================
# DEBUG - LOTES UTILIZADOS NAS VENDAS
# ==========================================================

@router.get(
    "/dashboard/debug-lotes-vendas"
)
async def debug_lotes_vendas(

    db: AsyncSession = Depends(get_db)

):

    resultado = await db.execute(
        select(ItemVendaLote)
        .order_by(
            ItemVendaLote.id.desc()
        )
    )

    movimentos = (
        resultado
        .scalars()
        .all()
    )

    resultado_final = []

    for movimento in movimentos:

        resultado_final.append(
            {
                "id": movimento.id,

                "item_venda_id":
                    movimento.item_venda_id,

                "lote_id":
                    movimento.lote_id,

                "quantidade":
                    float(
                        movimento.quantidade or 0
                    ),

                "preco_compra":
                    float(
                        movimento.preco_compra or 0
                    ),

                "preco_venda":
                    float(
                        movimento.preco_venda or 0
                    )
            }
        )

    return resultado_final


# ==========================================================
# BUSCAR UMA VENDA
# ==========================================================

@router.get(
    "/{venda_id}"
)
async def buscar_venda(

    venda_id: int,

    db: AsyncSession = Depends(get_db)

):

    resultado = await db.execute(

        select(Venda)

        .options(

            selectinload(
                Venda.itens
            )
            .selectinload(
                ItemVenda.produto
            )

        )

        .where(
            Venda.id == venda_id
        )
    )

    venda = (
        resultado
        .scalar_one_or_none()
    )

    if venda is None:

        raise HTTPException(
            status_code=404,
            detail="Venda não encontrada"
        )

    return venda


# ==========================================================
# LEVANTAR LUCROS DE SAQUE DO ADMIN
# ==========================================================

@router.post(
    "/lucro-saque/levantar"
)
async def levantar_lucros_saque(

    usuario_id: int,

    valor: Decimal,

    db: AsyncSession = Depends(get_db)

):
    """
    O Admin pode levantar somente o valor
    disponível em LucroSaque.

    O levantamento é registrado na tabela
    Levantamento.

    NÃO cria movimento na Caixa.
    """

    # ======================================================
    # VALIDAR VALOR
    # ======================================================

    valor = Decimal(
        str(
            valor or 0
        )
    ).quantize(
        Decimal("0.01")
    )

    if valor <= Decimal("0.00"):

        raise HTTPException(
            status_code=400,
            detail=(
                "O valor do levantamento "
                "deve ser maior que zero."
            )
        )

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

    tipo_usuario = str(
        usuario.tipo or ""
    ).strip().lower()

    if tipo_usuario not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente o Admin pode "
                "realizar este levantamento."
            )
        )

    # ======================================================
    # BUSCAR LUCROS DE SAQUE
    # ======================================================

    resultado = await db.execute(

        select(LucroSaque)
        .order_by(
            LucroSaque.id.asc()
        )
        .with_for_update()

    )

    registros = (
        resultado
        .scalars()
        .all()
    )

    # ======================================================
    # CALCULAR TOTAL DISPONÍVEL
    # ======================================================

    total_disponivel = Decimal("0.00")

    for registro in registros:

        valor_enviado = Decimal(
            str(
                registro.valor_enviado or 0
            )
        )

        valor_sacado = Decimal(
            str(
                registro.valor_sacado or 0
            )
        )

        restante = (
            valor_enviado
            -
            valor_sacado
        )

        if restante > Decimal("0.00"):

            total_disponivel += restante

    total_disponivel = total_disponivel.quantize(
        Decimal("0.01")
    )

    # ======================================================
    # VALIDAR SALDO
    # ======================================================

    if valor > total_disponivel:

        raise HTTPException(
            status_code=400,
            detail=(
                "Valor superior ao lucro "
                "disponível para saque. "
                f"Disponível: "
                f"{total_disponivel:.2f} MT."
            )
        )

    # ======================================================
    # DISTRIBUIR O LEVANTAMENTO
    #
    # Consome primeiro os registros antigos.
    # ======================================================

    valor_restante_levantar = valor

    for registro in registros:

        if valor_restante_levantar <= Decimal("0.00"):
            break

        valor_enviado = Decimal(
            str(
                registro.valor_enviado or 0
            )
        )

        valor_sacado_atual = Decimal(
            str(
                registro.valor_sacado or 0
            )
        )

        disponivel_registro = (
            valor_enviado
            -
            valor_sacado_atual
        )

        if disponivel_registro <= Decimal("0.00"):
            continue

        valor_deste_registro = min(
            disponivel_registro,
            valor_restante_levantar
        )

        registro.valor_sacado = (
            valor_sacado_atual
            +
            valor_deste_registro
        ).quantize(
            Decimal("0.01")
        )

        valor_restante_levantar -= (
            valor_deste_registro
        )

    # ======================================================
    # SEGURANÇA
    # ======================================================

    if valor_restante_levantar > Decimal("0.00"):

        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "Não foi possível completar "
                "o levantamento."
            )
        )

    # ======================================================
    # REGISTRAR HISTÓRICO
    #
    # IMPORTANTE:
    # Este bloco fica DENTRO da função.
    # ======================================================

    levantamento = Levantamento(
        usuario_id=usuario_id,
        valor=valor
    )

    db.add(
        levantamento
    )

    # ======================================================
    # COMMIT
    # ======================================================

    await db.commit()

    # ======================================================
    # CALCULAR NOVO SALDO
    # ======================================================

    resultado = await db.execute(

        select(LucroSaque)

    )

    registros_atualizados = (
        resultado
        .scalars()
        .all()
    )

    novo_disponivel = Decimal("0.00")

    for registro in registros_atualizados:

        valor_enviado = Decimal(
            str(
                registro.valor_enviado or 0
            )
        )

        valor_sacado = Decimal(
            str(
                registro.valor_sacado or 0
            )
        )

        restante = (
            valor_enviado
            -
            valor_sacado
        )

        if restante > Decimal("0.00"):

            novo_disponivel += restante

    novo_disponivel = novo_disponivel.quantize(
        Decimal("0.01")
    )

    # ======================================================
    # RETORNO
    # ======================================================

    return {

        "mensagem":
            "Levantamento realizado com sucesso.",

        "valor_levantado":
            float(valor),

        "lucro_saque_anterior":
            float(total_disponivel),

        "lucro_saque_restante":
            float(novo_disponivel)

    }


# ==========================================================
# HISTÓRICO DE LEVANTAMENTOS
# ==========================================================

@router.get(
    "/lucro-saque/historico"
)
async def historico_levantamentos(

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
    # BUSCAR LEVANTAMENTOS
    # ======================================================

    resultado = await db.execute(

        select(Levantamento)

        .where(
            Levantamento.usuario_id == usuario_id
        )

        .order_by(
            Levantamento.id.desc()
        )

    )

    registros = (
        resultado
        .scalars()
        .all()
    )

    # ======================================================
    # RETORNO
    # ======================================================

    return [

        {
            "id":
                registro.id,

            "usuario_id":
                registro.usuario_id,

            "valor":
                float(
                    registro.valor or 0
                ),

            "data":
                registro.data.isoformat()
                if registro.data
                else None,

            "tipo":
                "levantamento"

        }

        for registro in registros

    ]


# ==========================================================
# CONSULTAR LUCRO DE SAQUE DISPONÍVEL
# ==========================================================

@router.get(
    "/lucro-saque/disponivel"
)
async def consultar_lucro_saque_disponivel(

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
    # VERIFICAR TIPO
    # ======================================================

    tipo_usuario = str(
        usuario.tipo or ""
    ).strip().lower()

    if tipo_usuario not in [
        "admin",
        "administrador"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Somente o Admin pode "
                "consultar o lucro de saque."
            )
        )

    # ======================================================
    # BUSCAR TODOS OS LUCROS
    # ======================================================

    resultado = await db.execute(
        select(LucroSaque)
    )

    registros = (
        resultado
        .scalars()
        .all()
    )

    # ======================================================
    # TOTAIS
    # ======================================================

    total_enviado = Decimal("0.00")

    total_sacado = Decimal("0.00")

    total_disponivel = Decimal("0.00")

    # ======================================================
    # SOMAR
    # ======================================================

    for registro in registros:

        valor_enviado = Decimal(
            str(
                registro.valor_enviado or 0
            )
        ).quantize(
            Decimal("0.01")
        )

        valor_sacado = Decimal(
            str(
                registro.valor_sacado or 0
            )
        ).quantize(
            Decimal("0.01")
        )

        restante = (
            valor_enviado
            -
            valor_sacado
        )

        total_enviado += (
            valor_enviado
        )

        total_sacado += (
            valor_sacado
        )

        if restante > Decimal("0.00"):

            total_disponivel += (
                restante
            )

    # ======================================================
    # GARANTIR 2 CASAS
    # ======================================================

    total_enviado = (
        total_enviado
        .quantize(
            Decimal("0.01")
        )
    )

    total_sacado = (
        total_sacado
        .quantize(
            Decimal("0.01")
        )
    )

    total_disponivel = (
        total_disponivel
        .quantize(
            Decimal("0.01")
        )
    )

    # ======================================================
    # SEGURANÇA
    # ======================================================

    if total_enviado < Decimal("0.00"):
        total_enviado = Decimal("0.00")

    if total_sacado < Decimal("0.00"):
        total_sacado = Decimal("0.00")

    if total_disponivel < Decimal("0.00"):
        total_disponivel = Decimal("0.00")

    # ======================================================
    # LOG
    # ======================================================

    print(
        "=========================================="
    )

    print(
        " LUCRO DE SAQUE - TOTAL GERAL"
    )

    print(
        "ADMIN CONSULTANDO:",
        usuario.id
    )

    print(
        "NOME ADMIN:",
        usuario.nome
    )

    print(
        "TIPO:",
        usuario.tipo
    )

    print(
        "REGISTROS:",
        len(registros)
    )

    print(
        "TOTAL ENVIADO:",
        total_enviado
    )

    print(
        "TOTAL SACADO:",
        total_sacado
    )

    print(
        "TOTAL DISPONÍVEL:",
        total_disponivel
    )

    print(
        "=========================================="
    )

    # ======================================================
    # RETORNO
    # ======================================================

    return {

        "usuario_id":
            usuario_id,

        "total_enviado":
            float(total_enviado),

        "total_sacado":
            float(total_sacado),

        "valor_disponivel":
            float(total_disponivel)

    }