// =====================================================
// DASHBOARD.JS
// VERSÃO OTIMIZADA
// CARREGAMENTO RÁPIDO E PARALELO
// =====================================================

console.log("=====================================");
console.log(" DASHBOARD.JS FOI CARREGADO");
console.log(" VERSÃO OTIMIZADA");
console.log("=====================================");


// =====================================================
// CACHE
// =====================================================

let vendasVendedoresCache = [];


// =====================================================
// OBTER USUÁRIO
// =====================================================

function obterUsuarioDashboard(){

    try{

        const storage =
            localStorage.getItem("usuario");

        if(!storage){

            return null;

        }

        return JSON.parse(storage);

    }
    catch(error){

        console.error(
            "ERRO AO LER USUÁRIO:",
            error
        );

        return null;

    }

}


// =====================================================
// VISIBILIDADE DO PAINEL FINANCEIRO
// ADMIN / GERENTE
// =====================================================

window.atualizarVisibilidadeFinanceiro = function(){

    const usuario =
        obterUsuarioDashboard();

    const painelFinanceiro =
        document.getElementById(
            "painel-financeiro"
        );

    const resumoFinanceiro =
        document.getElementById(
            "resumo-financeiro"
        );


    if(!usuario){

        if(painelFinanceiro){

            painelFinanceiro.style.display =
                "none";

        }

        if(resumoFinanceiro){

            resumoFinanceiro.style.display =
                "none";

        }

        return;

    }


    if(
        usuario.tipo === "admin" ||
        usuario.tipo === "gerente"
    ){

        if(painelFinanceiro){

            painelFinanceiro.style.display =
                "grid";

        }

        if(resumoFinanceiro){

            resumoFinanceiro.style.display =
                "grid";

        }

        return;

    }


    if(painelFinanceiro){

        painelFinanceiro.style.display =
            "none";

    }

    if(resumoFinanceiro){

        resumoFinanceiro.style.display =
            "none";

    }

};


// =====================================================
// CONFIGURAR VISIBILIDADE DO DASHBOARD
// =====================================================

function configurarVisibilidadeDashboard(){

    const usuario =
        obterUsuarioDashboard();


    // =============================================
    // DETALHES DAS VENDAS
    // =============================================

    const verDetalhesVendas =
        document.getElementById(
            "ver-detalhes-vendas"
        );

    if(verDetalhesVendas){

        if(
            usuario &&
            (
                usuario.tipo === "admin" ||
                usuario.tipo === "gerente"
            )
        ){

            verDetalhesVendas.style.display =
                "block";

        }
        else{

            verDetalhesVendas.style.display =
                "none";

        }

    }


    // =============================================
    // BOTÃO LOGIN
    // =============================================

    const botaoLogin =
        document.getElementById(
            "login-button"
        );

    if(botaoLogin){

        if(usuario){

            botaoLogin.style.display =
                "none";

        }
        else{

            botaoLogin.style.display =
                "block";

            if(
                typeof abrirLogin ===
                "function"
            ){

                botaoLogin.onclick =
                    abrirLogin;

            }

        }

    }


    // =============================================
    // FINANCEIRO
    // =============================================

    if(
        typeof atualizarVisibilidadeFinanceiro ===
        "function"
    ){

        atualizarVisibilidadeFinanceiro();

    }


    // =============================================
    // STOCK
    // =============================================

    if(
        typeof atualizarVisibilidadeStock ===
        "function"
    ){

        atualizarVisibilidadeStock();

    }


    // =============================================
    // DINHEIRO RECOLHIDO
    // =============================================

    if(
        typeof atualizarVisibilidadeDinheiroRecolhido ===
        "function"
    ){

        atualizarVisibilidadeDinheiroRecolhido();

    }


    // =============================================
    // DETALHES DINHEIRO RECOLHIDO
    // =============================================

    if(
        typeof atualizarVisibilidadeDetalhesDinheiroRecolhido ===
        "function"
    ){

        atualizarVisibilidadeDetalhesDinheiroRecolhido();

    }


    // =============================================
    // LUCROS
    // =============================================

    if(
        typeof atualizarVisibilidadeLucros ===
        "function"
    ){

        atualizarVisibilidadeLucros();

    }

}


// =====================================================
// CARREGAR DASHBOARD
// =====================================================


// =====================================================
// CARREGAR DASHBOARD
// =====================================================

window.carregarDashboard = async function(){

    console.log("=====================================");
    console.log(" CARREGANDO DASHBOARD");
    console.log("=====================================");

    const usuario =
        obterUsuarioDashboard();

    if(!usuario){

        console.log(
            "Nenhum usuário logado."
        );

        return;

    }


    // =================================================
    // URL DASHBOARD
    // =================================================

    let urlDashboard =
        API + "/dashboard/";


    if(
        usuario.tipo === "vendedor"
    ){

        urlDashboard +=
            "?usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }


    console.log(
        "URL DASHBOARD:",
        urlDashboard
    );


    try{

        // =================================================
        // 1. DASHBOARD PRINCIPAL
        // =================================================

        const respostaDashboard =
            await fetch(
                urlDashboard,
                {
                    cache: "no-store"
                }
            );


        if(!respostaDashboard.ok){

            const erroTexto =
                await respostaDashboard.text();

            console.error(
                "ERRO DASHBOARD:",
                erroTexto
            );

            throw new Error(
                "Erro HTTP " +
                respostaDashboard.status
            );

        }


        const dados =
            await respostaDashboard.json();


        console.log(
            "DADOS DASHBOARD:",
            dados
        );


        // =================================================
        // 2. BUSCAR STOCK TOTAL
        // =================================================
        //
        // /stock/
        //
        // ESTE ENDPOINT SERVE PARA:
        //
        // - listar stock
        // - calcular total de stock
        //
        // NÃO usar este endpoint para descobrir
        // quais produtos estão em baixo stock.
        //
        // =================================================

        let produtosStock = [];


        try{

            const respostaStock =
                await fetch(
                    API + "/stock/",
                    {
                        cache: "no-store"
                    }
                );


            if(!respostaStock.ok){

                throw new Error(
                    "Erro HTTP " +
                    respostaStock.status
                );

            }


            const resultadoStock =
                await respostaStock.json();


            console.log(
                "RESPOSTA /stock/:",
                resultadoStock
            );


            if(
                Array.isArray(
                    resultadoStock
                )
            ){

                produtosStock =
                    resultadoStock;

            }
            else{

                console.warn(
                    "Resposta /stock/ não é uma lista:",
                    resultadoStock
                );

                produtosStock = [];

            }

        }
        catch(error){

            console.error(
                "ERRO AO BUSCAR /stock/:",
                error
            );

            produtosStock = [];

        }


        // =================================================
        // 3. TOTAL STOCK
        // =================================================

        const totalStock =
            document.getElementById(
                "total-stock"
            );


        if(totalStock){

            const total =
                produtosStock.length;


            totalStock.innerText =
                total;


            console.log(
                "TOTAL PRODUTOS:",
                total
            );

        }


        // =================================================
        // 4. BUSCAR BAIXO STOCK
        // =================================================
        //
        // /stock/baixo
        //
        // ESTE É O ENDPOINT RESPONSÁVEL
        // POR DIZER QUAIS PRODUTOS ESTÃO
        // EM BAIXO STOCK.
        //
        // NÃO fazer filter() usando /stock/.
        //
        // =================================================

        let baixoStockProdutos = [];


        try{

            const respostaBaixoStock =
                await fetch(
                    API + "/stock/baixo",
                    {
                        cache: "no-store"
                    }
                );


            if(!respostaBaixoStock.ok){

                throw new Error(
                    "Erro HTTP " +
                    respostaBaixoStock.status
                );

            }


            const resultadoBaixoStock =
                await respostaBaixoStock.json();


            console.log(
                "RESPOSTA /stock/baixo:",
                resultadoBaixoStock
            );


            if(
                Array.isArray(
                    resultadoBaixoStock
                )
            ){

                baixoStockProdutos =
                    resultadoBaixoStock;

            }
            else{

                console.warn(
                    "Resposta /stock/baixo não é uma lista:",
                    resultadoBaixoStock
                );

                baixoStockProdutos = [];

            }

        }
        catch(error){

            console.error(
                "ERRO AO BUSCAR /stock/baixo:",
                error
            );

            baixoStockProdutos = [];

        }


        // =================================================
        // 5. CONTADOR BAIXO STOCK
        // =================================================

        const baixoStock =
            document.getElementById(
                "baixo-stock"
            );


        if(baixoStock){

            baixoStock.innerText =
                baixoStockProdutos.length;

        }


        console.log(
            "TOTAL PRODUTOS BAIXO STOCK:",
            baixoStockProdutos.length
        );


        // =================================================
        // 6. LISTA DE BAIXO STOCK
        // =================================================

        const lista =
            document.getElementById(
                "baixo-stock-list"
            );


        if(lista){

            lista.innerHTML = "";


            if(
                baixoStockProdutos.length > 0
            ){

                baixoStockProdutos.forEach(
                    produto => {

                        const quantidade =
                            Number(
                                produto.stock_total ?? 0
                            );


                        const minimo =
                            Number(
                                produto.stock_minimo ?? 0
                            );


                        lista.innerHTML += `

                            <div class="alert-item">

                                <div>

                                    <strong>
                                        ${produto.nome}
                                    </strong>

                                    <br>

                                    <small>

                                        Stock:
                                        ${quantidade}

                                        /

                                        mínimo:
                                        ${minimo}

                                    </small>

                                </div>

                                <span
                                    class="badge bg-danger"
                                >

                                    Baixo Stock

                                </span>

                            </div>

                        `;

                    }
                );

            }
            else{

                lista.innerHTML = `

                    <div
                        class="alert alert-success mb-0"
                    >

                        Nenhum produto com baixo stock.

                    </div>

                `;

            }

        }


        // =================================================
        // 7. PRODUTOS NOVOS
        // =================================================

        const produtosNovos =
            document.getElementById(
                "produtos-novos"
            );


        if(produtosNovos){

            produtosNovos.innerText =
                dados.stock?.produtos_novos ?? 0;

        }


        // =================================================
        // LOG FINAL
        // =================================================

        console.log(
            "====================================="
        );

        console.log(
            "STOCK TOTAL (/stock/):",
            produtosStock
        );

        console.log(
            "BAIXO STOCK (/stock/baixo):",
            baixoStockProdutos
        );

        console.log(
            "DASHBOARD PRINCIPAL CARREGADO"
        );

        console.log(
            "====================================="
        );


    }
    catch(error){

        console.error(
            "ERRO DASHBOARD:",
            error
        );

    }

};
// =====================================================
// VENDAS DE HOJE
// =====================================================

window.carregarVendasDia = async function(){

    const elemento =
        document.getElementById(
            "vendas-dia"
        );


    if(!elemento){

        return;

    }


    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        elemento.innerText =
            "0.00 MT";

        return;

    }


    let url =
        API +
        "/vendas/dashboard/vendas-dia";


    if(
        usuario.tipo === "vendedor"
    ){

        url +=
            "?usuario_id=" +
            encodeURIComponent(
                usuario.id
            );

    }


    try{

        const resposta =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if(!resposta.ok){

            throw new Error(
                "Erro HTTP " +
                resposta.status
            );

        }


        const dados =
            await resposta.json();


        const vendasHoje =
            Number(
                dados.vendas_dia ?? 0
            );


        elemento.innerText =
            vendasHoje.toFixed(2) +
            " MT";

    }
    catch(error){

        console.error(
            "ERRO AO CARREGAR VENDAS:",
            error
        );


        elemento.innerText =
            "0.00 MT";

    }

};


// =====================================================
// DETALHES DOS VENDEDORES
// =====================================================

window.carregarDetalhesVendedores = async function(){

    try{

        const tabela =
            document.getElementById(
                "tabela-vendedores"
            );


        if(!tabela){

            return;

        }


        const usuario =
            obterUsuarioDashboard();


        if(!usuario){

            tabela.innerHTML =
                "Usuário não encontrado";

            return;

        }


        const resposta =
            await fetch(
                API +
                "/vendas/dashboard/vendas-vendedores?usuario_id=" +
                encodeURIComponent(
                    usuario.id
                ),
                {
                    cache: "no-store"
                }
            );


        if(!resposta.ok){

            throw new Error(
                "Erro ao carregar detalhes"
            );

        }


        const dados =
            await resposta.json();


        vendasVendedoresCache =
            dados;


        mostrarVendasVendedores(
            dados
        );

    }
    catch(error){

        console.error(
            "ERRO DETALHES:",
            error
        );

    }

};


// =====================================================
// MOSTRAR VENDAS DOS VENDEDORES
// =====================================================

window.mostrarVendasVendedores = function(
    dados
){

    const tabela =
        document.getElementById(
            "tabela-vendedores"
        );


    if(!tabela){

        return;

    }


    if(
        !Array.isArray(dados) ||
        dados.length === 0
    ){

        tabela.innerHTML = `

            <div class="alert alert-info">

                Nenhuma venda encontrada.

            </div>

        `;

        return;

    }


    const agrupado = {};


    dados.forEach(
        venda => {

            const chave =
                venda.vendedor +
                "_" +
                venda.data;


            if(!agrupado[chave]){

                agrupado[chave] = {

                    vendedor:
                        venda.vendedor,

                    data:
                        venda.data,

                    total: 0,

                    produtos: []

                };

            }


            agrupado[chave].total +=
                Number(
                    venda.total || 0
                );


            if(
                Array.isArray(
                    venda.produtos
                )
            ){

                venda.produtos.forEach(
                    produto => {

                        agrupado[
                            chave
                        ].produtos.push(
                            produto
                        );

                    }
                );

            }

        }
    );


    const vendasOrganizadas =
        Object.values(
            agrupado
        );


    let html = "";


    vendasOrganizadas.forEach(
        venda => {

            html += `

            <div class="card mb-4">

                <div
                    class="card-header bg-dark text-white"
                >

                    <strong>
                        Data: ${venda.data}
                    </strong>

                </div>


                <div class="card-body">

                    <h5>

                        Vendedor:
                        ${venda.vendedor}

                    </h5>


                    <p>

                        <strong>
                            Total vendido:
                        </strong>

                        ${venda.total.toFixed(2)}
                        MT

                    </p>


                    <table
                        class="table table-sm table-bordered"
                    >

                        <thead>

                            <tr>

                                <th>
                                    Produto
                                </th>

                                <th>
                                    Quantidade
                                </th>

                                <th>
                                    Subtotal
                                </th>

                            </tr>

                        </thead>


                        <tbody>

            `;


            venda.produtos.forEach(
                produto => {

                    html += `

                        <tr>

                            <td>
                                ${produto.produto}
                            </td>

                            <td>
                                ${produto.quantidade}
                            </td>

                            <td>

                                ${Number(
                                    produto.subtotal || 0
                                ).toFixed(2)}

                                MT

                            </td>

                        </tr>

                    `;

                }
            );


            html += `

                        </tbody>

                    </table>

                </div>

            </div>

            `;

        }
    );


    tabela.innerHTML =
        html;

};


// =====================================================
// FILTRAR VENDAS POR DATA
// =====================================================

window.filtrarVendasData = function(){

    const campo =
        document.getElementById(
            "filtro-data-vendas"
        );


    if(!campo){

        return;

    }


    const texto =
        campo.value.trim();


    if(texto === ""){

        mostrarVendasVendedores(
            vendasVendedoresCache
        );

        return;

    }


    const filtradas =
        vendasVendedoresCache.filter(
            venda =>
                String(
                    venda.data ?? ""
                ).includes(texto)
        );


    mostrarVendasVendedores(
        filtradas
    );

};


// =====================================================
// MODAL VENDEDORES
// =====================================================

window.abrirModalVendedores = function(){

    const modal =
        document.getElementById(
            "modal-vendedores"
        );


    if(modal){

        modal.style.display =
            "flex";


        carregarDetalhesVendedores();

    }

};


window.fecharModalVendedores = function(){

    const modal =
        document.getElementById(
            "modal-vendedores"
        );


    if(modal){

        modal.style.display =
            "none";

    }

};


// =====================================================
// VISIBILIDADE STOCK
// =====================================================

window.atualizarVisibilidadeStock = function(){

    const menuStock =
        document.getElementById(
            "menu-stock"
        );


    if(!menuStock){

        return;

    }


    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        menuStock.style.display =
            "none";

        return;

    }


    menuStock.style.display =
        "block";

};


// =====================================================
// VISIBILIDADE DINHEIRO RECOLHIDO
// =====================================================

window.atualizarVisibilidadeDinheiroRecolhido =
function(){

    const usuario =
        obterUsuarioDashboard();


    const card =
        document.getElementById(
            "card-dinheiro-recolhido"
        );


    if(!card){

        return;

    }


    if(!usuario){

        card.style.display =
            "none";

        return;

    }


    if(usuario.tipo === "vendedor"){

        card.style.display =
            "none";

        return;

    }


    if(
        usuario.tipo === "admin" ||
        usuario.tipo === "gerente"
    ){

        card.style.display =
            "flex";

        return;

    }


    card.style.display =
        "none";

};


// =====================================================
// VISIBILIDADE DETALHES DINHEIRO RECOLHIDO
// =====================================================

window.atualizarVisibilidadeDetalhesDinheiroRecolhido =
function(){

    const usuario =
        obterUsuarioDashboard();


    const link =
        document.getElementById(
            "ver-detalhes-dinheiro-recolhido"
        );


    if(!link){

        return;

    }


    if(
        usuario &&
        usuario.tipo === "admin"
    ){

        link.style.display =
            "inline-block";

    }
    else{

        link.style.display =
            "none";

    }

};


// =====================================================
// INICIALIZAÇÃO RÁPIDA
// =====================================================

async function iniciarDashboard(){

    console.log("=====================================");
    console.log(" INICIANDO DASHBOARD RÁPIDO");
    console.log("=====================================");


    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        console.log(
            "Nenhum usuário logado."
        );

        return;

    }


    // =================================================
    // 1. CONFIGURAR VISIBILIDADE IMEDIATAMENTE
    // =================================================

    configurarVisibilidadeDashboard();


    // =================================================
    // 2. OCULTAR LUCROS IMEDIATAMENTE
    // =================================================

    if(
        typeof garantirLucrosOcultos ===
        "function"
    ){

        garantirLucrosOcultos();

    }


    if(
        typeof configurarAcessoLucros ===
        "function"
    ){

        configurarAcessoLucros();

    }


    // =================================================
    // 3. CARREGAR TUDO EM PARALELO
    // =================================================

    const tarefas = [];


    // -----------------------------------------------
    // DASHBOARD PRINCIPAL
    // -----------------------------------------------

    if(
        typeof carregarDashboard ===
        "function"
    ){

        tarefas.push(

            carregarDashboard()

                .catch(
                    error => {

                        console.error(
                            "ERRO DASHBOARD:",
                            error
                        );

                    }
                )

        );

    }


    // -----------------------------------------------
    // VENDAS DO DIA
    // -----------------------------------------------

    if(
        typeof carregarVendasDia ===
        "function"
    ){

        tarefas.push(

            carregarVendasDia()

                .catch(
                    error => {

                        console.error(
                            "ERRO VENDAS DO DIA:",
                            error
                        );

                    }
                )

        );

    }


    // -----------------------------------------------
    // SALDO DA CAIXA
    // -----------------------------------------------

    if(
        typeof atualizarSaldoCaixaDashboard ===
        "function"
    ){

        tarefas.push(

            atualizarSaldoCaixaDashboard()

                .catch(
                    error => {

                        console.error(
                            "ERRO SALDO CAIXA:",
                            error
                        );

                    }
                )

        );

    }


    // -----------------------------------------------
    // DINHEIRO RECOLHIDO
    // -----------------------------------------------

    if(
        typeof atualizarDinheiroRecolhido ===
        "function"
    ){

        if(
            usuario.tipo === "admin" ||
            usuario.tipo === "gerente"
        ){

            tarefas.push(

                atualizarDinheiroRecolhido()

                    .catch(
                        error => {

                            console.error(
                                "ERRO DINHEIRO RECOLHIDO:",
                                error
                            );

                        }
                    )

            );

        }

    }


    // -----------------------------------------------
    // LUCROS
    // -----------------------------------------------

    if(
        typeof carregarLucrosDashboard ===
        "function"
    ){

        tarefas.push(

            carregarLucrosDashboard()

                .catch(
                    error => {

                        console.error(
                            "ERRO LUCROS:",
                            error
                        );

                    }
                )

        );

    }


    // =================================================
    // ESPERAR TODAS AO MESMO TEMPO
    // =================================================

    await Promise.all(
        tarefas
    );


    // =================================================
    // GARANTIR NOVAMENTE SEGURANÇA DOS LUCROS
    // =================================================

    if(
        typeof garantirLucrosOcultos ===
        "function"
    ){

        garantirLucrosOcultos();

    }


    if(
        typeof configurarAcessoLucros ===
        "function"
    ){

        configurarAcessoLucros();

    }


    console.log("=====================================");
    console.log(" DASHBOARD TOTALMENTE CARREGADO");
    console.log("=====================================");

}


// =====================================================
// DOM READY
// =====================================================

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        iniciarDashboard
    );

}
else{

    iniciarDashboard();

}


// =====================================================
// ATUALIZAR SALDO DA CAIXA MANUALMENTE
// =====================================================

window.atualizarSaldoCaixaAgora = async function(){

    console.log(
        "🔄 Atualizando saldo da caixa..."
    );


    if(
        typeof window.atualizarSaldoCaixaDashboard !==
        "function"
    ){

        console.warn(
            "⚠️ atualizarSaldoCaixaDashboard ainda não está disponível."
        );

        return;

    }


    try{

        await window.atualizarSaldoCaixaDashboard();


        console.log(
            "✅ Saldo da caixa atualizado."
        );

    }
    catch(error){

        console.error(
            "❌ Erro ao atualizar saldo da caixa:",
            error
        );

    }

};