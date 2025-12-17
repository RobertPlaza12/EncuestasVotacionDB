const EMAILJS_CONFIG = {
    USER_ID: 'WEGJd8eaHcVnaJSnV', 
    SERVICE_ID: 'service_p8mr2mj',
    TEMPLATE_ID: 'template_88ql4es'
};

function inicializarEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.USER_ID);
        console.log('EmailJS inicializado');
    } else {
        console.error('EmailJS no está cargado');
    }
}

// Función principal para enviar invitaciones
async function enviarInvitacionesEmailJS(encuestaId) {
    try {
        //Obtener datos desde la api
        console.log('Obteniendo datos de participantes...');
        const response = await fetch('https://proyectoencuesta100619780.atwebpages.com/api/preparar_envio_emailjs.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: encuestaId })
        });
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error(data.msg || 'Error al obtener datos');
        }
        
        const participantes = data.participantes;
        const tituloEncuesta = data.titulo_encuesta;
        
        if (participantes.length === 0) {
            return {
                enviados: 0,
                errores: [],
                total: 0,
                mensaje: 'No hay participantes para enviar'
            };
        }
        
        //Enviar correos uno por uno con EmailJS
        const resultados = {
            enviados: 0,
            errores: [],
            participantes_enviados: [] // IDs de participantes enviados
        };
        
        console.log(`Enviando ${participantes.length} correos...`);
        
        for (let i = 0; i < participantes.length; i++) {
            const participante = participantes[i];
            
            try {
                console.log(`Enviando a ${participante.email} (${i + 1}/${participantes.length})`);
                
                const resultado = await enviarCorreoIndividualEmailJS(participante, tituloEncuesta);
                
                if (resultado.success) {
                    resultados.enviados++;
                    resultados.participantes_enviados.push(participante.id);
                    console.log(`✓ Enviado a ${participante.email}`);
                } else {
                    resultados.errores.push({
                        email: participante.email,
                        error: resultado.message
                    });
                    console.log(`✗ Error con ${participante.email}: ${resultado.message}`);
                }
                
                // Esperar entre envíos 1.5 segundos
                if (i < participantes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                
            } catch (error) {
                resultados.errores.push({
                    email: participante.email,
                    error: error.message
                });
                console.error(`Error con ${participante.email}:`, error);
            }
        }
        
        // Se marcar la encuesta como enviada en el servidor
        if (resultados.enviados > 0) {
            await finalizarEnvioEnServidor(encuestaId, resultados.participantes_enviados);
        }
        
        return {
            enviados: resultados.enviados,
            errores: resultados.errores,
            total: participantes.length,
            mensaje: `Se enviaron ${resultados.enviados} correos de ${participantes.length} participantes`
        };
        
    } catch (error) {
        console.error('Error general:', error);
        return {
            enviados: 0,
            errores: [{ email: 'general', error: error.message }],
            total: 0,
            mensaje: 'Error general: ' + error.message
        };
    }
}

async function enviarCorreoIndividualEmailJS(participante, tituloEncuesta) {
    try {

        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS no está cargado');
        }
        
        const templateParams = {
            to_email: participante.email,
            to_name: participante.nombre_completo,
            encuesta_nombre: tituloEncuesta,
            enlace_encuesta: participante.enlace,
            fecha_envio: new Date().toLocaleDateString('es-ES'),
            encuesta_id: participante.encuesta_id
        };
        
        // Enviar
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams,
            EMAILJS_CONFIG.USER_ID 
        );
        
        return {
            success: response.status === 200,
            message: 'Correo enviado exitosamente',
            response: response
        };
        
    } catch (error) {
        return {
            success: false,
            message: error.text || error.message || 'Error desconocido',
            error: error
        };
    }
}

async function finalizarEnvioEnServidor(encuestaId, participantesEnviados) {
    try {
        const response = await fetch('https://proyectoencuesta100619780.atwebpages.com/api/finalizar_envio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                encuesta_id: encuestaId,
                participantes_enviados: participantesEnviados
            })
        });
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error al finalizar envío:', error);
        return { status: 'error', msg: error.message };
    }
}

async function guardarEncuesta(id) {
    try {

        const encuestaId = id;
        
        if (!encuestaId) {
            alert('No se encontró ID de encuesta');
            return;
        }
        
        mostrarCargando(true);
        
        const resultado = await enviarInvitacionesEmailJS(encuestaId);
        
        mostrarResultadosEnvio(resultado);
        
        actualizarUIEnvioCompletado();
        
    } catch (error) {
        console.error('Error en guardarEncuesta:', error);
        alert('Error: ' + error.message);
    } finally {
        mostrarCargando(false);
    }
}

function mostrarCargando(mostrar) {
    const boton = document.querySelector('#btnEnviar');
    if (boton) {
        if (mostrar) {
            boton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Enviando...';
            boton.disabled = true;
        } else {
            boton.innerHTML = 'Enviar Invitaciones';
            boton.disabled = false;
        }
    }
}

function mostrarResultadosEnvio(resultado) {
    let mensaje = `Resultados del envío:\n\n`;
    mensaje += ` Enviados: ${resultado.enviados}\n`;
    mensaje += ` Errores: ${resultado.errores.length}\n`;
    mensaje += ` Total: ${resultado.total}\n\n`;
    
    if (resultado.errores.length > 0) {
        mensaje += `Errores detallados:\n`;
        resultado.errores.forEach((error, index) => {
            mensaje += `${index + 1}. ${error.email}: ${error.error}\n`;
        });
    }
    
    alert(mensaje);
    
    //mostrarModalResultados(resultado);
}

function actualizarUIEnvioCompletado() {
    const estadoElemento = document.querySelector('#estadoEnvio');
    if (estadoElemento) {
        estadoElemento.textContent = 'Invitaciones enviadas';
        estadoElemento.className = 'badge bg-success';
    }
}
