// ============================================================================
// Utilidades PURAS de la pestaña "Cursos Académicos" (Administrador →
// Gestión Académica). Agrupan, filtran y ordenan el catálogo GLOBAL de
// cursos POR UNIVERSIDAD para organizarlo en la interfaz, sin ocultar
// permanentemente cursos de otras universidades.
//
// Fuente de verdad (verificada contra la BD y el backend):
//   - `Curso.UniversidadObjetivo` es el campo ESTRUCTURADO del catálogo
//     (GET /api/cursos lo entrega en cada curso). Es la ÚNICA relación
//     Universidad ↔ Curso del modelo.
//   - Los prefijos de los códigos (SM-, UNI-, PUCP-, FV-, UNAC-) son
//     DESCRIPTIVOS: NUNCA se usa el código para inferir la universidad.
//
// Son funciones puras (sin importar Vite ni React) para poder probarlas con
// `node --test`. El nombre completo de cada universidad lo resuelve la
// pantalla con `universidadCiclo.js` (helper centralizado ya existente), a
// través del parámetro opcional `resolverNombreUniversidad`; aquí NO se
// duplica ningún mapping de universidades.
// ============================================================================

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const compararTexto = (a, b) =>
  String(a ?? '').localeCompare(String(b ?? ''), 'es', { sensitivity: 'base' });

/**
 * Clave de agrupación (minúsculas, sin tildes) de la universidad objetivo de
 * un curso. Devuelve `''` cuando el curso no trae el campo (los cursos sin
 * universidad se agrupan aparte y se muestran con una etiqueta defensiva).
 * @param {{universidadObjetivo?: string, UniversidadObjetivo?: string}} curso
 * @returns {string}
 */
export function claveUniversidadCurso(curso) {
  if (!curso) return '';
  return normalizarTexto(curso.universidadObjetivo ?? curso.UniversidadObjetivo);
}

/**
 * Etiqueta visible de una clave de universidad. Si el llamador entrega el
 * mapa centralizado (clave normalizada → texto canónico, p. ej. de
 * `UNIVERSIDADES`) se usa ese valor; si no, la clave tal cual en mayúsculas
 * (nunca se inventa un nombre).
 * @param {string} clave clave normalizada de `claveUniversidadCurso`.
 * @param {Record<string, string>} [etiquetasPorClave] mapa opcional de etiquetas.
 * @returns {string} etiqueta; `''` si la clave está vacía.
 */
export function etiquetaDesdeClave(clave, etiquetasPorClave = {}) {
  const claveLimpia = normalizarTexto(clave);
  if (!claveLimpia) return '';
  return etiquetasPorClave?.[claveLimpia] || claveLimpia.toUpperCase();
}

/**
 * Agrupaciones del catálogo por UniversidadObjetivo, DERIVADAS DE LOS DATOS
 * (no hay lista fija de universidades). Cada grupo lleva su propia cantidad,
 * así las universidades nuevas aparecen solas cuando sus cursos existan.
 * Orden de los chips: «sin asignar» al final, luego mayor cantidad primero
 * y, a igual cantidad, alfabético.
 * @param {Array} cursos catálogo completo (GET /api/cursos).
 * @param {Record<string, string>} [etiquetasPorClave] etiquetas canónicas.
 * @returns {Array<{clave: string, etiqueta: string, total: number}>}
 */
export function universidadesDelCatalogo(cursos, etiquetasPorClave = {}) {
  const grupos = new Map();
  (Array.isArray(cursos) ? cursos : []).forEach((curso) => {
    if (!curso) return;
    const clave = claveUniversidadCurso(curso);
    const grupo = grupos.get(clave);
    if (grupo) {
      grupo.total += 1;
    } else {
      grupos.set(clave, { clave, etiqueta: etiquetaDesdeClave(clave, etiquetasPorClave), total: 1 });
    }
  });
  const sinAsignar = (grupo) => (grupo.clave === '' ? 1 : 0);
  return [...grupos.values()].sort((a, b) => {
    // 1) los grupos vacíos («sin asignar») van al final;
    if (sinAsignar(a) !== sinAsignar(b)) return sinAsignar(a) - sinAsignar(b);
    // 2) mayores cantidades primero (más importantes para el administrador);
    if (b.total !== a.total) return b.total - a.total;
    // 3) desempate alfabético por etiqueta.
    return compararTexto(a.etiqueta, b.etiqueta);
  });
}

/**
 * ¿Coincide un curso con el texto de búsqueda? Busca en nombre, código y
 * universidad (sigla cruda y también nombre completo cuando se entrega el
 * resolver del helper centralizado: «San Marcos» encuentra UNMSM).
 * @param {object} curso curso normalizado de la pestaña.
 * @param {string} texto texto de búsqueda libre.
 * @param {Record<string, string>} [etiquetasPorClave]
 * @param {(clave: string) => string} [resolverNombreUniversidad]
 * @returns {boolean}
 */
export function coincideBusquedaCurso(
  curso,
  texto,
  etiquetasPorClave = {},
  resolverNombreUniversidad = null
) {
  const patron = normalizarTexto(texto);
  if (!patron) return true;
  if (!curso) return false;

  const campos = [
    curso.nombre,
    curso.Nombre,
    curso.codigo,
    curso.Codigo,
    curso.universidadObjetivo,
    curso.UniversidadObjetivo
  ];
  const clave = claveUniversidadCurso(curso);
  if (clave) {
    campos.push(etiquetaDesdeClave(clave, etiquetasPorClave));
    const nombreResuelto = resolverNombreUniversidad ? String(resolverNombreUniversidad(clave) ?? '') : '';
    if (nombreResuelto) campos.push(nombreResuelto);
  }
  return normalizarTexto(campos.join(' ')).includes(patron);
}

/** Orden natural de un curso: Nombre → Código (nunca por id). */
function compararNombreCodigo(a, b) {
  const nombres = compararTexto(a.nombre ?? a.Nombre, b.nombre ?? b.Nombre);
  if (nombres !== 0) return nombres;
  return compararTexto(a.codigo ?? a.Codigo, b.codigo ?? b.Codigo);
}

/**
 * Catálogo visible combinando FILTRO POR UNIVERSIDAD + BÚSQUEDA LIBRE,
 * con el orden acordado para la pestaña:
 *   - Filtro «todos»: Universidad → Nombre → Código (agrupado naturalmente;
 *     el orden de los grupos es el de `universidadesDelCatalogo`).
 *   - Filtro de una universidad: Nombre → Código.
 * Nunca depende del orden de ids ni de prefijos de código.
 *
 * @param {Array} cursos catálogo completo.
 * @param {{
 *   universidad?: string,
 *   texto?: string,
 *   etiquetasUniversidad?: Record<string, string>,
 *   resolverNombreUniversidad?: (clave: string) => string,
 * }} [opciones]
 * @returns {Array} lista nueva ordenada (el catálogo original no se muta).
 *
 * `opciones.universidad` admite: 'todos' (o ausencia del filtro) → catálogo
 * global; clave normalizada → solo esa universidad; '' → solo los cursos
 * «sin universidad asignada» (chip «Sin asignar»).
 */
export function catalogoCursosVisible(cursos, opciones = {}) {
  const {
    texto = '',
    etiquetasUniversidad = {},
    resolverNombreUniversidad = null
  } = opciones;

  // El valor 'todos' (o la ABSENCIA del filtro) muestra el catálogo global;
  // la cadena vacía ES un filtro válido: los cursos «sin universidad asignada».
  const filtroEspecifico = opciones.universidad !== undefined && opciones.universidad !== null;
  const universidadFiltro = normalizarTexto(filtroEspecifico ? opciones.universidad : 'todos');
  const filtroGlobal = universidadFiltro === 'todos';
  const bases = (Array.isArray(cursos) ? cursos : []).filter((curso) => {
    if (!curso) return false;
    if (!filtroGlobal) {
      return claveUniversidadCurso(curso) === universidadFiltro;
    }
    return true;
  });

  const visibles = bases.filter((curso) =>
    coincideBusquedaCurso(curso, texto, etiquetasUniversidad, resolverNombreUniversidad)
  );

  if (!filtroGlobal) {
    return [...visibles].sort(compararNombreCodigo);
  }

  // Orden de grupos: el mismo que verán los chips (mayor cantidad primero),
  // calculado con el catálogo COMPLETO (no con la lista filtrada).
  const ordenGrupos = new Map(
    universidadesDelCatalogo(cursos, etiquetasUniversidad).map((grupo, indice) => [grupo.clave, indice])
  );
  return [...visibles].sort((a, b) => {
    const grupoA = ordenGrupos.get(claveUniversidadCurso(a)) ?? ordenGrupos.size;
    const grupoB = ordenGrupos.get(claveUniversidadCurso(b)) ?? ordenGrupos.size;
    if (grupoA !== grupoB) return grupoA - grupoB;
    return compararNombreCodigo(a, b);
  });
}
