// =====================================
// RECOLHA DE DINHEIRO DO GERENTE
// =====================================

console.log("RECOLHA-GERENTE.JS CARREGADO");


// =====================================
// GERENTE SELECIONADO
// =====================================

let gerenteSelecionadoRecolha = null;


// =====================================
// ABRIR MODAL
// =====================================

function abrirRecolhaGerente(
    gerenteId,
    gerenteNome,
    valorDisponivel
){

    console.log(
        "====================================="
    );

    console.log(
        "ABRIR RECOLHA DO GERENTE"
    );

    console.log(
        "GERENTE ID:",
        gerenteId
    );

    console.log(
        "GERENTE:",
        gerenteNome
    );

    console.log(
        "DISPONÍVEL:",
        valorDisponivel
    );

    console.log(
        "====================================="
    );


    const modal =
        document.getElementById(
            "modal-recolha-gerente"
        );


    if(!modal){

        console.error(
            "Modal #modal-recolha-gerente não encontrado."
        );

        return;

    }


    // =====================================
    // GUARDAR GERENTE
    // =====================================

    gerenteSelecionadoRecolha = {

        id:
            Number(gerenteId),

        nome:
            gerenteNome,

        disponivel:
            Number(valorDisponivel ?? 0)

    };


    // =====================================
    // ELEMENTOS
    // =====================================

    const nome =
        document.getElementById(
            "nome-gerente-recolha"
        );


    const disponivel =
        document.getElementById(
            "disponivel-gerente-recolha"
        );


    const campoValor =
        document.getElementById(
            "valor-recolha-gerente"
        );


    const observacao =
        document.getElementById(
            "observacao-recolha-gerente"
        );


    // =====================================
    // PREENCHER GERENTE
    // =====================================

    if(nome){

        nome.innerText =
            gerenteNome || "-";

    }


    // =====================================
    // PREENCHER DISPONÍVEL
    // =====================================

    if(disponivel){

        disponivel.innerText =
            Number(
                valorDisponivel ?? 0
            ).toFixed(2) +
            " MT";

    }


    // =====================================
    // LIMPAR CAMPOS
    // =====================================

    if(campoValor){

        campoValor.value = "";

        campoValor.max =
            Number(
                valorDisponivel ?? 0
            ).toFixed(2);

    }


    if(observacao){

        observacao.value = "";

    }


    // =====================================
    // ABRIR
    // =====================================

    modal.style.display = "flex";


    // =====================================
    // FOCO
    // =====================================

    setTimeout(() => {

        if(campoValor){

            campoValor.focus();

        }

    }, 100);

}


// =====================================
// FECHAR MODAL
// =====================================

function fecharRecolhaGerente(){

    const modal =
        document.getElementById(
            "modal-recolha-gerente"
        );


    if(modal){

        modal.style.display =
            "none";

    }


    gerenteSelecionadoRecolha = null;

}


// =====================================
// CONFIRMAR RECOLHA
// =====================================

async function confirmarRecolhaGerente(){

    // =====================================
    // VERIFICAR GERENTE
    // =====================================

    if(!gerenteSelecionadoRecolha){

        alert(
            "Nenhum gerente selecionado."
        );

        return;

    }


    // =====================================
    // USUÁRIO LOGADO
    // =====================================

    const usuarioStorage =
        localStorage.getItem(
            "usuario"
        );


    if(!usuarioStorage){

        alert(
            "Usuário não encontrado."
        );

        return;

    }


    let usuario;


    try{

        usuario =
            JSON.parse(
                usuarioStorage
            );

    }
    catch(erro){

        console.error(
            erro
        );

        alert(
            "Erro ao identificar o usuário."
        );

        return;

    }


    // =====================================
    // SOMENTE ADMIN
    // =====================================

    if(
        usuario.tipo !== "admin" &&
        usuario.tipo !== "administrador"
    ){

        alert(
            "Somente o admin pode recolher dinheiro do gerente."
        );

        return;

    }


    // =====================================
    // CAMPOS
    // =====================================

    const campoValor =
        document.getElementById(
            "valor-recolha-gerente"
        );


    const campoObservacao =
        document.getElementById(
            "observacao-recolha-gerente"
        );


    if(!campoValor){

        alert(
            "Campo de valor não encontrado."
        );

        return;

    }


    // =====================================
    // VALOR
    // =====================================

    const valor =
        Number(
            campoValor.value
        );


    const observacao =
        campoObservacao
        ?
        campoObservacao.value.trim()
        :
        "";


    // =====================================
    // VALIDAR
    // =====================================

    if(
        !Number.isFinite(valor) ||
        valor <= 0
    ){

        alert(
            "Informe um valor maior que zero."
        );

        campoValor.focus();

        return;

    }


    // =====================================
    // DISPONÍVEL
    // =====================================

    const disponivel =
        Number(
            gerenteSelecionadoRecolha.disponivel
        );


    if(valor > disponivel){

        alert(
            "O valor informado é maior que o disponível.\n\n" +
            "Disponível: " +
            disponivel.toFixed(2) +
            " MT"
        );

        campoValor.focus();

        return;

    }


    // =====================================
    // BOTÃO
    // =====================================

    const botao =
        document.querySelector(
            "#modal-recolha-gerente button.btn-danger"
        );


    if(botao){

        botao.disabled = true;

        botao.innerText =
            "Recolhendo...";

    }


    try{

        // =====================================
        // ENVIAR PARA O BACKEND
        // =====================================

        const resposta =
            await fetch(
                `/caixa/recolher?usuario_id=${usuario.id}`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            vendedor_id:
                                gerenteSelecionadoRecolha.id,

                            valor:
                                valor,

                            observacao:
                                observacao

                        })

                }
            );


        // =====================================
        // RESPOSTA
        // =====================================

        let dados = {};


        try{

            dados =
                await resposta.json();

        }
        catch(erro){

            console.error(
                "Erro ao ler resposta:",
                erro
            );

        }


        // =====================================
        // ERRO
        // =====================================

        if(!resposta.ok){

            alert(
                dados.detail ||
                "Erro ao realizar recolha."
            );

            return;

        }


        // =====================================
        // SUCESSO
        // =====================================

        console.log(
            "RECOLHA REALIZADA:",
            dados
        );


        alert(
            "Recolha realizada com sucesso!\n\n" +

            "Gerente: " +
            gerenteSelecionadoRecolha.nome +

            "\nValor: " +
            valor.toFixed(2) +
            " MT"
        );


        // =====================================
        // FECHAR
        // =====================================

        fecharRecolhaGerente();


        // =====================================
        // ATUALIZAR DETALHES
        // =====================================

        if(
            typeof abrirDetalhesDinheiroRecolhido
            ===
            "function"
        ){

            await abrirDetalhesDinheiroRecolhido();

        }


        // =====================================
        // ATUALIZAR DASHBOARD
        // =====================================

        if(
            typeof window.atualizarDadosCaixaDashboard
            ===
            "function"
        ){

            await window.atualizarDadosCaixaDashboard();

        }


    }
    catch(erro){

        console.error(
            "ERRO NA RECOLHA DO GERENTE:",
            erro
        );


        alert(
            "Erro de comunicação com o servidor."
        );

    }
    finally{

        if(botao){

            botao.disabled = false;

            botao.innerText =
                "Recolher";

        }

    }

}
