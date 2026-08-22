// historico.js


// =====================================================
// ARRAYS GLOBAIS DO HISTÓRICO
// =====================================================

// Histórico normal de vendas
let vendasHistorico = [];


// Histórico de levantamentos
let levantamentosHistorico = [];


// =====================================================
// OBTER USUÁRIO LOGADO
// =====================================================

function obterUsuarioLogado(){

    try{

        const usuario =
            JSON.parse(
                localStorage.getItem("usuario")
            );

        console.log(
            "USUÁRIO ENCONTRADO NO LOCALSTORAGE:",
            usuario
        );

        return usuario;

    }

    catch(error){

        console.error(
            "Erro ao obter usuário:",
            error
        );

        return null;

    }

}


// =====================================================
// OBTER ID DO USUÁRIO LOGADO
// =====================================================
//
// Esta função tenta encontrar o ID do usuário
// em diferentes nomes.
//
// Normalmente será:
//
// usuario.id
//
// Mas caso seu login esteja guardando:
//
// usuario.usuario_id
//
// também funcionará.
//
// =====================================================

function obterIdUsuarioLogado(){

    const usuario =
        obterUsuarioLogado();


    if(!usuario){

        console.error(
            "Nenhum usuário encontrado no localStorage."
        );

        return null;

    }


    const idUsuario =
        usuario.id ||
        usuario.usuario_id ||
        usuario.user_id;


    console.log(
        "ID DO USUÁRIO LOGADO:",
        idUsuario
    );


    return idUsuario || null;

}


// =====================================================
// ABRIR HISTÓRICO DE VENDAS
// =====================================================

async function abrirHistoricoVendas(){

    try{

        // =================================================
        // ABRIR PAINEL
        // =================================================

        const painel =
            document.getElementById(
                "historico-panel"
            );


        if(painel){

            painel.style.display =
                "flex";

        }


        // =================================================
        // BUSCAR VENDAS
        // =================================================

        const resposta =
            await fetch(
                "/vendas/"
            );


        if(!resposta.ok){

            throw new Error(
                "Erro ao buscar vendas"
            );

        }


        // =================================================
        // RECEBER VENDAS
        // =================================================

        vendasHistorico =
            await resposta.json();


        console.log(
            "VENDAS CARREGADAS:",
            vendasHistorico
        );


        // =================================================
        // BUSCAR LEVANTAMENTOS
        // =================================================
        //
        // Esta chamada é separada das vendas.
        //
        // Primeiro buscamos vendas.
        //
        // Depois buscamos levantamentos.
        //
        // Depois juntamos os dois na mesma tabela.
        //
        // =================================================

        await buscarHistoricoLevantamentos();


        // =================================================
        // MOSTRAR TODO O HISTÓRICO
        // =================================================

        renderizarHistoricoCompleto();


        // =================================================
        // CONFIGURAR FILTRO
        // =================================================

        configurarFiltroHistorico();

    }

    catch(error){

        console.error(
            "ERRO AO ABRIR HISTÓRICO:",
            error
        );


        alert(
            "Erro ao carregar histórico."
        );

    }

}


// =====================================================
// BUSCAR HISTÓRICO DE LEVANTAMENTOS
// =====================================================
//
// Endpoint usado:
//
// GET
// /vendas/lucro-saque/historico?usuario_id=1
//
// O backend já está funcionando.
//
// Aqui apenas buscamos os dados.
//
// =====================================================

async function buscarHistoricoLevantamentos(){

    try{

        // =================================================
        // OBTER ID DO USUÁRIO
        // =================================================

        const usuarioId =
            obterIdUsuarioLogado();


        // =================================================
        // VERIFICAR ID
        // =================================================

        if(!usuarioId){

            console.error(
                "NÃO FOI POSSÍVEL ENCONTRAR O ID DO USUÁRIO."
            );


            levantamentosHistorico = [];


            return;

        }


        // =================================================
        // CRIAR URL
        // =================================================

        const url =
            `/vendas/lucro-saque/historico?usuario_id=${usuarioId}`;


        console.log(
            "BUSCANDO LEVANTAMENTOS:",
            url
        );


        // =================================================
        // FAZER REQUISIÇÃO
        // =================================================

        const resposta =
            await fetch(
                url
            );


        // =================================================
        // MOSTRAR STATUS
        // =================================================

        console.log(
            "STATUS DOS LEVANTAMENTOS:",
            resposta.status
        );


        // =================================================
        // VERIFICAR RESPOSTA
        // =================================================

        if(!resposta.ok){

            const erro =
                await resposta.text();


            console.error(
                "ERRO DO BACKEND AO BUSCAR LEVANTAMENTOS:",
                erro
            );


            levantamentosHistorico = [];


            return;

        }


        // =================================================
        // RECEBER JSON
        // =================================================

        levantamentosHistorico =
            await resposta.json();


        // =================================================
        // GARANTIR ARRAY
        // =================================================

        if(
            !Array.isArray(
                levantamentosHistorico
            )
        ){

            console.error(
                "Resposta dos levantamentos não é um array:",
                levantamentosHistorico
            );


            levantamentosHistorico = [];


            return;

        }


        // =================================================
        // MOSTRAR NO CONSOLE
        // =================================================

        console.log(
            "LEVANTAMENTOS CARREGADOS:",
            levantamentosHistorico
        );


        console.log(
            "QUANTIDADE DE LEVANTAMENTOS:",
            levantamentosHistorico.length
        );


    }

    catch(error){

        console.error(
            "ERRO AO BUSCAR HISTÓRICO DE LEVANTAMENTOS:",
            error
        );


        // =================================================
        // IMPORTANTE
        // =================================================
        //
        // Se o levantamento der erro,
        // não vamos impedir o histórico de vendas.
        //
        // =================================================

        levantamentosHistorico = [];

    }

}


// =====================================================
// OBTER DATA DE QUALQUER REGISTRO
// =====================================================

function obterData(item){

    if(!item){

        return null;

    }


    return (

        item.data ||

        item.data_criacao ||

        item.created_at ||

        item.data_venda ||

        item.data_levantamento ||

        null

    );

}


// =====================================================
// FORMATAR DATA
// =====================================================

function formatarData(data){

    if(!data){

        return "Não informada";

    }


    try{

        const resultado =
            new Date(
                data
            );


        if(
            isNaN(
                resultado.getTime()
            )
        ){

            return "Não informada";

        }


        return resultado.toLocaleString(
            "pt-PT"
        );

    }

    catch(error){

        console.error(
            "Erro ao formatar data:",
            error
        );


        return "Não informada";

    }

}


// =====================================================
// CONFIGURAR FILTRO DO HISTÓRICO
// =====================================================

function configurarFiltroHistorico(){

    const filtro =
        document.getElementById(
            "filtro-historico-vendas"
        );


    if(!filtro){

        console.warn(
            "Campo #filtro-historico-vendas não encontrado."
        );


        return;

    }


    // =================================================
    // EVITAR EVENTOS DUPLICADOS
    // =================================================

    filtro.oninput =
        function(){

            const texto =
                this.value
                    .toLowerCase()
                    .trim();


            // =============================================
            // SE ESTIVER VAZIO
            // =============================================

            if(!texto){

                renderizarHistoricoCompleto();


                return;

            }


            // =============================================
            // JUNTAR VENDAS + LEVANTAMENTOS
            // =============================================

            const historico = [

                ...vendasHistorico,

                ...levantamentosHistorico

            ];


            // =============================================
            // FILTRAR
            // =============================================

            const resultados =
                historico.filter(
                    function(item){

                        // =================================
                        // DATA
                        // =================================

                        const data =
                            formatarData(
                                obterData(item)
                            );


                        // =================================
                        // TIPO
                        // =================================

                        const tipo =
                            item.tipo ||
                            "";


                        // =================================
                        // CONTEÚDO PESQUISÁVEL
                        // =================================

                        const conteudo = `

                            ${item.id ?? ""}

                            ${item.total ?? ""}

                            ${item.valor ?? ""}

                            ${item.valor_entregue ?? ""}

                            ${item.troco ?? ""}

                            ${item.usuario_id ?? ""}

                            ${tipo}

                            ${data}

                            venda

                            levantamento

                            levantado

                        `
                        .toLowerCase();


                        return conteudo.includes(
                            texto
                        );

                    }
                );


            // =============================================
            // MOSTRAR RESULTADOS
            // =============================================

            renderizarHistoricoLista(
                resultados
            );

        };

}


// =====================================================
// RENDERIZAR HISTÓRICO COMPLETO
// =====================================================
//
// Junta:
//
// VENDAS
//
// +
//
// LEVANTAMENTOS
//
// =====================================================

function renderizarHistoricoCompleto(){

    // =================================================
    // JUNTAR OS HISTÓRICOS
    // =================================================

    const historico = [

        ...vendasHistorico,

        ...levantamentosHistorico

    ];


    console.log(
        "HISTÓRICO COMPLETO:",
        historico
    );


    // =================================================
    // ORDENAR POR DATA
    // MAIS RECENTE PRIMEIRO
    // =================================================

    historico.sort(
        function(a, b){

            const dataA =
                obterData(a);


            const dataB =
                obterData(b);


            const tempoA =
                dataA
                ? new Date(
                    dataA
                ).getTime()
                : 0;


            const tempoB =
                dataB
                ? new Date(
                    dataB
                ).getTime()
                : 0;


            return tempoB - tempoA;

        }
    );


    // =================================================
    // RENDERIZAR
    // =================================================

    renderizarHistoricoLista(
        historico
    );

}


// =====================================================
// RENDERIZAR LISTA DO HISTÓRICO
// =====================================================
//
// Esta função coloca vendas e levantamentos
// na mesma tabela.
//
// =====================================================

function renderizarHistoricoLista(
    historico
){

    // =================================================
    // PEGAR TABELA
    // =================================================

    const tabela =
        document.getElementById(
            "lista-historico-vendas"
        );


    // =================================================
    // VERIFICAR TABELA
    // =================================================

    if(!tabela){

        console.error(
            "Elemento #lista-historico-vendas não encontrado."
        );


        return;

    }


    // =================================================
    // LIMPAR TABELA
    // =================================================

    tabela.innerHTML = "";


    // =================================================
    // VERIFICAR HISTÓRICO VAZIO
    // =================================================

    if(
        !historico ||
        historico.length === 0
    ){

        tabela.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:20px;
                        color:#777;
                    "
                >

                    Nenhum histórico encontrado.

                </td>

            </tr>

        `;


        return;

    }


    // =================================================
    // PERCORRER REGISTROS
    // =================================================

    historico.forEach(
        function(item){

            // =============================================
            // DATA
            // =============================================

            const data =
                formatarData(
                    obterData(item)
                );


            // =============================================
            // TIPO
            // =============================================

            const tipo =
                String(
                    item.tipo || ""
                )
                .trim()
                .toLowerCase();


            // =============================================
            // VERIFICAR LEVANTAMENTO
            // =============================================

            const ehLevantamento =
                tipo === "levantamento";


            // =============================================
            // MOSTRAR LEVANTAMENTO
            // =============================================

            if(ehLevantamento){

                console.log(
                    "RENDERIZANDO LEVANTAMENTO:",
                    item
                );


                tabela.innerHTML += `

                    <tr>

                        <!-- =================================
                             TIPO
                        ================================== -->

                        <td>

                            <span
                                style="
                                    color:#dc3545;
                                    font-weight:bold;
                                "
                            >

                                💰 Levantamento

                            </span>

                        </td>


                        <!-- =================================
                             ID
                        ================================== -->

                        <td>

                            ${item.id ?? ""}

                        </td>


                        <!-- =================================
                             VALOR
                        ================================== -->

                        <td>

                            ${Number(
                                item.valor ?? 0
                            ).toFixed(2)}

                            MT

                        </td>


                        <!-- =================================
                             PAGO
                        ================================== -->

                        <td>

                            -

                        </td>


                        <!-- =================================
                             DATA
                        ================================== -->

                        <td>

                            ${data}

                        </td>


                        <!-- =================================
                             AÇÃO
                        ================================== -->

                        <td>

                            <span
                                style="
                                    color:#dc3545;
                                    font-weight:bold;
                                "
                            >

                                Levantado

                            </span>

                        </td>

                    </tr>

                `;


                return;

            }


            // =============================================
            // MOSTRAR VENDA
            // =============================================

            tabela.innerHTML += `

                <tr>

                    <!-- =================================
                         TIPO
                    ================================== -->

                    <td>

                        <span
                            style="
                                color:#198754;
                                font-weight:bold;
                            "
                        >

                            🧾 Venda

                        </span>

                    </td>


                    <!-- =================================
                         ID
                    ================================== -->

                    <td>

                        ${item.id ?? ""}

                    </td>


                    <!-- =================================
                         TOTAL
                    ================================== -->

                    <td>

                        ${Number(
                            item.total ?? 0
                        ).toFixed(2)}

                        MT

                    </td>


                    <!-- =================================
                         PAGO
                    ================================== -->

                    <td>

                        ${
                            item.valor_entregue != null

                            ?

                            Number(
                                item.valor_entregue
                            ).toFixed(2) +
                            " MT"

                            :

                            "-"
                        }

                    </td>


                    <!-- =================================
                         DATA
                    ================================== -->

                    <td>

                        ${data}

                    </td>


                    <!-- =================================
                         RECIBO
                    ================================== -->

                    <td>

                        <button
                            class="btn btn-success"
                            onclick="
                                gerarReciboVenda(
                                    ${item.id}
                                )
                            "
                        >

                            <i
                                class="bi bi-receipt"
                            ></i>

                            Recibo

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    console.log(
        "HISTÓRICO RENDERIZADO COM SUCESSO."
    );

}


// =====================================================
// COMPATIBILIDADE COM FUNÇÃO ANTIGA
// =====================================================
//
// Mantém:
//
// renderizarHistoricoVendas(vendas)
//
// funcionando.
//
// =====================================================

function renderizarHistoricoVendas(
    vendas
){

    renderizarHistoricoLista(
        vendas
    );

}


// =====================================================
// FECHAR HISTÓRICO
// =====================================================

function fecharHistoricoVendas(){

    const painel =
        document.getElementById(
            "historico-panel"
        );


    if(painel){

        painel.style.display =
            "none";

    }

}


// =====================================================
// GERAR RECIBO DA VENDA
// =====================================================

async function gerarReciboVenda(
    idVenda
){

    try{

        // =================================================
        // BUSCAR VENDA
        // =================================================

        const resposta =
            await fetch(
                `/vendas/${idVenda}`
            );


        if(!resposta.ok){

            throw new Error(
                "Erro ao buscar venda"
            );

        }


        // =================================================
        // RECEBER VENDA
        // =================================================

        const venda =
            await resposta.json();


        console.log(
            "VENDA DO RECIBO:",
            venda
        );


        // =================================================
        // VERIFICAR ITENS
        // =================================================

        if(
            !venda.itens ||
            venda.itens.length === 0
        ){

            alert(
                "Venda não possui itens"
            );


            return;

        }


        // =================================================
        // VERIFICAR jsPDF
        // =================================================

        if(!window.jspdf){

            alert(
                "Biblioteca jsPDF não encontrada."
            );


            return;

        }


        // =================================================
        // CRIAR PDF
        // =================================================

        const { jsPDF } =
            window.jspdf;


        const pdf =
            new jsPDF({

                orientation:
                    "portrait",

                unit:
                    "mm",

                format:
                    "a4",

                compress:
                    true

            });


        // =================================================
        // CONFIGURAÇÕES
        // =================================================

        const centro =
            105;


        const margemEsquerda =
            20;


        const margemDireita =
            190;


        let y =
            20;


        // =================================================
        // DATA
        // =================================================

        const dataVenda =
            formatarData(
                obterData(venda)
            );


        // =================================================
        // CABEÇALHO
        // =================================================

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            18
        );


        pdf.text(
            "ProemPy Services",
            centro,
            y,
            {
                align:
                    "center"
            }
        );


        y += 7;


        // =================================================
        // NÚMERO
        // =================================================

        pdf.setFontSize(
            11
        );


        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.text(
            "RECIBO DE VENDA Nº " +
            venda.id,
            centro,
            y,
            {
                align:
                    "center"
            }
        );


        y += 6;


        // =================================================
        // DATA VENDA
        // =================================================

        pdf.setFontSize(
            8
        );


        pdf.text(
            "Data da Venda: " +
            dataVenda,
            centro,
            y,
            {
                align:
                    "center"
            }
        );


        y += 5;


        // =================================================
        // DATA EMISSÃO
        // =================================================

        pdf.text(
            "Data de Emissão: " +
            new Date()
                .toLocaleString(
                    "pt-PT"
                ),
            centro,
            y,
            {
                align:
                    "center"
            }
        );


        y += 6;


        // =================================================
        // LINHA
        // =================================================

        pdf.line(
            margemEsquerda,
            y,
            margemDireita,
            y
        );


        y += 6;


        // =================================================
        // CABEÇALHO TABELA PDF
        // =================================================

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            9
        );


        pdf.text(
            "Produto",
            25,
            y
        );


        pdf.text(
            "Qtd",
            125,
            y,
            {
                align:
                    "center"
            }
        );


        pdf.text(
            "Valor",
            175,
            y,
            {
                align:
                    "right"
            }
        );


        y += 5;


        // =================================================
        // PRODUTOS
        // =================================================

        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            8
        );


        let totalCalculado =
            0;


        venda.itens.forEach(
            function(item){

                let nome =
                    "Produto";


                if(
                    item.produto
                ){

                    nome =
                        String(
                            item.produto.nome
                        );

                }


                const quantidade =
                    Number(
                        item.quantidade || 0
                    );


                const preco =
                    Number(
                        item.preco_unitario || 0
                    );


                const subtotal =
                    preco *
                    quantidade;


                totalCalculado +=
                    subtotal;


                // =========================================
                // LIMITAR TAMANHO DO NOME
                // =========================================

                if(
                    nome.length > 55
                ){

                    nome =
                        nome.substring(
                            0,
                            52
                        ) +
                        "...";

                }


                pdf.text(
                    nome,
                    25,
                    y
                );


                pdf.text(
                    String(
                        quantidade
                    ),
                    125,
                    y,
                    {
                        align:
                            "center"
                    }
                );


                pdf.text(
                    subtotal.toFixed(2) +
                    " MT",
                    175,
                    y,
                    {
                        align:
                            "right"
                    }
                );


                y +=
                    4.5;

            }
        );


        // =================================================
        // TOTAL
        // =================================================

        y += 3;


        pdf.line(
            margemEsquerda,
            y,
            margemDireita,
            y
        );


        y += 7;


        const total =
            Number(
                venda.total ??
                totalCalculado
            );


        const pago =
            Number(
                venda.valor_entregue ||
                0
            );


        const troco =
            Number(
                venda.troco ??
                Math.max(
                    0,
                    pago - total
                )
            );


        // =================================================
        // TOTAL
        // =================================================

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            10
        );


        pdf.text(
            "Total: " +
            total.toFixed(2) +
            " MT",
            25,
            y
        );


        y += 5;


        // =================================================
        // PAGO
        // =================================================

        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            9
        );


        pdf.text(
            "Pago: " +
            pago.toFixed(2) +
            " MT",
            25,
            y
        );


        y += 5;


        // =================================================
        // TROCO
        // =================================================

        pdf.text(
            "Troco: " +
            troco.toFixed(2) +
            " MT",
            25,
            y
        );


        // =================================================
        // AGRADECIMENTO
        // =================================================

        y += 9;


        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            9
        );


        pdf.text(
            "Obrigado pela preferência!",
            centro,
            y,
            {
                align:
                    "center"
            }
        );

        y += 5;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.setFontSize(
            8
        );

        pdf.text(
            "ProemPy Services Demo. Contactos: 863614176/850320411",
            centro,
            y,
            {
                align:
                    "center"
            }
        );


        // =================================================
        // SALVAR PDF
        // =================================================

        pdf.save(
            "recibo-historico-venda-" +
            venda.id +
            ".pdf"
        );

    }

    catch(error){

        console.error(
            "ERRO AO GERAR RECIBO:",
            error
        );


        alert(
            "Erro ao gerar recibo"
        );

    }

}


// =====================================================
// MOSTRAR HISTÓRICO
// =====================================================

function mostrarHistorico(
    valor
){

    const menuHistorico =
        document.getElementById(
            "menu-historico"
        );


    if(menuHistorico){

        menuHistorico.style.display =
            valor
            ? "flex"
            : "none";

    }

}


// =====================================================
// FORÇAR HISTÓRICO VISÍVEL PARA USUÁRIO LOGADO
// =====================================================

function forcarHistoricoVisivel(){

    try{

        const usuario =
            JSON.parse(
                localStorage.getItem(
                    "usuario"
                )
            );


        // =================================================
        // SE NÃO ESTÁ LOGADO
        // =================================================

        if(!usuario){

            return;

        }


        // =================================================
        // PEGAR MENU
        // =================================================

        const menuHistorico =
            document.getElementById(
                "menu-historico"
            );


        if(!menuHistorico){

            return;

        }


        // =================================================
        // FORÇAR BOTÃO VISÍVEL
        // =================================================

        menuHistorico.style.setProperty(
            "display",
            "flex",
            "important"
        );

    }

    catch(error){

        console.error(
            "Erro ao restaurar Histórico:",
            error
        );

    }

}


// =====================================================
// INICIALIZAR DEPOIS QUE O HTML ESTIVER CARREGADO
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    function(){


        // =================================================
        // MOSTRAR HISTÓRICO IMEDIATAMENTE
        // =================================================

        forcarHistoricoVisivel();


        // =================================================
        // OBSERVAR ALTERAÇÕES NO SIDEBAR
        // =================================================

        const observadorHistorico =
            new MutationObserver(
                function(){

                    forcarHistoricoVisivel();

                }
            );


        observadorHistorico.observe(
            document.documentElement,
            {

                childList:
                    true,

                subtree:
                    true,

                attributes:
                    true,

                attributeFilter:
                    [
                        "style",
                        "class"
                    ]

            }
        );


        // =================================================
        // GARANTIA EXTRA
        // =================================================

        setInterval(
            function(){

                forcarHistoricoVisivel();

            },
            500
        );

    }
);