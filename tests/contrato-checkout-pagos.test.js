import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import * as api from "../src/services/api.js";
import {
  crearCheckoutPagoAlumno,
  consultarEstadoPagoAlumno,
  urlCheckoutValida,
} from "../src/services/pagosOnline.api.js";

// Contrato del checkout online del alumno. Todo se simula: nunca se llama a
// Mercado Pago, al backend publicado ni se escribe en la base de datos.

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

test("solo acepta URLs https del dominio de Mercado Pago", () => {  assert.equal(
    urlCheckoutValida(
      "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=pref-1",
    ),
    true,
  );
  assert.equal(
    urlCheckoutValida("https://mercadopago.com/checkout/v1/redirect"),
    true,
  );
  assert.equal(urlCheckoutValida("http://www.mercadopago.com.pe/checkout"), false);
  assert.equal(urlCheckoutValida("https://mercadopago.com.evil.test/checkout"), false);
  assert.equal(urlCheckoutValida("https://evilmercadopago.com/checkout"), false);
  assert.equal(urlCheckoutValida("javascript:alert(1)"), false);
  assert.equal(urlCheckoutValida(""), false);
});
