(function () {

    "use strict";


    // =====================================================
    // SERVICE WORKER
    // =====================================================

    if ("serviceWorker" in navigator) {

        window.addEventListener("load", function () {

            navigator.serviceWorker.register(
                "/service-worker.js",
                {
                    scope: "/"
                }
            )
            .then(function (registration) {

                console.log(
                    "PWA: Service Worker registado:",
                    registration.scope
                );

            })
            .catch(function (error) {

                console.error(
                    "PWA: erro ao registar Service Worker:",
                    error
                );

            });

        });

    }


    // =====================================================
    // INSTALAÇÃO
    // =====================================================

    let eventoInstalacao = null;


    window.addEventListener(
        "beforeinstallprompt",
        function (event) {

            event.preventDefault();

            eventoInstalacao = event;

            window.eventoInstalacaoPWA =
                event;

            console.log(
                "PWA: aplicação pronta para instalação."
            );

        }
    );


    // =====================================================
    // FUNÇÃO DE INSTALAÇÃO
    // =====================================================

    window.instalarPWA = async function () {

        if (!eventoInstalacao) {

            alert(
                "A instalação ainda não está disponível neste dispositivo."
            );

            return;

        }


        eventoInstalacao.prompt();


        const resultado =
            await eventoInstalacao.userChoice;


        console.log(
            "PWA: resultado da instalação:",
            resultado.outcome
        );


        eventoInstalacao = null;

        window.eventoInstalacaoPWA =
            null;

    };


    // =====================================================
    // DETECTAR INSTALAÇÃO
    // =====================================================

    window.addEventListener(
        "appinstalled",
        function () {

            console.log(
                "PWA: aplicação instalada."
            );

            eventoInstalacao = null;

            window.eventoInstalacaoPWA =
                null;

        }
    );


    // =====================================================
    // DETECTAR MODO STANDALONE
    // =====================================================

    function verificarModoPWA() {

        const standalone =
            window.matchMedia(
                "(display-mode: standalone)"
            ).matches;


        const iosStandalone =
            window.navigator.standalone === true;


        if (
            standalone ||
            iosStandalone
        ) {

            document.body.classList.add(
                "pwa-standalone"
            );


            console.log(
                "PWA: aberto em modo standalone."
            );

        }

    }


    verificarModoPWA();


})();