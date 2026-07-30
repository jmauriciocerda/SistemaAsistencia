function marcar(tipo){

    let nombre = document.getElementById("nombre").value;

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


    fetch("TU_URL_DE_APPS_SCRIPT", {

        method: "POST",

        body: JSON.stringify(datos)

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
