const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzML1F1V0dQsz_v3Qld4v0LsGZ6TwDZ5m2KonWz57jVmtmr33seKBgHtYKhiEezW1-l/exec";


let trabajadorActual = "";


window.onload = function(){

    cargarTrabajador();

};


function cargarTrabajador(){

    const parametros = new URLSearchParams(window.location.search);

    const id = parametros.get("ID");


    if(!id){

        return;

    }


    fetch(URL_SCRIPT + "?ID=" + id)

    .then(respuesta => respuesta.json())

    .then(datos => {


        if(datos.error){

            document.getElementById("resultado").innerHTML =
            "⚠️ Trabajador no encontrado";

            return;

        }


        trabajadorActual = datos.nombre;


        document.getElementById("nombre").value = datos.nombre;


        document.getElementById("nombre").disabled = true;


    })


    .catch(error => {

        console.log(error);

        document.getElementById("resultado").innerHTML =
        "❌ Error cargando trabajador";

    });

}




function marcar(tipo){


    let nombre = trabajadorActual;


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



    fetch(URL_SCRIPT, {


        method:"POST",

        body:JSON.stringify(datos)


    })


    .then(respuesta => respuesta.text())


    .then(resultado => {


        document.getElementById("resultado").innerHTML =

        "✅ Registro realizado<br>" +

        nombre + "<br>" +

        tipo + "<br>" +

        fecha.toLocaleTimeString();


    })


    .catch(error => {


        document.getElementById("resultado").innerHTML =
        "❌ Error al registrar";


        console.log(error);


    });


}
