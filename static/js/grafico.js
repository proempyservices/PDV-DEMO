// =====================================================
// GRAFICO.JS
// RESUMO DE VENDAS DO DASHBOARD
// =====================================================

console.log("=====================================");
console.log(" GRAFICO.JS FOI CARREGADO");
console.log("=====================================");


// =====================================================
// VARIÁVEIS
// =====================================================

let graficoVendas = null;

let graficoInicializado = false;


// =====================================================
// OBTER USUÁRIO
// =====================================================

function obterUsuarioGrafico(){

    try{

        if(
            typeof obterUsuarioDashboard ===
            "function"
        ){

            const usuario =
                obterUsuarioDashboard();

            if(usuario){
                return usuario;
            }

        }

    }
    catch(error){

        console.warn(
            "Erro ao obter usuário pelo dashboard:",
            error
        );

    }


    // =================================================
    // LOCALSTORAGE
    // =================================================

    try{

        const storage =
            localStorage.getItem(
                "usuario"
            );

        if(!storage){
            return null;
        }

        return JSON.parse(
            storage
        );

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
// FORMATAR VALOR
// =====================================================

function formatarValorGrafico(
    valor
){

    const numero =
        Number(
            valor || 0
        );


    return numero.toLocaleString(
        "pt-MZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " MT";

}


// =====================================================
// ATUALIZAR RESUMO
// =====================================================

function atualizarResumoGrafico(
    dados
){

    if(!dados){
        return;
    }


    // =================================================
    // TOTAL DE VENDAS
    // =================================================

    const total =
        document.getElementById(
            "grafico-total-vendas"
        );


    // =================================================
    // TICKET MÉDIO
    // =================================================

    const ticket =
        document.getElementById(
            "grafico-ticket-medio"
        );


    // =================================================
    // NÚMERO DE VENDAS
    // =================================================

    const numero =
        document.getElementById(
            "grafico-numero-vendas"
        );


    // =================================================
    // TOTAL
    // =================================================

    if(total){

        const valorTotal =
            dados.total_vendas ??
            dados.receita ??
            dados.total ??
            0;

        total.textContent =
            formatarValorGrafico(
                valorTotal
            );

    }


    // =================================================
    // TICKET MÉDIO
    // =================================================

    if(ticket){

        let valorTicket =
            dados.ticket_medio;


        // Caso o backend não envie ticket_medio,
        // calculamos automaticamente.

        if(
            valorTicket === undefined ||
            valorTicket === null
        ){

            const totalCalculado =
                Number(
                    dados.total_vendas ??
                    dados.receita ??
                    dados.total ??
                    0
                );


            const quantidade =
                Number(
                    dados.quantidade_vendas ??
                    dados.numero_vendas ??
                    dados.total_vendas_quantidade ??
                    0
                );


            valorTicket =
                quantidade > 0
                    ? totalCalculado / quantidade
                    : 0;

        }


        ticket.textContent =
            formatarValorGrafico(
                valorTicket
            );

    }


    // =================================================
    // NÚMERO DE VENDAS
    // =================================================

    if(numero){

        const quantidade =
            Number(
                dados.quantidade_vendas ??
                dados.numero_vendas ??
                dados.total_vendas_quantidade ??
                0
            );


        numero.textContent =
            quantidade.toLocaleString(
                "pt-MZ"
            );

    }

}


// =====================================================
// OBTER LABELS
// =====================================================

function obterLabelsGrafico(
    dados
){

    if(
        Array.isArray(
            dados.labels
        )
    ){

        return dados.labels;

    }


    if(
        Array.isArray(
            dados.dados
        )
    ){

        return dados.dados.map(
            item =>
                item.label ??
                item.data ??
                item.dia ??
                ""
        );

    }


    return [];

}


// =====================================================
// OBTER VALORES
// =====================================================

function obterValoresGrafico(
    dados
){

    if(
        Array.isArray(
            dados.valores
        )
    ){

        return dados.valores.map(
            valor =>
                Number(
                    valor || 0
                )
        );

    }


    if(
        Array.isArray(
            dados.dados
        )
    ){

        return dados.dados.map(
            item =>
                Number(
                    item.valor ??
                    item.total ??
                    item.receita ??
                    0
                )
        );

    }


    return [];

}


// =====================================================
// DESTRUIR GRÁFICO ANTERIOR
// =====================================================

function destruirGrafico(){

    if(
        graficoVendas
    ){

        graficoVendas.destroy();

        graficoVendas =
            null;

    }

}


// =====================================================
// DESENHAR GRÁFICO
// =====================================================

function desenharGraficoVendas(
    dados
){

    const canvas =
        document.getElementById(
            "salesChart"
        );


    if(!canvas){

        console.error(
            "❌ Canvas #salesChart não encontrado."
        );

        return;

    }


    if(
        typeof Chart ===
        "undefined"
    ){

        console.error(
            "❌ Chart.js não foi carregado."
        );

        return;

    }


    const labels =
        obterLabelsGrafico(
            dados
        );


    const valores =
        obterValoresGrafico(
            dados
        );


    destruirGrafico();


    const contexto =
        canvas.getContext(
            "2d"
        );


    // =================================================
    // GRÁFICO
    // =================================================

    graficoVendas =
        new Chart(
            contexto,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Faturamento",

                            data:
                                valores,

                            borderColor:
                                "#198754",

                            backgroundColor:
                                "rgba(25, 135, 84, 0.10)",

                            borderWidth: 2,

                            fill: true,

                            tension: 0.35,

                            pointRadius: 3,

                            pointHoverRadius: 5,

                            pointBackgroundColor:
                                "#198754",

                            pointBorderColor:
                                "#ffffff",

                            pointBorderWidth: 2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    interaction: {

                        intersect: false,

                        mode: "index"

                    },


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        contexto
                                    ){

                                        return (
                                            " " +
                                            formatarValorGrafico(
                                                contexto.parsed.y
                                            )
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display: false

                            }

                        },


                        y: {

                            beginAtZero: true,


                            grid: {

                                color:
                                    "rgba(0,0,0,0.06)"

                            },


                            ticks: {

                                callback:
                                    function(
                                        valor
                                    ){

                                        return (
                                            Number(
                                                valor
                                            ).toLocaleString(
                                                "pt-MZ"
                                            ) +
                                            " MT"
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// CARREGAR GRÁFICO
// =====================================================

async function carregarGraficoVendas(
    periodo = null
){

    console.log(
        "====================================="
    );

    console.log(
        " CARREGANDO GRÁFICO DE VENDAS"
    );

    console.log(
        "=====================================");


    // =================================================
    // LOCALIZAR FILTRO
    // =================================================

    const filtro =
        document.getElementById(
            "filtro-grafico"
        );


    if(!filtro){

        console.warn(
            "⚠️ Filtro #filtro-grafico ainda não existe."
        );

        return;

    }


    // =================================================
    // PERÍODO
    // =================================================

    if(!periodo){

        periodo =
            filtro.value ||
            "dia";

    }


    console.log(
        "PERÍODO SELECIONADO:",
        periodo
    );


    // =================================================
    // USUÁRIO
    // =================================================

    const usuario =
        obterUsuarioGrafico();


    if(!usuario){

        console.warn(
            "⚠️ Usuário não encontrado."
        );

        return;

    }


    // =================================================
    // URL
    // =================================================

    let url =
        "/lucros/grafico?periodo=" +
        encodeURIComponent(
            periodo
        );


    // =================================================
    // VENDEDOR
    // =================================================

    if(
        usuario.tipo ===
        "vendedor"
    ){

        url +=
            "&usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }


    // =================================================
    // CACHE
    // =================================================

    url +=
        "&_=" +
        Date.now();


    console.log(
        "URL DO GRÁFICO:",
        url
    );


    try{

        const resposta =
            await fetch(
                url,
                {
                    method: "GET",

                    cache: "no-store",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        console.log(
            "STATUS GRÁFICO:",
            resposta.status
        );


        if(!resposta.ok){

            const texto =
                await resposta.text();

            console.error(
                "❌ ERRO DA API DO GRÁFICO:",
                texto
            );


            throw new Error(
                "Erro HTTP " +
                resposta.status
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "====================================="
        );

        console.log(
            " DADOS DO GRÁFICO"
        );

        console.log(
            dados
        );

        console.log(
            "====================================="
        );


        // =================================================
        // ATUALIZAR RESUMO
        // =================================================

        atualizarResumoGrafico(
            dados
        );


        // =================================================
        // DESENHAR GRÁFICO
        // =================================================

        desenharGraficoVendas(
            dados
        );

    }
    catch(error){

        console.error(
            "❌ Erro ao carregar gráfico:",
            error
        );

    }

}


// =====================================================
// CONFIGURAR FILTRO
// =====================================================

function configurarFiltroGrafico(){

    console.log(
        "🔎 Procurando #filtro-grafico..."
    );


    const filtro =
        document.getElementById(
            "filtro-grafico"
        );


    // =================================================
    // FILTRO AINDA NÃO EXISTE
    // =================================================

    if(!filtro){

        console.warn(
            "⚠️ #filtro-grafico ainda não encontrado."
        );

        return false;

    }


    console.log(
        "✅ #filtro-grafico encontrado:",
        filtro
    );


    // =================================================
    // EVITAR DUPLICAR EVENTO
    // =================================================

    if(
        filtro.dataset.graficoConfigurado ===
        "true"
    ){

        console.log(
            "Filtro já está configurado."
        );

        return true;

    }


    filtro.dataset.graficoConfigurado =
        "true";


    // =================================================
    // ALTERAÇÃO DO FILTRO
    // =================================================

    filtro.addEventListener(
        "change",
        async function(){

            console.log(
                "====================================="
            );

            console.log(
                " FILTRO DO GRÁFICO ALTERADO"
            );

            console.log(
                "NOVO PERÍODO:",
                filtro.value
            );

            console.log(
                "====================================="
            );


            await carregarGraficoVendas(
                filtro.value
            );

        }
    );


    // =================================================
    // CARREGAR VALOR INICIAL
    // =================================================

    const periodoInicial =
        filtro.value ||
        "dia";


    carregarGraficoVendas(
        periodoInicial
    );


    return true;

}


// =====================================================
// TENTAR INICIAR
// =====================================================

function iniciarGrafico(){

    console.log(
        "====================================="
    );

    console.log(
        " INICIANDO GRAFICO.JS"
    );

    console.log(
        "====================================="
    );


    // =================================================
    // TENTAR CONFIGURAR
    // =================================================

    const configurado =
        configurarFiltroGrafico();


    if(configurado){

        graficoInicializado =
            true;

        console.log(
            "✅ GRAFICO.JS INICIADO COM SUCESSO."
        );

        return;

    }


    // =================================================
    // SE O HTML AINDA NÃO EXISTIR,
    // TENTAR NOVAMENTE
    // =================================================

    let tentativas = 0;

    const maxTentativas = 20;


    const intervalo =
        setInterval(
            function(){

                tentativas++;


                console.log(
                    "Tentativa de localizar filtro:",
                    tentativas,
                    "/",
                    maxTentativas
                );


                const sucesso =
                    configurarFiltroGrafico();


                if(sucesso){

                    clearInterval(
                        intervalo
                    );


                    graficoInicializado =
                        true;


                    console.log(
                        "✅ Filtro encontrado."
                    );

                    return;

                }


                if(
                    tentativas >=
                    maxTentativas
                ){

                    clearInterval(
                        intervalo
                    );


                    console.error(
                        "❌ Não foi possível encontrar #filtro-grafico."
                    );

                }

            },
            300
        );

}


// =====================================================
// DOM CONTENT LOADED
// =====================================================

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        iniciarGrafico
    );

}
else{

    iniciarGrafico();

}


// =====================================================
// EXPOR FUNÇÃO GLOBAL
// =====================================================

window.carregarGraficoVendas =
    carregarGraficoVendas;

// =====================================================
// ATUALIZAR GRÁFICO AUTOMATICAMENTE APÓS UMA VENDA
// =====================================================

window.addEventListener(
    "vendaRealizada",
    async function(){

        console.log(
            "🔄 Venda realizada. Atualizando gráfico..."
        );

        try{

            const filtro =
                document.getElementById(
                    "filtro-grafico"
                );

            const periodo =
                filtro?.value ||
                "dia";

            await carregarGraficoVendas(
                periodo
            );

            console.log(
                "✅ Gráfico atualizado automaticamente."
            );

        }
        catch(error){

            console.error(
                "❌ Erro ao atualizar gráfico após venda:",
                error
            );

        }

    }
);
window.addEventListener("vendaRealizada", async function(){

    console.log("📊 Nova venda realizada — atualizando gráficos...");

    // função que você já usa para carregar/atualizar os gráficos
    if (typeof carregarDashboard === "function") {
        await carregarDashboard();
    }

});