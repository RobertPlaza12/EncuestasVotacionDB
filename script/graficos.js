const API = 'https://proyectoencuesta100619780.atwebpages.com/';

const params = new URLSearchParams(window.location.search);
const encuestaID = params.get("id");  


async function cargarEncuestas() {
    try {
        const response = await fetch(API + "api/get_encuestas.php");
        const encuestas = await response.json();

        const encuestaSeleccionada = encuestas.find(encuesta => parseInt(encuesta.id) === parseInt(encuestaID));

        if (!encuestaSeleccionada) {
            throw new Error("Encuesta no encontrada.");
        }

        document.getElementById("tituloEncuesta").innerText = "Encuesta:" + encuestaSeleccionada.titulo;

        // Cargar la información de cada pregunta y sus votos
        encuestaSeleccionada.preguntas.forEach(pregunta => {
            mostrarPregunta(pregunta);
        });
    } catch (error) {
        console.error("Error al cargar las encuestas:", error);
        document.getElementById("grafico-container").innerHTML = `<p>${error.message}</p>`;
    }
}

async function mostrarPregunta(pregunta) {
    const preguntaDiv = document.createElement("div");
    preguntaDiv.className = "pregunta-item";

    document.getElementById("grafico-container").appendChild(preguntaDiv);

    const votos = {
        opciones: pregunta.opciones.map(() => 0), 
        participantes: pregunta.opciones.map(() => []),
    };

    const response = await fetch(API + `api/get_votos.php?encuesta_id=${encuestaID}&pregunta_id=${pregunta.id}`);
    const votosData = await response.json();

    votosData.forEach(voto => {
        const opcionIndex = pregunta.opciones.findIndex(
            opcion => parseInt(opcion.id) === parseInt(voto.id_opcion)
        );

        if (opcionIndex !== -1) {
            votos.opciones[opcionIndex]++;
            votos.participantes[opcionIndex].push(voto.nombre); 
        }
    });

    preguntaDiv.innerHTML = `
    <h3>Pregunta: ${pregunta.texto}</h3>
    <canvas id="graficoPregunta${pregunta.id}" width="200" height="100"></canvas>
    <select id="votantesPregunta${pregunta.id}" class="form-control">
        <option value="">Seleccionar votante...</option>
    </select>

    <div id="listaVotantes${pregunta.id}" class="mt-2"></div>
    `;

    const selectVotantes = document.getElementById(`votantesPregunta${pregunta.id}`);
    const contenedorLista = document.getElementById(`listaVotantes${pregunta.id}`);

    // Llenamos las opciones del select
    votos.participantes.forEach((participantes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = `${pregunta.opciones[index].texto} - ${participantes.length} voto(s)`;
        selectVotantes.appendChild(option);
    });

    // Evento: al cambiar de opción mostrar los votantes
    selectVotantes.addEventListener("change", () => {
        const index = selectVotantes.value;

        if (index === "") {
            contenedorLista.innerHTML = "";
            return;
        }

        const lista = votos.participantes[index];

        if (lista.length === 0) {
            contenedorLista.innerHTML = `<p>No hay votantes para esta opción.</p>`;
        } else {
            contenedorLista.innerHTML = `
                <h4>Participantes que eligieron "${pregunta.opciones[index].texto}":</h4>
                <ul>
                    ${lista.map(nombre => `<li>${nombre}</li>`).join("")}
                </ul>
            `;
        }
    });


    // Generar el gráfico de la pregunta
    const ctx = document.getElementById(`graficoPregunta${pregunta.id}`).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: pregunta.opciones.map(opcion => opcion.texto),
            datasets: [{
                label: 'Votos por opción',
                data: votos.opciones,
                backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#17a2b8'], // Colores para cada opción
                borderColor: ['#218838', '#c82333', '#e0a800', '#138496'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

cargarEncuestas();
