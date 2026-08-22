document.addEventListener("DOMContentLoaded",()=>{


    const botao =
    document.querySelector(".menu-btn");


    const sidebar =
    document.querySelector(".sidebar");


    if(!botao || !sidebar)
        return;



    botao.addEventListener("click",()=>{


        sidebar.classList.toggle(
            "mobile-open"
        );


    });



});
