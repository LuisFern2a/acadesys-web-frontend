// ============================================================================
// Utilidades PURAS del paso 4 (Oferta) del wizard "Registrar Nuevo Ciclo".
//
// CAUSA del problema que corrigen: el paso Oferta mostraba el catálogo global
// de cursos (todas las universidades mezcladas) porque ignoraba la universidad
// seleccionada en el paso 1.
//
// Fuente de verdad (verificada contra la BD y el backend):
//   - `Curso.UniversidadObjetivo` es el campo ESTRUCTURADO del catálogo de
//     cursos (GET /api/cursos lo entrega en cada curso). Es la ÚNICA relación
//     Universidad ↔ Curso del modelo; no existen tablas de Plan/Malla.
//   - Los prefijos de los códigos (SM-, UNI-, PUCP-, FV-, UNAC-) son
//     DESCRIPTIVOS: NUNCA se usa el código para inferir la universidad.
//
// El backend además valida la misma regla al guardar (admin-ciclos.routes.js:
// código CICLO_CURSOS_UNIVERSIDAD), por lo que el filtro de aquí solo ayuda al
// usuario; no es la única protección.
// ============================================================================

const normalizarUniversidad = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

/**
 * Cursos de la universidad objetivo del ciclo, ordenados naturalmente:
 * primero alfabético por nombre y, si hay nombres iguales, por código.
 * No usa prefijos de código: compara exclusivamente el campo universidad.
 * @param {Array<{idCurso:number, nombre?:string, codigo?:string, universidadObjetivo?:string, UniversidadObjetivo?:string}>} cursos Catálogo completo (GET /api/cursos).
 * @param {string} universidad Universidad objetivo seleccionada en el paso 1 (UNMSM, UNFV, ...).
 * @returns {Array} Solo los cursos de esa universidad.
 */
export function cursosDeUniversidad(cursos, universidad) {
  const objetivo = normalizarUniversidad(universidad);
  if (!objetivo) return [];
  const lista = (Array.isArray(cursos) ? cursos : []).filter((curso) => {
    if (!curso) return false;
    return normalizarUniversidad(curso.universidadObjetivo ?? curso.UniversidadObjetivo) === objetivo;
  });
  return lista.sort((a, b) => {
    const nombres = String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es', { sensitivity: 'base' });
    if (nombres !== 0) return nombres;
    return String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'es', { sensitivity: 'base' });
  });
}

/**
 * Selección compatible: conserva únicamente los ids que pertenecen al
 * catálogo de la universidad objetivo. Se usa al cambiar la universidad del
 * paso 1 y al abrir la edición de un ciclo con vínculos históricos cruzados.
 * @param {Array<number|string>} idsSeleccionados ids guardados en el formulario.
 * @param {Array} cursosUniversidad salida de `cursosDeUniversidad`.
 * @returns {number[]} ids compatibles (raw).
 */
export function seleccionCompatible(idsSeleccionados, cursosUniversidad) {
  const disponibles = new Set(
    (Array.isArray(cursosUniversidad) ? cursosUniversidad : []).map((curso) => Number(curso.idCurso))
  );
  return (Array.isArray(idsSeleccionados) ? idsSeleccionados : []).filter((id) => disponibles.has(Number(id)));
}
