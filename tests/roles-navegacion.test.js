import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  esAdmin,
  esAlumno,
  esDocente,
  esGrupo,
  grupoDeRol,
  normalizarRol,
} from "../src/utils/roles.js";

// Pruebas de permisos por rol y de las barreras de navegación del portal de
// pagos. No importan componentes de React: inspeccionan el código fuente real
// y las funciones puras de roles. La validación definitiva sigue en el backend.

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const leer = (rutaRelativa) => readFileSync(join(raiz, rutaRelativa), "utf8");
const sinComentarios = (codigo) =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// --- Funciones de rol -------------------------------------------------------

test("alumno, docente y administrador se reconocen por igualdad exacta", () => {
  assert.equal(esAlumno({ rol: "Alumno" }), true);
  assert.equal(esAlumno({ rol: "Estudiante" }), true);
  assert.equal(esAlumno({ rol: "alumno" }), true);
  assert.equal(esAlumno({ rol: "Docente" }), false);

  assert.equal(esDocente({ rol: "Docente" }), true);
  assert.equal(esDocente({ rol: "Tutor de Aula" }), false);

  assert.equal(esAdmin({ rol: "Administrador" }), true);
  assert.equal(esAdmin({ rol: "Docente" }), false);
  assert.equal(esAdmin({ rol: "Alumno" }), false);
});

test("perfiles parecidos no heredan permisos administrativos", () => {
  for (const rol of [
    "Administrativo",
    "Auxiliar Administrativo",
    "Subadministrador",
    "Alumno Administrador",
    "Docente Administrador",
  ]) {
    assert.equal(grupoDeRol(rol), null, `"${rol}" no debe mapearse a un grupo`);
    assert.equal(esAdmin({ rol }), false, `"${rol}" no debe ser administrador`);
  }
});

test("la normalización de rol ignora acentos, mayúsculas y espacios extra", () => {
  assert.equal(normalizarRol("  TUTOR   DE AULA "), "tutor de aula");
  assert.equal(grupoDeRol("Tutor de Aula"), "tutor");
  assert.equal(esGrupo({ Perfil: "ALUMNO" }, "alumno"), true);
});

// --- Barreras de navegación -------------------------------------------------

test("el alumno nunca renderiza vistas administrativas en App.jsx", () => {
  const app = sinComentarios(leer("src/App.jsx"));

  // Las vistas administrativas viven en la rama else (staff) del ternario.
  for (const vista of ["morosidad", "usuarios", "perfiles", "materiales-admin"]) {
    const patron = new RegExp(
      `activeTab === '${vista}'\\s*&&[^\\n]*(esAdmin|esStaff)`,
    );
    assert.match(app, patron, `La vista ${vista} debe exigir rol administrativo/staff`);
  }

  // El portal del alumno se decide por el perfil real, no por la pestaña guardada.
  assert.match(app, /const esAlumno = esAlumnoRol\(session\)/);
  assert.match(app, /esAlumno \?\s*\(/);
});

test("el menú de pagos solo se ofrece a alumno/estudiante", () => {
  const layout = sinComentarios(leer("src/components/DashboardLayout.jsx"));
  const bloque = layout.slice(
    layout.indexOf("id: 'student-pagos'") - 200,
    layout.indexOf("id: 'student-pagos'") + 220,
  );
  assert.ok(bloque.includes("id: 'student-pagos'"));
  assert.match(bloque, /rolesPermitidos:\s*\['alumno',\s*'estudiante'\]/);
  assert.ok(!bloque.includes("'administrador'"));
  assert.ok(!bloque.includes("'docente'"));
});

test("Morosidad exige administrador tanto en el menú como en App", () => {
  const layout = sinComentarios(leer("src/components/DashboardLayout.jsx"));
  const inicio = layout.indexOf("id: 'morosidad'");
  const bloque = layout.slice(inicio, layout.indexOf("},", inicio));
  assert.match(bloque, /rolesPermitidos:\s*\[\s*'administrador',\s*'admin'\s*\]/);
  assert.ok(!bloque.includes("'docente'"));
  assert.ok(!bloque.includes("'tutor de aula'"));

  const app = sinComentarios(leer("src/App.jsx"));
  assert.match(app, /activeTab === 'morosidad' && esAdmin/);
});

test("el portal de pagos se muestra aunque falle el expediente académico", () => {
  const pagina = sinComentarios(leer("src/pages/StudentIntranetPage.jsx"));
  assert.ok(
    pagina.indexOf("<PanelPagosAlumno />") < pagina.indexOf("if (!ciclo)"),
    "La vista de pagos debe resolverse antes del bloqueo por falta de ciclo",
  );
  assert.match(pagina, /if \(view === VIEWS\.pagos\)\s*\{/);
});

// --- Aislamiento del frontend ----------------------------------------------

test("el portal de pagos no construye URLs ni elige al alumno por su cuenta", () => {
  const panel = sinComentarios(leer("src/components/PanelPagosAlumno.jsx"));
  for (const prohibido of ["fetch(", "/api/", "idUsuario", "localStorage", "document.cookie"]) {
    assert.equal(
      panel.includes(prohibido),
      false,
      `PanelPagosAlumno.jsx no debe contener "${prohibido}"`,
    );
  }
  assert.match(panel, /obtenerMisPagos/);
  assert.match(panel, /registrarComprobanteAlumno/);
});

test("las funciones de pago del alumno no aceptan idUsuario ni monto como parámetro", () => {
  const api = leer("src/services/api.js");
  assert.match(api, /export async function obtenerMisPagos\(\)/);
  assert.match(api, /export async function iniciarPagoAlumno\(idPago\)/);
  assert.match(api, /export async function registrarComprobanteAlumno\(idPago, datos = \{\}\)/);

  const seccion = api.slice(api.indexOf("MORGAN · CONTRATO DE PAGOS"));
  for (const ruta of [
    "/api/alumno/pagos",
    "/api/alumno/pagos/${id}/iniciar",
    "/api/alumno/pagos/${id}/comprobante",
  ]) {
    assert.ok(seccion.includes(ruta), `Debe usar el endpoint real ${ruta}`);
  }
  assert.ok(
    !seccion.includes("idUsuario") && !seccion.includes("idAlumno"),
    "El backend identifica al alumno por el JWT, no por un id del navegador",
  );
});

test("la confirmación de pago depende de la revisión administrativa", () => {
  const panel = sinComentarios(leer("src/components/PanelPagosAlumno.jsx"));
  assert.equal(
    /setCuotas\([\s\S]*estado:\s*['"]Pagado['"]/.test(panel),
    false,
    "El panel del alumno no debe marcar cuotas como pagadas",
  );
  assert.ok(panel.includes("no se marcará como pagada hasta su aprobación"));

  const api = leer("src/services/api.js");
  assert.match(api, /Solo se puede marcar una cuota como morosa/);
});
