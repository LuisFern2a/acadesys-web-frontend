// ============================================================================
// Pestaña «Horarios» (Administrador → Gestión Académica → Horarios):
// organización POR UNIVERSIDAD DEL CICLO (Ciclo.UniversidadObjetivo) y por
// ciclo, sin usar prefijos de código (SM-, FV-, UNI-, PUCP-) como fuente de
// verdad, con filtros dependientes universidad→ciclo y búsqueda combinada.
//
// La fixture replica la distribución REAL conocida de producción (60
// horarios: UNMSM 37, UNI 16, PUCP 7) más casos adversarios y defensivos:
//   - ciclo con nombre «San Marcos» pero UniversidadObjetivo UNI (el nombre
//     y el prefijo del curso NO mandan);
//   - universidad nueva (UTP) que debe aparecer sola cuando existan datos;
//   - UNFV/UNAC con ciclos pero SIN horarios (no deben pintar chips);
//   - filas nulas y sin ciclo/universidad («Sin asignar» al final).
//
// Runner nativo de Node (node --test, ESM igual que el resto del proyecto).
// El helper es puro (sin importar Vite/React). Se conservan TODOS los tests
// anteriores (wizard + catálogo de cursos).
// ============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  idCicloHorario,
  claveUniversidadHorario,
  universidadesDeHorarios,
  ciclosConHorarios,
  cicloCompatible,
  coincideBusquedaHorario,
  horariosVisibles
} from '../src/utils/horariosAcademicos.js';

const ETIQUETAS = {
  unmsm: 'UNMSM',
  uni: 'UNI',
  pucp: 'PUCP',
  unac: 'UNAC',
  unfv: 'UNFV',
  utp: 'UTP'
};

// Ciclos: los REALES de producción + adversarios. Los sin horarios (UNAC,
// UNFV) existen en la BD pero no pintan chips en Horarios.
const CICLOS = [
  { idCiclo: 1, nombre: 'Semestral San Marcos', universidadObjetivo: 'UNMSM' },
  { idCiclo: 2, nombre: 'Repaso UNI', universidadObjetivo: 'UNI' },
  { idCiclo: 3, nombre: 'Veranito San Marcos', universidadObjetivo: 'UNMSM' },
  { idCiclo: 5, nombre: 'Anual Católica (PUCP)', universidadObjetivo: 'PUCP' },
  { idCiclo: 6, nombre: 'Semestral Callao (UNAC)', universidadObjetivo: 'UNAC' },
  { idCiclo: 10, nombre: 'Repaso San Marcos', universidadObjetivo: 'UNMSM' },
  { idCiclo: 11, nombre: 'Anual UNI', universidadObjetivo: 'UNI' },
  { idCiclo: 12, nombre: 'Veranito San Marcos (II)', universidadObjetivo: 'UNMSM' },
  { idCiclo: 13, nombre: 'Ciclo UNFV 2026', universidadObjetivo: 'UNFV' },
  // ADVERSARIO: el nombre contiene «San Marcos» pero la universidad REAL
  // (Ciclo.UniversidadObjetivo) es UNI; sus cursos usan prefijo SM- (mentira):
  // NADA de eso debe poner el horario en UNMSM.
  { idCiclo: 50, nombre: 'Semestral San Marcos Clon', universidadObjetivo: 'UNI' },
  // Universidad nueva: aparece automáticamente al existir su horario.
  { idCiclo: 99, nombre: 'Ciclo UTP 2026', universidadObjetivo: 'UTP' }
];

const HORARIOS_POR_CICLO = { 1: 10, 2: 8, 3: 9, 5: 7, 10: 9, 11: 8, 12: 9, 50: 2, 99: 1 };

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function construirTurnos() {
  const turnos = [];
  let idHorario = 101;
  for (const ciclo of CICLOS) {
    const cantidad = HORARIOS_POR_CICLO[ciclo.idCiclo] || 0;
    for (let i = 0; i < cantidad; i += 1) {
      const diaNumero = (i % 6) + 1;
      const orden = (i % 4) + 1;
      const hora = 8 + (i % 6);
      // En «Semestral San Marcos» metemos nombres reales: una fila es Álgebra
      // (curso SM-ALG) para probar la búsqueda combinada universidad+ciclo.
      const curso = ciclo.idCiclo === 1 && i === 2 ? 'Álgebra (SM-ALG)' : `Curso ${ciclo.idCiclo}-${i}`;
      turnos.push({
        idHorario: idHorario,
        idCiclo: ciclo.idCiclo,
        idCurso: (i % 3) + 1,
        diaNumero,
        diaSemana: DIAS[diaNumero - 1],
        horaInicio: `${String(hora).padStart(2, '0')}:00`,
        horaFin: `${String(hora + 1).padStart(2, '0')}:00`,
        orden,
        ciclo: ciclo.nombre,
        curso
      });
      idHorario += 1;
    }
  }
  // Caso adversario de ORDEN: el UTP tiene el idHorario MÁS BAJO y la posición
  // MÁS TEMPRANA del arreglo, pero su grupo (1 horario) va al FINAL del orden.
  const utp = turnos.find((turno) => turno.idCiclo === 99);
  utp.idHorario = 1;
  turnos.splice(turnos.indexOf(utp), 1);
  turnos.unshift(utp);
  return turnos;
}

const construirMapaCiclos = () => {
  const mapa = new Map();
  CICLOS.forEach((ciclo) => mapa.set(ciclo.idCiclo, ciclo));
  return mapa;
};

test('Los chips de universidad se derivan de los datos: UNMSM 37, UNI 18, PUCP 7, UTP 1 (universidad nueva automática)', () => {
  const mapaCiclos = construirMapaCiclos();
  const grupos = universidadesDeHorarios(construirTurnos(), mapaCiclos, ETIQUETAS);
  const totales = new Map(grupos.map((grupo) => [grupo.etiqueta, grupo.total]));
  assert.equal(totales.get('UNMSM'), 37);
  // 16 reales + 2 del ciclo adversario «Clon» (que por nombre/prefijo NO va a UNMSM)
  assert.equal(totales.get('UNI'), 18);
  assert.equal(totales.get('PUCP'), 7);
  // La universidad nueva aparece sola cuando sus horarios existen:
  assert.equal(totales.get('UTP'), 1);
  assert.ok(grupos.some((grupo) => grupo.clave === 'utp'));
  // UNFV y UNAC tienen ciclos pero SIN horarios: no deben pintar chips.
  assert.ok(!grupos.some((grupo) => grupo.clave === 'unfv'));
  assert.ok(!grupos.some((grupo) => grupo.clave === 'unac'));
});

test('Orden de los chips: mayores cantidades primero y la universidad nueva al final', () => {
  const grupos = universidadesDeHorarios(construirTurnos(), construirMapaCiclos(), ETIQUETAS);
  assert.deepEqual(
    grupos.map((grupo) => grupo.etiqueta),
    ['UNMSM', 'UNI', 'PUCP', 'UTP']
  );
});

test('Sin filtros («todas») se muestran TODOS los horarios globales', () => {
  const visibles = horariosVisibles(construirTurnos(), {
    ciclosPorId: construirMapaCiclos(),
    etiquetasUniversidad: ETIQUETAS
  });
  assert.equal(visibles.length, 63);
});

test('Filtro UNMSM: solo horarios de ciclos UNMSM (el clon «San Marcos» de UNI queda fuera)', () => {
  const mapaCiclos = construirMapaCiclos();
  const visibles = horariosVisibles(construirTurnos(), {
    universidad: 'unmsm',
    ciclosPorId: mapaCiclos,
    etiquetasUniversidad: ETIQUETAS
  });
  assert.equal(visibles.length, 37);
  assert.ok(visibles.every((turno) => claveUniversidadHorario(turno, mapaCiclos) === 'unmsm'));
  assert.ok(!visibles.some((turno) => turno.ciclo === 'Semestral San Marcos Clon'));
});

test('Filtro UNI: incluye sus ciclos reales y el clon adversario (nombre/prefijo no mandan)', () => {
  const mapaCiclos = construirMapaCiclos();
  const visibles = horariosVisibles(construirTurnos(), {
    universidad: 'uni',
    ciclosPorId: mapaCiclos,
    etiquetasUniversidad: ETIQUETAS
  });
  assert.equal(visibles.length, 18); // 16 + 2 del clon
  assert.ok(visibles.some((turno) => turno.ciclo === 'Semestral San Marcos Clon'));
  assert.ok(visibles.every((turno) => {
    const ciclo = mapaCiclos.get(turno.idCiclo);
    return String(ciclo?.universidadObjetivo).toUpperCase() === 'UNI';
  }));
});

test('Filtro UNFV y UNAC: sin horarios registrados → lista vacía (y sin chip)', () => {
  assert.equal(horariosVisibles(construirTurnos(), { universidad: 'unfv', ciclosPorId: construirMapaCiclos() }).length, 0);
  assert.equal(horariosVisibles(construirTurnos(), { universidad: 'unac', ciclosPorId: construirMapaCiclos() }).length, 0);
});

test('Filtro UTP (universidad nueva): exactamente su horario', () => {
  const visibles = horariosVisibles(construirTurnos(), { universidad: 'utp', ciclosPorId: construirMapaCiclos() });
  assert.equal(visibles.length, 1);
  assert.equal(visibles[0].ciclo, 'Ciclo UTP 2026');
});

test('Universidad + ciclo: solo los horarios de ese ciclo concreto', () => {
  const mapaCiclos = construirMapaCiclos();
  const visibles = horariosVisibles(construirTurnos(), {
    universidad: 'unmsm',
    idCiclo: 3,
    ciclosPorId: mapaCiclos,
    etiquetasUniversidad: ETIQUETAS
  });
  assert.equal(visibles.length, 9);
  assert.ok(visibles.every((turno) => turno.idCiclo === 3));
  // Combinación imposible descartada: UNI + ciclo UNMSM no trae nada.
  assert.equal(
    horariosVisibles(construirTurnos(), { universidad: 'uni', idCiclo: 3, ciclosPorId: mapaCiclos }).length,
    0
  );
});

test('Universidad + ciclo + búsqueda: Álgebra dentro de Semestral San Marcos', () => {
  const mapaCiclos = construirMapaCiclos();
  const visibles = horariosVisibles(construirTurnos(), {
    universidad: 'unmsm',
    idCiclo: 1,
    texto: 'algebra',
    ciclosPorId: mapaCiclos,
    etiquetasUniversidad: ETIQUETAS
  });
  assert.equal(visibles.length, 1);
  assert.equal(visibles[0].curso, 'Álgebra (SM-ALG)');
  // El buscador no distingue tildes ni mayúsculas.
  assert.equal(
    horariosVisibles(construirTurnos(), { texto: 'sábado', ciclosPorId: mapaCiclos }).every(
      (turno) => turno.diaSemana === 'Sábado'
    ),
    true
  );
});

test('Cambio UNMSM → UNI limpia el ciclo incompatible (reset solo del ciclo)', () => {
  const mapaCiclos = construirMapaCiclos();
  assert.equal(cicloCompatible(mapaCiclos, 3, 'uni'), false);  // Veranito San Marcos no es UNI
  assert.equal(cicloCompatible(mapaCiclos, 2, 'uni'), true);   // Anual UNI sí es UNI
  assert.equal(cicloCompatible(mapaCiclos, '', 'uni'), true);  // «Todos los ciclos» siempre
  assert.equal(cicloCompatible(mapaCiclos, 3, 'todas'), true);
  assert.equal(cicloCompatible(mapaCiclos, 50, 'uni'), true);  // el clon SÍ es UNI
  assert.equal(cicloCompatible(mapaCiclos, 50, 'unmsm'), false);
});

test('Orden global: Universidad → Ciclo (nombre) → Día → Orden → Hora; NUNCA por IdHorario', () => {
  const mapaCiclos = construirMapaCiclos();
  const visibles = horariosVisibles(construirTurnos(), {
    ciclosPorId: mapaCiclos,
    etiquetasUniversidad: ETIQUETAS
  });
  // Primer grupo UNMSM y dentro, el ciclo con nombre menor: «Repaso San Marcos».
  assert.equal(visibles[0].idCiclo, 10);
  // El horario UTP (idHorario 1, primera posición de entrada) queda al FINAL.
  assert.equal(visibles[visibles.length - 1].idCiclo, 99);
  // La lista termina con el grupo UTP aunque su idHorario sea el menor.
  assert.equal(visibles[visibles.length - 1].idHorario, 1);
  // Dentro del grupo UNMSM los ciclos van por nombre (sin otros grupos).
  const nombresUnmsm = visibles
    .filter((turno) => claveUniversidadHorario(turno, mapaCiclos) === 'unmsm')
    .map((turno) => turno.ciclo)
    .filter((nombre, indice, todos) => todos.indexOf(nombre) === indice);
  assert.deepEqual(nombresUnmsm, [
    'Repaso San Marcos',
    'Semestral San Marcos',
    'Veranito San Marcos',
    'Veranito San Marcos (II)'
  ]);
});

test('Orden dentro de un ciclo específico: Día → Orden → Hora (independiente del id)', () => {
  const visibles = horariosVisibles(construirTurnos(), { universidad: 'unmsm', idCiclo: 3, ciclosPorId: construirMapaCiclos() });
  const secuencia = visibles.map((turno) => turno.idHorario);
  const base = Math.min(...secuencia);
  assert.deepEqual(secuencia, [
    base + 0, base + 6, base + 1, base + 7, base + 8, base + 2, base + 3, base + 4, base + 5
  ]);
});

test('Empate día+orden: gana la hora de inicio más temprana', () => {
  const turnos = [
    { idHorario: 3, idCiclo: 1, diaNumero: 1, diaSemana: 'Lunes', horaInicio: '12:00', horaFin: '13:00', orden: 1, ciclo: 'C', curso: 'C2' },
    { idHorario: 2, idCiclo: 1, diaNumero: 1, diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '09:00', orden: 1, ciclo: 'C', curso: 'C1' },
    { idHorario: 1, idCiclo: 1, diaNumero: 1, diaSemana: 'Lunes', horaInicio: '10:00', horaFin: '11:00', orden: 1, ciclo: 'C', curso: 'C0' }
  ];
  const visibles = horariosVisibles(turnos, { universidad: 'todas', idCiclo: 1 });
  assert.deepEqual(
    visibles.map((turno) => turno.horaInicio),
    ['08:00', '10:00', '12:00']
  );
});

test('Defensa: filas nulas y horarios sin ciclo/universidad no rompen y van a «Sin asignar»', () => {
  const mapaCiclos = construirMapaCiclos();
  const turnos = [
    null,
    undefined,
    { idHorario: 9, ciclo: 'Ciclo Fantasma', curso: 'X', diaNumero: 1, diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '09:00', orden: 1 }
  ];
  const grupos = universidadesDeHorarios(turnos, mapaCiclos, ETIQUETAS);
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].clave, '');
  // La etiqueta de la clave vacía es ''; la PANTALLA la muestra como
  // «Sin asignar» (fallback `grupo.etiqueta || 'Sin asignar'`).
  assert.equal(grupos[0].etiqueta, '');
  const visibles = horariosVisibles(turnos, { ciclosPorId: mapaCiclos });
  assert.equal(visibles.length, 1);
  // Filtro del chip «Sin asignar» (cadena vacía): SOLO esos horarios.
  assert.equal(horariosVisibles(turnos, { universidad: '', ciclosPorId: mapaCiclos }).length, 1);
  assert.equal(horariosVisibles(construirTurnos(), { universidad: '', ciclosPorId: mapaCiclos }).length, 0);
});

test('El campo REAL del backend (universidadCiclo) es la primera fuente; el mapa es respaldo', () => {
  const mapaCiclos = construirMapaCiclos();
  // El backend entrega universidadCiclo aunque el frontend aún no tenga el ciclo en su mapa.
  const fantasma = { idHorario: 7, idCiclo: 404, ciclo: 'Ciclo Fantasma', curso: 'Y', universidadCiclo: 'PUCP' };
  assert.equal(claveUniversidadHorario(fantasma), 'pucp');
  assert.equal(claveUniversidadHorario(fantasma, mapaCiclos), 'pucp');
  // Sin campo: respaldo por el mapa (mismo campo real, Ciclo.UniversidadObjetivo).
  const sinCampo = { idHorario: 8, idCiclo: 2, ciclo: 'Repaso UNI', curso: 'Z' };
  assert.equal(claveUniversidadHorario(sinCampo, mapaCiclos), 'uni');
  // Sin ninguna fuente: '' («Sin asignar»), nunca una universidad inventada.
  assert.equal(claveUniversidadHorario({ idHorario: 9, ciclo: 'Fantasma Prefijo UNI-X' }), '');
});

test('El PREFIJO del nombre/código del curso NUNCA decide la universidad del horario', () => {
  const mapaCiclos = construirMapaCiclos();
  const trampa = {
    idHorario: 21,
    idCiclo: 50, // clon: universidad REAL UNI
    ciclo: 'Semestral San Marcos Clon',
    curso: 'SM-Física (prefijo engañoso)'
  };
  assert.equal(claveUniversidadHorario(trampa, mapaCiclos), 'uni');
  const visibles = horariosVisibles(construirTurnos(), { universidad: 'unmsm', ciclosPorId: construirMapaCiclos() });
  assert.ok(!visibles.some((turno) => turno.idCiclo === 50));
});

test('coincideBusquedaHorario busca ciclo, curso, día y horas', () => {
  const turno = { ciclo: 'Veranito San Marcos', curso: 'Álgebra', diaSemana: 'Miércoles', horaInicio: '10:15', horaFin: '12:15' };
  assert.equal(coincideBusquedaHorario(turno, 'algebra'), true);
  assert.equal(coincideBusquedaHorario(turno, 'veranito'), true);
  assert.equal(coincideBusquedaHorario(turno, 'miercoles'), true);
  assert.equal(coincideBusquedaHorario(turno, '10:15'), true);
  assert.equal(coincideBusquedaHorario(turno, 'química'), false);
  assert.equal(coincideBusquedaHorario(turno, ''), true);
  assert.equal(coincideBusquedaHorario(null, 'algo'), false);
});

test('ciclosConHorarios: lista los ciclos que tienen horarios con conteo real, sin los vacíos', () => {
  const mapaCiclos = construirMapaCiclos();
  const lista = ciclosConHorarios(construirTurnos(), mapaCiclos, ETIQUETAS);
  const ids = lista.map((ciclo) => ciclo.idCiclo);
  // Los ciclos con horarios aparecen; los vacíos (UNAC 6, UNFV 13) NO.
  assert.ok(ids.includes(1));
  assert.ok(ids.includes(50));
  assert.ok(ids.includes(99));
  assert.ok(!ids.includes(6));
  assert.ok(!ids.includes(13));
  const veranito = lista.find((ciclo) => ciclo.idCiclo === 3);
  assert.equal(veranito.total, 9);
  assert.equal(veranito.etiqueta, 'UNMSM');
  // Orden alfabético por nombre en el selector de ciclos.
  const nombres = lista.map((ciclo) => ciclo.nombre);
  assert.deepEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })), nombres);
});

test('idCicloHorario devuelve entero seguro o null (defensivo)', () => {
  assert.equal(idCicloHorario({ idCiclo: 12 }), 12);
  assert.equal(idCicloHorario({ IdCiclo: '7' }), 7);
  assert.equal(idCicloHorario({}), null);
  assert.equal(idCicloHorario({ idCiclo: 0 }), null);
  assert.equal(idCicloHorario({ idCiclo: -3 }), null);
});

// ============================================================================
// Contratos estáticos de la pantalla (AcademicoPage.jsx)
// ============================================================================

const CODIGO_PAGINA = readFileSync(new URL('../src/pages/AcademicoPage.jsx', import.meta.url), 'utf8');

test('AcademicoPage.jsx: filtros de Horarios con chips dependientes y reset coherente universidad→ciclo', () => {
  // Helper específico de horarios importado.
  assert.match(CODIGO_PAGINA, /horariosAcademicos/);
  assert.match(CODIGO_PAGINA, /cambiarUniversidadTurnosFiltro/);
  // El reset de ciclo usa la compatibilidad por UniversidadObjetivo.
  assert.match(CODIGO_PAGINA, /cicloCompatible\(mapaCiclosHorarios, filtroCicloTurnos, clave\)/);
  // Estado PROPIO de la pestaña (no comparte el de Cursos Académicos).
  assert.match(CODIGO_PAGINA, /setFiltroUniversidadTurnos\('todas'\)/);
  assert.match(CODIGO_PAGINA, /setFiltroCicloTurnos\('todos'\)/);
  // aria-pressed en chips del filtro de horarios.
  assert.match(CODIGO_PAGINA, /aria-pressed=\{filtroUniversidadTurnos === /);
  assert.match(CODIGO_PAGINA, /Filtrar horarios por universidad del ciclo/);
  // Selector de ciclo dependiente con contador del total.
  assert.match(CODIGO_PAGINA, /Filtrar horarios por ciclo/);
  assert.match(CODIGO_PAGINA, /Todos los ciclos/);
});

test('AcademicoPage.jsx: contador global intacto y «N mostrados» discreto con filtros activos', () => {
  // El contador del TAB sigue siendo el global (turnos.length).
  assert.match(CODIGO_PAGINA, /Horarios \(\{turnos\.length\}\)/);
  assert.match(CODIGO_PAGINA, /\{turnosFiltrados\.length\} mostrados/);
});

test('AcademicoPage.jsx: tarjetas con identificación discreta «SIGLA · Ciclo» desde UniversidadObjetivo', () => {
  assert.match(CODIGO_PAGINA, /claveUniversidadHorario\(turno, mapaCiclosHorarios\)/);
  assert.match(CODIGO_PAGINA, /siglaTurno/);
  assert.doesNotMatch(CODIGO_PAGINA, /nivelPorUniversidad|colorPorUniversidad/); // no cambia color por universidad
});

test('AcademicoPage.jsx: el modal solo permite cursos de la oferta del ciclo (CicloCurso)', () => {
  // Obtiene la oferta real por backend, nunca el catálogo global.
  assert.match(CODIGO_PAGINA, /obtenerCursosCiclo/);
  assert.match(CODIGO_PAGINA, /cargarOfertaTurnos/);
  assert.match(CODIGO_PAGINA, /Selecciona un curso de la oferta/);
  // Universidad obligatoria antes del ciclo; el curso depende del ciclo.
  assert.match(CODIGO_PAGINA, /Universidad del ciclo/);
  assert.match(CODIGO_PAGINA, /cambiarUniversidadTurnoModal/);
  assert.match(CODIGO_PAGINA, /cambiarCicloTurnoModal/);
  // El curso guardado fuera de la oferta se muestra marcado para normalizarlo.
  assert.match(CODIGO_PAGINA, /fuera de la oferta actual/);
  // Al crear NO se autoselecciona un curso global: el estado inicial y el
  // reset de abrirCrear dejan idCurso vacío (se exige elegir oferta).
  assert.match(CODIGO_PAGINA, /formTurno, setFormTurno\] = useState\(\{[^}]*idCurso: ''/);
});

test('AcademicoPage.jsx: cada pestaña mantiene su propio filtro (Cursos vs Horarios)', () => {
  // El reset al cambiar de pestaña incluye AMBOS estados por separado.
  assert.match(CODIGO_PAGINA, /setFiltroUniversidad\('todos'\);\s*\n\s*setFiltroUniversidadTurnos\('todas'\);/);
});

test('AcademicoPage.jsx: PLACEHOLDER_BUSQUEDA mantiene el texto contextual de horarios', () => {
  assert.match(CODIGO_PAGINA, /Buscar por ciclo, curso, día u hora/);
});
