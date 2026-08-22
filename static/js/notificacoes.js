// =====================================================
// SISTEMA GLOBAL DE NOTIFICAÇÕES
// Substitui o alert() nativo por uma mensagem visual
// =====================================================

(function(){

    // =================================================
    // CRIAR ESTILO
    // =================================================

    const estilo = document.createElement("style");

    estilo.textContent = `

        #sistema-notificacoes {

            position: fixed;

            top: 20px;

            right: 20px;

            z-index: 999999;

            display: flex;

            flex-direction: column;

            gap: 10px;

            width: 350px;

            max-width: calc(100vw - 40px);

            pointer-events: none;

        }


        .notificacao {

            position: relative;

            background: #ffffff;

            color: #212529;

            border-radius: 10px;

            padding: 14px 45px 14px 16px;

            box-shadow:
                0 5px 20px rgba(0,0,0,0.18);

            border-left: 5px solid #0d6efd;

            font-size: 14px;

            line-height: 1.4;

            pointer-events: auto;

            animation:
                notificacaoEntrar
                0.25s ease;

            transition:
                opacity 0.25s ease,
                transform 0.25s ease;

        }


        .notificacao-sucesso {

            border-left-color: #198754;

        }


        .notificacao-erro {

            border-left-color: #dc3545;

        }


        .notificacao-aviso {

            border-left-color: #ffc107;

        }


        .notificacao-info {

            border-left-color: #0d6efd;

        }


        .notificacao-fechar {

            position: absolute;

            top: 8px;

            right: 10px;

            border: none;

            background: transparent;

            color: #6c757d;

            font-size: 20px;

            line-height: 1;

            cursor: pointer;

            padding: 2px 5px;

        }


        .notificacao-fechar:hover {

            color: #000000;

        }


        .notificacao-conteudo {

            display: flex;

            align-items: flex-start;

            gap: 10px;

        }


        .notificacao-icone {

            font-size: 18px;

            min-width: 20px;

        }


        @keyframes notificacaoEntrar {

            from {

                opacity: 0;

                transform:
                    translateX(30px);

            }

            to {

                opacity: 1;

                transform:
                    translateX(0);

            }

        }


        @media(max-width: 600px){

            #sistema-notificacoes {

                top: 10px;

                right: 10px;

                left: 10px;

                width: auto;

                max-width: none;

            }

        }

    `;


    document.head.appendChild(estilo);


    // =================================================
    // CRIAR CONTAINER
    // =================================================

    function criarContainer(){

        let container =
            document.getElementById(
                "sistema-notificacoes"
            );


        if(!container){

            container =
                document.createElement("div");

            container.id =
                "sistema-notificacoes";


            document.body.appendChild(
                container
            );

        }


        return container;

    }


    // =================================================
    // MOSTRAR NOTIFICAÇÃO
    // =================================================

    function mostrarNotificacao(
        mensagem,
        tipo = "info",
        duracao = 4000
    ){

        const container =
            criarContainer();


        const notificacao =
            document.createElement("div");


        notificacao.className =
            "notificacao notificacao-" +
            tipo;


        // =================================================
        // ÍCONE
        // =================================================

        let icone = "ℹ️";


        if(tipo === "sucesso"){

            icone = "✅";

        }


        if(tipo === "erro"){

            icone = "❌";

        }


        if(tipo === "aviso"){

            icone = "⚠️";

        }


        // =================================================
        // CONTEÚDO
        // =================================================

        const conteudo =
            document.createElement("div");


        conteudo.className =
            "notificacao-conteudo";


        const elementoIcone =
            document.createElement("span");


        elementoIcone.className =
            "notificacao-icone";


        elementoIcone.textContent =
            icone;


        const texto =
            document.createElement("div");


        texto.textContent =
            String(mensagem);


        conteudo.appendChild(
            elementoIcone
        );


        conteudo.appendChild(
            texto
        );


        // =================================================
        // BOTÃO FECHAR
        // =================================================

        const fechar =
            document.createElement("button");


        fechar.className =
            "notificacao-fechar";


        fechar.type =
            "button";


        fechar.innerHTML =
            "&times;";


        fechar.onclick =
            function(){

                removerNotificacao(
                    notificacao
                );

            };


        notificacao.appendChild(
            conteudo
        );


        notificacao.appendChild(
            fechar
        );


        container.appendChild(
            notificacao
        );


        // =================================================
        // REMOVER AUTOMATICAMENTE
        // =================================================

        if(duracao > 0){

            setTimeout(
                function(){

                    removerNotificacao(
                        notificacao
                    );

                },
                duracao
            );

        }


        return notificacao;

    }


    // =================================================
    // REMOVER NOTIFICAÇÃO
    // =================================================

    function removerNotificacao(
        notificacao
    ){

        if(!notificacao)
            return;


        notificacao.style.opacity =
            "0";


        notificacao.style.transform =
            "translateX(30px)";


        setTimeout(
            function(){

                if(
                    notificacao &&
                    notificacao.parentNode
                ){

                    notificacao.parentNode
                        .removeChild(
                            notificacao
                        );

                }

            },
            250
        );

    }


    // =================================================
    // SUBSTITUIR ALERT NATIVO
    // =================================================

    const alertOriginal =
        window.alert;


    window.alert =
        function(mensagem){

            mostrarNotificacao(
                mensagem,
                "info",
                4500
            );

        };


    // =================================================
    // FUNÇÕES GLOBAIS
    // =================================================

    window.mostrarNotificacao =
        mostrarNotificacao;


    window.notificacaoSucesso =
        function(mensagem){

            mostrarNotificacao(
                mensagem,
                "sucesso",
                4000
            );

        };


    window.notificacaoErro =
        function(mensagem){

            mostrarNotificacao(
                mensagem,
                "erro",
                5000
            );

        };


    window.notificacaoAviso =
        function(mensagem){

            mostrarNotificacao(
                mensagem,
                "aviso",
                4500
            );

        };


    window.notificacaoInfo =
        function(mensagem){

            mostrarNotificacao(
                mensagem,
                "info",
                4000
            );

        };


    // =================================================
    // DISPONIBILIZAR ALERT ORIGINAL
    // Caso alguma função precise dele
    // =================================================

    window.alertOriginal =
        alertOriginal;


})();