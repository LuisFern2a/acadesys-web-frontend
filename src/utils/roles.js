// ============================================================================
// Normalización CENTRAL y segura de perfiles (roles) de AcadeSys.
// ----------------------------------------------------------------------------
// Fuente de verdad: los nombres reales que entrega la API en `rol` / `Rol` /
// `Perfil` / `NombrePerfil` (Administrador, Docente, Tutor de Aula, Estudiante,
// Alumno, RRHH, Recursos Humanos, Padre de Familia).
//
// Regla de oro: se compara por IGUALDAD EXACTA contra un mapa cerrado de alias,
// NUNCA con `includes`. Así cadenas como "Auxiliar Administrativo",
// "Subadministrador" o "Administrativo" NO obtienen permisos por accidente.
//
// Tampoco se usa `colorTema`, el nombre de un menú ni ningún dato de
// presentación para decidir permisos: esto es autorización (visual) basada solo
// en el perfil real. La autorización definitiva vive en el backend.
// ============================================================================

export const GRUPO_ADMIN = 'administrador';
export const GRUPO_DOCENTE = 'docente';
export const GRUPO_TUTOR = 'tutor';
export const GRUPO_ALUMNO = 'alumno';
export const GRUPO_PADRE = 'padre';

// Alias EXACTOS y cerrados (ya normalizados). Solo estas cadenas cuentan.
const GRUPOS_POR_NOMBRE = {
  administrador: GRUPO_ADMIN,
  admin: GRUPO_ADMIN,
  docente: GRUPO_DOCENTE,
  'tutor de aula': GRUPO_TUTOR,
  tutor: GRUPO_TUTOR,
  estudiante: GRUPO_ALUMNO,
  alumno: GRUPO_ALUMNO,
  padre: GRUPO_PADRE,
  'padre de familia': GRUPO_PADRE,
  // DECISIÓN DOCUMENTADA: en AcadeSys, RRHH / Recursos Humanos comparte la
  // navegación administrativa con Administrador. Es un mapeo EXPLÍCITO por
  // igualdad exacta (no un `includes`). Si la institución decide separarlos,
  // basta con quitar estas dos entradas (y darles su propio grupo) en este
  // único punto sin tocar el resto del frontend.
  rrhh: GRUPO_ADMIN,
  'recursos humanos': GRUPO_ADMIN
};

// Normaliza un texto de perfil: sin acentos, minúsculas, espacios colapsados.
export const normalizarRol = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

// Devuelve el grupo canónico ('administrador' | 'docente' | 'tutor' | 'alumno' |
// 'padre') o `null` si el texto no corresponde a un perfil conocido.
export const grupoDeRol = (texto) => GRUPOS_POR_NOMBRE[normalizarRol(texto)] || null;

// Texto de perfil de una sesión/usuario, sin asumir una sola forma del dato.
export const rolDeUsuario = (user) =>
  user?.rol || user?.Rol || user?.Perfil || user?.NombrePerfil || user?.perfil || '';

export const esGrupo = (user, grupo) => grupoDeRol(rolDeUsuario(user)) === grupo;

export const esAdmin = (user) => esGrupo(user, GRUPO_ADMIN);
export const esDocente = (user) => esGrupo(user, GRUPO_DOCENTE);
export const esTutor = (user) => esGrupo(user, GRUPO_TUTOR);
export const esAlumno = (user) => esGrupo(user, GRUPO_ALUMNO);
export const esPadre = (user) => esGrupo(user, GRUPO_PADRE);
export const esStaff = (user) => esAdmin(user) || esDocente(user) || esTutor(user);

// Clave estable para comparar dos roles cuando no se conoce el grupo.
export const claveRol = (texto) => grupoDeRol(texto) || normalizarRol(texto);
