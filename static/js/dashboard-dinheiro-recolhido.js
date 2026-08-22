// ============================================================
// DASHBOARD
// DINHEIRO RECOLHIDO
// + RECOLHA DOS GERENTES
// + LUCRO DE SAQUE
// + LEVANTAMENTO
// ============================================================



// ============================================================
// OBTER USUÁRIO
// ============================================================

function obterUsuarioDashboard(){

    const usuarioStorage =
        localStorage.getItem("usuario");


    if(!usuarioStorage){

        console.warn(
            "Usuário não encontrado no localStorage."
        );

        return null;

    }


    try{

        return JSON.parse(
            usuarioStorage
        );

    }
    catch(erro){

        console.error(
            "Erro ao ler usuário:",
            erro
        );

        return null;

    }

}


// ============================================================
// VERIFICAR ADMIN
// ============================================================

function usuarioEhAdmin(usuario){

    if(!usuario){

        return false;

    }


    const tipo =
        String(
            usuario.tipo || ""
        )
        .trim()
        .toLowerCase();


    return (
        tipo === "admin" ||
        tipo === "administrador"
    );

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHtml(valor){

    if(
        valor === null ||
        valor === undefined
    ){

        return "";

    }


    return String(valor)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// ============================================================
// DINHEIRO RECOLHIDO
// ============================================================
// ============================================================


// ============================================================
// ABRIR DETALHES
// ============================================================

async function abrirDetalhesDinheiroRecolhido(){

    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        console.warn(
            "Usuário não encontrado."
        );

        return;

    }


    if(!usuarioEhAdmin(usuario)){

        console.warn(
            "Somente admin pode visualizar."
        );

        return;

    }


    const modal =
        document.getElementById(
            "modal-detalhes-dinheiro-recolhido"
        );


    const lista =
        document.getElementById(
            "lista-dinheiro-recolhido-gerentes"
        );


    const totalElemento =
        document.getElementById(
            "total-detalhes-recolhido"
        );


    if(!modal){

        console.error(
            "Modal de detalhes não encontrado."
        );

        return;

    }


    if(!lista){

        console.error(
            "Lista de detalhes não encontrada."
        );

        return;

    }


    if(!totalElemento){

        console.error(
            "Total de detalhes não encontrado."
        );

        return;

    }


    modal.style.display =
        "flex";


    lista.innerHTML = `

        <div class="text-center text-muted">

            Carregando...

        </div>

    `;


    totalElemento.innerText =
        "0.00 MT";


    try{

        // ====================================================
        // BUSCAR DINHEIRO RECOLHIDO
        // ====================================================

        const resposta =
            await fetch(

                `/caixa/dashboard/dinheiro-recolhido-gerentes?usuario_id=${usuario.id}`,

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        if(!resposta.ok){

            const erro =
                await resposta.text();

            console.error(
                "Erro ao carregar detalhes:",
                erro
            );


            lista.innerHTML = `

                <div class="alert alert-danger">

                    Erro ao carregar os detalhes.

                </div>

            `;

            return;

        }


        const dados =
            await resposta.json();


        console.log(
            "DINHEIRO RECOLHIDO:",
            dados
        );


        // ====================================================
        // ADMIN
        // ====================================================

        const admin =
            dados.admin ?? {};


        const retiradoAdmin =
            Number(
                admin.retirado ?? 0
            );


        const recolhidoAdmin =
            Number(
                admin.recolhido ?? 0
            );


        const recebidoGerentesAdmin =
            Number(
                admin.recebido_gerentes ?? 0
            );


        const despesasAdmin =
            Number(
                admin.despesas ?? 0
            );


        const totalAdmin =
            Number(
                admin.total ?? 0
            );


        // ====================================================
        // GERENTES
        // ====================================================

        const gerentes =
            Array.isArray(
                dados.gerentes
            )
            ?
            dados.gerentes
            :
            [];


        // ====================================================
        // LIMPAR
        // ====================================================

        lista.innerHTML =
            "";


        // ====================================================
        // ADMIN
        // ====================================================

        lista.innerHTML += `

            <div
                style="
                    margin-bottom:15px;
                    padding-bottom:12px;
                    border-bottom:2px solid #ddd;
                "
            >

                <h5 style="margin-bottom:10px;">

                    ${escaparHtml(
                        admin.nome ?? "Admin"
                    )}

                </h5>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        padding:4px 0;
                    "
                >

                    <span>

                        Recolhido pelo admin

                    </span>

                    <strong>

                        ${recolhidoAdmin.toFixed(2)} MT

                    </strong>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        padding:4px 0;
                    "
                >

                    <span>

                        Recebido dos gerentes

                    </span>

                    <strong
                        style="
                            color:#198754;
                        "
                    >

                        + ${recebidoGerentesAdmin.toFixed(2)} MT

                    </strong>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        padding:4px 0;
                    "
                >

                    <span>

                        Retirado pelo admin

                    </span>

                    <strong>

                        ${retiradoAdmin.toFixed(2)} MT

                    </strong>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        padding:4px 0;
                    "
                >

                    <span>

                        Despesas aprovadas

                    </span>

                    <strong
                        style="
                            color:#dc3545;
                        "
                    >

                        - ${despesasAdmin.toFixed(2)} MT

                    </strong>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        padding:6px 0;
                        font-weight:bold;
                        border-top:1px solid #ddd;
                        margin-top:5px;
                    "
                >

                    <span>

                        Disponível do admin

                    </span>

                    <strong
                        style="
                            color:#198754;
                        "
                    >

                        ${totalAdmin.toFixed(2)} MT

                    </strong>

                </div>

            </div>

        `;


        // ====================================================
        // ÁREA LUCRO SAQUE
        // ====================================================

        criarAreaLucroSaqueNoModal(
            modal
        );


        // ====================================================
        // CARREGAR LUCRO
        // ====================================================

        await carregarLucroSaqueDisponivel();


        // ====================================================
        // TÍTULO GERENTES
        // ====================================================

        lista.innerHTML += `

            <h5 style="margin-bottom:10px;">

                Recolhas dos gerentes

            </h5>

        `;


        // ====================================================
        // SEM GERENTES
        // ====================================================

        if(
            gerentes.length === 0
        ){

            lista.innerHTML += `

                <div class="text-center text-muted">

                    Nenhum gerente possui recolhas.

                </div>

            `;

        }
        else{

            gerentes.forEach(
                gerente => {

                    const recolhido =
                        Number(
                            gerente.recolhido ?? 0
                        );


                    const despesas =
                        Number(
                            gerente.despesas ?? 0
                        );


                    const entregue =
                        Number(
                            gerente.entregue ?? 0
                        );


                    const disponivel =
                        Number(
                            gerente.total_recolhido ?? 0
                        );


                    const gerenteId =
                        Number(
                            gerente.id ??
                            gerente.usuario_id ??
                            gerente.gerente_id ??
                            0
                        );


                    const nomeGerente =
                        String(
                            gerente.nome ?? "-"
                        );


                    let botaoRecolher =
                        "";


                    if(
                        gerenteId > 0 &&
                        disponivel > 0
                    ){

                        botaoRecolher = `

                            <button
                                type="button"
                                class="btn btn-danger btn-sm"
                                style="
                                    margin-top:8px;
                                    width:100%;
                                "
                                onclick="abrirRecolhaGerente(
                                    ${gerenteId},
                                    '${escaparHtml(nomeGerente)}',
                                    ${disponivel}
                                )"
                            >

                                Recolher

                            </button>

                        `;

                    }
                    else if(
                        gerenteId > 0
                    ){

                        botaoRecolher = `

                            <button
                                type="button"
                                class="btn btn-secondary btn-sm"
                                style="
                                    margin-top:8px;
                                    width:100%;
                                "
                                disabled
                            >

                                Sem saldo para recolher

                            </button>

                        `;

                    }


                    lista.innerHTML += `

                        <div
                            style="
                                padding:10px 0;
                                border-bottom:1px solid #eee;
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                "
                            >

                                <strong>

                                    ${escaparHtml(
                                        nomeGerente
                                    )}

                                </strong>


                                <strong
                                    style="
                                        color:#198754;
                                    "
                                >

                                    ${disponivel.toFixed(2)} MT

                                </strong>

                            </div>


                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    font-size:13px;
                                    color:#666;
                                    margin-top:5px;
                                "
                            >

                                <span>

                                    Recolhido:
                                    ${recolhido.toFixed(2)} MT

                                </span>


                                <span
                                    style="
                                        color:#dc3545;
                                    "
                                >

                                    Despesas:
                                    - ${despesas.toFixed(2)} MT

                                </span>

                            </div>


                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    font-size:13px;
                                    margin-top:5px;
                                "
                            >

                                <span>

                                    Entregue ao admin:

                                </span>


                                <strong
                                    style="
                                        color:#dc3545;
                                    "
                                >

                                    - ${entregue.toFixed(2)} MT

                                </strong>

                            </div>


                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    font-weight:bold;
                                    margin-top:6px;
                                    padding-top:5px;
                                    border-top:1px solid #eee;
                                "
                            >

                                <span>

                                    Disponível:

                                </span>


                                <strong
                                    style="
                                        color:#198754;
                                    "
                                >

                                    ${disponivel.toFixed(2)} MT

                                </strong>

                            </div>


                            ${botaoRecolher}

                        </div>

                    `;

                }
            );

        }


        // ====================================================
        // TOTAL GERENTES
        // ====================================================

        const totalGerentes =
            Number(
                dados.total_gerentes ?? 0
            );


        lista.innerHTML += `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    margin-top:12px;
                    padding-top:10px;
                    border-top:2px solid #ddd;
                    font-weight:bold;
                "
            >

                <span>

                    Total disponível dos gerentes

                </span>


                <span
                    style="
                        color:#198754;
                    "
                >

                    ${totalGerentes.toFixed(2)} MT

                </span>

            </div>

        `;


        // ====================================================
        // TOTAL GERAL
        // ====================================================

        const totalGeral =
            Number(
                dados.total_geral ?? 0
            );


        totalElemento.innerText =
            totalGeral.toFixed(2) +
            " MT";

    }
    catch(erro){

        console.error(
            "Erro ao carregar detalhes:",
            erro
        );


        lista.innerHTML = `

            <div class="alert alert-danger">

                Erro ao carregar os detalhes.

            </div>

        `;

    }

}


// ============================================================
// CRIAR ÁREA DO LUCRO DE SAQUE
// ============================================================

function criarAreaLucroSaqueNoModal(modal){

    if(!modal){

        return;

    }


    let area =
        document.getElementById(
            "area-lucro-saque-dashboard"
        );


    if(area){

        return;

    }


    area =
        document.createElement(
            "div"
        );


    area.id =
        "area-lucro-saque-dashboard";


    area.style.cssText = `

        margin-top:15px;
        margin-bottom:15px;
        padding:14px;
        border-radius:10px;
        background:#f8f9fa;
        border:1px solid #dee2e6;

    `;


    area.innerHTML = `

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:8px;
            "
        >

            <span>

                Lucros disponível para levantamento.

            </span>


            <strong
                id="valor-disponivel-lucro-saque"
                style="
                    color:#198754;
                    font-size:18px;
                "
            >

                0.00 MT

            </strong>

        </div>


        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                padding-top:8px;
                border-top:1px solid #ddd;
            "
        >

            <span>

                Dinheiro já levantado

            </span>


            <strong
                id="valor-ja-levantado-lucro-saque"
                style="
                    color:#dc3545;
                "
            >

                0.00 MT

            </strong>

        </div>


        <button
            type="button"
            id="btn-levantar-lucro-saque"
            class="btn btn-success btn-sm"
            style="
                width:100%;
                margin-top:10px;
            "
            onclick="abrirLevantamentoLucroSaque()"
            disabled
        >

            Levantar

        </button>

    `;


    const lista =
        document.getElementById(
            "lista-dinheiro-recolhido-gerentes"
        );


    if(lista){

        lista.parentNode.insertBefore(
            area,
            lista
        );

    }
    else{

        modal.appendChild(
            area
        );

    }

}


// ============================================================
// LER VALOR JÁ LEVANTADO
// ============================================================
//
// Aceita vários nomes para facilitar a integração com o backend.
// Se o backend devolver:
//
// valor_sacado
// total_sacado
// valor_levantado_total
// total_levantado
//
// será usado diretamente.
//
// Se devolver total enviado + disponível,
// calcula:
//
// já levantado = total enviado - disponível
// ============================================================

function obterValorJaLevantado(dados){

    if(!dados){

        return 0;

    }


    const valoresDiretos = [

        dados.valor_sacado,

        dados.total_sacado,

        dados.valor_levantado_total,

        dados.total_levantado,

        dados.ja_levantado,

        dados.levantado

    ];


    for(
        const valor of valoresDiretos
    ){

        if(
            valor !== null &&
            valor !== undefined
        ){

            const numero =
                Number(valor);


            if(
                Number.isFinite(numero) &&
                numero >= 0
            ){

                return numero;

            }

        }

    }


    // ========================================================
    // TENTAR CALCULAR PELO TOTAL ENVIADO
    // ========================================================

    const totalEnviado =
        Number(
            dados.total_enviado ??
            dados.valor_total ??
            dados.total_lucro_saque ??
            dados.lucro_saque_total ??
            NaN
        );


    const disponivel =
        Number(
            dados.valor_disponivel ??
            dados.disponivel ??
            dados.total_disponivel ??
            dados.lucro_saque_disponivel ??
            NaN
        );


    if(
        Number.isFinite(totalEnviado) &&
        Number.isFinite(disponivel)
    ){

        return Math.max(
            totalEnviado - disponivel,
            0
        );

    }


    return 0;

}


// ============================================================
// CARREGAR LUCRO DE SAQUE
// ============================================================

async function carregarLucroSaqueDisponivel(){

    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        return;

    }


    if(!usuarioEhAdmin(usuario)){

        return;

    }


    const modal =
        document.getElementById(
            "modal-detalhes-dinheiro-recolhido"
        );


    if(modal){

        criarAreaLucroSaqueNoModal(
            modal
        );

    }


    const elemento =
        document.getElementById(
            "valor-disponivel-lucro-saque"
        );


    const elementoLevantado =
        document.getElementById(
            "valor-ja-levantado-lucro-saque"
        );


    const botao =
        document.getElementById(
            "btn-levantar-lucro-saque"
        );


    if(!elemento){

        console.warn(
            "Área do lucro de saque não encontrada."
        );

        return;

    }


    elemento.innerText =
        "Carregando...";


    if(elementoLevantado){

        elementoLevantado.innerText =
            "Carregando...";

    }


    if(botao){

        botao.disabled =
            true;

    }


    try{

        // ====================================================
        // CONSULTAR BACKEND
        // ====================================================

        const resposta =
            await fetch(

                `/vendas/lucro-saque/disponivel?usuario_id=${usuario.id}`,

                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }

            );


        if(!resposta.ok){

            const erro =
                await resposta.text();

            console.error(
                "Erro ao consultar lucro de saque:",
                erro
            );


            elemento.innerText =
                "0.00 MT";


            if(elementoLevantado){

                elementoLevantado.innerText =
                    "0.00 MT";

            }


            return;

        }


        const dados =
            await resposta.json();


        console.log(
            "LUCRO SAQUE:",
            dados
        );


        // ====================================================
        // DISPONÍVEL
        // ====================================================

        const disponivel =
            Number(
                dados.valor_disponivel ??
                dados.disponivel ??
                dados.total_disponivel ??
                dados.lucro_saque_disponivel ??
                0
            );


        const valorDisponivel =
            Number.isFinite(disponivel)
            ?
            Math.max(
                disponivel,
                0
            )
            :
            0;


        // ====================================================
        // JÁ LEVANTADO
        // ====================================================

        const jaLevantado =
            obterValorJaLevantado(
                dados
            );


        const valorJaLevantado =
            Number.isFinite(
                jaLevantado
            )
            ?
            Math.max(
                jaLevantado,
                0
            )
            :
            0;


        // ====================================================
        // MOSTRAR DISPONÍVEL
        // ====================================================

        elemento.innerText =
            valorDisponivel.toFixed(2) +
            " MT";


        elemento.dataset.valor =
            valorDisponivel;


        // ====================================================
        // MOSTRAR JÁ LEVANTADO
        // ====================================================

        if(elementoLevantado){

            elementoLevantado.innerText =
                valorJaLevantado.toFixed(2) +
                " MT";

        }


        // ====================================================
        // BOTÃO
        // ====================================================

        if(botao){

            botao.disabled =
                valorDisponivel <= 0;

        }

    }
    catch(erro){

        console.error(
            "Erro ao carregar lucro de saque:",
            erro
        );


        elemento.innerText =
            "0.00 MT";


        if(elementoLevantado){

            elementoLevantado.innerText =
                "0.00 MT";

        }


        if(botao){

            botao.disabled =
                true;

        }

    }

}


// ============================================================
// ============================================================
// MODAL DE LEVANTAMENTO
// ============================================================
// ============================================================


// ============================================================
// CRIAR MODAL AUTOMATICAMENTE
// ============================================================

function criarModalLevantamentoLucroSaque(){

    let modal =
        document.getElementById(
            "modal-levantar-lucro-saque"
        );


    if(modal){

        return modal;

    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "modal-levantar-lucro-saque";


    modal.style.cssText = `

        display:none;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.55);
        z-index:10000;
        align-items:center;
        justify-content:center;
        padding:20px;

    `;


    modal.innerHTML = `

        <div
            style="
                background:#fff;
                width:100%;
                max-width:420px;
                border-radius:12px;
                padding:20px;
                box-shadow:0 10px 40px rgba(0,0,0,.25);
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:15px;
                "
            >

                <h5
                    style="
                        margin:0;
                    "
                >

                    Levantamento

                </h5>


                <button
                    type="button"
                    onclick="fecharLevantamentoLucroSaque()"
                    style="
                        border:none;
                        background:none;
                        color:#dc3545;
                        font-size:26px;
                        font-weight:bold;
                        cursor:pointer;
                    "
                >

                    &times;

                </button>

            </div>


            <div
                style="
                    background:#f8f9fa;
                    border:1px solid #dee2e6;
                    border-radius:8px;
                    padding:12px;
                    margin-bottom:15px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        margin-bottom:7px;
                    "
                >

                    <span>

                        Disponível

                    </span>


                    <strong
                        id="valor-disponivel-modal-lucro-saque"
                        style="
                            color:#198754;
                        "
                    >

                        0.00 MT

                    </strong>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                    "
                >

                    <span>

                        Já levantado

                    </span>


                    <strong
                        id="valor-ja-levantado-modal-lucro-saque"
                        style="
                            color:#dc3545;
                        "
                    >

                        0.00 MT

                    </strong>

                </div>

            </div>


            <label
                for="valor-levantar-lucro-saque"
                style="
                    display:block;
                    margin-bottom:6px;
                    font-weight:600;
                "
            >

                Valor a levantar

            </label>


            <input
                type="number"
                id="valor-levantar-lucro-saque"
                class="form-control"
                min="0.01"
                step="0.01"
                placeholder="Digite o valor"
                style="
                    width:100%;
                    margin-bottom:15px;
                "
            >


            <div
                style="
                    display:flex;
                    gap:10px;
                "
            >

                <button
                    type="button"
                    class="btn btn-secondary"
                    style="
                        flex:1;
                    "
                    onclick="fecharLevantamentoLucroSaque()"
                >

                    Cancelar

                </button>


                <button
                    type="button"
                    id="btn-confirmar-levantamento-lucro-saque"
                    class="btn btn-success"
                    style="
                        flex:1;
                    "
                    onclick="confirmarLevantamentoLucroSaque()"
                >

                    Levantar

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    return modal;

}


// ============================================================
// ABRIR MODAL DE LEVANTAMENTO
// ============================================================

function abrirLevantamentoLucroSaque(){

    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        console.warn(
            "Usuário não encontrado."
        );

        return;

    }


    if(!usuarioEhAdmin(usuario)){

        console.warn(
            "Somente admin pode levantar."
        );

        return;

    }


    const elemento =
        document.getElementById(
            "valor-disponivel-lucro-saque"
        );


    const disponivel =
        Number(
            elemento?.dataset?.valor ?? 0
        );


    if(
        !Number.isFinite(disponivel) ||
        disponivel <= 0
    ){

        return;

    }


    const modal =
        criarModalLevantamentoLucroSaque();


    const disponivelModal =
        document.getElementById(
            "valor-disponivel-modal-lucro-saque"
        );


    const levantadoPrincipal =
        document.getElementById(
            "valor-ja-levantado-lucro-saque"
        );


    const levantadoModal =
        document.getElementById(
            "valor-ja-levantado-modal-lucro-saque"
        );


    const input =
        document.getElementById(
            "valor-levantar-lucro-saque"
        );


    if(disponivelModal){

        disponivelModal.innerText =
            disponivel.toFixed(2) +
            " MT";

    }


    if(levantadoModal && levantadoPrincipal){

        levantadoModal.innerText =
            levantadoPrincipal.innerText;

    }


    if(input){

        input.value =
            "";

        input.max =
            disponivel.toFixed(2);

    }


    modal.style.display =
        "flex";


    setTimeout(
        () => {

            if(input){

                input.focus();

            }

        },
        100
    );

}


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharLevantamentoLucroSaque(){

    const modal =
        document.getElementById(
            "modal-levantar-lucro-saque"
        );


    if(modal){

        modal.style.display =
            "none";

    }

}


// ============================================================
// CONFIRMAR LEVANTAMENTO
// ============================================================

async function confirmarLevantamentoLucroSaque(){

    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        return;

    }


    if(!usuarioEhAdmin(usuario)){

        return;

    }


    const input =
        document.getElementById(
            "valor-levantar-lucro-saque"
        );


    const elementoDisponivel =
        document.getElementById(
            "valor-disponivel-lucro-saque"
        );


    const botao =
        document.getElementById(
            "btn-confirmar-levantamento-lucro-saque"
        );


    if(!input){

        return;

    }


    const valor =
        Number(
            String(
                input.value
            )
            .replace(",", ".")
        );


    const disponivel =
        Number(
            elementoDisponivel?.dataset?.valor ?? 0
        );


    // ========================================================
    // VALIDAÇÃO SEM ALERT
    // ========================================================

    if(
        !Number.isFinite(valor) ||
        valor <= 0
    ){

        input.classList.add(
            "is-invalid"
        );

        input.focus();

        return;

    }


    if(
        valor > disponivel
    ){

        input.classList.add(
            "is-invalid"
        );

        input.focus();

        return;

    }


    input.classList.remove(
        "is-invalid"
    );


    // ========================================================
    // DESABILITAR
    // ========================================================

    if(botao){

        botao.disabled =
            true;

        botao.innerText =
            "A processar...";

    }


    try{

        // ====================================================
        // ROTA REAL
        // ====================================================

        const resposta =
            await fetch(

                `/vendas/lucro-saque/levantar?` +
                `usuario_id=${usuario.id}` +
                `&valor=${encodeURIComponent(
                    valor.toFixed(2)
                )}`,

                {
                    method: "POST",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }

            );


        let dados = {};


        try{

            dados =
                await resposta.json();

        }
        catch(erro){

            console.error(
                "Resposta não é JSON:",
                erro
            );

        }


        if(!resposta.ok){

            console.error(
                "Erro no levantamento:",
                dados
            );


            // =================================================
            // MOSTRAR ERRO DENTRO DO MODAL
            // SEM ALERT
            // =================================================

            mostrarErroLevantamento(
                dados.detail ||
                "Não foi possível realizar o levantamento."
            );


            return;

        }


        console.log(
            "LEVANTAMENTO REALIZADO:",
            dados
        );


        // ====================================================
        // FECHAR MODAL
        // ====================================================

        fecharLevantamentoLucroSaque();


        // ====================================================
        // ATUALIZAR DADOS
        // ====================================================

        await carregarLucroSaqueDisponivel();


        // ====================================================
        // SE O MODAL DE DETALHES ESTIVER ABERTO
        // ATUALIZAR TUDO
        // ====================================================

        const modalDetalhes =
            document.getElementById(
                "modal-detalhes-dinheiro-recolhido"
            );


        if(
            modalDetalhes &&
            modalDetalhes.style.display !== "none"
        ){

            await abrirDetalhesDinheiroRecolhido();

        }


        // ====================================================
        // ATUALIZAR DASHBOARD
        // ====================================================

        if(
            typeof window.atualizarDadosCaixaDashboard ===
            "function"
        ){

            await window.atualizarDadosCaixaDashboard();

        }


        if(
            typeof window.atualizarDinheiroRecolhido ===
            "function"
        ){

            await window.atualizarDinheiroRecolhido();

        }

    }
    catch(erro){

        console.error(
            "Erro ao realizar levantamento:",
            erro
        );


        mostrarErroLevantamento(
            "Erro de comunicação com o servidor."
        );

    }
    finally{

        if(botao){

            botao.disabled =
                false;

            botao.innerText =
                "Levantar";

        }

    }

}


// ============================================================
// MOSTRAR ERRO NO MODAL
// ============================================================

function mostrarErroLevantamento(mensagem){

    const input =
        document.getElementById(
            "valor-levantar-lucro-saque"
        );


    if(!input){

        return;

    }


    let erro =
        document.getElementById(
            "erro-levantamento-lucro-saque"
        );


    if(!erro){

        erro =
            document.createElement(
                "div"
            );


        erro.id =
            "erro-levantamento-lucro-saque";


        erro.className =
            "alert alert-danger";


        erro.style.marginTop =
            "10px";


        input.parentNode.insertBefore(
            erro,
            input.nextSibling
        );

    }


    erro.innerText =
        mensagem;


    setTimeout(
        () => {

            if(erro){

                erro.remove();

            }

        },
        5000
    );

}


// ============================================================
// ============================================================
// RECOLHA DO GERENTE
// ============================================================
// ============================================================


// ============================================================
// ABRIR RECOLHA
// ============================================================

function abrirRecolhaGerente(
    gerenteId,
    nome,
    disponivel
){

    gerenteSelecionadoRecolha =
        Number(
            gerenteId
        );


    const modal =
        document.getElementById(
            "modal-recolha-gerente"
        );


    const nomeElemento =
        document.getElementById(
            "nome-gerente-recolha"
        );


    const disponivelElemento =
        document.getElementById(
            "valor-disponivel-gerente"
        );


    const valorElemento =
        document.getElementById(
            "valor-recolha-gerente"
        );


    const observacaoElemento =
        document.getElementById(
            "observacao-recolha-gerente"
        );


    if(!modal){

        console.error(
            "Modal de recolha do gerente não encontrado."
        );

        return;

    }


    if(nomeElemento){

        nomeElemento.innerText =
            nome || "-";

    }


    if(disponivelElemento){

        disponivelElemento.innerText =
            Number(
                disponivel
            ).toFixed(2) +
            " MT";

    }


    if(valorElemento){

        valorElemento.value =
            "";

        valorElemento.max =
            Number(
                disponivel
            ).toFixed(2);

    }


    if(observacaoElemento){

        observacaoElemento.value =
            "";

    }


    modal.dataset.disponivel =
        Number(
            disponivel
        );


    modal.style.display =
        "flex";


    setTimeout(
        () => {

            if(valorElemento){

                valorElemento.focus();

            }

        },
        100
    );

}


// ============================================================
// FECHAR RECOLHA
// ============================================================

function fecharRecolhaGerente(){

    const modal =
        document.getElementById(
            "modal-recolha-gerente"
        );


    if(modal){

        modal.style.display =
            "none";

    }


    gerenteSelecionadoRecolha =
        null;

}


// ============================================================
// RECOLHER DINHEIRO GERENTE
// ============================================================

async function recolherDinheiroGerente(){

    const usuario =
        obterUsuarioDashboard();


    if(!usuario){

        return;

    }


    if(!usuarioEhAdmin(usuario)){

        return;

    }


    if(!gerenteSelecionadoRecolha){

        return;

    }


    const valorElemento =
        document.getElementById(
            "valor-recolha-gerente"
        );


    const observacaoElemento =
        document.getElementById(
            "observacao-recolha-gerente"
        );


    const modal =
        document.getElementById(
            "modal-recolha-gerente"
        );


    if(!valorElemento){

        return;

    }


    const valor =
        Number(
            String(
                valorElemento.value
            )
            .replace(",", ".")
        );


    const disponivel =
        Number(
            modal?.dataset?.disponivel ?? 0
        );


    const observacao =
        observacaoElemento
        ?
        observacaoElemento.value.trim()
        :
        "";


    if(
        !Number.isFinite(valor) ||
        valor <= 0
    ){

        valorElemento.classList.add(
            "is-invalid"
        );

        valorElemento.focus();

        return;

    }


    if(
        valor > disponivel
    ){

        valorElemento.classList.add(
            "is-invalid"
        );

        valorElemento.focus();

        return;

    }


    valorElemento.classList.remove(
        "is-invalid"
    );


    const botoes =
        modal
        ?
        modal.querySelectorAll(
            "button"
        )
        :
        [];


    botoes.forEach(
        botao => {

            botao.disabled =
                true;

        }
    );


    try{

        const resposta =
            await fetch(

                `/caixa/recolher?usuario_id=${usuario.id}`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            vendedor_id:
                                gerenteSelecionadoRecolha,

                            valor:
                                valor,

                            observacao:
                                observacao

                        })

                }

            );


        let dados = {};


        try{

            dados =
                await resposta.json();

        }
        catch(erro){

            console.error(
                "Resposta inválida:",
                erro
            );

        }


        if(!resposta.ok){

            console.error(
                "Erro ao recolher:",
                dados
            );


            return;

        }


        fecharRecolhaGerente();


        await abrirDetalhesDinheiroRecolhido();


        if(
            typeof window.atualizarDinheiroRecolhido ===
            "function"
        ){

            await window.atualizarDinheiroRecolhido();

        }


        if(
            typeof window.atualizarDadosCaixaDashboard ===
            "function"
        ){

            await window.atualizarDadosCaixaDashboard();

        }

    }
    catch(erro){

        console.error(
            "Erro ao recolher dinheiro:",
            erro
        );

    }
    finally{

        botoes.forEach(
            botao => {

                botao.disabled =
                    false;

            }
        );

    }

}


// ============================================================
// FECHAR DETALHES
// ============================================================

function fecharDetalhesDinheiroRecolhido(){

    const modal =
        document.getElementById(
            "modal-detalhes-dinheiro-recolhido"
        );


    if(modal){

        modal.style.display =
            "none";

    }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        criarModalLevantamentoLucroSaque();

    }
);


// ============================================================
// FUNÇÕES GLOBAIS
// ============================================================

window.obterUsuarioDashboard =
    obterUsuarioDashboard;


window.escaparHtml =
    escaparHtml;


window.abrirDetalhesDinheiroRecolhido =
    abrirDetalhesDinheiroRecolhido;


window.fecharDetalhesDinheiroRecolhido =
    fecharDetalhesDinheiroRecolhido;


window.abrirRecolhaGerente =
    abrirRecolhaGerente;


window.fecharRecolhaGerente =
    fecharRecolhaGerente;


window.recolherDinheiroGerente =
    recolherDinheiroGerente;


window.criarAreaLucroSaqueNoModal =
    criarAreaLucroSaqueNoModal;


window.carregarLucroSaqueDisponivel =
    carregarLucroSaqueDisponivel;


window.abrirLevantamentoLucroSaque =
    abrirLevantamentoLucroSaque;


window.fecharLevantamentoLucroSaque =
    fecharLevantamentoLucroSaque;


window.confirmarLevantamentoLucroSaque =
    confirmarLevantamentoLucroSaque;


window.mostrarErroLevantamento =
    mostrarErroLevantamento;