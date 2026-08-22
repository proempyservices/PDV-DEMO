// =====================================================
// UTILIZADORES
// =====================================================


async function abrirUsuarios() {


    document.querySelectorAll(
        ".usuarios-modal"
    )
    .forEach(modal => {

        modal.style.display = "none";

    });



    const painel =
    document.getElementById(
        "usuarios-panel"
    );


    if(painel){

        painel.style.display =
        "flex";

    }



    if(
        typeof carregarUsuarios === "function"
    ){

        await carregarUsuarios();

    }


}




async function carregarUsuarios(){


    try{


        const resposta =
        await fetch(
            API + "/auth/usuarios"
        );



        const usuarios =
        await resposta.json();



        const tabela =
        document.getElementById(
            "lista-usuarios"
        );



        if(!tabela)
            return;



        tabela.innerHTML = "";



        usuarios.forEach(u=>{


            tabela.innerHTML += `


            <tr>


                <td>
                    ${u.nome}
                </td>


                <td>
                    ${u.email}
                </td>


                <td>
                    ${u.tipo}
                </td>


                <td>



                    <button
                    class="btn btn-warning btn-sm"
                    onclick="editarUsuario(
                    ${u.id},
                    '${u.nome}',
                    '${u.email}',
                    '${u.tipo}'
                    )">

                    Editar

                    </button>




                    <button
                    class="btn btn-danger btn-sm"
                    onclick="apagarUsuario(${u.id})">

                    Apagar

                    </button>


                </td>


            </tr>


            `;



        });



    }


    catch(error){


        console.error(error);


        alert(
            "Erro ao carregar usuários"
        );


    }



}







function mostrarFormularioUsuario(){


    document.getElementById(
        "form-usuario"
    ).style.display =
    "block";


}







async function salvarUsuario(){



    const id =
    document.getElementById(
        "usuario-id"
    ).value;



    const dados = {


        nome:
        document.getElementById(
            "usuario-nome"
        ).value,


        email:
        document.getElementById(
            "usuario-email"
        ).value,


        senha:
        document.getElementById(
            "usuario-senha"
        ).value,


        tipo:
        document.getElementById(
            "usuario-tipo"
        ).value


    };




    let url;

    let metodo;




    if(id){


        url =
        API +
        "/auth/usuarios/" +
        id;


        metodo =
        "PUT";


    }

    else{


        url =
        API +
        "/auth/registro";


        metodo =
        "POST";


    }





    try{


        const resposta =
        await fetch(
            url,
            {

                method:metodo,

                headers:{

                    "Content-Type":
                    "application/json"

                },


                body:
                JSON.stringify(dados)


            }

        );





        const resultado =
        await resposta.json();





        if(resposta.ok){



            document.getElementById(
                "usuario-id"
            ).value = "";



            document.getElementById(
                "usuario-nome"
            ).value = "";



            document.getElementById(
                "usuario-email"
            ).value = "";



            document.getElementById(
                "usuario-senha"
            ).value = "";



            document.getElementById(
                "usuario-tipo"
            ).value = "admin";




            fecharFormularioUsuario();



            carregarUsuarios();



            alert(
                "Usuário salvo com sucesso"
            );



        }

        else{


            alert(
                resultado.detail ||
                "Erro ao salvar usuário"
            );


        }



    }


    catch(error){


        console.error(error);


        alert(
            "Erro de conexão com servidor"
        );


    }



}







function editarUsuario(
id,
nome,
email,
tipo
){



    document.getElementById(
        "usuario-id"
    ).value=id;



    document.getElementById(
        "usuario-nome"
    ).value=nome;



    document.getElementById(
        "usuario-email"
    ).value=email;



    document.getElementById(
        "usuario-tipo"
    ).value=tipo;



    mostrarFormularioUsuario();



}







async function apagarUsuario(id){



    if(!confirm(
        "Deseja apagar este usuário?"
    ))

    return;





    await fetch(

        API +
        "/auth/usuarios/" +
        id,

        {

            method:"DELETE"

        }

    );



    carregarUsuarios();



}







function fecharUsuarios(){



    const painel =
    document.getElementById(
        "usuarios-panel"
    );



    if(painel){

        painel.style.display =
        "none";

    }



    fecharFormularioUsuario();



}







function fecharFormularioUsuario(){



    document.getElementById(
        "form-usuario"
    ).style.display =
    "none";



    document.getElementById(
        "usuario-id"
    ).value="";



    document.getElementById(
        "usuario-nome"
    ).value="";



    document.getElementById(
        "usuario-email"
    ).value="";



    document.getElementById(
        "usuario-senha"
    ).value="";



    document.getElementById(
        "usuario-tipo"
    ).value="admin";


}
