// ============================================================================
// Utilidades PURAS de la pestaña "Horarios" (Administrador → Gestión
// Académica → Horarios). Organizan la retícula global POR UNIVERSIDAD Y
// CICLO sin ocultar información ni recurrir a prefijos de código.
//
// Fuente de verdad verificada contra el modelo y el backend:
//   - Cada fila del endpoint GET /api/horarios es una fila de HorarioCurso:
//     { idHorario, idCiclo, idCurso, diaNumero, diaSemana, horaInicio,
//       horaFin, orden, ciclo (nombre), curso (nombre, ...) }.
//   - La universidad de un horario es la del CICLO: Ciclo.UniversidadObjetivo
//     (el backend ahora entrega `universidadCiclo`; en su ausencia se resuelve
//     con el mapa de ciclos cargado por el frontend, mismo campo REAL).
//   - La oferta de un ciclo es CicloCurso(IdCiclo, IdCurso): los selectores de
//     curso usan esa relación (GET /api/ciclos/:id/cursos), nunca el catálogo
//     global ni los prefijos de código (SM-, FV-, UNI-... son descriptivos).
//
// Funciones puras (sin Vite/React) para probarlas con `node --test`. Las
// etiquetas/nombres canónicos de universidad vienen del helper centralizado
// existente (universidadCiclo.js) vía los mismos parámetros que usa
// catalogoCursos.js — aquí NO hay mappings duplicados.
// ============================================================================

import { claveUniversidadCurso, etiquetaDesdeClave } from './catalogoCursos.js';

const compararTexto = (a, b) =>
  String(a ?? '').localeCompare(String(b ?? ''), 'es', { sensitivity: 'base' });

const normalizarClave = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const aSegundos = (hora) => {
  const m = String(hora ?? '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 3600 + Number(m[2]) * 60;
};

/** idCiclo numérico y seguro de un horario (defensivo con alias y strings). */
export const idCicloHorario = (turno) => {
  const valor = Number(turno?.idCiclo ?? turno?.IdCiclo);
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
};

/**
 * Universidad (clave normalizada) de un horario: primero el campo REAL
 * entregado por el backend (`universidadCiclo` = Ciclo.UniversidadObjetivo
 * del JOIN), y como respaldo el mapa de ciclos del frontend (mismo campo
 * REAL). Si no puede identificarse devuelve '' («Sin asignar»): NUNCA se
 * inventa una universidad a partir de nombres, códigos o prefijos.
 */
export function claveUniversidadHorario(turno, ciclosPorId = null) {
  if (!turno) return '';
  // El backend entrega la universidad del ciclo como `universidadCiclo`
  // (Ciclo.UniversidadObjetivo del JOIN); se reutiliza la normalización del
  // catálogo en lugar de duplicarla.
  const directo = claveUniversidadCurso({
    universidadObjetivo:
      turno.universidadCiclo ?? turno.universidadObjetivo ?? turno.UniversidadObjetivo
  });
  if (directo) return directo;
  const idCiclo = idCicloHorario(turno);
  const ciclo = idCiclo && ciclosPorId?.get ? ciclosPorId.get(idCiclo) : null;
  return ciclo ? claveUniversidadCurso(ciclo) : '';
}

/**
 * Agrupaciones de horarios por universidad del ciclo (chips dinámicos con
 * contadores reales). Clave '' → "Sin ciclo/universidad" al final.
 * @param {Array} turnos filas de GET /api/horarios.
 * @param {Map<number, object>} [ciclosPorId] mapa idCiclo → ciclo normalizado.
 * @param {Record<string,string>} [etiquetasPorClave] siglas canónicas.
 */
export function universidadesDeHorarios(turnos, ciclosPorId = null, etiquetasPorClave = {}) {
  const grupos = new Map();
  (Array.isArray(turnos) ? turnos : []).forEach((turno) => {
    if (!turno) return;
    const clave = claveUniversidadHorario(turno, ciclosPorId);
    const grupo = grupos.get(clave);
    if (grupo) grupo.total += 1;
    else grupos.set(clave, { clave, etiqueta: etiquetaDesdeClave(clave, etiquetasPorClave), total: 1 });
  });
  const sinUniversidad = (grupo) => (grupo.clave === '' ? 1 : 0);
  return [...grupos.values()].sort((a, b) => {
    if (sinUniversidad(a) !== sinUniversidad(b)) return sinUniversidad(a) - sinUniversidad(b);
    if (b.total !== a.total) return b.total - a.total;
    return compararTexto(a.etiqueta, b.etiqueta);
  });
}

/**
 * Ciclos con horarios (para el selector dependiente). Se derivan de los
 * DATOS: solo ciclos que tienen al menos un horario activo. Orden: el mismo
 * de los chips de universidad (mayor cantidad primero) y luego por nombre.
 */
export function ciclosConHorarios(turnos, ciclosPorId = null, etiquetasPorClave = {}) {
  const conteo = new Map();
  (Array.isArray(turnos) ? turnos : []).forEach((turno) => {
    if (!turno) return;
    const idCiclo = idCicloHorario(turno);
    if (idCiclo) conteo.set(idCiclo, (conteo.get(idCiclo) || 0) + 1);
  });
  const ciclos = new Map();
  (Array.isArray(turnos) ? turnos : []).forEach((turno) => {
    if (!turno) return;
    const idCiclo = idCicloHorario(turno);
    if (!idCiclo || ciclos.has(idCiclo)) return;
    const datos = ciclosPorId?.get ? ciclosPorId.get(idCiclo) : null;
    const clave = claveUniversidadHorario(turno, ciclosPorId);
    ciclos.set(idCiclo, {
      idCiclo,
      nombre: datos?.nombre ?? String(turno.ciclo ?? turno.Ciclo ?? '').trim(),
      clave,
      etiqueta: etiquetaDesdeClave(clave, etiquetasPorClave),
      total: conteo.get(idCiclo) || 1
    });
  });
  return [...ciclos.values()].sort((a, b) => {
    // Misma regla que los chips: los «sin ciclo» al final; el resto por nombre.
    const sinUniversidadA = a.clave === '' ? 1 : 0;
    const sinUniversidadB = b.clave === '' ? 1 : 0;
    if (sinUniversidadA !== sinUniversidadB) return sinUniversidadA - sinUniversidadB;
    return compararTexto(a.nombre, b.nombre);
  });
}

/** ¿El ciclo seleccionado pertenece a la universidad del filtro? */
export function cicloCompatible(ciclosPorId, idCiclo, universidad) {
  const claveFiltro = normalizarClave(universidad);
  if (!claveFiltro || claveFiltro === 'todas') return true;
  const id = Number(idCiclo);
  if (!id) return true; // "Todos los ciclos" siempre es compatible con cualquier universidad.
  const ciclo = ciclosPorId?.get ? ciclosPorId.get(id) : null;
  return (ciclo ? claveUniversidadCurso(ciclo) : '') === claveFiltro;
}

/** Búsqueda libre de horarios: curso, ciclo, día y horas. */
export function coincideBusquedaHorario(turno, texto) {
  const patron = String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!patron) return true;
  if (!turno) return false;
  const campos = [
    turno.curso,
    turno.Curso,
    turno.ciclo,
    turno.Ciclo,
    turno.diaSemana,
    turno.DiaSemana,
    turno.horaInicio,
    turno.HoraInicio,
    turno.horaFin,
    turno.HoraFin
  ];
  return normalizarCamposHorario(campos).includes(patron);
}

function normalizarCamposHorario(campos) {
  return campos
    .map((campo) =>
      String(campo ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    )
    .join(' ');
}

/** Orden interno de un horario: DíaNumero → Orden → HoraInicio. */
function compararDiaOrdenHora(a, b) {
  const dias = Number(a.diaNumero ?? a.DiaNumero ?? 0) - Number(b.diaNumero ?? b.DiaNumero ?? 0);
  if (dias !== 0) return dias;
  const ordenes = Number(a.orden ?? a.Orden ?? 0) - Number(b.orden ?? b.Orden ?? 0);
  if (ordenes !== 0) return ordenes;
  return aSegundos(a.horaInicio ?? a.HoraInicio) - aSegundos(b.horaInicio ?? b.HoraInicio);
}

/**
 * Horarios visibles combinando universidad + ciclo + búsqueda, con el orden
 * acordado:
 *   - "todas": Universidad → Ciclo → DíaNumero → Orden → HoraInicio.
 *   - un ciclo específico: DíaNumero → Orden → HoraInicio.
 * Nunca depende de IdHorario ni de prefijos de código.
 */
export function horariosVisibles(
  turnos,
  {
    universidad = 'todas',
    idCiclo = 'todos',
    texto = '',
    ciclosPorId = null,
    etiquetasUniversidad = {},
    ordenGrupos = null
  } = {}
) {
  // Igual que en el catálogo de cursos: 'todas' (o la ABSENCIA del filtro)
  // muestra el catálogo global de horarios; la cadena vacía ES un filtro
  // válido: solo los horarios «sin universidad identificable».
  const filtroEspecifico = universidad !== undefined && universidad !== null;
  const claveFiltro = filtroEspecifico ? normalizarClave(universidad) : 'todas';
  const filtroGlobal = claveFiltro === 'todas';
  const idCicloFiltro = Number(idCiclo);

  const bases = (Array.isArray(turnos) ? turnos : []).filter((turno) => {
    if (!turno) return false;
    if (!filtroGlobal && claveUniversidadHorario(turno, ciclosPorId) !== claveFiltro) return false;
    if (Number.isSafeInteger(idCicloFiltro) && idCicloFiltro > 0 && idCicloHorario(turno) !== idCicloFiltro) return false;
    return true;
  });

  const visibles = bases.filter((turno) => coincideBusquedaHorario(turno, texto));
  if (Number.isSafeInteger(idCicloFiltro) && idCicloFiltro > 0) {
    return [...visibles].sort(compararDiaOrdenHora);
  }

  // Orden de grupos universitarios: el de los chips si se entrega, o
  // recalculado con la lista completa (mismo criterio).
  const grupos = ordenGrupos?.length
    ? ordenGrupos
    : universidadesDeHorarios(turnos, ciclosPorId, etiquetasUniversidad);
  const indice = new Map(grupos.map((grupo, posicion) => [grupo.clave, posicion]));

  const nombreCiclo = (turno) => {
    const idCicloActual = idCicloHorario(turno);
    const delMapa = idCicloActual && ciclosPorId?.get ? ciclosPorId.get(idCicloActual) : null;
    return delMapa?.nombre ?? String(turno.ciclo ?? '').trim();
  };

  return [...visibles].sort((a, b) => {
    const grupoA = indice.get(claveUniversidadHorario(a, ciclosPorId)) ?? indice.size;
    const grupoB = indice.get(claveUniversidadHorario(b, ciclosPorId)) ?? indice.size;
    if (grupoA !== grupoB) return grupoA - grupoB;
    const ciclos = compararTexto(nombreCiclo(a), nombreCiclo(b));
    if (ciclos !== 0) return ciclos;
    return compararDiaOrdenHora(a, b);
  });
}
