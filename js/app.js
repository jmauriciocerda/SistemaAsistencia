// ======================================
// CONFIGURACIÓN
// ======================================

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwfPL79OmrrL0DWEhcnF0yCAwdFmXINiHJbw_e9wyXVwgGrJqEH-i9dmXQJOXognevf/exec";


// ======================================
// CONFIGURACIÓN GEOLOCALIZACIÓN
// ======================================

const MODO_PRUEBA = true;

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


// ======================================
// INICIO
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Sistema de asistencia iniciado.");

    iniciarScanner();

});


// ======================================
// INICIAR ESCÁNER QR
// ======================================

function iniciarScanner() {

    const elementoScanner =
        document.getElementById("reader");

    if (!elementoScanner) {

        console.error(
            "No se encontró el elemento #reader."
        );

        return;

    }

    html5QrCode =
        new Html5Qrcode("reader");

    Html5QrCode.getCameras()
        .then(function (cameras) {

            if (!cameras || cameras.length === 0) {

                mostrarMensaje(
                    "No se encontró ninguna cámara.",
                    "error"
                );

                return;

            }

            const camara =
                cameras.find(function (camera) {

                    return camera.label
                        .toLowerCase()
                        .includes("back");

                }) || cameras[0];

            iniciarCamara(camara.id);

        })
        .catch(function (error) {

            console.error(
                "Error obteniendo cámaras:",
                error
            );

            mostrarMensaje(
                "No fue posible acceder a la cámara.",
                "error"
            );

        });

}


// ======================================
// ACTIVAR CÁMARA
// ======================================

function iniciarCamara(cameraId) {

    html5QrCode
        .start(
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
        )
        .then(function () {

            scannerActivo = true;

            console.log(
                "Escáner QR iniciado."
            );

        })
        .catch(function (error) {

            console.error(
                "Error iniciando escáner:",
                error
            );

            mostrarMensaje(
                "No fue posible iniciar la cámara.",
                "error"
            );

        });

}


// ======================================
// RESULTADO ESCANEO QR
// ======================================

function onScanSuccess(
    decodedText,
    decodedResult
) {

    if (!scannerActivo) {

        return;

    }

    console.log(
        "QR detectado:",
        decodedText
    );


    // Evitar múltiples lecturas consecutivas
    scannerActivo = false;


    // ==================================
    // INTENTAR OBTENER ID DESDE URL
    // ==================================

    let id = "";

    try {

        const url =
            new URL(decodedText);

        id =
            url.searchParams.get("ID") || "";

    }

    catch (error) {

        console.log(
            "El QR no contiene una URL válida."
        );

    }


    // ==================================
    // SI NO SE OBTUVO ID,
    // UTILIZAR EL TEXTO DIRECTAMENTE
    // ==================================

    if (!id) {

        id =
            decodeURIComponent(
                decodedText
            ).trim();

    }


    if (!id) {

        mostrarMensaje(
            "El código QR no contiene un ID válido.",
            "error"
        );

        reactivarScanner();

        return;

    }


    identificarTrabajador(
        "ID",
        id
    );

}


// ======================================
// ERROR DE ESCANEO
// ======================================

function onScanError(errorMessage) {

    // No mostrar errores normales del escáner.
    // html5-qrcode genera muchos mientras busca un QR.

}


// ======================================
// BUSCAR TRABAJADOR POR RUT
// ======================================

function buscarPorRut() {

    const campo =
        document.getElementById(
            "rutManual"
        );


    if (!campo) {

        console.error(
            "No se encontró #rutManual."
        );

        return;

    }


    const rut =
        normalizarRut(
            campo.value
        );


    if (!rut) {

        mostrarMensaje(
            "Ingrese un RUT.",
            "error"
        );

        return;

    }


    console.log(
        "Buscando RUT:",
        rut
    );


    identificarTrabajador(
        "RUT",
        rut
    );

}


// ======================================
// NORMALIZAR RUT
// ======================================

function normalizarRut(rut) {

    return rut
        .toString()
        .replace(/\./g, "")
        .replace(/-/g, "")
        .replace(/\s/g, "")
        .trim()
        .toUpperCase();

}


// ======================================
// IDENTIFICAR TRABAJADOR
// ======================================

function identificarTrabajador(
    tipoBusqueda,
    valor
) {

    let urlConsulta =
        URL_SCRIPT;


    // ==================================
    // CONSTRUIR CONSULTA
    // ==================================

    if (
        tipoBusqueda === "ID"
    ) {

        urlConsulta +=
            "?ID=" +
            encodeURIComponent(
                valor
            );

    }


    else if (
        tipoBusqueda === "RUT"
    ) {

        urlConsulta +=
            "?RUT=" +
            encodeURIComponent(
                valor
            );

    }


    console.log(
        "Consultando:",
        urlConsulta
    );


    // ==================================
    // MOSTRAR ESTADO
    // ==================================

    mostrarMensaje(
        "Buscando trabajador...",
        "info"
    );


    fetch(
        urlConsulta,
        {
            method: "GET",
            cache: "no-store",
            redirect: "follow"
        }
    )

    .then(function (respuesta) {

        console.log(
            "HTTP:",
            respuesta.status,
            respuesta.statusText
        );

        console.log(
            "URL final:",
            respuesta.url
        );


        return respuesta.text();

    })

    .then(function (texto) {

        console.log(
            "Respuesta recibida:",
            texto
        );


        if (
            !texto ||
            texto.trim() === ""
        ) {

            throw new Error(
                "El servidor no devolvió información."
            );

        }


        let datos;


        try {

            datos =
                JSON.parse(
                    texto
                );

        }

        catch (error) {

            console.error(
                "Respuesta no JSON:",
                texto
            );

            throw new Error(
                "El servidor devolvió una respuesta que no es JSON."
            );

        }


        // ==================================
        // ERROR DEL SERVIDOR
        // ==================================

        if (datos.error) {

            mostrarMensaje(
                datos.error,
                "error"
            );

            trabajadorActual =
                null;

            reactivarScanner();

            return;

        }


        // ==================================
        // TRABAJADOR ENCONTRADO
        // ==================================

        mostrarTrabajador(
            datos
        );

    })

    .catch(function (error) {

        console.error(
            "Error consultando trabajador:",
            error
        );


        trabajadorActual =
            null;


        mostrarMensaje(
            error.message ||
            "No fue posible consultar al trabajador.",
            "error"
        );


        reactivarScanner();

    });

}


// ======================================
// MOSTRAR TRABAJADOR
// ======================================

function mostrarTrabajador(
    datos
) {

    trabajadorActual =
        datos;


    console.log(
        "Trabajador identificado:",
        datos
    );


    // ==================================
    // NOMBRE
    // ==================================

    const elementoNombre =
        document.getElementById(
            "nombreTrabajador"
        );


    if (elementoNombre) {

        elementoNombre.textContent =
            datos.nombre || "";

    }


    // ==================================
    // RUT
    // ==================================

    const elementoRut =
        document.getElementById(
            "rutTrabajador"
        );


    if (elementoRut) {

        elementoRut.textContent =
            datos.rut || "";

    }


    // ==================================
    // MOSTRAR PANEL TRABAJADOR
    // ==================================

    const trabajador =
        document.getElementById(
            "trabajador"
        );


    if (trabajador) {

        trabajador.style.display =
            "block";

    }


    // ==================================
    // OCULTAR MENSAJE DE BÚSQUEDA
    // ==================================

    const mensaje =
        document.getElementById(
            "mensaje"
        );


    if (mensaje) {

        mensaje.textContent =
            "";

    }


    // ==================================
    // ACTIVAR BOTONES
    // ==================================

    const botonEntrada =
        document.getElementById(
            "btnEntrada"
        );


    const botonSalida =
        document.getElementById(
            "btnSalida"
        );


    if (botonEntrada) {

        botonEntrada.disabled =
            false;

    }


    if (botonSalida) {

        botonSalida.disabled =
            false;

    }

}


// ======================================
// MARCAR ENTRADA / SALIDA
// ======================================

function marcar(tipo) {

    if (!trabajadorActual) {

        mostrarMensaje(
            "Primero debe identificar al trabajador.",
            "error"
        );

        return;

    }


    console.log(
        "Marcación solicitada:",
        tipo
    );


    // ==================================
    // ENTRADA
    // ==================================

    if (
        tipo === "Entrada"
    ) {

        ejecutarMarcacion(
            "Entrada"
        );

        return;

    }


    // ==================================
    // SALIDA
    // ==================================

    if (
        tipo === "Salida"
    ) {

        ejecutarMarcacion(
            "Salida"
        );

        return;

    }

}


// ======================================
// EJECUTAR MARCACIÓN
// ======================================

function ejecutarMarcacion(
    tipo
) {

    if (!trabajadorActual) {

        mostrarMensaje(
            "No hay un trabajador identificado.",
            "error"
        );

        return;

    }


    // ==================================
    // FECHA Y HORA
    // ==================================

    const ahora =
        new Date();


    const datos = {

        nombre:
            trabajadorActual.nombre,

        tipo:
            tipo,

        fecha:
            ahora.toLocaleDateString(
                "es-CL"
            ),

        hora:
            ahora.toLocaleTimeString(
                "es-CL"
            )

    };


    console.log(
        "Datos de marcación:",
        datos
    );


    // ==================================
    // VALIDAR UBICACIÓN
    // ==================================

    validarUbicacion(
        function () {

            enviarRegistro(
                datos
            );

        }
    );

}


// ======================================
// VALIDAR GEOLOCALIZACIÓN
// ======================================

function validarUbicacion(
    callback
) {

    // ==================================
    // MODO PRUEBA
    // ==================================

    if (MODO_PRUEBA) {

        console.log(
            "MODO_PRUEBA activo. Se omite validación GPS."
        );

        callback();

        return;

    }


    // ==================================
    // VERIFICAR SOPORTE
    // ==================================

    if (
        !navigator.geolocation
    ) {

        mostrarMensaje(
            "Este dispositivo no permite obtener la ubicación.",
            "error"
        );

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


            console.log(
                "Ubicación actual:",
                lat,
                lng
            );


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
                    "Se encuentra fuera del área permitida para marcar asistencia.",
                    "error"
                );

                return;

            }


            callback();

        },


        function (error) {

            console.error(
                "Error obteniendo ubicación:",
                error
            );


            mostrarMensaje(
                "No fue posible obtener su ubicación. Active el GPS y vuelva a intentar.",
                "error"
            );

        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

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
        Math.PI / 180;


    const dLat =
        (lat2 - lat1) *
        rad;


    const dLon =
        (lon2 - lon1) *
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
// ENVIAR REGISTRO
// ======================================

function enviarRegistro(
    datos
) {

    mostrarMensaje(
        "Registrando asistencia...",
        "info"
    );


    fetch(
        URL_SCRIPT,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "text/plain;charset=utf-8"
            },

            body:
                JSON.stringify(
                    datos
                )
        }
    )

    .then(function (respuesta) {

        console.log(
            "HTTP registro:",
            respuesta.status
        );


        return respuesta.text();

    })

    .then(function (texto) {

        console.log(
            "Respuesta registro:",
            texto
        );


        if (
            !texto ||
            texto.trim() === ""
        ) {

            throw new Error(
                "El servidor no devolvió una respuesta."
            );

        }


        let respuesta;


        try {

            respuesta =
                JSON.parse(
                    texto
                );

        }

        catch (error) {

            console.error(
                "Respuesta no JSON:",
                texto
            );

            throw new Error(
                "El servidor devolvió una respuesta inválida."
            );

        }


        // ==================================
        // REGISTRO CORRECTO
        // ==================================

        if (
            respuesta.permitido === true
        ) {

            mostrarMensaje(
                "¡" +
                datos.tipo +
                " registrada correctamente!",
                "success"
            );


            limpiarTrabajador();


            return;

        }


        // ==================================
        // REGISTRO RECHAZADO
        // ==================================

        mostrarMensaje(
            respuesta.mensaje ||
            "No fue posible registrar la asistencia.",
            "error"
        );


        reactivarScanner();

    })

    .catch(function (error) {

        console.error(
            "Error registrando asistencia:",
            error
        );


        mostrarMensaje(
            error.message ||
            "No fue posible registrar la asistencia.",
            "error"
        );


        reactivarScanner();

    });

}


// ======================================
// LIMPIAR TRABAJADOR
// ======================================

function limpiarTrabajador() {

    trabajadorActual =
        null;


    // ==================================
    // OCULTAR INFORMACIÓN
    // ==================================

    const trabajador =
        document.getElementById(
            "trabajador"
        );


    if (trabajador) {

        trabajador.style.display =
            "none";

    }


    // ==================================
    // LIMPIAR NOMBRE
    // ==================================

    const nombre =
        document.getElementById(
            "nombreTrabajador"
        );


    if (nombre) {

        nombre.textContent =
            "";

    }


    // ==================================
    // LIMPIAR RUT
    // ==================================

    const rut =
        document.getElementById(
            "rutTrabajador"
        );


    if (rut) {

        rut.textContent =
            "";

    }


    // ==================================
    // LIMPIAR RUT MANUAL
    // ==================================

    const rutManual =
        document.getElementById(
            "rutManual"
        );


    if (rutManual) {

        rutManual.value =
            "";

    }


    // ==================================
    // DESACTIVAR BOTONES
    // ==================================

    const botonEntrada =
        document.getElementById(
            "btnEntrada"
        );


    const botonSalida =
        document.getElementById(
            "btnSalida"
        );


    if (botonEntrada) {

        botonEntrada.disabled =
            true;

    }


    if (botonSalida) {

        botonSalida.disabled =
            true;

    }


    // ==================================
    // REACTIVAR ESCÁNER
    // ==================================

    reactivarScanner();

}


// ======================================
// REACTIVAR ESCÁNER
// ======================================

function reactivarScanner() {

    setTimeout(
        function () {

            scannerActivo =
                true;

        },
        1000
    );

}


// ======================================
// MOSTRAR MENSAJE
// ======================================

function mostrarMensaje(
    mensaje,
    tipo
) {

    const elemento =
        document.getElementById(
            "mensaje"
        );


    if (!elemento) {

        console.log(
            mensaje
        );

        return;

    }


    elemento.textContent =
        mensaje;


    elemento.className =
        "";


    if (tipo) {

        elemento.classList.add(
            tipo
        );

    }

}
