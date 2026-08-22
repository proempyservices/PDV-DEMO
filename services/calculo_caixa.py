from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.usuario import Usuario
from models.venda import Venda
from models.despesa import Despesa
from models.caixa import Caixa, MovimentoCaixa
from models.lucro_saque import LucroSaque


async def calcular_saldo_caixa(
    db: AsyncSession,
    usuario_id: int
):

    # =====================================
    # BUSCAR USUARIO
    # =====================================

    resultado = await db.execute(
        select(Usuario)
        .where(
            Usuario.id == usuario_id
        )
    )

    usuario = resultado.scalar_one_or_none()

    if not usuario:

        return {
            "vendas": Decimal("0.00"),
            "despesas": Decimal("0.00"),
            "retirado": Decimal("0.00"),
            "saldo_recolhido": Decimal("0.00"),
            "saldo_caixa": Decimal("0.00"),
            "investimentos": Decimal("0.00"),
            "lucro_saque_disponivel": Decimal("0.00"),
            "disponivel_investimento": Decimal("0.00")
        }

    # =====================================
    # SOMAR VENDAS
    # =====================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    Venda.total
                ),
                0
            )
        )
        .where(
            Venda.usuario_id == usuario_id
        )

    )

    vendas = Decimal(
        str(
            resultado.scalar() or 0
        )
    )

    # =====================================
    # SOMAR DESPESAS NORMAIS
    # =====================================

    resultado = await db.execute(

        select(
            func.coalesce(
                func.sum(
                    Despesa.valor_aprovado
                ),
                0
            )
        )
        .where(
            Despesa.usuario_id == usuario_id,
            Despesa.estado == "aprovado",
            Despesa.valor_aprovado.is_not(None)
        )

    )

    despesas = Decimal(
        str(
            resultado.scalar() or 0
        )
    )

    # =====================================
    # VENDEDOR
    # =====================================

    if usuario.tipo == "vendedor":

        # =================================
        # RECOLHAS FEITAS PELO VENDEDOR
        # =================================

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
                Caixa
            )
            .where(
                Caixa.usuario_id == usuario_id,
                MovimentoCaixa.tipo == "RECOLHA"
            )

        )

        retirado = Decimal(
            str(
                resultado.scalar() or 0
            )
        )

        saldo_recolhido = Decimal("0.00")

        # =================================
        # SALDO DO VENDEDOR
        # =================================

        saldo_caixa = (
            vendas
            - despesas
            - retirado
        )

        if saldo_caixa < Decimal("0.00"):
            saldo_caixa = Decimal("0.00")

        return {

            "vendas": vendas,

            "despesas": despesas,

            "retirado": retirado,

            "saldo_recolhido":
                saldo_recolhido,

            "saldo_caixa":
                saldo_caixa,

            "investimentos":
                Decimal("0.00"),

            "lucro_saque_disponivel":
                Decimal("0.00"),

            "disponivel_investimento":
                Decimal("0.00")
        }

    # =====================================
    # ADMIN / GERENTE
    # =====================================

    # =====================================
    # RECOLHIMENTOS RECEBIDOS
    # =====================================

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
            Caixa
        )
        .where(
            Caixa.usuario_id == usuario_id,
            MovimentoCaixa.tipo == "RECOLHA_RECEBIDA"
        )

    )

    recolhido_recebido = Decimal(
        str(
            resultado.scalar() or 0
        )
    )

    # =====================================
    # DESPESAS PAGAS COM RECOLHIMENTO
    # =====================================

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
            Caixa
        )
        .where(
            Caixa.usuario_id == usuario_id,
            MovimentoCaixa.tipo == "DESPESA_RECOLHIDA"
        )

    )

    despesas_recolhidas = Decimal(
        str(
            resultado.scalar() or 0
        )
    )

    # =====================================
    # RETIRADAS DO ADMIN / GERENTE
    # =====================================

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
            Caixa
        )
        .where(
            Caixa.usuario_id == usuario_id,
            MovimentoCaixa.tipo == "RETIRADA"
        )

    )

    retirado = Decimal(
        str(
            resultado.scalar() or 0
        )
    )

    # =====================================
    # SALDO DO DINHEIRO RECOLHIDO
    # =====================================

    saldo_recolhido = (
        recolhido_recebido
        - despesas_recolhidas
        - retirado
    )

    if saldo_recolhido < Decimal("0.00"):

        saldo_recolhido = Decimal(
            "0.00"
        )

    # =====================================
    # INVESTIMENTOS JÁ REALIZADOS
    #
    # IMPORTANTE:
    #
    # O investimento é contabilizado
    # separadamente.
    #
    # ELE NÃO DEVE SER SUBTRAÍDO
    # DO SALDO DA CAIXA.
    # =====================================

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
            Caixa
        )
        .where(
            Caixa.usuario_id == usuario_id,
            MovimentoCaixa.tipo == "INVESTIMENTO"
        )

    )

    investimentos = Decimal(
        str(
            resultado.scalar() or 0
        )
    )

    # =====================================
    # SALDO DA CAIXA
    #
    # IMPORTANTE:
    #
    # INVESTIMENTO NÃO ENTRA AQUI.
    #
    # O investimento NÃO diminui
    # o saldo da caixa.
    # =====================================

    saldo_caixa = (
        vendas
        - despesas
        + recolhido_recebido
        - despesas_recolhidas
        - retirado
    )

    # =====================================
    # LUCRO DE SAQUE
    #
    # IMPORTANTE:
    #
    # valor_enviado = valor reservado
    # para o Admin levantar.
    #
    # valor_sacado = quanto já foi
    # levantado.
    # =====================================

    lucro_saque_disponivel = Decimal(
        "0.00"
    )

    if usuario.tipo == "admin":

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
            .where(
                LucroSaque.usuario_id == usuario_id
            )

        )

        lucro_saque_disponivel = Decimal(
            str(
                resultado.scalar() or 0
            )
        )

        if lucro_saque_disponivel < Decimal("0.00"):

            lucro_saque_disponivel = Decimal(
                "0.00"
            )

    # =====================================
    # DESCONTAR LUCROS JÁ SACADOS
    #
    # Isto continua sendo descontado
    # do saldo real da caixa.
    # =====================================

    if usuario.tipo == "admin":

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
                LucroSaque.usuario_id == usuario_id
            )

        )

        lucros_sacados = Decimal(
            str(
                resultado.scalar() or 0
            )
        )

        saldo_caixa = (
            saldo_caixa
            - lucros_sacados
        )

    # =====================================
    # PROTEÇÃO DO SALDO
    # =====================================

    if saldo_caixa < Decimal("0.00"):

        saldo_caixa = Decimal(
            "0.00"
        )

    # =====================================
    # DISPONÍVEL PARA INVESTIMENTO
    #
    # IMPORTANTE:
    #
    # Aqui NÃO podemos simplesmente usar:
    #
    # saldo_caixa - lucro_saque
    #
    # porque os investimentos anteriores
    # já foram realizados com dinheiro
    # que não deve voltar a ficar disponível.
    #
    # Portanto:
    #
    # saldo_caixa
    # - lucro reservado
    # - investimentos realizados
    # =====================================

    disponivel_investimento = (
        saldo_caixa
        - lucro_saque_disponivel
        - investimentos
    )

    if disponivel_investimento < Decimal("0.00"):

        disponivel_investimento = Decimal(
            "0.00"
        )

    # =====================================
    # RETORNO
    # =====================================

    return {

        "vendas":
            vendas,

        "despesas":
            despesas,

        "retirado":
            retirado,

        "saldo_recolhido":
            saldo_recolhido,

        "saldo_caixa":
            saldo_caixa,

        "investimentos":
            investimentos,

        "lucro_saque_disponivel":
            lucro_saque_disponivel,

        "disponivel_investimento":
            disponivel_investimento
    }