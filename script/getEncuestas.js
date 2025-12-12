
const API = 'https://proyectoencuesta100619780.atwebpages.com/';

document.getElementById("addEncuesta").onclick = () => {
    window.location.href = "crearEncuesta.html";
};

async function mostrarEncuestas() {
    const contenedor = document.getElementById("encuestasList");

    try {
        const res = await fetch(API + "api/get_encuestas.php");
        const encuestas = await res.json();

        if (encuestas.length === 0) {
            contenedor.innerHTML = "<p>No hay encuestas registradas.</p>";
            return;
        }

        contenedor.innerHTML = "";

        encuestas.forEach((enc) => {
            const div = document.createElement("div");
            div.className = "encuesta-item";
            div.style.marginBottom = "20px";
            div.style.padding = "15px";
            div.style.border = "1px solid #ddd";
            div.style.borderRadius = "8px";
            div.style.position = "relative";

            // Contar participantes que pueden votar
            const participantesTotales = enc.participantes_totales ? enc.participantes.length : 0;
            const participantesSinVotar = enc.participantes_sin_votar;
            const participantesConToken = enc.participantes ?
                enc.participantes.filter(p => p.token).length : 0;

            div.innerHTML = `
                <h3>${enc.titulo}</h3>
                <p><strong>ID:</strong> ${enc.id}</p>
                <p><strong>Preguntas:</strong> ${enc.preguntas.length}</p>
                <p><strong>Participantes:</strong> ${participantesTotales}</p>
                <p><strong>Por votar:</strong> ${participantesSinVotar}</p>
                <p><strong>Tokens enviados:</strong> ${participantesConToken}</p>
                <p><strong>Fecha creación:</strong> ${enc.fecha_creacion}</p>

                <div style="margin-top: 15px;">
                    <button class="btn-small" onclick="participantesEncuesta(${enc.id})">Registrar participantes</button>
                    <button class="btn-small" onclick="editarEncuesta(${enc.id})">Editar</button>
                    <button class="btn-small btn-good" onclick="iniciarEncuesta(${enc.id})" ${participantesSinVotar === 0 ? 'disabled' : ''}>
                        ${participantesConToken > 0 ? 'Reenviar Correos' : 'Iniciar Encuesta'}
                    </button>
                    <button class="btn-small btn-danger" onclick="eliminarEncuesta(${enc.id})">
                        Borrar encuesta
                    </button>
                </div>
            `;
            //<button class="btn-small" onclick="compartirEncuesta(${enc.id})" style="background: #17a2b8;">Compartir Enlace</button>

            contenedor.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = "<p>Error cargando encuestas.</p>";
    }
}

async function eliminarEncuesta(id) {
    if (!confirm("¿Seguro que deseas eliminar esta encuesta?")) return;

    try {
        const res = await fetch(API + "api/delete_encuesta.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: id })
        });

        const data = await res.json();

        if (data.status === "ok") {
            alert("Encuesta eliminada.");
            mostrarEncuestas(); // recargar lista
        } else {
            alert("Error eliminando encuesta: " + data.msg);
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor.");
    }
}

async function iniciarEncuesta(id) {
    if (!confirm("¿Enviar correos de invitación a todos los participantes sin votar?")) return;

    const encuestaItem = event.target.closest('.encuesta-item');
    const originalButton = event.target;
    const originalText = originalButton.innerHTML;
    
    // Deshabilitar botón
    originalButton.disabled = true;
    originalButton.innerHTML = '<span class="loader-small"></span> Enviando...';
    
    try {
        const res = await fetch(API + "api/enviar_encuesta.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: id })
        });

        const data = await res.json();

        if (data.status === "ok") {
            let mensaje = `EXITO:${data.mensaje}\n\n`;
            mensaje += `Enviados exitosamente: ${data.enviados}/${data.total}\n
                        ¡VERIFICAR BANDEJA DE ENTRADA Y SPAM!\n\n`;
            
            if (data.errores && data.errores.length > 0) {
                mensaje += `Con errores: ${data.errores.length}\n\n`;
                mensaje += "Correos con problemas:\n";
                data.errores.forEach((error, index) => {
                    if (index < 5) { 
                        mensaje += `• ${error.email}: ${error.error}\n`;
                    }
                });
                if (data.errores.length > 5) {
                    mensaje += `... y ${data.errores.length - 5} más\n`;
                }
                mensaje += "\nRevisa la consola para ver todos los errores.";
                console.error("Errores de envío:", data.errores);
            }
            
            alert(mensaje);
        } else {
            alert("ALERTA, Error: " + data.msg);
        }

    } catch (error) {
        console.error(error);
        alert("ALERTA, Error de conexión con el servidor.");
    } finally {

        originalButton.disabled = false;
        originalButton.innerHTML = originalText;
        mostrarEncuestas(); 
    }
}


// FUNCIÓN PARA COMPARTIR ENLACE DE ENCUESTA CON UN ENLASE
/*function compartirEncuesta(id) {
    // Crear un enlace genérico que redirige a una página para ingresar email
    const enlace = window.location.origin + window.location.pathname.replace('encuesta.html', '') + 
                   `accesoEncuesta.html?id=${id}`;
    
    // Copiar al portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(enlace).then(() => {
            alert('Enlace copiado al portapapeles:\n' + enlace);
        }).catch(err => {
            prompt('Copie este enlace para compartir:', enlace);
        });
    } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = enlace;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Enlace copiado al portapapeles:\n' + enlace);
    }
}*/

function editarEncuesta(id) {
    window.location.href = "editarEncuesta.html?id=" + id;
}

function participantesEncuesta(id) {
    window.location.href = "participantesEncuesta.html?id=" + id;
}

const style = document.createElement('style');
style.textContent = `
    .loader-small {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #1e1e2f;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: inline-block;
        animation: spin 1s linear infinite;
        vertical-align: middle;
        margin-left: 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

window.onload = mostrarEncuestas;
