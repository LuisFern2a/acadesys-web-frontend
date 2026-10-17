// ============================================================================
// Utilidad CENTRALIZADA: identificar la universidad de un ciclo y resolver su
// logo. Es 100% de solo lectura: no modifica datos, API ni backend.
//
// Estrategia de detección (segura):
//   1) Se usa primero el campo ESTRUCTURADO del ciclo `universidadObjetivo`
//      (valores canónicos: UNMSM, UNI, PUCP, UNFV, UNAC, UNT, Preuniversitario).
//   2) Si no se pudo identificar, se reconoce la universidad desde el NOMBRE
//      del ciclo, usando términos específicos y coincidencia por PALABRA
//      COMPLETA (nunca `nombre.includes('uni')`).
//   3) Si nada coincide con seguridad, se devuelve `null` (la tarjeta conserva
//      el icono GraduationCap original; nunca se asigna una universidad al azar).
// ============================================================================

const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // paréntesis, guiones, puntos... -> espacio
    .trim();

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Catálogo de universidades soportadas. La CLAVE (en minúsculas) debe coincidir
// con el nombre del archivo del logo en src/assets/universidades/.
export const UNIVERSIDADES = {
  UNMSM: {
    nombre: 'Universidad Nacional Mayor de San Marcos',
    terminos: ['unmsm', 'san marcos', 'mayor de san marcos']
  },
  UNFV: {
    nombre: 'Universidad Nacional Federico Villarreal',
    terminos: ['unfv', 'villarreal', 'villareal', 'federico villarreal']
  },
  UNAC: {
    nombre: 'Universidad Nacional del Callao',
    terminos: ['unac', 'callao']
  },
  UNI: {
    nombre: 'Universidad Nacional de Ingeniería',
    terminos: ['uni', 'ingenieria']
  },
  PUCP: {
    nombre: 'Pontificia Universidad Católica del Perú',
    terminos: ['pucp', 'catolica', 'pontificia']
  },
  UNT: {
    nombre: 'Universidad Nacional de Trujillo',
    terminos: ['unt', 'trujillo']
  }
};

// Logos disponibles: se descubren automáticamente en la carpeta de assets.
// Si aún no hay archivos, el mapa queda vacío y la tarjeta usa el fallback.
const modulosLogo = import.meta.glob(
  '../assets/universidades/*.{png,svg,jpg,jpeg,webp}',
  { eager: true }
);

const LOGOS = {};
for (const ruta in modulosLogo) {
  const archivo = ruta.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase();
  const modulo = modulosLogo[ruta];
  LOGOS[archivo] = modulo?.default || modulo;
}

// Coincidencia por palabra completa (evita falsos positivos).
const contieneTermino = (textoNormalizado, termino) => {
  const t = normalizar(termino);
  if (!t) return false;
  return new RegExp(`(?:^|\\s)${escaparRegex(t)}(?:\\s|$)`).test(textoNormalizado);
};

/**
 * Devuelve la clave de universidad (UNMSM, UNFV, UNAC, UNI, PUCP) del ciclo,
 * o `null` si no se puede identificar con seguridad.
 */
export function obtenerUniversidadCiclo(ciclo) {
  if (!ciclo) return null;

  // 1) Campo estructurado del ciclo.
  const estructurado = normalizar(ciclo.universidadObjetivo);
  if (estructurado) {
    for (const clave of Object.keys(UNIVERSIDADES)) {
      if (estructurado === clave.toLowerCase()) return clave;
    }
    for (const [clave, datos] of Object.entries(UNIVERSIDADES)) {
      if (datos.terminos.some((termino) => contieneTermino(estructurado, termino))) {
        return clave;
      }
    }
  }

  // 2) Nombre del ciclo.
  const nombre = normalizar(ciclo.nombre);
  if (nombre) {
    for (const [clave, datos] of Object.entries(UNIVERSIDADES)) {
      if (datos.terminos.some((termino) => contieneTermino(nombre, termino))) {
        return clave;
      }
    }
  }

  return null;
}

/** Nombre completo de la universidad del ciclo (para `alt`), o `null`. */
export function nombreUniversidadCiclo(ciclo) {
  const clave = obtenerUniversidadCiclo(ciclo);
  return clave ? UNIVERSIDADES[clave].nombre : null;
}

/** URL del logo de la universidad, o `null` si el archivo no existe. */
export function obtenerLogoUniversidad(clave) {
  return (clave && LOGOS[clave.toLowerCase()]) || null;
}
