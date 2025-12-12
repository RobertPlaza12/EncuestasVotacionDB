// Obtener ID de encuesta desde la URL
const urlParams = new URLSearchParams(window.location.search);
const encuestaId = urlParams.get('id');

const API = 'https://proyectoencuesta100619780.atwebpages.com/';

const messageDiv = document.getElementById('message');
const formAcceso = document.getElementById('formAcceso');
const loadingDiv = document.getElementById('loading');
const resultadoDiv = document.getElementById('resultado');
const encuestaInfo = document.getElementById('encuestaInfo');
const encuestaTitulo = document.getElementById('encuestaTitulo');

document.addEventListener('DOMContentLoaded', async () => {
    if (!encuestaId) {
        mostrarError('No se ha especificado una encuesta.');
        return;
    }

    await cargarInfoEncuesta();
});

async function cargarInfoEncuesta() {
    try {
        const response = await fetch(API + `api/get_encuesta_individual.php?id=${encuestaId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        encuestaInfo.style.display = 'block';
        encuestaTitulo.textContent = data.titulo;
        document.getElementById('encuestaDesc').textContent = 
            `Esta encuesta tiene ${data.preguntas.length} pregunta(s)`;
        
    } catch (error) {
        console.error('Error cargando info encuesta:', error);
    }
}

// Botón para acceder
document.getElementById('btnAcceder').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        mostrarError('Por favor ingresa tu correo electrónico.');
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarError('Por favor ingresa un correo electrónico válido.');
        return;
    }
    
    await verificarAcceso(email);
});

async function verificarAcceso(email) {
    try {
        mostrarLoading(true);
        
        const response = await fetch(API + `api/verificar_acceso.php?email=${encodeURIComponent(email)}&encuesta_id=${encuestaId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (data.existe) {
            if (data.votado) {
                mostrarError('Ya has respondido esta encuesta.');
                mostrarLoading(false);
                return;
            }
            
            if (data.token) {
                // Redirigir directamente con token
                window.location.href = `responderEncuesta.html?token=${encodeURIComponent(data.token)}`;
            } else {
                // Generar token y redirigir
                await generarTokenYRedirigir(data.participante_id);
            }
        } else {

            mostrarMensaje(`
                <div class="info">
                    <h3>Registro necesario</h3>
                    <p>Tu correo no está registrado para esta encuesta.</p>
                    <p>Serás redirigido para completar tu registro.</p>
                </div>
            `);
            setTimeout(() => {

                localStorage.setItem('email_registro', email);
                window.location.href = `registroEncuesta.html?id=${encuestaId}`;
            }, 2000);
        }
        
    } catch (error) {
        mostrarLoading(false);
        mostrarError('Error verificando acceso: ' + error.message);
    }
}

// Generar token y redirigir
async function generarTokenYRedirigir(participanteId) {
    try {
        const response = await fetch(API + 'api/generar_token.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participante_id: participanteId })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Redirigir con token
        window.location.href = `responderEncuesta.html?token=${encodeURIComponent(data.token)}`;
        
    } catch (error) {
        mostrarError('Error generando acceso: ' + error.message);
    }
}

function mostrarError(mensaje) {
    messageDiv.innerHTML = `
        <div class="message error">
            <strong>Error:</strong> ${mensaje}
        </div>
    `;
}

function mostrarMensaje(html) {
    messageDiv.innerHTML = html;
}

function mostrarLoading(mostrar) {
    if (mostrar) {
        loadingDiv.style.display = 'block';
        formAcceso.style.display = 'none';
    } else {
        loadingDiv.style.display = 'none';
        formAcceso.style.display = 'block';
    }
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}