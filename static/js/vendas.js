/* =====================================================
   VENDAS.JS
   Sistema de vendas - Bar do Celso
===================================================== */


/* =====================================================
   VARIÁVEIS DA VENDA
===================================================== */

window.produtosVenda = [];

window.itensVenda = [];

window.usuarioLogado = JSON.parse(
    localStorage.getItem("usuario")
);


/* =====================================================
   MOSTRAR CARRINHO
===================================================== */

window.mostrarCarrinho = function(){

    console.log("mostrarCarrinho carregado");


    const tabela =
        document.getElementById("lista-carrinho");


    if(!tabela){

        console.log(
            "lista-carrinho não existe no HTML"
        );

        return;

    }


    tabela.innerHTML = "";


    /* ================================================
       CARRINHO VAZIO
    ================================================ */

    if(window.itensVenda.length === 0){

        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    Carrinho vazio
                </td>
            </tr>
        `;


        const totalElemento =
            document.getElementById("total-venda");


        if(totalElemento){

            totalElemento.innerHTML =
                "0 MT";

        }


        calcularTroco();

        return;

    }


    /* ================================================
       CALCULAR TOTAL
    ================================================ */

    let total = 0;


    window.itensVenda.forEach(
        (item, index) => {


        let subtotal =
            Number(item.preco) *
            Number(item.quantidade);


        total += subtotal;


        tabela.innerHTML += `

            <tr>

                <td>
                    ${item.nome}
                </td>


                <td>

                    <input
                        type="number"
                        min="1"
                        value="${item.quantidade}"
                        class="form-control form-control-sm"
                        style="width:70px;"
                        onchange="
                            alterarQuantidadeCarrinho(
                                ${index},
                                this.value
                            )
                        "
                    >

                </td>


                <td>
                    ${subtotal.toFixed(2)} MT
                </td>


                <td>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="
                            removerCarrinho(${index})
                        "
                    >

                        <i class="bi bi-trash"></i>

                    </button>

                </td>


            </tr>

        `;

    });


    /* ================================================
       MOSTRAR TOTAL
    ================================================ */

    const totalElemento =
        document.getElementById("total-venda");


    if(totalElemento){

        totalElemento.innerHTML =
            total.toFixed(2) + " MT";

    }


    /* ================================================
       RECALCULAR TROCO
    ================================================ */

    calcularTroco();

};


/* =====================================================
   ALTERAR QUANTIDADE DO CARRINHO
===================================================== */

window.alterarQuantidadeCarrinho = function(
    index,
    valor
){

    if(
        index < 0 ||
        index >= window.itensVenda.length
    ){

        return;

    }


    let novaQuantidade =
        Number(valor);


    /* ================================================
       QUANTIDADE MÍNIMA
    ================================================ */

    if(
        !Number.isFinite(novaQuantidade) ||
        novaQuantidade < 1
    ){

        novaQuantidade = 1;

    }


    novaQuantidade =
        Math.floor(novaQuantidade);


    const item =
        window.itensVenda[index];


    /* ================================================
       ENCONTRAR PRODUTO ORIGINAL
    ================================================ */

    const produto =
        window.produtosVenda.find(
            p =>
            Number(p.id) ===
            Number(item.id)
        );


    if(produto){

        /*
         * Quantidade atual no carrinho.
         */

        const quantidadeAtual =
            Number(item.quantidade);


        /*
         * Diferença entre a nova e a antiga
         * quantidade.
         */

        const diferenca =
            novaQuantidade -
            quantidadeAtual;


        /*
         * Se aumentou a quantidade,
         * precisamos verificar o stock.
         */

        if(diferenca > 0){

            if(
                Number(produto.quantidade) <
                diferenca
            ){

                alert(
                    "Quantidade em stock insuficiente."
                );

                mostrarCarrinho();

                return;

            }


            produto.quantidade -=
                diferenca;

        }


        /*
         * Se diminuiu a quantidade,
         * devolvemos o produto ao stock visual.
         */

        if(diferenca < 0){

            produto.quantidade +=
                Math.abs(diferenca);

        }

    }


    item.quantidade =
        novaQuantidade;


    /*
     * Atualizar lista de produtos.
     *
     * Mantém o filtro atual.
     */

    filtrarProdutos();


    mostrarCarrinho();

};


/* =====================================================
   CALCULAR TROCO
===================================================== */

window.calcularTroco = function(){

    const campoValor =
        document.getElementById(
            "valor-entregue"
        );


    const campoTroco =
        document.getElementById(
            "troco"
        );


    const campoTotal =
        document.getElementById(
            "total-venda"
        );


    if(!campoValor || !campoTroco){

        return;

    }


    const valorEntregue =
        Number(
            campoValor.value
        );


    let total = 0;


    if(campoTotal){

        const totalTexto =
            campoTotal.innerText
                .replace("MT", "")
                .trim();


        total =
            Number(totalTexto) || 0;

    }


    let troco =
        valorEntregue -
        total;


    /*
     * Nunca mostrar troco negativo.
     */

    if(
        !Number.isFinite(troco) ||
        troco < 0
    ){

        troco = 0;

    }


    campoTroco.innerHTML =
        troco.toFixed(2) +
        " MT";

};

window.botaoAguarde = function(){

    const botao = document.getElementById(
        "btn-finalizar-venda"
    );

    if(!botao) return;

    botao.disabled = true;

    botao.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Aguarde...
    `;
};


window.botaoNormal = function(){

    const botao = document.getElementById(
        "btn-finalizar-venda"
    );

    if(!botao) return;

    botao.disabled = false;

    botao.innerHTML = `
        <i class="bi bi-check-circle"></i>
        <span>Finalizar Venda</span>
    `;
};
/* =====================================================
   FINALIZAR VENDA
   REGISTRA VENDA + ATUALIZA DASHBOARD FINANCEIRO
===================================================== */

window.finalizarVenda = async function(){

    /* =================================================
       BOTÃO FINALIZAR VENDA
    ================================================= */

    const botaoFinalizar =
        document.getElementById(
            "btn-finalizar-venda"
        );

    let textoOriginalBotao = "";

    if(botaoFinalizar){

        textoOriginalBotao =
            botaoFinalizar.innerHTML;

        /* =============================================
           MOSTRAR AGUARDE
        ============================================= */

        botaoFinalizar.disabled = true;

        botaoFinalizar.classList.remove(
            "btn-success"
        );

        botaoFinalizar.classList.add(
            "btn-secondary"
        );

        botaoFinalizar.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
            ></span>

            <span>Aguarde...</span>
        `;

    }


    /* =================================================
       FUNÇÃO PARA RESTAURAR BOTÃO
    ================================================= */

    function restaurarBotaoFinalizar(){

        if(!botaoFinalizar){

            return;

        }


        botaoFinalizar.disabled = false;


        botaoFinalizar.classList.remove(
            "btn-secondary"
        );


        botaoFinalizar.classList.add(
            "btn-success"
        );


        botaoFinalizar.innerHTML =
            textoOriginalBotao ||
            `
                <i class="bi bi-check-circle"></i>
                <span>Finalizar Venda</span>
            `;

    }


    /* =================================================
       VERIFICAR CARRINHO
    ================================================= */

    if(
        !window.itensVenda ||
        window.itensVenda.length === 0
    ){

        alert(
            "Adicione produtos ao carrinho."
        );

        restaurarBotaoFinalizar();

        return;

    }


    /* =================================================
       OBTER USUÁRIO LOGADO
    ================================================= */

    window.usuarioLogado = JSON.parse(
        localStorage.getItem("usuario")
    );


    if(!window.usuarioLogado){

        alert(
            "Faça login."
        );

        restaurarBotaoFinalizar();

        return;

    }


    /* =================================================
       CAMPO VALOR ENTREGUE
    ================================================= */

    const campoValor =
        document.getElementById(
            "valor-entregue"
        );


    if(!campoValor){

        alert(
            "Campo de valor entregue não encontrado."
        );

        restaurarBotaoFinalizar();

        return;

    }


    /* =================================================
       VALOR ENTREGUE
    ================================================= */

    const valorEntregue =
        Number(
            campoValor.value
        );


    /* =================================================
       CALCULAR TOTAL
    ================================================= */

    const total =
        window.itensVenda.reduce(
            (soma, item) => {

                return soma +
                    (
                        Number(item.preco) *
                        Number(item.quantidade)
                    );

            },
            0
        );


    /* =================================================
       VALIDAR VALOR
    ================================================= */

    if(!Number.isFinite(valorEntregue)){

        alert(
            "Informe o valor entregue."
        );

        restaurarBotaoFinalizar();

        return;

    }


    if(valorEntregue < total){

        alert(
            "Valor entregue insuficiente."
        );

        restaurarBotaoFinalizar();

        return;

    }


    /* =================================================
       MONTAR VENDA
    ================================================= */

    const venda = {

        usuario_id:
            Number(
                window.usuarioLogado.id
            ),

        valor_entregue:
            valorEntregue,

        itens:
            window.itensVenda.map(
                item => ({

                    produto_id:
                        Number(item.id),

                    quantidade:
                        Number(item.quantidade)

                })
            )

    };


    /* =================================================
       ENVIAR VENDA PARA O BACKEND
    ================================================= */

    try{

        console.log(
            "====================================="
        );

        console.log(
            "ENVIANDO VENDA:"
        );

        console.log(
            venda
        );

        console.log(
            "=====================================");


        /* =================================================
           TIMEOUT DO FETCH

           Máximo de 30 segundos para o backend responder.
        ================================================= */

        const controller =
            new AbortController();


        const timeoutVenda =
            setTimeout(
                function(){

                    controller.abort();

                },
                30000
            );


        let resposta;


        try{

            resposta =
                await fetch(
                    API + "/vendas/",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(venda),

                        signal:
                            controller.signal

                    }
                );

        }
        catch(error){

            clearTimeout(
                timeoutVenda
            );


            if(
                error.name ===
                "AbortError"
            ){

                alert(
                    "O servidor demorou muito para responder. Tente novamente."
                );

            }
            else{

                console.error(
                    "Erro ao enviar venda:",
                    error
                );

                alert(
                    "Não foi possível conectar ao servidor."
                );

            }


            restaurarBotaoFinalizar();

            return;

        }


        clearTimeout(
            timeoutVenda
        );


        /* =================================================
           LER RESPOSTA
        ================================================= */

        let dados = {};


        try{

            dados =
                await resposta.json();

        }
        catch(error){

            console.error(
                "Erro ao ler resposta da venda:",
                error
            );

        }


        /* =================================================
           VERIFICAR ERRO
        ================================================= */

        if(!resposta.ok){

            console.error(
                "Erro retornado pelo backend:",
                dados
            );


            alert(
                dados.detail ||
                "Erro ao realizar venda."
            );


            restaurarBotaoFinalizar();

            return;

        }


        /* =================================================
           VENDA CONFIRMADA PELO BACKEND

           IMPORTANTE:
           LIBERAR O BOTÃO AGORA.

           Não esperar dashboard,
           stock, caixa, etc.
        ================================================= */

        console.log(
            "====================================="
        );

        console.log(
            "✅ VENDA REGISTADA COM SUCESSO"
        );

        console.log(
            dados
        );

        console.log(
            "=====================================");


        restaurarBotaoFinalizar();


        /* =================================================
           GUARDAR ITENS PARA RECIBO
        ================================================= */

        const itensVendaRecibo =
            window.itensVenda.map(
                item => ({

                    id:
                        item.id,

                    nome:
                        item.nome,

                    preco:
                        Number(item.preco),

                    quantidade:
                        Number(item.quantidade)

                })
            );


        /* =================================================
           PERGUNTAR SOBRE RECIBO
        ================================================= */

        let baixarRecibo = false;


        try{

            if(
                typeof window.mostrarOpcaoRecibo ===
                "function"
            ){

                baixarRecibo =
                    await window.mostrarOpcaoRecibo();

            }

        }
        catch(error){

            console.error(
                "Erro ao mostrar opção de recibo:",
                error
            );

        }


        /* =================================================
           GERAR RECIBO
        ================================================= */

        if(baixarRecibo){

            const itensOriginais =
                window.itensVenda;


            window.itensVenda =
                itensVendaRecibo;


            try{

                if(
                    typeof window.gerarRecibo ===
                    "function"
                ){

                    window.gerarRecibo(
                        dados
                    );

                }

            }
            catch(error){

                console.error(
                    "Erro ao gerar recibo:",
                    error
                );

                alert(
                    "A venda foi realizada, mas houve erro ao gerar o recibo."
                );

            }


            window.itensVenda =
                itensOriginais;

        }


        /* =================================================
           LIMPAR CARRINHO
        ================================================= */

        window.itensVenda = [];


        if(
            typeof window.mostrarCarrinho ===
            "function"
        ){

            window.mostrarCarrinho();

        }


        /* =================================================
           LIMPAR VALOR ENTREGUE
        ================================================= */

        campoValor.value = "";


        /* =================================================
           LIMPAR TROCO
        ================================================= */

        const campoTroco =
            document.getElementById(
                "troco"
            );


        if(campoTroco){

            campoTroco.innerHTML =
                "0 MT";

        }


        /* =================================================
           ATUALIZAR PRODUTOS
        ================================================= */

        try{

            if(
                typeof window.carregarProdutosVenda ===
                "function"
            ){

                console.log(
                    "🔄 Atualizando produtos..."
                );


                await window.carregarProdutosVenda();


                console.log(
                    "✅ Produtos atualizados."
                );

            }

        }
        catch(error){

            console.error(
                "Erro ao atualizar produtos:",
                error
            );

        }


        /* =================================================
           ATUALIZAR DASHBOARD GERAL
        ================================================= */

        try{

            if(
                typeof window.carregarDashboard ===
                "function"
            ){

                console.log(
                    "🔄 Atualizando dashboard geral..."
                );


                await window.carregarDashboard();


                console.log(
                    "✅ Dashboard geral atualizado."
                );

            }

        }
        catch(error){

            console.error(
                "Erro ao atualizar dashboard:",
                error
            );

        }


        /* =================================================
           ATUALIZAR LUCROS E FATURAMENTO
        ================================================= */

        try{

            if(
                typeof window.carregarLucrosDashboard ===
                "function"
            ){

                console.log(
                    "🔄 Atualizando lucros e faturamento..."
                );


                await window.carregarLucrosDashboard();


                console.log(
                    "✅ Lucros e faturamento atualizados."
                );

            }
            else{

                console.warn(
                    "⚠️ carregarLucrosDashboard não está disponível."
                );

            }

        }
        catch(error){

            console.error(
                "❌ Erro ao atualizar lucros e faturamento:",
                error
            );

        }


        /* =================================================
           ATUALIZAR STOCK
        ================================================= */

        try{

            if(
                typeof window.carregarStock ===
                "function"
            ){

                console.log(
                    "🔄 Atualizando stock..."
                );


                await window.carregarStock();


                console.log(
                    "✅ Stock atualizado."
                );

            }

        }
        catch(error){

            console.error(
                "Erro ao atualizar stock:",
                error
            );

        }


        /* =================================================
           ATUALIZAR VENDAS DO DIA
        ================================================= */

        try{

            if(
                typeof window.carregarVendasDia ===
                "function"
            ){

                console.log(
                    "🔄 Atualizando vendas do dia..."
                );


                await window.carregarVendasDia();


                console.log(
                    "✅ Vendas do dia atualizadas."
                );

            }

        }
        catch(error){

            console.error(
                "Erro ao atualizar vendas:",
                error
            );

        }


        /* =================================================
           ATUALIZAR CAIXA
        ================================================= */

        try{

            if(
                typeof window.atualizarSaldoCaixaAgora ===
                "function"
            ){

                console.log(
                    "🔄 Atualizando caixa..."
                );


                await window.atualizarSaldoCaixaAgora();


                console.log(
                    "✅ Caixa atualizado."
                );

            }

        }
        catch(error){

            console.error(
                "Erro ao atualizar caixa:",
                error
            );

        }


        /* =================================================
           AVISAR OUTRAS PARTES DO SISTEMA
        ================================================= */

        try{

            window.dispatchEvent(
                new CustomEvent(
                    "vendaRealizada",
                    {
                        detail: {

                            venda:
                                dados

                        }
                    }
                )
            );

        }
        catch(error){

            console.error(
                "Erro ao disparar evento vendaRealizada:",
                error
            );

        }


        /* =================================================
           SEGUNDA ATUALIZAÇÃO FINANCEIRA
        ================================================= */

        setTimeout(
            async function(){

                try{

                    console.log(
                        "🔄 Segunda atualização financeira..."
                    );


                    /* =====================================
                       DASHBOARD GERAL
                    ===================================== */

                    if(
                        typeof window.carregarDashboard ===
                        "function"
                    ){

                        await window.carregarDashboard();

                    }


                    /* =====================================
                       LUCROS + FATURAMENTO
                    ===================================== */

                    if(
                        typeof window.carregarLucrosDashboard ===
                        "function"
                    ){

                        await window.carregarLucrosDashboard();

                    }


                    console.log(
                        "✅ Segunda atualização concluída."
                    );

                }
                catch(error){

                    console.error(
                        "Erro na segunda atualização do dashboard:",
                        error
                    );

                }

            },
            300
        );


        /* =================================================
           FINAL
        ================================================= */

        console.log(
            "====================================="
        );

        console.log(
            "✅ VENDA FINALIZADA COM SUCESSO"
        );

        console.log(
            "💰 Faturamento atualizado"
        );

        console.log(
            "📈 Lucros atualizados"
        );

        console.log(
            "📦 Stock atualizado"
        );

        console.log(
            "💵 Caixa atualizado"
        );

        console.log(
            "=====================================");


    }
    catch(error){

        console.error(
            "====================================="
        );

        console.error(
            "❌ ERRO AO FINALIZAR VENDA"
        );

        console.error(
            error
        );

        console.error(
            "=====================================");


        alert(
            "Erro ao finalizar venda."
        );


        /* =================================================
           RESTAURAR BOTÃO EM CASO DE ERRO
        ================================================= */

        restaurarBotaoFinalizar();

    }

};
/* =====================================================
   MOSTRAR OPÇÃO DE RECIBO
===================================================== */

window.mostrarOpcaoRecibo = function(){

    return new Promise(
        resolve => {

            /* ========================================
               CRIAR FUNDO
            ======================================== */

            const fundo =
                document.createElement(
                    "div"
                );


            fundo.id =
                "modal-opcao-recibo";


            fundo.style.position =
                "fixed";

            fundo.style.top =
                "0";

            fundo.style.left =
                "0";

            fundo.style.width =
                "100%";

            fundo.style.height =
                "100%";

            fundo.style.background =
                "rgba(0,0,0,0.55)";

            fundo.style.display =
                "flex";

            fundo.style.alignItems =
                "center";

            fundo.style.justifyContent =
                "center";

            fundo.style.zIndex =
                "99999";


            /* ========================================
               CAIXA
            ======================================== */

            const caixa =
                document.createElement(
                    "div"
                );


            caixa.style.background =
                "#ffffff";

            caixa.style.padding =
                "30px";

            caixa.style.borderRadius =
                "12px";

            caixa.style.width =
                "380px";

            caixa.style.maxWidth =
                "90%";

            caixa.style.textAlign =
                "center";

            caixa.style.boxShadow =
                "0 10px 40px rgba(0,0,0,0.3)";


            /* ========================================
               TÍTULO
            ======================================== */

            const titulo =
                document.createElement(
                    "h4"
                );


            titulo.innerText =
                "Venda realizada com sucesso!";


            titulo.style.marginBottom =
                "10px";


            /* ========================================
               TEXTO
            ======================================== */

            const texto =
                document.createElement(
                    "p"
                );


            texto.innerText =
                "Deseja baixar o recibo desta venda?";


            texto.style.marginBottom =
                "25px";


            /* ========================================
               ÁREA DOS BOTÕES
            ======================================== */

            const botoes =
                document.createElement(
                    "div"
                );


            botoes.style.display =
                "flex";

            botoes.style.gap =
                "10px";

            botoes.style.justifyContent =
                "center";


            /* ========================================
               BOTÃO NÃO
            ======================================== */

            const botaoNao =
                document.createElement(
                    "button"
                );


            botaoNao.type =
                "button";


            botaoNao.className =
                "btn btn-secondary";


            botaoNao.innerText =
                "Não";


            botaoNao.style.minWidth =
                "120px";


            /* ========================================
               BOTÃO BAIXAR
            ======================================== */

            const botaoBaixar =
                document.createElement(
                    "button"
                );


            botaoBaixar.type =
                "button";


            botaoBaixar.className =
                "btn btn-primary";


            botaoBaixar.innerText =
                "Baixar recibo";


            botaoBaixar.style.minWidth =
                "120px";


            /* ========================================
               CLIQUE NÃO
            ======================================== */

            botaoNao.onclick =
                function(){

                    fundo.remove();

                    resolve(
                        false
                    );

                };


            /* ========================================
               CLIQUE BAIXAR
            ======================================== */

            botaoBaixar.onclick =
                function(){

                    fundo.remove();

                    resolve(
                        true
                    );

                };


            /* ========================================
               MONTAR MODAL
            ======================================== */

            botoes.appendChild(
                botaoNao
            );

            botoes.appendChild(
                botaoBaixar
            );


            caixa.appendChild(
                titulo
            );

            caixa.appendChild(
                texto
            );

            caixa.appendChild(
                botoes
            );


            fundo.appendChild(
                caixa
            );


            document.body.appendChild(
                fundo
            );


            /* ========================================
               FOCAR NO BOTÃO BAIXAR
            ======================================== */

            botaoBaixar.focus();

        }
    );

};
/* =====================================================
   ABRIR VENDA
===================================================== */

window.abrirVenda = async function(){

    const painel =
        document.getElementById(
            "venda-panel"
        );


    if(painel){

        painel.style.display =
            "flex";

    }


    /* ================================================
       LIMPAR CARRINHO
    ================================================ */

    window.itensVenda = [];


    /* ================================================
       LIMPAR PESQUISA
    ================================================ */

    const pesquisa =
        document.getElementById(
            "pesquisa-produto"
        );


    if(pesquisa){

        pesquisa.value = "";

    }


    /* ================================================
       MOSTRAR CARRINHO VAZIO
    ================================================ */

    mostrarCarrinho();


    /* ================================================
       CARREGAR PRODUTOS
    ================================================ */

    await carregarProdutosVenda();

};


/* =====================================================
   FECHAR VENDA
===================================================== */

window.fecharVenda = function(){

    const painel =
        document.getElementById(
            "venda-panel"
        );


    if(painel){

        painel.style.display =
            "none";

    }

};


/* =====================================================
   MOSTRAR MENU NOVA VENDA
===================================================== */

window.mostrarNovaVenda = function(valor){

    const menuVenda =
        document.getElementById(
            "menu-nova-venda"
        );


    if(menuVenda){

        menuVenda.style.display =
            valor
            ? "flex"
            : "none";

    }

};


/* =====================================================
   CARREGAR PRODUTOS PARA VENDA
===================================================== */

window.carregarProdutosVenda =
    async function(){

    try{

        const resposta =
            await fetch(
                API + "/produtos/"
            );


        if(!resposta.ok){

            throw new Error(
                "Erro ao buscar produtos"
            );

        }


        const todos =
            await resposta.json();


        /* ============================================
           FILTRAR PRODUTOS DISPONÍVEIS
        ============================================ */

        window.produtosVenda =
            todos.filter(

                p =>

                    Number(p.quantidade) > 0 &&

                    p.ativo !== false

            );


        /* ============================================
           MOSTRAR PRODUTOS
        ============================================ */

        filtrarProdutos();

    }
    catch(error){

        console.error(
            "Erro produtos:",
            error
        );

    }

};


/* =====================================================
   MOSTRAR PRODUTOS
===================================================== */

window.mostrarProdutosVenda =
    function(lista){

    const tabela =
        document.getElementById(
            "lista-produtos-venda"
        );


    if(!tabela){

        console.error(
            "lista-produtos-venda não encontrada"
        );

        return;

    }


    let html = "";


    /* ================================================
       NENHUM PRODUTO
    ================================================ */

    if(
        !lista ||
        lista.length === 0
    ){

        tabela.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center"
                >

                    Nenhum produto disponível

                </td>

            </tr>

        `;

        return;

    }


    /* ================================================
       LISTAR PRODUTOS
    ================================================ */

    lista.forEach(
        produto => {

        html += `

            <tr>

                <td>
                    ${produto.nome}
                </td>


                <td>

                    ${Number(
                        produto.preco_venda
                    ).toFixed(2)}

                    MT

                </td>


                <td>

                    ${Number(
                        produto.quantidade
                    )}

                </td>


                <td>

                    <button
                        class="btn btn-primary btn-sm"
                        onclick="
                            adicionarCarrinho(
                                ${produto.id}
                            )
                        "
                    >

                        <i
                            class="bi bi-cart-plus"
                        ></i>

                    </button>

                </td>

            </tr>

        `;

    });


    tabela.innerHTML =
        html;

};


/* =====================================================
   ADICIONAR PRODUTO AO CARRINHO
===================================================== */

window.adicionarCarrinho =
    function(id){

    console.log(
        "Produto clicado:",
        id
    );


    console.log(
        "Produtos disponíveis:",
        window.produtosVenda
    );


    /* ================================================
       PROCURAR PRODUTO
    ================================================ */

    const produto =
        window.produtosVenda.find(

            p =>
                Number(p.id) ===
                Number(id)

        );


    if(!produto){

        console.error(
            "Produto não encontrado",
            id
        );

        return;

    }


    console.log(
        "Produto encontrado:",
        produto
    );


    /* ================================================
       VERIFICAR STOCK
    ================================================ */

    if(
        Number(produto.quantidade) <= 0
    ){

        alert(
            "Produto sem stock."
        );

        return;

    }


    /* ================================================
       VERIFICAR SE JÁ EXISTE NO CARRINHO
    ================================================ */

    const existente =
        window.itensVenda.find(

            item =>
                Number(item.id) ===
                Number(id)

        );


    if(existente){

        existente.quantidade += 1;

    }
    else{

        window.itensVenda.push({

            id:
                produto.id,


            nome:
                produto.nome,


            preco:
                Number(
                    produto.preco_venda
                ),


            quantidade:
                1

        });

    }


    /* ================================================
       DIMINUIR STOCK VISUAL
    ================================================ */

    produto.quantidade -= 1;


    /* ================================================
       IMPORTANTE

       NÃO usar:

       mostrarProdutosVenda(produtosVenda)

       porque isso apagaria o filtro.

       Usamos filtrarProdutos(), que reaplica
       o filtro atualmente digitado.
    ================================================ */

    filtrarProdutos();


    console.log(
        "Carrinho atual:",
        window.itensVenda
    );


    /* ================================================
       ATUALIZAR CARRINHO
    ================================================ */

    mostrarCarrinho();

};


/* =====================================================
   GERAR RECIBO
===================================================== */

window.gerarRecibo =
    function(venda){

    /* ================================================
       DATA
    ================================================ */

    const reciboData =
        document.getElementById(
            "recibo-data"
        );


    if(reciboData){

        reciboData.innerHTML =
            new Date().toLocaleString();

    }


    /* ================================================
       NÚMERO DA VENDA
    ================================================ */

    const numeroVenda =
        document.getElementById(
            "numero-venda"
        );


    if(numeroVenda){

        numeroVenda.innerHTML =
            venda.id ||
            Date.now();

    }


    /* ================================================
       ITENS
    ================================================ */

    let html = "";


    window.itensVenda.forEach(
        item => {

        const subtotal =
            Number(item.preco) *
            Number(item.quantidade);


        html += `

            <tr>

                <td
                    style="
                        text-align:left;
                        padding:10px 0;
                    "
                >

                    ${item.nome}

                </td>


                <td
                    style="
                        text-align:center;
                    "
                >

                    ${item.quantidade}

                </td>


                <td
                    style="
                        text-align:right;
                    "
                >

                    ${subtotal.toFixed(2)}
                    MT

                </td>

            </tr>

        `;

    });


    const reciboItens =
        document.getElementById(
            "recibo-itens"
        );


    if(reciboItens){

        reciboItens.innerHTML =
            html;

    }


    /* ================================================
       TOTAL
    ================================================ */

    const reciboTotal =
        document.getElementById(
            "recibo-total"
        );


    const totalVenda =
        Number(
            venda.total || 0
        );


    if(reciboTotal){

        reciboTotal.innerHTML =
            totalVenda.toFixed(2);

    }


    /* ================================================
       VALOR PAGO
    ================================================ */

    const campoValor =
        document.getElementById(
            "valor-entregue"
        );


    const pago =
        Number(
            campoValor
            ? campoValor.value
            : 0
        );


    const reciboPago =
        document.getElementById(
            "recibo-pago"
        );


    if(reciboPago){

        reciboPago.innerHTML =
            pago.toFixed(2);

    }


    /* ================================================
       TROCO
    ================================================ */

    const reciboTroco =
        document.getElementById(
            "recibo-troco"
        );


    const troco =
        Math.max(
            0,
            pago - totalVenda
        );


    if(reciboTroco){

        reciboTroco.innerHTML =
            troco.toFixed(2);

    }


    /* ================================================
       MOSTRAR RECIBO
    ================================================ */

    const recibo =
        document.getElementById(
            "recibo"
        );


    if(!recibo){

        console.error(
            "Elemento recibo não encontrado"
        );

        return;

    }


    recibo.style.display =
        "block";


    /* ================================================
       GERAR PDF
    ================================================ */

    baixarReciboPDF();

};


/* =====================================================
   BAIXAR RECIBO PDF
===================================================== */

window.baixarReciboPDF =
    function(){

    const recibo =
        document.getElementById(
            "recibo"
        );


    if(!recibo){

        console.error(
            "Elemento recibo não encontrado"
        );

        return;

    }


    /* ================================================
       GUARDAR ESTILOS ORIGINAIS
    ================================================ */

    const estiloOriginal = {

        width:
            recibo.style.width,


        margin:
            recibo.style.margin,


        transform:
            recibo.style.transform,


        zoom:
            recibo.style.zoom,


        display:
            recibo.style.display

    };


    /* ================================================
       PREPARAR RECIBO
    ================================================ */

    recibo.style.width =
        "190mm";


    recibo.style.margin =
        "0 auto";


    recibo.style.transform =
        "none";


    recibo.style.zoom =
        "1";


    recibo.style.display =
        "block";


    /* ================================================
       AGUARDAR RENDERIZAÇÃO
    ================================================ */

    setTimeout(
        () => {

        html2pdf()

        .set({

            html2canvas: {

                scale: 2,

                backgroundColor:
                    "#ffffff",

                useCORS:
                    true,

                scrollX:
                    0,

                scrollY:
                    0

            }

        })

        .from(recibo)

        .toCanvas()

        .get("canvas")

        .then(
            canvas => {

            /* ========================================
               CRIAR PDF A4
            ======================================== */

            const {
                jsPDF
            } = window.jspdf;


            const pdf =
                new jsPDF({

                    unit:
                        "mm",

                    format:
                        "a4",

                    orientation:
                        "portrait",

                    compress:
                        true

                });


            /* ========================================
               DIMENSÕES A4
            ======================================== */

            const paginaLargura =
                210;


            const paginaAltura =
                297;


            const margem =
                10;


            const larguraDisponivel =
                paginaLargura -
                (
                    margem * 2
                );


            const alturaDisponivel =
                paginaAltura -
                (
                    margem * 2
                );


            /* ========================================
               DIMENSÕES CANVAS
            ======================================== */

            const larguraCanvas =
                canvas.width;


            const alturaCanvas =
                canvas.height;


            /* ========================================
               CALCULAR ESCALA
            ======================================== */

            const escalaLargura =
                larguraDisponivel /
                larguraCanvas;


            const escalaAltura =
                alturaDisponivel /
                alturaCanvas;


            const escala =
                Math.min(
                    escalaLargura,
                    escalaAltura
                );


            /* ========================================
               TAMANHO FINAL
            ======================================== */

            const larguraFinal =
                larguraCanvas *
                escala;


            const alturaFinal =
                alturaCanvas *
                escala;


            /* ========================================
               CENTRALIZAR
            ======================================== */

            const x =
                (
                    paginaLargura -
                    larguraFinal
                ) / 2;


            const y =
                margem;


            /* ========================================
               COLOCAR RECIBO NO PDF
            ======================================== */

            pdf.addImage(

                canvas,

                "JPEG",

                x,

                y,

                larguraFinal,

                alturaFinal,

                undefined,

                "FAST"

            );


            /* ========================================
               SALVAR
            ======================================== */

            pdf.save(
                "recibo-venda.pdf"
            );


            /* ========================================
               RESTAURAR ESTILOS
            ======================================== */

            recibo.style.width =
                estiloOriginal.width;


            recibo.style.margin =
                estiloOriginal.margin;


            recibo.style.transform =
                estiloOriginal.transform;


            recibo.style.zoom =
                estiloOriginal.zoom;


            recibo.style.display =
                "none";

        })

        .catch(
            error => {

            console.error(
                "Erro ao gerar PDF:",
                error
            );


            alert(
                "Erro ao gerar recibo PDF."
            );


            /* ====================================
               RESTAURAR ESTILOS EM CASO DE ERRO
            ==================================== */

            recibo.style.width =
                estiloOriginal.width;


            recibo.style.margin =
                estiloOriginal.margin;


            recibo.style.transform =
                estiloOriginal.transform;


            recibo.style.zoom =
                estiloOriginal.zoom;


            recibo.style.display =
                estiloOriginal.display;

        });

    }, 200);

};


/* =====================================================
   FILTRAR PRODUTOS NA VENDA
===================================================== */

window.filtrarProdutos =
    function(){

    const campo =
        document.getElementById(
            "pesquisa-produto"
        );


    if(!campo){

        console.log(
            "Campo pesquisa-produto não encontrado"
        );

        return;

    }


    /* ================================================
       TEXTO DA PESQUISA
    ================================================ */

    const texto =
        campo.value
            .toLowerCase()
            .trim();


    /* ================================================
       FILTRAR
    ================================================ */

    const filtrados =
        window.produtosVenda.filter(
            produto => {

            return String(
                produto.nome
            )
            .toLowerCase()
            .includes(
                texto
            );

        });


    /* ================================================
       MOSTRAR RESULTADO
    ================================================ */

    mostrarProdutosVenda(
        filtrados
    );

};


/* =====================================================
   REMOVER PRODUTO DO CARRINHO
===================================================== */

window.removerCarrinho =
    function(index){

    console.log(
        "Removendo item:",
        index
    );


    /* ================================================
       VALIDAR ÍNDICE
    ================================================ */

    if(

        index < 0 ||

        index >=
        window.itensVenda.length

    ){

        console.error(
            "Índice inválido:",
            index
        );

        return;

    }


    /* ================================================
       PRODUTO REMOVIDO
    ================================================ */

    const item =
        window.itensVenda[index];


    /* ================================================
       DEVOLVER AO STOCK VISUAL
    ================================================ */

    const produto =
        window.produtosVenda.find(

            p =>
                Number(p.id) ===
                Number(item.id)

        );


    if(produto){

        produto.quantidade +=
            Number(item.quantidade);

    }


    /* ================================================
       REMOVER DO CARRINHO
    ================================================ */

    window.itensVenda.splice(
        index,
        1
    );


    /* ================================================
       ATUALIZAR PRODUTOS

       Mantém o filtro atual.
    ================================================ */

    filtrarProdutos();


    /* ================================================
       ATUALIZAR CARRINHO
    ================================================ */

    mostrarCarrinho();


    /* ================================================
       ATUALIZAR TROCO
    ================================================ */

    calcularTroco();

};

// =====================================================
// ROLAR AUTOMATICAMENTE PARA O ITEM ADICIONADO
// =====================================================

window.rolarParaItemCarrinho = function(id){

    // Esperar a tabela terminar de atualizar
    setTimeout(() => {

        const container =
            document.getElementById(
                "carrinho-scroll"
            );


        if(!container){

            console.error(
                "carrinho-scroll não encontrado"
            );

            return;

        }


        // Procurar o produto pelo ID
        const item =
            container.querySelector(
                `tr[data-produto-id="${id}"]`
            );


        if(!item){

            console.error(
                "Item não encontrado no carrinho:",
                id
            );

            return;

        }


        // =============================================
        // ROLAR ATÉ O ITEM
        // =============================================

        item.scrollIntoView({

            behavior: "smooth",

            block: "center",

            inline: "nearest"

        });


        // =============================================
        // DESTACAR O ITEM
        // =============================================

        item.classList.remove(
            "item-adicionado-destaque"
        );

        // Forçar atualização visual
        void item.offsetWidth;

        item.classList.add(
            "item-adicionado-destaque"
        );


        // Remover destaque depois de 1 segundo
        setTimeout(() => {

            item.classList.remove(
                "item-adicionado-destaque"
            );

        }, 1000);


    }, 50);

};
