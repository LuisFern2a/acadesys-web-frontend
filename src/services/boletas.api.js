import { fetchWithAuth } from './api.js';

// Boletas electrónicas SUNAT de las cuotas pagadas del alumno.
export async function obtenerMisBoletas() {
  try {
    const respuesta = await fetchWithAuth('/api/alumno/boletas', { method: 'GET' });
    const datos = await respuesta.json().catch(() => ({}));
    return Array.isArray(datos.boletas) ? datos.boletas : [];
  } catch {
    // La boleta es complementaria: si falla, la lista de cuotas sigue visible.
    return [];
  }
}

export async function descargarBoleta(idPago, numero, formato = 'pdf') {
  const id = Number(idPago);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('La cuota seleccionada no es válida.');
  const extension = formato === 'xml' ? 'xml' : 'pdf';
  let respuesta;
  try {
    respuesta = await fetchWithAuth(`/api/alumno/pagos/${id}/boleta?formato=${extension}`, { method: 'GET' });
  } catch (error) {
    throw new Error(error?.status === 404
      ? 'La boleta todavía se está emitiendo. Inténtalo en unos minutos.'
      : (error?.message || 'No se pudo descargar la boleta.'));
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${String(numero || `boleta-${id}`).replace(/[^A-Za-z0-9-]/g, '')}.${extension}`;
  enlace.rel = 'noopener';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
