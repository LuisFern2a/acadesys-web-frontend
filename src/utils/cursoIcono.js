// ============================================================================
// Utilidad CENTRALIZADA: CURSO -> ICONO ACADÉMICO (SVG).
//
// ÚNICA fuente de verdad de la iconografía de materias. La consumen:
//   - "Cursos Académicos"  -> <CursoIcon nombre={curso.nombre} />
//   - "Horarios"           -> <CursoIcon nombre={turno.curso} />
// de forma que un mismo curso muestra SIEMPRE el mismo icono en ambas pestañas.
//
// Colección: Tabler Icons v3.31.0 (MIT) en `src/assets/cursos/`
// (fuente y licencia documentadas en el README de ese directorio).
//
// Es 100% de solo lectura: no toca datos, API ni backend. El nombre del curso
// nunca se altera de cara al usuario; sólo se usa para elegir el icono.
// ============================================================================

// Vite incrusta el CONTENIDO de cada SVG (`?raw`), no una URL. Así el icono
// hereda `currentColor` (el azul institucional del contenedor) y no se hace
// ninguna petición extra en runtime.
const ARCHIVOS_SVG = import.meta.glob('../assets/cursos/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/**
 * Deja el SVG listo para vivir dentro de la caja del icono:
 * - fuera el prólogo XML, los comentarios y los atributos de tamaño/clase que
 *   trae el archivo original;
 * - dentro width/height al 100%, para que el tamaño lo mande el contenedor
 *   (misma huella que el icono anterior, sin desbordar ni deformar);
 * - se conservan `stroke="currentColor"` (color AcadeSys) y el `viewBox`
 *   (por eso el trazo se mantiene nítido a cualquier tamaño).
 */
const normalizarSvg = (crudo) =>
  String(crudo ?? '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b([^>]*)>/i, (_, atributos) => {
      const limpios = atributos
        .replace(/\s(?:width|height|class|style|id|aria-hidden|focusable)\s*=\s*"[^"]*"/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `<svg ${limpios} width="100%" height="100%" aria-hidden="true" focusable="false">`;
    });

// Índice "nombre de archivo sin extensión" -> SVG ya normalizado.
const SVG_POR_CLAVE = Object.fromEntries(
  Object.entries(ARCHIVOS_SVG).map(([ruta, contenido]) => [
    ruta.replace(/^.*\//, '').replace(/\.svg$/i, ''),
    normalizarSvg(contenido),
  ])
);

/**
 * Normaliza un nombre de curso para compararlo con seguridad: minúsculas, sin
 * tildes y con cualquier signo (paréntesis, guiones, puntos) convertido en
 * espacio. No se usa para mostrar: sólo para hacer match.
 */
export const normalizarNombreCurso = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // paréntesis, guiones, puntos... -> espacio
    .trim();

// Reglas ORDENADAS: gana la PRIMERA que coincide.
// Las específicas van antes que las generales; si no, "Habilidad
// Lógico-Matemática" caería en la regla genérica de "Matemática".
const REGLAS = [
  // --- Razonamiento / habilidades (específicas) ---
  { re: /\bhabilidad logico matematic\w*|\blogico matematic\w*|\brazonamiento matematic\w*/, clave: 'logico-matematica' },
  { re: /\bhabilidad verbal\b|\brazonamiento verbal\b|\bcomprension lectora\b/, clave: 'verbal' },

  // --- Comunicación ---
  { re: /\bcomunicacion\b/, clave: 'comunicacion' },
  { re: /\blenguaj\w*|\blengua\b/, clave: 'lenguaje' },
  { re: /\bliteratura\b/, clave: 'literatura' },

  // --- Matemáticas (específicas antes de la genérica) ---
  { re: /\baritmetic\w*/, clave: 'aritmetica' },
  { re: /\balgebra\w*/, clave: 'algebra' },
  { re: /\bgeometr\w*/, clave: 'geometria' },
  { re: /\btrigonometr\w*/, clave: 'trigonometria' },
  { re: /\bmatem\w*/, clave: 'matematica' },

  // --- Ciencias ---
  { re: /\bfisic\w*/, clave: 'fisica' },
  { re: /\bquimic\w*/, clave: 'quimica' },
  { re: /\bbiolog\w*/, clave: 'biologia' },

  // --- Sociales / humanidades ---
  { re: /\bcivic\w*/, clave: 'civica' },
  { re: /\bhistoria\b/, clave: 'historia' },
  { re: /\bgeograf\w*/, clave: 'geografia' },
  { re: /\beconom\w*/, clave: 'economia' },
  { re: /\bfilosof\w*/, clave: 'filosofia' },
  { re: /\bpsicolog\w*/, clave: 'psicologia' },
];

/**
 * Clave del icono (materia) de un curso, o `null` si el curso no se reconoce.
 * Nunca se asigna una materia al azar.
 */
export function obtenerClaveIconoCurso(nombre) {
  const texto = normalizarNombreCurso(nombre);
  if (!texto) return null;

  for (const { re, clave } of REGLAS) {
    if (re.test(texto) && SVG_POR_CLAVE[clave]) return clave;
  }
  return null;
}

/**
 * SVG del icono de la materia de un curso, ya listo para insertar.
 * Devuelve `null` si el curso no se reconoce (el componente usa entonces su
 * icono genérico).
 */
export function obtenerSvgIconoCurso(nombre) {
  const clave = obtenerClaveIconoCurso(nombre);
  return clave ? SVG_POR_CLAVE[clave] : null;
}


