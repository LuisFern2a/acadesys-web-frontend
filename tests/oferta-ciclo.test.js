// ============================================================
// Paso 4 (Oferta) del wizard "Registrar Nuevo Ciclo":
// la oferta debe mostrar SOLO los cursos de la universidad objetivo
// seleccionada en el paso 1.
//
// Fuente de verdad: Curso.UniversidadObjetivo (campo estructurado entregado
// por GET /api/cursos). Los prefijos de código (SM-, UNI-, PUCP-, FV-,
// UNAC-) son descriptivos: NINGUNA prueba ni implementación filtra por
// prefijo.
// ============================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cursosDeUniversidad, seleccionCompatible } from '../src/utils/ofertaCiclo.js';

// Fixtures con la forma REAL de GET /api/cursos y los códigos verificados en
// la BD (mismo conjunto de materias por universidad objetivo).
const CATALOGO = [
  { idCurso: 1, nombre: 'Física', codigo: 'CUR-1', universidadObjetivo: 'Preuniversitario' },
  { idCurso: 2, nombre: 'Habilidad Verbal', codigo: 'SM-HV', universidadObjetivo: 'UNMSM' },
  { idCurso: 4, nombre: 'Aritmética', codigo: 'SM-ARI', universidadObjetivo: 'UNMSM' },
  { idCurso: 5, nombre: 'Álgebra', codigo: 'SM-ALG', universidadObjetivo: 'UNMSM' },
  { idCurso: 6, nombre: 'Geometría', codigo: 'SM-GEO', universidadObjetivo: 'UNMSM' },
  { idCurso: 11, nombre: 'Razonamiento Matemático', codigo: 'UNI-RM', universidadObjetivo: 'UNI' },
  { idCurso: 12, nombre: 'Álgebra', codigo: 'UNI-ALG', universidadObjetivo: 'UNI' },
  { idCurso: 13, nombre: 'Aritmética', codigo: 'UNI-ARI', universidadObjetivo: 'UNI' },
  { idCurso: 22, nombre: 'Álgebra', codigo: 'PUCP-ALG', universidadObjetivo: 'PUCP' },
  { idCurso: 26, nombre: 'Habilidad Verbal', codigo: 'FV-HV', universidadObjetivo: 'UNFV' },
  { idCurso: 28, nombre: 'Aritmética', codigo: 'FV-ARI', universidadObjetivo: 'UNFV' },
  { idCurso: 29, nombre: 'Álgebra', codigo: 'FV-ALG', universidadObjetivo: 'UNFV' },
  { idCurso: 98, nombre: 'Aritmética', codigo: 'UNAC-ARI', universidadObjetivo: 'UNAC' },
  { idCurso: 99, nombre: 'Álgebra', codigo: 'UNAC-ALG', universidadObjetivo: 'UNAC' },
  { idCurso: 100, nombre: 'Geometría', codigo: 'UNAC-GEO', universidadObjetivo: 'UNAC' },
];

const codigos = (lista) => lista.map((curso) => curso.codigo);
const ids = (lista) => lista.map((curso) => curso.idCurso);

test('UNMSM: la oferta contiene únicamente cursos con UniversidadObjetivo = UNMSM', () => {
  const lista = codigos(cursosDeUniversidad(CATALOGO, 'UNMSM'));
  // Orden alfabético por NOMBRE: Álgebra, Aritmética, Geometría, Habilidad Verbal.
  assert.deepEqual(lista, ['SM-ALG', 'SM-ARI', 'SM-GEO', 'SM-HV']);
});

test('UNFV: la oferta contiene únicamente cursos FV (UniversidadObjetivo = UNFV)', () => {
  const lista = codigos(cursosDeUniversidad(CATALOGO, 'UNFV'));
  assert.deepEqual(lista, ['FV-ALG', 'FV-ARI', 'FV-HV']);
  // Ni un solo curso de otra universidad (SM-, UNI-, PUCP-, UNAC-).
  assert.ok(lista.every((codigo) => codigo.startsWith('FV-')));
});

test('UNI: la oferta contiene únicamente cursos UNI', () => {
  const lista = codigos(cursosDeUniversidad(CATALOGO, 'UNI'));
  assert.deepEqual(lista, ['UNI-ALG', 'UNI-ARI', 'UNI-RM']);
});

test('PUCP: la oferta contiene únicamente cursos PUCP', () => {
  const lista = codigos(cursosDeUniversidad(CATALOGO, 'PUCP'));
  assert.deepEqual(lista, ['PUCP-ALG']);
});

test('UNAC: la oferta contiene únicamente cursos UNAC, ordenado alfabéticamente y por código', () => {
  const lista = codigos(cursosDeUniversidad(CATALOGO, 'UNAC'));
  assert.deepEqual(lista, ['UNAC-ALG', 'UNAC-ARI', 'UNAC-GEO']);
});

test('el orden es alfabético por nombre y, a nombres iguales, por código', () => {
  // Nombres duplicados dentro de la misma universidad: desempata el código.
  const duplicados = [
    { idCurso: 30, nombre: 'Álgebra', codigo: 'X-ALG-2', universidadObjetivo: 'DEMO' },
    { idCurso: 31, nombre: 'Álgebra', codigo: 'X-ALG-1', universidadObjetivo: 'DEMO' },
    { idCurso: 32, nombre: 'Aritmética', codigo: 'X-ARI', universidadObjetivo: 'DEMO' },
  ];
  assert.deepEqual(
    codigos(cursosDeUniversidad(duplicados, 'DEMO')),
    ['X-ALG-1', 'X-ALG-2', 'X-ARI']
  );
});

test('NO se usa el prefijo del código: un curso con código atípico y universidad correcta entra, y uno con prefijo SM y otra universidad queda fuera', () => {
  const catalogoRaro = [
    { idCurso: 40, nombre: 'Lógica', codigo: 'ZZZ-LOG', universidadObjetivo: 'UNMSM' },
    { idCurso: 41, nombre: 'Literatura', codigo: 'SM-LIT', universidadObjetivo: 'UNFV' },
  ];
  assert.deepEqual(
    codigos(cursosDeUniversidad(catalogoRaro, 'UNMSM')),
    ['ZZZ-LOG']
  );
  assert.deepEqual(
    codigos(cursosDeUniversidad(catalogoRaro, 'UNFV')),
    ['SM-LIT']
  );
});

test('cambio UNMSM → UNI limpia la selección incompatible, conserva la compatible', () => {
  const catalogoUni = cursosDeUniversidad(CATALOGO, 'UNI');
  // Selección previa con cursos de varias universidades (mezcla histórica).
  const conservados = seleccionCompatible([2, 5, 11, 29, 99], catalogoUni);
  // Solo sobrevive el curso UNI (11 = UNI-RM).
  assert.deepEqual(conservados, [11]);
});

test('cambio a una universidad sin cursos (UTP/UNALM/UPCH/ULIMA/UPC/USMP) deja la selección vacía (estado vacío, sin fallback a SM)', () => {
  const universidadesSinCursos = ['UTP', 'UNALM', 'UPCH', 'ULIMA', 'UPC', 'USMP'];
  for (const universidad of universidadesSinCursos) {
    const oferta = cursosDeUniversidad(CATALOGO, universidad);
    assert.deepEqual(ids(oferta), [], `La oferta de ${universidad} debe estar vacía`);
    // También vacía la selección existente: no se conserva nada incompatible.
    assert.deepEqual(seleccionCompatible([2, 5, 11, 99], oferta), []);
  }
});

test('la comparación de universidad es insensible a mayúsculas y espacios', () => {
  assert.deepEqual(
    codigos(cursosDeUniversidad(CATALOGO, ' unmsm ')),
    ['SM-ALG', 'SM-ARI', 'SM-GEO', 'SM-HV']
  );
});

test('entradas defensivas: catálogo no disponible y universidad vacía devuelven listas seguras', () => {
  assert.deepEqual(cursosDeUniversidad(null, 'UNMSM'), []);
  assert.deepEqual(cursosDeUniversidad(undefined, 'UNMSM'), []);
  assert.deepEqual(cursosDeUniversidad(CATALOGO, ''), []);
  assert.deepEqual(seleccionCompatible([1, 2], []), []);
  assert.deepEqual(seleccionCompatible(null, CATALOGO), []);
});

// ---------------------------------------------------------------------
// Contrato estático del wizard: el JSX real del paso 4 debe renderizar el
// catálogo filtrado por universidad (cursosUniversidad), no el catálogo
// global, y debe tratar la selección con seleccionCompatible.
// ---------------------------------------------------------------------
test('AcademicoPage.jsx usa el filtro por universidad y ya no renderiza el catálogo global en el paso Oferta', () => {
  const codigo = readFileSync(new URL('../src/pages/AcademicoPage.jsx', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.ok(
    codigo.includes("from '../utils/ofertaCiclo'"),
    'el wizard debe importar las utilidades del paso Oferta'
  );
  assert.ok(
    codigo.includes('cursosUniversidad.map((curso)'),
    'las tarjetas del paso 4 deben renderizar el catálogo filtrado por universidad'
  );
  assert.equal(
    codigo.includes('cursos.map((curso)'),
    false,
    'el paso 4 no debe renderizar el catálogo global de cursos'
  );
  assert.ok(
    codigo.includes('cambiarUniversidadCiclo'),
    'el cambio de universidad debe pasar por el recorte de la selección'
  );
});
