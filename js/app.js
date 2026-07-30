alert("APP JS FUNCIONANDO");
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


    fetch("https://script.google.com/macros/s/AKfycbxPJIK1_IukBGVU4QfVS8-vYkxvW0KXY3W9wcC_UtzrXODsf79aESIlCGCHVH2U7PI/exec", {

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
