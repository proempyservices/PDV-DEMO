// =====================================================
// STOCK.JS
// =====================================================
//
// ROTAS UTILIZADAS:
//
// GET  /produtos/
// GET  /stock/
// GET  /stock/lotes
// POST /produtos/{id}/entrada-stock
//
// =====================================================


// =====================================================
// ABRIR STOCK
// =====================================================

window.abrirStock = async function(){

    const painel =
        document.getElementById(
            "stock-panel"
        );

    if(!painel){

        console.warn(
            "Elemento #stock-panel não encontrado."
        );

        return;

    }

    painel.style.display = "flex";

    await carregarStock();

};


// =====================================================
// FECHAR STOCK
// =====================================================

window.fecharStock = function(){

    const painel =
        document.getElementById(
            "stock-panel"
        );

    if(!painel){

        return;

    }

    painel.style.display = "none";

};


// =====================================================
// CARREGAR STOCK
// =====================================================

window.carregarStock = async function(){

    console.log(
        "====================================="
    );

    console.log(
        " CARREGANDO STOCK"
    );

    console.log(
        "====================================="
    );


    try{

        // =================================================
        // 1. BUSCAR PRODUTOS
        // =================================================

        const respostaProdutos =
            await fetch(
                API + "/produtos/",
                {
                    cache: "no-store"
                }
            );


        if(!respostaProdutos.ok){

            throw new Error(
                "Erro ao buscar produtos: " +
                respostaProdutos.status
            );

        }


        const produtos =
            await respostaProdutos.json();


        console.log(
            "PRODUTOS:",
            produtos
        );


        // =================================================
        // 2. BUSCAR STOCK DO PRODUTO
        // =================================================
        //
        // GET /stock/
        //
        // Esta rota usa Produto.quantidade.
        //
        // É mantida separada porque outros locais
        // do sistema podem utilizar esta informação.
        //
        // =================================================

        const respostaStock =
            await fetch(
                API + "/stock/",
                {
                    cache: "no-store"
                }
            );


        if(!respostaStock.ok){

            throw new Error(
                "Erro ao buscar /stock/: " +
                respostaStock.status
            );

        }


        const stocks =
            await respostaStock.json();


        console.log(
            "STOCK /stock/:",
            stocks
        );


        // =================================================
        // 3. BUSCAR STOCK DOS LOTES
        // =================================================
        //
        // GET /stock/lotes
        //
        // Esta é a informação usada na tabela.
        //
        // Exemplo da API:
        //
        // {
        //     "id": 2,
        //     "produto_id": 2,
        //     "nome": "Cerveja",
        //     "stock_lotes": 11
        // }
        //
        // =================================================

        const respostaLotes =
            await fetch(
                API + "/stock/lotes",
                {
                    cache: "no-store"
                }
            );


        if(!respostaLotes.ok){

            throw new Error(
                "Erro ao buscar /stock/lotes: " +
                respostaLotes.status
            );

        }


        const stocksLotes =
            await respostaLotes.json();


        console.log(
            "STOCK DOS LOTES /stock/lotes:",
            stocksLotes
        );


        // =================================================
        // 4. CRIAR MAPA DO STOCK NORMAL
        // =================================================

        const mapaStock = {};


        if(Array.isArray(stocks)){

            stocks.forEach(
                stock => {

                    const produtoId =
                        Number(
                            stock.produto_id ??
                            stock.product_id ??
                            stock.produto?.id ??
                            stock.id ??
                            0
                        );


                    if(!produtoId){

                        console.warn(
                            "Stock sem produto_id:",
                            stock
                        );

                        return;

                    }


                    mapaStock[produtoId] =
                        Number(
                            stock.stock_total ?? 0
                        );

                }
            );

        }


        console.log(
            "MAPA STOCK /stock/:",
            mapaStock
        );


        // =================================================
        // 5. CRIAR MAPA DO STOCK DOS LOTES
        // =================================================
        //
        // IMPORTANTE:
        //
        // A API devolve:
        //
        // stock_lotes
        //
        // Portanto usamos EXATAMENTE:
        //
        // stock.stock_lotes
        //
        // =================================================

        const mapaStockLotes = {};


        if(Array.isArray(stocksLotes)){

            stocksLotes.forEach(
                stock => {

                    const produtoId =
                        Number(
                            stock.produto_id ??
                            stock.product_id ??
                            stock.produto?.id ??
                            stock.id ??
                            0
                        );


                    if(!produtoId){

                        console.warn(
                            "Stock de lote sem produto_id:",
                            stock
                        );

                        return;

                    }


                    mapaStockLotes[produtoId] =
                        Number(
                            stock.stock_lotes ?? 0
                        );

                }
            );

        }


        console.log(
            "MAPA STOCK DOS LOTES:",
            mapaStockLotes
        );


        // =================================================
        // 6. LOCALIZAR TABELA
        // =================================================

        const tabela =
            document.getElementById(
                "lista-stock"
            );


        if(!tabela){

            console.warn(
                "Elemento #lista-stock não encontrado."
            );

            return;

        }


        tabela.innerHTML = "";


        // =================================================
        // 7. OBTER USUÁRIO
        // =================================================

        let usuario = null;


        try{

            const storage =
                localStorage.getItem(
                    "usuario"
                );


            if(storage){

                usuario =
                    JSON.parse(
                        storage
                    );

            }

        }
        catch(error){

            console.error(
                "ERRO AO LER USUÁRIO:",
                error
            );

            usuario = null;

        }


        // =================================================
        // 8. VERIFICAR PRODUTOS
        // =================================================

        if(
            !Array.isArray(produtos) ||
            produtos.length === 0
        ){

            tabela.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="text-center"
                    >

                        Nenhum produto encontrado.

                    </td>

                </tr>

            `;

            return;

        }


        // =================================================
        // 9. PERCORRER PRODUTOS
        // =================================================

        produtos.forEach(
            produto => {

                // =================================================
                // ID DO PRODUTO
                // =================================================

                const produtoId =
                    Number(
                        produto.id ?? 0
                    );


                // =================================================
                // STOCK REAL DOS LOTES
                // =================================================
                //
                // VEM DE:
                //
                // GET /stock/lotes
                //
                // stock_lotes
                //
                // =================================================

                const stockTotal =
                    Number(
                        mapaStockLotes[produtoId] ?? 0
                    );


                // =================================================
                // STOCK MÍNIMO
                // =================================================

                const stockMinimo =
                    Number(
                        produto.stock_minimo ?? 0
                    );


                // =================================================
                // ESTADO DO STOCK
                // =================================================

                let estado = "";
                let classe = "";


                // =================================================
                // SEM STOCK
                // =================================================

                if(stockTotal <= 0){

                    estado =
                        "Sem Stock";

                    classe =
                        "bg-danger";

                }


                // =================================================
                // BAIXO STOCK
                // =================================================

                else if(
                    stockTotal <=
                    stockMinimo
                ){

                    estado =
                        "Baixo";

                    classe =
                        "bg-warning text-dark";

                }


                // =================================================
                // STOCK NORMAL
                // =================================================

                else{

                    estado =
                        "Normal";

                    classe =
                        "bg-success";

                }


                // =================================================
                // BOTÃO ENTRADA
                // =================================================

                let botaoEntrada = "";


                if(
                    usuario &&
                    (
                        usuario.tipo === "admin" ||
                        usuario.tipo === "gerente"
                    )
                ){

                    // =============================================
                    // PROTEGER NOME
                    // =============================================

                    const nomeSeguro =
                        String(
                            produto.nome ?? ""
                        )
                        .replace(
                            /\\/g,
                            "\\\\"
                        )
                        .replace(
                            /'/g,
                            "\\'"
                        );


                    // =============================================
                    // PREÇO DE COMPRA
                    // =============================================

                    const precoCompra =
                        Number(
                            produto.preco_compra ?? 0
                        );


                    // =============================================
                    // PREÇO DE VENDA
                    // =============================================

                    const precoVenda =
                        Number(
                            produto.preco_venda ?? 0
                        );


                    botaoEntrada = `

                        <button

                            type="button"

                            class="btn btn-success btn-sm"

                            onclick="abrirEntradaStock(
                                ${produtoId},
                                '${nomeSeguro}',
                                ${precoCompra},
                                ${precoVenda}
                            )"

                        >

                            <i class="bi bi-plus-circle"></i>

                            Entrada

                        </button>

                    `;

                }


                // =================================================
                // LINHA DA TABELA
                // =================================================

                tabela.innerHTML += `

                    <tr>

                        <td>
                            ${produtoId}
                        </td>

                        <td>
                            ${produto.nome ?? ""}
                        </td>

                        <td>
                            ${produto.categoria_id ?? ""}
                        </td>

                        <td>

                            <strong>
                                ${stockTotal}
                            </strong>

                        </td>

                        <td>
                            ${stockMinimo}
                        </td>

                        <td>

                            <span
                                class="badge ${classe}"
                            >

                                ${estado}

                            </span>

                        </td>

                        <td>

                            ${botaoEntrada}

                        </td>

                    </tr>

                `;

            }
        );


        // =================================================
        // FINAL
        // =================================================

        console.log(
            "====================================="
        );

        console.log(
            " STOCK CARREGADO COM SUCESSO"
        );

        console.log(
            "====================================="
        );

    }


    catch(error){

        console.error(
            "ERRO AO CARREGAR STOCK:",
            error
        );


        alert(
            "Erro ao carregar stock."
        );

    }

};


// =====================================================
// ABRIR ENTRADA DE STOCK
// =====================================================

window.abrirEntradaStock = function(
    id,
    nome,
    precoCompra = 0,
    precoVenda = 0
){

    // =================================================
    // ID
    // =================================================

    const campoId =
        document.getElementById(
            "entrada-produto-id"
        );


    if(campoId){

        campoId.value =
            id;

    }


    // =================================================
    // PRODUTO
    // =================================================

    const campoProduto =
        document.getElementById(
            "entrada-produto"
        );


    if(campoProduto){

        campoProduto.value =
            nome;

    }


    // =================================================
    // QUANTIDADE
    // =================================================

    const campoQuantidade =
        document.getElementById(
            "entrada-quantidade"
        );


    if(campoQuantidade){

        campoQuantidade.value =
            "";

    }


    // =================================================
    // PREÇO DE COMPRA
    // =================================================

    const campoCompra =
        document.getElementById(
            "entrada-preco-compra"
        );


    if(campoCompra){

        campoCompra.value =
            precoCompra > 0
                ? precoCompra
                : "";

    }


    // =================================================
    // PREÇO DE VENDA
    // =================================================

    const campoVenda =
        document.getElementById(
            "entrada-preco-venda"
        );


    if(campoVenda){

        campoVenda.value =
            precoVenda > 0
                ? precoVenda
                : "";

    }


    // =================================================
    // ABRIR PAINEL
    // =================================================

    const painel =
        document.getElementById(
            "entrada-stock-panel"
        );


    if(painel){

        painel.style.display =
            "flex";

    }

};


// =====================================================
// FECHAR ENTRADA
// =====================================================

window.fecharEntradaStock = function(){

    const painel =
        document.getElementById(
            "entrada-stock-panel"
        );


    if(painel){

        painel.style.display =
            "none";

    }

};


// =====================================================
// SALVAR ENTRADA DE STOCK
// =====================================================
//
// ROTA:
//
// POST /produtos/{id}/entrada-stock
//
// BODY:
//
// {
//     quantidade: 3,
//     preco_compra: 20,
//     preco_venda: 30
// }
//
// =====================================================

window.salvarEntradaStock = async function(){

    console.log(
        "====================================="
    );

    console.log(
        " SALVANDO ENTRADA DE STOCK"
    );

    console.log(
        "====================================="
    );


    try{

        // =================================================
        // ID DO PRODUTO
        // =================================================

        const campoId =
            document.getElementById(
                "entrada-produto-id"
            );


        const id =
            campoId
                ? String(
                    campoId.value
                ).trim()
                : "";


        // =================================================
        // QUANTIDADE
        // =================================================

        const campoQuantidade =
            document.getElementById(
                "entrada-quantidade"
            );


        const quantidade =
            Number(
                campoQuantidade
                    ? campoQuantidade.value
                    : 0
            );


        // =================================================
        // PREÇO DE COMPRA
        // =================================================

        const campoCompra =
            document.getElementById(
                "entrada-preco-compra"
            );


        const precoCompra =
            Number(
                campoCompra
                    ? campoCompra.value
                    : 0
            );


        // =================================================
        // PREÇO DE VENDA
        // =================================================

        const campoVenda =
            document.getElementById(
                "entrada-preco-venda"
            );


        const precoVenda =
            Number(
                campoVenda
                    ? campoVenda.value
                    : 0
            );


        // =================================================
        // VALIDAR ID
        // =================================================

        if(!id){

            alert(
                "Produto inválido."
            );

            return;

        }


        // =================================================
        // VALIDAR QUANTIDADE
        // =================================================

        if(
            !Number.isFinite(
                quantidade
            ) ||
            quantidade <= 0
        ){

            alert(
                "Informe uma quantidade válida."
            );

            return;

        }


        // =================================================
        // VALIDAR PREÇO DE COMPRA
        // =================================================

        if(
            !Number.isFinite(
                precoCompra
            ) ||
            precoCompra <= 0
        ){

            alert(
                "Informe um preço de compra válido."
            );

            return;

        }


        // =================================================
        // VALIDAR PREÇO DE VENDA
        // =================================================

        if(
            !Number.isFinite(
                precoVenda
            ) ||
            precoVenda <= 0
        ){

            alert(
                "Informe um preço de venda válido."
            );

            return;

        }


        // =================================================
        // DADOS
        // =================================================

        const dados = {

            quantidade:
                quantidade,

            preco_compra:
                precoCompra,

            preco_venda:
                precoVenda

        };


        console.log(
            "PRODUTO:",
            id
        );


        console.log(
            "DADOS ENVIADOS:",
            dados
        );


        // =================================================
        // URL
        // =================================================

        const url =
            API +
            "/produtos/" +
            encodeURIComponent(
                id
            ) +
            "/entrada-stock";


        console.log(
            "URL:",
            url
        );


        // =================================================
        // ENVIAR
        // =================================================

        const resposta =
            await fetch(
                url,
                {

                    method:
                        "POST",

                    headers: {

                        "accept":
                            "application/json",

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            dados
                        )

                }
            );


        // =================================================
        // LER RESPOSTA
        // =================================================

        let resultado =
            null;


        try{

            resultado =
                await resposta.json();

        }
        catch(error){

            console.warn(
                "Resposta não é JSON."
            );

        }


        console.log(
            "RESPOSTA API:",
            resultado
        );


        // =================================================
        // SUCESSO
        // =================================================

        if(resposta.ok){

            alert(
                resultado?.mensagem ||
                "Stock adicionado com sucesso."
            );


            // =================================================
            // FECHAR PAINEL
            // =================================================

            fecharEntradaStock();


            // =================================================
            // ATUALIZAR STOCK
            // =================================================

            await carregarStock();


            // =================================================
            // ATUALIZAR DASHBOARD
            // =================================================

            if(
                typeof window.carregarDashboard ===
                "function"
            ){

                await window.carregarDashboard();

            }


            return;

        }


        // =================================================
        // ERRO DA API
        // =================================================

        console.error(
            "ERRO DA API:",
            resultado
        );


        let mensagemErro =
            "Erro ao adicionar stock.";


        if(
            resultado &&
            resultado.detail
        ){

            if(
                typeof resultado.detail ===
                "string"
            ){

                mensagemErro =
                    resultado.detail;

            }

            else if(
                Array.isArray(
                    resultado.detail
                )
            ){

                mensagemErro =
                    resultado.detail
                        .map(
                            erro =>
                                erro.msg ||
                                "Erro de validação"
                        )
                        .join(
                            "\n"
                        );

            }

        }


        alert(
            mensagemErro
        );

    }


    catch(error){

        console.error(
            "ERRO AO ADICIONAR STOCK:",
            error
        );


        alert(
            "Erro de conexão com o servidor."
        );

    }

};


// =====================================================
// CONTROLAR MENU STOCK
// =====================================================

window.mostrarStock = function(
    valor
){

    const menuStock =
        document.getElementById(
            "menu-stock"
        );


    if(!menuStock){

        return;

    }


    if(valor){

        menuStock.style.display =
            "flex";

        menuStock.style.visibility =
            "visible";

        menuStock.style.opacity =
            "1";

    }

    else{

        menuStock.style.display =
            "none";

    }

};