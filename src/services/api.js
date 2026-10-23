// URL única de la API. No se hardcodean endpoints en las páginas.
export const API_URL = import.meta.env?.VITE_API_URL || "https://acadesys-api.onrender.com";

// Importar helper de validación de calificaciones (entero, sin redondear).
import { calificacionEntera } from '../utils/calificaciones.js';

// ==========================================
// NORMALIZACIÓN CENTRAL DE RESPUESTAS
// ==========================================
// El backend mezcla respuestas en camelCase y PascalCase según el módulo.
// Estas funciones convierten una sola vez y evitan que cada página improvise.
export function normalizarListaRespuesta(payload, claves = [], profundidad = 0) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object' || profundidad > 3) return [];
  for (const clave of [...claves, 'data', 'datos', 'items', 'resultados']) {
    if (Array.isArray(payload[clave])) return payload[clave];
  }
  for (const clave of ['data', 'datos']) {
    if (payload[clave] && typeof payload[clave] === 'object') {
      const lista = normalizarListaRespuesta(payload[clave], claves, profundidad + 1);
      if (lista.length) return lista;
    }
  }
  return [];
}

export function mensajeErrorApi(error, mensajePorDefecto = 'No se pudo completar la operación.') {
  const status = Number(error?.status);
  if (status === 409) return error?.message || 'Ya existe un registro con esos datos.';
  if (status === 413) return 'El archivo supera el tamaño máximo permitido por el servidor.';
  if (status === 403) return error?.message || 'No tienes permisos para realizar esta acción.';
  return error?.message || mensajePorDefecto;
}

const numeroSeguro = (valor, defecto = 0) => {
  if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '')) return defecto;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : defecto;
};

export function normalizarCiclo(ciclo = {}) {
  const estadoRegistro = numeroSeguro(ciclo.estadoRegistro ?? ciclo.EstadoRegistro, null);
  const totalAlumnos = numeroSeguro(ciclo.totalAlumnos ?? ciclo.TotalAlumnos ?? ciclo.alumnos, 0);
  const capacidad = numeroSeguro(ciclo.capacidad ?? ciclo.Capacidad, 0);
  const vacantes = ciclo.vacantesDisponibles ?? ciclo.VacantesDisponibles;
  return {
    ...ciclo,
    idCiclo: numeroSeguro(ciclo.idCiclo ?? ciclo.IdCiclo ?? ciclo.id, null),
    idAcademia: numeroSeguro(ciclo.idAcademia ?? ciclo.IdAcademia, null),
    nombre: String(ciclo.nombre ?? ciclo.Nombre ?? '').trim(),
    turno: ciclo.turno ?? ciclo.Turno ?? '',
    horario: ciclo.horario ?? ciclo.Horario ?? '',
    diasClase: ciclo.diasClase ?? ciclo.DiasClase ?? '',
    universidadObjetivo: ciclo.universidadObjetivo ?? ciclo.UniversidadObjetivo ?? '',
    fechaInicio: ciclo.fechaInicio ?? ciclo.FechaInicio ?? null,
    fechaFin: ciclo.fechaFin ?? ciclo.FechaFin ?? null,
    precio: numeroSeguro(ciclo.precio ?? ciclo.Precio, null),
    capacidad,
    totalAlumnos,
    totalCursos: numeroSeguro(ciclo.totalCursos ?? ciclo.TotalCursos, 0),
    totalEvaluaciones: numeroSeguro(ciclo.totalEvaluaciones ?? ciclo.TotalEvaluaciones, 0),
    vacantesDisponibles: vacantes === undefined || vacantes === null ? null : numeroSeguro(vacantes, 0),
    prefijoCodigo: ciclo.prefijoCodigo ?? ciclo.PrefijoCodigo ?? ciclo.prefijo ?? '',
    estadoRegistro,
    publicar: estadoRegistro === null ? Boolean(ciclo.publicar) : estadoRegistro === 1,
    estado: ciclo.estado ?? (estadoRegistro === 1 ? 'Activo' : estadoRegistro === 0 ? 'Cerrado' : ''),
  };
}

export function normalizarMaterial(material = {}) {
  return {
    ...material,
    idMaterial: numeroSeguro(material.idMaterial ?? material.IdMaterial, null),
    idCiclo: numeroSeguro(material.idCiclo ?? material.IdCiclo, null),
    idCurso: numeroSeguro(material.idCurso ?? material.IdCurso, null),
    titulo: material.titulo ?? material.Titulo ?? '',
    descripcion: material.descripcion ?? material.Descripcion ?? '',
    nombreArchivo: material.nombreArchivo ?? material.NombreArchivo ?? '',
    urlArchivo: material.urlArchivo ?? material.UrlArchivo ?? '',
    tipoMime: material.tipoMime ?? material.TipoMime ?? '',
    fechaPublicacion: material.fechaPublicacion ?? material.FechaPublicacion ?? null,
    curso: material.curso ?? material.Curso ?? '',
    ciclo: material.ciclo ?? material.Ciclo ?? '',
  };
}

export function normalizarNota(nota = {}) {
  const calificacion = nota.calificacion ?? nota.Calificacion;
  const entero = calificacionEntera(calificacion);
  const estadoRegistro = numeroSeguro(nota.estadoRegistro ?? nota.EstadoRegistro, 1);
  return {
    ...nota,
    idEvaluacion: numeroSeguro(nota.idEvaluacion ?? nota.IdEvaluacion, null),
    idMatricula: numeroSeguro(nota.idMatricula ?? nota.IdMatricula, null),
    tipoEvaluacion: nota.tipoEvaluacion ?? nota.TipoEvaluacion ?? '',
    periodo: nota.periodo ?? nota.Periodo ?? 'General',
    calificacion: entero !== null ? entero : null,
    fechaCreacion: nota.fechaCreacion ?? nota.FechaCreacion ?? null,
    curso: nota.curso ?? nota.Curso ?? '',
    alumno: nota.alumno ?? nota.Alumno ?? '',
    codigoUsuario: nota.codigoUsuario ?? nota.CodigoUsuario ?? '',
    estadoRegistro,
  };
}

// ==========================================
// CONTROL DE TOKEN JWT Y SESIÓN (representación única)
// ==========================================
// Convención ÚNICA y coherente de sesión en localStorage:
//   - `acadesys_token`   : cadena JWT (única fuente del token).
//   - `acadesys_session` : objeto JSON de sesión (perfil, nombre, academia...).
// El objeto de sesión nunca guarda el token suelto, y `acadesys_session` nunca
// guarda una cadena suelta: así no conviven dos formatos bajo la misma clave.

const CLAVE_TOKEN = 'acadesys_token';
const CLAVE_SESION = 'acadesys_session';

// Caché breve de la petición en vuelo del expediente del alumno.
let miIntranetCache = { promesa: null, creadaEn: 0 };

// Persiste el token JWT en su clave dedicada.
export function guardarToken(token) {
  if (token) {
    if (localStorage.getItem(CLAVE_TOKEN) !== String(token)) {
      miIntranetCache = { promesa: null, creadaEn: 0 };
    }
    localStorage.setItem(CLAVE_TOKEN, String(token));
  }
}

// Persiste el objeto de sesión sin duplicar el token dentro del objeto.
export function guardarSesion(sesion) {
  if (!sesion || typeof sesion !== 'object') return null;
  const { token, ...resto } = sesion;
  if (token) guardarToken(token);
  localStorage.setItem(CLAVE_SESION, JSON.stringify(resto));
  return resto;
}

// Lectura DEFENSIVA del objeto de sesión. Si la clave contiene un formato
// antiguo (cadena suelta) se ignora en lugar de romper la aplicación.
export function obtenerSesion() {
  const bruto = localStorage.getItem(CLAVE_SESION);
  if (!bruto) return null;
  try {
    const datos = JSON.parse(bruto);
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : null;
  } catch {
    return null;
  }
}

// Lectura defensiva del token: primero la clave dedicada; si solo existe dentro
// de un objeto de sesión antiguo, se migra a `acadesys_token`.
export function obtenerToken() {
  const directo = localStorage.getItem(CLAVE_TOKEN);
  if (directo) return directo;

  const sesion = obtenerSesion();
  const anidado = sesion?.token || sesion?.jwt || sesion?.accessToken;
  if (anidado) {
    localStorage.setItem(CLAVE_TOKEN, String(anidado));
    return String(anidado);
  }
  return null;
}

// Limpia por completo el estado de sesión (sin redirigir).
export function limpiarSesion() {
  miIntranetCache = { promesa: null, creadaEn: 0 };
  localStorage.removeItem(CLAVE_SESION);
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem('usuario');
  localStorage.removeItem('acadesys_user');
}

// Cierra la sesión y vuelve al inicio.
export function cerrarSesion() {
  limpiarSesion();
  window.location.href = '/';
}

async function solicitarApi(endpoint, options = {}) {
  if (/\/(?:undefined|null|NaN)(?=\/|\?|$)/.test(endpoint)) {
    throw new Error('No se puede realizar la operación sin un identificador válido.');
  }
  try {
    return await fetch(API_URL + endpoint, options);
  } catch (causa) {
    if (causa?.name === 'AbortError') throw causa;
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', { cause: causa });
  }
}

// Interceptor centralizado: inyecta el JWT y normaliza la respuesta de error.
// 401 -> cierra sesión; 403 -> mensaje de permisos; 5xx -> mensaje genérico.
export async function fetchWithAuth(endpoint, options = {}) {
  const token = obtenerToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await solicitarApi(endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn('[Auth] Sesión expirada. Cerrando sesión.');
    cerrarSesion();
    const error = new Error('Sesión no autorizada o expirada.');
    error.status = 401;
    throw error;
  }

  // 403: autenticado pero sin permiso. No se cierra la sesión.
  if (response.status === 403) {
    const datos = await response.json().catch(() => ({}));
    const error = new Error(datos.error || datos.message || datos.mensaje || 'No tienes permisos para realizar esta acción.');
    error.status = 403;
    error.data = datos;
    throw error;
  }

  // 413: el body del PDF/base64 supera el límite del servidor.
  if (response.status === 413) {
    const error = new Error('El servidor rechazó el archivo por tamaño (413). Reduce el PDF; el límite de archivo es 10 MB.');
    error.status = 413;
    throw error;
  }

  // 5xx: mensaje genérico, sin exponer detalles internos del servidor.
  if (response.status >= 500) {
    const error = new Error('Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.');
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const datos = await response.json().catch(() => ({}));
    const error = new Error(datos.error || datos.message || datos.mensaje || `Error HTTP: ${response.status}`);
    error.status = response.status;
    error.data = datos;
    throw error;
  }

  return response;
}

// ==========================================
// AUTENTICACIÓN (LOGIN SEGURO EN EL BODY)
// ==========================================
function construirSesionLogin(data, valorIngresado) {
  const academia = data.academia || {};
  const usuario = data.user || {};
  const nombre = data.nombre || (typeof data.usuario === 'string' ? data.usuario : '') || usuario.nombre || valorIngresado;
  const idPerfil = data.idPerfil ?? data.IdPerfil ?? data.id_perfil ?? usuario.idPerfil ?? null;
  return {
    idUsuario: data.idUsuario ?? usuario.idUsuario ?? usuario.id ?? null,
    nombre,
    correo: data.correo ?? usuario.correo ?? '',
    dni: data.dni ?? usuario.dni ?? '',
    codigoUsuario: data.codigoUsuario ?? usuario.codigoUsuario ?? '',
    rol: data.rol || data.perfil || data.NombrePerfil || usuario.rol || '',
    Perfil: data.rol || data.perfil || data.NombrePerfil || usuario.rol || '',
    idPerfil,
    idAcademia: data.idAcademia ?? academia.idAcademia ?? academia.id ?? usuario.idAcademia ?? null,
    colorTema: academia.colorTema || data.colorTema || '#2563eb',
    logoUrl: academia.logoUrl || data.logoUrl || null,
    nombreAcademia: academia.nombreAcademia || data.nombreAcademia || 'AcadeSys',
    matricula: data.matricula ?? null,
  };
}

export async function iniciarSesion(codigoOUsuario, password) {
  const valorLimpio = String(codigoOUsuario || '').trim();
  // La contraseña NO se recorta: los espacios pueden ser parte de la clave real.
  const passLimpia = String(password ?? '');

  if (!valorLimpio || !passLimpia) {
    throw new Error('Ingresa tu usuario o correo y tu contraseña.');
  }

  const response = await solicitarApi('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: valorLimpio,
      codigo_usuario: valorLimpio,
      password: passLimpia
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || data.mensaje || 'Credenciales inválidas');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  const tokenRecibido = data.token || data.jwt || data.accessToken;
  if (!tokenRecibido) throw new Error('El servidor no devolvió un token de sesión válido.');

  const sesion = construirSesionLogin(data, valorLimpio);
  if (!sesion.rol) throw new Error('El servidor no devolvió un perfil válido para tu cuenta.');

  guardarToken(tokenRecibido);
  guardarSesion(sesion);
  return { ...data, sesion };
}

// ==========================================
// MÃ“DULO DE PERFILES (RBAC)
// ==========================================

export async function obtenerPerfiles() {
  const response = await fetchWithAuth(`/api/perfiles`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['perfiles']);
}

export async function crearPerfil(nuevoPerfil) {
  const payload = {
    NombrePerfil: nuevoPerfil.NombrePerfil,
    Descripcion: nuevoPerfil.Descripcion
  };
  const response = await fetchWithAuth(`/api/perfiles`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function actualizarPerfil(idPerfil, perfilActualizado) {
  if (!Number.isSafeInteger(Number(idPerfil)) || Number(idPerfil) <= 0) {
    throw new Error('No se puede actualizar un perfil sin un identificador válido.');
  }
  // Se envían solo los campos presentes: permite editar nombre/descripción
  // o cambiar únicamente el estado (activar/desactivar).
  const payload = {};
  if (perfilActualizado.NombrePerfil !== undefined) {
    payload.NombrePerfil = String(perfilActualizado.NombrePerfil).trim();
  }
  if (perfilActualizado.Descripcion !== undefined) {
    payload.Descripcion = String(perfilActualizado.Descripcion);
  }
  if (perfilActualizado.EstadoRegistro !== undefined) {
    const estado = Number(perfilActualizado.EstadoRegistro);
    if (![0, 1].includes(estado)) {
      throw new Error('El estado del perfil debe ser Activo o Inactivo.');
    }
    payload.EstadoRegistro = estado;
  }
  if (Object.keys(payload).length === 0) {
    throw new Error('No se enviaron cambios para el perfil.');
  }
  const response = await fetchWithAuth(`/api/perfiles/${Number(idPerfil)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function eliminarPerfil(idPerfil) {
  if (!Number.isSafeInteger(Number(idPerfil)) || Number(idPerfil) <= 0) {
    throw new Error('No se puede eliminar un perfil sin un identificador válido.');
  }
  const response = await fetchWithAuth(`/api/perfiles/${idPerfil}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

// ==========================================
// MÃ“DULO DE USUARIOS (ADMIN, DOCENTES, TUTORES)
// ==========================================

export async function obtenerUsuarios() {
  const response = await fetchWithAuth(`/api/usuarios`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['usuarios']);
}

// Directorio MÍNIMO no sensible (IdUsuario + NombreCompleto + Perfil).
// Reemplaza al listado administrativo en vistas que solo necesitan identificar
// personas (Académico, Dashboard) sin exponer DNI, correo ni celular.
export async function obtenerDirectorioUsuarios() {
  const response = await fetchWithAuth(`/api/usuarios/directorio`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['usuarios']);
}

// Datos del usuario autenticado (Mi Perfil). No acepta un IdUsuario arbitrario:
// el backend siempre los resuelve desde la sesión.
export async function obtenerMiUsuario() {
  const response = await fetchWithAuth(`/api/usuarios/me`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
}

// Elimina la foto de perfil del usuario autenticado. El backend resuelve el
// usuario desde la sesión; nunca se envía un IdUsuario desde el cliente.
export async function eliminarMiFoto() {
  const response = await fetchWithAuth(`/api/usuarios/me/foto`, { method: "DELETE" });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error || errData.message || errData.mensaje || `Error HTTP: ${response.status}`
    );
  }
  return response.status === 204 ? null : await response.json().catch(() => null);
}

export async function crearUsuario(datosUsuario) {
  if (Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 1) {
    throw new Error('La API de usuarios admite un único perfil por operación.');
  }

  const idPerfilPrincipal = Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 0
    ? Number(datosUsuario.perfiles[0])
    : Number(datosUsuario.idPerfil ?? datosUsuario.IdPerfil);

  // Sin perfiles "por defecto": el perfil debe venir del catálogo real del servidor.
  if (!Number.isSafeInteger(idPerfilPrincipal) || idPerfilPrincipal <= 0) {
    throw new Error('Debes seleccionar un perfil válido para el usuario.');
  }

  const payload = {
    CodigoUsuario: String(datosUsuario.nombreUsuario || datosUsuario.codigoUsuario || '').trim(),
    DNI: String(datosUsuario.dni || '').trim().slice(0, 8),
    Nombres: datosUsuario.nombre || '',
    ApellidoPaterno: datosUsuario.apellido || '',
    ApellidoMaterno: datosUsuario.apellidoMaterno || '',
    Celular: datosUsuario.celular || '',
    CorreoElectronico: datosUsuario.correo || '',
    Clave: datosUsuario.contrasena || '',
    UsuarioCreacion: datosUsuario.usuarioCreacion || 'sistema',
    EstadoRegistro: 1,
    IdPerfil: idPerfilPrincipal,
  };

  const response = await fetchWithAuth(`/api/usuarios`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error = new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    error.status = response.status;
    error.data = errData;
    throw error;
  }

  return await response.json();
}

export async function actualizarUsuario(idUsuario, datosUsuario) {
  if (!Number.isSafeInteger(Number(idUsuario)) || Number(idUsuario) <= 0) {
    throw new Error('No se puede actualizar un usuario sin un identificador válido.');
  }
  if (Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 1) {
    throw new Error('La API de usuarios admite un único perfil por operación.');
  }

  // Actualización PARCIAL: solo se envían los campos realmente presentes para
  // no sobrescribir información que no se está modificando.
  const payload = {};

  const dni = datosUsuario.dni ?? datosUsuario.DNI;
  if (dni !== undefined && dni !== null) {
    const dniLimpio = String(dni).trim().slice(0, 8);
    payload.DNI = dniLimpio || null;
  }

  const nombres = datosUsuario.nombre ?? datosUsuario.Nombres ?? datosUsuario.nombres;
  if (nombres !== undefined) payload.Nombres = String(nombres);

  const apellidoPaterno = datosUsuario.apellido ?? datosUsuario.ApellidoPaterno;
  if (apellidoPaterno !== undefined) payload.ApellidoPaterno = String(apellidoPaterno);

  const apellidoMaterno = datosUsuario.apellidoMaterno ?? datosUsuario.ApellidoMaterno;
  if (apellidoMaterno !== undefined) payload.ApellidoMaterno = String(apellidoMaterno);

  const celular = datosUsuario.celular ?? datosUsuario.Celular;
  if (celular !== undefined) payload.Celular = String(celular);

  const correo = datosUsuario.correo ?? datosUsuario.CorreoElectronico ?? datosUsuario.Correo;
  if (correo !== undefined) payload.CorreoElectronico = String(correo);

  const clave = datosUsuario.contrasena ?? datosUsuario.Clave;
  if (clave !== undefined && String(clave).length > 0) payload.Clave = String(clave);

  const estado = datosUsuario.estadoRegistro ?? datosUsuario.EstadoRegistro;
  if (estado !== undefined && estado !== null) {
    const estadoNumerico = estado === 'Activo' ? 1 : estado === 'Inactivo' ? 0 : Number(estado);
    if (![0, 1].includes(estadoNumerico)) throw new Error('El estado de acceso debe ser Activo o Inactivo.');
    payload.EstadoRegistro = estadoNumerico;
  }

  const idPerfil = datosUsuario.idPerfil ?? datosUsuario.IdPerfil ?? datosUsuario.perfiles?.[0];
  if (idPerfil !== undefined && idPerfil !== null) {
    if (!Number.isSafeInteger(Number(idPerfil)) || Number(idPerfil) <= 0) {
      throw new Error('Selecciona un perfil válido.');
    }
    payload.IdPerfil = Number(idPerfil);
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No se enviaron cambios para el usuario.');
  }

  const response = await fetchWithAuth(`/api/usuarios/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || errData.mensaje || `Error HTTP: ${response.status}`);
  }

  return response.status === 204 ? null : await response.json();
}

// Autoservicio de datos personales (Mi Perfil). El backend toma el IdUsuario de
// la sesión (nunca del cliente) y aplica una allowlist estricta: solo enviamos
// Nombres, DNI, CorreoElectronico y Celular. Cualquier campo administrativo
// (IdPerfil, EstadoRegistro, IdAcademia, CodigoUsuario, Clave...) se omite aquí
// y el backend además los ignora.
export async function actualizarMiUsuario(datosUsuario) {
  const payload = {};

  const nombres = datosUsuario?.nombre ?? datosUsuario?.nombres ?? datosUsuario?.Nombres;
  if (nombres !== undefined) payload.Nombres = String(nombres);

  const dni = datosUsuario?.dni ?? datosUsuario?.DNI;
  if (dni !== undefined && dni !== null) {
    const dniLimpio = String(dni).trim().slice(0, 8);
    payload.DNI = dniLimpio || null;
  }

  const correo = datosUsuario?.correo ?? datosUsuario?.CorreoElectronico ?? datosUsuario?.Correo;
  if (correo !== undefined) payload.CorreoElectronico = String(correo);

  const celular = datosUsuario?.celular ?? datosUsuario?.Celular;
  if (celular !== undefined) payload.Celular = String(celular);

  // NUEVO: Soporte opcional para foto de perfil
  // El backend acepta fotoBase64, tipoMime y tamanoBytes en PUT /api/usuarios/me
  const fotoBase64 = datosUsuario?.fotoBase64;
  const tipoMime = datosUsuario?.tipoMime;
  const tamanoBytes = datosUsuario?.tamanoBytes;

  // Solo agregamos la foto si se proporciona y tiene datos válidos
  if (fotoBase64 !== undefined && fotoBase64 !== null && String(fotoBase64).trim() !== '') {
    // Validación frontend básica: verificar MIME type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (tipoMime && !allowedTypes.includes(tipoMime)) {
      throw new Error('Formato de imagen no válido. Use JPG, PNG o WebP.');
    }
    // Validación de tamaño (2 MB conservador)
    if (tamanoBytes && tamanoBytes > 2 * 1024 * 1024) {
      throw new Error('La imagen no puede superar los 2 MB.');
    }
    payload.fotoBase64 = fotoBase64;
    if (tipoMime) payload.tipoMime = tipoMime;
    if (tamanoBytes !== undefined) payload.tamanoBytes = tamanoBytes;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No se enviaron cambios para tu perfil.');
  }

  const response = await fetchWithAuth(`/api/usuarios/me`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || errData.mensaje || `Error HTTP: ${response.status}`);
  }

  return response.status === 204 ? null : await response.json();
}

export async function eliminarUsuario(idUsuario) {
  if (!Number.isSafeInteger(Number(idUsuario)) || Number(idUsuario) <= 0) {
    throw new Error('No se puede eliminar un usuario sin un identificador válido.');
  }
  const response = await fetchWithAuth(`/api/usuarios/${idUsuario}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return response.status === 204 ? null : await response.json();
}

// ==========================================
// HU-01: MATRÃCULA ÃGIL Y GENERACIÃ“N DE CÃ“DIGOS
// ==========================================

export async function crearMatricula(datosMatricula) {
  const response = await fetchWithAuth(`/api/matriculas`, {
    method: "POST",
    body: JSON.stringify(datosMatricula),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json();
}

export const registrarMatriculaAgil = crearMatricula;

// ==========================================
// HU-04: MÃ“DULO DE FINANZAS, PAGOS Y MOROSIDAD
// ==========================================

export async function obtenerPagosPorCiclo(idCiclo) {
  if (!idCiclo) throw new Error('Debe seleccionar un ciclo para consultar los pagos.');
  const response = await fetchWithAuth(`/api/pagos/ciclo/${encodeURIComponent(idCiclo)}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['pagos']);
}

export async function actualizarEstadoPago(idPago, estado) {
  if (!idPago) {
    throw new Error('No se proporcionó el IdPago.');
  }

  if (!['Pagado', 'Moroso'].includes(estado)) {
    throw new Error('El estado del pago debe ser "Pagado" o "Moroso".');
  }

  const response = await fetchWithAuth(`/api/pagos/${idPago}/estado`, {
    method: 'PUT',
    body: JSON.stringify({
      Estado: estado
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
      errorData.message ||
      errorData.mensaje ||
      `Error HTTP: ${response.status}`
    );
  }

  return await response.json().catch(() => ({
    ok: true,
    IdPago: idPago,
    Estado: estado
  }));
}

export async function obtenerMonitoreoTutores(idCiclo = 1) {
  const response = await fetchWithAuth(`/api/tutores/monitoreo?idCiclo=${idCiclo}`);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }

  return await response.json();
}

// ==========================================
// HU-03: MÃ“DULO DE MENÃšS Y PERMISOS
// ==========================================

export async function obtenerOpcionesMenu() {
  const visitados = new Set();
  async function recorrer(endpoint, idPadre, profundidad = 0) {
    if (profundidad > 25) throw new Error('La jerarquía de menús supera la profundidad permitida.');
    const data = await leerRespuestaMenus(await fetchWithAuth(endpoint));
    if (!Array.isArray(data)) throw new Error('El servidor devolvió un catálogo de menús no válido.');
    const resultado = [];
    for (const dato of data) {
      const menu = normalizarMenu(dato, idPadre);
      if (visitados.has(menu.IdOpcionMenu) || visitados.size >= 2000) {
        throw new Error('La jerarquía de menús contiene ciclos, duplicados o demasiados elementos.');
      }
      visitados.add(menu.IdOpcionMenu);
      resultado.push(menu);
      resultado.push(...await recorrer(`/api/menus/${menu.IdOpcionMenu}/submenus`, menu.IdOpcionMenu, profundidad + 1));
    }
    return resultado;
  }
  return recorrer('/api/menus', null);
}

function idMenuValido(id) {
  return ['number', 'string'].includes(typeof id) && /^\d+$/.test(String(id)) &&
    Number.isSafeInteger(Number(id)) && Number(id) > 0 && Number(id) <= 2147483647;
}

async function leerRespuestaMenus(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `Error HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (data === null) throw new Error('El servidor devolvió una respuesta de menús no válida.');
  return data;
}

function normalizarMenu(menu, padreEsperado) {
  if (!menu || !idMenuValido(menu.IdOpcionMenu) || typeof menu.Nombre !== 'string' ||
      (menu.UrlMenu != null && typeof menu.UrlMenu !== 'string') ||
      (menu.Descripcion != null && typeof menu.Descripcion !== 'string') ||
      (menu.EstadoRegistro !== undefined && Number(menu.EstadoRegistro) !== 1)) {
    throw new Error('El servidor devolvió una opción de menú no válida.');
  }
  const padre = menu.IdPadre === undefined ? (padreEsperado ?? null) : menu.IdPadre;
  if (padre !== null && !idMenuValido(padre)) throw new Error('El menú tiene un padre no válido.');
  const idPadre = padre === null ? null : Number(padre);
  if (padreEsperado !== undefined && idPadre !== padreEsperado) {
    throw new Error('La respuesta de submenús no coincide con su menú padre.');
  }
  return { ...menu, IdOpcionMenu: Number(menu.IdOpcionMenu), IdPadre: idPadre, UrlMenu: menu.UrlMenu ?? '' };
}

export async function obtenerMenusPorPerfil(idPerfil) {
  if (!idMenuValido(idPerfil)) throw new Error('Selecciona un perfil válido para consultar su navegación.');
  const data = await leerRespuestaMenus(await fetchWithAuth(`/api/menus/perfil/${Number(idPerfil)}`));
  if (!data.perfil || Number(data.perfil.IdPerfil) !== Number(idPerfil) || !Array.isArray(data.menus)) {
    throw new Error('El servidor devolvió una configuración de navegación no válida.');
  }
  return { perfil: data.perfil, menus: data.menus.map((menu) => normalizarMenu(menu)) };
}

function notificarCambioMenus() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('acadesys-menus-actualizados'));
}

export async function crearOpcionMenu(datosMenu) {
  const payload = {
    Nombre: datosMenu.nombre,
    UrlMenu: datosMenu.ruta,
    Descripcion: datosMenu.descripcion || '',
    IdPadre: datosMenu.idPadre ? Number(datosMenu.idPadre) : null,
    EstadoRegistro: 1
  };

  const response = await fetchWithAuth(`/api/menus`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await leerRespuestaMenus(response);
  notificarCambioMenus();
  return data;
}

export async function asignarMenuAPerfil(idOpcionMenu, idPerfil, orden = 1) {
  if (!idMenuValido(idOpcionMenu) || !idMenuValido(idPerfil) || !idMenuValido(orden)) {
    throw new Error('Menú, perfil y orden deben tener identificadores enteros positivos válidos.');
  }
  const payload = {
    IdOpcionMenu: Number(idOpcionMenu),
    IdPerfil: Number(idPerfil),
    Orden: Number(orden),
    EstadoRegistro: 1
  };

  const response = await fetchWithAuth(`/api/menus/asignar`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await leerRespuestaMenus(response);
  notificarCambioMenus();
  return data;
}

// ==========================================
// MÃ“DULO ACADÃ‰MICO (AULAS, CURSOS, CARGA)
// ==========================================

export async function obtenerAulas() {
  const response = await fetchWithAuth(`/api/aulas`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['aulas']);
}

export async function crearAula(nuevaAula) {
  const response = await fetchWithAuth(`/api/aulas`, {
    method: "POST",
    body: JSON.stringify(nuevaAula),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function actualizarAula(idAula, aulaActualizada) {
  const response = await fetchWithAuth(`/api/aulas/${idAula}`, {
    method: 'PUT',
    body: JSON.stringify(aulaActualizada),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function eliminarAula(idAula) {
  const response = await fetchWithAuth(`/api/aulas/${idAula}`, { method: 'DELETE' });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function obtenerCursos() {
  const response = await fetchWithAuth(`/api/cursos`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['cursos']);
}

export async function crearCurso(nuevoCurso) {
  const response = await fetchWithAuth(`/api/cursos`, {
    method: "POST",
    body: JSON.stringify(nuevoCurso),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function actualizarCurso(idCurso, cursoActualizado) {
  const response = await fetchWithAuth(`/api/cursos/${idCurso}`, {
    method: 'PUT',
    body: JSON.stringify(cursoActualizado),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function eliminarCurso(idCurso) {
  const response = await fetchWithAuth(`/api/cursos/${idCurso}`, { method: 'DELETE' });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function obtenerAsignacionesDocente() {
  const response = await fetchWithAuth(`/api/asignaciones`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['asignaciones']);
}

export async function crearAsignacionDocente(nuevaAsig) {
  const response = await fetchWithAuth(`/api/asignaciones`, {
    method: "POST",
    body: JSON.stringify(nuevaAsig),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function eliminarAsignacionDocente(idAsignacion) {
  const response = await fetchWithAuth(`/api/asignaciones/${idAsignacion}`, { method: 'DELETE' });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

// ==========================================
// MÓDULO DE HORARIOS
// ==========================================

export async function obtenerHorarios(idCiclo = null) {
  const params = new URLSearchParams();
  if (idCiclo) params.set('idCiclo', String(idCiclo));
  const query = params.toString();
  const response = await fetchWithAuth(`/api/horarios${query ? `?${query}` : ''}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['horarios']);
}

export async function crearHorario(nuevoHorario) {
  const response = await fetchWithAuth('/api/horarios', {
    method: 'POST',
    body: JSON.stringify(nuevoHorario),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function actualizarHorario(idHorario, horarioActualizado) {
  const response = await fetchWithAuth(`/api/horarios/${idHorario}`, {
    method: 'PUT',
    body: JSON.stringify(horarioActualizado),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function eliminarHorario(idHorario) {
  const response = await fetchWithAuth(`/api/horarios/${idHorario}`, { method: 'DELETE' });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

// ==========================================
// MÃ“DULO DE ASISTENCIA
// ==========================================

export async function obtenerAsistenciaPorAulaYFecha(idAula, fecha) {
  if (!idAula) {
    throw new Error('Debe seleccionar un aula válida para consultar la asistencia.');
  }
  if (!fecha) {
    throw new Error('Debe seleccionar una fecha para consultar la asistencia.');
  }

  const params = new URLSearchParams({
    idAula: String(idAula),
    fecha: String(fecha)
  });
  const response = await fetchWithAuth(`/api/asistencias?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.error || data.message || data.mensaje || `Error HTTP: ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.asistencias)) return data.asistencias;
  return [];
}

export async function obtenerAsistenciaPorCiclo(idCiclo, fecha) {
  if (!idCiclo) throw new Error('Debe seleccionar un ciclo.');
  if (!fecha) throw new Error('Debe seleccionar una fecha.');
  const params = new URLSearchParams({ idCiclo: String(idCiclo), fecha: String(fecha) });
  const response = await fetchWithAuth(`/api/asistencias?${params.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
  return normalizarListaRespuesta(data, ['asistencias']);
}

export async function guardarAsistenciaPorCiclo(idCiclo, fecha, listaAlumnos) {
  if (!idCiclo) throw new Error('Debe seleccionar un ciclo.');
  if (!fecha) throw new Error('Debe seleccionar una fecha.');
  if (!Array.isArray(listaAlumnos) || listaAlumnos.length === 0) throw new Error('No hay alumnos para guardar la asistencia.');
  const response = await fetchWithAuth('/api/asistencias', {
    method: 'POST',
    body: JSON.stringify({ idCiclo, fecha, listaAlumnos })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Error HTTP: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function guardarAsistencia(idAula, fecha, listaAlumnos) {
  if (!idAula) {
    throw new Error('Debe seleccionar un aula válida antes de guardar la asistencia.');
  }
  if (!fecha) {
    throw new Error('Debe seleccionar una fecha antes de guardar la asistencia.');
  }
  if (!Array.isArray(listaAlumnos) || listaAlumnos.length === 0) {
    throw new Error('No hay alumnos para guardar la asistencia.');
  }

  const response = await fetchWithAuth('/api/asistencias', {
    method: 'POST',
    body: JSON.stringify({ idAula, fecha, listaAlumnos })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.error || data.message || data.mensaje || `Error HTTP: ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ==========================================
// MÃ“DULO DE CALIFICACIONES Y SIMULACROS (HU-07 / P1-09)
// ==========================================

export async function obtenerNotas() {
  const response = await fetchWithAuth('/api/notas');
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
  }

  return normalizarListaRespuesta(data, ['notas', 'evaluaciones']).map(normalizarNota);
}

export async function obtenerContextoNotas(idCiclo) {
  if (!idCiclo) throw new Error('Debe seleccionar un ciclo.');

  const response = await fetchWithAuth(
    `/api/notas/contexto/${encodeURIComponent(idCiclo)}`
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
  }

  const contexto = data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : data;
  return {
    ...contexto,
    idCiclo: contexto.idCiclo ?? contexto.IdCiclo,
    escalaMaxima: numeroSeguro(contexto.escalaMaxima ?? contexto.EscalaMaxima, null),
    universidadObjetivo: contexto.universidadObjetivo ?? contexto.UniversidadObjetivo ?? '',
  };
}

export async function obtenerMatriculasNotas(idCiclo) {
  if (!idCiclo) throw new Error('Debe seleccionar un ciclo.');

  const response = await fetchWithAuth(
    `/api/notas/matriculas/${encodeURIComponent(idCiclo)}`
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
  }

  return normalizarListaRespuesta(data, ['matriculas']);
}

export async function guardarNotasDocente(idCiclo, notas, periodo = 'General') {
  // Validar que cada nota tenga Calificación entero dentro de la escala antes de enviar.
  const notasValidadas = (Array.isArray(notas) ? notas : []).map((n) => {
    const calificacion = n.Calificacion ?? n.calificacion;
    const entero = calificacionEntera(calificacion);
    if (entero === null) {
      throw new Error('Cada calificación debe ser un número entero dentro de la escala permitida.');
    }
    return { ...n, Calificacion: entero };
  });

  if (notasValidadas.length === 0) {
    throw new Error('No hay calificaciones válidas para enviar.');
  }

  const response = await fetchWithAuth('/api/notas', {
    method: 'POST',
    body: JSON.stringify({
      idCiclo: Number(idCiclo),
      periodo: String(periodo || 'General').trim(),
      notas: notasValidadas
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Traducir códigos HTTP a mensajes entendibles para el frontend.
    const status = response.status;
    const mensajeBackend = data.error || data.mensaje || data.message || '';
    if (status === 400) {
      throw new Error('El servidor rechazó la calificación: debe ser un número entero dentro de la escala.');
    }
    if (status === 403) {
      throw new Error('El periodo o el acta de este ciclo está cerrada; no se pueden registrar calificaciones.');
    }
    if (status === 404) {
      throw new Error('El ciclo indicado no existe.');
    }
    if (status === 409) {
      throw new Error('Ya existe una evaluación con esa matrícula, tipo y periodo.');
    }
    // 413, 500 y demás: mensaje genérico sin exponer detalles internos.
    throw new Error(mensajeBackend || `Error HTTP: ${status}`);
  }

  return data;
}

export async function actualizarNotaDocente(idEvaluacion, calificacion) {
  if (!Number.isSafeInteger(Number(idEvaluacion)) || Number(idEvaluacion) <= 0) {
    throw new Error('La evaluación no tiene un identificador válido.');
  }
  // Validar que la calificación sea un entero dentro de la escala.
  const entero = calificacionEntera(calificacion);
  if (entero === null) {
    throw new Error('La calificación debe ser un número entero dentro de la escala permitida.');
  }

  const response = await fetchWithAuth(
    `/api/notas/${encodeURIComponent(idEvaluacion)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        Calificacion: entero
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const status = response.status;
    const mensajeBackend = data.error || data.mensaje || data.message || '';
    if (status === 400) {
      throw new Error('La calificación debe ser un número entero dentro de la escala.');
    }
    if (status === 403) {
      throw new Error('El acta o el periodo está cerrado: la evaluación no puede modificarse.');
    }
    if (status === 404) {
      throw new Error('La nota no existe o no pertenece a esta academia.');
    }
    // 409 no se espera en PUT para una sola nota; si llega, usar mensaje genérico.
    throw new Error(mensajeBackend || `Error HTTP: ${status}`);
  }

  return data;
}

// ==========================================
// MÃ“DULO DE COMUNICADOS
// ==========================================

export async function obtenerComunicados() {
  const response = await fetchWithAuth(`/api/comunicados`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return normalizarListaRespuesta(await response.json(), ['comunicados']).map((item) => ({
    ...item,
    id: item.id ?? item.idComunicado ?? item.IdComunicado,
    confirmado: item.confirmado === true || Number(item.confirmado) === 1,
    leido: item.leido === true || Number(item.leido) === 1,
  }));
}

export async function crearComunicado(nuevo) {
  const response = await fetchWithAuth(`/api/comunicados`, {
    method: "POST",
    body: JSON.stringify(nuevo)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json();
}

export async function confirmarLecturaComunicado(id) {
  const response = await fetchWithAuth(`/api/comunicados/${id}/lectura`, {
    method: "PUT"
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json();
}

// ==========================================
// HU-06: TUTOR PEDAGÃ“GICO IA (GEMINI PREU)
// ==========================================

export async function consultarTutorIA(pregunta) {
  // El expediente lo construye el backend desde el JWT, no desde datos inventados.
  const payload = { pregunta: String(pregunta || '').trim() };
  if (!payload.pregunta || payload.pregunta.length > 2000) {
    throw new Error('La pregunta debe tener entre 1 y 2000 caracteres.');
  }

  const response = await fetchWithAuth(`/api/tutor-ia`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || errData.mensaje || `Error HTTP: ${response.status}`);
  }

  const data = await response.json();
  let textoFinal = data.respuesta || data.mensaje || data.result || data.analisis || '';

  if (typeof textoFinal === 'object') {
    textoFinal = textoFinal.analisis || JSON.stringify(textoFinal);
  }

  if (data.consejoAdmision) {
    textoFinal += `\n\nConsejo de admisión: ${data.consejoAdmision}`;
  }

  return {
    ...data,
    respuesta: textoFinal
  };
}

// ==========================================
// HU-05: PANEL DEL ALUMNO Y MATERIALES
// ==========================================

export async function obtenerMaterialesAlumno(idCiclo = 1) {
  const response = await fetchWithAuth(`/api/materiales?idCiclo=${idCiclo}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function obtenerNotasSimulacroAlumno(idEstudiante) {
  const query = idEstudiante ? `?idEstudiante=${idEstudiante}` : '';
  const response = await fetchWithAuth(`/api/notas/simulacros${query}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function obtenerCiclosPublicos() {
  const response = await solicitarApi('/api/ciclos/publicos');
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const lista = normalizarListaRespuesta(data, ['ciclos', 'publicos']);

  return lista
    .map(normalizarCiclo)
    .filter((ciclo) => Number.isSafeInteger(ciclo.idCiclo) && ciclo.idCiclo > 0);
}

export async function obtenerCursosCiclo(idCiclo) {
  const response = await solicitarApi(`/api/ciclos/${idCiclo}/cursos`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const lista = normalizarListaRespuesta(data, ['cursos']);
  return lista.map((c) => ({
    idCurso: c.IdCurso ?? c.idCurso ?? c.id,
    nombre: c.Nombre ?? c.nombre,
    codigo: c.Codigo ?? c.codigo ?? '',
    descripcion: c.Descripcion ?? c.descripcion ?? '',
    universidadObjetivo: c.UniversidadObjetivo ?? c.universidadObjetivo ?? '',
    docente: c.Docentes ?? c.docente ?? ''
  }));
}

/**
 * Preflight público de disponibilidad de ciclo. NO verifica titularidad del
 * correo ni revela si una cuenta existe; la autorización de reinscripción la
 * decide el backend en POST /api/matriculas/checkout.
 */
export async function verificarDisponibilidadMatricula(correo, idCiclo) {
  const correoNormalizado = String(correo || '').trim().toLowerCase();
  const cicloNormalizado = Number(idCiclo);

  const response = await solicitarApi('/api/matriculas/verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: correoNormalizado, idCiclo: cicloNormalizado }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.message || data.error || data.mensaje || 'No se pudo comprobar la disponibilidad del ciclo.',
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return {
    disponible: data.disponible === true,
    idCiclo: numeroSeguro(data.idCiclo ?? data.IdCiclo ?? cicloNormalizado, null),
    mensaje: data.mensaje || data.message || undefined,
  };
}

export async function procesarCheckoutMatricula(payload) {
  const cuerpo = {
    IdCiclo: payload.idCiclo,
    Nombres: payload.nombres,
    Apellidos: payload.apellidos,
    Correo: payload.correo,
    PrefijoCiclo: payload.prefijoCiclo || payload.prefijo || null,
    idCiclo: payload.idCiclo,
    nombres: payload.nombres,
    apellidos: payload.apellidos,
    correo: payload.correo,
    monto: payload.monto
  };

  const token = obtenerToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await solicitarApi('/api/matriculas/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(cuerpo)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
      data.error ||
      data.mensaje ||
      'Error al procesar la inscripción'
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function obtenerMiIntranetAlumno({ force = false } = {}) {
  // Evita repetir GET /api/alumno/me cuando App, la intranet y el Tutor IA
  // arrancan casi al mismo tiempo. Comparte la petición/respuesta durante 10 s,
  // siempre acotada al token actual; Actualizar permite forzar una lectura.
  const ahora = Date.now();
  const tokenSesion = obtenerToken();
  if (!force && miIntranetCache.token === tokenSesion && miIntranetCache.promesa && ahora - miIntranetCache.creadaEn < 10000) {
    return miIntranetCache.promesa;
  }

  const promesa = (async () => {
    const response = await fetchWithAuth('/api/alumno/me');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  })();

  miIntranetCache = { promesa, creadaEn: ahora, token: tokenSesion };
  try {
    return await promesa;
  } catch (error) {
    if (miIntranetCache.promesa === promesa) miIntranetCache = { promesa: null, creadaEn: 0 };
    throw error;
  }
}

export async function obtenerMaterialesAdmin(idCiclo) {
  const query = idCiclo ? `?idCiclo=${encodeURIComponent(idCiclo)}` : '';
  const response = await fetchWithAuth(`/api/materiales/admin${query}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return normalizarListaRespuesta(data, ['materiales']).map(normalizarMaterial);
}

export async function subirMaterialPDF(payload) {
  const response = await fetchWithAuth('/api/materiales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      response.status === 413
        ? 'El PDF no puede superar los 10 MB.'
        : (data.error || data.message || `HTTP: ${response.status}`)
    );
    error.status = response.status;
    throw error;
  }

  return normalizarMaterial(data);
}

export async function eliminarMaterial(idMaterial) {
  const response = await fetchWithAuth(`/api/materiales/${idMaterial}`, {
    method: 'DELETE'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}
// ==========================================
// P1-04: ADMINISTRACIÃ“N Y APERTURA DE CICLOS
// ==========================================

function crearErrorApiCiclo(data, status, mensajeDefecto) {
  const error = new Error(
    data?.message ||
    data?.error ||
    data?.mensaje ||
    mensajeDefecto
  );
  error.status = status;
  error.data = data;
  return error;
}

export async function obtenerCiclosAdmin() {
  const response = await fetchWithAuth('/api/admin/ciclos');
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw crearErrorApiCiclo(
      data,
      response.status,
      'No se pudieron obtener los ciclos'
    );
  }

  return normalizarListaRespuesta(data, ['ciclos'])
    .map(normalizarCiclo)
    .filter((ciclo) => Number.isSafeInteger(ciclo.idCiclo) && ciclo.idCiclo > 0);
}

// Fuente única para páginas internas: intenta el endpoint autenticado de
// administración y, si el perfil no es administrador (403 real del backend),
// cae al catálogo público de ciclos activos. Así docentes/tutores no reciben 403.
export async function obtenerCiclosGestionActivos() {
  let lista;
  try {
    lista = await obtenerCiclosAdmin();
  } catch (error) {
    if (![403, 404].includes(Number(error?.status))) throw error;
    lista = await obtenerCiclosPublicos();
  }
  return lista.filter((ciclo) => ciclo.estadoRegistro === null || ciclo.estadoRegistro === 1);
}

function prepararPayloadCiclo(datosCiclo = {}) {
  const idCursos = Array.isArray(datosCiclo.cursosSeleccionados)
    ? datosCiclo.cursosSeleccionados.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
    : [];
  return {
    nombre: String(datosCiclo.nombre || '').trim(),
    universidadObjetivo: String(datosCiclo.universidadObjetivo || '').trim(),
    turno: String(datosCiclo.turno || '').trim(),
    horario: String(datosCiclo.horario || '').trim(),
    fechaInicio: datosCiclo.fechaInicio || null,
    fechaFin: datosCiclo.fechaFin || null,
    capacidad: Number(datosCiclo.capacidad),
    cursosSeleccionados: idCursos,
    precio: Number(datosCiclo.precio),
    diasClase: String(datosCiclo.diasClase || '').trim(),
    prefijoCodigo: String(datosCiclo.prefijoCodigo || '').trim(),
    publicar: Boolean(datosCiclo.publicar)
  };
}

export async function obtenerDashboardAdmin() {
  const response = await fetchWithAuth('/api/admin/dashboard/overview');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return {
    resumen: {
      estudiantes: numeroSeguro(data?.resumen?.estudiantes, 0),
      matriculasActivas: numeroSeguro(data?.resumen?.matriculasActivas, 0),
      ciclosActivos: numeroSeguro(data?.resumen?.ciclosActivos, 0),
      ciclosProximos: numeroSeguro(data?.resumen?.ciclosProximos, 0),
      ciclosCerrados: numeroSeguro(data?.resumen?.ciclosCerrados, 0),
      estudiantesMorosos: numeroSeguro(data?.resumen?.estudiantesMorosos, 0),
      promedioInstitucional: numeroSeguro(data?.resumen?.promedioInstitucional, 0),
      vacantesDisponibles: numeroSeguro(data?.resumen?.vacantesDisponibles, 0),
    },
    pagos: data?.pagos || { total: 0, pagados: 0, pendientes: 0 },
    rendimientoPorCiclo: normalizarListaRespuesta(data, ['rendimientoPorCiclo']),
    ciclos: normalizarListaRespuesta(data, ['ciclos']).map(normalizarCiclo),
    actualizadoEn: data?.actualizadoEn || null,
  };
}

export async function obtenerDetalleCicloAdmin(idCiclo) {
  if (!idCiclo) throw new Error('Debe indicar un ciclo.');

  const response = await fetchWithAuth(
    `/api/admin/ciclos/${encodeURIComponent(idCiclo)}`
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw crearErrorApiCiclo(
      data,
      response.status,
      'No se pudo obtener el detalle del ciclo'
    );
  }

  return data;
}

export async function crearCicloAdmin(datosCiclo) {
  const payload = prepararPayloadCiclo(datosCiclo);

  const response = await fetchWithAuth('/api/admin/ciclos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw crearErrorApiCiclo(
      data,
      response.status,
      'No se pudo crear el ciclo'
    );
  }

  return data;
}

export async function actualizarCicloAdmin(idCiclo, datosCiclo) {
  if (!idCiclo) {
    throw new Error('Debe indicar el ciclo que desea actualizar.');
  }

  const response = await fetchWithAuth(
    `/api/admin/ciclos/${encodeURIComponent(idCiclo)}`,
    {
      method: 'PUT',
      body: JSON.stringify(prepararPayloadCiclo(datosCiclo))
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw crearErrorApiCiclo(
      data,
      response.status,
      'No se pudo actualizar el ciclo'
    );
  }

  return data;
}

// El PUT de un ciclo no modifica EstadoRegistro: la visibilidad se cambia con el
// endpoint existente PATCH /api/admin/ciclos/:id/estado (Activo / Cerrado).
export async function actualizarEstadoCicloAdmin(idCiclo, estado) {
  if (!idCiclo) throw new Error('Debe indicar el ciclo.');

  const response = await fetchWithAuth(
    `/api/admin/ciclos/${encodeURIComponent(idCiclo)}/estado`,
    {
      method: 'PATCH',
      body: JSON.stringify({ estado })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw crearErrorApiCiclo(
      data,
      response.status,
      'No se pudo cambiar la visibilidad del ciclo'
    );
  }

  return data;
}

export async function eliminarCicloAdmin(idCiclo) {
  if (!idCiclo) throw new Error('Debe indicar un ciclo.');

  const response = await fetchWithAuth(
    `/api/admin/ciclos/${encodeURIComponent(idCiclo)}`,
    {
      method: 'DELETE'
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw crearErrorApiCiclo(
      data,
      response.status,
      'No se pudo desactivar el ciclo'
    );
  }

  return data;
}

/**
 * Envía la solicitud de recuperación de contraseña al backend.
 * @param {string} usuarioOCorreo - Nombre de usuario, código o correo del estudiante.
 */
export async function solicitarRecuperacionPassword(usuarioOCorreo) {
  const usuarioLimpio = String(usuarioOCorreo || '').trim();

  if (!usuarioLimpio) {
    throw new Error('Por favor, ingresa tu usuario o correo.');
  }

  const response = await solicitarApi('/api/auth/recuperar-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: usuarioLimpio })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.mensaje || data.message || data.error || 'No se pudo procesar la solicitud de recuperación.'
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}