import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import * as api from "../src/services/api.js";
import { descargarMaterial, nombreDescargaMaterial } from "../src/services/materiales.api.js";

// HU-19: el PDF se pide con el token de la sesión, nunca por la URL pública.
const originales = { fetch: globalThis.fetch, document: globalThis.document,
  storage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
  crear: URL.createObjectURL, revocar: URL.revokeObjectURL };
let llamadas; let clics;

beforeEach(() => {
  const valores = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (k) => valores.get(k) ?? null, setItem: (k, v) => valores.set(k, String(v)), removeItem: (k) => valores.delete(k) } });
  api.guardarToken("token-de-prueba");
  llamadas = []; clics = [];
  globalThis.document = { body: { appendChild() {} }, createElement: () => {
    const a = { click() { clics.push({ href: a.href, download: a.download }); }, remove() {} }; return a; } };
  URL.createObjectURL = () => "blob:material"; URL.revokeObjectURL = () => {};
});

after(() => {
  globalThis.fetch = originales.fetch; globalThis.document = originales.document;
  URL.createObjectURL = originales.crear; URL.revokeObjectURL = originales.revocar;
  if (originales.storage) Object.defineProperty(globalThis, "localStorage", originales.storage);
  else delete globalThis.localStorage;
});

test("descarga el material con Authorization y el endpoint protegido", async () => {
  globalThis.fetch = async (url, options = {}) => {
    llamadas.push({ url: String(url), options });
    return new Response("%PDF-1.4", { status: 200, headers: { "Content-Type": "application/pdf" } });
  };
  await descargarMaterial({ idMaterial: 5, nombreArchivo: "Guía 1.pdf",
    urlArchivo: "https://api/uploads/materiales/guia.pdf" });
  assert.equal(llamadas.length, 1);
  assert.match(llamadas[0].url, /\/api\/materiales\/5\/descargar$/);
  assert.doesNotMatch(llamadas[0].url, /uploads/);
  assert.equal(llamadas[0].options.headers.Authorization, "Bearer token-de-prueba");
  assert.deepEqual(clics, [{ href: "blob:material", download: "Guía 1.pdf" }]);
});

test("un 404 del backend muestra su mensaje y no descarga nada", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Material no encontrado." }),
    { status: 404, headers: { "Content-Type": "application/json" } });
  await assert.rejects(descargarMaterial({ idMaterial: 9 }), /Material no encontrado/);
  assert.equal(clics.length, 0);
});

test("sin id válido no se hace ninguna petición y el nombre siempre termina en .pdf", async () => {
  globalThis.fetch = async () => { throw new Error("no debía llamar"); };
  await assert.rejects(descargarMaterial({ idMaterial: "x" }), /identificador/);
  assert.equal(nombreDescargaMaterial({ titulo: 'Álgebra: semana 1/2' }), "Álgebra  semana 1 2.pdf");
  assert.equal(nombreDescargaMaterial({}), "material.pdf");
});
