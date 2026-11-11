// Añadir este bloque a src/services/api.js y reemplazar la versión anterior
// de consultarTutorIA(pregunta). No reemplaces todo api.js.

export async function obtenerContextoTutorIA() {
  const response = await fetchWithAuth('/api/tutor-ia/contexto');
  const data = await response.json().catch(() => ({}));
  return data.contexto || data;
}

export async function consultarTutorIA(pregunta, opciones = {}) {
  const texto = String(pregunta || '').trim();
  if (!texto || texto.length > 2000) {
    throw new Error('La pregunta debe tener entre 1 y 2000 caracteres.');
  }

  const modosPermitidos = new Set([
    'chat', 'explicar', 'resolver', 'practicar', 'corregir', 'repasar', 'plan', 'diagnostico'
  ]);
  const modoSolicitado = String(opciones.modo || 'chat').trim().toLowerCase();
  const modo = modosPermitidos.has(modoSolicitado) ? modoSolicitado : 'chat';

  const historial = Array.isArray(opciones.historial)
    ? opciones.historial
        .slice(-10)
        .map((item) => ({
          rol: item?.rol === 'ai' || item?.rol === 'assistant' || item?.rol === 'model'
            ? 'model'
            : 'user',
          texto: String(item?.texto || item?.text || '').trim().slice(0, 1400),
        }))
        .filter((item) => item.texto)
    : [];

  const payload = {
    pregunta: texto,
    modo,
    cursoId: opciones.cursoId ? Number(opciones.cursoId) : null,
    historial,
  };

  const response = await fetchWithAuth('/api/tutor-ia', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  const respuesta = typeof data.respuesta === 'string'
    ? data.respuesta
    : typeof data.mensaje === 'string'
      ? data.mensaje
      : '';

  if (!respuesta.trim()) {
    throw new Error('El Tutor IA no devolvió una respuesta válida. Inténtalo nuevamente.');
  }

  return {
    ...data,
    respuesta,
    conceptosClave: Array.isArray(data.conceptosClave) ? data.conceptosClave : [],
    pasos: Array.isArray(data.pasos) ? data.pasos : [],
    ejercicios: Array.isArray(data.ejercicios) ? data.ejercicios : [],
    planEstudio: Array.isArray(data.planEstudio) ? data.planEstudio : [],
  };
}
