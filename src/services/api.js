// ✅ DEBE LLEVAR "export":
export const API_URL = import.meta.env?.VITE_API_URL || "https://acadesys-api.onrender.com";

// ==========================================
// CONTROL DE TOKEN JWT Y SESIÓN
// ==========================================

export function guardarToken(token) {
  localStorage.setItem('acadesys_session', token);
  localStorage.setItem('acadesys_token', token);
}

export function obtenerToken() {
  const sessionToken = localStorage.getItem('acadesys_session');
  if (sessionToken) {
    try {
      const parsed = JSON.parse(sessionToken);
      return parsed.token || parsed.jwt || parsed.accessToken || sessionToken;
    } catch {
      return sessionToken;
    }
  }
  return localStorage.getItem('acadesys_token') || null;
}

export function cerrarSesion() {
  localStorage.removeItem('acadesys_session');
  localStorage.removeItem('acadesys_token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('acadesys_user');
  window.location.href = '/';
}

// Interceptor centralizado para inyectar JWT en cabeceras y capturar 401/403
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

  return response;
}

// ==========================================
// AUTENTICACIÓN (LOGIN SEGURO EN EL BODY)
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

  if (data.usuario || data.user) {
    localStorage.setItem('usuario', JSON.stringify(data.usuario || data.user));
  }

  return data;
}

// ==========================================
// MÓDULO DE PERFILES (RBAC)
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
  const response = await fetchWithAuth(`/api/perfiles`, {
    method: "POST",
    body: JSON.stringify(nuevoPerfil),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function actualizarPerfil(idPerfil, perfilActualizado) {
  const response = await fetchWithAuth(`/api/perfiles/${idPerfil}`, {
    method: "PUT",
    body: JSON.stringify(perfilActualizado),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function eliminarPerfil(idPerfil) {
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
// MÓDULO DE USUARIOS (ADMIN, DOCENTES, TUTORES)
// ==========================================

export async function obtenerUsuarios() {
  const response = await fetchWithAuth(`/api/usuarios`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function crearUsuario(datosUsuario) {
  const idPerfilPrincipal = Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 0
    ? Number(datosUsuario.perfiles[0])
    : Number(datosUsuario.idPerfil || datosUsuario.IdPerfil || 1);

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
    IdAcademia: datosUsuario.idAcademia || 1
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
  const payload = {
    DNI: String(datosUsuario.dni || '').trim().slice(0, 8),
    Nombres: datosUsuario.nombre || '',
    ApellidoPaterno: datosUsuario.apellido || '',
    ApellidoMaterno: datosUsuario.apellidoMaterno || '',
    Celular: datosUsuario.celular || '',
    CorreoElectronico: datosUsuario.correo || '',
  };

  const response = await fetchWithAuth(`/api/usuarios/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json().catch(() => ({ mensaje: "Actualizado con éxito" }));
}

export async function eliminarUsuario(idUsuario) {
  const response = await fetchWithAuth(`/api/usuarios/${idUsuario}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json().catch(() => ({ mensaje: "Eliminado con éxito" }));
}

// ==========================================
// HU-01: MATRÍCULA ÁGIL Y GENERACIÓN DE CÓDIGOS
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
// HU-04: MÓDULO DE FINANZAS, PAGOS Y MOROSIDAD
// ==========================================

export async function obtenerPagosPorCiclo(idCiclo = 1) {
  const response = await fetchWithAuth(`/api/pagos/ciclo/${idCiclo}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP: ${response.status}`);
  }
  return await response.json();
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
// HU-03: MÓDULO DE MENÚS Y PERMISOS
// ==========================================

export async function obtenerOpcionesMenu() {
  const response = await fetchWithAuth(`/api/menus`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
}

export async function crearOpcionMenu(datosMenu) {
  const payload = {
    Nombre: datosMenu.nombre,
    UrlMenu: datosMenu.ruta,
    Descripcion: datosMenu.descripcion || datosMenu.icono || 'Opción de Menú',
    IdPadre: datosMenu.idPadre ? Number(datosMenu.idPadre) : null,
    EstadoRegistro: 1
  };

  const response = await fetchWithAuth(`/api/menus`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json();
}

export async function asignarMenuAPerfil(idOpcionMenu, idPerfil, orden = 1) {
  const payload = {
    IdOpcionMenu: Number(idOpcionMenu),
    IdPerfil: Number(idPerfil),
    Orden: Number(orden) || 1,
    EstadoRegistro: 1
  };

  const response = await fetchWithAuth(`/api/menus/asignar`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }

  return await response.json();
}

// ==========================================
// MÓDULO ACADÉMICO (AULAS, CURSOS, CARGA)
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
// MÓDULO DE ASISTENCIA
// ==========================================

export async function obtenerAsistenciaPorAulaYFecha(idAula, fecha) {
  try {
    const response = await fetchWithAuth(`/asistencias?idAula=${idAula}&fecha=${fecha}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Fallo al obtener asistencia de la API:', error);
    return [];
  }
}

export async function guardarAsistencia(idAula, fecha, listaAlumnos) {
  const response = await fetchWithAuth(`/asistencias`, {
    method: "POST",
    body: JSON.stringify({ idAula, fecha, listaAlumnos })
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
  }
  return await response.json();
}

// ==========================================
// MÓDULO DE CALIFICACIONES Y SIMULACROS (HU-07 / P1-09)
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

export async function guardarNotasDocente(idCiclo, notas) {
  const response = await fetchWithAuth('/api/notas', {
    method: 'POST',
    body: JSON.stringify({
      idCiclo: Number(idCiclo),
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
// MÓDULO DE COMUNICADOS
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
// HU-06: TUTOR PEDAGÓGICO IA (GEMINI PREU)
// ==========================================

export async function consultarTutorIA(pregunta, contextoPreu = {}) {
  const payload = typeof contextoPreu === 'object' && contextoPreu !== null
    ? {
        pregunta: (pregunta || '').trim(),
        estudiante: contextoPreu.estudiante || 'Alumno AcadeSys',
        codigoUsuario: contextoPreu.codigoUsuario || '',
        universidadObjetivo: contextoPreu.universidadObjetivo || 'UNMSM',
        carrera: contextoPreu.carrera || 'Ingeniería de Sistemas',
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
  let textoFinal = data.respuesta || data.mensaje || data.result || '';

  if (typeof textoFinal === 'object') {
    textoFinal = textoFinal.analisis || JSON.stringify(textoFinal);
  }

  if (data.consejoAdmision) {
    textoFinal += `\n\n🎯 Tip Admisión: ${data.consejoAdmision}`;
  }

  return {
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
    universidadObjetivo: c.UniversidadObjetivo ?? c.universidadObjetivo ?? ''
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
      'Error al procesar la inscripción'
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
// P1-04: ADMINISTRACIÓN Y APERTURA DE CICLOS
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
