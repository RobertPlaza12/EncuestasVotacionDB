const API = 'https://proyectoencuesta100619780.atwebpages.com/';

const urlParams = new URLSearchParams(window.location.search);
const encuestaId = urlParams.get('id');

const messageDiv = document.getElementById('message');
const encuestaInfo = document.getElementById('encuestaInfo');
const loadingDiv = document.getElementById('loading');
const formRegistro = document.getElementById('formRegistro');

document.addEventListener('DOMContentLoaded', async () => {
    if (!encuestaId) {
        mostrarError('No se ha especificado una encuesta.');
        return;
    }

    // Cargar email desde localStorage si existe
    const emailGuardado = localStorage.getItem('email_registro');
    if (emailGuardado) {
        document.getElementById('email').value = emailGuardado;
        localStorage.removeItem('email_registro'); // Limpiar
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
        
        encuestaInfo.innerHTML = `
            <h3>${data.titulo}</h3>
            <p>Esta encuesta tiene ${data.preguntas.length} pregunta(s)</p>
        `;
        
    } catch (error) {
        console.error('Error cargando info encuesta:', error);
    }
}

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const comentario = document.getElementById('comentario').value.trim();
    
    if (!nombre || !apellido || !email) {
        mostrarError('Por favor completa todos los campos obligatorios.');
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarError('Por favor ingresa un correo electrónico válido.');
        return;
    }
    
    await registrarParticipante(nombre, apellido, email, comentario);
});

async function registrarParticipante(nombre, apellido, email, comentario) {
    try {
        mostrarLoading(true);
        
        const response = await fetch(API + 'api/registrar_participante_completo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                encuesta_id: encuestaId,
                nombre: nombre,
                apellido: apellido,
                email: email,
                comentario: comentario
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Redirigir a la encuesta con token
        window.location.href = `responderEncuesta.html?token=${encodeURIComponent(data.token)}`;
        
    } catch (error) {
        mostrarLoading(false);
        mostrarError('Error en el registro: ' + error.message);
    }
}

function mostrarError(mensaje) {
    messageDiv.innerHTML = `
        <div class="message error">
            <strong> Error:</strong> ${mensaje}
        </div>
    `;
}

function mostrarLoading(mostrar) {
    if (mostrar) {
        loadingDiv.style.display = 'block';
        formRegistro.style.display = 'none';
    } else {
        loadingDiv.style.display = 'none';
        formRegistro.style.display = 'block';
    }
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}