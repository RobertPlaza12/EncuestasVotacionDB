let encuestaID = null;
const API = 'https://proyectoencuesta100619780.atwebpages.com/';

const params = new URLSearchParams(window.location.search);
encuestaID = params.get("id");

const preguntasDiv = document.getElementById("preguntas");
const addPreguntaBtn = document.getElementById("addPregunta");

async function cargarEncuesta() {
    try {
        const res = await fetch(API + "api/get_encuestas.php");
        const encuestas = await res.json();

        const encuesta = encuestas.find(e => e.id == encuestaID);

        if (!encuesta) {
            alert("Encuesta no encontrada");
            window.location.href = "encuesta.html";
            return;
        }

        document.getElementById("tituloEncuesta").value = encuesta.titulo;

        if (encuesta.preguntas && encuesta.preguntas.length > 0) {
            encuesta.preguntas.forEach((p) => {
                agregarPreguntaExistente(p.texto, p.opciones);
            });
        }
    } catch (error) {
        console.error(error);
        alert("Error cargando la encuesta");
    }
}

function agregarPreguntaExistente(texto, opciones) {
    const div = document.createElement("div");
    div.className = "pregunta-container";

    let html = `
        <label>Pregunta</label>
        <input class="pregunta-txt" type="text" value="${texto}" />

        <div class="opciones">
            <label>Opciones</label>
    `;

    if (opciones && opciones.length > 0) {
        opciones.forEach(op => {
            html += `<input class="opcion-input" type="text" value="${op.texto}" />`;
        });
    } else {
        html += `<input class="opcion-input" type="text" placeholder="Opción 1" />`;
        html += `<input class="opcion-input" type="text" placeholder="Opción 2" />`;
    }

    html += `
        </div>

        <button class="btn-small" onclick="agregarOpcion(this)">Agregar opción</button>
        <button class="btn-small btn-danger" onclick="this.parentNode.remove()">Eliminar pregunta</button>
    `;

    div.innerHTML = html;
    preguntasDiv.appendChild(div);
}

// Botón para agregar nuevas preguntas
addPreguntaBtn.onclick = () => {
    agregarPreguntaExistente("", ["Opción 1", "Opción 2"]);
};


async function guardarCambios() {
    const titulo = document.getElementById("tituloEncuesta").value.trim();

    if (!titulo) {
        alert("Debe escribir un título para la encuesta.");
        return;
    }

    const contenedores = document.querySelectorAll(".pregunta-container");
    
    if (contenedores.length === 0) {
        alert("Debe agregar al menos una pregunta.");
        return;
    }

    let preguntas = [];

    contenedores.forEach(c => {
        const texto = c.querySelector(".pregunta-txt").value.trim();
        if (!texto) {
            alert("Todas las preguntas deben tener texto.");
            return;
        }

        const ops = [...c.querySelectorAll(".opcion-input")]
                    .map(i => i.value.trim())
                    .filter(i => i !== "");

        if (ops.length < 2) {
            alert("Cada pregunta debe tener al menos 2 opciones.");
            return;
        }

        preguntas.push({ texto, opciones: ops });
    });

    const encuestaActualizada = {
        id: encuestaID,
        titulo,
        preguntas
    };

    try {
        const res = await fetch(API + "api/update_encuesta.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(encuestaActualizada)
        });

        const data = await res.json();

        if (data.status === "ok") {
            alert("Cambios guardados correctamente.");
            window.location.href = "encuesta.html";
        } else {
            alert("Error guardando cambios: " + data.msg);
        }
    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
}

document.getElementById("btnGuardar").onclick = guardarCambios;

// Agregar opcion
function agregarOpcion(btn) {
    const div = btn.parentNode.querySelector(".opciones");
    const inp = document.createElement("input");
    inp.className = "opcion-input";
    inp.placeholder = "Nueva opción";
    div.appendChild(inp);
}

cargarEncuesta();