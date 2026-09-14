//======================================
// CONFIGURACIÓN
//======================================

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzr3jgLZLJKl1ecUOKbb_O9eHwd0SeGMy0_dGSxkvK7UgQzm5MwKV6uEeRRtFEUXSnU/exec";

//======================================
// CONFIGURACIÓN GEOLOCALIZACIÓN
//======================================

const MODO_PRUEBA = true;

const UBICACION_PLANTA = {
    lat: -33.488593,
    lng: -70.712305
};

const RADIO_PERMITIDO = 500;

//======================================
// VARIABLES GLOBALES
//======================================

let html5QrCode = null;
let scannerActivo = false;
let trabajadorActual = null;

//======================================
// INICIO
//======================================

window.onload = () => {

    actualizarFechaHora();

    setInterval(actualizarFechaHora, 1000);

    document
        .getElementById("btnScan")
        .addEventListener("click", iniciarScanner);

};

//======================================
// FECHA Y HORA
//======================================

function actualizarFechaHora() {

    const ahora = new Date();

    document.getElementById("fechaHora").innerHTML =
        ahora.toLocaleDateString("es-CL") +
        "<br>" +
        ahora.toLocaleTimeString("es-CL");

}

//======================================
// INICIAR LECTOR QR
//======================================

function iniciarScanner() {

    if (scannerActivo) return;

    scannerActivo = true;

    document.getElementById("reader").style.display = "block";

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        {
            facingMode: {
                ideal: "environment"
            }
        },
        {
            fps: 15,
            qrbox: {
                width: 300,
                height: 300
            },
            aspectRatio: 1.777,
            videoConstraints: {
                width: {
                    ideal: 1920
                },
                height: {
                    ideal: 1080
                },
                facingMode: "environment"
            }
        },
        onScanSuccess
    )
    .catch(error => {

        console.log(error);

        scannerActivo = false;

        document.getElementById("reader").style.display = "none";

        alert("No fue posible abrir la cámara.");

    });

}

//======================================
// QR DETECTADO
//======================================

function onScanSuccess(decodedText) {

    detenerScanner();

    let identificador = "";

    try {

        const url = new URL(decodedText);

        identificador = url.searchParams.get("ID");

    }
    catch {

        identificador = decodedText.trim();

    }

    if (!identificador) {

        document.getElementById("resultado").innerHTML =
            "⚠️ QR inválido.";

        return;

    }

    identificarTrabajador("ID", identificador);

}

//======================================
// BUSCAR POR RUT
//======================================

function buscarPorRut() {

    let rut = document
        .getElementById("rutManual")
        .value;

    rut = normalizarRut(rut);

    if (rut === "") {

        document.getElementById("resultado").innerHTML =
            "⚠️ Ingrese un RUT.";

        return;

    }

    identificarTrabajador("RUT", rut);

}

//======================================
// IDENTIFICACIÓN TRABAJADOR
//======================================

function identificarTrabajador(tipo, valor) {

    let consulta = "";

    if (tipo === "ID") {

        consulta =
            "?ID=" +
            encodeURIComponent(valor);

    }

    if (tipo === "RUT") {

        consulta =
            "?RUT=" +
            encodeURIComponent(valor);

    }

    //==================================
    // EVITAR CACHÉ DEL NAVEGADOR
    //==================================

    const urlConsulta =
        URL_SCRIPT +
        consulta +
        "&_=" +
        Date.now();

    console.log(
        "Consulta:",
        urlConsulta
    );

    document.getElementById("resultado").innerHTML =
        "🔎 Buscando trabajador...";

    //==================================
    // CONSULTA
    //==================================

    fetch(urlConsulta, {

        method: "GET",

        cache: "no-store",

        redirect: "follow"

    })

    .then(respuesta => {

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

    .then(texto => {

        console.log(
            "Respuesta recibida:",
            texto
        );

        //==================================
        // VALIDAR RESPUESTA VACÍA
        //==================================

        if (!texto || texto.trim() === "") {

            throw new Error(
                "El servidor no devolvió información."
            );

        }

        //==================================
        // INTENTAR CONVERTIR A JSON
        //==================================

        let datos;

        try {

            datos = JSON.parse(texto);

        }
        catch (error) {

            console.error(
                "La respuesta NO es JSON:",
                texto
            );

            throw new Error(
                "El servidor devolvió una respuesta que no es JSON."
            );

        }

        console.log(
            "Respuesta JSON:",
            datos
        );

        //==================================
        // ERROR DEVUELTO POR APPS SCRIPT
        //==================================

        if (datos.error) {

            document.getElementById("resultado").innerHTML =
                "⚠️ " + datos.error;

            return;

        }

        //==================================
        // MOSTRAR TRABAJADOR
        //==================================

        mostrarTrabajador(datos);

    })

    .catch(error => {

        console.error(
            "Error consultando trabajador:",
            error
        );

        document.getElementById("resultado").innerHTML =
            "❌ No fue posible consultar al trabajador.";

    });

}

//======================================
// MOSTRAR TRABAJADOR
//======================================

function mostrarTrabajador(datos) {

    trabajadorActual = datos;

    document.getElementById("nombreTrabajador").innerHTML =
        datos.nombre;

    document.getElementById("cargoTrabajador").innerHTML =
        "RUT: " + datos.rut;

    document.getElementById("trabajador").style.display =
        "block";

    document.getElementById("btnEntrada").disabled =
        false;

    document.getElementById("btnSalida").disabled =
        false;

    document.getElementById("resultado").innerHTML =
        "✅ Trabajador identificado.";

}

//======================================
// NORMALIZAR RUT
//======================================

function normalizarRut(rut) {

    return rut
        .toString()
        .replace(/\./g, "")
        .replace(/-/g, "")
        .replace(/\s/g, "")
        .toUpperCase();

}

//======================================
// MARCAR ENTRADA / SALIDA
//======================================

function marcar(tipo) {

    if (trabajadorActual === null) {

        document.getElementById("resultado").innerHTML =
            "⚠️ Primero identifique al trabajador.";

        return;

    }

    //==================================
    // SI ES SALIDA
    // PEDIR OF ANTES DE CONTINUAR
    //==================================

    if (tipo === "Salida") {

        mostrarFormularioOF();

        return;

    }

    //==================================
    // ENTRADA
    //==================================

    ejecutarMarcacion("Entrada", "");

}

//======================================
// MOSTRAR FORMULARIO OF
//======================================

function mostrarFormularioOF() {

    const formulario =
        document.getElementById("formularioOF");

    if (formulario) {

        formulario.style.display = "block";

    }

    document
        .getElementById("ofManual")
        .focus();

}

//======================================
// CANCELAR FORMULARIO OF
//======================================

function cancelarSalida() {

    const formulario =
        document.getElementById("formularioOF");

    if (formulario) {

        formulario.style.display = "none";

    }

    document.getElementById("ofManual").value = "";

}

//======================================
// CONFIRMAR SALIDA
//======================================

function confirmarSalida() {

    const campoOF =
        document.getElementById("ofManual");

    const of =
        campoOF.value.trim();

    //==================================
    // VALIDAR OF
    //==================================

    if (of === "") {

        document.getElementById("resultado").innerHTML =
            "⚠️ Debe ingresar la OF.";

        campoOF.focus();

        return;

    }

    //==================================
    // VALIDAR QUE SEA NUMÉRICA
    //==================================

    if (!/^\d+$/.test(of)) {

        document.getElementById("resultado").innerHTML =
            "⚠️ La OF debe contener solamente números.";

        campoOF.focus();

        return;

    }

    //==================================
    // OCULTAR FORMULARIO
    //==================================

    const formulario =
        document.getElementById("formularioOF");

    if (formulario) {

        formulario.style.display = "none";

    }

    //==================================
    // EJECUTAR SALIDA
    //==================================

    ejecutarMarcacion("Salida", of);

}

//======================================
// EJECUTAR MARCACIÓN
//======================================

function ejecutarMarcacion(tipo, of) {

    if (trabajadorActual === null) {

        document.getElementById("resultado").innerHTML =
            "⚠️ Primero identifique al trabajador.";

        return;

    }

    const ahora = new Date();

    const datos = {

        nombre: trabajadorActual.nombre,

        tipo: tipo,

        fecha: ahora.toLocaleDateString("es-CL"),

        hora: ahora.toLocaleTimeString("es-CL"),

        OF: of

    };

    document.getElementById("resultado").innerHTML =
        "📍 Validando ubicación...";

    document.getElementById("btnEntrada").disabled =
        true;

    document.getElementById("btnSalida").disabled =
        true;

    validarUbicacion()

        .then(permitido => {

            if (!permitido) {

                document.getElementById("btnEntrada").disabled =
                    false;

                document.getElementById("btnSalida").disabled =
                    false;

                return;

            }

            enviarRegistro(datos);

        });

}

//======================================
// VALIDAR UBICACIÓN GPS
//======================================

function validarUbicacion() {

    return new Promise((resolve) => {

        if (MODO_PRUEBA === true) {

            console.log(
                "🧪 MODO PRUEBA ACTIVO - GPS OMITIDO"
            );

            document.getElementById("resultado").innerHTML =
                "🧪 Modo prueba activo.<br>Validación GPS omitida.";

            resolve(true);

            return;

        }

        if (!navigator.geolocation) {

            document.getElementById("resultado").innerHTML =
                "❌ Ubicación no disponible.";

            resolve(false);

            return;

        }

        navigator.geolocation.getCurrentPosition(

            posicion => {

                const distancia =
                    calcularDistancia(
                        posicion.coords.latitude,
                        posicion.coords.longitude,
                        UBICACION_PLANTA.lat,
                        UBICACION_PLANTA.lng
                    );

                console.log(
                    "Distancia planta:",
                    Math.round(distancia),
                    "metros"
                );

                if (distancia <= RADIO_PERMITIDO) {

                    resolve(true);

                }
                else {

                    document.getElementById("resultado").innerHTML =
                        "❌ Fuera de zona autorizada.<br>" +
                        "Distancia: " +
                        Math.round(distancia) +
                        " metros";

                    resolve(false);

                }

            },

            error => {

                console.log(error);

                document.getElementById("resultado").innerHTML =
                    "⚠️ Active la ubicación para marcar asistencia.";

                resolve(false);

            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        );

    });

}

//======================================
// CALCULAR DISTANCIA
//======================================

function calcularDistancia(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;

    const dLon =
        (lon2 - lon1) *
        Math.PI /
        180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)
        +
        Math.cos(lat1 * Math.PI / 180)
        *
        Math.cos(lat2 * Math.PI / 180)
        *
        Math.sin(dLon / 2)
        *
        Math.sin(dLon / 2);

    return R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

}

//======================================
// ENVIAR REGISTRO A APPS SCRIPT
//======================================

function enviarRegistro(datos) {

    fetch(URL_SCRIPT, {

        method: "POST",

        body: JSON.stringify(datos)

    })

    .then(respuesta =>
        respuesta.json()
    )

    .then(resultado => {

        console.log(
            "Respuesta registro:",
            resultado
        );

        if (resultado.permitido === false) {

            document.getElementById("resultado").innerHTML =
                "⚠️ " + resultado.mensaje;

            document.getElementById("btnEntrada").disabled =
                false;

            document.getElementById("btnSalida").disabled =
                false;

            return;

        }

        document.getElementById("resultado").innerHTML =
            "✅ Registro realizado correctamente.<br>" +
            trabajadorActual.nombre;

        limpiarPantalla();

    })

    .catch(error => {

        console.log(error);

        document.getElementById("resultado").innerHTML =
            "❌ Error al registrar.";

        document.getElementById("btnEntrada").disabled =
            false;

        document.getElementById("btnSalida").disabled =
            false;

    });

}

//======================================
// DETENER CÁMARA
//======================================

function detenerScanner() {

    if (html5QrCode) {

        html5QrCode.stop()

            .then(() => {

                html5QrCode.clear();

                scannerActivo = false;

                document.getElementById("reader").style.display =
                    "none";

            })

            .catch(error => {

                console.log(error);

            });

    }

}

//======================================
// LIMPIAR PANTALLA
//======================================

function limpiarPantalla() {

    setTimeout(() => {

        trabajadorActual = null;

        document.getElementById("trabajador").style.display =
            "none";

        document.getElementById("btnEntrada").disabled =
            true;

        document.getElementById("btnSalida").disabled =
            true;

        document.getElementById("rutManual").value =
            "";

        const campoOF =
            document.getElementById("ofManual");

        if (campoOF) {

            campoOF.value = "";

        }

        const formulario =
            document.getElementById("formularioOF");

        if (formulario) {

            formulario.style.display = "none";

        }

        document.getElementById("resultado").innerHTML =
            "";

    }, 5000);

}
