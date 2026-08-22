// ============================================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================================


// ============================================================
// OBTER USUÁRIO LOGADO
// ============================================================

function obterUsuarioConfiguracoes(){

    try{

        const storage =
            localStorage.getItem("usuario");

        if(!storage){
            return null;
        }

        return JSON.parse(storage);

    }
    catch(erro){

        console.error(
            "Erro ao ler usuário:",
            erro
        );

        return null;

    }

}


// ============================================================
// VERIFICAR ADMIN
// ============================================================

function usuarioEhAdmin(){

    const usuario =
        obterUsuarioConfiguracoes();

    if(!usuario){
        return false;
    }

    const tipo =
        String(usuario.tipo || "")
        .trim()
        .toLowerCase();

    return (
        tipo === "admin" ||
        tipo === "administrador"
    );

}


// ============================================================
// ABRIR MODAL PRINCIPAL
// ============================================================

async function abrirModalConfiguracoes(){

    const modal =
        document.getElementById(
            "modal-configuracoes"
        );

    if(!modal){

        console.error(
            "Modal #modal-configuracoes não encontrado."
        );

        return;

    }


    // Abrir modal

    modal.style.display = "flex";


    // Criar/verificar botão

    criarBotaoPercentagemLucros();


    // Carregar configuração

    await carregarConfiguracao();

}


// ============================================================
// FECHAR MODAL PRINCIPAL
// ============================================================

function fecharModalConfiguracoes(){

    const modal =
        document.getElementById(
            "modal-configuracoes"
        );

    if(modal){

        modal.style.display =
            "none";

    }

}


// ============================================================
// CRIAR BOTÃO DE PERCENTAGEM
// ============================================================

function criarBotaoPercentagemLucros(){

    const modal =
        document.getElementById(
            "modal-configuracoes"
        );

    if(!modal){
        return;
    }


    // ========================================================
    // SOMENTE ADMIN
    // ========================================================

    if(!usuarioEhAdmin()){

        return;

    }


    // ========================================================
    // SE JÁ EXISTE, NÃO CRIAR NOVAMENTE
    // ========================================================

    if(
        document.getElementById(
            "btn-abrir-percentagem-lucros"
        )
    ){

        return;

    }


    // ========================================================
    // PROCURAR ÁREA DO MODAL
    // ========================================================

    const corpo =
        modal.querySelector(
            ".modal-body"
        );


    if(!corpo){

        console.error(
            "Não encontrei .modal-body no modal de configurações."
        );

        return;

    }


    // ========================================================
    // CRIAR BOTÃO
    // ========================================================

    const botao =
        document.createElement(
            "button"
        );


    botao.type =
        "button";


    botao.id =
        "btn-abrir-percentagem-lucros";


    botao.className =
        "btn btn-primary w-100 mt-3";


    botao.innerHTML = `

        <i class="bi bi-percent"></i>

        Alterar Percentagem dos Lucros

    `;


    botao.onclick =
        abrirModalPercentagemLucros;


    // ========================================================
    // ADICIONAR AO MODAL
    // ========================================================

    corpo.appendChild(
        botao
    );

}


// ============================================================
// CARREGAR CONFIGURAÇÃO
// ============================================================

async function carregarConfiguracao(){

    const elemento =
        document.getElementById(
            "percentual-configuracao-atual"
        );


    if(elemento){

        elemento.innerText =
            "Carregando...";

    }


    try{

        const resposta =
            await fetch(
                "/configuracoes/",
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        if(!resposta.ok){

            console.error(
                "Erro HTTP:",
                resposta.status
            );

            if(elemento){
                elemento.innerText =
                    "Erro";
            }

            return;

        }


        const dados =
            await resposta.json();


        console.log(
            "CONFIGURAÇÃO:",
            dados
        );


        const percentual =
            Number(
                dados.percentual_saque ?? 0
            );


        const valor =
            Number.isFinite(percentual)
                ? Math.max(
                    0,
                    Math.min(
                        100,
                        percentual
                    )
                )
                : 0;


        if(elemento){

            elemento.innerText =
                valor.toFixed(2) +
                "%";

        }


        window.percentualConfiguracaoAtual =
            valor;


    }
    catch(erro){

        console.error(
            "Erro ao carregar configuração:",
            erro
        );


        if(elemento){

            elemento.innerText =
                "Erro";

        }

    }

}


// ============================================================
// CRIAR SEGUNDO POPUP DINAMICAMENTE
// ============================================================

function criarModalPercentagemLucros(){

    // ========================================================
    // SE JÁ EXISTIR, NÃO CRIAR OUTRO
    // ========================================================

    let modal =
        document.getElementById(
            "modal-percentagem-lucros"
        );


    if(modal){

        return modal;

    }


    // ========================================================
    // CRIAR MODAL
    // ========================================================

    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "modal-percentagem-lucros";


    modal.innerHTML = `

        <div
            class="config-percentual-box"
        >

            <div class="config-percentual-header">

                <div>

                    <h4>
                        Percentagem dos Lucros
                    </h4>

                    <small>
                        Defina a percentagem utilizada para outros fins.
                    </small>

                </div>


                <button
                    type="button"
                    id="btn-fechar-percentual"
                    class="config-close-btn"
                >

                    <i class="bi bi-x-lg"></i>

                </button>

            </div>


            <div class="config-percentual-body">

                <div class="config-current-value">

                    <span>
                        Valor atual
                    </span>

                    <strong
                        id="percentual-atual-modal"
                    >
                        0.00%
                    </strong>

                </div>


                <label
                    for="input-percentual-lucros"
                >
                    Nova percentagem
                </label>


                <div class="input-group">

                    <input
                        type="number"
                        id="input-percentual-lucros"
                        class="form-control"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Ex: 10"
                    >

                    <span class="input-group-text">
                        %
                    </span>

                </div>


                <div
                    id="erro-percentual-lucros"
                    class="config-error"
                ></div>


                <div
                    class="config-percentual-actions"
                >

                    <button
                        type="button"
                        id="btn-cancelar-percentual"
                        class="btn btn-secondary"
                    >
                        Cancelar
                    </button>


                    <button
                        type="button"
                        id="btn-salvar-percentual-lucros"
                        class="btn btn-primary"
                    >
                        <i class="bi bi-check-lg"></i>
                        Salvar
                    </button>

                </div>

            </div>

        </div>

    `;


    // ========================================================
    // CSS DO POPUP
    // ========================================================

    const style =
        document.createElement(
            "style"
        );


    style.id =
        "css-modal-percentagem-lucros";


    style.innerHTML = `

        #modal-percentagem-lucros{

            position: fixed;

            inset: 0;

            z-index: 99999;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                rgba(0,0,0,0.55);

            padding: 20px;

        }


        .config-percentual-box{

            width: 100%;

            max-width: 500px;

            background: #fff;

            border-radius: 18px;

            box-shadow:
                0 20px 60px
                rgba(0,0,0,0.25);

            overflow: hidden;

            animation:
                aparecerConfig
                0.2s ease;

        }


        .config-percentual-header{

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 20px 22px;

            background:
                linear-gradient(
                    135deg,
                    #0d6efd,
                    #084298
                );

            color: #fff;

        }


        .config-percentual-header h4{

            margin: 0;

            font-weight: 600;

        }


        .config-percentual-header small{

            opacity: .85;

        }


        .config-close-btn{

            border: 0;

            background:
                rgba(255,255,255,.15);

            color: white;

            width: 38px;

            height: 38px;

            border-radius: 50%;

            cursor: pointer;

        }


        .config-percentual-close:hover{

            background:
                rgba(255,255,255,.25);

        }


        .config-percentual-body{

            padding: 24px;

        }


        .config-current-value{

            display: flex;

            align-items: center;

            justify-content: space-between;

            background: #f8f9fa;

            border-radius: 12px;

            padding: 15px;

            margin-bottom: 20px;

        }


        .config-current-value span{

            color: #6c757d;

        }


        .config-current-value strong{

            font-size: 22px;

            color: #0d6efd;

        }


        .config-percentual-body label{

            font-weight: 500;

            margin-bottom: 8px;

        }


        .config-error{

            display: none;

            color: #dc3545;

            background: #f8d7da;

            border-radius: 8px;

            padding: 10px;

            margin-top: 12px;

        }


        .config-percentual-actions{

            display: flex;

            justify-content: flex-end;

            gap: 10px;

            margin-top: 24px;

        }


        @keyframes aparecerConfig{

            from{

                opacity: 0;

                transform:
                    translateY(-15px)
                    scale(.98);

            }

            to{

                opacity: 1;

                transform:
                    translateY(0)
                    scale(1);

            }

        }

    `;


    document.head.appendChild(
        style
    );


    document.body.appendChild(
        modal
    );


    // ========================================================
    // EVENTOS
    // ========================================================

    document
        .getElementById(
            "btn-fechar-percentual"
        )
        .onclick =
        fecharModalPercentagemLucros;


    document
        .getElementById(
            "btn-cancelar-percentual"
        )
        .onclick =
        fecharModalPercentagemLucros;


    document
        .getElementById(
            "btn-salvar-percentual-lucros"
        )
        .onclick =
        salvarPercentualLucros;


    // ========================================================
    // FECHAR AO CLICAR NO FUNDO
    // ========================================================

    modal.addEventListener(
        "click",
        function(event){

            if(
                event.target ===
                modal
            ){

                fecharModalPercentagemLucros();

            }

        }
    );


    return modal;

}


// ============================================================
// ABRIR SEGUNDO POPUP
// ============================================================

async function abrirModalPercentagemLucros(){

    // ========================================================
    // SEGURANÇA
    // ========================================================

    if(!usuarioEhAdmin()){

        console.warn(
            "Somente o admin pode acessar esta configuração."
        );

        return;

    }


    // ========================================================
    // CRIAR POPUP
    // ========================================================

    const modal =
        criarModalPercentagemLucros();


    if(!modal){
        return;
    }


    // ========================================================
    // CARREGAR CONFIGURAÇÃO
    // ========================================================

    await carregarConfiguracao();


    const valorAtual =
        Number(
            window.percentualConfiguracaoAtual ?? 0
        );


    // ========================================================
    // ELEMENTOS
    // ========================================================

    const valor =
        document.getElementById(
            "percentual-atual-modal"
        );


    const input =
        document.getElementById(
            "input-percentual-lucros"
        );


    const erro =
        document.getElementById(
            "erro-percentual-lucros"
        );


    // ========================================================
    // MOSTRAR VALOR
    // ========================================================

    if(valor){

        valor.innerText =
            valorAtual.toFixed(2) +
            "%";

    }


    if(input){

        input.value =
            valorAtual.toFixed(2);

    }


    if(erro){

        erro.style.display =
            "none";

        erro.innerText =
            "";

    }


    // ========================================================
    // MOSTRAR POPUP
    // ========================================================

    modal.style.display =
        "flex";


    // ========================================================
    // FOCUS
    // ========================================================

    setTimeout(
        function(){

            if(input){

                input.focus();

                input.select();

            }

        },
        100
    );

}


// ============================================================
// FECHAR SEGUNDO POPUP
// ============================================================

function fecharModalPercentagemLucros(){

    const modal =
        document.getElementById(
            "modal-percentagem-lucros"
        );


    if(modal){

        modal.style.display =
            "none";

    }

}


// ============================================================
// MOSTRAR ERRO
// ============================================================

function mostrarErroPercentual(mensagem){

    const erro =
        document.getElementById(
            "erro-percentual-lucros"
        );


    if(!erro){
        return;
    }


    erro.innerText =
        mensagem;


    erro.style.display =
        "block";

}


// ============================================================
// SALVAR PERCENTAGEM
// ============================================================

async function salvarPercentualLucros(){

    // ========================================================
    // SEGURANÇA
    // ========================================================

    if(!usuarioEhAdmin()){

        console.warn(
            "Somente o admin pode alterar a configuração."
        );

        return;

    }


    const input =
        document.getElementById(
            "input-percentual-lucros"
        );


    if(!input){
        return;
    }


    const percentual =
        Number(
            String(input.value)
                .replace(",", ".")
        );


    // ========================================================
    // VALIDAR
    // ========================================================

    if(!Number.isFinite(percentual)){

        mostrarErroPercentual(
            "Informe uma percentagem válida."
        );

        return;

    }


    if(percentual < 0){

        mostrarErroPercentual(
            "A percentagem não pode ser negativa."
        );

        return;

    }


    if(percentual > 100){

        mostrarErroPercentual(
            "A percentagem não pode ser superior a 100%."
        );

        return;

    }


    const botao =
        document.getElementById(
            "btn-salvar-percentual-lucros"
        );


    if(botao){

        botao.disabled =
            true;

        botao.innerHTML =
            '<i class="bi bi-hourglass-split"></i> Salvando...';

    }


    try{

        const resposta =
            await fetch(
                "/configuracoes/",
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

                            percentual_saque:
                                Number(
                                    percentual.toFixed(2)
                                )

                        })

                }
            );


        let dados = {};


        try{

            dados =
                await resposta.json();

        }
        catch(erro){

            console.error(
                "Resposta não JSON:",
                erro
            );

        }


        if(!resposta.ok){

            mostrarErroPercentual(

                dados.detail ||
                "Não foi possível salvar a configuração."

            );

            return;

        }


        // ====================================================
        // ATUALIZAR VALOR
        // ====================================================

        const novoValor =
            Number(
                dados.percentual_saque ??
                percentual
            );


        window.percentualConfiguracaoAtual =
            novoValor;


        const valorModal =
            document.getElementById(
                "percentual-atual-modal"
            );


        if(valorModal){

            valorModal.innerText =
                novoValor.toFixed(2) +
                "%";

        }


        const valorPrincipal =
            document.getElementById(
                "percentual-configuracao-atual"
            );


        if(valorPrincipal){

            valorPrincipal.innerText =
                novoValor.toFixed(2) +
                "%";

        }


        // ====================================================
        // NOTIFICAÇÃO
        // ====================================================

        if(
            typeof window.mostrarNotificacao ===
            "function"
        ){

            window.mostrarNotificacao(
                "Percentagem alterada com sucesso.",
                "success"
            );

        }


        // ====================================================
        // FECHAR
        // ====================================================

        setTimeout(
            function(){

                fecharModalPercentagemLucros();

            },
            700
        );


    }
    catch(erro){

        console.error(
            "Erro ao salvar percentagem:",
            erro
        );


        mostrarErroPercentual(
            "Erro de comunicação com o servidor."
        );

    }
    finally{

        if(botao){

            botao.disabled =
                false;

            botao.innerHTML =
                '<i class="bi bi-check-lg"></i> Salvar';

        }

    }

}


// ============================================================
// EXPOR FUNÇÕES GLOBALMENTE
// ============================================================

window.obterUsuarioConfiguracoes =
    obterUsuarioConfiguracoes;


window.usuarioEhAdmin =
    usuarioEhAdmin;


window.abrirModalConfiguracoes =
    abrirModalConfiguracoes;


window.fecharModalConfiguracoes =
    fecharModalConfiguracoes;


window.carregarConfiguracao =
    carregarConfiguracao;


window.criarBotaoPercentagemLucros =
    criarBotaoPercentagemLucros;


window.criarModalPercentagemLucros =
    criarModalPercentagemLucros;


window.abrirModalPercentagemLucros =
    abrirModalPercentagemLucros;


window.fecharModalPercentagemLucros =
    fecharModalPercentagemLucros;


window.mostrarErroPercentual =
    mostrarErroPercentual;


window.salvarPercentualLucros =
    salvarPercentualLucros;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        console.log(
            "CONFIGURACOES.JS CARREGADO"
        );

    }
);