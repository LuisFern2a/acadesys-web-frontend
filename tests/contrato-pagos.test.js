import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import * as api from "../src/services/api.js";

// Pruebas del contrato de pagos del alumno (Morgan) + normalización del portal.
// Todo se simula: nunca se llama a la API publicada ni se escribe en la BD.

const fetchOriginal = globalThis.fetch;
const storageOriginal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const windowOriginal = Object.getOwnPropertyDescriptor(globalThis, "window");
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
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { href: "" }, dispatchEvent: () => {} },
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
  if (windowOriginal) Object.defineProperty(globalThis, "window", windowOriginal);
  else delete globalThis.window;
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

// --- Normalización de cuotas ------------------------------------------------

test("normaliza una cuota en PascalCase sin mostrar S/ 0.00", () => {
  const cuota = api.normalizarCuotaAlumno({
    IdPago: "12",
    IdCiclo: "3",
    Ciclo: "Ciclo UNI 2026",
    Mes: "Marzo",
    Monto: "350.50",
    Estado: "Pendiente",
    FechaVencimiento: "2026-11-30T00:00:00.000Z",
  });

  assert.equal(cuota.idPago, 12);
  assert.equal(cuota.idCiclo, 3);
  assert.equal(cuota.ciclo, "Ciclo UNI 2026");
  assert.equal(cuota.periodo, "Marzo");
  assert.equal(cuota.monto, 350.5);
  assert.equal(cuota.estadoClave, "PENDIENTE");
  assert.equal(cuota.pagado, false);
  assert.equal(cuota.enRevision, false);
  assert.equal(cuota.puedeRegistrarComprobante, true);
  assert.equal(cuota.fechaVencimiento, "2026-11-30T00:00:00.000Z");
});

test("un monto ausente queda en null y nunca se convierte en S/ 0.00", () => {
  const cuota = api.normalizarCuotaAlumno({ IdPago: 1, Estado: "Pendiente" });
  assert.equal(cuota.monto, null);
  assert.equal(
    api.normalizarCuotaAlumno({ Monto: "" }).monto,
    null,
    "cadena vacía no es un monto de cero",
  );
  assert.equal(
    api.normalizarCuotaAlumno({ Monto: 0 }).monto,
    0,
    "un cero real sí se conserva",
  );
});

test("detecta 'En revisión' anidado y bloquea el reenvío del comprobante", () => {
  const cuota = api.normalizarCuotaAlumno({
    idPago: 7,
    monto: 280,
    estado: "Pendiente",
    comprobante: { estado: "EN_REVISION", referencia: "OP-99321" },
  });

  assert.equal(cuota.enRevision, true);
  assert.equal(cuota.puedeRegistrarComprobante, false);
  assert.equal(cuota.comprobante.referencia, "OP-99321");
  assert.equal(cuota.comprobante.estadoClave, "EN_REVISION");
});

test("detecta 'En revisión' plano, con acentos y espacios", () => {
  for (const estado of ["En revisión", "EN_REVISION", "en-revision", "En Revisión"]) {
    const cuota = api.normalizarCuotaAlumno({
      idPago: 9,
      estado: "Pendiente",
      EstadoRevisionComprobante: estado,
      ReferenciaComprobante: "REF-1234",
    });
    assert.equal(cuota.enRevision, true, `debe reconocer "${estado}"`);
    assert.equal(cuota.puedeRegistrarComprobante, false);
    assert.equal(cuota.comprobante.referencia, "REF-1234");
  }
});

test("un pago confirmado por el backend no permite registrar otra referencia", () => {
  const cuota = api.normalizarCuotaAlumno({
    idPago: 4,
    monto: 300,
    estado: "Pagado",
    fechaPago: "2026-10-01T10:00:00.000Z",
    EstadoRevisionComprobante: "APROBADO",
  });

  assert.equal(cuota.pagado, true);
  assert.equal(cuota.enRevision, false);
  assert.equal(cuota.puedeRegistrarComprobante, false);
  assert.equal(cuota.fechaPago, "2026-10-01T10:00:00.000Z");
});

test("un comprobante rechazado sí permite volver a registrar la referencia", () => {
  const cuota = api.normalizarCuotaAlumno({
    idPago: 4,
    monto: 300,
    estado: "Pendiente",
    EstadoRevisionComprobante: "RECHAZADO",
    MotivoRevision: "El número de operación no coincide.",
  });

  assert.equal(cuota.enRevision, false);
  assert.equal(cuota.puedeRegistrarComprobante, true);
  assert.equal(
    cuota.comprobante.motivoRevision,
    "El número de operación no coincide.",
  );
});

// --- Resumen ----------------------------------------------------------------

test("el resumen se calcula con montos reales cuando el backend no lo envía", () => {
  const cuotas = [
    api.normalizarCuotaAlumno({ idPago: 1, monto: 300, estado: "Pendiente", FechaVencimiento: "2026-12-15" }),
    api.normalizarCuotaAlumno({ idPago: 2, monto: 200, estado: "Pagado", FechaVencimiento: "2026-10-15" }),
    api.normalizarCuotaAlumno({ idPago: 3, monto: 150, estado: "Pendiente", FechaVencimiento: "2026-11-10", comprobante: { estado: "EN_REVISION", referencia: "X-1" } }),
  ];

  const resumen = api.resumirCuotasAlumno(cuotas);

  assert.equal(resumen.cantidad, 3);
  assert.equal(resumen.cantidadPagadas, 1);
  assert.equal(resumen.cantidadEnRevision, 1);
  assert.equal(resumen.montoPagado, 200);
  assert.equal(resumen.montoPendiente, 450);
  assert.equal(resumen.proximoVencimiento, "2026-11-10");
});

test("el resumen del backend se respeta cuando es válido", () => {
  const cuotas = [api.normalizarCuotaAlumno({ idPago: 1, monto: 100, estado: "Pendiente" })];
  const resumen = api.resumirCuotasAlumno(cuotas, {
    cantidad: 1,
    montoPendiente: "99.90",
    montoPagado: "0",
    proximoVencimiento: "2026-12-01",
  });
  assert.equal(resumen.montoPendiente, 99.9);
  assert.equal(resumen.montoPagado, 0);
  assert.equal(resumen.proximoVencimiento, "2026-12-01");
});

test("sin cuotas el resumen queda en cero y sin vencimiento inventado", () => {
  const resumen = api.resumirCuotasAlumno([], null);
  assert.deepEqual(
    {
      cantidad: resumen.cantidad,
      montoPendiente: resumen.montoPendiente,
      montoPagado: resumen.montoPagado,
      proximoVencimiento: resumen.proximoVencimiento,
    },
    { cantidad: 0, montoPendiente: 0, montoPagado: 0, proximoVencimiento: null },
  );
});

// --- Endpoints del alumno ---------------------------------------------------

test("obtenerMisPagos usa la sesión del JWT y no envía idUsuario", async () => {
  api.guardarToken("token-alumno-a");
  simular([
    200,
    {
      cuotas: [
        { IdPago: 5, Monto: "250", Estado: "Pendiente", Mes: "Noviembre" },
      ],
      resumen: { cantidad: 1, montoPendiente: "250" },
    },
  ]);

  const data = await api.obtenerMisPagos();

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url.endsWith("/api/alumno/pagos"), true);
  assert.equal(llamadas[0].url.includes("idUsuario"), false);
  assert.equal(
    llamadas[0].options.headers.Authorization,
    "Bearer token-alumno-a",
  );
  assert.equal(data.cuotas[0].idPago, 5);
  assert.equal(data.cuotas[0].monto, 250);
  assert.equal(data.resumen.montoPendiente, 250);
});

test("registrarComprobanteAlumno envía solo la referencia (sin monto ni estado)", async () => {
  simular([201, { mensaje: "Referencia recibida." }]);

  await api.registrarComprobanteAlumno(8, {
    referencia: "  OP-778812  ",
    monto: 1,
    estado: "Pagado",
  });

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].options.method, "POST");
  assert.ok(llamadas[0].url.endsWith("/api/alumno/pagos/8/comprobante"));
  assert.deepEqual(JSON.parse(llamadas[0].options.body), {
    referencia: "OP-778812",
  });
});

test("el frontend no puede enviar un importe ni confirmar un pago", async () => {
  simular([200, {}]);
  await api.iniciarPagoAlumno(3);
  assert.deepEqual(JSON.parse(llamadas[0].options.body), {});
  assert.ok(llamadas[0].url.endsWith("/api/alumno/pagos/3/iniciar"));

  await assert.rejects(
    api.registrarComprobanteAlumno(3, { referencia: "AB" }),
    /entre 4 y 120/,
  );
  await assert.rejects(
    api.registrarComprobanteAlumno(3, { referencia: "X".repeat(121) }),
    /entre 4 y 120/,
  );
  assert.equal(llamadas.length, 1, "una referencia inválida no debe llegar al servidor");
});

test("identificadores inválidos no generan peticiones", async () => {
  for (const id of [undefined, null, 0, -1, "abc", 1.5, NaN]) {
    await assert.rejects(api.iniciarPagoAlumno(id), /no es válida/);
    await assert.rejects(
      api.registrarComprobanteAlumno(id, { referencia: "OP-1234" }),
      /no es válida/,
    );
  }
  assert.equal(llamadas.length, 0);
});

test("un 409 por referencia duplicada conserva el mensaje y la sesión", async () => {
  api.guardarToken("token-vigente");
  simular([
    409,
    { error: "Ya existe una referencia pendiente para esta cuota." },
  ]);

  await assert.rejects(
    api.registrarComprobanteAlumno(6, { referencia: "OP-0001" }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /referencia pendiente/);
      return true;
    },
  );
  assert.equal(api.obtenerToken(), "token-vigente");
  assert.equal(window.location.href, "");
});

test("403 en pagos no cierra la sesión del alumno", async () => {
  api.guardarToken("token-vigente");
  api.guardarSesion({ rol: "Alumno" });
  simular([403, { error: "No tienes permisos para realizar esta acción." }]);

  await assert.rejects(api.obtenerMisPagos(), {
    status: 403,
    message: "No tienes permisos para realizar esta acción.",
  });
  assert.equal(api.obtenerToken(), "token-vigente");
});

test("401 en el portal de pagos limpia la sesión y vuelve al inicio", async () => {
  api.guardarToken("token-expirado");
  api.guardarSesion({ rol: "Alumno" });
  simular([401, { error: "Token expirado" }]);

  await assert.rejects(api.obtenerMisPagos(), { status: 401 });
  assert.equal(api.obtenerToken(), null);
  assert.equal(api.obtenerSesion(), null);
  assert.equal(window.location.href, "/");
});

// --- Revisión administrativa ------------------------------------------------

test("obtenerComprobantesPago valida el filtro y lo envía codificado", async () => {
  simular([200, { comprobantes: [{ IdComprobante: 4 }] }]);
  const lista = await api.obtenerComprobantesPago("aprobado");
  assert.equal(lista[0].IdComprobante, 4);
  assert.ok(llamadas[0].url.includes("estado=APROBADO"));

  await assert.rejects(api.obtenerComprobantesPago("BORRADOR"), /no es válido/);
  assert.equal(llamadas.length, 1);
});

test("revisarComprobantePago exige motivo al rechazar y no admite otros estados", async () => {
  for (const estado of ["PENDIENTE", "PAGADO", "", undefined]) {
    await assert.rejects(
      api.revisarComprobantePago(2, estado, "motivo válido"),
      /APROBADO o RECHAZADO/,
    );
  }
  await assert.rejects(
    api.revisarComprobantePago(2, "RECHAZADO", "no"),
    /motivo de 4 a 500/,
  );
  assert.equal(llamadas.length, 0);

  simular([200, { mensaje: "Comprobante rechazado." }]);
  await api.revisarComprobantePago(2, "rechazado", "  La operación no existe.  ");
  assert.equal(llamadas[0].options.method, "PUT");
  assert.ok(llamadas[0].url.endsWith("/api/pagos/comprobantes/2/estado"));
  assert.deepEqual(JSON.parse(llamadas[0].options.body), {
    estado: "RECHAZADO",
    motivo: "La operación no existe.",
  });
});

test("generarMensualidadesCiclo valida periodo y fecha antes de llamar al backend", async () => {
  await assert.rejects(
    api.generarMensualidadesCiclo(3, { periodo: "2026-13", fechaVencimiento: "2026-12-01" }),
    /AAAA-MM/,
  );
  await assert.rejects(
    api.generarMensualidadesCiclo(3, { periodo: "2026-11", fechaVencimiento: "30/11/2026" }),
    /fecha de vencimiento/,
  );
  assert.equal(llamadas.length, 0);

  simular([201, { cuotasCreadas: 12 }]);
  const resultado = await api.generarMensualidadesCiclo(3, {
    periodo: "2026-11",
    fechaVencimiento: "2026-11-30",
    monto: 1,
  });
  assert.equal(resultado.cuotasCreadas, 12);
  assert.deepEqual(JSON.parse(llamadas[0].options.body), {
    periodo: "2026-11",
    fechaVencimiento: "2026-11-30",
  });
});
