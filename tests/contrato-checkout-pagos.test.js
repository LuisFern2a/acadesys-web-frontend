
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import * as api from "../src/services/api.js";
import {
  crearCheckoutPagoAlumno,
  consultarEstadoPagoAlumno,
  conciliarPagoAlumno,
  esRetornoMercadoPago,
  idPagoDesdeReferencia,
  obtenerTransaccionesAdmin,
  obtenerAuditoriaPagoAdmin,
  conciliarTransaccionAdmin,
  idOrdenCulqiValido,
} from "../src/services/pagosOnline.api.js";
import * as pagosOnline from "../src/services/pagosOnline.api.js";

// Contrato del checkout online del alumno. Todo se simula: nunca se llama a
// Culqi, al backend publicado ni se escribe en la base de datos.

const fetchOriginal = globalThis.fetch;
const storageOriginal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
let llamadas;

beforeEach(() => {
  const valores = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (clave) => valores.get(clave) ?? null,
      setItem: (clave, valor) => valores.set(clave, String(valor)),
      removeItem: (clave) => valores.delete(clave),
    },
  });
  api.limpiarSesion();
  llamadas = [];
  globalThis.fetch = async () => {
    throw new Error("Una prueba intentó usar la red sin respuesta simulada.");
  };
});

after(() => {
  globalThis.fetch = fetchOriginal;
  if (storageOriginal)
    Object.defineProperty(globalThis, "localStorage", storageOriginal);
  else delete globalThis.localStorage;
});

function simular(...respuestas) {
  globalThis.fetch = async (url, options = {}) => {
    llamadas.push({ url, options });
    assert.ok(respuestas.length, "Petición inesperada");
    const [status, body] = respuestas.shift();
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

test("el checkout solo envía el ID de la cuota por POST", async () => {
  simular([
    201,
    {
      exito: true,
      idPago: 9,
      estado: "PENDIENTE",
      monto: 350,
      checkoutUrl:
        "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=pref-1",
    },
  ]);

  const resultado = await crearCheckoutPagoAlumno(9);

  assert.equal(resultado.checkoutUrl.includes("mercadopago.com.pe"), true);
  assert.match(llamadas[0].url, /\/api\/alumno\/pagos\/9\/checkout$/);
  assert.equal(llamadas[0].options.method, "POST");
  assert.equal(llamadas[0].options.body, "{}");
  assert.equal(crearCheckoutPagoAlumno.length, 1);
  assert.equal(consultarEstadoPagoAlumno.length, 1);
});

test("un ID de cuota inválido no dispara ninguna petición", async () => {
  await assert.rejects(crearCheckoutPagoAlumno("abc"), /no es válida/);
  await assert.rejects(crearCheckoutPagoAlumno(0), /no es válida/);
  await assert.rejects(consultarEstadoPagoAlumno(-2), /no es válida/);
  assert.equal(llamadas.length, 0);
});

test("el 503 de pasarela sin configurar se muestra como aviso de negocio", async () => {
  simular([
    503,
    {
      code: "PASARELA_NO_CONFIGURADA",
      error: "El pago online todavía no está disponible.",
    },
  ]);

  await assert.rejects(crearCheckoutPagoAlumno(4), (error) => {
    assert.equal(error.status, 503);
    assert.equal(error.code, "PASARELA_NO_CONFIGURADA");
    assert.match(error.message, /transferencia manual/i);
    assert.doesNotMatch(error.message, /PASARELA_NO_CONFIGURADA/);
    return true;
  });
});

test("un 409 conserva el mensaje del backend para refrescar la cuota", async () => {
  simular([
    409,
    {
      code: "CUOTA_YA_PAGADA",
      error: "La cuota ya está pagada.",
    },
  ]);

  await assert.rejects(crearCheckoutPagoAlumno(7), (error) => {
    assert.equal(error.status, 409);
    assert.equal(error.message, "La cuota ya está pagada.");
    assert.equal(error.data.code, "CUOTA_YA_PAGADA");
    return true;
  });
});

test("un 500 de checkout no exponen detalles internos", async () => {
  simular([500, { code: "CHECKOUT_NO_DISPONIBLE", error: "detalle interno de BD" }]);

  await assert.rejects(crearCheckoutPagoAlumno(3), (error) => {
    assert.equal(error.status, 500);
    assert.doesNotMatch(error.message, /BD/);
    return true;
  });
});

test("la consulta de estado usa GET y no modifica la cuota", async () => {
  simular([
    200,
    {
      idPago: 9,
      estadoPago: "Pendiente",
      monto: 350,
      transaccion: {
        estado: "PENDIENTE",
        proveedor: "MERCADOPAGO",
      },
    },
  ]);

  const estado = await consultarEstadoPagoAlumno(9);

  assert.equal(estado.estadoPago, "Pendiente");
  assert.match(llamadas[0].url, /\/api\/alumno\/pagos\/9\/estado$/);
  assert.notEqual(llamadas[0].options.method, "POST");
});

test("el checkout de matrícula no envía un monto determinado por el navegador", async () => {
  simular([200, { exito: true, idMatricula: 12 }]);

  await api.procesarCheckoutMatricula({
    idCiclo: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    correo: "ana@example.test",
    monto: 999,
  });

  const cuerpo = JSON.parse(llamadas[0].options.body);
  assert.equal(Object.hasOwn(cuerpo, "monto"), false);
  assert.equal(cuerpo.idCiclo, 1);
  assert.equal(cuerpo.IdCiclo, 1);
});

test("solo acepta identificadores de orden Culqi del formato esperado", () => {
  assert.equal(idOrdenCulqiValido("ord_test_ABCDEF1234567890"), true);
  assert.equal(idOrdenCulqiValido("ord_live_ABCDEF1234567890"), true);
  assert.equal(idOrdenCulqiValido("pref-123"), false);
  assert.equal(idOrdenCulqiValido("ord_test_short"), false);
  assert.equal(idOrdenCulqiValido("ord_test_ABCDEF1234567890.evil"), false);
  assert.equal(idOrdenCulqiValido(""), false);
});

// --- Correcciones del informe de verificación (14 nov 2026) ---

test("conciliar envía solo el ID de la cuota y nunca un estado del navegador", async () => {
  simular([200, { idPago: 7, estadoPago: "Pagado", conciliacion: { consultado: true } }]);
  const r = await conciliarPagoAlumno(7);
  assert.equal(llamadas[0].url.endsWith("/api/alumno/pagos/7/conciliar"), true);
  assert.equal(llamadas[0].options.method, "POST");
  assert.deepEqual(JSON.parse(llamadas[0].options.body), {});
  assert.equal(r.estadoPago, "Pagado");
  await assert.rejects(conciliarPagoAlumno("7; DROP"), /no es válida/);
});

test("el retorno de Mercado Pago se detecta sin usarse como confirmación", () => {
  assert.equal(esRetornoMercadoPago("?status=approved&external_reference=x"), true);
  assert.equal(esRetornoMercadoPago("?collection_status=pending"), true);
  assert.equal(esRetornoMercadoPago(""), false);
  assert.equal(esRetornoMercadoPago("?tab=pagos"), false);
});

test("la cuota del retorno solo se acepta con el formato de referencia del backend", () => {
  assert.equal(idPagoDesdeReferencia("ACS-7-11111111-1111-4111-8111-111111111111"), 7);
  for (const valor of [null, "", "ACS-0-11111111-1111-4111-8111-111111111111", "ACS-7", "7", "ACS-7-<script>"]) {
    assert.equal(idPagoDesdeReferencia(valor), null, String(valor));
  }
});

test("el panel admin consulta transacciones con filtros en la URL y sin cuerpo", async () => {
  simular([200, { transacciones: [], paginacion: { total: 0, limite: 20, desde: 0 } }]);
  await obtenerTransaccionesAdmin({ idCiclo: "3", periodo: "Inscripcion", estado: "", limite: 20, desde: 40 });
  const url = new URL(llamadas[0].url, "http://local");
  assert.equal(url.pathname, "/api/admin/pagos/transacciones");
  assert.deepEqual(Object.fromEntries(url.searchParams), { idCiclo: "3", periodo: "Inscripcion", limite: "20", desde: "40" });
  assert.equal(llamadas[0].options.body, undefined);
});

test("historial y conciliación administrativa usan las rutas del backend", async () => {
  simular([200, { idPago: 7, eventos: [] }], [200, { confirmada: false }]);
  await obtenerAuditoriaPagoAdmin(7);
  await conciliarTransaccionAdmin(31);
  assert.equal(new URL(llamadas[0].url, "http://local").pathname, "/api/admin/pagos/7/auditoria");
  assert.equal(new URL(llamadas[1].url, "http://local").pathname, "/api/admin/pagos/transacciones/31/conciliar");
  assert.equal(llamadas[1].options.method, "POST");
});

test("no quedan stubs de aprobación manual ni datos ficticios en el servicio de pagos online", () => {
  for (const nombre of ["aprobarComprobanteManual", "rechazarComprobanteManual", "obtenerTransaccionesMock"]) {
    assert.equal(nombre in pagosOnline, false, nombre);
  }
});
