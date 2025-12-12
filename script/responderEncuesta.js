const API = 'https://proyectoencuesta100619780.atwebpages.com/';

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const email = urlParams.get('email');

let encuestaData = null;
let respuestas = {};
let participanteInfo = {};

const mensajesDiv = document.getElementById('mensajes');
const formParticipante = document.getElementById('formParticipante');
const encuestaForm = document.getElementById('encuestaForm');
const loadingDiv = document.getElementById('loading');
const encuestaTitulo = document.getElementById('encuestaTitulo');

document.addEventListener('DOMContentLoaded', async () => {
    if (!token || !email) {
        mensajesDiv.innerHTML = `
                <div class="error-message">
                    <h3>¡Error!</h3>
                    <p><strong>Token o correo invalidos.</strong></p>
                </div>
        `;
        formParticipante.style.display = 'none';
        throw new Error('Enlace inválido. Por favor, use el enlace que recibió por correo.');

    }

    await verificarToken();
});

async function verificarToken() {
    try {
        const response = await fetch(API + `api/verificar_token.php?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (!data.valido) {
            mensajesDiv.innerHTML = `
                <div class="error-message">
                    <h3>¡Error!</h3>
                    <p><strong>Solo se puede votar una ves.</strong></p>
                </div>
            `;
            throw new Error(data.error || 'Token inválido');
            
        }
        

        // Token válido, cargar información del participante
        participanteInfo = {
            id: data.participante_id,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email
        };
        
        // Mostrar datos del participante
        document.getElementById('nombre').value = data.nombre;
        document.getElementById('nombre').disabled = true;
        document.getElementById('apellido').value = data.apellido;
        document.getElementById('apellido').disabled = true;
        document.getElementById('email').value = data.email;
        document.getElementById('email').disabled = true;
        document.getElementById('comentario').value = '';
        document.getElementById('comentario').disabled = true;

        // Ocultar botón continuar, ir directamente a encuesta
        document.getElementById('btnContinuar').style.display = 'none';

        // Cargar encuesta
        await cargarEncuesta(data.encuesta_id);

        mostrarFormularioEncuesta();

    } catch (error) {
        console.error(error);
        formParticipante.style.display = 'none';
    }
}

async function cargarEncuesta(encuestaId) {
    try {
        const response = await fetch(API + `api/get_encuestas.php?action=unica&id=${encuestaId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        encuestaData = data;
        encuestaTitulo.textContent = data.titulo;

        if (!Array.isArray(data.preguntas)) {
            encuestaData.preguntas = Object.values(data.preguntas);
        }
        
        generarPreguntas();
        
    } catch (error) {
        throw new Error('Error al cargar la encuesta: ' + error.message);
    }
}

function generarPreguntas() {
    const preguntasContainer = document.getElementById('preguntasContainer');
    preguntasContainer.innerHTML = '';

    if (!encuestaData || !encuestaData.preguntas || encuestaData.preguntas.length === 0) {
        throw new Error('No hay preguntas para mostrar');
    }

    encuestaData.preguntas.forEach((pregunta) => {
        const preguntaDiv = document.createElement('div');
        preguntaDiv.classList.add('pregunta-item');
        preguntaDiv.innerHTML = `
            <h3>${pregunta.texto}</h3>
            ${pregunta.opciones.map((opcion) => `
                <label class="opcion-label">
                    <input type="radio" name="pregunta-${pregunta.id}" value="${opcion.id}" onchange="guardarRespuesta(${pregunta.id}, ${opcion.id})">
                    ${opcion.texto}
                </label><br>
            `).join('')}
        `;
        preguntasContainer.appendChild(preguntaDiv);
    });

    document.getElementById('encuestaContainer').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}



function guardarRespuesta(preguntaId, opcionId) {
    respuestas[preguntaId] = opcionId;

    const completo = Object.keys(respuestas).length === encuestaData.preguntas.length;
    document.getElementById('btnEnviarRespuestas').disabled = !completo;
}

function mostrarFormularioEncuesta() {
    encuestaForm.style.display = 'block';
    loadingDiv.style.display = 'none';
}

async function enviarRespuestas(event) {
    event.preventDefault();

    try {

        if (!encuestaData || !encuestaData.encuesta_id) {
            throw new Error("El ID de la encuesta no está disponible.");
        }

        const respuestaData = {
            participante_id: participanteInfo.id,
            encuesta_id: encuestaData.encuesta_id,  
            respuestas: Object.entries(respuestas).map(([pregunta_id, opcion_id]) => ({
                pregunta_id: parseInt(pregunta_id),
                opcion_id: parseInt(opcion_id)
            }))
        };

        const btnEnviar = document.getElementById('btnEnviarRespuestas');
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';

        const response = await fetch(API + 'api/guardar_respuestas.php', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(respuestaData)
        });

        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar Respuestas';

        const data = await response.json();

        if (data.success) {
            mensajesDiv.innerHTML = `
                <div class="success-message">
                    <h3>¡Gracias por participar!</h3>
                    <p>Sus respuestas han sido guardadas exitosamente.</p>
                    <p><strong>Este enlace ya no puede ser utilizado nuevamente.</strong></p>
                    <p>Puede cerrar esta ventana.</p>
                </div>
            `;
            //encuestaForm.style.display = 'none';
        } else if (data.Used){
            throw new Error("Ya has respondido esta encuesta. No puedes participar nuevamente.");
        }else {
            throw new Error(data.error || 'Error al guardar las respuestas');
        }
    } catch (error) {
        console.error(error);
        mensajesDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

document.getElementById('formRespuestas').addEventListener('submit', enviarRespuestas);

