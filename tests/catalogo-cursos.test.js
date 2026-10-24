// ============================================================
// Pestaña «Cursos Académicos» (Administrador → Gestión Académica):
// el catálogo GLOBAL se organiza con FILTRO POR UNIVERSIDAD derivado de los
// DATOS + búsqueda textual + orden agrupado.
//
// Fuente de verdad: Curso.UniversidadObjetivo (campo estructurado de
// GET /api/cursos). Los prefijos de código (SM-, UNI-, PUCP-, FV-, UNAC-)
// son descriptivos: NINGUNA prueba ni implementación los usa para decidir
// la universidad.
//
// Fixture con la forma real del catálogo y la distribución vigente:
// UNMSM 17, UNFV 16, UNAC 14, PUCP 12, UNI 11, Preuniversitario 1 = 71.
// ============================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  claveUniversidadCurso,
  coincideBusquedaCurso,
  catalogoCursosVisible,
  universidadesDelCatalogo
} from '../src/utils/catalogoCursos.js';

// ------------------------------------------------------------
// Fixture: 71 cursos reales (misma distribución que producción).
// ------------------------------------------------------------
const MATERIAS = [
  'Álgebra',
  'Aritmética',
  'Biología',
  'Comunicación',
  'Ecuaciones Diferenciales',
  'Estática',
  'Física',
  'Geometría',
  'Habilidad Verbal',
  'Historia',
  'Literatura',
  'Lógica',
  'Química',
  'Razonamiento Matemático',
  'Termodinámica',
  'Trigonometría',
  'Vocabulario'
];

// El prefijo del código es SOLO descriptivo (como en la BD): SM-, FV-, ...
const DISTRIBUCION = [
  ['UNMSM', 17, 'SM-'],
  ['UNFV', 16, 'FV-'],
  ['UNAC', 14, 'UNAC-'],
  ['PUCP', 12, 'PUCP-'],
  ['UNI', 11, 'UNI-'],
  ['Preuniversitario', 1, 'PRE-']
];

let siguienteId = 0;
const CATALOGO = [];
for (const [universidad, total, prefijo] of DISTRIBUCION) {
  for (let indice = 0; indice < total; indice += 1) {
    siguienteId += 1;
    CATALOGO.push({
      idCurso: siguienteId,
      nombre: MATERIAS[indice % MATERIAS.length],
      codigo: `${prefijo}${String(indice + 1).padStart(2, '0')}`,
      universidadObjetivo: universidad
    });
  }
}
assert.equal(CATALOGO.length, 71, 'el fixture debe reproducir el catálogo de 71 cursos');

// Mapa de etiquetas canónicas (la pantalla lo deriva del helper centralizado
// universidadCiclo.js; aquí se replica mínimo para las pruebas).
const ETIQUETAS = {
  unmsm: 'UNMSM',
  unfv: 'UNFV',
  unac: 'UNAC',
  uni: 'UNI',
  pucp: 'PUCP',
  preuniversitario: 'Preuniversitario'
};

const NOMBRES_COMPLETOS = {
  unmsm: 'Universidad Nacional Mayor de San Marcos',
  unfv: 'Universidad Nacional Federico Villarreal',
  unac: 'Universidad Nacional del Callao',
  uni: 'Universidad Nacional de Ingeniería',
  pucp: 'Pontificia Universidad Católica del Perú',
  preuniversitario: 'Preuniversitario'
};

const resolverPrueba = (clave) => NOMBRES_COMPLETOS[clave] || '';

const contarGrupos = (lista) => {
  const grupos = [];
  for (const curso of lista) {
    const clave = claveUniversidadCurso(curso);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.total += 1;
    else grupos.push({ clave, total: 1 });
  }
  return grupos;
};

// ------------------------------------------------------------
// 1) «Todos»: el catálogo global COMPLETO (71 cursos del fixture).
// ------------------------------------------------------------
test('Todos: muestra el catálogo global completo sin ocultar ninguna universidad', () => {
  const visibles = catalogoCursosVisible(CATALOGO, { universidad: 'todos' });
  assert.equal(visibles.length, 71);
  assert.equal(new Set(visibles.map((curso) => curso.idCurso)).size, 71, 'sin cursus duplicados');
  // Sin filtro también muestra todo (comportamiento por defecto).
  assert.equal(catalogoCursosVisible(CATALOGO).length, 71);
});

// ------------------------------------------------------------
// 2) Chips derivados de los DATOS con cantidades reales (nada hardcodeado).
// ------------------------------------------------------------
test('los chips por universidad se derivan de los datos con sus cantidades reales', () => {
  const grupos = universidadesDelCatalogo(CATALOGO, ETIQUETAS);
  assert.deepEqual(
    grupos.map((grupo) => [grupo.etiqueta, grupo.total]),
    [
      ['UNMSM', 17],
      ['UNFV', 16],
      ['UNAC', 14],
      ['PUCP', 12],
      ['UNI', 11],
      ['Preuniversitario', 1]
    ],
    'cantidades reales y orden por mayor cantidad primero'
  );
});

// ------------------------------------------------------------
// 3-5) Filtros UNMSM, UNFV e UNI: SOLO UniversidadObjetivo de esa universidad
//      (la fuente de verdad nunca es el prefijo del código).
// ------------------------------------------------------------
test('Filtro UNMSM: solo cursos con UniversidadObjetivo = UNMSM', () => {
  // Un curso con prefijo SM- pero de OTRA universidad NO entra en UNMSM.
  const mezcla = [
    ...CATALOGO,
    { idCurso: 900, nombre: 'Estadística', codigo: 'SM-EST', universidadObjetivo: 'PUCP' }
  ];
  const unmsm = catalogoCursosVisible(mezcla, { universidad: 'unmsm' });
  assert.equal(unmsm.length, 17);
  assert.ok(unmsm.every((curso) => claveUniversidadCurso(curso) === 'unmsm'));
  assert.ok(unmsm.every((curso) => curso.universidadObjetivo === 'UNMSM'));
});

test('el prefijo del código NO decide la universidad: un curso «SM-» de PUCP aparece en PUCP', () => {
  const mezcla = [
    ...CATALOGO,
    { idCurso: 900, nombre: 'Estadística', codigo: 'SM-EST', universidadObjetivo: 'PUCP' }
  ];
  const pucp = catalogoCursosVisible(mezcla, { universidad: 'pucp' });
  assert.equal(pucp.length, 13, 'PUCP gana el curso mal prefijado');
  assert.ok(pucp.some((curso) => curso.codigo === 'SM-EST'));
  const unmsm = catalogoCursosVisible(mezcla, { universidad: 'unmsm' });
  assert.ok(!unmsm.some((curso) => curso.codigo === 'SM-EST'));
});

test('Filtro UNFV: solo cursos con UniversidadObjetivo = UNFV', () => {
  const unfv = catalogoCursosVisible(CATALOGO, { universidad: 'unfv' });
  assert.equal(unfv.length, 16);
  assert.ok(unfv.every((curso) => claveUniversidadCurso(curso) === 'unfv'));
});

test('Filtro UNI: solo cursos con UniversidadObjetivo = UNI', () => {
  const uni = catalogoCursosVisible(CATALOGO, { universidad: 'uni' });
  assert.equal(uni.length, 11);
  assert.ok(uni.every((curso) => claveUniversidadCurso(curso) === 'uni'));
});

test('los filtros son insensibles a mayúsculas y espacios', () => {
  assert.equal(catalogoCursosVisible(CATALOGO, { universidad: ' UNMSM ' }).length, 17);
  assert.equal(catalogoCursosVisible(CATALOGO, { universidad: ' PeRsI-90 ' }).length, 0);
});

// ------------------------------------------------------------
// 6) Búsqueda DENTRO del filtro (universidad + texto a la vez).
// ------------------------------------------------------------
test('filtro + búsqueda: dentro de UNFV, «álgebra» (sin tilde) solo encuentra su Álgebra', () => {
  const resultados = catalogoCursosVisible(CATALOGO, { universidad: 'unfv', texto: 'algebra' });
  assert.deepEqual(
    resultados.map((curso) => curso.codigo),
    ['FV-01']
  );
  // Con tilde el mismo resultado (la búsqueda ignora acentos).
  assert.deepEqual(
    catalogoCursosVisible(CATALOGO, { universidad: 'unfv', texto: 'Álgebra' }).map((curso) => curso.codigo),
    ['FV-01']
  );
});

test('la búsqueda por universidad encuentra por nombre completo (vía helper centralizado)', () => {
  const resultados = catalogoCursosVisible(CATALOGO, {
    universidad: 'todos',
    texto: 'villarreal',
    etiquetasUniversidad: ETIQUETAS,
    resolverNombreUniversidad: resolverPrueba
  });
  assert.equal(resultados.length, 16, 'busca TODOS los cursos de UNFV por su nombre completo');
  assert.ok(resultados.every((curso) => claveUniversidadCurso(curso) === 'unfv'));
  // «San Marcos» encuentra UNMSM a través del resolver.
  const sanMarcos = catalogoCursosVisible(CATALOGO, {
    texto: 'san marcos',
    resolverNombreUniversidad: resolverPrueba
  });
  assert.equal(sanMarcos.length, 17);
});

test('el texto de búsqueda también busca la sigla y el código', () => {
  assert.equal(catalogoCursosVisible(CATALOGO, { texto: 'UNAC-05' }).length, 1);
  assert.equal(catalogoCursosVisible(CATALOGO, { texto: 'unac' }).length, 14);
});

// ------------------------------------------------------------
// 7) Orden con «Todos»: Universidad → Nombre → Código (agrupado naturalmente
//    en el mismo orden de los chips; a nombres iguales desempata el código;
//    NUNCA el orden de ids).
// ------------------------------------------------------------
test('orden en «Todos»: por universidad (igual que los chips) y alfabético dentro de cada grupo', () => {
  const visibles = catalogoCursosVisible(CATALOGO, { universidad: 'todos', etiquetasUniversidad: ETIQUETAS });
  assert.deepEqual(
    contarGrupos(visibles).map((grupo) => grupo.clave),
    ['unmsm', 'unfv', 'unac', 'pucp', 'uni', 'preuniversitario']
  );
  assert.deepEqual(
    contarGrupos(visibles).map((grupo) => grupo.total),
    [17, 16, 14, 12, 11, 1]
  );
  // Dentro de UNMSM (primeros 17): alfabético por nombre, sin depender del id.
  const nombresUnmsm = visibles.slice(0, 17).map((curso) => curso.nombre);
  assert.deepEqual(
    nombresUnmsm,
    [...nombresUnmsm].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  );
  assert.equal(nombresUnmsm[0], 'Álgebra');
});

test('a nombres iguales DENTRO de una universidad desempata el código', () => {
  const conDuplicado = [
    { idCurso: 50, nombre: 'Álgebra', codigo: 'Z-ALG-2', universidadObjetivo: 'UTP' },
    { idCurso: 49, nombre: 'Álgebra', codigo: 'Z-ALG-1', universidadObjetivo: 'UTP' }
  ];
  const visibles = catalogoCursosVisible(conDuplicado, { universidad: 'utp' });
  assert.deepEqual(
    visibles.map((curso) => curso.codigo),
    ['Z-ALG-1', 'Z-ALG-2'],
    'el orden NUNCA depende del id'
  );
});

// ------------------------------------------------------------
// 8) Orden con una universidad seleccionada: Nombre → Código.
// ------------------------------------------------------------
test('orden con universidad seleccionada: Nombre → Código', () => {
  const uni = catalogoCursosVisible(CATALOGO, { universidad: 'uni' });
  const nombres = uni.map((curso) => curso.nombre);
  assert.deepEqual(
    nombres,
    [...nombres].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  );
  assert.equal(uni[0].nombre, 'Álgebra');
});

// ------------------------------------------------------------
// 9) Universidades nuevas: aparecen solas al existir en los datos.
// ------------------------------------------------------------
test('una universidad nueva (UTP/UNALM/UPCH/ULIMA/UPC/USMP) aparece automáticamente en los datos', () => {
  const conUTP = [
    ...CATALOGO,
    { idCurso: 950, nombre: 'Métodos Numéricos', codigo: 'UTP-MN', universidadObjetivo: 'UTP' }
  ];
  const grupos = universidadesDelCatalogo(conUTP, ETIQUETAS);
  const utp = grupos.find((grupo) => grupo.clave === 'utp');
  assert.ok(utp, 'la universidad nueva surge del catálogo sin código nuevo');
  assert.deepEqual([utp.etiqueta, utp.total], ['UTP', 1], 'etiqueta defensiva por mayúsculas y cantidad real');
  // Y el filtro sobre ella funciona directamente.
  assert.equal(catalogoCursosVisible(conUTP, { universidad: 'utp' }).length, 1);
  // «Todos» sigue mostrando el catálogo completo (71 + la nueva).
  assert.equal(catalogoCursosVisible(conUTP, { universidad: 'todos' }).length, 72);
});

// ------------------------------------------------------------
// 10) Defensivo: cursos sin UniversidadObjetivo y catálogos rotos.
// ------------------------------------------------------------
test('curso sin UniversidadObjetivo: agrupado, filtrable y sin romper la pantalla', () => {
  const conHuerfanos = [
    ...CATALOGO,
    { idCurso: 960, nombre: 'Curso Huérfano', codigo: 'H-01', universidadObjetivo: '' },
    { idCurso: 961, nombre: 'Otro Huérfano', codigo: 'H-02' } // sin campo
  ];
  const grupos = universidadesDelCatalogo(conHuerfanos, ETIQUETAS);
  const grupoVacio = grupos.find((grupo) => grupo.clave === '');
  assert.ok(grupoVacio, 'los cursos sin universidad tienen grupo propio (etiqueta «Sin asignar»)');
  assert.equal(grupoVacio.total, 2);
  assert.equal(grupoVacio.etiqueta, '');
  assert.equal(grupos[grupos.length - 1].clave, '', 'el grupo «sin asignar» va al final');
  // El chip «Sin asignar» (clave '') filtra esos cursos y solo esos.
  assert.equal(catalogoCursosVisible(conHuerfanos, { universidad: '' }).length, 2);
  assert.ok(
    catalogoCursosVisible(conHuerfanos, { universidad: '' }).every((curso) => claveUniversidadCurso(curso) === '')
  );
  assert.equal(catalogoCursosVisible(conHuerfanos, { universidad: 'todos' }).length, 73);
  const huerfano = { nombre: 'Curso Huérfano', universidadObjetivo: '' };
  assert.equal(coincideBusquedaCurso(huerfano, 'huerfano'), true);
  assert.equal(coincideBusquedaCurso(huerfano, ''), true);
  assert.equal(coincideBusquedaCurso(null, 'todo'), false);
});

test('defensivo: catálogos nulos, vacíos, texto en blanco y cursos inválidos', () => {
  assert.deepEqual(universidadesDelCatalogo(null), []);
  assert.deepEqual(universidadesDelCatalogo(undefined, ETIQUETAS), []);
  assert.deepEqual(catalogoCursosVisible(null, {}), []);
  assert.deepEqual(
    catalogoCursosVisible([null, undefined, { nombre: 'Álgebra', codigo: 'H-00' }]),
    [{ nombre: 'Álgebra', codigo: 'H-00' }],
    'descarta entradas nulas y conserva los cursos válidos'
  );
  assert.deepEqual(universidadesDelCatalogo([null, undefined]), []);
  assert.equal(catalogoCursosVisible(CATALOGO, { universidad: undefined }).length, 71);
  assert.equal(catalogoCursosVisible(CATALOGO, { texto: '   ' }).length, 71, 'texto en blanco no oculta nada');
  assert.deepEqual(universidadesDelCatalogo([]), []);
});

// ------------------------------------------------------------
// Contrato estático de la pestaña: el JSX real debe tener chips accesibles,
// buscador contextual, universidad obligatoria al crear y bloqueo del cambio
// al editar (protección de los vínculos CicloCurso del backend).
// ------------------------------------------------------------
test('AcademicoPage.jsx: chips con aria-pressed, filtro por UniversidadObjetivo y buscador contextual', () => {
  const codigo = readFileSync(new URL('../src/pages/AcademicoPage.jsx', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.ok(
    codigo.includes("from '../utils/catalogoCursos'"),
    'la pestaña debe usar el helper del catálogo por universidad'
  );
  assert.ok(codigo.includes('aria-pressed'), 'los chips deben ser botones con estado accesible');
  assert.ok(
    codigo.includes('Filtrar cursos por universidad objetivo'),
    'el grupo de chips debe estar etiquetado'
  );
  assert.ok(
    codigo.includes('universidadesDelCatalogo(cursos'),
    'las opciones del filtro se derivan del catálogo recibido, no de una lista fija'
  );
  assert.ok(
    codigo.includes('placeholder={PLACEHOLDER_BUSQUEDA[tabActiva]'),
    'el buscador debe tener placeholder contextual por pestaña'
  );
  assert.ok(
    codigo.includes('universidadObjetivo'),
    'la pestaña debe trabajar con el campo estructurado UniversidadObjetivo'
  );
});

test('AcademicoPage.jsx: universidad obligatoria al crear, bloqueada al editar y footer con nombre completo', () => {
  const codigo = readFileSync(new URL('../src/pages/AcademicoPage.jsx', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.ok(
    codigo.includes("universidadObjetivo: ''"),
    'un curso nuevo empieza SIN universidad: se exige selección explícita'
  );
  assert.ok(
    codigo.includes('Selecciona la universidad objetivo del curso.'),
    'guardar sin universidad debe rechazarse con mensaje claro'
  );
  assert.ok(
    codigo.includes('bloquearUniversidadCurso'),
    'al editar debe bloquearse el cambio de universidad (protege CicloCurso)'
  );
  assert.ok(
    codigo.includes('nombreUniversidadPorClave'),
    'el nombre completo debe salir del helper centralizado universidadCiclo.js'
  );
  assert.ok(
    codigo.includes('nombreUniversidadCurso'),
    'la tarjeta debe mostrar la universidad del curso'
  );
  assert.equal(
    codigo.includes('>Oferta académica<'),
    false,
    'el footer repetido «Oferta académica» debe haberse reemplazado por la universidad'
  );
});
