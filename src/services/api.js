
// âœ… DEBE LLEVAR "export":
export const API_URL = import.meta.env?.VITE_API_URL || "https://acadesys-api.onrender.com";

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

// Persiste el token JWT en su clave dedicada.
export function guardarToken(token) {
  if (token) localStorage.setItem(CLAVE_TOKEN, String(token));
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

// Interceptor centralizado: inyecta el JWT y normaliza la respuesta de error.
// 401 -> cierra sesión; 403 -> mensaje de permisos; 5xx -> mensaje genérico.
export async function fetchWithAuth(endpoint, options = {}) {
  const token = obtenerToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(API_URL + endpoint, {
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
    const error = new Error('No tienes permisos para realizar esta acción.');
    error.status = 403;
    throw error;
  }

  // 5xx: mensaje genérico, sin exponer detalles internos del servidor.
  if (response.status >= 500) {
    const error = new Error('Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.');
    error.status = response.status;
    throw error;
  }

  return response;
}

// ==========================================
// AUTENTICACIÃ“N (LOGIN SEGURO EN EL BODY)
// ==========================================
export async function iniciarSesion(codigoOUsuario, password) {
  const valorLimpio = String(codigoOUsuario).trim();
  const passLimpia = String(password).trim();

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: valorLimpio,
      codigo_usuario: valorLimpio,
      password: passLimpia
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Credenciales inválidas');
  }

  const data = await response.json();
  const tokenRecibido = data.token || data.jwt || data.accessToken;

  if (tokenRecibido) {
    guardarToken(tokenRecibido);
  }

  const usuarioSesion = data.usuario || data.user;
  if (usuarioSesion) {
    // Se guarda en la clave única de sesión (objeto), no en una clave paralela.
    guardarSesion(usuarioSesion);
  }

  return data;
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
  return await response.json();
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
  return await response.json();
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
  return await response.json();
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
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
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
  if (clave !== undefined && String(clave).trim()) payload.Clave = String(clave).trim();

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
  return await response.json();
}

export async function actualizarEstadoPago(idPago, estado) {
  if (!idPago) {
    throw new Error('No se proporcionÃ³ el IdPago.');
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
  return await response.json();
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
  return await response.json();
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
  return await response.json();
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
  return await response.json();
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
    throw new Error('Debe seleccionar un aula vÃ¡lida para consultar la asistencia.');
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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.asistencias)) return data.asistencias;
  return [];
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
    throw new Error('Debe seleccionar un aula vÃ¡lida antes de guardar la asistencia.');
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

  return Array.isArray(data) ? data : (data.data || []);
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

  return data;
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

  return Array.isArray(data) ? data : (data.data || data.matriculas || []);
}

export async function guardarNotasDocente(idCiclo, notas, periodo = 'General') {
  const response = await fetchWithAuth('/api/notas', {
    method: 'POST',
    body: JSON.stringify({
      idCiclo: Number(idCiclo),
      periodo: String(periodo || 'General').trim(),
      notas
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
  }

  return data;
}

export async function actualizarNotaDocente(idEvaluacion, calificacion) {
  const response = await fetchWithAuth(
    `/api/notas/${encodeURIComponent(idEvaluacion)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        Calificacion: Number(calificacion)
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Error HTTP: ${response.status}`);
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
  return await response.json();
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

export async function consultarTutorIA(pregunta, contextoPreu = {}) {
  const payload = typeof contextoPreu === 'object' && contextoPreu !== null
    ? {
        pregunta: (pregunta || '').trim(),
        estudiante: contextoPreu.estudiante || 'Alumno AcadeSys',
        codigoUsuario: contextoPreu.codigoUsuario || '',
        universidadObjetivo: contextoPreu.universidadObjetivo || 'UNMSM',
        carrera: contextoPreu.carrera || 'IngenierÃ­a de Sistemas',
        historialSimulacros: contextoPreu.historialSimulacros || []
      }
    : {
        pregunta: (pregunta || '').trim(),
        estudiante: String(contextoPreu || 'Alumno AcadeSys')
      };

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
    textoFinal += `\n\nðŸŽ¯ Tip AdmisiÃ³n: ${data.consejoAdmision}`;
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
  const response = await fetch(`${API_URL}/api/ciclos/publicos`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const lista = Array.isArray(data) ? data : (data.data || data.ciclos || []);

  return lista.map((c) => ({
    idCiclo: c.IdCiclo ?? c.idCiclo ?? c.id,
    nombre: c.Nombre ?? c.nombre,
    turno: c.Turno ?? c.turno ?? '',
    horario: c.Horario ?? c.horario ?? '',
    diasClase: c.DiasClase ?? c.diasClase ?? '',
    universidadObjetivo: c.UniversidadObjetivo ?? c.universidadObjetivo ?? '',
    totalAlumnos: Number(c.TotalAlumnos ?? c.totalAlumnos ?? c.cantidadAlumnos ?? 0),
    totalCursos: Number(c.TotalCursos ?? c.totalCursos ?? 0),
    capacidad: Number(c.Capacidad ?? c.capacidad ?? 0),
    prefijo: c.PrefijoCodigo ?? c.prefijo ?? null,
    fechaInicio: c.FechaInicio ?? c.fechaInicio ?? null,
    fechaFin: c.FechaFin ?? c.fechaFin ?? null,
    precio: Number(c.Precio ?? c.precio ?? 1)
  }));
}

export async function obtenerCursosCiclo(idCiclo) {
  const response = await fetch(`${API_URL}/api/ciclos/${idCiclo}/cursos`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const lista = Array.isArray(data) ? data : (data.data || data.cursos || []);
  return lista.map((c) => ({
    idCurso: c.IdCurso ?? c.idCurso ?? c.id,
    nombre: c.Nombre ?? c.nombre,
    codigo: c.Codigo ?? c.codigo ?? '',
    descripcion: c.Descripcion ?? c.descripcion ?? '',
    universidadObjetivo: c.UniversidadObjetivo ?? c.universidadObjetivo ?? '',
    docente: c.Docentes ?? c.docente ?? ''
  }));
}

export async function verificarMatriculaExistente(correo, idCiclo) {
  const correoNormalizado = String(correo || '').trim().toLowerCase();
  const cicloNormalizado = Number(idCiclo);

  const response = await fetch(`${API_URL}/api/matriculas/verificar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      correo: correoNormalizado,
      idCiclo: cicloNormalizado
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
      data.error ||
      data.mensaje ||
      'No se pudo verificar el correo del alumno'
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
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

  const response = await fetch(`${API_URL}/api/matriculas/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
      data.error ||
      data.mensaje ||
      'Error al procesar la inscripciÃ³n'
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function obtenerMiIntranetAlumno() {
  const response = await fetchWithAuth('/api/alumno/me');

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
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

  return Array.isArray(data) ? data : (data.data || []);
}

export async function subirMaterialPDF(payload) {
  const response = await fetchWithAuth('/api/materiales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
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

  return Array.isArray(data) ? data : (data.data || data.ciclos || []);
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
  const payload = {
    nombre: String(datosCiclo.nombre || '').trim(),
    universidadObjetivo: String(datosCiclo.universidadObjetivo || '').trim(),
    turno: String(datosCiclo.turno || '').trim(),
    horario: String(datosCiclo.horario || '').trim(),
    fechaInicio: datosCiclo.fechaInicio || null,
    fechaFin: datosCiclo.fechaFin || null,
    capacidad: Number(datosCiclo.capacidad),
    cursosSeleccionados: Array.isArray(datosCiclo.cursosSeleccionados) ? datosCiclo.cursosSeleccionados.map(Number) : [],
    precio: Number(datosCiclo.precio),
    diasClase: String(datosCiclo.diasClase || '').trim(),
    prefijoCodigo: String(datosCiclo.prefijoCodigo || '').trim(),
    publicar: Boolean(datosCiclo.publicar)
  };

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
      body: JSON.stringify(datosCiclo)
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
