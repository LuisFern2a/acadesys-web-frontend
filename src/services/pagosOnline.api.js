
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

export function idOrdenCulqiValido(valor) {
  return typeof valor === 'string' && /^ord_(?:test|live)_[A-Za-z0-9]{8,40}$/.test(valor.trim());
}

// «Consultar estado del pago»: el backend consulta la orden en Culqi y
// la aplica con la misma verificación que el webhook. React no envía estados.
export async function conciliarPagoAlumno(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(
    `/api/alumno/pagos/${id}/conciliar`,
    { method: 'POST', body: JSON.stringify({}) },
    'No se pudo consultar el estado del pago en Culqi.',
  );
}

const PARAMETROS_RETORNO = ['status', 'collection_status', 'external_reference', 'payment_id', 'preference_id'];

// ¿La URL actual es un regreso desde Checkout Pro? Solo decide qué pestaña
// abrir; nunca se usa para afirmar que un pago se realizó.
export function esRetornoMercadoPago(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search || '');
  return PARAMETROS_RETORNO.some((clave) => params.has(clave));
}

// external_reference = ACS-<IdPago>-<uuid>, generada por el backend.
export function idPagoDesdeReferencia(referencia) {
  const match = /^ACS-([1-9]\d{0,14})-[-a-f0-9]{36}$/.exec(String(referencia || '').trim());
  return match ? Number(match[1]) : null;
}

// ============================================================================
// ENDPOINTS ADMINISTRATIVOS (panel de transacciones en MorosidadPage)
// Backend: routes/admin-pagos.routes.js. Los comprobantes manuales siguen en
// api.js (/api/pagos/comprobantes/:idComprobante/estado).
// ============================================================================

export async function obtenerTransaccionesAdmin(filtros = {}) {
  const params = new URLSearchParams();
  for (const clave of ['idCiclo', 'periodo', 'estado', 'limite', 'desde']) {
    const valor = filtros[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') params.set(clave, String(valor).trim());
  }
  const query = params.toString();
  return jsonPago(
    `/api/admin/pagos/transacciones${query ? `?${query}` : ''}`,
    {},
    'No se pudieron cargar las transacciones online.',
  );
}

export async function obtenerAuditoriaPagoAdmin(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(`/api/admin/pagos/${id}/auditoria`, {}, 'No se pudo cargar el historial de la cuota.');
}

export async function conciliarTransaccionAdmin(idTransaccion) {
  const id = idPagoValido(idTransaccion);
  return jsonPago(
    `/api/admin/pagos/transacciones/${id}/conciliar`,
    { method: 'POST', body: JSON.stringify({}) },
    'No se pudo consultar la transacción en Culqi.',
  );
}
