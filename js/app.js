//======================================
// CONFIGURACIÓN
//======================================

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzr3jgLZLJKl1ecUOKbb_O9eHwd0SeGMy0_dGSxkvK7UgQzm5MwKV6uEeRRtFEUXSnU/exec";


//======================================
// CONFIGURACIÓN GEOLOCALIZACIÓN
//======================================

// TRUE = pruebas fuera de planta
// FALSE = funcionamiento real

const MODO_PRUEBA = false;


const UBICACION_PLANTA = {

    lat:-33.48870,

    lng:-70.71155

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


        ahora.toLocaleDateString("es-CL")

        +

        "<br>"

        +

        ahora.toLocaleTimeString("es-CL");


}






//======================================
// INICIAR LECTOR QR
//======================================

function iniciarScanner(){



    if(scannerActivo) return;



    scannerActivo = true;



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



    let identificador = "";



    try{


        const url = new URL(decodedText);



        identificador = url.searchParams.get("ID");



    }



    catch{


        identificador = decodedText.trim();



    }




    if(!identificador){


        document.getElementById("resultado").innerHTML =


        "⚠️ QR inválido.";


        return;


    }




    identificarTrabajador("ID",identificador);



}






//======================================
// BUSCAR POR RUT
//======================================

function buscarPorRut(){



    let rut = document

        .getElementById("rutManual")

        .value;



    rut = normalizarRut(rut);




    if(rut===""){


        document.getElementById("resultado").innerHTML =


        "⚠️ Ingrese un RUT.";


        return;


    }




    identificarTrabajador("RUT",rut);



}






//======================================
// IDENTIFICACIÓN TRABAJADOR
//======================================

function identificarTrabajador(tipo,valor){



    let consulta="";




    if(tipo==="ID"){


        consulta="?ID="+encodeURIComponent(valor);



    }



    if(tipo==="RUT"){


        consulta="?RUT="+encodeURIComponent(valor);



    }





    console.log(

        "Consulta:",

        URL_SCRIPT+consulta

    );






    fetch(URL_SCRIPT+consulta)



    .then(respuesta=>respuesta.json())



    .then(datos=>{



        console.log(

            "Respuesta:",

            datos

        );





        if(datos.error){



            document.getElementById("resultado").innerHTML =


            "⚠️ "+datos.error;



            return;



        }





        mostrarTrabajador(datos);



    })



    .catch(error=>{



        console.log(error);



        document.getElementById("resultado").innerHTML =


        "❌ Error consultando trabajador.";



    });



}






//======================================
// MOSTRAR TRABAJADOR
//======================================

function mostrarTrabajador(datos){



    trabajadorActual = datos;





    document.getElementById("nombreTrabajador").innerHTML =


    datos.nombre;





    document.getElementById("cargoTrabajador").innerHTML =


    "RUT: "+datos.rut;






    document.getElementById("trabajador")

    .style.display="block";





    document.getElementById("btnEntrada")

    .disabled=false;





    document.getElementById("btnSalida")

    .disabled=false;






    document.getElementById("resultado").innerHTML =


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
// FIN PARTE 1/2
//======================================
//======================================
// REGISTRAR ENTRADA / SALIDA
//======================================

function marcar(tipo){



    if(trabajadorActual==null){



        document.getElementById("resultado").innerHTML =


        "⚠️ Primero identifique al trabajador.";



        return;



    }





    const ahora = new Date();





    const datos = {



        nombre: trabajadorActual.nombre,



        tipo: tipo,



        fecha: ahora.toLocaleDateString("es-CL"),



        hora: ahora.toLocaleTimeString("es-CL")



    };





    document.getElementById("resultado").innerHTML =



    "📍 Validando ubicación...";





    document.getElementById("btnEntrada").disabled=true;


    document.getElementById("btnSalida").disabled=true;






    validarUbicacion()

    .then(permitido=>{



        if(!permitido){



            document.getElementById("btnEntrada").disabled=false;


            document.getElementById("btnSalida").disabled=false;



            return;



        }




        enviarRegistro(datos);



    });



}






//======================================
// VALIDAR UBICACIÓN GPS
//======================================

function validarUbicacion(){



    return new Promise((resolve)=>{





        //==================================
        // MODO PRUEBA
        //==================================

        if(MODO_PRUEBA === true){



            console.log(

                "🧪 MODO PRUEBA ACTIVO - GPS OMITIDO"

            );



            document.getElementById("resultado").innerHTML =



            "🧪 Modo prueba activo.<br>Validación GPS omitida.";





            resolve(true);



            return;



        }





        //==================================
        // MODO REAL
        //==================================



        if(!navigator.geolocation){



            document.getElementById("resultado").innerHTML =


            "❌ Ubicación no disponible.";



            resolve(false);



            return;



        }






        navigator.geolocation.getCurrentPosition(



            posicion=>{



                const distancia = calcularDistancia(



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







                if(distancia <= RADIO_PERMITIDO){



                    resolve(true);



                }



                else{



                    document.getElementById("resultado").innerHTML =



                    "❌ Fuera de zona autorizada.<br>"+



                    "Distancia: "+



                    Math.round(distancia)+



                    " metros";





                    resolve(false);



                }





            },





            error=>{



                console.log(error);



                document.getElementById("resultado").innerHTML =



                "⚠️ Active la ubicación para marcar asistencia.";



                resolve(false);



            },





            {



                enableHighAccuracy:true,


                timeout:10000,


                maximumAge:0



            }





        );



    });



}








//======================================
// CALCULAR DISTANCIA
//======================================

function calcularDistancia(lat1,lon1,lat2,lon2){



    const R = 6371000;



    const dLat = (lat2-lat1)*Math.PI/180;


    const dLon = (lon2-lon1)*Math.PI/180;





    const a =



    Math.sin(dLat/2) * Math.sin(dLat/2)



    +



    Math.cos(lat1*Math.PI/180)



    *



    Math.cos(lat2*Math.PI/180)



    *



    Math.sin(dLon/2) * Math.sin(dLon/2);







    return R * 2 * Math.atan2(



        Math.sqrt(a),



        Math.sqrt(1-a)



    );



}








//======================================
// ENVIAR REGISTRO A APPS SCRIPT
//======================================

function enviarRegistro(datos){





    fetch(URL_SCRIPT,{



        method:"POST",



        body:JSON.stringify(datos)



    })





    .then(respuesta=>respuesta.json())





    .then(resultado=>{





        console.log(

            "Respuesta registro:",

            resultado

        );







        if(resultado.permitido === false){



            document.getElementById("resultado").innerHTML =



            "⚠️ "+resultado.mensaje;





            document.getElementById("btnEntrada").disabled=false;


            document.getElementById("btnSalida").disabled=false;





            return;



        }







        document.getElementById("resultado").innerHTML =



        "✅ Registro realizado correctamente.<br>"+



        trabajadorActual.nombre;







        limpiarPantalla();





    })






    .catch(error=>{





        console.log(error);





        document.getElementById("resultado").innerHTML =



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



//======================================
// FIN APP.JS
//======================================
