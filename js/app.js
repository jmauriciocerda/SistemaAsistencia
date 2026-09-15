// ======================================
// SISTEMA DE ASISTENCIA
// LECAROS SPA
// ======================================


// ======================================
// CONFIGURACIÓN
// ======================================

const URL_SCRIPT =
    "https://script.google.com/macros/s/AKfycbz2IrHZN78V8D9iAYytpLsk1fx4JUPc6NAtRDjZ45usOvy1ZmIqfV33erjsu_FA0lSO/exec";


// ======================================
// CONFIGURACIÓN GEOLOCALIZACIÓN
// ======================================

const MODO_PRUEBA = false;

const UBICACION_PLANTA = {
    lat: -33.488593,
    lng: -70.712305
};

const RADIO_PERMITIDO = 500;


// ======================================
// VARIABLES DEL SISTEMA
// ======================================

let html5QrCode = null;

let scannerActivo = false;

let trabajadorActual = null;

let marcando = false;


// ======================================
// INICIO
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        actualizarFechaHora();

        setInterval(
            actualizarFechaHora,
            1000
        );

        configurarScanner();

    }
);


// ======================================
// FECHA Y HORA
// ======================================

function actualizarFechaHora() {

    const elemento =
        document.getElementById(
            "fechaHora"
        );

    if (!elemento) {
        return;
    }

    const ahora =
        new Date();

    const opcionesFecha = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    const fecha =
        ahora.toLocaleDateString(
            "es-CL",
            opcionesFecha
        );

    const hora =
        ahora.toLocaleTimeString(
            "es-CL",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    elemento.innerHTML =
        fecha.charAt(0).toUpperCase() +
        fecha.slice(1) +
        "<br>" +
        hora;

}


// ======================================
// CONFIGURAR BOTÓN SCANNER
// ======================================

function configurarScanner() {

    const boton =
        document.getElementById(
            "btnScan"
        );

    if (!boton) {
        return;
    }

    boton.addEventListener(
        "click",
        function () {

            if (scannerActivo) {

                detenerScanner();

            } else {

                iniciarScanner();

            }

        }
    );

}


// ======================================
// INICIAR SCANNER QR
// ======================================

async function iniciarScanner() {

    const reader =
        document.getElementById(
            "reader"
        );

    if (!reader) {
        return;
    }

    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        mostrarMensaje(
            "No se pudo cargar el lector QR.",
            "error"
        );

        return;

    }

    try {

        html5QrCode =
            new Html5Qrcode(
                "reader"
            );

        const cameras =
            await Html5Qrcode.getCameras();

        if (
            !cameras ||
            cameras.length === 0
        ) {

            mostrarMensaje(
                "No se encontró una cámara disponible.",
                "error"
            );

            return;

        }

        let cameraId =
            cameras[0].id;

        const camaraTrasera =
            cameras.find(
                camera =>
                    camera.label &&
                    (
                        camera.label
                            .toLowerCase()
                            .includes("back") ||
                        camera.label
                            .toLowerCase()
                            .includes("trasera") ||
                        camera.label
                            .toLowerCase()
                            .includes("environment")
                    )
            );

        if (camaraTrasera) {

            cameraId =
                camaraTrasera.id;

        }

        await html5QrCode.start(

            cameraId,

            {
                fps: 10,

                qrbox: {
                    width: 220,
                    height: 220
                }

            },

            onScanSuccess,

            onScanError

        );

        scannerActivo = true;

        const boton =
            document.getElementById(
                "btnScan"
            );

        if (boton) {

            boton.innerHTML =
                "⛔ Detener lector";

        }

    }

    catch (error) {

        console.error(
            "Error iniciando scanner:",
            error
        );

        mostrarMensaje(
            "No fue posible iniciar la cámara.",
            "error"
        );

    }

}


// ======================================
// ERROR DE LECTURA QR
// ======================================

function onScanError(errorMessage) {

    // Se ignoran los errores normales
    // producidos mientras el scanner busca
    // un código QR.

}


// ======================================
// QR ENCONTRADO
// ======================================

async function onScanSuccess(decodedText) {

    if (!decodedText) {
        return;
    }

    console.log(
        "QR detectado:",
        decodedText
    );

    await detenerScanner();

    procesarQR(
        decodedText
    );

}


// ======================================
// PROCESAR QR
// ======================================

async function procesarQR(urlQR) {

    try {

        let id = null;

        try {

            const url =
                new URL(
                    urlQR
                );

            id =
                url.searchParams.get(
                    "ID"
                );

        }

        catch (error) {

            console.log(
                "El contenido QR no es una URL válida."
            );

        }


        // ==================================
        // SI EL QR ES DIRECTAMENTE UN ID
        // ==================================

        if (!id) {

            id =
                urlQR
                    .toString()
                    .trim();

        }


        if (!id) {

            mostrarMensaje(
                "El código QR no contiene un ID válido.",
                "error"
            );

            return;

        }


        mostrarMensaje(
            "Buscando trabajador...",
            "info"
        );


        const respuesta =
            await fetch(
                URL_SCRIPT +
                "?ID=" +
                encodeURIComponent(id)
            );


        if (!respuesta.ok) {

            throw new Error(
                "Error de comunicación con el servidor."
            );

        }


        const datos =
            await respuesta.json();


        console.log(
            "Respuesta QR:",
            datos
        );


        if (
            !datos ||
            datos.error
        ) {

            mostrarMensaje(
                "Trabajador no encontrado.",
                "error"
            );

            return;

        }


        cargarTrabajador(
            datos
        );

    }

    catch (error) {

        console.error(
            "Error procesando QR:",
            error
        );

        mostrarMensaje(
            "No fue posible consultar el trabajador.",
            "error"
        );

    }

}


// ======================================
// BUSCAR TRABAJADOR POR RUT
// ======================================

async function buscarPorRut() {

    const input =
        document.getElementById(
            "rutManual"
        );

    if (!input) {
        return;
    }


    const rut =
        limpiarRut(
            input.value
        );


    if (!rut) {

        mostrarMensaje(
            "Ingrese un RUT.",
            "error"
        );

        return;

    }


    mostrarMensaje(
        "Buscando trabajador...",
        "info"
    );


    const boton =
        document.getElementById(
            "btnRut"
        );

    if (boton) {

        boton.disabled = true;

    }


    try {

        const respuesta =
            await fetch(
                URL_SCRIPT +
                "?RUT=" +
                encodeURIComponent(rut)
            );


        if (!respuesta.ok) {

            throw new Error(
                "Error de comunicación con el servidor."
            );

        }


        const datos =
            await respuesta.json();


        console.log(
            "Respuesta RUT:",
            datos
        );


        if (
            !datos ||
            datos.error
        ) {

            mostrarMensaje(
                "Trabajador no encontrado.",
                "error"
            );

            limpiarTrabajador();

            return;

        }


        cargarTrabajador(
            datos
        );

    }

    catch (error) {

        console.error(
            "Error buscando RUT:",
            error
        );

        mostrarMensaje(
            "No fue posible consultar el trabajador.",
            "error"
        );

    }

    finally {

        if (boton) {

            boton.disabled = false;

        }

    }

}


// ======================================
// LIMPIAR RUT
// ======================================

function limpiarRut(rut) {

    return rut
        .toString()
        .replace(
            /\./g,
            ""
        )
        .replace(
            /-/g,
            ""
        )
        .replace(
            /\s/g,
            ""
        )
        .trim()
        .toUpperCase();

}


// ======================================
// CARGAR TRABAJADOR
// ======================================

function cargarTrabajador(datos) {

    trabajadorActual =
        datos;


    const trabajador =
        document.getElementById(
            "trabajador"
        );

    const nombre =
        document.getElementById(
            "nombreTrabajador"
        );

    const rut =
        document.getElementById(
            "cargoTrabajador"
        );


    if (nombre) {

        nombre.textContent =
            datos.nombre ||
            "";

    }


    if (rut) {

        if (datos.rut) {

            rut.textContent =
                "RUT: " +
                datos.rut;

        } else {

            rut.textContent =
                "";

        }

    }


    if (trabajador) {

        trabajador.classList.remove(
            "oculto"
        );

    }


    habilitarBotones();


    mostrarMensaje(
        "Trabajador identificado correctamente.",
        "success"
    );

}


// ======================================
// HABILITAR ENTRADA / SALIDA
// ======================================

function habilitarBotones() {

    const entrada =
        document.getElementById(
            "btnEntrada"
        );

    const salida =
        document.getElementById(
            "btnSalida"
        );


    if (entrada) {

        entrada.disabled = false;

    }


    if (salida) {

        salida.disabled = false;

    }

}


// ======================================
// MARCAR ENTRADA / SALIDA
// ======================================

function marcar(tipo) {

    if (marcando) {
        return;
    }


    if (!trabajadorActual) {

        mostrarMensaje(
            "Primero debe identificar al trabajador.",
            "error"
        );

        return;

    }


    marcando = true;


    deshabilitarBotones();


    // ==================================
    // OBTENER UBICACIÓN
    // ==================================

    if (MODO_PRUEBA) {

        registrarMarcacion(
            tipo
        );

        return;

    }


    if (
        !navigator.geolocation
    ) {

        mostrarMensaje(
            "Este dispositivo no permite obtener la ubicación.",
            "error"
        );

        marcando = false;

        habilitarBotones();

        return;

    }


    mostrarMensaje(
        "Verificando ubicación...",
        "info"
    );


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            const distancia =
                calcularDistancia(

                    lat,
                    lng,

                    UBICACION_PLANTA.lat,
                    UBICACION_PLANTA.lng

                );


            console.log(
                "Distancia a planta:",
                distancia,
                "metros"
            );


            if (
                distancia >
                RADIO_PERMITIDO
            ) {

                mostrarMensaje(
                    "No se encuentra dentro del área autorizada.",
                    "error"
                );

                marcando = false;

                habilitarBotones();

                return;

            }


            registrarMarcacion(
                tipo
            );

        },


        function (error) {

            console.error(
                "Error de geolocalización:",
                error
            );


            mostrarMensaje(
                "No fue posible obtener su ubicación.",
                "error"
            );


            marcando = false;

            habilitarBotones();

        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );

}


// ======================================
// REGISTRAR MARCACIÓN
// ======================================

async function registrarMarcacion(tipo) {

    try {

        const ahora =
            new Date();


        const fecha =
            obtenerFecha(
                ahora
            );


        const hora =
            obtenerHora(
                ahora
            );


        const datos = {

            nombre:
                trabajadorActual.nombre,

            tipo:
                tipo,

            fecha:
                fecha,

            hora:
                hora

        };


        console.log(
            "Enviando marcación:",
            datos
        );


        mostrarMensaje(
            "Registrando " +
            tipo.toLowerCase() +
            "...",
            "info"
        );


        const respuesta =
            await fetch(

                URL_SCRIPT,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify(
                            datos
                        )

                }

            );


        if (!respuesta.ok) {

            throw new Error(
                "Error al enviar el registro."
            );

        }


        const resultado =
            await respuesta.json();


        console.log(
            "Respuesta registro:",
            resultado
        );


        if (
            !resultado.permitido
        ) {

            mostrarMensaje(
                resultado.mensaje ||
                "No fue posible registrar la marcación.",
                "error"
            );

            marcando = false;

            habilitarBotones();

            return;

        }


        // ==================================
        // MENSAJE DE ÉXITO
        // ==================================

        mostrarMensaje(

            "¡" +
            tipo +
            " registrada correctamente!",

            "success"

        );


        // ==================================
        // MANTENER MENSAJE VISIBLE
        // ==================================

        setTimeout(

            function () {

                limpiarTrabajador();

                marcando = false;

            },

            2500

        );

    }

    catch (error) {

        console.error(
            "Error registrando marcación:",
            error
        );


        mostrarMensaje(
            "No fue posible registrar la marcación.",
            "error"
        );


        marcando = false;

        habilitarBotones();

    }

}


// ======================================
// OBTENER FECHA
// ======================================

function obtenerFecha(fecha) {

    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );

    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const año =
        fecha.getFullYear();


    return (
        dia +
        "/" +
        mes +
        "/" +
        año
    );

}


// ======================================
// OBTENER HORA
// ======================================

function obtenerHora(fecha) {

    const horas =
        String(
            fecha.getHours()
        ).padStart(
            2,
            "0"
        );

    const minutos =
        String(
            fecha.getMinutes()
        ).padStart(
            2,
            "0"
        );

    const segundos =
        String(
            fecha.getSeconds()
        ).padStart(
            2,
            "0"
        );


    return (
        horas +
        ":" +
        minutos +
        ":" +
        segundos
    );

}


// ======================================
// CALCULAR DISTANCIA
// ======================================

function calcularDistancia(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R =
        6371000;


    const rad =
        Math.PI /
        180;


    const dLat =
        (
            lat2 -
            lat1
        ) *
        rad;


    const dLon =
        (
            lon2 -
            lon1
        ) *
        rad;


    const a =
        Math.sin(
            dLat / 2
        ) *
        Math.sin(
            dLat / 2
        ) +

        Math.cos(
            lat1 * rad
        ) *
        Math.cos(
            lat2 * rad
        ) *

        Math.sin(
            dLon / 2
        ) *
        Math.sin(
            dLon / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


// ======================================
// MOSTRAR MENSAJE
// ======================================

function mostrarMensaje(
    texto,
    tipo = "info"
) {

    // ==================================
    // IMPORTANTE:
    // EL INDEX USA id="resultado"
    // ==================================

    const elemento =
        document.getElementById(
            "resultado"
        );


    if (!elemento) {

        console.error(
            "No existe el elemento #resultado en index.html"
        );

        return;

    }


    // ==================================
    // LIMPIAR CLASES ANTERIORES
    // ==================================

    elemento.classList.remove(
        "success",
        "error",
        "info"
    );


    // ==================================
    // ASIGNAR NUEVA CLASE
    // ==================================

    elemento.classList.add(
        tipo
    );


    // ==================================
    // MOSTRAR TEXTO
    // ==================================

    elemento.textContent =
        texto;


    // ==================================
    // ASEGURAR VISIBILIDAD
    // ==================================

    elemento.style.display =
        "block";

}


// ======================================
// DESHABILITAR BOTONES
// ======================================

function deshabilitarBotones() {

    const entrada =
        document.getElementById(
            "btnEntrada"
        );

    const salida =
        document.getElementById(
            "btnSalida"
        );


    if (entrada) {

        entrada.disabled = true;

    }


    if (salida) {

        salida.disabled = true;

    }

}


// ======================================
// LIMPIAR TRABAJADOR
// ======================================

function limpiarTrabajador() {

    trabajadorActual =
        null;


    const trabajador =
        document.getElementById(
            "trabajador"
        );


    const nombre =
        document.getElementById(
            "nombreTrabajador"
        );


    const rut =
        document.getElementById(
            "cargoTrabajador"
        );


    const rutManual =
        document.getElementById(
            "rutManual"
        );


    if (trabajador) {

        trabajador.classList.add(
            "oculto"
        );

    }


    if (nombre) {

        nombre.textContent =
            "";

    }


    if (rut) {

        rut.textContent =
            "";

    }


    if (rutManual) {

        rutManual.value =
            "";

    }


    deshabilitarBotones();


    // ==================================
    // LIMPIAR MENSAJE
    // ==================================

    const resultado =
        document.getElementById(
            "resultado"
        );


    if (resultado) {

        resultado.textContent =
            "";

        resultado.classList.remove(
            "success",
            "error",
            "info"
        );

    }


    marcando =
        false;

}


// ======================================
// DETENER SCANNER
// ======================================

async function detenerScanner() {

    if (
        !html5QrCode ||
        !scannerActivo
    ) {

        return;

    }


    try {

        await html5QrCode.stop();

        html5QrCode.clear();

    }

    catch (error) {

        console.error(
            "Error deteniendo scanner:",
            error
        );

    }


    html5QrCode =
        null;

    scannerActivo =
        false;


    const boton =
        document.getElementById(
            "btnScan"
        );


    if (boton) {

        boton.innerHTML =
            "📷 Escanear credencial";

    }

}
