// ============================================================================
// Utilidad CENTRALIZADA: identificar la universidad de un ciclo, resolver su
// logo y su MARCA DE AGUA institucional. Es 100% de solo lectura: no modifica
// datos, API ni backend.
//
// Estrategia de deteccion (segura):
//   1) Se usa primero el campo ESTRUCTURADO del ciclo `universidadObjetivo`
//      (valores canonicos: UNMSM, UNI, PUCP, UNFV, UNAC, UNT, UNALM, UPCH,
//      ULIMA, UPC, USMP, UTP, Preuniversitario).
//   2) Si no se pudo identificar, se reconoce la universidad desde el NOMBRE
//      del ciclo, usando terminos especificos y coincidencia por PALABRA
//      COMPLETA (nunca `nombre.includes('uni')`).
//   3) Si nada coincide con seguridad, se devuelve `null` (la tarjeta conserva
//      el icono GraduationCap original; nunca se asigna una universidad al azar).
//
// La MARCA DE AGUA se decide SIEMPRE por la UNIVERSIDAD del ciclo, nunca por
// el nombre del ciclo: varias tarjetas de la misma universidad reutilizan el
// mismo asset. Si la universidad no tiene asset local, no se muestra marca de
// agua (fallback limpio, sin imagen rota y sin inventar escudos).
// ============================================================================

const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // parentesis, guiones, puntos... -> espacio
    .trim();

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Catalogo de universidades soportadas. La CLAVE (en minusculas) debe coincidir
// con el nombre del archivo del logo en src/assets/universidades/.
//
// `terminos`: alias aceptados (sigla y nombre completo) para identificar la
// universidad cuando el backend entrega el nombre completo en vez de la sigla.
// `marca`: ajuste visual de la marca de agua. La configuracion es por
// UNIVERSIDAD (no por ciclo) y admite tres ejes:
//   - `opacidad`: intensidad (4 % - 8 %). Muy tenue: la informacion manda.
//   - `ancho`:    tamaño del asset (w-28 ... w-44), responsive.
//   - `posicion`: clases de colocacion (por defecto: borde derecho, centrado
//                 verticalmente). Permite bajar o desplazar el logo cuando el
//                 asset es horizontal y chocaria con la columna HORARIO/CURSOS.
const POSICION_POR_DEFECTO = 'right-0 top-1/2 -translate-y-1/2';

export const UNIVERSIDADES = {
  UNMSM: {
    nombre: 'Universidad Nacional Mayor de San Marcos',
    terminos: ['unmsm', 'san marcos', 'mayor de san marcos'],
    marca: { opacidad: 'opacity-[0.055]', ancho: 'w-40 sm:w-44' }
  },
  UNFV: {
    nombre: 'Universidad Nacional Federico Villarreal',
    terminos: ['unfv', 'villarreal', 'villareal', 'federico villarreal'],
    // Asset horizontal (incluye el nombre de la universidad): se mantiene
    // pequeno, se baja del centro y se pega al borde para no cruzar la
    // columna HORARIO/CURSOS.
    marca: {
      opacidad: 'opacity-[0.05]',
      ancho: 'w-32 sm:w-36',
      posicion: 'right-[-6px] top-[68%] -translate-y-1/2'
    }
  },
  UNAC: {
    nombre: 'Universidad Nacional del Callao',
    terminos: ['unac', 'callao'],
    // Escudo vertical: algo mas pequeno para que no pese sobre los datos.
    marca: { opacidad: 'opacity-[0.05]', ancho: 'w-28 sm:w-32' }
  },
  UNI: {
    nombre: 'Universidad Nacional de Ingeniería',
    terminos: ['uni', 'ingenieria'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-36 sm:w-40' }
  },
  PUCP: {
    nombre: 'Pontificia Universidad Católica del Perú',
    terminos: ['pucp', 'catolica', 'pontificia'],
    // Simbolo compacto: no necesita ocupar mucho ancho.
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-32 sm:w-36' }
  },
  UNT: {
    nombre: 'Universidad Nacional de Trujillo',
    terminos: ['unt', 'trujillo'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-32 sm:w-36' }
  },
  UNALM: {
    nombre: 'Universidad Nacional Agraria La Molina',
    terminos: ['unalm', 'agraria', 'la molina'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-32 sm:w-36' }
  },
  UPCH: {
    nombre: 'Universidad Peruana Cayetano Heredia',
    terminos: ['upch', 'cayetano heredia', 'cayetano'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-40 sm:w-44' }
  },
  ULIMA: {
    nombre: 'Universidad de Lima',
    terminos: ['ulima', 'universidad de lima', 'de lima'],
    marca: { opacidad: 'opacity-[0.05]', ancho: 'w-40 sm:w-44' }
  },
  UPC: {
    nombre: 'Universidad Peruana de Ciencias Aplicadas',
    terminos: ['upc', 'ciencias aplicadas'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-28 sm:w-32' }
  },
  USMP: {
    nombre: 'Universidad de San Martín de Porres',
    terminos: ['usmp', 'san martin de porres', 'martin de porres'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-36 sm:w-40' }
  },
  UTP: {
    nombre: 'Universidad Tecnológica del Perú',
    terminos: ['utp', 'tecnologica de peru'],
    marca: { opacidad: 'opacity-[0.06]', ancho: 'w-40 sm:w-44' }
  }
};

// Logos disponibles: se descubren automaticamente en la carpeta de assets.
// Si aun no hay archivos, el mapa queda vacio y la tarjeta usa el fallback.
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
 * Devuelve la clave de universidad (UNMSM, UNFV, ...) del ciclo,
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

/**
 * Nombre completo de una universidad a partir de su clave o alias en texto
 * (sigla o nombre completo). Acepta ambos formatos porque el backend puede
 * entregar cualquiera de los dos. Devuelve `null` si no se reconoce.
 */
export function nombreUniversidadPorClave(clave) {
  const normalizado = normalizar(clave);
  if (!normalizado) return null;

  for (const [nombreClave, datos] of Object.entries(UNIVERSIDADES)) {
    if (normalizado === nombreClave.toLowerCase()) return datos.nombre;
    if (datos.terminos.some((termino) => contieneTermino(normalizado, termino))) {
      return datos.nombre;
    }
  }

  return null;
}

/** URL del logo de la universidad, o `null` si el archivo no existe. */
export function obtenerLogoUniversidad(clave) {
  return (clave && LOGOS[clave.toLowerCase()]) || null;
}

/**
 * Marca de agua institucional de la universidad.
 * Devuelve `{ asset, opacidad, ancho }` o `null` si la universidad no tiene
 * asset local (en ese caso la tarjeta se muestra sin marca de agua).
 */
export function obtenerMarcaUniversidad(clave) {
  if (!clave) return null;

  const asset = obtenerLogoUniversidad(clave);
  if (!asset) return null;

  const marca = UNIVERSIDADES[clave]?.marca;
  return {
    asset,
    opacidad: marca?.opacidad || 'opacity-[0.06]',
    ancho: marca?.ancho || 'w-40',
    posicion: marca?.posicion || POSICION_POR_DEFECTO
  };
}
