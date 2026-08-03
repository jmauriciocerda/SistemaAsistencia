//======================================
// CONFIGURACIÓN
//======================================

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbx-Zj0MiqtbN-h7JB0XIEmyk1LvQtIJM1zol5iqSdJT7NB_IJ2m3_4bc80CCE-HhoZ_/exec";

let html5QrCode = null;
let scannerActivo = false;
let trabajadorActual = null;


//======================================
// INICIO
//======================================

window.onload = () => {

    actualizarFechaHora();

    setInterval(actualizarFechaHora,1000);

    document
        .getElementById("btnScan")
        .addEventListener("click", iniciarScanner);

};


//======================================
// FECHA Y HORA
//======================================

function actualizarFechaHora(){

    const ahora = new Date();

    document.getElementById("fechaHora").innerHTML =
        ahora.toLocaleDateString("es-CL") +
        "<br>" +
        ahora.toLocaleTimeString("es-CL");

}


//======================================
// ABRIR CÁMARA
//======================================

function iniciarScanner(){

    if(scannerActivo) return;

    scannerActivo = true;

    document.getElementById("reader").style.display="block";

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(

        { facingMode:"environment" },

        {

            fps:10,

            qrbox:{
                width:220,
                height:220
            }

        },

        onScanSuccess

    ).catch(error=>{

        console.log(error);

        scannerActivo=false;

        alert("No fue posible abrir la cámara.");

    });

}



//======================================
// QR LEÍDO
//======================================

function onScanSuccess(decodedText){

    detenerScanner();

    let id = "";

    try{

        const url = new URL(decodedText);

        id = url.searchParams.get("ID");

    }catch{

        id = decodedText.trim();

    }

    if(id==""){

        document.getElementById("resultado").innerHTML =
        "QR inválido.";

        return;

    }

    buscarTrabajador(id);

}



//======================================
// CONSULTAR TRABAJADOR
//======================================

function buscarTrabajador(id){

    fetch(URL_SCRIPT+"?ID="+encodeURIComponent(id))

    .then(r=>r.json())

    .then(datos=>{

        if(datos.error){

            document.getElementById("resultado").innerHTML=
            datos.error;

            return;

        }

        trabajadorActual=datos;

        document.getElementById("nombreTrabajador").innerHTML=
        datos.nombre;

        document.getElementById("cargoTrabajador").innerHTML=
        datos.rut;

        document.getElementById("trabajador").style.display="block";

        document.getElementById("btnEntrada").disabled=false;

        document.getElementById("btnSalida").disabled=false;

        document.getElementById("resultado").innerHTML=
        "Trabajador identificado.";

    })

    .catch(error=>{

        console.log(error);

        document.getElementById("resultado").innerHTML=
        "Error consultando trabajador.";

    });

}



//======================================
// REGISTRAR
//======================================

function marcar(tipo){

    if(trabajadorActual==null){

        alert("Primero escanee una credencial.");

        return;

    }

    const ahora=new Date();

    const datos={

        nombre:trabajadorActual.nombre,

        tipo:tipo,

        fecha:ahora.toLocaleDateString("es-CL"),

        hora:ahora.toLocaleTimeString("es-CL")

    };

    fetch(URL_SCRIPT,{

        method:"POST",

        body:JSON.stringify(datos)

    })

    .then(r=>r.text())

    .then(()=>{

        document.getElementById("resultado").innerHTML=
        "✅ "+tipo+" registrada correctamente.";

        limpiarPantalla();

    })

    .catch(error=>{

        console.log(error);

        document.getElementById("resultado").innerHTML=
        "Error al registrar.";

    });

}



//======================================
// DETENER CÁMARA
//======================================

function detenerScanner(){

    if(html5QrCode){

        html5QrCode.stop()

        .then(()=>{

            html5QrCode.clear();

            scannerActivo=false;

            document.getElementById("reader").style.display="none";

        })

        .catch(console.error);

    }

}



//======================================
// REINICIAR
//======================================

function limpiarPantalla(){

    setTimeout(()=>{

        trabajadorActual=null;

        document.getElementById("trabajador").style.display="none";

        document.getElementById("btnEntrada").disabled=true;

        document.getElementById("btnSalida").disabled=true;

        document.getElementById("resultado").innerHTML="";

    },3000);

}
