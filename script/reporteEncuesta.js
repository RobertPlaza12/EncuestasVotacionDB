const API = 'https://proyectoencuesta100619780.atwebpages.com/';

async function cargarReportes() {
    try {
        const res = await fetch(API + "api/get_encuestas.php");
        const encuestas = await res.json();

        const card = document.querySelector(".card");
        card.innerHTML = "<h1>Reporte de encuestas activas</h1>";

        if (encuestas.length === 0) {
            card.innerHTML += "<p>No hay encuestas registradas.</p>";
            return;
        }

        let html = `
            <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                <div style="background: #f0f0f0; padding: 15px 50px; border-radius: 8px; width: 30%;">
                    <h3 style="margin-top: 0;">Encuestas</h3>
                    <p style="font-size: 24px; font-weight: bold;">${encuestas.length}</p>
                </div>
                <div style="background: #f0f0f0; padding: 15px 50px; border-radius: 8px; width: 30%;">
                    <h3 style="margin-top: 0;">Preguntas</h3>
                    <p style="font-size: 24px; font-weight: bold;">${encuestas.reduce((total, enc) => total + enc.preguntas.length, 0)}</p>
                </div>
                <div style="background: #f0f0f0; padding: 15px 50px; border-radius: 8px; width: 30%;">
                    <h3 style="margin-top: 0;">Participantes</h3>
                    <p style="font-size: 24px; font-weight: bold;">${encuestas.reduce((total, enc) => total + (enc.participantes ? enc.participantes.length : 0), 0)}</p>
                </div>
            </div>
        `;

        encuestas.forEach(encuesta => {
            const participantesCount = encuesta.participantes ? encuesta.participantes.length : 0;
            const votantesCount = encuesta.participantes_votaron;// ? encuesta.participantes.filter(p => p.votado).length : 0;
            
            html += `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <h3>${encuesta.titulo} (ID: ${encuesta.id})</h3>
                    <p><strong>Fecha creación:</strong> ${encuesta.fecha_creacion}</p>
                    <p><strong>Preguntas:</strong> ${encuesta.preguntas.length}</p>
                    <p><strong>Participantes:</strong> ${participantesCount}</p>
                    <p><strong>Han votado:</strong> ${votantesCount} / ${participantesCount}</p>
                    <p><strong>Estado:</strong> <span style="color:${encuesta.activo > 0 ? 'green' : 'orange'}">${encuesta.activo  > 0 ? 'Activa' : 'No iniciada'}</span></p>
                    
                    <button class="btn-small" onclick="verDetallesEncuesta(${encuesta.id})">Ver detalles</button>
                </div>
            `;
        });

        card.innerHTML += html;
        
    } catch (error) {
        console.error(error);
        const card = document.querySelector(".card");
        card.innerHTML += "<p>Error cargando reportes.</p>";
    }
}

function verDetallesEncuesta(id) {
    window.location.href = "detallesEncuesta.html?id=" + id;
}

window.onload = cargarReportes;