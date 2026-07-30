const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzML1F1V0dQsz_v3Qld4v0LsGZ6TwDZ5m2KonWz57jVmtmr33seKBgHtYKhiEezW1-l/exec";


let trabajadorActual = "";


// Al cargar la página
window.onload = function(){

    cargarTrabajador();

};



// =====================================
// CARGAR TRABAJADOR DESDE QR
// =====================================

function cargarTrabajador(){


    const parametros = new URLSearchParams(window.location.search);

    const id = parametros.get("ID");


    console.log("URL completa:", window.location.href);

    console.log("ID detectado:", id);



    // Si no viene QR, funciona modo manual

    if(!id){

        return;

    }



    console.log("Consultando trabajador...");



    fetch(URL_SCRIPT + "?ID=" + id)


    .then(respuesta => {


        console.log("Estado respuesta:", respuesta.status);

        return respuesta.json();


    })


    .then(datos => {


        console.log("Respuesta Apps Script:", datos);



        if(datos.error){


            document.getElementById("resultado").innerHTML =

            "⚠️ Trabajador no encontrado";


            return;


        }



        trabajadorActual = datos.nombre;



        document.getElementById("nombre").value = datos.nombre;



        document.getElementById("nombre").disabled = true;



        document.getElementById("resultado").innerHTML =

        "✅ Trabajador identificado<br>" +

        datos.nombre;



    })


    .catch(error => {


        console.log("ERROR CONSULTA:", error);



        document.getElementById("resultado").innerHTML =

        "❌ Error cargando trabajador";


    });


}




// =====================================
// REGISTRAR ENTRADA / SALIDA
// =====================================

function marcar(tipo){



    let nombre = trabajadorActual;



    // Si no viene desde QR, permite escribir manual

    if(nombre === ""){


        nombre = document.getElementById("nombre").value;


    }



    if(nombre.trim() === ""){


        document.getElementById("resultado").innerHTML =

        "⚠️ Ingrese el nombre del trabajador";


        return;


    }



    let fecha = new Date();



    let datos = {


        nombre: nombre,

        tipo: tipo,

        fecha: fecha.toLocaleDateString(),

        hora: fecha.toLocaleTimeString()


    };



    console.log("Enviando registro:", datos);



    fetch(URL_SCRIPT, {


        method:"POST",

        body:JSON.stringify(datos)


    })


    .then(respuesta => respuesta.text())


    .then(resultado => {



        console.log("Respuesta registro:", resultado);



        document.getElementById("resultado").innerHTML =


        "✅ Registro realizado<br>" +

        nombre + "<br>" +

        tipo + "<br>" +

        fecha.toLocaleTimeString();



    })


    .catch(error => {


        console.log("ERROR REGISTRO:", error);



        document.getElementById("resultado").innerHTML =

        "❌ Error al registrar";


    });


}
