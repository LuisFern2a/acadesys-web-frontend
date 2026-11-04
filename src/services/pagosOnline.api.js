import { fetchWithAuth } from './api.js';

async function jsonPago(endpoint, options = {}, mensajePorDefecto = 'No se pudo completar la operación.') {
  const response = await fetchWithAuth(endpoint, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || data.mensaje || mensajePorDefecto);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function idPagoValido(valor) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('La cuota seleccionada no es válida.');
  }
  return id;
}

// El navegador envía únicamente el ID de la cuota. El backend obtiene
// alumno, academia, importe y moneda desde la sesión y la base de datos.
export async function crearCheckoutPagoAlumno(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(
    `/api/alumno/pagos/${id}/checkout`,
    { method: 'POST', body: JSON.stringify({}) },
    'No se pudo iniciar el pago online.',
  );
}

// Consulta el estado guardado por el backend. No confirma ni modifica pagos.
export async function consultarEstadoPagoAlumno(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(
    `/api/alumno/pagos/${id}/estado`,
    {},
    'No se pudo consultar el estado del pago.',
  );
}

export function urlCheckoutValida(valor) {
  let url;
  try {
    url = new URL(String(valor || '').trim());
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return host === 'mercadopago.com'
    || host.endsWith('.mercadopago.com')
    || host === 'mercadopago.com.pe'
    || host.endsWith('.mercadopago.com.pe');
}

