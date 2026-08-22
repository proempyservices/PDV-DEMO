// =====================================================
// LUCROS E DESPESAS - DASHBOARD
// =====================================================


// =====================================================
// CONFIGURAÇÃO
// =====================================================

const API_LUCROS = "/lucros";


// =====================================================
// FORMATAR VALOR
// =====================================================

function formatarValorLucros(valor) {

    const numero = Number(valor || 0);

    return numero.toLocaleString(
        "pt-MZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " MT";

}


// =====================================================
// OBTER USUÁRIO
// =====================================================

function obterUsuarioLucros() {

    try {

        if (
            typeof obterUsuarioDashboard === "function"
        ) {

            const usuario =
                obterUsuarioDashboard();

            if (usuario) {
                return usuario;
            }

        }

    } catch (erro) {

        console.warn(
            "Não foi possível obter usuário pelo dashboard:",
            erro
        );

    }


    // -------------------------------------------------
    // TENTAR LOCALSTORAGE
    // -------------------------------------------------

    const chaves = [
        "usuario",
        "user",
        "usuario_logado",
        "usuarioLogado"
    ];


    for (
        const chave of chaves
    ) {

        try {

            const dados =
                localStorage.getItem(chave);

            if (!dados) {
                continue;
            }

            const usuario =
                JSON.parse(dados);

            if (usuario) {
                return usuario;
            }

        } catch (erro) {

            console.warn(
                "Erro ao ler usuário:",
                chave,
                erro
            );

        }

    }


    return null;

}


// =====================================================
// VERIFICAR SE É ADMIN OU GERENTE
// =====================================================

function usuarioPodeVerLucros() {

    const usuario =
        obterUsuarioLucros();


    if (!usuario) {

        console.warn(
            "Usuário não encontrado para verificar lucros."
        );

        return false;

    }


    const tipo =
        String(
            usuario.tipo ||
            usuario.role ||
            usuario.perfil ||
            ""
        ).toLowerCase();


    return (
        tipo === "admin" ||
        tipo === "gerente"
    );

}


// =====================================================
// OBTER ID DO USUÁRIO
// =====================================================

function obterUsuarioIdLucros() {

    const usuario =
        obterUsuarioLucros();


    if (!usuario) {
        return null;
    }


    return (
        usuario.id ||
        usuario.usuario_id ||
        null
    );

}


// =====================================================
// COLOCAR VALOR EM UM ELEMENTO
// =====================================================

function colocarValorLucros(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    // -------------------------------------------------
    // IMPORTANTE:
    // O elemento pode não existir para vendedores.
    // Nesse caso simplesmente ignoramos.
    // -------------------------------------------------

    if (!elemento) {

        return;

    }


    elemento.textContent =
        formatarValorLucros(valor);

}


// =====================================================
// MOSTRAR / ESCONDER CARD
// =====================================================

function mostrarCardLucros(
    id,
    mostrar
) {

    const card =
        document.getElementById(id);


    if (!card) {
        return;
    }


    card.style.display =
        mostrar
            ? ""
            : "none";

}


// =====================================================
// ATUALIZAR DESPESAS
// =====================================================

function atualizarDespesasDashboard(
    dados
) {

    if (!dados) {
        return;
    }


    colocarValorLucros(
        "despesas-dia",
        dados.dia?.despesas
    );


    colocarValorLucros(
        "despesas-semana",
        dados.semana?.despesas
    );


    colocarValorLucros(
        "despesas-mes",
        dados.mes?.despesas
    );


    colocarValorLucros(
        "despesas-ano",
        dados.ano?.despesas
    );

}
// =====================================================
// ATUALIZAR FATURAMENTO
// =====================================================

function atualizarFaturamentoDashboard(
    dados
) {

    if (!dados) {
        return;
    }


    // =================================================
    // DIA
    // =================================================

    colocarValorLucros(
        "faturamento-dia",
        dados.dia?.receita
    );


    // =================================================
    // SEMANA
    // =================================================

    colocarValorLucros(
        "faturamento-semana",
        dados.semana?.receita
    );


    // =================================================
    // MÊS
    // =================================================

    colocarValorLucros(
        "faturamento-mes",
        dados.mes?.receita
    );


    // =================================================
    // ANO
    // =================================================

    colocarValorLucros(
        "faturamento-ano",
        dados.ano?.receita
    );

}

// =====================================================
// ATUALIZAR LUCROS
// =====================================================

function atualizarLucrosDashboard(
    dados
) {

    if (!dados) {
        return;
    }


    // =================================================
    // DIA
    // =================================================

    colocarValorLucros(
        "lucro-bruto-dia",
        dados.dia?.lucro_bruto
    );


    colocarValorLucros(
        "lucro-liquido-dia",
        dados.dia?.lucro_liquido
    );


    // =================================================
    // SEMANA
    // =================================================

    colocarValorLucros(
        "lucro-bruto-semana",
        dados.semana?.lucro_bruto
    );


    colocarValorLucros(
        "lucro-liquido-semana",
        dados.semana?.lucro_liquido
    );


    // =================================================
    // MÊS
    // =================================================

    colocarValorLucros(
        "lucro-bruto-mes",
        dados.mes?.lucro_bruto
    );


    colocarValorLucros(
        "lucro-liquido-mes",
        dados.mes?.lucro_liquido
    );


    // =================================================
    // ANO
    // =================================================

    colocarValorLucros(
        "lucro-bruto-ano",
        dados.ano?.lucro_bruto
    );


    colocarValorLucros(
        "lucro-liquido-ano",
        dados.ano?.lucro_liquido
    );

}


// =====================================================
// ESCONDER TODOS OS CARDS DE LUCRO
// =====================================================

function esconderCardsLucro() {

    mostrarCardLucros(
        "card-lucro-dia",
        false
    );


    mostrarCardLucros(
        "card-lucro-semana",
        false
    );


    mostrarCardLucros(
        "card-lucro-mes",
        false
    );


    mostrarCardLucros(
        "card-lucro-ano",
        false
    );


    // Caso tenha usado IDs separados

    mostrarCardLucros(
        "card-lucro-bruto-dia",
        false
    );

    mostrarCardLucros(
        "card-lucro-bruto-semana",
        false
    );

    mostrarCardLucros(
        "card-lucro-bruto-mes",
        false
    );

    mostrarCardLucros(
        "card-lucro-bruto-ano",
        false
    );

}
// =====================================================
// ATUALIZAR DESEMPENHO DA LOJA
// BASEADO NO FATURAMENTO
// =====================================================

function atualizarDesempenhoDashboard(dados) {

    if (!dados) {
        return;
    }


    // =================================================
    // FATURAMENTO DO MÊS ATUAL
    // =================================================

    const faturamentoAtual =
        Number(
            dados.mes?.receita || 0
        );


    // =================================================
    // FATURAMENTO DO MÊS PASSADO
    // =================================================

    const faturamentoAnterior =
        Number(
            dados.mes_passado?.receita || 0
        );


    const elementoDesempenho =
        document.getElementById(
            "desempenho-loja"
        );

    const elementoPercentual =
        document.getElementById(
            "desempenho-percentual"
        );

    const elementoComparacao =
        document.getElementById(
            "desempenho-comparacao"
        );

    const elementoIcone =
        document.getElementById(
            "desempenho-icone"
        );

    const elementoSeta =
        document.getElementById(
            "desempenho-seta"
        );


    if (
        !elementoDesempenho ||
        !elementoPercentual
    ) {
        return;
    }


    // =================================================
    // PRIMEIRO MÊS / SEM DADOS ANTERIORES
    // =================================================

    if (faturamentoAnterior <= 0) {

        elementoDesempenho.textContent =
            faturamentoAtual > 0
                ? "Novo crescimento"
                : "Sem dados";

        elementoPercentual.textContent =
            "0%";


        if (elementoComparacao) {

            elementoComparacao.className =
                "text-muted";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-dash";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-dash";

        }

        return;
    }


    // =================================================
    // CALCULAR VARIAÇÃO
    // =================================================

    const variacao =
        (
            (
                faturamentoAtual -
                faturamentoAnterior
            )
            /
            faturamentoAnterior
        ) * 100;


    const percentual =
        Math.round(variacao);


    // =================================================
    // MOSTRAR PERCENTUAL
    // =================================================

    elementoPercentual.textContent =
        (
            percentual > 0
                ? "+"
                : ""
        ) +
        percentual +
        "%";


    // =================================================
    // CLASSIFICAÇÃO DO DESEMPENHO
    // =================================================

    let desempenho;


    if (percentual >= 20) {

        desempenho = "Ótimo";

    }
    else if (percentual >= 10) {

        desempenho = "Bom";

    }
    else if (percentual >= 0) {

        desempenho = "Estável";

    }
    else if (percentual >= -10) {

        desempenho = "Atenção";

    }
    else {

        desempenho = "Fraco";

    }


    elementoDesempenho.textContent =
        desempenho;


    // =================================================
    // FATURAMENTO SUBIU
    // =================================================

    if (percentual > 0) {

        if (elementoComparacao) {

            elementoComparacao.className =
                "text-success";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-graph-up-arrow";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-arrow-up-right";

        }

    }


    // =================================================
    // FATURAMENTO CAIU
    // =================================================

    else if (percentual < 0) {

        if (elementoComparacao) {

            elementoComparacao.className =
                "text-danger";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-graph-down-arrow";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-arrow-down-right";

        }

    }


    // =================================================
    // FATURAMENTO IGUAL
    // =================================================

    else {

        if (elementoComparacao) {

            elementoComparacao.className =
                "text-muted";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-dash";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-dash";

        }

    }

}
// =====================================================
// ATUALIZAR DESEMPENHO DA LOJA
// BASEADO NO FATURAMENTO
// =====================================================

function atualizarDesempenhoDashboard(dados) {

    if (!dados) {
        return;
    }


    // =================================================
    // FATURAMENTO DO MÊS ATUAL
    // =================================================

    const faturamentoAtual =
        Number(
            dados.mes?.receita || 0
        );


    // =================================================
    // FATURAMENTO DO MÊS PASSADO
    // =================================================

    const faturamentoAnterior =
        Number(
            dados.mes_passado?.receita || 0
        );


    const elementoDesempenho =
        document.getElementById(
            "desempenho-loja"
        );

    const elementoPercentual =
        document.getElementById(
            "desempenho-percentual"
        );

    const elementoComparacao =
        document.getElementById(
            "desempenho-comparacao"
        );

    const elementoIcone =
        document.getElementById(
            "desempenho-icone"
        );

    const elementoSeta =
        document.getElementById(
            "desempenho-seta"
        );


    if (
        !elementoDesempenho ||
        !elementoPercentual
    ) {
        return;
    }


    // =================================================
    // PRIMEIRO MÊS / SEM DADOS ANTERIORES
    // =================================================

    if (faturamentoAnterior <= 0) {

        elementoDesempenho.textContent =
            faturamentoAtual > 0
                ? "Novo crescimento"
                : "Sem dados";

        elementoPercentual.textContent =
            "0%";


        if (elementoComparacao) {

            elementoComparacao.className =
                "text-muted";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-dash";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-dash";

        }

        return;
    }


    // =================================================
    // CALCULAR VARIAÇÃO
    // =================================================

    const variacao =
        (
            (
                faturamentoAtual -
                faturamentoAnterior
            )
            /
            faturamentoAnterior
        ) * 100;


    const percentual =
        Math.round(variacao);


    // =================================================
    // MOSTRAR PERCENTUAL
    // =================================================

    elementoPercentual.textContent =
        (
            percentual > 0
                ? "+"
                : ""
        ) +
        percentual +
        "%";


    // =================================================
    // CLASSIFICAÇÃO DO DESEMPENHO
    // =================================================

    let desempenho;


    if (percentual >= 20) {

        desempenho = "Ótimo";

    }
    else if (percentual >= 10) {

        desempenho = "Bom";

    }
    else if (percentual >= 0) {

        desempenho = "Estável";

    }
    else if (percentual >= -10) {

        desempenho = "Atenção";

    }
    else {

        desempenho = "Fraco";

    }


    elementoDesempenho.textContent =
        desempenho;


    // =================================================
    // FATURAMENTO SUBIU
    // =================================================

    if (percentual > 0) {

        if (elementoComparacao) {

            elementoComparacao.className =
                "text-success";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-graph-up-arrow";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-arrow-up-right";

        }

    }


    // =================================================
    // FATURAMENTO CAIU
    // =================================================

    else if (percentual < 0) {

        if (elementoComparacao) {

            elementoComparacao.className =
                "text-danger";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-graph-down-arrow";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-arrow-down-right";

        }

    }


    // =================================================
    // FATURAMENTO IGUAL
    // =================================================

    else {

        if (elementoComparacao) {

            elementoComparacao.className =
                "text-muted";

        }


        if (elementoIcone) {

            elementoIcone.className =
                "bi bi-dash";

        }


        if (elementoSeta) {

            elementoSeta.className =
                "bi bi-dash";

        }

    }

}

// =====================================================
// MOSTRAR CARDS DE LUCRO
// =====================================================

function mostrarCardsLucro() {

    mostrarCardLucros(
        "card-lucro-dia",
        true
    );


    mostrarCardLucros(
        "card-lucro-semana",
        true
    );


    mostrarCardLucros(
        "card-lucro-mes",
        true
    );


    mostrarCardLucros(
        "card-lucro-ano",
        true
    );

}


// =====================================================
// CARREGAR DADOS DO BACKEND
// =====================================================

async function carregarDadosLucros() {

    try {

        const usuario =
            obterUsuarioLucros();


        if (!usuario) {

            console.warn(
                "Usuário não encontrado."
            );

            return;

        }


        const tipo =
            String(
                usuario.tipo ||
                usuario.role ||
                usuario.perfil ||
                ""
            ).toLowerCase();


        const adminGerente =
            (
                tipo === "admin" ||
                tipo === "gerente"
            );


        // =================================================
        // URL
        // =================================================

        let url =
            `${API_LUCROS}/dashboard`;


        // =================================================
        // ADMIN / GERENTE
        //
        // Não envia usuario_id.
        //
        // O backend deverá somar tudo.
        // =================================================

        if (!adminGerente) {

            // -------------------------------------------------
            // VENDEDOR
            //
            // Envia o ID dele.
            // O backend deve retornar somente
            // as despesas criadas por ele.
            // -------------------------------------------------

            const usuarioId =
                obterUsuarioIdLucros();


            if (usuarioId) {

                url +=
                    `?usuario_id=${encodeURIComponent(usuarioId)}`;

            }

        }


        console.log(
            "====================================="
        );

        console.log(
            "CARREGANDO DADOS FINANCEIROS"
        );

        console.log(
            "TIPO:",
            tipo
        );

        console.log(
            "URL:",
            url
        );

        console.log(
            "====================================="
        );


        // =================================================
        // REQUISIÇÃO
        // =================================================

        const resposta =
            await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "DADOS FINANCEIROS:",
            dados
        );


        // =================================================
        // DESPESAS
        // =================================================

        atualizarDespesasDashboard(
            dados
        );
        // =================================================
        // FATURAMENTO
        // =================================================

        atualizarFaturamentoDashboard(
            dados
        );
        // =================================================
        // DESEMPENHO DA LOJA
        // =================================================

        atualizarDesempenhoDashboard(
            dados
        );
        // =================================================
        // LUCROS
        // =================================================

        if (adminGerente) {

            // Admin e gerente podem ver lucros

            atualizarLucrosDashboard(
                dados
            );

            mostrarCardsLucro();

        } else {

            // Vendedor NÃO pode ver lucro

            esconderCardsLucro();

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar lucros/despesas:",
            erro
        );

    }

}
// =====================================================
// CONTROLE DOS CARDS DE DESPESAS E LUCROS
// =====================================================


// =====================================================
// DESPESAS
// =====================================================

function alternarCardsDespesas() {

    const cards =
        document.querySelectorAll(
            ".card-despesa-periodo"
        );

    if (!cards.length) {
        return;
    }

    const primeiro =
        cards[0];

    const visivel =
        primeiro.style.display !== "none";

    cards.forEach(
        function(card) {

            card.style.display =
                visivel
                    ? "none"
                    : "flex";

        }
    );

}


// =====================================================
// LUCROS
// =====================================================

function alternarCardsLucros() {

    const cards =
        document.querySelectorAll(
            ".card-lucro-periodo"
        );

    if (!cards.length) {
        return;
    }

    const primeiro =
        cards[0];

    const visivel =
        primeiro.style.display !== "none";

    cards.forEach(
        function(card) {

            card.style.display =
                visivel
                    ? "none"
                    : "flex";

        }
    );

}


// =====================================================
// CONTROLE DE PERMISSÃO DOS LUCROS
// =====================================================

function atualizarVisibilidadeLucros() {

    const cardVerLucros =
        document.getElementById(
            "card-ver-lucros"
        );

    if (!cardVerLucros) {
        return;
    }


    let usuario = null;


    try {

        if (
            typeof obterUsuarioDashboard ===
            "function"
        ) {

            usuario =
                obterUsuarioDashboard();

        }

    }
    catch(error) {

        console.error(
            "Erro ao obter usuário:",
            error
        );

    }


    if (!usuario) {

        cardVerLucros.style.display =
            "none";

        return;

    }


    const tipo =
        String(
            usuario.tipo || ""
        ).toLowerCase();


    // =============================================
    // ADMIN / GERENTE
    // =============================================

    if (
        tipo === "admin" ||
        tipo === "gerente"
    ) {

        cardVerLucros.style.display =
            "flex";

    }

    // =============================================
    // VENDEDOR
    // =============================================

    else {

        cardVerLucros.style.display =
            "none";

    }

}


// =====================================================
// EXPOR FUNÇÕES
// =====================================================

window.alternarCardsDespesas =
    alternarCardsDespesas;

window.alternarCardsLucros =
    alternarCardsLucros;

window.atualizarVisibilidadeLucros =
    atualizarVisibilidadeLucros;

// =====================================================
// FUNÇÃO PÚBLICA
// =====================================================

window.carregarLucrosDashboard =
    carregarDadosLucros;