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

// ============================================================================
// ENDPOINTS ADMINISTRATIVOS (Panel de Transacciones - AdminPagosPage)
// ============================================================================

// 1. Obtener todas las transacciones para pintar la tabla
export async function obtenerTransaccionesAdmin() {
  return jsonPago(
    `/api/admin/pagos/transacciones`,
    {},
    'No se pudieron cargar las transacciones administrativas.'
  );
}

// 2. Aprobar un pago manual (voucher/transferencia)
export async function aprobarComprobanteManual(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(
    `/api/admin/pagos/${id}/aprobar`,
    { method: 'PUT', body: JSON.stringify({}) },
    'No se pudo aprobar el comprobante manual.'
  );
}

// 3. Rechazar un pago manual (voucher/transferencia)
export async function rechazarComprobanteManual(idPago) {
  const id = idPagoValido(idPago);
  return jsonPago(
    `/api/admin/pagos/${id}/rechazar`,
    { method: 'PUT', body: JSON.stringify({}) },
    'No se pudo rechazar el comprobante manual.'
  );
}

// ============================================================================
// MOCK TEMPORAL (Solo para maquetar frontend mientras el backend se termina)
// ============================================================================
export const obtenerTransaccionesMock = async () => {
  return [
    {
      id: 1,
      alumno: "Johan Zapana",
      ciclo: "Verano 2027",
      periodo: "Mes 1",
      monto: 150.00,
      fecha: "2026-11-06",
      metodo: "Mercado Pago",
      referencia: "MP-987654321",
      estado: "Aprobada"
    },
    {
      id: 2,
      alumno: "Carlos Mendoza",
      ciclo: "Verano 2027",
      periodo: "Inscripción",
      monto: 50.00,
      fecha: "2026-11-05",
      metodo: "Manual",
      referencia: "VOUCHER-BCP-001",
      estado: "Pendiente"
    }
  ];
};