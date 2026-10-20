import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/services/api.js';
import { esCalificacionValida, promedioCalificaciones, escalaPorUniversidad, esCalificacionEntera, calificacionEntera, estadoNota, notaEsEditable, seleccionarNotaDelAlumno, planificarGuardadoNotas } from '../src/utils/calificaciones.js';

// Solo respuestas simuladas: nunca se llama a la API publicada ni se escribe en la BD.
const fetchOriginal = globalThis.fetch;
const storageOriginal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const windowOriginal = Object.getOwnPropertyDescriptor(globalThis, 'window');
let llamadas;

beforeEach(() => {
  const valores = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (clave) => valores.get(clave) ?? null,
    setItem: (clave, valor) => valores.set(clave, String(valor)),
    removeItem: (clave) => valores.delete(clave),
  } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { href: '' }, dispatchEvent: () => {},
  } });
  api.limpiarSesion();
  llamadas = [];
  globalThis.fetch = async () => { throw new Error('Una prueba intentó usar la red sin respuesta simulada.'); };
});

after(() => {
  globalThis.fetch = fetchOriginal;
  if (storageOriginal) Object.defineProperty(globalThis, 'localStorage', storageOriginal);
  else delete globalThis.localStorage;
  if (windowOriginal) Object.defineProperty(globalThis, 'window', windowOriginal);
  else delete globalThis.window;
});

function simular(...respuestas) {
  globalThis.fetch = async (url, options = {}) => {
    llamadas.push({ url, options });
    assert.ok(respuestas.length, 'Petición inesperada');
    const [status, body] = respuestas.shift();
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
}

test('promedio excluye vacíos, nulos y no numéricos, pero conserva cero', () => {
  assert.equal(promedioCalificaciones([null, undefined, '', ' ', 'abc', Infinity, false]), null);
  assert.equal(promedioCalificaciones([0, '', null, 20]), 10);
  // Ya no se promedian decimales: las calificaciones son enteras por contrato.
  assert.equal(esCalificacionValida(0), true);
});

test('escalas por universidad y fallback coinciden con el contrato de notas', () => {
  for (const [universidad, escala] of Object.entries({ UNMSM: 2000, UNI: 2000, PUCP: 1000, UNFV: 1000, UNAC: 100, UNT: 300, Preuniversitario: 20 })) {
    assert.equal(escalaPorUniversidad(universidad), escala);
  }
  assert.equal(escalaPorUniversidad(' preuniversitario '), 20);
  assert.equal(escalaPorUniversidad('desconocida'), 2000);
});

test('listas directas, envueltas y anidadas se normalizan sin map sobre objetos', () => {
  const lista = [{ id: 1 }];
  for (const datos of [lista, { data: lista }, { ciclos: lista }, { data: { ciclos: lista } }]) {
    assert.deepEqual(api.normalizarListaRespuesta(datos, ['ciclos']), lista);
  }
  assert.deepEqual(api.normalizarListaRespuesta(null), []);
  assert.deepEqual(api.normalizarListaRespuesta({ data: {} }), []);
});

test('normalizador de notas preserva cero y no convierte null a cero', () => {
  assert.equal(api.normalizarNota({ Calificacion: 0 }).calificacion, 0);
  for (const Calificacion of [null, undefined, '', ' ', 'abc']) {
    assert.equal(api.normalizarNota({ Calificacion }).calificacion, null);
  }
  // El backend exige Calificacion ENTERO; los decimales se rechazan.
  const nota12punto5 = api.normalizarNota({ IdEvaluacion: '7', IdMatricula: '8', Calificacion: '12.5' });
  assert.equal(nota12punto5.calificacion, null);
  const nota12punto5coma = api.normalizarNota({ IdEvaluacion: '7', IdMatricula: '8', Calificacion: '12,5' });
  assert.equal(nota12punto5coma.calificacion, null);
});

test('normalizador de ciclos conserva precio cero, estado y capacidad', () => {
  const ciclo = api.normalizarCiclo({ IdCiclo: '4', Nombre: ' Ciclo UNI ', EstadoRegistro: 1, Precio: 0, Capacidad: 80, TotalAlumnos: '3' });
  assert.equal(ciclo.idCiclo, 4);
  assert.equal(ciclo.nombre, 'Ciclo UNI');
  assert.equal(ciclo.precio, 0);
  assert.equal(ciclo.publicar, true);
  assert.equal(ciclo.totalAlumnos, 3);
  assert.equal(api.normalizarCiclo({ EstadoRegistro: 0 }).publicar, false);
});

test('materiales PascalCase y camelCase quedan disponibles para la UI', async () => {
  simular([200, { data: [{ IdMaterial: '5', Titulo: 'Guía', UrlArchivo: 'https://example.test/guia.pdf', Curso: 'Álgebra' }] }]);
  const [material] = await api.obtenerMaterialesAdmin(4);
  assert.equal(material.idMaterial, 5);
  assert.equal(material.titulo, 'Guía');
  assert.equal(material.curso, 'Álgebra');
  assert.equal(material.urlArchivo, 'https://example.test/guia.pdf');
});

test('login usa user como objeto, usuario como nombre y conserva contraseña sin trim', async () => {
  simular([200, { token: 'token-simulado', usuario: 'Ana Pérez', rol: 'Alumno', idPerfil: 4, user: { id: 8, correo: 'ana@example.test' } }]);
  const resultado = await api.iniciarSesion('  ALU-8  ', ' clave con espacios ');
  assert.equal(resultado.sesion.idUsuario, 8);
  assert.equal(resultado.sesion.nombre, 'Ana Pérez');
  assert.equal(api.obtenerSesion().correo, 'ana@example.test');
  assert.equal(api.obtenerToken(), 'token-simulado');
  assert.equal(api.obtenerSesion().token, undefined);
  assert.equal(JSON.parse(llamadas[0].options.body).password, ' clave con espacios ');
  assert.equal(JSON.parse(llamadas[0].options.body).usuario, 'ALU-8');
});

test('login sin token o perfil no crea una sesión', async () => {
  simular([200, { rol: 'Alumno' }], [200, { token: 'simulado' }]);
  await assert.rejects(api.iniciarSesion('alu', 'clave'), /token/);
  await assert.rejects(api.iniciarSesion('alu', 'clave'), /perfil/);
  assert.equal(api.obtenerSesion(), null);
  assert.equal(api.obtenerToken(), null);
});

test('fetch autenticado envía JWT y mantiene status y mensaje de conflictos', async () => {
  api.guardarToken('token-simulado');
  simular([409, { error: 'Ya existe un ciclo con ese nombre.' }]);
  await assert.rejects(api.fetchWithAuth('/api/admin/ciclos'), (error) => {
    assert.equal(error.status, 409);
    assert.equal(api.mensajeErrorApi(error), 'Ya existe un ciclo con ese nombre.');
    return true;
  });
  assert.equal(llamadas[0].options.headers.Authorization, 'Bearer token-simulado');
});

test('403 no cierra sesión; 401 limpia sesión y redirige al inicio', async () => {
  api.guardarToken('simulado');
  api.guardarSesion({ rol: 'Docente' });
  simular([403, {}], [401, {}]);
  await assert.rejects(api.fetchWithAuth('/api/admin/ciclos'), { status: 403 });
  assert.equal(api.obtenerToken(), 'simulado');
  await assert.rejects(api.fetchWithAuth('/api/admin/ciclos'), { status: 401 });
  assert.equal(api.obtenerToken(), null);
  assert.equal(api.obtenerSesion(), null);
  assert.equal(window.location.href, '/');
});

test('413 devuelve explicación legible incluso con respuesta HTML del proxy', async () => {
  globalThis.fetch = async () => new Response('<html>Too large</html>', { status: 413 });
  await assert.rejects(api.subirMaterialPDF({}), (error) => error.status === 413 && /10 MB/.test(error.message));
});

test('errores 5xx no revelan detalles internos y no disparan fallback público', async () => {
  simular([500, { error: 'detalle interno de BD' }]);
  await assert.rejects(api.obtenerCiclosGestionActivos(), (error) => error.status === 500 && !error.message.includes('BD'));
  assert.equal(llamadas.length, 1);
});

test('sin conexión se muestra un mensaje en español', async () => {
  await assert.rejects(api.obtenerNotas(), /No se pudo conectar con el servidor/);
});

test('páginas de gestión usan ciclos admin y excluyen ciclos cerrados', async () => {
  simular([200, { ciclos: [{ IdCiclo: 1, EstadoRegistro: 1 }, { IdCiclo: 2, EstadoRegistro: 0 }] }]);
  const lista = await api.obtenerCiclosGestionActivos();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].idCiclo, 1);
  assert.ok(llamadas[0].url.endsWith('/api/admin/ciclos'));
});

test('docente/tutor con 403 usa ciclos públicos activos', async () => {
  simular([403, {}], [200, [{ idCiclo: 6, estadoRegistro: 1 }]]);
  assert.equal((await api.obtenerCiclosGestionActivos())[0].idCiclo, 6);
  assert.ok(llamadas[1].url.endsWith('/api/ciclos/publicos'));
});

test('dashboard usa el overview real y normaliza los contadores', async () => {
  simular([200, { resumen: { estudiantes: '8', estudiantesMorosos: '2', promedioInstitucional: '12.5' }, ciclos: [{ idCiclo: 3 }], rendimientoPorCiclo: [{ idCiclo: 3, promedio: 12.5, evaluaciones: 1 }] }]);
  const datos = await api.obtenerDashboardAdmin();
  assert.equal(datos.resumen.estudiantes, 8);
  assert.equal(datos.resumen.promedioInstitucional, 12.5);
  assert.equal(datos.rendimientoPorCiclo.length, 1);
  assert.ok(llamadas[0].url.endsWith('/api/admin/dashboard/overview'));
});

test('ciclos create/update solo envían campos persistidos del contrato', async () => {
  simular([201, { id: 3 }], [200, { id: 3 }]);
  const ciclo = { nombre: 'Ciclo UNI 2026', universidadObjetivo: 'UNI', capacidad: 50, precio: 0, cursosSeleccionados: ['7'], publicar: true, tipo: 'Anual', modalidad: 'Virtual', periodo: '2026' };
  await api.crearCicloAdmin(ciclo);
  await api.actualizarCicloAdmin(3, ciclo);
  for (const llamada of llamadas) {
    const cuerpo = JSON.parse(llamada.options.body);
    for (const campo of ['tipo', 'modalidad', 'periodo']) assert.equal(Object.hasOwn(cuerpo, campo), false);
    assert.deepEqual(cuerpo.cursosSeleccionados, [7]);
    assert.equal(cuerpo.precio, 0);
  }
});

test('PDF conserva transporte Base64 en JSON; no usa FormData', async () => {
  const fileData = 'JVBERi0xLjQKcHJ1ZWJh';
  simular([201, { idMaterial: 9, titulo: 'Guía' }]);
  const material = await api.subirMaterialPDF({ idCiclo: 3, idCurso: 7, titulo: 'Guía', fileData });
  assert.equal(material.idMaterial, 9);
  assert.equal(JSON.parse(llamadas[0].options.body).fileData, fileData);
  assert.equal(llamadas[0].options.headers['Content-Type'], 'application/json');
});

test('notas update usa PUT y rechaza borrar valores persistidos', async () => {
  for (const valor of ['', ' ', null, undefined, NaN]) {
    await assert.rejects(api.actualizarNotaDocente(4, valor), /calificación debe ser/);
  }
  simular([200, { ok: true }]);
  await api.actualizarNotaDocente(4, 0);
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].options.method, 'PUT');
  assert.equal(JSON.parse(llamadas[0].options.body).Calificacion, 0);
});

test('IDs ausentes no generan peticiones /undefined', async () => {
  await assert.rejects(api.eliminarMaterial(undefined), /identificador/);
  await assert.rejects(api.obtenerCursosCiclo(undefined), /identificador/);
  assert.equal(llamadas.length, 0);
});

test('pagos solo permiten los estados Pagado/Moroso', async () => {
  await assert.rejects(api.actualizarEstadoPago(1, 'Pendiente'), /Pagado/);
  simular([200, { ok: true }]);
  await api.actualizarEstadoPago(1, 'Pagado');
  assert.equal(JSON.parse(llamadas[0].options.body).Estado, 'Pagado');
});

test('comunicados convierten flags 0/1 y strings sin falso indicador', async () => {
  simular([200, { comunicados: [{ id: 1, leido: '0', confirmado: 0 }, { id: 2, leido: '1', confirmado: 1 }] }]);
  const lista = await api.obtenerComunicados();
  assert.equal(lista[0].leido, false);
  assert.equal(lista[1].confirmado, true);
});

test('peticiones simultáneas al expediente se comparten y no cruzan sesión', async () => {
  api.guardarToken('sesion-simulada-a');
  simular([200, { usuario: { idUsuario: 1 } }], [200, { usuario: { idUsuario: 2 } }]);
  const [a, b] = await Promise.all([api.obtenerMiIntranetAlumno(), api.obtenerMiIntranetAlumno()]);
  assert.deepEqual(a, b);
  assert.equal(llamadas.length, 1);
  api.guardarToken('sesion-simulada-b');
  assert.equal((await api.obtenerMiIntranetAlumno()).usuario.idUsuario, 2);
  assert.equal(llamadas.length, 2);
});

test('actualización explícita del expediente omite el caché breve', async () => {
  simular([200, { version: 1 }], [200, { version: 2 }]);
  await api.obtenerMiIntranetAlumno();
  assert.equal((await api.obtenerMiIntranetAlumno({ force: true })).version, 2);
});

test('cambio de token en almacenamiento no reutiliza el expediente anterior', async () => {
  simular([200, { version: 1 }], [200, { version: 2 }]);
  localStorage.setItem('acadesys_token', 'simulado-a');
  await api.obtenerMiIntranetAlumno();
  localStorage.setItem('acadesys_token', 'simulado-b');
  assert.equal((await api.obtenerMiIntranetAlumno()).version, 2);
});

test('contexto de notas acepta escala numérica y mantiene ausencias como null', async () => {
  simular([200, { data: { IdCiclo: 1, EscalaMaxima: '2000' } }], [200, { idCiclo: 2, escalaMaxima: null }]);
  assert.equal((await api.obtenerContextoNotas(1)).escalaMaxima, 2000);
  assert.equal((await api.obtenerContextoNotas(2)).escalaMaxima, null);
});

test('Tutor IA envía solo la pregunta y no fabrica un expediente', async () => {
  simular([200, { respuesta: 'Respuesta simulada' }]);
  await api.consultarTutorIA('  ¿Cómo estudiar álgebra?  ');
  assert.deepEqual(JSON.parse(llamadas[0].options.body), { pregunta: '¿Cómo estudiar álgebra?' });
  await assert.rejects(api.consultarTutorIA(''), /2000/);
});

test('actualización de usuario conserva apellido materno y contraseña exacta', async () => {
  simular([200, { ok: true }]);
  await api.actualizarUsuario(4, { apellidoMaterno: 'Díaz', contrasena: ' clave exacta ' });
  const cuerpo = JSON.parse(llamadas[0].options.body);
  assert.equal(cuerpo.ApellidoMaterno, 'Díaz');
  assert.equal(cuerpo.Clave, ' clave exacta ');
  assert.equal(Object.hasOwn(cuerpo, 'EstadoRegistro'), false);
});

// === NUEVAS PRUEBAS DE INTEGRACIÓN BACKEND/FRONTEND ===

test('helper esCalificacionEntera acepta enteros y cadenas de dígitos', () => {
  assert.equal(esCalificacionEntera(0), true);
  assert.equal(esCalificacionEntera(1), true);
  assert.equal(esCalificacionEntera(12), true);
  assert.equal(esCalificacionEntera(2000), true);
  assert.equal(esCalificacionEntera('-1'), false);
  assert.equal(esCalificacionEntera('0'), true);
  assert.equal(esCalificacionEntera('1'), true);
  assert.equal(esCalificacionEntera('12'), true);
  assert.equal(esCalificacionEntera('2000'), true);
  assert.equal(esCalificacionEntera('12.5'), false);
  assert.equal(esCalificacionEntera('12,5'), false);
  assert.equal(esCalificacionEntera('abc'), false);
  assert.equal(esCalificacionEntera(''), false);
  assert.equal(esCalificacionEntera(NaN), false);
  assert.equal(esCalificacionEntera(Infinity), false);
});

test('helper calificacionEntera devuelve entero o null (sin redondear)', () => {
  assert.equal(calificacionEntera(0), 0);
  assert.equal(calificacionEntera(1), 1);
  assert.equal(calificacionEntera(12), 12);
  assert.equal(calificacionEntera(2000), 2000);
  assert.equal(calificacionEntera('-1'), null);
  assert.equal(calificacionEntera('0'), 0);
  assert.equal(calificacionEntera('1'), 1);
  assert.equal(calificacionEntera('12'), 12);
  assert.equal(calificacionEntera('2000'), 2000);
  assert.equal(calificacionEntera('12.5'), null);
  assert.equal(calificacionEntera('12,5'), null);
  assert.equal(calificacionEntera('abc'), null);
  assert.equal(calificacionEntera(''), null);
  assert.equal(calificacionEntera(NaN), null);
  assert.equal(calificacionEntera(Infinity), null);
});

test('promedioCalificaciones usa calificaciones enteras y filtra null', () => {
  assert.equal(promedioCalificaciones([null, undefined, '', ' ', 'abc', Infinity, false]), null);
  assert.equal(promedioCalificaciones([0, '', null, 20]), 10);
  assert.equal(promedioCalificaciones([0, 20]), 10);
});

test('estadoNota clasifica 1 como vigente, 2 como acta cerrada, -1 como baja', () => {
  // Usar los valores constantes del contrato (1=vigente, 2=acta cerrada, -1=baja).
  const VIGENTE = 1;
  const ACTA_CERRADA = 2;
  const BAJA = -1;
  assert.equal(estadoNota(1), VIGENTE);
  assert.equal(estadoNota(2), ACTA_CERRADA);
  assert.equal(estadoNota(-1), BAJA);
  assert.equal(estadoNota(null), VIGENTE);
  assert.equal(estadoNota(undefined), VIGENTE);
  assert.equal(estadoNota(0), VIGENTE);
});

test('notaEsEditable devuelve true solo para estado 1', () => {
  assert.equal(notaEsEditable(1), true);
  assert.equal(notaEsEditable(2), false);
  assert.equal(notaEsEditable(-1), false);
  assert.equal(notaEsEditable(null), true);
});

test('seleccionarNotaDelAlumno prioriza notas vigentes sobre cerradas', () => {
  const notas = [
    { idMatricula: 1, Calificacion: 15, estadoRegistro: 1, TipoEvaluacion: 'Examen', Periodo: 'General' },
    { idMatricula: 1, Calificacion: 12, estadoRegistro: 2, TipoEvaluacion: 'Examen', Periodo: 'General' },
    { idMatricula: 1, Calificacion: 10, estadoRegistro: -1, TipoEvaluacion: 'Examen', Periodo: 'General' },
  ];
  const seleccionada = seleccionarNotaDelAlumno(notas, { idMatricula: 1, tipoEvaluacion: 'Examen', periodo: 'General' });
  assert.equal(seleccionada?.Calificacion, 15);
});

test('planificarGuardadoNotas separa nuevas, existentes y omitidas', () => {
  const estudiantes = [
    { idMatricula: 99, calificacion: '10' },
    { idMatricula: 98, calificacion: '12.5' },
    { idEvaluacion: 5, calificacion: '18', editable: true },
    { idEvaluacion: 6, calificacion: '15', editable: false },
    { idEvaluacion: 7, calificacion: '', calificacionEditada: true },
    { idMatricula: 97, calificacion: '', calificacionEditada: true },
    { idMatricula: 96, calificacion: '9999' },
  ];
  const plan = planificarGuardadoNotas(estudiantes, { escalaMaxima: 2000 });
  assert.equal(plan.nuevas.length, 1);
  assert.equal(plan.invalidas.length, 2);
  assert.equal(plan.existentes.length, 1);
  assert.equal(plan.omitidas.length, 1);
  assert.equal(plan.vaciasNuevas.length, 1);
  assert.equal(plan.vaciasPersistidas.length, 1);
});

test('verificarMatriculaExistente devuelve solo campos del contrato reducido', async () => {
  simular([200, {
    existe: true,
    esAlumno: true,
    puedeReinscribirse: true,
    yaInscritoEnCiclo: false,
    mensaje: 'Matrícula verificada',
    cicloSeleccionado: { nombre: 'Ciclo UNI 2026' },
    ciclos: [{ nombre: 'Ciclo UNI 2026' }, { nombre: 'Ciclo UNI 2025' }]
  }]);
  const resultado = await api.verificarMatriculaExistente('prueba@test.com', 1);
  assert.equal(resultado.existe, true);
  assert.equal(resultado.esAlumno, true);
  assert.equal(resultado.mensaje, 'Matrícula verificada');
  assert.equal(resultado.cicloSeleccionado?.nombre, 'Ciclo UNI 2026');
  assert.equal(Array.isArray(resultado.ciclos), true);
  assert.equal(resultado.ciclos?.length, 2);
  const camposContrato = ['existe', 'esAlumno', 'puedeReinscribirse', 'yaInscritoEnCiclo', 'mensaje', 'cicloSeleccionado', 'ciclos'];
  const camposExtra = Object.keys(resultado).filter(k => !camposContrato.includes(k));
  assert.equal(camposExtra.length, 0, 'No deben haber campos ajenos al contrato reducido');
});

// === FIN NUEVAS PRUEBAS ===
