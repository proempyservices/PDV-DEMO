// =====================================================
// CATEGORIAS
// =====================================================

// Guarda as categorias carregadas
let categoriasCache = [];


// =====================================================
// ABRIR CATEGORIAS
// =====================================================

async function abrirCategorias() {

    const painel = document.getElementById("categorias-panel");

    if (!painel) {
        console.error("Elemento categorias-panel não encontrado.");
        return;
    }

    painel.style.display = "flex";

    await carregarCategorias();
}


// =====================================================
// FECHAR CATEGORIAS
// =====================================================

function fecharCategorias() {

    const painel = document.getElementById("categorias-panel");

    if (painel) {
        painel.style.display = "none";
    }

    fecharFormularioCategoria();
}


// =====================================================
// MOSTRAR FORMULÁRIO
// =====================================================

function mostrarFormularioCategoria() {

    const formulario =
        document.getElementById("form-categoria");

    if (!formulario) {
        return;
    }

    formulario.style.display = "block";

    // Coloca o cursor no campo nome
    setTimeout(() => {

        const campoNome =
            document.getElementById("categoria-nome");

        if (campoNome) {
            campoNome.focus();
        }

    }, 100);
}


// =====================================================
// FECHAR FORMULÁRIO
// =====================================================

function fecharFormularioCategoria() {

    const formulario =
        document.getElementById("form-categoria");

    if (formulario) {
        formulario.style.display = "none";
    }


    const id =
        document.getElementById("categoria-id");

    const nome =
        document.getElementById("categoria-nome");

    const descricao =
        document.getElementById("categoria-descricao");


    if (id) {
        id.value = "";
    }

    if (nome) {
        nome.value = "";
    }

    if (descricao) {
        descricao.value = "";
    }
}


// =====================================================
// CARREGAR CATEGORIAS
// =====================================================

async function carregarCategorias() {

    try {

        const resposta = await fetch(
            API + "/categorias/"
        );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " + resposta.status
            );

        }


        const categorias =
            await resposta.json();


        // Guarda os dados para edição
        categoriasCache = Array.isArray(categorias)
            ? categorias
            : [];


        const tabela =
            document.getElementById(
                "lista-categorias"
            );


        if (!tabela) {
            return;
        }


        tabela.innerHTML = "";


        categoriasCache.forEach(c => {

            const tr =
                document.createElement("tr");


            // -------------------------------------------------
            // NOME
            // -------------------------------------------------

            const tdNome =
                document.createElement("td");

            tdNome.textContent =
                c.nome ?? "";


            // -------------------------------------------------
            // DESCRIÇÃO
            // -------------------------------------------------

            const tdDescricao =
                document.createElement("td");

            tdDescricao.textContent =
                c.descricao ?? "";


            // -------------------------------------------------
            // AÇÕES
            // -------------------------------------------------

            const tdAcoes =
                document.createElement("td");


            // BOTÃO EDITAR

            const btnEditar =
                document.createElement("button");

            btnEditar.className =
                "btn btn-warning btn-sm me-1";

            btnEditar.type = "button";

            btnEditar.innerHTML =
                '<i class="bi bi-pencil"></i>';


            btnEditar.addEventListener(
                "click",
                function () {

                    editarCategoria(c.id);

                }
            );


            // BOTÃO APAGAR

            const btnApagar =
                document.createElement("button");

            btnApagar.className =
                "btn btn-danger btn-sm";

            btnApagar.type = "button";

            btnApagar.innerHTML =
                '<i class="bi bi-trash"></i>';


            btnApagar.addEventListener(
                "click",
                function () {

                    apagarCategoria(c.id);

                }
            );


            // Adiciona os botões

            tdAcoes.appendChild(btnEditar);

            tdAcoes.appendChild(btnApagar);


            // Monta a linha

            tr.appendChild(tdNome);

            tr.appendChild(tdDescricao);

            tr.appendChild(tdAcoes);


            tabela.appendChild(tr);

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
// EDITAR CATEGORIA
// =====================================================

function editarCategoria(id) {

    // Procura a categoria pelo ID
    const categoria =
        categoriasCache.find(
            c => String(c.id) === String(id)
        );


    if (!categoria) {

        console.error(
            "Categoria não encontrada:",
            id
        );

        alert(
            "Não foi possível encontrar a categoria."
        );

        return;

    }


    // -------------------------------------------------
    // ID
    // -------------------------------------------------

    const campoId =
        document.getElementById(
            "categoria-id"
        );


    // -------------------------------------------------
    // NOME
    // -------------------------------------------------

    const campoNome =
        document.getElementById(
            "categoria-nome"
        );


    // -------------------------------------------------
    // DESCRIÇÃO
    // -------------------------------------------------

    const campoDescricao =
        document.getElementById(
            "categoria-descricao"
        );


    if (campoId) {

        campoId.value =
            categoria.id ?? "";

    }


    if (campoNome) {

        campoNome.value =
            categoria.nome ?? "";

    }


    if (campoDescricao) {

        // IMPORTANTE:
        // value recebe diretamente o texto existente.
        // Não usamos innerHTML nem colocamos o texto
        // dentro do textarea.

        campoDescricao.value =
            categoria.descricao ?? "";

    }


    // Abre o formulário

    mostrarFormularioCategoria();


    // Coloca o cursor no final da descrição
    // para poder continuar escrevendo sem apagar o texto.

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
// SALVAR CATEGORIA
// =====================================================

async function salvarCategoria() {

    const campoId =
        document.getElementById(
            "categoria-id"
        );


    const campoNome =
        document.getElementById(
            "categoria-nome"
        );


    const campoDescricao =
        document.getElementById(
            "categoria-descricao"
        );


    const id =
        campoId
            ? campoId.value.trim()
            : "";


    const nome =
        campoNome
            ? campoNome.value.trim()
            : "";


    const descricao =
        campoDescricao
            ? campoDescricao.value
            : "";


    // -------------------------------------------------
    // VALIDAÇÃO
    // -------------------------------------------------

    if (!nome) {

        alert(
            "Digite o nome da categoria."
        );

        if (campoNome) {
            campoNome.focus();
        }

        return;

    }


    const dados = {

        nome: nome,

        descricao: descricao

    };


    let url;

    let metodo;


    // -------------------------------------------------
    // ATUALIZAR
    // -------------------------------------------------

    if (id) {

        url =
            API +
            "/categorias/" +
            id;

        metodo = "PUT";

    }


    // -------------------------------------------------
    // CRIAR
    // -------------------------------------------------

    else {

        url =
            API +
            "/categorias/";

        metodo = "POST";

    }


    try {

        const resposta =
            await fetch(
                url,
                {

                    method: metodo,

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(dados)

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


        // -------------------------------------------------
        // SUCESSO
        // -------------------------------------------------

        if (resposta.ok) {

            alert(

                id

                    ? "Categoria atualizada com sucesso."

                    : "Categoria criada com sucesso."

            );


            fecharFormularioCategoria();


            await carregarCategorias();


        }


        // -------------------------------------------------
        // ERRO
        // -------------------------------------------------

        else {

            console.error(
                "Erro da API:",
                resultado
            );


            alert(

                resultado.detail ||

                resultado.message ||

                "Erro ao salvar categoria."

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
// APAGAR CATEGORIA
// =====================================================

async function apagarCategoria(id) {

    try {

        const resposta =
            await fetch(

                API +
                "/categorias/" +
                id,

                {
                    method: "DELETE"
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

            alert(
                "Categoria apagada com sucesso."
            );


            await carregarCategorias();

        }

        else {

            console.error(
                "Erro ao apagar:",
                resultado
            );


            alert(

                resultado.detail ||

                resultado.message ||

                "Erro ao apagar categoria."

            );

        }


    }

    catch (error) {

        console.error(
            "Erro ao apagar categoria:",
            error
        );


        alert(
            "Erro de conexão com o servidor."
        );

    }

}