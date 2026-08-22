// =====================================================
// ÁREA DE DESPESAS
// =====================================================


// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================

let despesasAtuais = [];

let modoTabelaDespesas = false;


// =====================================================
// OBTER USUÁRIO LOGADO
// =====================================================

function obterUsuarioLogado(){

    try{

        const usuario =
            JSON.parse(
                localStorage.getItem("usuario")
            );

        return usuario || null;

    }
    catch(error){

        console.error(
            "Erro ao ler usuário:",
            error
        );

        return null;

    }

}


// =====================================================
// NORMALIZAR TIPO DO USUÁRIO
// =====================================================

function obterTipoUsuario(){

    const usuario =
        obterUsuarioLogado();


    if(!usuario){

        return "";

    }


    return String(
        usuario.tipo || ""
    )
    .trim()
    .toLowerCase();

}


// =====================================================
// VERIFICAR ADMIN
// =====================================================

function usuarioEhAdmin(){

    const tipo =
        obterTipoUsuario();


    return (
        tipo === "admin" ||
        tipo === "administrador"
    );

}


// =====================================================
// VERIFICAR GERENTE
// =====================================================

function usuarioEhGerente(){

    return (
        obterTipoUsuario() === "gerente"
    );

}


// =====================================================
// VERIFICAR VENDEDOR
// =====================================================

function usuarioEhVendedor(){

    return (
        obterTipoUsuario() === "vendedor"
    );

}


// =====================================================
// ABRIR DESPESAS
// =====================================================

window.abrirDespesas = function(){

    const modal =
        document.getElementById(
            "modal-despesas"
        );


    if(!modal){

        console.error(
            "Modal de despesas não encontrado."
        );

        return;

    }


    modal.style.display = "flex";


    configurarPermissaoDespesas();

};


// =====================================================
// FECHAR DESPESAS
// =====================================================

window.fecharDespesas = function(){

    const modal =
        document.getElementById(
            "modal-despesas"
        );


    if(modal){

        modal.style.display = "none";

    }

};


// =====================================================
// CONFIGURAR PERMISSÕES
// =====================================================

async function configurarPermissaoDespesas(){

    const usuario =
        obterUsuarioLogado();


    if(!usuario){

        console.error(
            "Usuário não encontrado."
        );

        mostrarErroLista(
            "Usuário não encontrado."
        );

        return;

    }


    const tipoUsuario =
        obterTipoUsuario();


    const formulario =
        document.getElementById(
            "formulario-despesa"
        );


    const botao =
        document.getElementById(
            "btn-nova-despesa"
        );


    // =================================================
    // ESCONDER FORMULÁRIO
    // =================================================

    if(formulario){

        formulario.style.display =
            "none";

    }


    // =================================================
    // ADMIN
    // =================================================

    if(
        tipoUsuario === "admin" ||
        tipoUsuario === "administrador"
    ){

        if(botao){

            botao.style.display =
                "inline-block";

            botao.disabled =
                false;

            botao.innerHTML = `
                <i class="bi bi-plus-circle"></i>
                Nova despesa
            `;

        }


        /*
         * ATENÇÃO:
         *
         * O backend NÃO possui:
         *
         * GET /despesas/
         *
         * nem:
         *
         * GET /despesas/admin
         *
         *
         * A única rota GET disponível
         * para consultar despesas sem
         * informar usuário é:
         *
         * GET /despesas/pendentes
         */

        await carregarDespesasPendentes();

        return;

    }


    // =================================================
    // GERENTE
    // =================================================

    if(
        tipoUsuario === "gerente"
    ){

        if(botao){

            botao.style.display =
                "none";

            botao.disabled =
                true;

        }


        await carregarDespesasPendentes();

        return;

    }


    // =================================================
    // VENDEDOR
    // =================================================

    if(
        tipoUsuario === "vendedor"
    ){

        if(botao){

            botao.style.display =
                "inline-block";

            botao.disabled =
                false;

            botao.innerHTML = `
                <i class="bi bi-send"></i>
                Solicitar despesa
            `;

        }


        await carregarMinhasDespesas();

        return;

    }


    // =================================================
    // TIPO DESCONHECIDO
    // =================================================

    if(botao){

        botao.style.display =
            "none";

    }


    mostrarErroLista(
        "Tipo de usuário sem permissão para despesas."
    );

}


// =====================================================
// ABRIR FORMULÁRIO
// =====================================================

window.abrirFormularioDespesa = function(){

    const usuario =
        obterUsuarioLogado();


    if(!usuario){

        alert(
            "Usuário não encontrado."
        );

        return;

    }


    const tipoUsuario =
        obterTipoUsuario();


    // =================================================
    // GERENTE
    // =================================================

    if(
        tipoUsuario === "gerente"
    ){

        alert(
            "O gerente não pode criar despesas."
        );

        return;

    }


    // =================================================
    // PERMISSÃO
    // =================================================

    if(
        tipoUsuario !== "admin" &&
        tipoUsuario !== "administrador" &&
        tipoUsuario !== "vendedor"
    ){

        alert(
            "Você não tem permissão para criar despesas."
        );

        return;

    }


    const formulario =
        document.getElementById(
            "formulario-despesa"
        );


    if(!formulario){

        console.error(
            "Formulário de despesa não encontrado."
        );

        return;

    }


    formulario.style.display =
        "block";


    formulario.scrollIntoView({

        behavior: "smooth",

        block: "nearest"

    });

};


// =====================================================
// LIMPAR FORMULÁRIO
// =====================================================

function limparFormularioDespesa(){

    const descricao =
        document.getElementById(
            "despesa-descricao"
        );


    const categoria =
        document.getElementById(
            "despesa-categoria"
        );


    const valor =
        document.getElementById(
            "despesa-valor"
        );


    const observacao =
        document.getElementById(
            "despesa-observacao"
        );


    if(descricao)
        descricao.value = "";


    if(categoria)
        categoria.value = "";


    if(valor)
        valor.value = "";


    if(observacao)
        observacao.value = "";

}

// =====================================================
// VERIFICAR SALDO DA CAIXA
// =====================================================

async function obterSaldoCaixa(usuarioId) {

    try {

        const resposta = await fetch(

            API +
            "/caixa/minha/" +
            encodeURIComponent(usuarioId),

            {
                method: "GET",

                headers: {
                    "Accept": "application/json"
                }
            }

        );


        const dados =
            await lerRespostaJson(
                resposta
            );


        if (!resposta.ok) {

            console.error(
                "Erro ao consultar saldo da caixa:",
                dados
            );

            throw new Error(
                obterMensagemErro(
                    dados,
                    "Não foi possível consultar o saldo da caixa."
                )
            );

        }


        /*
         * Resposta esperada do backend:
         *
         * {
         *     usuario_id: 4,
         *     nome: "...",
         *     tipo: "vendedor",
         *     vendas: 1500.00,
         *     despesas: 200.00,
         *     retirado: 100.00,
         *     saldo_atual: 1200.00,
         *     movimentos: []
         * }
         */


        const saldo =
            Number(
                dados.saldo_atual || 0
            );


        if (
            !Number.isFinite(saldo)
        ) {

            throw new Error(
                "Saldo da caixa inválido."
            );

        }


        return saldo;

    }
    catch(error) {

        console.error(
            "Erro ao obter saldo da caixa:",
            error
        );

        throw error;

    }

}
// =====================================================
// SALVAR DESPESA
// =====================================================

// =====================================================

window.salvarDespesa = async function(){

    const usuario =
        obterUsuarioLogado();


    // =================================================
    // USUÁRIO
    // =================================================

    if(!usuario){

        alert(
            "Usuário não encontrado."
        );

        return;

    }


    const tipoUsuario =
        obterTipoUsuario();


    // =================================================
    // PERMISSÃO
    // =================================================

    if(tipoUsuario === "gerente"){

        alert(
            "O gerente não pode criar despesas."
        );

        return;

    }


    if(
        tipoUsuario !== "admin" &&
        tipoUsuario !== "administrador" &&
        tipoUsuario !== "vendedor"
    ){

        alert(
            "Você não tem permissão para criar despesas."
        );

        return;

    }


    // =================================================
    // CAMPOS
    // =================================================

    const campoDescricao =
        document.getElementById(
            "despesa-descricao"
        );


    const campoCategoria =
        document.getElementById(
            "despesa-categoria"
        );


    const campoValor =
        document.getElementById(
            "despesa-valor"
        );


    const campoObservacao =
        document.getElementById(
            "despesa-observacao"
        );


    if(
        !campoDescricao ||
        !campoCategoria ||
        !campoValor ||
        !campoObservacao
    ){

        alert(
            "Formulário de despesa incompleto."
        );

        return;

    }


    // =================================================
    // VALORES
    // =================================================

    const descricao =
        campoDescricao.value.trim();


    const categoria =
        campoCategoria.value.trim();


    const valor =
        Number(
            campoValor.value
        );


    const observacao =
        campoObservacao.value.trim();


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if(!descricao){

        alert(
            "Informe a descrição da despesa."
        );

        campoDescricao.focus();

        return;

    }


    if(!categoria){

        alert(
            "Informe a categoria da despesa."
        );

        campoCategoria.focus();

        return;

    }


    if(
        !Number.isFinite(valor) ||
        valor <= 0
    ){

        alert(
            "Informe um valor válido."
        );

        campoValor.focus();

        return;

    }


    // =================================================
    // PROCESSAMENTO
    // =================================================

    try{

        // =================================================
        // 1. CONSULTAR A PRÓPRIA CAIXA
        //
        // Tanto ADMIN quanto VENDEDOR consultam
        // a caixa do próprio usuário.
        // =================================================

        const saldoCaixa =
            await obterSaldoCaixa(
                usuario.id
            );


        console.log(
            "================================="
        );

        console.log(
            "CRIANDO DESPESA"
        );

        console.log(
            "Usuário:",
            usuario.id
        );

        console.log(
            "Tipo:",
            tipoUsuario
        );

        console.log(
            "Saldo da própria caixa:",
            saldoCaixa
        );

        console.log(
            "Valor da despesa:",
            valor
        );

        console.log(
            "Saldo suficiente:",
            saldoCaixa >= valor
        );

        console.log(
            "================================="
        );


        // =================================================
        // 2. SALDO SUFICIENTE
        // =================================================

        if(saldoCaixa >= valor){

            console.log(
                "SALDO SUFICIENTE."
            );

            // =================================================
            // ADMIN
            // =================================================

            if(
                tipoUsuario === "admin" ||
                tipoUsuario === "administrador"
            ){

                console.log(
                    "Criando despesa normal do ADMIN."
                );


                const resposta =
                    await fetch(

                        API +
                        "/despesas/",

                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    usuario_id:
                                        usuario.id,

                                    descricao:
                                        descricao,

                                    categoria:
                                        categoria,

                                    valor_proposto:
                                        valor,

                                    observacao:
                                        observacao

                                })

                        }

                    );


                const resultado =
                    await lerRespostaJson(
                        resposta
                    );


                if(!resposta.ok){

                    console.error(
                        "Erro ao criar despesa normal:",
                        resultado
                    );


                    alert(
                        obterMensagemErro(
                            resultado,
                            "Erro ao criar despesa."
                        )
                    );

                    return;

                }


                limparFormularioDespesa();

                const formulario =
                    document.getElementById(
                        "formulario-despesa"
                    );

                if(formulario){

                    formulario.style.display =
                        "none";

                }

                await carregarDespesasPendentes();


                // =================================================
                // ATUALIZAR SALDO DA CAIXA
                // =================================================

                if(
                    typeof window.atualizarSaldoCaixaAgora ===
                    "function"
                ){

                    try{

                        await window.atualizarSaldoCaixaAgora();

                        console.log(
                            "✅ Saldo da caixa atualizado após criar despesa."
                        );

                    }
                    catch(error){

                        console.error(
                            "❌ Erro ao atualizar saldo da caixa:",
                            error
                        );

                    }

                }
                else{

                    console.warn(
                        "⚠️ atualizarSaldoCaixaAgora não está disponível."
                    );

                }


                alert(
                    "Despesa criada na caixa do administrador com sucesso."
                );

                return;


            }


            // =================================================
            // VENDEDOR
            // =================================================

            if(
                tipoUsuario === "vendedor"
            ){

                console.log(
                    "Criando solicitação normal do VENDEDOR."
                );


                const resposta =
                    await fetch(

                        API +
                        "/despesas/solicitar",

                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    usuario_id:
                                        usuario.id,

                                    descricao:
                                        descricao,

                                    categoria:
                                        categoria,

                                    valor_proposto:
                                        valor,

                                    observacao:
                                        observacao

                                })

                        }

                    );


                const resultado =
                    await lerRespostaJson(
                        resposta
                    );


                if(!resposta.ok){

                    console.error(
                        "Erro ao solicitar despesa:",
                        resultado
                    );


                    alert(
                        obterMensagemErro(
                            resultado,
                            "Erro ao solicitar despesa."
                        )
                    );

                    return;

                }


                limparFormularioDespesa();


                const formulario =
                    document.getElementById(
                        "formulario-despesa"
                    );


                if(formulario){

                    formulario.style.display =
                        "none";

                }


                await carregarMinhasDespesas();


                alert(
                    "Solicitação de despesa enviada com sucesso."
                );


                return;

            }

        }


        // =================================================
        // 3. SALDO INSUFICIENTE
        //
        // ADMIN E VENDEDOR:
        // cria fora da caixa
        // =================================================

        console.log(
            "SALDO INSUFICIENTE."
        );

        console.log(
            "Criando despesa FORA DA CAIXA."
        );


        const respostaForaCaixa =
            await fetch(

                API +
                "/despesas-fora-caixa/solicitar",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            usuario_id:
                                usuario.id,

                            descricao:
                                descricao,

                            categoria:
                                categoria,

                            valor_solicitado:
                                valor,

                            observacao:
                                observacao

                        })

                }

            );


        const resultadoForaCaixa =
            await lerRespostaJson(
                respostaForaCaixa
            );


        // =================================================
        // 4. ERRO FORA DA CAIXA
        // =================================================

        if(!respostaForaCaixa.ok){

            console.error(
                "Erro ao criar despesa fora da caixa:",
                {

                    status:
                        respostaForaCaixa.status,

                    statusText:
                        respostaForaCaixa.statusText,

                    dados:
                        resultadoForaCaixa

                }
            );


            alert(
                obterMensagemErro(
                    resultadoForaCaixa,
                    "Erro ao criar despesa fora da caixa."
                )
            );

            return;

        }


        // =================================================
        // 5. LIMPAR FORMULÁRIO
        // =================================================

        limparFormularioDespesa();


        const formulario =
            document.getElementById(
                "formulario-despesa"
            );


        if(formulario){

            formulario.style.display =
                "none";

        }


        // =================================================
        // 6. ATUALIZAR LISTA
        // =================================================

        if(
            tipoUsuario === "admin" ||
            tipoUsuario === "administrador"
        ){

            await carregarDespesasPendentes();

        }
        else{

            await carregarMinhasDespesas();

        }


        // =================================================
        // 7. MENSAGEM
        // =================================================

        alert(

            "O saldo da sua caixa é insuficiente para esta despesa.\n\n" +

            "A solicitação foi criada em " +

            "'Despesa Fora da Caixa' " +

            "e aguarda aprovação."

        );


    }
    catch(error){

        console.error(
            "Erro ao processar despesa:",
            error
        );


        alert(

            error.message ||

            "Erro de comunicação com o servidor."

        );

    }

};

// =====================================================
// LER JSON COM SEGURANÇA
// =====================================================

async function lerRespostaJson(resposta){

    try{

        return await resposta.json();

    }
    catch(error){

        return {};

    }

}


// =====================================================
// OBTER MENSAGEM DE ERRO
// =====================================================

function obterMensagemErro(
    dados,
    mensagemPadrao
){

    if(!dados){

        return mensagemPadrao;

    }


    if(
        typeof dados === "string"
    ){

        return dados;

    }


    if(
        dados.detail
    ){

        if(
            typeof dados.detail === "string"
        ){

            return dados.detail;

        }


        if(
            Array.isArray(
                dados.detail
            )
        ){

            return dados.detail
                .map(
                    erro =>
                        erro.msg ||
                        "Erro de validação."
                )
                .join("\n");

        }

    }


    return mensagemPadrao;

}


// =====================================================
// CARREGAR MINHAS DESPESAS
// VENDEDOR
// =====================================================

// =====================================================
// CARREGAR MINHAS DESPESAS
// VENDEDOR
//
// NORMAL + FORA DA CAIXA
// =====================================================

async function carregarMinhasDespesas(){

    const usuario =
        obterUsuarioLogado();

    if(!usuario){
        return;
    }

    try{

        // =================================================
        // 1. DESPESAS NORMAIS
        // =================================================

        const respostaNormais =
            await fetch(

                API +
                "/despesas/usuario/" +
                encodeURIComponent(
                    usuario.id
                ),

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        const dadosNormais =
            await lerRespostaJson(
                respostaNormais
            );


        if(!respostaNormais.ok){

            throw new Error(
                obterMensagemErro(
                    dadosNormais,
                    "Erro ao carregar despesas."
                )
            );

        }


        // =================================================
        // 2. DESPESAS FORA DA CAIXA
        // =================================================

        const respostaForaCaixa =
            await fetch(

                API +
                "/despesas-fora-caixa/usuario/" +
                encodeURIComponent(
                    usuario.id
                ),

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        const dadosForaCaixa =
            await lerRespostaJson(
                respostaForaCaixa
            );


        if(!respostaForaCaixa.ok){

            throw new Error(
                obterMensagemErro(
                    dadosForaCaixa,
                    "Erro ao carregar despesas fora da caixa."
                )
            );

        }


        // =================================================
        // 3. NORMALIZAR DESPESAS NORMAIS
        // =================================================

        const despesasNormais =
            Array.isArray(dadosNormais)
                ? dadosNormais.map(
                    function(d){

                        return {

                            ...d,

                            tipo_despesa:
                                "normal",

                            valor_proposto:
                                d.valor_proposto,

                            data_despesa:
                                d.data_despesa

                        };

                    }
                )
                : [];


        // =================================================
        // 4. NORMALIZAR FORA DA CAIXA
        // =================================================

        const despesasForaCaixa =
            Array.isArray(dadosForaCaixa)
                ? dadosForaCaixa.map(
                    function(d){

                        return {

                            ...d,

                            tipo_despesa:
                                "fora_caixa",

                            // IMPORTANTE:
                            // a rota usa valor_solicitado
                            valor_proposto:
                                d.valor_solicitado,

                            data_despesa:
                                d.data_solicitacao

                        };

                    }
                )
                : [];


        // =================================================
        // 5. JUNTAR AS DUAS
        // =================================================

        despesasAtuais = [

            ...despesasNormais,

            ...despesasForaCaixa

        ];


        // =================================================
        // 6. MODO VENDEDOR
        // =================================================

        modoTabelaDespesas =
            false;


        // =================================================
        // 7. MOSTRAR
        // =================================================

        mostrarTabelaDespesas(

            despesasAtuais,

            false

        );


        // =================================================
        // 8. FILTRO
        // =================================================

        configurarFiltroDespesas();


    }
    catch(error){

        console.error(
            "Erro ao carregar minhas despesas:",
            error
        );


        mostrarErroLista(

            error.message ||
            "Erro de comunicação com o servidor."

        );

    }

}
// =====================================================
// CARREGAR DESPESAS
// ADMIN / GERENTE
//
// CARREGA:
// 1. Normais pendentes
// 2. Normais rejeitadas
// 3. Fora da caixa pendentes
// =====================================================

async function carregarDespesasPendentes(){

    const usuario =
        obterUsuarioLogado();


    if(!usuario){

        mostrarErroLista(
            "Usuário não encontrado."
        );

        return;

    }


    if(!usuario.id){

        mostrarErroLista(
            "ID do usuário não encontrado."
        );

        return;

    }


    try{

        // =================================================
        // 1. DESPESAS NORMAIS PENDENTES
        // =================================================

        const respostaPendentes =
            await fetch(

                API +
                "/despesas/pendentes?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                ),

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        const dadosPendentes =
            await lerRespostaJson(
                respostaPendentes
            );


        if(!respostaPendentes.ok){

            throw new Error(
                obterMensagemErro(
                    dadosPendentes,
                    "Erro ao carregar despesas pendentes."
                )
            );

        }


        // =================================================
        // 2. DESPESAS NORMAIS REJEITADAS
        // =================================================

        const respostaRejeitadas =
            await fetch(

                API +
                "/despesas/rejeitadas?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                ),

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        const dadosRejeitadas =
            await lerRespostaJson(
                respostaRejeitadas
            );


        if(!respostaRejeitadas.ok){

            throw new Error(
                obterMensagemErro(
                    dadosRejeitadas,
                    "Erro ao carregar despesas rejeitadas."
                )
            );

        }


        // =================================================
        // 3. NORMALIZAR PENDENTES
        // =================================================

        const despesasPendentes =
            Array.isArray(
                dadosPendentes
            )

            ? dadosPendentes.map(
                function(d){

                    return {

                        ...d,

                        tipo_despesa:
                            "normal",

                        valor_proposto:
                            d.valor_proposto,

                        data_despesa:
                            d.data_despesa

                    };

                }
            )

            : [];


        // =================================================
        // 4. NORMALIZAR REJEITADAS
        // =================================================

        const despesasRejeitadas =
            Array.isArray(
                dadosRejeitadas
            )

            ? dadosRejeitadas.map(
                function(d){

                    return {

                        ...d,

                        tipo_despesa:
                            "normal",

                        valor_proposto:
                            d.valor_proposto,

                        data_despesa:
                            d.data_despesa,

                        estado:
                            "rejeitado"

                    };

                }
            )

            : [];


        // =================================================
        // 5. DESPESAS FORA DA CAIXA PENDENTES
        // =================================================

        const respostaForaCaixa =
            await fetch(

                API +
                "/despesas-fora-caixa/pendentes?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                ),

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        const dadosForaCaixa =
            await lerRespostaJson(
                respostaForaCaixa
            );


        if(!respostaForaCaixa.ok){

            throw new Error(
                obterMensagemErro(
                    dadosForaCaixa,
                    "Erro ao carregar despesas fora da caixa."
                )
            );

        }


        // =================================================
        // 6. NORMALIZAR FORA DA CAIXA
        // =================================================

        const despesasForaCaixa =
            Array.isArray(
                dadosForaCaixa
            )

            ? dadosForaCaixa.map(
                function(d){

                    return {

                        ...d,

                        tipo_despesa:
                            "fora_caixa",

                        valor_proposto:
                            d.valor_solicitado,

                        data_despesa:
                            d.data_solicitacao

                    };

                }
            )

            : [];


        // =================================================
        // 7. JUNTAR TODAS
        // =================================================

        despesasAtuais = [

            ...despesasPendentes,

            ...despesasRejeitadas,

            ...despesasForaCaixa

        ];


        // =================================================
        // 8. MODO ADMIN / GERENTE
        // =================================================

        modoTabelaDespesas =
            true;


        // =================================================
        // 9. MOSTRAR TABELA
        // =================================================

        mostrarTabelaDespesas(

            despesasAtuais,

            true

        );


        // =================================================
        // 10. CONFIGURAR FILTRO
        // =================================================

        configurarFiltroDespesas();


        console.log(
            "Despesas carregadas:",
            despesasAtuais
        );


    }
    catch(error){

        console.error(
            "Erro ao carregar despesas:",
            error
        );


        mostrarErroLista(

            error.message ||
            "Erro de comunicação com o servidor."

        );

    }

}
// =====================================================
// COMPATIBILIDADE GERENTE
// =====================================================

async function carregarSolicitacoesDespesas(){

    await carregarDespesasPendentes();

}


// =====================================================
// MOSTRAR ERRO
// =====================================================

function mostrarErroLista(mensagem){

    const lista =
        document.getElementById(
            "lista-despesas"
        );


    if(!lista)
        return;


    lista.innerHTML = `

        <div class="alert alert-danger">

            ${escaparHtml(
                mensagem
            )}

        </div>

    `;

}


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(valor){

    if(
        valor === null ||
        valor === undefined
    ){

        return "";

    }


    return String(valor)
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


// =====================================================
// NORMALIZAR VALOR
// =====================================================

function normalizarValor(valor){

    if(
        valor === null ||
        valor === undefined ||
        valor === ""
    ){

        return "";

    }


    const numero =
        Number(valor);


    if(
        Number.isNaN(numero)
    ){

        return normalizarTexto(
            valor
        );

    }


    return numero
        .toFixed(2)
        .replace(
            ".",
            ","
        );

}


// =====================================================
// FORMATAR VALOR
// =====================================================

function formatarValor(valor){

    const numero =
        Number(valor || 0);


    if(
        Number.isNaN(numero)
    ){

        return "0,00 MT";

    }


    return numero
        .toFixed(2)
        .replace(
            ".",
            ","
        ) +
        " MT";

}


// =====================================================
// FORMATAR DATA
// =====================================================

function formatarData(data){

    if(!data){

        return "-";

    }


    try{

        const objetoData =
            new Date(data);


        if(
            Number.isNaN(
                objetoData.getTime()
            )
        ){

            return "-";

        }


        return objetoData.toLocaleDateString(
            "pt-PT"
        );

    }
    catch(error){

        return "-";

    }

}


// =====================================================
// DATA PARA FILTRO
// =====================================================

function obterDataDespesa(d){

    if(
        !d ||
        !d.data_despesa
    ){

        return "";

    }


    const data =
        String(
            d.data_despesa
        );


    const dataISO =
        data.substring(
            0,
            10
        );


    return (
        dataISO +
        " " +
        formatarData(
            d.data_despesa
        )
    );

}


// =====================================================
// CONFIGURAR FILTRO
// =====================================================

function configurarFiltroDespesas(){

    const campoTexto =
        document.getElementById(
            "filtro-despesas"
        );


    if(!campoTexto)
        return;


    campoTexto.removeEventListener(
        "input",
        executarFiltroDespesas
    );


    campoTexto.addEventListener(
        "input",
        executarFiltroDespesas
    );


    const botaoLimpar =
        document.getElementById(
            "limpar-filtro-despesas"
        );


    if(botaoLimpar){

        botaoLimpar.onclick =
            limparFiltroDespesas;

    }

}


// =====================================================
// EXECUTAR FILTRO
// =====================================================

function executarFiltroDespesas(){

    const campoTexto =
        document.getElementById(
            "filtro-despesas"
        );


    const texto =
        campoTexto
            ? normalizarTexto(
                campoTexto.value
            )
            : "";


    if(!texto){

        mostrarTabelaDespesas(
            despesasAtuais,
            modoTabelaDespesas
        );

        return;

    }


    const dadosFiltrados =
        despesasAtuais.filter(
            function(d){

                const nome =
                    normalizarTexto(
                        d.solicitante_nome ||
                        d.usuario_nome ||
                        d.nome ||
                        ""
                    );


                const descricao =
                    normalizarTexto(
                        d.descricao
                    );


                const categoria =
                    normalizarTexto(
                        d.categoria
                    );


                const estado =
                    normalizarTexto(
                        d.estado
                    );


                const observacao =
                    normalizarTexto(
                        d.observacao
                    );


                const data =
                    normalizarTexto(
                        obterDataDespesa(d)
                    );


                const valorPropostoNumero =
                    Number(
                        d.valor_proposto || 0
                    );


                const valorAprovadoNumero =
                    d.valor_aprovado !== null &&
                    d.valor_aprovado !== undefined
                        ? Number(
                            d.valor_aprovado
                        )
                        : 0;


                const valorProposto =
                    normalizarValor(
                        d.valor_proposto
                    );


                const valorAprovado =
                    normalizarValor(
                        d.valor_aprovado
                    );


                const valorPropostoPonto =
                    String(
                        valorPropostoNumero
                    );


                const valorAprovadoPonto =
                    String(
                        valorAprovadoNumero
                    );


                return (

                    nome.includes(texto) ||

                    descricao.includes(texto) ||

                    categoria.includes(texto) ||

                    estado.includes(texto) ||

                    observacao.includes(texto) ||

                    data.includes(texto) ||

                    valorProposto.includes(texto) ||

                    valorAprovado.includes(texto) ||

                    valorPropostoPonto.includes(texto) ||

                    valorAprovadoPonto.includes(texto)

                );

            }
        );


    mostrarTabelaDespesas(
        dadosFiltrados,
        modoTabelaDespesas
    );

}


// =====================================================
// LIMPAR FILTRO
// =====================================================

window.limparFiltroDespesas = function(){

    const campoTexto =
        document.getElementById(
            "filtro-despesas"
        );


    if(campoTexto){

        campoTexto.value = "";

    }


    mostrarTabelaDespesas(
        despesasAtuais,
        modoTabelaDespesas
    );

};


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHtml(valor){

    if(
        valor === null ||
        valor === undefined
    ){

        return "-";

    }


    return String(valor)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// MOSTRAR TABELA
// =====================================================

// =====================================================
// MOSTRAR TABELA DE DESPESAS
//
// ADMIN / GERENTE:
//     Aprovar / Rejeitar
//
// VENDEDOR:
//     Editar / Apagar somente pendente
// =====================================================

function mostrarTabelaDespesas(
    dados,
    adminOuGerente
){

    const lista =
        document.getElementById(
            "lista-despesas"
        );


    if(!lista){

        console.error(
            "Elemento lista-despesas não encontrado."
        );

        return;

    }


    if(!Array.isArray(dados)){

        mostrarErroLista(
            "Dados de despesas inválidos."
        );

        return;

    }


    let html = `

        <div class="table-responsive">

            <table class="table table-bordered table-hover">

                <thead>

                    <tr>

                        <th>Nome</th>

                        <th>Descrição</th>

                        <th>Categoria</th>

                        <th>Tipo</th>

                        <th>Valor Proposto</th>

                        <th>Valor Aprovado</th>

                        <th>Estado</th>

                        <th>Data</th>

                        <th>Ação</th>

                    </tr>

                </thead>

                <tbody>

    `;


    if(dados.length === 0){

        html += `

            <tr>

                <td
                    colspan="9"
                    class="text-center text-muted"
                >

                    Nenhuma despesa encontrada.

                </td>

            </tr>

        `;

    }


    dados.forEach(function(d){

        const estado =
            normalizarTexto(
                d.estado
            );


        const tipoDespesa =
            normalizarTexto(
                d.tipo_despesa
            );


        const nomeSolicitante =
            d.solicitante_nome ||
            d.usuario_nome ||
            d.nome ||
            "Não informado";


        const descricao =
            d.descricao ||
            "";


        const categoria =
            d.categoria ||
            "";


        const valorProposto =
            d.valor_proposto;


        const valorAprovado =
            d.valor_aprovado;


        const ehForaCaixa =
            tipoDespesa === "fora_caixa";


        const textoTipo =
            ehForaCaixa
                ? "Fora da Caixa"
                : "Normal";


        html += `

            <tr
                data-id="${Number(d.id)}"
                data-tipo="${escaparHtml(tipoDespesa)}"
            >

                <td class="nome-solicitante">

                    ${escaparHtml(
                        nomeSolicitante
                    )}

                </td>


                <td class="descricao">

                    ${escaparHtml(
                        descricao
                    )}

                </td>


                <td class="categoria">

                    ${escaparHtml(
                        categoria
                    )}

                </td>


                <td>

                    ${
                        ehForaCaixa

                        ? `

                            <span class="badge bg-warning text-dark">

                                Fora da Caixa

                            </span>

                        `

                        :

                        `

                            <span class="badge bg-primary">

                                Normal

                            </span>

                        `
                    }

                </td>


                <td class="valor">

                    ${formatarValor(
                        valorProposto
                    )}

                </td>


                <td class="valor-aprovado">

                    ${
                        valorAprovado !== null &&
                        valorAprovado !== undefined

                        ?

                        formatarValor(
                            valorAprovado
                        )

                        :

                        "-"
                    }

                </td>


                <td class="estado">

                    ${escaparHtml(
                        d.estado || "-"
                    )}

                </td>


                <td>

                    ${formatarData(
                        d.data_despesa
                    )}

                </td>


                <td class="acao-despesa">

        `;


        // =================================================
        // ADMIN / GERENTE
        // =================================================

        if(adminOuGerente){

            if(estado === "pendente"){

                html += `

                    <button
                        type="button"
                        class="btn btn-success btn-sm me-1"
                        onclick="aprovarDespesa(
                            ${Number(d.id)},
                            '${tipoDespesa}'
                        )"
                    >

                        <i class="bi bi-check-circle"></i>

                        Aprovar

                    </button>


                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="rejeitarDespesa(
                            ${Number(d.id)},
                            '${tipoDespesa}'
                        )"
                    >

                        <i class="bi bi-x-circle"></i>

                        Rejeitar

                    </button>

                `;

            }
            else if(estado === "aprovado"){

                html += `

                    <span class="text-success">

                        <i class="bi bi-check-circle"></i>

                        Aprovada

                    </span>

                `;

            }
            else if(estado === "rejeitado"){

                html += `

                    <span class="text-danger">

                        <i class="bi bi-x-circle"></i>

                        Rejeitada

                    </span>

                `;

            }
            else{

                html += `

                    <span class="text-muted">

                        ${escaparHtml(
                            d.estado || "-"
                        )}

                    </span>

                `;

            }

        }


        // =================================================
        // VENDEDOR
        // =================================================

        else{

            if(estado === "pendente"){

                html += `

                    <button
                        type="button"
                        class="btn btn-warning btn-sm me-1"
                        onclick="editarDespesa(
                            ${Number(d.id)},
                            '${tipoDespesa}'
                        )"
                    >

                        <i class="bi bi-pencil"></i>

                        Editar

                    </button>


                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="apagarDespesa(
                            ${Number(d.id)},
                            '${tipoDespesa}'
                        )"
                    >

                        <i class="bi bi-trash"></i>

                        Apagar

                    </button>

                `;

            }
            else{

                html += `

                    <span class="text-muted">

                        Bloqueada

                    </span>

                `;

            }

        }


        html += `

                </td>

            </tr>

        `;

    });


    html += `

                </tbody>

            </table>

        </div>

    `;


    lista.innerHTML =
        html;

}
// =====================================================
// EDITAR DESPESA
// SOMENTE VENDEDOR
// =====================================================

// =====================================================
// EDITAR DESPESA
// SOMENTE VENDEDOR
// NORMAL OU FORA DA CAIXA
// =====================================================

window.editarDespesa = function(id){

    if(!usuarioEhVendedor()){

        alert(
            "Somente o vendedor pode editar a sua solicitação."
        );

        return;

    }


    // =================================================
    // PROCURAR NA LISTA ATUAL
    // =================================================

    const despesa =
        despesasAtuais.find(
            function(d){

                return Number(d.id) === Number(id);

            }
        );


    if(!despesa){

        alert(
            "Despesa não encontrada."
        );

        return;

    }


    // =================================================
    // VERIFICAR ESTADO
    // =================================================

    const estado =
        normalizarTexto(
            despesa.estado
        );


    if(estado !== "pendente"){

        alert(
            "Esta despesa já foi aprovada ou rejeitada e não pode ser alterada."
        );

        return;

    }


    // =================================================
    // IDENTIFICAR TIPO
    // =================================================

    const tipoDespesa =
        normalizarTexto(
            despesa.tipo_despesa
        );


    console.log(
        "Editando despesa:",
        {
            id: id,
            tipo: tipoDespesa,
            dados: despesa
        }
    );


    const nome =
        despesa.solicitante_nome ||
        despesa.usuario_nome ||
        despesa.nome ||
        "Não informado";


    const descricao =
        despesa.descricao ||
        "";


    const categoria =
        despesa.categoria ||
        "";


    // =================================================
    // VALOR
    // =================================================

    let valorOriginal;


    if(tipoDespesa === "fora_caixa"){

        valorOriginal =
            despesa.valor_solicitado;

    }
    else{

        valorOriginal =
            despesa.valor_proposto;

    }


    const valor =
        Number(
            valorOriginal || 0
        );


    // =================================================
    // ENCONTRAR LINHA
    // =================================================

    const linha =
        document.querySelector(
            `tr[data-id="${id}"]`
        );


    if(!linha){

        return;

    }


    // =================================================
    // MANTER TIPO NA LINHA
    // =================================================

    linha.dataset.tipoDespesa =
        tipoDespesa;


    // =================================================
    // MOSTRAR CAMPOS DE EDIÇÃO
    // =================================================

    linha.innerHTML = `

        <td class="nome-solicitante">

            ${escaparHtml(nome)}

        </td>


        <td>

            <input
                type="text"
                class="form-control"
                id="edit-desc-${id}"
                value="${escaparHtml(descricao)}"
            >

        </td>


        <td>

            <input
                type="text"
                class="form-control"
                id="edit-cat-${id}"
                value="${escaparHtml(categoria)}"
            >

        </td>


        <td>

            <input
                type="number"
                min="0.01"
                step="0.01"
                class="form-control"
                id="edit-val-${id}"
                value="${
                    Number.isFinite(valor)
                        ? valor
                        : ""
                }"
            >

        </td>


        <td>
            -
        </td>


        <td class="estado">

            pendente

        </td>


        <td>

            -

        </td>


        <td>

            <button
                type="button"
                class="btn btn-success btn-sm me-1"
                onclick="salvarEdicaoDespesa(${id})"
            >

                <i class="bi bi-check"></i>

                Guardar

            </button>


            <button
                type="button"
                class="btn btn-secondary btn-sm"
                onclick="carregarMinhasDespesas()"
            >

                <i class="bi bi-x-circle"></i>

                Cancelar

            </button>

        </td>

    `;

};

// =====================================================
// GUARDAR EDIÇÃO
// NORMAL OU FORA DA CAIXA
// =====================================================

// =====================================================
// GUARDAR EDIÇÃO DA DESPESA
//
// NORMAL:
// PUT /despesas/{id}?usuario_id=1
//
// FORA DA CAIXA:
// PUT /despesas-fora-caixa/{id}/editar?usuario_id=1
// =====================================================

window.salvarEdicaoDespesa = async function(id){

    const usuario =
        obterUsuarioLogado();


    if(!usuario){

        alert(
            "Usuário não encontrado."
        );

        return;

    }


    // =================================================
    // SOMENTE VENDEDOR
    // =================================================

    if(!usuarioEhVendedor()){

        alert(
            "Somente o vendedor pode editar despesas."
        );

        return;

    }


    // =================================================
    // PROCURAR DESPESA ORIGINAL
    // =================================================

    const despesa =
        despesasAtuais.find(
            function(d){

                return Number(d.id) === Number(id);

            }
        );


    if(!despesa){

        alert(
            "Despesa não encontrada."
        );

        return;

    }


    // =================================================
    // CAMPOS
    // =================================================

    const campoDescricao =
        document.getElementById(
            "edit-desc-" + id
        );


    const campoCategoria =
        document.getElementById(
            "edit-cat-" + id
        );


    const campoValor =
        document.getElementById(
            "edit-val-" + id
        );


    if(
        !campoDescricao ||
        !campoCategoria ||
        !campoValor
    ){

        alert(
            "Campos de edição não encontrados."
        );

        return;

    }


    // =================================================
    // VALORES
    // =================================================

    const descricao =
        campoDescricao.value.trim();


    const categoria =
        campoCategoria.value.trim();


    const valor =
        Number(
            campoValor.value
        );


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if(!descricao){

        alert(
            "Informe a descrição."
        );

        campoDescricao.focus();

        return;

    }


    if(!categoria){

        alert(
            "Informe a categoria."
        );

        campoCategoria.focus();

        return;

    }


    if(
        !Number.isFinite(valor) ||
        valor <= 0
    ){

        alert(
            "Informe um valor válido."
        );

        campoValor.focus();

        return;

    }


    // =================================================
    // IDENTIFICAR TIPO
    // =================================================

    const tipoDespesa =
        normalizarTexto(
            despesa.tipo_despesa
        );


    const ehForaCaixa =
        tipoDespesa === "fora_caixa";


    console.log(
        "Editando despesa:",
        {
            id: id,
            tipo: tipoDespesa,
            fora_caixa: ehForaCaixa
        }
    );


    try{

        let url;

        let dados;


        // =================================================
        // DESPESA FORA DA CAIXA
        // =================================================

        if(ehForaCaixa){

            url =
                API +
                "/despesas-fora-caixa/" +
                id +
                "/editar?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                );


            dados = {

                usuario_id:
                    usuario.id,

                descricao:
                    descricao,

                categoria:
                    categoria,

                valor_solicitado:
                    valor,

                observacao:
                    despesa.observacao || ""

            };

        }


        // =================================================
        // DESPESA NORMAL
        // =================================================

        else{

            url =
                API +
                "/despesas/" +
                id +
                "?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                );


            dados = {

                descricao:
                    descricao,

                categoria:
                    categoria,

                valor_proposto:
                    valor

            };

        }


        console.log(
            "URL da edição:",
            url
        );


        console.log(
            "Dados enviados:",
            dados
        );


        // =================================================
        // ENVIAR
        // =================================================

        const resposta =
            await fetch(

                url,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            dados
                        )

                }

            );


        const resultado =
            await lerRespostaJson(
                resposta
            );


        // =================================================
        // ERRO
        // =================================================

        if(!resposta.ok){

            console.error(
                "Erro ao editar despesa:",
                {
                    status:
                        resposta.status,

                    dados:
                        resultado
                }
            );


            alert(
                obterMensagemErro(
                    resultado,
                    "Erro ao editar despesa."
                )
            );

            return;

        }


        // =================================================
        // SUCESSO
        // =================================================

        alert(
            ehForaCaixa
                ? "Despesa fora da caixa atualizada com sucesso."
                : "Despesa atualizada com sucesso."
        );


        // =================================================
        // RECARREGAR
        // =================================================

        await carregarMinhasDespesas();


    }
    catch(error){

        console.error(
            "Erro ao editar despesa:",
            error
        );


        alert(
            error.message ||
            "Erro de comunicação com o servidor."
        );

    }

};

// =====================================================
// ABRIR APROVAÇÃO
// ADMIN / GERENTE
// =====================================================

window.aprovarDespesa = function(
    id,
    tipoDespesa
){

    if(
        !usuarioEhAdmin() &&
        !usuarioEhGerente()
    ){

        alert(
            "Você não tem permissão para aprovar despesas."
        );

        return;

    }


    const linha =
        document.querySelector(
            `tr[data-id="${id}"]`
        );


    if(!linha)
        return;


    const campoValor =
        linha.querySelector(
            ".valor"
        );


    const colunaValorAprovado =
        linha.querySelector(
            ".valor-aprovado"
        );


    const colunaAcao =
        linha.querySelector(
            ".acao-despesa"
        );


    if(
        !campoValor ||
        !colunaValorAprovado ||
        !colunaAcao
    ){

        console.error(
            "Elementos da aprovação não encontrados."
        );

        return;

    }


    const valorProposto =
        campoValor.innerText
            .replace(
                "MT",
                ""
            )
            .trim();


    const valorNumero =
        Number(
            valorProposto
                .replace(/\./g, "")
                .replace(",", ".")
        );


    colunaValorAprovado.dataset.original =
        colunaValorAprovado.innerHTML;


    colunaAcao.dataset.original =
        colunaAcao.innerHTML;


    colunaValorAprovado.innerHTML = `

        <input
            type="number"
            min="0.01"
            step="0.01"
            class="form-control"
            id="valor-aprovado-${id}"
            value="${
                Number.isFinite(valorNumero)
                    ? valorNumero
                    : ""
            }"
        >

    `;


    colunaAcao.innerHTML = `

        <button
            type="button"
            class="btn btn-success btn-sm me-1"
            onclick="guardarAprovacaoDespesa(
                ${id},
                '${tipoDespesa}'
            )"
        >

            <i class="bi bi-check"></i>

            Guardar

        </button>


        <button
            type="button"
            class="btn btn-secondary btn-sm"
            onclick="cancelarAprovacaoDespesa(${id})"
        >

            <i class="bi bi-x-circle"></i>

            Cancelar

        </button>

    `;


    const campo =
        document.getElementById(
            "valor-aprovado-" + id
        );


    if(campo){

        campo.focus();

        campo.select();

    }

};

// =====================================================
// CANCELAR APROVAÇÃO
// =====================================================

window.cancelarAprovacaoDespesa = function(id){

    const linha =
        document.querySelector(
            `tr[data-id="${id}"]`
        );


    if(!linha)
        return;


    const colunaValorAprovado =
        linha.querySelector(
            ".valor-aprovado"
        );


    const colunaAcao =
        linha.querySelector(
            "td:last-child"
        );


    if(
        !colunaValorAprovado ||
        !colunaAcao
    ){

        return;

    }


    if(
        colunaValorAprovado.dataset.original
        !== undefined
    ){

        colunaValorAprovado.innerHTML =
            colunaValorAprovado.dataset.original;

    }
    else{

        colunaValorAprovado.innerHTML =
            "-";

    }


    if(
        colunaAcao.dataset.original
        !== undefined
    ){

        colunaAcao.innerHTML =
            colunaAcao.dataset.original;

    }
    else{

        colunaAcao.innerHTML = `

            <button
                type="button"
                class="btn btn-success btn-sm"
                onclick="aprovarDespesa(${id})"
            >

                <i class="bi bi-check-circle"></i>

                Aprovar

            </button>

        `;

    }


    delete colunaValorAprovado.dataset.original;

    delete colunaAcao.dataset.original;

};


// =====================================================
// GUARDAR APROVAÇÃO
// PUT /despesas/{id}/aprovar
// =====================================================

// =====================================================
// GUARDAR APROVAÇÃO
//
// NORMAL:
// PUT /despesas/{id}/aprovar
//
// FORA DA CAIXA:
// PUT /despesas-fora-caixa/{id}/aprovar
// =====================================================

window.guardarAprovacaoDespesa = async function(
    id,
    tipoDespesa
){

    const usuario =
        obterUsuarioLogado();


    // =================================================
    // VERIFICAR USUÁRIO
    // =================================================

    if(!usuario){

        alert(
            "Usuário não encontrado."
        );

        return;

    }


    // =================================================
    // VERIFICAR PERMISSÃO
    // =================================================

    if(
        !usuarioEhAdmin() &&
        !usuarioEhGerente()
    ){

        alert(
            "Você não tem permissão para aprovar despesas."
        );

        return;

    }


    // =================================================
    // CAMPO DE VALOR APROVADO
    // =================================================

    const campo =
        document.getElementById(
            "valor-aprovado-" + id
        );


    if(!campo){

        alert(
            "Campo de valor aprovado não encontrado."
        );

        return;

    }


    // =================================================
    // VALOR
    // =================================================

    const valor =
        Number(
            campo.value
        );


    // =================================================
    // VALIDAR VALOR
    // =================================================

    if(
        !Number.isFinite(valor) ||
        valor <= 0
    ){

        alert(
            "Informe um valor aprovado válido."
        );

        campo.focus();

        return;

    }


    // =================================================
    // NORMALIZAR TIPO
    // =================================================

    const tipo =
        normalizarTexto(
            tipoDespesa
        );


    const ehForaCaixa =
        tipo === "fora_caixa";


    // =================================================
    // DEFINIR ROTA
    // =================================================

    let url;


    if(ehForaCaixa){

        url =
            API +
            "/despesas-fora-caixa/" +
            id +
            "/aprovar?usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }
    else{

        url =
            API +
            "/despesas/" +
            id +
            "/aprovar?usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }


    // =================================================
    // LOG
    // =================================================

    console.log(
        "================================="
    );

    console.log(
        "APROVANDO DESPESA"
    );

    console.log(
        "ID:",
        id
    );

    console.log(
        "Tipo:",
        tipo
    );

    console.log(
        "Fora da caixa:",
        ehForaCaixa
    );

    console.log(
        "Valor aprovado:",
        valor
    );

    console.log(
        "Usuário aprovador:",
        usuario.id
    );

    console.log(
        "URL:",
        url
    );

    console.log(
        "================================="
    );


    try{

        // =================================================
        // 1. ENVIAR APROVAÇÃO PARA O BACKEND
        // =================================================

        const resposta =
            await fetch(

                url,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            valor_aprovado:
                                valor

                        })

                }

            );


        // =================================================
        // 2. LER RESPOSTA
        // =================================================

        const dados =
            await lerRespostaJson(
                resposta
            );


        // =================================================
        // 3. VERIFICAR ERRO
        // =================================================

        if(!resposta.ok){

            console.error(
                "Erro ao aprovar despesa:",
                {

                    status:
                        resposta.status,

                    statusText:
                        resposta.statusText,

                    dados:
                        dados

                }
            );


            alert(
                obterMensagemErro(
                    dados,
                    "Erro ao aprovar despesa."
                )
            );

            return;

        }


        console.log(
            "✅ Despesa aprovada pelo backend."
        );


        // =================================================
        // 4. ATUALIZAR SALDO DA CAIXA
        //
        // IMPORTANTE:
        // Fazer depois que o backend confirmou
        // a aprovação.
        // =================================================

        if(
            typeof window.atualizarSaldoCaixaAgora ===
            "function"
        ){

            try{

                console.log(
                    "🔄 Atualizando saldo da caixa..."
                );


                await window.atualizarSaldoCaixaAgora();


                console.log(
                    "✅ Saldo da caixa atualizado após aprovação."
                );

            }
            catch(error){

                console.error(
                    "❌ Erro ao atualizar saldo da caixa:",
                    error
                );

            }

        }
        else{

            console.warn(
                "⚠️ atualizarSaldoCaixaAgora não está disponível."
            );

        }


        // =================================================
        // 5. ATUALIZAR DASHBOARD
        //
        // Para despesa normal.
        //
        // Despesa fora da caixa não altera a caixa
        // normal, portanto não precisa atualizar
        // indicadores relacionados à caixa.
        // =================================================

        if(!ehForaCaixa){

            if(
                typeof window.atualizarVendasDoDia ===
                "function"
            ){

                try{

                    console.log(
                        "🔄 Atualizando dashboard..."
                    );


                    await window.atualizarVendasDoDia();


                    console.log(
                        "✅ Dashboard atualizado após aprovação."
                    );

                }
                catch(error){

                    console.error(
                        "❌ Erro ao atualizar dashboard:",
                        error
                    );

                }

            }
            else{

                console.warn(
                    "⚠️ atualizarVendasDoDia não está disponível."
                );

            }

        }


        // =================================================
        // 6. RECARREGAR LISTA DE DESPESAS
        //
        // Fazemos isso depois da aprovação para que
        // a tabela mostre o estado atualizado.
        // =================================================

        try{

            console.log(
                "🔄 Recarregando lista de despesas..."
            );


            await carregarDespesasPendentes();


            console.log(
                "✅ Lista de despesas atualizada."
            );

        }
        catch(error){

            console.error(
                "❌ Erro ao recarregar lista de despesas:",
                error
            );

        }


        // =================================================
        // 7. MENSAGEM DE SUCESSO
        // =================================================

        alert(

            ehForaCaixa

                ? "Despesa fora da caixa aprovada com sucesso."

                : "Despesa aprovada com sucesso."

        );


        console.log(
            "================================="
        );

        console.log(
            "✅ PROCESSO DE APROVAÇÃO CONCLUÍDO"
        );

        console.log(
            "================================="
        );


    }
    catch(error){

        console.error(
            "Erro ao aprovar despesa:",
            error
        );


        alert(

            error.message ||

            "Erro de comunicação com o servidor."

        );

    }

};

// =====================================================
// REJEITAR DESPESA
// ADMIN / GERENTE
// =====================================================

// =====================================================
// REJEITAR DESPESA
// ADMIN / GERENTE
//
// IMPORTANTE:
// A despesa NÃO deve desaparecer da tabela.
// Depois de rejeitar, o estado passa para:
// "rejeitado"
// =====================================================

window.rejeitarDespesa = async function(
    id,
    tipoDespesa
){

    const usuario =
        obterUsuarioLogado();


    // =================================================
    // VERIFICAR USUÁRIO
    // =================================================

    if(!usuario){

        alert(
            "Usuário não encontrado."
        );

        return;

    }


    // =================================================
    // VERIFICAR PERMISSÃO
    // =================================================

    if(
        !usuarioEhAdmin() &&
        !usuarioEhGerente()
    ){

        alert(
            "Você não tem permissão para rejeitar despesas."
        );

        return;

    }


    // =================================================
    // CONFIRMAR REJEIÇÃO
    // =================================================

    const confirmar =
        confirm(
            "Deseja realmente rejeitar esta despesa?"
        );


    if(!confirmar){

        return;

    }


    // =================================================
    // NORMALIZAR TIPO
    // =================================================

    const tipo =
        normalizarTexto(
            tipoDespesa
        );


    // =================================================
    // DEFINIR ROTA
    // =================================================

    let url;


    if(
        tipo === "fora_caixa"
    ){

        url =
            API +
            "/despesas-fora-caixa/" +
            id +
            "/rejeitar?usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }
    else{

        url =
            API +
            "/despesas/" +
            id +
            "/rejeitar?usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }


    console.log(
        "================================="
    );

    console.log(
        "REJEITANDO DESPESA"
    );

    console.log(
        "ID:",
        id
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
        "USUÁRIO:",
        usuario.id
    );

    console.log(
        "================================="
    );


    try{

        // =================================================
        // ENVIAR REJEIÇÃO
        // =================================================

        const resposta =
            await fetch(

                url,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            observacao:
                                "Despesa rejeitada."

                        })

                }

            );


        // =================================================
        // LER RESPOSTA
        // =================================================

        const dados =
            await lerRespostaJson(
                resposta
            );


        // =================================================
        // VERIFICAR ERRO
        // =================================================

        if(!resposta.ok){

            console.error(
                "Erro ao rejeitar despesa:",
                {

                    status:
                        resposta.status,

                    statusText:
                        resposta.statusText,

                    dados:
                        dados

                }
            );


            alert(
                obterMensagemErro(
                    dados,
                    "Erro ao rejeitar despesa."
                )
            );


            return;

        }


        // =================================================
        // PROCURAR DESPESA NA LISTA ATUAL
        // =================================================

        const indice =
            despesasAtuais.findIndex(
                function(d){

                    return (

                        Number(d.id) ===
                            Number(id)

                        &&

                        normalizarTexto(
                            d.tipo_despesa
                        ) === tipo

                    );

                }
            );


        // =================================================
        // ATUALIZAR ESTADO LOCAL
        // =================================================

        if(indice !== -1){

            /*
             * Mantemos todos os dados que já estavam
             * na tabela e alteramos somente o estado.
             *
             * Isso impede que a linha desapareça.
             */

            despesasAtuais[indice] = {

                ...despesasAtuais[indice],

                /*
                 * Se o backend retornar dados atualizados,
                 * eles serão aproveitados.
                 */
                ...(

                    dados &&
                    typeof dados === "object" &&
                    !Array.isArray(dados)

                        ? dados

                        : {}

                ),

                /*
                 * Garantir o tipo original.
                 */
                tipo_despesa:
                    despesasAtuais[indice]
                        .tipo_despesa,

                /*
                 * ESTE É O PONTO PRINCIPAL.
                 */
                estado:
                    "rejeitado"

            };


            console.log(
                "Despesa atualizada localmente:",
                despesasAtuais[indice]
            );

        }
        else{

            console.warn(
                "Despesa rejeitada não encontrada em despesasAtuais.",
                {
                    id: id,
                    tipo: tipo
                }
            );

        }


        // =================================================
        // ATUALIZAR A TABELA
        // =================================================

        mostrarTabelaDespesas(

            despesasAtuais,

            true

        );


        // =================================================
        // RECONFIGURAR FILTRO
        // =================================================

        configurarFiltroDespesas();


        // =================================================
        // MENSAGEM
        // =================================================

        alert(

            tipo === "fora_caixa"

                ? "Despesa fora da caixa rejeitada."

                : "Despesa rejeitada."

        );


        /*
         * IMPORTANTE:
         *
         * NÃO fazer:
         *
         * await carregarDespesasPendentes();
         *
         * porque /pendentes normalmente retorna
         * somente despesas com estado "pendente".
         *
         * Se chamarmos essa função aqui,
         * a despesa rejeitada desaparece novamente.
         */


    }
    catch(error){

        console.error(
            "Erro ao rejeitar despesa:",
            error
        );


        alert(
            error.message ||
            "Erro de comunicação com o servidor."
        );

    }

};

window.apagarDespesa = async function(id){

    const usuario =
        obterUsuarioLogado();


    if(!usuario)
        return;


    if(!usuarioEhVendedor()){

        alert(
            "Somente o vendedor pode apagar a sua solicitação."
        );

        return;

    }


    const confirmar =
        confirm(
            "Deseja apagar esta solicitação de despesa?"
        );


    if(!confirmar)
        return;


    try{

        const resposta =
            await fetch(

                API +
                "/despesas/" +
                id +
                "?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                ),

                {

                    method: "DELETE"

                }

            );


        const dados =
            await lerRespostaJson(
                resposta
            );


        if(!resposta.ok){

            console.error(
                "Erro ao apagar:",
                dados
            );


            alert(
                obterMensagemErro(
                    dados,
                    "Não foi possível apagar a despesa."
                )
            );

            return;

        }


        alert(
            "Despesa removida com sucesso."
        );


        await carregarMinhasDespesas();

    }
    catch(error){

        console.error(
            "Erro ao apagar despesa:",
            error
        );


        alert(
            "Erro de comunicação com o servidor."
        );

    }

};


// =====================================================
// FECHAR MODAL CLICANDO FORA
// =====================================================

window.addEventListener(
    "click",
    function(event){

        const modal =
            document.getElementById(
                "modal-despesas"
            );


        if(
            modal &&
            event.target === modal
        ){

            fecharDespesas();

        }

    }
);
