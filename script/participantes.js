const API = 'https://proyectoencuesta100619780.atwebpages.com/';

const params = new URLSearchParams(window.location.search);
const encuestaId = params.get("id");

if (encuestaId) {
    document.title = "Participantes - Encuesta #" + encuestaId;
}

document.getElementById("formParticipante").addEventListener("submit", async function (e) {
    e.preventDefault();

    const participante = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        email: document.getElementById("correo").value.trim(),
        comentarios: document.getElementById("comentario").value.trim(),
        votado: false
    };

    if (!participante.nombre || !participante.apellido || !participante.email) {
        alert("Nombre, apellido y correo son obligatorios.");
        return;
    }

    try {
        const res = await fetch(API + "api/add_participante.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: encuestaId,
                participante: participante
            })
        });

        const data = await res.json();

        if (data.status === "ok") {
            alert("Participante registrado correctamente.");
            document.getElementById("formParticipante").reset();
            cargarParticipantes();
        } else {
            alert("Error guardando participante: " + data.msg);
        }
    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
});

async function cargarParticipantes() {
    const contenedor = document.getElementById("listaParticipantes");

    try {
        const res = await fetch(API + "api/get_encuestas.php");
        const encuestas = await res.json();

        const encuesta = encuestas.find(e => e.id == encuestaId);

        if (!encuesta) {
            contenedor.innerHTML = "<p>Encuesta no encontrada.</p>";
            return;
        }

        contenedor.innerHTML = `
            <h2>Participantes de: ${encuesta.titulo}</h2>
            <p><strong>ID Encuesta:</strong> ${encuesta.id}</p>
            <hr>
        `;

        if (!encuesta.participantes || encuesta.participantes.length === 0) {
            contenedor.innerHTML += "<p>No hay participantes registrados.</p>";
            return;
        }

        encuesta.participantes.forEach((p) => {
            const div = document.createElement("div");
            div.className = "participante-item";
            div.style.marginBottom = "15px";
            div.style.padding = "10px";
            div.style.border = "1px solid #eee";
            div.style.borderRadius = "5px";

            div.innerHTML = `
                <p><strong>${p.nombre} ${p.apellido}</strong> (ID: ${p.id})</p>
                <p><strong>Email:</strong> ${p.email}</p>
                <p><strong>Comentario:</strong> ${p.comentario || 'Ninguno'}</p>
                <p><strong>Votó:</strong> <span style="color:${p.votado == "0" ? 'red' : 'green'}">${p.votado == "1" ? "Sí" : "No"}</span></p>
                <button class="btn-small btn-danger" onclick="eliminarParticipante(${p.id})">Eliminar</button>
                <hr>
            `;

            contenedor.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = "<p>Error cargando participantes.</p>";
    }
}

async function eliminarParticipante(participanteId) {
    if (!confirm("¿Seguro que deseas eliminar este participante?")) return;

    try {
        const res = await fetch(API + "api/delete_participante.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                participanteId: participanteId
            })
        });

        const data = await res.json();

        if (data.status === "ok") {
            alert("Participante eliminado.");
            cargarParticipantes(); 
        } else {
            alert("Error eliminando participante: " + data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
}

function volver() {
    window.location.href = "encuesta.html";
}

cargarParticipantes();