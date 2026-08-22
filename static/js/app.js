// =====================================================
// CONFIGURAÇÃO GLOBAL DA APLICAÇÃO
// =====================================================

const API =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : window.location.origin;


// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================

let produtosVenda = [];
let carrinho = [];
let usuarioLogado = null;


// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function obterElemento(id) {
    return document.getElementById(id);
}


function esconderElemento(id) {
    const elemento = obterElemento(id);

    if (elemento) {
        elemento.style.display = "none";
    }
}


function mostrarElemento(id, display = "block") {
    const elemento = obterElemento(id);

    if (elemento) {
        elemento.style.display = display;
    }
}


// =====================================================
// CARREGAR UTILIZADOR AO INICIAR SISTEMA
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("PVD: Dashboard carregado.");


    // -------------------------------------------------
    // ESTADO INICIAL DOS MENUS
    // -------------------------------------------------

    mostrarNovaVenda(false);
    mostrarHistorico(false);
    mostrarStock(false);


    esconderElemento("menu-usuarios");
    esconderElemento("menu-categorias");
    esconderElemento("menu-produtos");
    esconderElemento("menu-despesas");
    esconderElemento("ver-detalhes-stock");


    // -------------------------------------------------
    // OBTER UTILIZADOR
    // -------------------------------------------------

    const usuarioSalvo =
        localStorage.getItem("usuario");


    if (usuarioSalvo) {

        try {

            usuarioLogado =
                JSON.parse(usuarioSalvo);

        } catch (erro) {

            console.error(
                "PVD: erro ao ler utilizador:",
                erro
            );

            localStorage.removeItem("usuario");

            usuarioLogado = null;

        }

    }


    // -------------------------------------------------
    // UTILIZADOR LOGADO
    // -------------------------------------------------

    if (usuarioLogado) {

        console.log(
            "PVD: utilizador logado:",
            usuarioLogado
        );


        // Carregar informações do utilizador
        if (
            typeof carregarUsuario === "function"
        ) {

            carregarUsuario(
                usuarioLogado
            );

        }


        // -------------------------------------------------
        // NOVA VENDA
        // -------------------------------------------------

        if (
            usuarioLogado.tipo === "admin" ||
            usuarioLogado.tipo === "vendedor"
        ) {

            mostrarNovaVenda(true);

        } else {

            mostrarNovaVenda(false);

        }


        // -------------------------------------------------
        // DESPESAS
        // -------------------------------------------------

        mostrarElemento(
            "menu-despesas",
            "block"
        );


        // -------------------------------------------------
        // BOTÃO LOGIN
        // -------------------------------------------------

        const botaoLogin =
            obterElemento("login-button");

        if (botaoLogin) {
            botaoLogin.style.display = "none";
        }


    } else {

        // -------------------------------------------------
        // SEM LOGIN
        // -------------------------------------------------

        prepararDashboardVisitante();

    }


    // -------------------------------------------------
    // DETALHES DO STOCK
    // -------------------------------------------------

    esconderElemento(
        "ver-detalhes-stock"
    );

});


// =====================================================
// PREPARAR DASHBOARD PARA VISITANTE
// =====================================================

function prepararDashboardVisitante() {

    usuarioLogado = null;


    // -------------------------------------------------
    // ESCONDER MENUS
    // -------------------------------------------------

    esconderElemento("menu-usuarios");
    esconderElemento("menu-categorias");
    esconderElemento("menu-produtos");
    esconderElemento("menu-despesas");
    esconderElemento("ver-detalhes-stock");


    mostrarNovaVenda(false);
    mostrarHistorico(false);
    mostrarStock(false);


    // -------------------------------------------------
    // VENDAS
    // -------------------------------------------------

    const vendas =
        obterElemento("vendas-dia");

    if (vendas) {

        vendas.innerText =
            "0.00 MT";

    }


    const detalheVendas =
        document.querySelector(
            "#vendas-dia"
        );


    if (
        detalheVendas &&
        detalheVendas.parentElement
    ) {

        const info =
            detalheVendas.parentElement
                .querySelector("small");


        if (info) {

            info.innerHTML =
                "Faça login para ver vendas";

        }

    }


    // -------------------------------------------------
    // LUCRO
    // -------------------------------------------------

    const lucro =
        obterElemento("lucro-hoje");

    if (lucro) {

        lucro.innerText =
            "0.00 MT";

    }


    // -------------------------------------------------
    // DESPESAS
    // -------------------------------------------------

    const despesas =
        obterElemento("despesas-hoje");

    if (despesas) {

        despesas.innerText =
            "0.00 MT";

    }


    // -------------------------------------------------
    // STOCK
    // -------------------------------------------------

    const totalStock =
        obterElemento("total-stock");

    if (totalStock) {

        totalStock.innerText =
            "0";

    }


    // -------------------------------------------------
    // PRODUTOS NOVOS
    // -------------------------------------------------

    const produtosNovos =
        obterElemento("produtos-novos");

    if (produtosNovos) {

        produtosNovos.innerText =
            "0";

    }


    // -------------------------------------------------
    // BAIXO STOCK
    // -------------------------------------------------

    const baixoStock =
        obterElemento("baixo-stock");

    if (baixoStock) {

        baixoStock.innerText =
            "0";

    }


    const lista =
        obterElemento(
            "baixo-stock-list"
        );


    if (lista) {

        lista.innerHTML = `
            <div class="alert alert-secondary mb-0">
                Faça login para visualizar o stock.
            </div>
        `;

    }


    // -------------------------------------------------
    // BOTÃO LOGIN
    // -------------------------------------------------

    const botaoLogin =
        obterElemento("login-button");


    if (botaoLogin) {

        botaoLogin.style.display =
            "block";


        botaoLogin.onclick =
            abrirLogin;

    }

}


// =====================================================
// LOGIN
// =====================================================

function abrirLogin() {

    const loginScreen =
        obterElemento("login-screen");


    if (loginScreen) {

        loginScreen.style.display =
            "flex";

    }

}


// =====================================================
// FECHAR LOGIN
// =====================================================

function fecharLogin() {

    const loginScreen =
        obterElemento("login-screen");


    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    console.log(
        "PVD: a terminar sessão..."
    );


    // -------------------------------------------------
    // LIMPAR UTILIZADOR
    // -------------------------------------------------

    localStorage.removeItem(
        "usuario"
    );


    usuarioLogado = null;


    // -------------------------------------------------
    // LIMPAR DADOS TEMPORÁRIOS
    // -------------------------------------------------

    produtosVenda = [];
    carrinho = [];


    // -------------------------------------------------
    // ESCONDER MENUS
    // -------------------------------------------------

    esconderElemento(
        "menu-usuarios"
    );

    esconderElemento(
        "menu-categorias"
    );

    esconderElemento(
        "menu-produtos"
    );

    esconderElemento(
        "menu-despesas"
    );

    esconderElemento(
        "ver-detalhes-stock"
    );


    // -------------------------------------------------
    // ESCONDER FUNCIONALIDADES
    // -------------------------------------------------

    mostrarNovaVenda(false);
    mostrarHistorico(false);
    mostrarStock(false);


    // -------------------------------------------------
    // NOME DO UTILIZADOR
    // -------------------------------------------------

    const user =
        obterElemento("user-name");


    if (user) {

        user.innerText =
            "Login";

    }


    // -------------------------------------------------
    // PERFIL
    // -------------------------------------------------

    const nomePerfil =
        document.querySelector(
            ".profile-info strong"
        );


    const emailPerfil =
        document.querySelector(
            ".profile-info small"
        );


    if (nomePerfil) {

        nomePerfil.innerText =
            "Visitante";

    }


    if (emailPerfil) {

        emailPerfil.innerText =
            "";

    }


    // -------------------------------------------------
    // VENDAS
    // -------------------------------------------------

    const vendas =
        obterElemento("vendas-dia");


    if (vendas) {

        vendas.innerText =
            "0.00 MT";

    }


    // -------------------------------------------------
    // LUCRO
    // -------------------------------------------------

    const lucro =
        obterElemento("lucro-hoje");


    if (lucro) {

        lucro.innerText =
            "0.00 MT";

    }


    // -------------------------------------------------
    // DESPESAS
    // -------------------------------------------------

    const despesas =
        obterElemento("despesas-hoje");


    if (despesas) {

        despesas.innerText =
            "0.00 MT";

    }


    // -------------------------------------------------
    // TOTAL STOCK
    // -------------------------------------------------

    const totalStock =
        obterElemento("total-stock");


    if (totalStock) {

        totalStock.innerText =
            "0";

    }


    // -------------------------------------------------
    // PRODUTOS NOVOS
    // -------------------------------------------------

    const produtosNovos =
        obterElemento("produtos-novos");


    if (produtosNovos) {

        produtosNovos.innerText =
            "0";

    }


    // -------------------------------------------------
    // BAIXO STOCK
    // -------------------------------------------------

    const baixoStock =
        obterElemento("baixo-stock");


    if (baixoStock) {

        baixoStock.innerText =
            "0";

    }


    const lista =
        obterElemento(
            "baixo-stock-list"
        );


    if (lista) {

        lista.innerHTML = `
            <div class="alert alert-secondary mb-0">
                Faça login para visualizar o stock.
            </div>
        `;

    }


    // -------------------------------------------------
    // BOTÃO LOGIN
    // -------------------------------------------------

    const botaoLogin =
        obterElemento("login-button");


    if (botaoLogin) {

        botaoLogin.style.display =
            "block";


        botaoLogin.onclick =
            abrirLogin;

    }


    // -------------------------------------------------
    // FECHAR JANELA DE LOGIN
    // -------------------------------------------------

    fecharLogin();


    console.log(
        "PVD: sessão terminada."
    );

}