import { fetchWithAuth } from './api.js';

async function jsonPago(endpoint, options = {}, mensajePorDefecto = 'No se pudo completar la operación.') {
  const response = await fetchWithAuth(endpoint, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || data.mensaje || mensajePorDefecto);
    error.status = response.status;
    error.code = data.code || null;
    error.data = data;
    throw error;
  }
  return data;
}

function idPagoValido(valor) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('La cuota seleccionada no es válida.');
  return id;
}

// El navegador solo envía el ID de la cuota. El backend calcula el importe,
// alumno y academia desde la sesión y la base de datos.
export async function crearCheckoutPagoAlumno(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(`/api/alumno/pagos/${id}/checkout`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, 'No se pudo iniciar el checkout de Mercado Pago.');
}

export async function consultarEstadoPagoAlumno(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(`/api/alumno/pagos/${id}/estado`, {}, 'No se pudo consultar el estado del pago.');
}

export async function conciliarPagoAlumno(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(`/api/alumno/pagos/${id}/conciliar`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, 'No se pudo consultar el estado del pago en Mercado Pago.');
}

const PARAMETROS_RETORNO = [
  'payment_status',
  'status',
  'order_id',
  'external_reference',
  'collection_status',
  'payment_id',
];

// El retorno solo abre la pestaña de pagos; nunca confirma una cuota.
export function esRetornoMercadoPago(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search || '');
  return PARAMETROS_RETORNO.some((clave) => params.has(clave));
}

export async function obtenerTransaccionesAdmin(filtros = {}) {
  const params = new URLSearchParams();
  for (const clave of ['idCiclo', 'periodo', 'estado', 'limite', 'desde']) {
    const valor = filtros[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') params.set(clave, String(valor).trim());
  }
  const query = params.toString();
  return jsonPago(`/api/admin/pagos/transacciones${query ? `?${query}` : ''}`, {}, 'No se pudieron cargar las transacciones online.');
}

export async function obtenerAuditoriaPagoAdmin(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(`/api/admin/pagos/${id}/auditoria`, {}, 'No se pudo cargar el historial de la cuota.');
}

export async function conciliarTransaccionAdmin(idTransaccion) {
  const id = idPagoValido(idTransaccion);
  return jsonPago(`/api/admin/pagos/transacciones/${id}/conciliar`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, 'No se pudo consultar la transacción en Mercado Pago.');
}
