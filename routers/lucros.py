from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy import (
    select
)

from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from datetime import (
    datetime,
    date,
    timedelta
)

from decimal import Decimal

from zoneinfo import ZoneInfo

from database import get_db

from models.venda import (
    Venda,
    ItemVenda
)

from models.item_venda_lote import (
    ItemVendaLote
)

from models.despesa import (
    Despesa
)

from models.usuario import (
    Usuario
)


router = APIRouter(
    prefix="/lucros",
    tags=["Lucros"]
)


# =====================================================
# TIMEZONE
# =====================================================

MAPUTO = ZoneInfo(
    "Africa/Maputo"
)


# =====================================================
# AUXILIAR
# CONVERTER DATA PARA MAPUTO
# =====================================================

def converter_data_maputo(data):

    if data is None:
        return None

    if data.tzinfo is None:

        return data.replace(
            tzinfo=MAPUTO
        )

    return data.astimezone(
        MAPUTO
    )


# =====================================================
# AUXILIAR
# CALCULAR PERÍODO
# =====================================================

def calcular_periodo(
    periodo: str
):

    agora = datetime.now(
        MAPUTO
    )

    hoje = agora.date()

    # =================================================
    # DIA
    # =================================================

    if periodo == "dia":

        inicio = hoje
        fim = hoje

    # =================================================
    # SEMANA
    # =================================================

    elif periodo == "semana":

        inicio = (
            hoje -
            timedelta(
                days=hoje.weekday()
            )
        )

        fim = hoje

    # =================================================
    # MÊS
    # =================================================

    elif periodo == "mes":

        inicio = date(
            hoje.year,
            hoje.month,
            1
        )

        fim = hoje

    # =================================================
    # ANO
    # =================================================

    elif periodo == "ano":

        inicio = date(
            hoje.year,
            1,
            1
        )

        fim = hoje

    # =================================================
    # PERÍODO INVÁLIDO
    # =================================================

    else:

        raise HTTPException(

            status_code=400,

            detail=(
                "Período inválido. "
                "Use: dia, semana, mes ou ano."
            )

        )

    return (
        inicio,
        fim
    )


# =====================================================
# OBTER USUÁRIO
# =====================================================

async def obter_usuario(
    db: AsyncSession,
    usuario_id: int | None
):

    if usuario_id is None:
        return None

    resultado = await db.execute(

        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )

    )

    usuario = (
        resultado
        .scalars()
        .first()
    )

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="Usuário não encontrado."

        )

    return usuario


# =====================================================
# CALCULAR CUSTO DOS LOTES DE UMA VENDA
# =====================================================

async def calcular_custo_item_venda(
    db: AsyncSession,
    item_venda_id: int
):

    resultado_lotes = await db.execute(

        select(ItemVendaLote)
        .where(

            ItemVendaLote.item_venda_id ==
            item_venda_id

        )

    )

    movimentos = (
        resultado_lotes
        .scalars()
        .all()
    )

    custo_total = Decimal(
        "0.00"
    )

    for movimento in movimentos:

        # =============================================
        # PREÇO DE COMPRA DO LOTE
        # =============================================

        if movimento.preco_compra is None:

            continue

        preco_compra = Decimal(
            str(
                movimento.preco_compra
            )
        )

        # =============================================
        # QUANTIDADE DO LOTE
        # =============================================

        if movimento.quantidade is None:

            continue

        quantidade = Decimal(
            str(
                movimento.quantidade
            )
        )

        # =============================================
        # CUSTO
        # =============================================

        custo = (
            preco_compra *
            quantidade
        )

        custo_total += custo

    return custo_total


# =====================================================
# CALCULAR LUCRO DE UM PERÍODO
# =====================================================

async def calcular_lucro_periodo(

    db: AsyncSession,

    inicio: date,

    fim: date,

    usuario_id: int | None = None,

    tipo_usuario: str | None = None

):

    # =================================================
    # VARIÁVEIS
    # =================================================

    receita = Decimal(
        "0.00"
    )

    custo_produtos = Decimal(
        "0.00"
    )

    quantidade_vendas = 0

    # =================================================
    # BUSCAR VENDAS
    # =================================================

    query_vendas = (

        select(Venda)

        .where(
            Venda.data_venda.is_not(None)
        )

        .order_by(
            Venda.data_venda.asc()
        )

    )

    # =================================================
    # VENDEDOR
    # =================================================

    if tipo_usuario == "vendedor":

        query_vendas = query_vendas.where(

            Venda.usuario_id == usuario_id

        )

    resultado = await db.execute(
        query_vendas
    )

    vendas = (
        resultado
        .scalars()
        .all()
    )

    # =================================================
    # PROCESSAR VENDAS
    # =================================================

    for venda in vendas:

        # =============================================
        # DATA DA VENDA
        # =============================================

        data_venda = converter_data_maputo(
            venda.data_venda
        )

        if data_venda is None:
            continue

        data_venda = data_venda.date()

        # =============================================
        # FILTRAR DATA
        # =============================================

        if data_venda < inicio:
            continue

        if data_venda > fim:
            continue

        # =============================================
        # RECEITA
        # =============================================

        receita += Decimal(
            str(
                venda.total or 0
            )
        )

        quantidade_vendas += 1

        # =============================================
        # BUSCAR ITENS DA VENDA
        # =============================================

        resultado_itens = await db.execute(

            select(ItemVenda)
            .where(

                ItemVenda.venda_id ==
                venda.id

            )

        )

        itens_venda = (
            resultado_itens
            .scalars()
            .all()
        )

        # =============================================
        # PROCESSAR ITENS
        # =============================================

        for item_venda in itens_venda:

            custo_item = (
                await calcular_custo_item_venda(
                    db=db,
                    item_venda_id=item_venda.id
                )
            )

            custo_produtos += custo_item

    # =================================================
    # LUCRO BRUTO
    # =================================================

    lucro_bruto = (
        receita -
        custo_produtos
    )

    # =================================================
    # BUSCAR DESPESAS
    # =================================================

    query_despesas = (

        select(Despesa)

        .where(
            Despesa.estado == "aprovado"
        )

    )

    # =================================================
    # VENDEDOR
    # =================================================

    if tipo_usuario == "vendedor":

        query_despesas = query_despesas.where(

            Despesa.usuario_id == usuario_id

        )

    resultado_despesas = await db.execute(
        query_despesas
    )

    despesas = (
        resultado_despesas
        .scalars()
        .all()
    )

    total_despesas = Decimal(
        "0.00"
    )

    # =================================================
    # PROCESSAR DESPESAS
    # =================================================

    for despesa in despesas:

        if despesa.data_despesa is None:
            continue

        data_despesa = converter_data_maputo(
            despesa.data_despesa
        )

        if data_despesa is None:
            continue

        data_despesa = data_despesa.date()

        # =============================================
        # FILTRAR DATA
        # =============================================

        if data_despesa < inicio:
            continue

        if data_despesa > fim:
            continue

        # =============================================
        # VALOR DA DESPESA
        # =============================================

        valor = (

            despesa.valor_aprovado

            or

            despesa.valor_proposto

            or

            0

        )

        total_despesas += Decimal(
            str(valor)
        )

    # =================================================
    # LUCRO LÍQUIDO
    # =================================================

    lucro_liquido = (
        lucro_bruto -
        total_despesas
    )

    # =================================================
    # RESULTADO
    # =================================================

    return {

        "receita":
            float(
                receita
            ),

        "custo_produtos":
            float(
                custo_produtos
            ),

        "lucro_bruto":
            float(
                lucro_bruto
            ),

        "despesas":
            float(
                total_despesas
            ),

        "lucro_liquido":
            float(
                lucro_liquido
            ),

        "quantidade_vendas":
            quantidade_vendas,

        "data_inicio":
            inicio.strftime(
                "%Y-%m-%d"
            ),

        "data_fim":
            fim.strftime(
                "%Y-%m-%d"
            )

    }


# =====================================================
# LUCRO DIÁRIO
# =====================================================

@router.get(
    "/dia"
)
async def lucro_dia(

    usuario_id: int | None = None,

    db: AsyncSession = Depends(
        get_db
    )

):

    usuario = await obter_usuario(
        db,
        usuario_id
    )

    tipo_usuario = (

        usuario.tipo
        if usuario
        else None

    )

    inicio, fim = calcular_periodo(
        "dia"
    )

    return await calcular_lucro_periodo(

        db=db,

        inicio=inicio,

        fim=fim,

        usuario_id=usuario_id,

        tipo_usuario=tipo_usuario

    )


# =====================================================
# LUCRO SEMANAL
# =====================================================

@router.get(
    "/semana"
)
async def lucro_semana(

    usuario_id: int | None = None,

    db: AsyncSession = Depends(
        get_db
    )

):

    usuario = await obter_usuario(
        db,
        usuario_id
    )

    tipo_usuario = (

        usuario.tipo
        if usuario
        else None

    )

    inicio, fim = calcular_periodo(
        "semana"
    )

    return await calcular_lucro_periodo(

        db=db,

        inicio=inicio,

        fim=fim,

        usuario_id=usuario_id,

        tipo_usuario=tipo_usuario

    )


# =====================================================
# LUCRO MENSAL
# =====================================================

@router.get(
    "/mes"
)
async def lucro_mes(

    usuario_id: int | None = None,

    db: AsyncSession = Depends(
        get_db
    )

):

    usuario = await obter_usuario(
        db,
        usuario_id
    )

    tipo_usuario = (

        usuario.tipo
        if usuario
        else None

    )

    inicio, fim = calcular_periodo(
        "mes"
    )

    return await calcular_lucro_periodo(

        db=db,

        inicio=inicio,

        fim=fim,

        usuario_id=usuario_id,

        tipo_usuario=tipo_usuario

    )


# =====================================================
# LUCRO ANUAL
# =====================================================

@router.get(
    "/ano"
)
async def lucro_ano(

    usuario_id: int | None = None,

    db: AsyncSession = Depends(
        get_db
    )

):

    usuario = await obter_usuario(
        db,
        usuario_id
    )

    tipo_usuario = (

        usuario.tipo
        if usuario
        else None

    )

    inicio, fim = calcular_periodo(
        "ano"
    )

    return await calcular_lucro_periodo(

        db=db,

        inicio=inicio,

        fim=fim,

        usuario_id=usuario_id,

        tipo_usuario=tipo_usuario

    )


# =====================================================
# DASHBOARD COMPLETO
# =====================================================

@router.get(
    "/dashboard"
)
async def dashboard_lucros(

    usuario_id: int | None = None,

    db: AsyncSession = Depends(
        get_db
    )

):

    # =================================================
    # OBTER USUÁRIO
    # =================================================

    usuario = await obter_usuario(
        db,
        usuario_id
    )

    tipo_usuario = (

        usuario.tipo
        if usuario
        else None

    )

    # =================================================
    # PERÍODOS
    # =================================================

    dia_inicio, dia_fim = calcular_periodo(
        "dia"
    )

    semana_inicio, semana_fim = calcular_periodo(
        "semana"
    )

    mes_inicio, mes_fim = calcular_periodo(
        "mes"
    )

    ano_inicio, ano_fim = calcular_periodo(
        "ano"
    )

    # =================================================
    # DIA
    # =================================================

    dia = await calcular_lucro_periodo(

        db,

        dia_inicio,

        dia_fim,

        usuario_id,

        tipo_usuario

    )

    # =================================================
    # SEMANA
    # =================================================

    semana = await calcular_lucro_periodo(

        db,

        semana_inicio,

        semana_fim,

        usuario_id,

        tipo_usuario

    )

    # =================================================
    # MÊS
    # =================================================

    mes = await calcular_lucro_periodo(

        db,

        mes_inicio,

        mes_fim,

        usuario_id,

        tipo_usuario

    )

    # =================================================
    # ANO
    # =================================================

    ano = await calcular_lucro_periodo(

        db,

        ano_inicio,

        ano_fim,

        usuario_id,

        tipo_usuario

    )

    # =================================================
    # VENDEDOR
    # NÃO RECEBE INFORMAÇÕES DE LUCRO
    # =================================================

    if tipo_usuario == "vendedor":

        for periodo in (
            dia,
            semana,
            mes,
            ano
        ):

            periodo["receita"] = 0.0

            periodo["custo_produtos"] = 0.0

            periodo["lucro_bruto"] = 0.0

            periodo["lucro_liquido"] = 0.0

            periodo["quantidade_vendas"] = 0

    # =================================================
    # RETORNO
    # =================================================

    return {

        "usuario_tipo":
            tipo_usuario,

        "dia":
            dia,

        "semana":
            semana,

        "mes":
            mes,

        "ano":
            ano

    }


# =====================================================
# GRÁFICO DE FATURAMENTO
# DIA / SEMANA / MÊS / ANO
# =====================================================

@router.get(
    "/grafico"
)
async def grafico_faturamento(

    periodo: str = "mes",

    usuario_id: int | None = None,

    db: AsyncSession = Depends(
        get_db
    )

):

    # =================================================
    # OBTER USUÁRIO
    # =================================================

    usuario = await obter_usuario(
        db,
        usuario_id
    )

    tipo_usuario = (

        usuario.tipo
        if usuario
        else None

    )

    # =================================================
    # DATA/HORA ATUAL
    # =================================================

    agora = datetime.now(
        MAPUTO
    )

    hoje = agora.date()

    # =================================================
    # VALIDAR PERÍODO
    # =================================================

    periodos_validos = [

        "dia",
        "semana",
        "mes",
        "ano"

    ]

    if periodo not in periodos_validos:

        raise HTTPException(

            status_code=400,

            detail=(
                "Período inválido. "
                "Use: dia, semana, mes ou ano."
            )

        )

    # =================================================
    # VARIÁVEIS
    # =================================================

    total_vendas = Decimal(
        "0.00"
    )

    quantidade_vendas = 0

    # =================================================
    # BUSCAR VENDAS
    # =================================================

    async def buscar_vendas():

        query = (

            select(Venda)

            .where(
                Venda.data_venda.is_not(None)
            )

        )

        if tipo_usuario == "vendedor":

            query = query.where(

                Venda.usuario_id ==
                usuario_id

            )

        resultado = await db.execute(
            query
        )

        return (
            resultado
            .scalars()
            .all()
        )

    # =================================================
    # DIA
    # =================================================

    if periodo == "dia":

        valores = {}

        for hora in range(24):

            valores[hora] = Decimal(
                "0.00"
            )

        vendas = await buscar_vendas()

        for venda in vendas:

            data_venda = converter_data_maputo(
                venda.data_venda
            )

            if not data_venda:
                continue

            if data_venda.date() != hoje:
                continue

            valor_venda = Decimal(
                str(
                    venda.total or 0
                )
            )

            total_vendas += valor_venda

            quantidade_vendas += 1

            hora = data_venda.hour

            valores[hora] += valor_venda

        if quantidade_vendas > 0:

            ticket_medio = (

                total_vendas /
                Decimal(
                    quantidade_vendas
                )

            )

        else:

            ticket_medio = Decimal(
                "0.00"
            )

        dados = []

        for hora in range(24):

            dados.append({

                "label":
                    f"{hora:02d}h",

                "data":
                    f"{hoje.strftime('%Y-%m-%d')} "
                    f"{hora:02d}:00",

                "valor":
                    float(
                        valores[hora]
                    )

            })

        return {

            "periodo":
                "dia",

            "data_inicio":
                hoje.strftime(
                    "%Y-%m-%d"
                ),

            "data_fim":
                hoje.strftime(
                    "%Y-%m-%d"
                ),

            "total_vendas":
                float(
                    total_vendas
                ),

            "ticket_medio":
                float(
                    ticket_medio
                ),

            "quantidade_vendas":
                quantidade_vendas,

            "dados":
                dados

        }

    # =================================================
    # SEMANA
    # =================================================

    elif periodo == "semana":

        inicio = (
            hoje -
            timedelta(
                days=hoje.weekday()
            )
        )

        fim = (
            inicio +
            timedelta(
                days=6
            )
        )

        valores = {}

        for numero in range(7):

            data = (
                inicio +
                timedelta(
                    days=numero
                )
            )

            valores[data] = Decimal(
                "0.00"
            )

        vendas = await buscar_vendas()

        for venda in vendas:

            data_venda = converter_data_maputo(
                venda.data_venda
            )

            if not data_venda:
                continue

            data_venda = data_venda.date()

            if data_venda < inicio:
                continue

            if data_venda > fim:
                continue

            valor_venda = Decimal(
                str(
                    venda.total or 0
                )
            )

            total_vendas += valor_venda

            quantidade_vendas += 1

            valores[data_venda] += valor_venda

        if quantidade_vendas > 0:

            ticket_medio = (

                total_vendas /
                Decimal(
                    quantidade_vendas
                )

            )

        else:

            ticket_medio = Decimal(
                "0.00"
            )

        nomes_dias = [

            "Seg",
            "Ter",
            "Qua",
            "Qui",
            "Sex",
            "Sáb",
            "Dom"

        ]

        dados = []

        for numero in range(7):

            data = (
                inicio +
                timedelta(
                    days=numero
                )
            )

            dados.append({

                "label":
                    nomes_dias[numero],

                "data":
                    data.strftime(
                        "%Y-%m-%d"
                    ),

                "valor":
                    float(
                        valores[data]
                    )

            })

        return {

            "periodo":
                "semana",

            "data_inicio":
                inicio.strftime(
                    "%Y-%m-%d"
                ),

            "data_fim":
                fim.strftime(
                    "%Y-%m-%d"
                ),

            "total_vendas":
                float(
                    total_vendas
                ),

            "ticket_medio":
                float(
                    ticket_medio
                ),

            "quantidade_vendas":
                quantidade_vendas,

            "dados":
                dados

        }

    # =================================================
    # MÊS
    # =================================================

    elif periodo == "mes":

        inicio = date(

            hoje.year,
            hoje.month,
            1

        )

        if hoje.month == 12:

            proximo_mes = date(

                hoje.year + 1,
                1,
                1

            )

        else:

            proximo_mes = date(

                hoje.year,
                hoje.month + 1,
                1

            )

        fim = (

            proximo_mes -
            timedelta(
                days=1
            )

        )

        valores = {}

        data_atual = inicio

        while data_atual <= fim:

            valores[data_atual] = Decimal(
                "0.00"
            )

            data_atual += timedelta(
                days=1
            )

        vendas = await buscar_vendas()

        for venda in vendas:

            data_venda = converter_data_maputo(
                venda.data_venda
            )

            if not data_venda:
                continue

            data_venda = data_venda.date()

            if data_venda < inicio:
                continue

            if data_venda > fim:
                continue

            valor_venda = Decimal(
                str(
                    venda.total or 0
                )
            )

            total_vendas += valor_venda

            quantidade_vendas += 1

            valores[data_venda] += valor_venda

        if quantidade_vendas > 0:

            ticket_medio = (

                total_vendas /
                Decimal(
                    quantidade_vendas
                )

            )

        else:

            ticket_medio = Decimal(
                "0.00"
            )

        dados = []

        data_atual = inicio

        while data_atual <= fim:

            dados.append({

                "label":
                    data_atual.strftime(
                        "%d"
                    ),

                "data":
                    data_atual.strftime(
                        "%Y-%m-%d"
                    ),

                "valor":
                    float(
                        valores[data_atual]
                    )

            })

            data_atual += timedelta(
                days=1
            )

        return {

            "periodo":
                "mes",

            "data_inicio":
                inicio.strftime(
                    "%Y-%m-%d"
                ),

            "data_fim":
                fim.strftime(
                    "%Y-%m-%d"
                ),

            "dias_no_mes":
                len(dados),

            "total_vendas":
                float(
                    total_vendas
                ),

            "ticket_medio":
                float(
                    ticket_medio
                ),

            "quantidade_vendas":
                quantidade_vendas,

            "dados":
                dados

        }

    # =================================================
    # ANO
    # =================================================

    elif periodo == "ano":

        inicio = date(

            hoje.year,
            1,
            1

        )

        fim = date(

            hoje.year,
            12,
            31

        )

        valores = {}

        for mes in range(1, 13):

            valores[mes] = Decimal(
                "0.00"
            )

        vendas = await buscar_vendas()

        for venda in vendas:

            data_venda = converter_data_maputo(
                venda.data_venda
            )

            if not data_venda:
                continue

            data_venda = data_venda.date()

            if data_venda.year != hoje.year:
                continue

            valor_venda = Decimal(
                str(
                    venda.total or 0
                )
            )

            total_vendas += valor_venda

            quantidade_vendas += 1

            mes = data_venda.month

            valores[mes] += valor_venda

        if quantidade_vendas > 0:

            ticket_medio = (

                total_vendas /
                Decimal(
                    quantidade_vendas
                )

            )

        else:

            ticket_medio = Decimal(
                "0.00"
            )

        nomes_meses = [

            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez"

        ]

        dados = []

        for mes in range(1, 13):

            dados.append({

                "label":
                    nomes_meses[mes - 1],

                "mes":
                    mes,

                "valor":
                    float(
                        valores[mes]
                    )

            })

        return {

            "periodo":
                "ano",

            "data_inicio":
                inicio.strftime(
                    "%Y-%m-%d"
                ),

            "data_fim":
                fim.strftime(
                    "%Y-%m-%d"
                ),

            "total_vendas":
                float(
                    total_vendas
                ),

            "ticket_medio":
                float(
                    ticket_medio
                ),

            "quantidade_vendas":
                quantidade_vendas,

            "dados":
                dados

        }