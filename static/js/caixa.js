// =====================================
// ABRIR MODAL CAIXA
// =====================================
console.log("CAIXA.JS FOI CARREGADO");
let historicoCompleto = [];

// =====================================
// ABRIR MODAL CAIXA
// =====================================

async function abrirCaixa(){

    const usuario =
    JSON.parse(
        localStorage.getItem("usuario")
    );


    // Sem login: ignora
    if(!usuario){

        return;

    }



    const modal =
    document.getElementById(
        "caixa-panel"
    );


    modal.style.display="flex";



    if(
        usuario.tipo=="admin" ||
        usuario.tipo=="gerente"
    ){

        await carregarTodasCaixas();

    }
    else{

        await carregarMinhaCaixa(
            usuario.id
        );

    }

}

// =====================================
// FECHAR MODAL
// =====================================

function fecharCaixa(){

    document
    .getElementById("caixa-panel")
    .style.display="none";


    fecharOperacaoCaixa();

}





// =====================================
// CARREGAR TODAS AS CAIXAS
// =====================================

// =====================================
// CARREGAR TODAS AS CAIXAS
// =====================================

async function carregarTodasCaixas(){

    console.log("=====================================");
    console.log(" CARREGANDO TODAS AS CAIXAS");
    console.log("=====================================");


    // =====================================
    // 1. PEGAR USUÁRIO LOGADO
    // =====================================

    const usuarioStorage =
        localStorage.getItem("usuario");


    if(!usuarioStorage){

        console.error(
            "Usuário não encontrado no localStorage."
        );

        return;
    }


    let usuario;

    try{

        usuario =
            JSON.parse(usuarioStorage);

    }
    catch(erro){

        console.error(
            "Erro ao ler usuário:",
            erro
        );

        return;
    }


    if(!usuario){

        return;

    }


    console.log(
        "USUÁRIO LOGADO:",
        usuario
    );


    // =====================================
    // 2. BUSCAR TODAS AS CAIXAS
    // =====================================

    try{

        const resposta =
            await fetch(
                `/caixa/todas?usuario_id=${usuario.id}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "STATUS /caixa/todas:",
            resposta.status
        );


        if(!resposta.ok){

            const erroTexto =
                await resposta.text();

            console.error(
                "Erro ao carregar caixas:",
                erroTexto
            );

            return;
        }


        const caixas =
            await resposta.json();


        console.log(
            "CAIXAS RECEBIDAS:",
            caixas
        );


        // =====================================
        // 3. ÁREA DAS CAIXAS
        // =====================================

        const area =
            document.getElementById(
                "lista-caixas"
            );


        if(!area){

            console.error(
                "Elemento #lista-caixas não encontrado."
            );

            return;
        }


        area.innerHTML = "";


        // =====================================
        // 4. VERIFICAR SE EXISTEM CAIXAS
        // =====================================

        if(
            !Array.isArray(caixas) ||
            caixas.length === 0
        ){

            area.innerHTML = `

                <div class="alert alert-info">

                    Nenhuma caixa encontrada.

                </div>

            `;

            await carregarHistoricoGeral();

            return;
        }


        // =====================================
        // 5. PERCORRER CAIXAS
        // =====================================

        caixas.forEach(c => {


            // =====================================
            // GERENTE
            // =====================================
            //
            // Gerente continua vendo SOMENTE
            // as caixas dos vendedores.
            // =====================================

            if(
                usuario.tipo === "gerente"
            ){

                if(
                    c.tipo !== "vendedor"
                ){

                    return;

                }

            }


            // =====================================
            // BOTÃO DA CAIXA
            // =====================================

            let botao = "";


            // =====================================
            // ADMIN NA PRÓPRIA CAIXA
            // =====================================
            //
            // Admin pode retirar dinheiro
            // da própria caixa.
            // =====================================

            if(
                usuario.tipo === "admin" &&
                c.usuario_id == usuario.id
            ){

                botao = `

                    <button
                        class="btn btn-warning w-100 mt-2"
                        onclick="abrirRetirada()"
                    >
                        Retirar
                    </button>

                `;

            }


            // =====================================
            // ADMIN RECOLHENDO DO GERENTE
            // =====================================
            //
            // NOVO:
            // Admin pode recolher o dinheiro
            // acumulado pelo gerente.
            // =====================================

            else if(
                usuario.tipo === "admin" &&
                c.tipo === "gerente"
            ){

                botao = `

                    <button
                        class="btn btn-danger w-100 mt-2"
                        onclick="abrirRecolha(
                            ${c.usuario_id},
                            '${String(
                                c.nome ?? ""
                            ).replace(
                                /'/g,
                                "\\'"
                            )}'
                        )"
                    >
                        Recolher
                    </button>

                `;

            }


            // =====================================
            // ADMIN OU GERENTE RECOLHENDO VENDEDOR
            // =====================================

            else if(
                (
                    usuario.tipo === "admin" ||
                    usuario.tipo === "gerente"
                )
                &&
                c.tipo === "vendedor"
            ){

                botao = `

                    <button
                        class="btn btn-danger w-100 mt-2"
                        onclick="abrirRecolha(
                            ${c.usuario_id},
                            '${String(
                                c.nome ?? ""
                            ).replace(
                                /'/g,
                                "\\'"
                            )}'
                        )"
                    >
                        Recolher
                    </button>

                `;

            }


            // =====================================
            // VALORES
            // =====================================

            const vendas =
                Number(
                    c.vendas ?? 0
                );


            const despesas =
                Number(
                    c.despesas ?? 0
                );


            const retirado =
                Number(
                    c.retirado ?? 0
                );


            const saldo =
                Number(
                    c.saldo ?? 0
                );


            // =====================================
            // MOSTRAR CAIXA
            // =====================================

            area.innerHTML += `

                <div class="caixa-item">

                    <h5>
                        ${escaparHtml(
                            c.nome ?? "-"
                        )}
                    </h5>


                    Tipo:

                    ${escaparHtml(
                        c.tipo ?? "-"
                    )}


                    <br><br>


                    Vendas:

                    ${vendas.toFixed(2)}
                    MT


                    <br>


                    Despesas:

                    ${despesas.toFixed(2)}
                    MT


                    <br>


                    Retirado:

                    ${retirado.toFixed(2)}
                    MT


                    <br><br>


                    <b>

                        Saldo:

                        ${saldo.toFixed(2)}
                        MT

                    </b>


                    ${botao}

                </div>

            `;

        });


        // =====================================
        // 6. CARREGAR HISTÓRICO GERAL
        // =====================================

        await carregarHistoricoGeral();


        console.log(
            "CAIXAS CARREGADAS COM SUCESSO."
        );


    }
    catch(erro){

        console.error(
            "ERRO AO CARREGAR TODAS AS CAIXAS:",
            erro
        );

    }

}

// =====================================
// CARREGAR MINHA CAIXA
// =====================================

async function carregarMinhaCaixa(usuario_id){

    try{

        const resposta = await fetch(
            `/caixa/minha/${usuario_id}`
        );

        if(!resposta.ok){
            throw new Error("Erro ao carregar caixa");
        }

        const dados = await resposta.json();

        const area = document.getElementById(
            "lista-caixas"
        );

        area.innerHTML = `

        <div class="caixa-item">

            <h4>Minha Caixa</h4>

            Vendas:
            ${dados.vendas ?? 0} MT

            <br>

            Despesas:
            ${dados.despesas ?? 0} MT

            <br>

            Retirado:
            ${dados.retirado ?? 0} MT

            <br><br>

            <b>
                Saldo:
                ${dados.saldo_atual ?? 0} MT
            </b>

        </div>

        `;

        // Guarda todo o histórico para o filtro
        historicoCompleto = Array.isArray(dados.movimentos)
            ? dados.movimentos
            : [];

        // Mostra todo o histórico
        montarHistoricoCaixa(historicoCompleto);

        // Se existir texto digitado no filtro,
        // aplica automaticamente
        const filtro = document.getElementById("filtro-historico");

        if(filtro && filtro.value.trim() !== ""){
            filtrarHistorico();
        }

    }
    catch(erro){

        console.error(erro);

        document.getElementById(
            "lista-caixas"
        ).innerHTML = `
            <div class="alert alert-danger">
                Erro ao carregar a caixa.
            </div>
        `;

    }

}

// =====================================
// FILTRO HISTÓRICO EM TEMPO REAL
// =====================================

function filtrarHistorico(){

    const texto = document
        .getElementById(
            "filtro-historico"
        )
        .value
        .toLowerCase()
        .trim();



    if(texto === ""){

        montarHistoricoCaixa(
            historicoCompleto
        );

        return;

    }



    const filtrado =
        historicoCompleto.filter(item => {


        const nome =
            String(item.nome ?? "")
            .toLowerCase();


        const tipo =
            String(item.tipo ?? "")
            .toLowerCase();


        const valor =
            String(item.valor ?? "")
            .toLowerCase();


        const observacao =
            String(item.observacao ?? "")
            .toLowerCase();


        const data =
            item.data
            ?
            new Date(item.data)
            .toLocaleString()
            .toLowerCase()
            :
            "";



        return (

            nome.includes(texto) ||

            tipo.includes(texto) ||

            valor.includes(texto) ||

            observacao.includes(texto) ||

            data.includes(texto)

        );


    });



    montarHistoricoCaixa(
        filtrado
    );

}

// =====================================
// ABRIR RECOLHA
// =====================================

let vendedorSelecionado=null;



function abrirRecolha(id,nome){


    vendedorSelecionado=id;



    document
    .getElementById(
        "nome-vendedor-recolha"
    )
    .innerText=nome;



    document
    .getElementById(
        "area-recolha-caixa"
    )
    .style.display="flex";


}





// =====================================
// FECHAR POPUPS
// =====================================

function fecharOperacaoCaixa(){


    document
    .getElementById(
        "area-recolha-caixa"
    )
    .style.display="none";



    document
    .getElementById(
        "area-retirada-caixa"
    )
    .style.display="none";


}





// =====================================
// RECOLHER DINHEIRO
// =====================================

// =====================================
// RECOLHER DINHEIRO
// =====================================

async function recolherDinheiro(){

    // =====================================
    // PEGAR USUÁRIO
    // =====================================

    const usuario =
        JSON.parse(
            localStorage.getItem("usuario")
        );


    if(!usuario){

        console.error(
            "Usuário não encontrado."
        );

        return;

    }


    // =====================================
    // PEGAR VALOR
    // =====================================

    const valor =
        Number(
            document
                .getElementById(
                    "caixa-valor-recolha"
                )
                .value
        );


    // =====================================
    // PEGAR OBSERVAÇÃO
    // =====================================

    const observacao =
        document
            .getElementById(
                "caixa-observacao"
            )
            .value;


    // =====================================
    // ENVIAR RECOLHA
    // =====================================

    const resposta =
        await fetch(
            `/caixa/recolher?usuario_id=${usuario.id}`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    vendedor_id:
                        vendedorSelecionado,

                    valor:
                        valor,

                    observacao:
                        observacao

                })
            }
        );


    // =====================================
    // LER RESPOSTA
    // =====================================

    const dados =
        await resposta.json();


    // =====================================
    // ERRO
    // =====================================

    if(!resposta.ok){

        alert(
            dados.detail ||
            "Erro ao realizar recolha."
        );

        return;

    }


    // =====================================
    // FECHAR OPERAÇÃO
    // =====================================

    fecharOperacaoCaixa();


    // =====================================
    // ATUALIZAR CAIXA
    // =====================================

    await atualizarCaixa();


    // =====================================
    // ATUALIZAR DASHBOARD
    // SEM F5
    // =====================================

    if(
        typeof window.atualizarDadosCaixaDashboard ===
        "function"
    ){

        await window.atualizarDadosCaixaDashboard();

    }


    // =====================================
    // COMPATIBILIDADE COM FUNÇÃO ANTIGA
    // =====================================

    if(
        typeof window.atualizarSaldoCaixaAgora ===
        "function"
    ){

        await window.atualizarSaldoCaixaAgora();

    }

}






// =====================================
// ABRIR RETIRADA
// =====================================

function abrirRetirada(){


    document
    .getElementById(
        "area-retirada-caixa"
    )
    .style.display="flex";


}





// =====================================
// RETIRAR
// =====================================

async function retirarCaixa(){


    const usuario =
    JSON.parse(
        localStorage.getItem("usuario")
    );



    const valor =
    Number(
        document
        .getElementById(
            "caixa-valor-retirada"
        )
        .value
    );



    const observacao =
    document
    .getElementById(
        "caixa-observacao-retirada"
    )
    .value;



    const resposta =
    await fetch(

    `/caixa/retirar?usuario_id=${usuario.id}`,

    {

        method:"POST",

        headers:{

            "Content-Type":
            "application/json"

        },


        body:JSON.stringify({

            valor:valor,

            observacao:observacao

        })

    }

    );



    const dados =
    await resposta.json();



    if(!resposta.ok){

        alert(
            dados.detail
        );

        return;

    }

    fecharOperacaoCaixa();

    await atualizarCaixa();

    // Atualizar saldo do dashboard
    if(
        typeof window.atualizarSaldoCaixaAgora ===
        "function"
    ){

        await window.atualizarSaldoCaixaAgora();

    }
    if(
        typeof window.atualizarDadosCaixaDashboard ===
        "function"
    ){

        await window.atualizarDadosCaixaDashboard();

    }

}


// =====================================
// HISTÓRICO
// =====================================

function montarHistoricoCaixa(lista){

    const tabela =
        document.getElementById(
            "lista-movimentos-caixa"
        );


    if(!tabela){

        console.error(
            "Elemento lista-movimentos-caixa não encontrado."
        );

        return;

    }


    tabela.innerHTML = "";


    if(
        !Array.isArray(lista) ||
        lista.length === 0
    ){

        tabela.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="text-center text-muted"
                >

                    Nenhum movimento

                </td>

            </tr>

        `;

        return;

    }


    lista.forEach(item => {


        // =====================================
        // TIPO DO MOVIMENTO
        // =====================================

        const tipoMovimento =
            String(
                item.tipo ?? ""
            )
            .trim()
            .toLowerCase();


        // =====================================
        // NOME
        // =====================================

        let nomeExibicao;


        // =====================================
        // DESPESA
        //
        // Mostrar o nome de quem criou
        // a despesa.
        // =====================================

        if(
            tipoMovimento === "despesa"
        ){

            const nomeCriador =
                item.solicitante_nome ??
                item.usuario_nome ??
                item.nome_usuario ??
                item.criado_por_nome ??
                item.nome ??
                "Não informado";


            const idDespesa =
                item.despesa_id ??
                item.id_despesa ??
                item.despesaId ??
                item.id;


            nomeExibicao = `

                ${escaparHtml(nomeCriador)}

                ${
                    idDespesa !== null &&
                    idDespesa !== undefined &&
                    idDespesa !== ""
                    ?

                    `
                        <br>

                        <small class="text-muted">

                            ID da despesa:
                            ${escaparHtml(idDespesa)}

                        </small>
                    `

                    :

                    ""
                }

            `;

        }


        // =====================================
        // OUTROS MOVIMENTOS
        // =====================================

        else{

            nomeExibicao =
                escaparHtml(
                    item.nome ?? "-"
                );

        }


        // =====================================
        // TIPO
        // =====================================

        const tipoExibicao =
            escaparHtml(
                item.tipo ?? "-"
            );


        // =====================================
        // VALOR
        // =====================================

        const valor =
            item.valor ?? 0;


        // =====================================
        // DATA
        // =====================================

        const data =
            item.data

            ?

            new Date(
                item.data
            ).toLocaleString()

            :

            "-";


        // =====================================
        // OBSERVAÇÃO
        // =====================================

        const observacao =
            escaparHtml(
                item.observacao ?? ""
            );


        // =====================================
        // MOSTRAR LINHA
        // =====================================

        tabela.innerHTML += `

            <tr>

                <td>

                    ${nomeExibicao}

                </td>


                <td>

                    ${tipoExibicao}

                </td>


                <td>

                    ${valor} MT

                </td>


                <td>

                    ${data}

                </td>


                <td>

                    ${observacao}

                </td>

            </tr>

        `;

    });

}
async function atualizarCaixa() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (!usuario) return;

    if (usuario.tipo === "admin" || usuario.tipo === "gerente") {
        await carregarTodasCaixas();
    } else {
        await carregarMinhaCaixa(usuario.id);
    }
}

async function carregarHistoricoGeral(){

    const usuario = JSON.parse(
        localStorage.getItem("usuario")
    );

    if(!usuario){
        return;
    }

    try{

        // =========================================
        // 1. HISTÓRICO NORMAL DA CAIXA
        // =========================================

        const respostaCaixa = await fetch(
            `/caixa/historico?usuario_id=${usuario.id}`
        );

        if(!respostaCaixa.ok){

            console.error(
                "Erro ao carregar histórico da caixa:",
                respostaCaixa.status
            );

            return;
        }

        const historicoCaixa =
            await respostaCaixa.json();


        // =========================================
        // 2. DESPESAS FORA DA CAIXA
        // =========================================

        const respostaForaCaixa = await fetch(
            `/despesas-fora-caixa/historico-geral?usuario_id=${usuario.id}`
        );

        if(!respostaForaCaixa.ok){

            console.error(
                "Erro ao carregar despesas fora da caixa:",
                respostaForaCaixa.status
            );

            return;
        }

        const despesasForaCaixa =
            await respostaForaCaixa.json();


        // =========================================
        // 3. TRANSFORMAR DESPESAS FORA DA CAIXA
        // PARA O MESMO FORMATO DO HISTÓRICO
        // =========================================

        const movimentosForaCaixa =
            despesasForaCaixa.map(despesa => {

                return {

                    // Nome de quem solicitou
                    nome:
                        despesa.solicitante_nome
                        ?? "-",

                    // Identificação do movimento
                    tipo:
                        "despesa_fora_caixa",

                    // Valor
                    valor:
                        despesa.valor_aprovado
                        ??
                        despesa.valor_solicitado
                        ??
                        0,

                    // Data
                    data:
                        despesa.data_aprovacao
                        ??
                        despesa.data_solicitacao,

                    // Observação
                    observacao:
                        despesa.observacao
                        ??
                        "",

                    // Informações extras
                    despesa_id:
                        despesa.id,

                    descricao:
                        despesa.descricao,

                    categoria:
                        despesa.categoria,

                    estado:
                        despesa.estado,

                    valor_solicitado:
                        despesa.valor_solicitado,

                    valor_aprovado:
                        despesa.valor_aprovado,

                    aprovador_nome:
                        despesa.aprovador_nome

                };

            });


        // =========================================
        // 4. JUNTAR OS DOIS HISTÓRICOS
        // =========================================

        historicoCompleto = [

            ...historicoCaixa,

            ...movimentosForaCaixa

        ];


        // =========================================
        // 5. ORDENAR POR DATA
        // MAIS RECENTE PRIMEIRO
        // =========================================

        historicoCompleto.sort(
            (a, b) => {

                const dataA =
                    a.data
                    ?
                    new Date(a.data).getTime()
                    :
                    0;

                const dataB =
                    b.data
                    ?
                    new Date(b.data).getTime()
                    :
                    0;

                return dataB - dataA;

            }
        );


        // =========================================
        // 6. MOSTRAR HISTÓRICO
        // =========================================

        montarHistoricoCaixa(
            historicoCompleto
        );


        // =========================================
        // 7. APLICAR FILTRO SE EXISTIR
        // =========================================

        const filtro =
            document.getElementById(
                "filtro-historico"
            );

        if(
            filtro &&
            filtro.value.trim() !== ""
        ){

            filtrarHistorico();

        }

    }
    catch(erro){

        console.error(
            "Erro ao carregar histórico geral:",
            erro
        );

    }

}

// =====================================
// SALDO DA CAIXA NO DASHBOARD
// =====================================

window.atualizarSaldoCaixaDashboard = async function(){

    console.log("=====================================");
    console.log(" ATUALIZANDO SALDO DA CAIXA");
    console.log("=====================================");

    // =====================================
    // 1. BUSCAR USUÁRIO
    // =====================================

    const usuarioStorage = localStorage.getItem("usuario");

    if(!usuarioStorage){

        console.error(
            "ERRO: usuário não encontrado no localStorage"
        );

        return;
    }

    let usuario;

    try{

        usuario = JSON.parse(usuarioStorage);

    }
    catch(erro){

        console.error(
            "ERRO AO LER USUÁRIO:",
            erro
        );

        return;
    }


    console.log("USUÁRIO:", usuario);


    // =====================================
    // 2. ELEMENTO DO SALDO
    // =====================================

    const saldoElemento =
        document.getElementById(
            "saldo-caixa"
        );


    if(!saldoElemento){

        console.error(
            "ERRO: elemento #saldo-caixa não encontrado"
        );

        return;
    }


    const detalhesElemento =
        document.getElementById(
            "ver-detalhes-caixa"
        );


    try{

        // =====================================
        // VENDEDOR
        // =====================================

        if(usuario.tipo === "vendedor"){

            console.log(
                "MODO: VENDEDOR"
            );


            const resposta = await fetch(
                `/caixa/minha/${usuario.id}`
            );


            console.log(
                "STATUS MINHA CAIXA:",
                resposta.status
            );


            if(!resposta.ok){

                const erroTexto =
                    await resposta.text();

                console.error(
                    "ERRO AO BUSCAR MINHA CAIXA:",
                    erroTexto
                );

                throw new Error(
                    "Erro HTTP " +
                    resposta.status
                );
            }


            const dados =
                await resposta.json();


            console.log(
                "DADOS DA MINHA CAIXA:",
                dados
            );


            // =====================================
            // USAR EXATAMENTE O MESMO SALDO
            // DO RESUMO DA CAIXA
            // =====================================

            const saldo =
                Number(
                    dados.saldo_atual ?? 0
                );


            console.log(
                "SALDO DO VENDEDOR:",
                saldo
            );


            saldoElemento.innerText =
                saldo.toFixed(2) +
                " MT";


            // =====================================
            // VENDEDOR NÃO VÊ DETALHES GERAIS
            // =====================================

            if(detalhesElemento){

                detalhesElemento.style.display =
                    "none";
            }


            return;
        }


        // =====================================
        // ADMIN / GERENTE
        // =====================================

        if(
            usuario.tipo === "admin" ||
            usuario.tipo === "gerente"
        ){

            console.log(
                "MODO: ADMIN / GERENTE"
            );


            const resposta = await fetch(
                `/caixa/todas?usuario_id=${usuario.id}`
            );


            console.log(
                "STATUS TODAS AS CAIXAS:",
                resposta.status
            );


            if(!resposta.ok){

                const erroTexto =
                    await resposta.text();

                console.error(
                    "ERRO AO BUSCAR TODAS AS CAIXAS:",
                    erroTexto
                );

                throw new Error(
                    "Erro HTTP " +
                    resposta.status
                );
            }


            const caixas =
                await resposta.json();


            console.log(
                "CAIXAS RECEBIDAS:",
                caixas
            );


            let saldoTotal = 0;


            // =====================================
            // SOMAR OS SALDOS DAS CAIXAS
            // =====================================

            caixas.forEach(caixa => {

                // =====================================
                // GERENTE
                // =====================================
                // Gerente soma somente vendedores
                // =====================================

                if(usuario.tipo === "gerente"){

                    if(caixa.tipo !== "vendedor"){

                        return;
                    }
                }


                // =====================================
                // ADMIN
                // =====================================
                // Não somar caixa de gerente
                // =====================================

                if(
                    usuario.tipo === "admin" &&
                    caixa.tipo === "gerente"
                ){

                    return;
                }


                const saldo =
                    Number(
                        caixa.saldo ?? 0
                    );


                console.log(
                    "CAIXA:",
                    caixa.nome,
                    "TIPO:",
                    caixa.tipo,
                    "SALDO:",
                    saldo
                );


                saldoTotal += saldo;

            });


            console.log(
                "SALDO TOTAL:",
                saldoTotal
            );


            // =====================================
            // MOSTRAR NO DASHBOARD
            // =====================================

            saldoElemento.innerText =
                saldoTotal.toFixed(2) +
                " MT";


            // =====================================
            // ADMIN / GERENTE PODE VER DETALHES
            // =====================================

            if(detalhesElemento){

                detalhesElemento.style.display =
                    "block";
            }


            return;
        }


        // =====================================
        // TIPO DESCONHECIDO
        // =====================================

        console.warn(
            "TIPO DE USUÁRIO NÃO RECONHECIDO:",
            usuario.tipo
        );


        saldoElemento.innerText =
            "0.00 MT";


    }
    catch(erro){

        console.error(
            "====================================="
        );

        console.error(
            "ERRO AO ATUALIZAR SALDO DA CAIXA:"
        );

        console.error(erro);

        console.error(
            "====================================="
        );


        saldoElemento.innerText =
            "0.00 MT";
    }

};
// =====================================
// DINHEIRO TOTAL RECOLHIDO
// =====================================

// =====================================
// ATUALIZAR DINHEIRO RECOLHIDO
// =====================================

// =====================================
// ATUALIZAR DINHEIRO RECOLHIDO
// =====================================

window.atualizarDinheiroRecolhido = async function(){

    console.log("=====================================");
    console.log(" ATUALIZANDO DINHEIRO RECOLHIDO");
    console.log("=====================================");

    // =====================================
    // 1. PEGAR USUÁRIO
    // =====================================

    const usuarioStorage =
        localStorage.getItem("usuario");

    if(!usuarioStorage){

        console.error(
            "ERRO: usuário não encontrado no localStorage"
        );

        return;
    }


    let usuario;

    try{

        usuario =
            JSON.parse(usuarioStorage);

    }
    catch(erro){

        console.error(
            "ERRO AO LER USUÁRIO:",
            erro
        );

        return;
    }


    console.log(
        "USUÁRIO:",
        usuario
    );


    // =====================================
    // 2. PEGAR ELEMENTO DO CARD
    // =====================================

    const elemento =
        document.getElementById(
            "dinheiro-recolhido"
        );


    if(!elemento){

        console.error(
            "ERRO: #dinheiro-recolhido não encontrado"
        );

        return;
    }


    // =====================================
    // 3. CHAMAR A ROTA CORRETA
    // =====================================

    try{

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


        console.log(
            "STATUS:",
            resposta.status
        );


        // =====================================
        // 4. VERIFICAR ERRO
        // =====================================

        if(!resposta.ok){

            const erroTexto =
                await resposta.text();

            console.error(
                "ERRO NA ROTA:",
                erroTexto
            );

            elemento.innerText =
                "0.00 MT";

            return;
        }


        // =====================================
        // 5. LER JSON
        // =====================================

        const dados =
            await resposta.json();


        console.log(
            "RESPOSTA DINHEIRO RECOLHIDO:",
            dados
        );


        // =====================================
        // 6. PEGAR SOMENTE total_geral
        // =====================================

        const totalGeral =
            Number(
                dados.total_geral ?? 0
            );


        console.log(
            "TOTAL GERAL:",
            totalGeral
        );


        // =====================================
        // 7. ATUALIZAR CARD
        // =====================================

        elemento.innerText =
            totalGeral.toFixed(2) +
            " MT";


        console.log(
            "CARD ATUALIZADO:",
            elemento.innerText
        );

    }
    catch(erro){

        console.error(
            "ERRO AO ATUALIZAR DINHEIRO RECOLHIDO:",
            erro
        );

        elemento.innerText =
            "0.00 MT";
    }

};

// =====================================
// CARREGAR DADOS DO DASHBOARD
// =====================================

window.atualizarDadosCaixaDashboard = async function(){

    console.log(
        "====================================="
    );

    console.log(
        " ATUALIZANDO DADOS DO DASHBOARD"
    );

    console.log(
        "====================================="
    );

    await Promise.all([

        window.atualizarSaldoCaixaDashboard(),

        window.atualizarDinheiroRecolhido()


    ]);

};
