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
// INICIAR LECTOR QR
//======================================

function iniciarScanner(){

    if(scannerActivo) return;


    scannerActivo=true;


    document.getElementById("reader").style.display="block";


    html5QrCode = new Html5Qrcode("reader");



    html5QrCode.start(

        {facingMode:"environment"},


        {

            fps:10,

            qrbox:{
                width:220,
                height:220
            }

        },


        onScanSuccess


    )


    .catch(error=>{

        console.log(error);

        scannerActivo=false;

        alert("No fue posible abrir la cámara.");

    });


}



//======================================
// QR DETECTADO
//======================================

function onScanSuccess(decodedText){


    detenerScanner();


    let identificador="";


    try{

        const url = new URL(decodedText);

        identificador=url.searchParams.get("ID");


    }


    catch{

        identificador=decodedText.trim();

    }



    if(!identificador){


        document.getElementById("resultado").innerHTML=

        "⚠️ QR inválido.";


        return;

    }



    identificarTrabajador("ID",identificador);


}



//======================================
// BUSCAR POR RUT
//======================================

function buscarPorRut(){


    let rut=document
        .getElementById("rutManual")
        .value;



    rut=normalizarRut(rut);



    if(rut===""){


        document.getElementById("resultado").innerHTML=

        "⚠️ Ingrese un RUT.";


        return;

    }



    identificarTrabajador("RUT",rut);


}



//======================================
// IDENTIFICACIÓN CENTRAL
//======================================

function identificarTrabajador(tipo,valor){


    let consulta="";



    if(tipo==="ID"){


        consulta="?ID="+encodeURIComponent(valor);


    }



    if(tipo==="RUT"){


        consulta="?RUT="+encodeURIComponent(valor);


    }



    // =================================
    // PRUEBA DEBUG
    // =================================

    console.log("----------------------------");

    console.log("TIPO CONSULTA:", tipo);

    console.log("VALOR ENVIADO:", valor);

    console.log("URL CONSULTADA:", URL_SCRIPT + consulta);

    console.log("----------------------------");



    fetch(URL_SCRIPT+consulta)



    .then(respuesta=>respuesta.json())



    .then(datos=>{


        console.log("RESPUESTA APPS SCRIPT:",datos);



        if(datos.error){


            document.getElementById("resultado").innerHTML=

            "⚠️ "+datos.error;


            return;

        }



        mostrarTrabajador(datos);


    })



    .catch(error=>{


        console.log(error);


        document.getElementById("resultado").innerHTML=

        "❌ Error consultando trabajador.";


    });


}



//======================================
// MOSTRAR TRABAJADOR
//======================================

function mostrarTrabajador(datos){


    trabajadorActual=datos;



    document.getElementById("nombreTrabajador").innerHTML=

    datos.nombre;



    document.getElementById("cargoTrabajador").innerHTML=

    "RUT: "+datos.rut;



    document.getElementById("trabajador")
    .style.display="block";



    document.getElementById("btnEntrada")
    .disabled=false;



    document.getElementById("btnSalida")
    .disabled=false;



    document.getElementById("resultado").innerHTML=

    "✅ Trabajador identificado.";

}



//======================================
// NORMALIZAR RUT
//======================================

function normalizarRut(rut){


    return rut

        .toString()

        .replace(/\./g,"")

        .replace(/-/g,"")

        .replace(/\s/g,"")

        .toUpperCase();


}



//======================================
// REGISTRAR ENTRADA / SALIDA
//======================================

function marcar(tipo){


    if(trabajadorActual==null){


        document.getElementById("resultado").innerHTML=

        "⚠️ Primero identifique al trabajador.";


        return;

    }



    const ahora=new Date();



    const datos={


        nombre:trabajadorActual.nombre,


        tipo:tipo,


        fecha:ahora.toLocaleDateString("es-CL"),


        hora:ahora.toLocaleTimeString("es-CL")


    };



    document.getElementById("resultado").innerHTML=

    "⏳ Registrando "+tipo.toLowerCase()+"...";



    document.getElementById("btnEntrada").disabled=true;

    document.getElementById("btnSalida").disabled=true;



    fetch(URL_SCRIPT,{

        method:"POST",

        body:JSON.stringify(datos)

    })



    .then(respuesta=>respuesta.text())



    .then(()=>{


        document.getElementById("resultado").innerHTML=

        "✅ "+tipo+" registrada correctamente.<br>"+

        trabajadorActual.nombre+"<br>"+

        ahora.toLocaleTimeString("es-CL");



        limpiarPantalla();


    })



    .catch(error=>{


        console.log(error);



        document.getElementById("resultado").innerHTML=

        "❌ Error al registrar.";



        document.getElementById("btnEntrada").disabled=false;

        document.getElementById("btnSalida").disabled=false;


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


            document.getElementById("reader")
            .style.display="none";


        })


        .catch(error=>{

            console.log(error);

        });


    }


}



//======================================
// LIMPIAR PANTALLA
//======================================

function limpiarPantalla(){


    setTimeout(()=>{


        trabajadorActual=null;


        document.getElementById("trabajador")
        .style.display="none";


        document.getElementById("btnEntrada")
        .disabled=true;


        document.getElementById("btnSalida")
        .disabled=true;


        document.getElementById("rutManual")
        .value="";


        document.getElementById("resultado")
        .innerHTML="";


    },5000);


}
