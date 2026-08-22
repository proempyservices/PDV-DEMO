// =====================================================
// PRODUTOS
// =====================================================

// Guarda os produtos carregados
let produtosCache = [];


// =====================================================
// ABRIR PRODUTOS
// =====================================================

async function abrirProdutos() {

    const painel =
        document.getElementById(
            "produtos-panel"
        );

    if (!painel) {

        console.error(
            "Elemento produtos-panel não encontrado."
        );

        return;
    }


    painel.style.display = "flex";


    await carregarCategoriasProduto();

    await carregarProdutos();

}


// =====================================================
// FECHAR PRODUTOS
// =====================================================

function fecharProdutos() {

    const painel =
        document.getElementById(
            "produtos-panel"
        );


    if (painel) {

        painel.style.display = "none";

    }


    fecharFormularioProduto();

}


// =====================================================
// MOSTRAR FORMULÁRIO
// =====================================================

function mostrarFormularioProduto() {

    const formulario =
        document.getElementById(
            "form-produto"
        );


    if (!formulario) {
        return;
    }


    formulario.style.display = "block";


    setTimeout(() => {

        const campoNome =
            document.getElementById(
                "produto-nome"
            );


        if (campoNome) {

            campoNome.focus();

        }

    }, 100);

}


// =====================================================
// FECHAR FORMULÁRIO
// =====================================================

function fecharFormularioProduto() {

    const formulario =
        document.getElementById(
            "form-produto"
        );


    if (formulario) {

        formulario.style.display = "none";

    }


    const id =
        document.getElementById(
            "produto-id"
        );


    const categoria =
        document.getElementById(
            "produto-categoria"
        );


    const nome =
        document.getElementById(
            "produto-nome"
        );


    const descricao =
        document.getElementById(
            "produto-descricao"
        );


    const compra =
        document.getElementById(
            "produto-compra"
        );


    const venda =
        document.getElementById(
            "produto-venda"
        );


    const quantidade =
        document.getElementById(
            "produto-quantidade"
        );


    const minimo =
        document.getElementById(
            "produto-minimo"
        );


    const unidade =
        document.getElementById(
            "produto-unidade"
        );


    if (id) {
        id.value = "";
    }


    if (categoria) {
        categoria.value = "";
    }


    if (nome) {
        nome.value = "";
    }


    if (descricao) {
        descricao.value = "";
    }


    if (compra) {
        compra.value = "";
    }


    if (venda) {
        venda.value = "";
    }


    if (quantidade) {
        quantidade.value = "";
    }


    if (minimo) {
        minimo.value = "";
    }


    if (unidade) {
        unidade.value = "";
    }

}


// =====================================================
// CARREGAR CATEGORIAS NO SELECT
// =====================================================

async function carregarCategoriasProduto() {

    try {

        const resposta =
            await fetch(
                API + "/categorias/"
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " +
                resposta.status
            );

        }


        const categorias =
            await resposta.json();


        const select =
            document.getElementById(
                "produto-categoria"
            );


        if (!select) {
            return;
        }


        // Limpa o select
        select.innerHTML = "";


        // Opção inicial
        const opcaoInicial =
            document.createElement(
                "option"
            );


        opcaoInicial.value = "";

        opcaoInicial.textContent =
            "Selecione a categoria";


        select.appendChild(
            opcaoInicial
        );


        // Adiciona categorias
        categorias.forEach(c => {

            const option =
                document.createElement(
                    "option"
                );


            option.value = c.id;

            option.textContent =
                c.nome ?? "";


            select.appendChild(
                option
            );

        });


    }

    catch (error) {

        console.error(
            "Erro ao carregar categorias:",
            error
        );


        alert(
            "Erro ao carregar categorias."
        );

    }

}


// =====================================================
// CARREGAR PRODUTOS
// =====================================================

async function carregarProdutos() {

    try {

        const resposta =
            await fetch(
                API + "/produtos/"
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " +
                resposta.status
            );

        }


        const produtos =
            await resposta.json();


        // Guarda os produtos para edição
        produtosCache =
            Array.isArray(produtos)
                ? produtos
                : [];


        const tabela =
            document.getElementById(
                "lista-produtos"
            );


        if (!tabela) {
            return;
        }


        tabela.innerHTML = "";


        produtosCache.forEach(p => {

            const tr =
                document.createElement(
                    "tr"
                );


            // =================================================
            // ID
            // =================================================

            const tdId =
                document.createElement(
                    "td"
                );

            tdId.textContent =
                p.id ?? "";


            // =================================================
            // CATEGORIA
            // =================================================

            const tdCategoria =
                document.createElement(
                    "td"
                );

            tdCategoria.textContent =
                p.categoria_id ?? "";


            // =================================================
            // NOME
            // =================================================

            const tdNome =
                document.createElement(
                    "td"
                );

            tdNome.textContent =
                p.nome ?? "";


            // =================================================
            // DESCRIÇÃO
            // =================================================

            const tdDescricao =
                document.createElement(
                    "td"
                );

            tdDescricao.textContent =
                p.descricao ?? "";


            // =================================================
            // PREÇO COMPRA
            // =================================================

            const tdCompra =
                document.createElement(
                    "td"
                );

            tdCompra.textContent =
                Number(
                    p.preco_compra ?? 0
                ).toFixed(2) + " MT";


            // =================================================
            // PREÇO VENDA
            // =================================================

            const tdVenda =
                document.createElement(
                    "td"
                );

            tdVenda.textContent =
                Number(
                    p.preco_venda ?? 0
                ).toFixed(2) + " MT";


            // =================================================
            // QUANTIDADE
            // =================================================

            const tdQuantidade =
                document.createElement(
                    "td"
                );

            tdQuantidade.textContent =
                p.quantidade ?? 0;


            // =================================================
            // STOCK MÍNIMO
            // =================================================

            const tdMinimo =
                document.createElement(
                    "td"
                );

            tdMinimo.textContent =
                p.stock_minimo ?? 0;


            // =================================================
            // UNIDADE
            // =================================================

            const tdUnidade =
                document.createElement(
                    "td"
                );

            tdUnidade.textContent =
                p.unidade ?? "";


            // =================================================
            // ESTADO
            // =================================================

            const tdEstado =
                document.createElement(
                    "td"
                );


            if (p.ativo) {

                const badge =
                    document.createElement(
                        "span"
                    );

                badge.className =
                    "badge bg-success";

                badge.textContent =
                    "Ativo";

                tdEstado.appendChild(
                    badge
                );

            }

            else {

                const badge =
                    document.createElement(
                        "span"
                    );

                badge.className =
                    "badge bg-danger";

                badge.textContent =
                    "Inativo";

                tdEstado.appendChild(
                    badge
                );

            }


            // =================================================
            // DATA
            // =================================================

            const tdData =
                document.createElement(
                    "td"
                );


            if (p.criado_em) {

                const data =
                    new Date(
                        p.criado_em
                    );


                tdData.textContent =
                    data.toLocaleDateString(
                        "pt-PT"
                    );

            }

            else {

                tdData.textContent = "";

            }


            // =================================================
            // AÇÕES
            // =================================================

            const tdAcoes =
                document.createElement(
                    "td"
                );


            // -------------------------------------------------
            // BOTÃO EDITAR
            // -------------------------------------------------

            const btnEditar =
                document.createElement(
                    "button"
                );


            btnEditar.type =
                "button";


            btnEditar.className =
                "btn btn-warning btn-sm me-1";


            btnEditar.innerHTML =
                '<i class="bi bi-pencil"></i>';


            btnEditar.addEventListener(
                "click",
                function () {

                    editarProduto(
                        p.id
                    );

                }
            );


            // -------------------------------------------------
            // BOTÃO APAGAR
            // -------------------------------------------------

            const btnApagar =
                document.createElement(
                    "button"
                );


            btnApagar.type =
                "button";


            btnApagar.className =
                "btn btn-danger btn-sm";


            btnApagar.innerHTML =
                '<i class="bi bi-trash"></i>';


            btnApagar.addEventListener(
                "click",
                function () {

                    apagarProduto(
                        p.id
                    );

                }
            );


            // Adiciona botões
            tdAcoes.appendChild(
                btnEditar
            );


            tdAcoes.appendChild(
                btnApagar
            );


            // =================================================
            // MONTA A LINHA
            // =================================================

            tr.appendChild(tdId);

            tr.appendChild(tdCategoria);

            tr.appendChild(tdNome);

            tr.appendChild(tdDescricao);

            tr.appendChild(tdCompra);

            tr.appendChild(tdVenda);

            tr.appendChild(tdQuantidade);

            tr.appendChild(tdMinimo);

            tr.appendChild(tdUnidade);

            tr.appendChild(tdEstado);

            tr.appendChild(tdData);

            tr.appendChild(tdAcoes);


            tabela.appendChild(
                tr
            );

        });


    }

    catch (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );


        alert(
            "Erro ao carregar produtos."
        );

    }

}


// =====================================================
// EDITAR PRODUTO
// =====================================================

function editarProduto(id) {

    // Procura o produto no cache
    const produto =
        produtosCache.find(
            p =>
                String(p.id) ===
                String(id)
        );


    if (!produto) {

        console.error(
            "Produto não encontrado:",
            id
        );


        alert(
            "Não foi possível encontrar o produto."
        );


        return;

    }


    // =================================================
    // CAMPOS
    // =================================================

    const campoId =
        document.getElementById(
            "produto-id"
        );


    const campoCategoria =
        document.getElementById(
            "produto-categoria"
        );


    const campoNome =
        document.getElementById(
            "produto-nome"
        );


    const campoDescricao =
        document.getElementById(
            "produto-descricao"
        );


    const campoCompra =
        document.getElementById(
            "produto-compra"
        );


    const campoVenda =
        document.getElementById(
            "produto-venda"
        );


    const campoQuantidade =
        document.getElementById(
            "produto-quantidade"
        );


    const campoMinimo =
        document.getElementById(
            "produto-minimo"
        );


    const campoUnidade =
        document.getElementById(
            "produto-unidade"
        );


    // =================================================
    // PREENCHER CAMPOS
    // =================================================

    if (campoId) {

        campoId.value =
            produto.id ?? "";

    }


    if (campoCategoria) {

        campoCategoria.value =
            produto.categoria_id ?? "";

    }


    if (campoNome) {

        campoNome.value =
            produto.nome ?? "";

    }


    if (campoDescricao) {

        // IMPORTANTE:
        // Não usamos innerHTML.
        // O texto é colocado diretamente no value.

        campoDescricao.value =
            produto.descricao ?? "";

    }


    if (campoCompra) {

        campoCompra.value =
            produto.preco_compra ?? "";

    }


    if (campoVenda) {

        campoVenda.value =
            produto.preco_venda ?? "";

    }


    if (campoQuantidade) {

        campoQuantidade.value =
            produto.quantidade ?? "";

    }


    if (campoMinimo) {

        campoMinimo.value =
            produto.stock_minimo ?? "";

    }


    if (campoUnidade) {

        campoUnidade.value =
            produto.unidade ?? "";

    }


    // =================================================
    // MOSTRAR FORMULÁRIO
    // =================================================

    mostrarFormularioProduto();


    // =================================================
    // COLOCAR CURSOR NO FINAL DA DESCRIÇÃO
    // =================================================

    setTimeout(() => {

        if (campoDescricao) {

            campoDescricao.focus();


            const tamanho =
                campoDescricao.value.length;


            campoDescricao.setSelectionRange(
                tamanho,
                tamanho
            );

        }

    }, 100);

}


// =====================================================
// SALVAR PRODUTO
// =====================================================

async function salvarProduto() {

    const campoId =
        document.getElementById(
            "produto-id"
        );


    const campoCategoria =
        document.getElementById(
            "produto-categoria"
        );


    const campoNome =
        document.getElementById(
            "produto-nome"
        );


    const campoDescricao =
        document.getElementById(
            "produto-descricao"
        );


    const campoCompra =
        document.getElementById(
            "produto-compra"
        );


    const campoVenda =
        document.getElementById(
            "produto-venda"
        );


    const campoQuantidade =
        document.getElementById(
            "produto-quantidade"
        );


    const campoMinimo =
        document.getElementById(
            "produto-minimo"
        );


    const campoUnidade =
        document.getElementById(
            "produto-unidade"
        );


    const id =
        campoId
            ? campoId.value.trim()
            : "";


    const categoria_id =
        campoCategoria
            ? Number(
                campoCategoria.value
              )
            : 0;


    const nome =
        campoNome
            ? campoNome.value.trim()
            : "";


    const descricao =
        campoDescricao
            ? campoDescricao.value
            : "";


    const preco_compra =
        campoCompra
            ? campoCompra.value
            : "";


    const preco_venda =
        campoVenda
            ? campoVenda.value
            : "";


    const quantidade =
        campoQuantidade
            ? Number(
                campoQuantidade.value
              )
            : 0;


    const stock_minimo =
        campoMinimo
            ? Number(
                campoMinimo.value
              )
            : 0;


    const unidade =
        campoUnidade
            ? campoUnidade.value.trim()
            : "";


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if (!categoria_id) {

        alert(
            "Selecione uma categoria."
        );


        if (campoCategoria) {
            campoCategoria.focus();
        }


        return;

    }


    if (!nome) {

        alert(
            "Digite o nome do produto."
        );


        if (campoNome) {
            campoNome.focus();
        }


        return;

    }


    // =================================================
    // DADOS
    // =================================================

    const dados = {

        categoria_id:
            categoria_id,

        nome:
            nome,

        descricao:
            descricao,

        preco_compra:
            preco_compra,

        preco_venda:
            preco_venda,

        quantidade:
            quantidade,

        stock_minimo:
            stock_minimo,

        unidade:
            unidade

    };


    let url;

    let metodo;


    // =================================================
    // ATUALIZAR
    // =================================================

    if (id) {

        url =
            API +
            "/produtos/" +
            id;


        metodo =
            "PUT";

    }


    // =================================================
    // CRIAR
    // =================================================

    else {

        url =
            API +
            "/produtos/";


        metodo =
            "POST";

    }


    try {

        const resposta =
            await fetch(
                url,
                {

                    method:
                        metodo,

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            dados
                        )

                }
            );


        let resultado = {};


        try {

            resultado =
                await resposta.json();

        }

        catch {

            resultado = {};

        }


        // =================================================
        // SUCESSO
        // =================================================

        if (resposta.ok) {

            alert(

                id

                    ? "Produto atualizado com sucesso."

                    : "Produto cadastrado com sucesso."

            );


            fecharFormularioProduto();


            await carregarProdutos();


        }


        // =================================================
        // ERRO
        // =================================================

        else {

            console.error(
                "Erro da API:",
                resultado
            );


            alert(

                resultado.detail ||

                resultado.message ||

                "Erro ao salvar produto."

            );

        }

    }

    catch (error) {

        console.error(
            "Erro de conexão:",
            error
        );


        alert(
            "Erro de conexão com o servidor."
        );

    }

}


// =====================================================
// APAGAR PRODUTO
// =====================================================

async function apagarProduto(id) {

    try {

        const resposta =
            await fetch(

                API +
                "/produtos/" +
                id,

                {

                    method:
                        "DELETE"

                }

            );


        let resultado = {};


        try {

            resultado =
                await resposta.json();

        }

        catch {

            resultado = {};

        }


        if (resposta.ok) {

            // Sem confirm()
            // Sem pergunta antes de apagar

            await carregarProdutos();


            return;

        }


        console.error(
            "Erro ao apagar produto:",
            resultado
        );


        alert(

            resultado.detail ||

            resultado.message ||

            "Erro ao apagar produto."

        );


    }

    catch (error) {

        console.error(
            "Erro ao apagar produto:",
            error
        );


        alert(
            "Erro de conexão com o servidor."
        );

    }

}