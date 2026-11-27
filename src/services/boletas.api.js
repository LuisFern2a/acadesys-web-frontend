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

// DNI y nombre sugeridos para la boleta (los últimos usados o los del alumno).
export async function obtenerDatosBoleta() {
  try {
    const respuesta = await fetchWithAuth('/api/alumno/datos-boleta', { method: 'GET' });
    const datos = await respuesta.json().catch(() => ({}));
    return { dni: String(datos.dni || ''), nombre: String(datos.nombre || '') };
  } catch {
    return { dni: '', nombre: '' };
  }
}

export function validarDatosBoleta({ dni, nombre }) {
  const d = String(dni || '').trim();
  const n = String(nombre || '').replace(/\s+/g, ' ').trim();
  if (!/^\d{8}$/.test(d)) return 'El DNI para la boleta debe tener 8 dígitos.';
  if (n.length < 3 || !/^[\p{L}][\p{L} .'-]*$/u.test(n)) return 'Escribe el nombre completo de quien paga (solo letras).';
  return '';
}

// Guarda a nombre de quién sale la boleta de esta cuota.
export async function guardarDatosBoleta(idPago, { dni, nombre }) {
  const id = Number(idPago);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('La cuota seleccionada no es válida.');
  const error = validarDatosBoleta({ dni, nombre });
  if (error) throw new Error(error);
  try {
    const respuesta = await fetchWithAuth(`/api/alumno/pagos/${id}/datos-boleta`, {
      method: 'PUT',
      body: JSON.stringify({ dni: String(dni).trim(), nombre: String(nombre).replace(/\s+/g, ' ').trim() }),
    });
    return await respuesta.json().catch(() => ({}));
  } catch (err) {
    throw new Error(err?.message || 'No se pudieron guardar los datos de la boleta.');
  }
}
