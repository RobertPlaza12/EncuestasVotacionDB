const preguntasDiv = document.getElementById('preguntas');
const addPreguntaBtn = document.getElementById('addPregunta');
let contadorPreguntas = 0;

const API = 'https://proyectoencuesta100619780.atwebpages.com/';

addPreguntaBtn.onclick = () => {
    contadorPreguntas++;

    const p = document.createElement('div');
    p.className = 'pregunta-container';
    p.innerHTML = `
        <label>Pregunta ${contadorPreguntas}</label>
        <input class="pregunta-txt" type="text" placeholder="Escribe la pregunta" />

        <div class="opciones">
            <label>Opciones de respuesta</label>
            <input class="opcion-input" type="text" placeholder="Opción 1" />
            <input class="opcion-input" type="text" placeholder="Opción 2" />
        </div>

        <button class="btn-small" onclick="agregarOpcion(this)">Agregar opción</button>
        <button class="btn-small btn-danger" onclick="this.parentNode.remove(); contadorPreguntas--;">Eliminar pregunta</button>
    `;

    preguntasDiv.appendChild(p);
};

function agregarOpcion(btn) {
    const div = btn.parentNode.querySelector('.opciones');
    const nueva = document.createElement('input');
    nueva.className = 'opcion-input';
    nueva.placeholder = 'Nueva opción';
    div.appendChild(nueva);
}

async function guardarEncuesta() {
    const titulo = document.getElementById("tituloEncuesta").value.trim();
    if (titulo === "") {
        alert("Debe escribir un título para la encuesta.");
        return;
    }

    // Obtener preguntas
    const bloquesPreguntas = document.querySelectorAll(".pregunta-container");
    
    if (bloquesPreguntas.length === 0) {
        alert("Debe agregar al menos una pregunta.");
        return;
    }
    
    let preguntas = [];
    let preguntaValida = true;

    bloquesPreguntas.forEach(bloque => {
        const textoPregunta = bloque.querySelector(".pregunta-txt").value.trim();
        if (!textoPregunta) {
            alert("Todas las preguntas deben tener texto.");
            preguntaValida = false;
            return;
        }

        const opcionesInputs = bloque.querySelectorAll(".opcion-input");
        let opciones = [];
        opcionesInputs.forEach(op => {
            if (op.value.trim() !== "") opciones.push(op.value.trim());
        });

        if (opciones.length < 2) {
            alert("Cada pregunta debe tener al menos 2 opciones.");
            preguntaValida = false;
            return;
        }

        preguntas.push({
            texto: textoPregunta,
            opciones: opciones
        });
    });

    if (!preguntaValida) return;

    const encuesta = {
        titulo: titulo,
        preguntas: preguntas
    };

    try {
        const res = await fetch(API + "api/set_encuesta.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(encuesta)
        });

        const data = await res.json();

        if (data.status === "ok") {
            alert("Encuesta guardada correctamente. ID: " + data.id);
            window.location.href = "encuesta.html";
        } else {
            alert("Error al guardar la encuesta: " + data.msg);
        }
    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
}

document.getElementById("btnGuardar").addEventListener("click", guardarEncuesta);
