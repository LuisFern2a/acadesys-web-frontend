const API_URL = "https://acadesys-api.onrender.com";

// ==========================================
// CONTROL DE TOKEN JWT Y SESIÓN
// ==========================================

export function guardarToken(token) {
  localStorage.setItem('acadesys_token', token);
}

export function obtenerToken() {
  const directToken = localStorage.getItem('acadesys_token');
  if (directToken) return directToken;

  const session = localStorage.getItem('acadesys_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.token || parsed.jwt || parsed.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function cerrarSesion() {
  localStorage.removeItem('acadesys_token');
  localStorage.removeItem('usuario');
  window.location.href = '/';
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = obtenerToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn("Sesión expirada o no autorizada (401). Redirigiendo...");
    cerrarSesion();
    throw new Error("Sesión expirada. Por favor inicie sesión nuevamente.");
  }

  return response;
}

// ==========================================
// MOCKS BASE DE DATOS LOCAL
// ==========================================

let mockPerfiles = [
  { IdPerfil: 1, Nombre: 'Administrador', NombrePerfil: 'Administrador', Descripcion: 'Acceso total a métricas institucionales, asignaciones docentes, seguridad y usuarios.', EstadoRegistro: 1 },
  { IdPerfil: 2, Nombre: 'Docente', NombrePerfil: 'Docente', Descripcion: 'Control de asistencia, cuaderno de calificaciones bimestrales y publicación de circulares.', EstadoRegistro: 1 },
  { IdPerfil: 3, Nombre: 'Padre', NombrePerfil: 'Padre', Descripcion: 'Visualización de boletas de notas de hijos, alertas de asistencia y comunicados directivos.', EstadoRegistro: 1 },
  { IdPerfil: 4, Nombre: 'Alumno', NombrePerfil: 'Alumno', Descripcion: 'Consulta de calificaciones personales, agenda escolar e interacción con el Tutor Pedagógico IA.', EstadoRegistro: 1 }
];

let mockOpcionesMenu = [
  { IdOpcionMenu: 1, Nombre: 'Dashboard', Icono: 'LayoutDashboard', Ruta: '/dashboard', IdPadre: null },
  { IdOpcionMenu: 2, Nombre: 'Asistencia', Icono: 'CalendarCheck', Ruta: '/asistencia', IdPadre: null },
  { IdOpcionMenu: 3, Nombre: 'Registrar Notas', Icono: 'ClipboardCheck', Ruta: '/registro-notas', IdPadre: null },
  { IdOpcionMenu: 4, Nombre: 'Comunicados', Icono: 'Megaphone', Ruta: '/comunicados', IdPadre: null },
  { IdOpcionMenu: 5, Nombre: 'Académico', Icono: 'Layers', Ruta: '/academico', IdPadre: null },
  { IdOpcionMenu: 6, Nombre: 'Calificaciones', Icono: 'Award', Ruta: '/calificaciones', IdPadre: null },
  { IdOpcionMenu: 7, Nombre: 'Tutor IA', Icono: 'BrainCircuit', Ruta: '/tutor-ia', IdPadre: null },
  { IdOpcionMenu: 8, Nombre: 'Perfiles', Icono: 'ShieldCheck', Ruta: '/perfiles', IdPadre: null },
  { IdOpcionMenu: 9, Nombre: 'Usuarios', Icono: 'Users', Ruta: '/usuarios', IdPadre: null }
];

let mockUsuarios = [
  { IdUsuario: 1, dni: '72345678', NombreCompleto: 'Yan Leví Picon', Correo: 'yan@acadesys.edu', Perfil: 'Administrador', EstadoRegistro: 1 },
  { IdUsuario: 2, dni: '45892014', NombreCompleto: 'Carlos Mendoza', Correo: 'cmendoza@acadesys.edu', Perfil: 'Docente', EstadoRegistro: 1 },
  { IdUsuario: 3, dni: '75849201', NombreCompleto: 'Luis Fernando Tóccas', Correo: 'ltoccas@acadesys.edu', Perfil: 'Alumno', EstadoRegistro: 1 }
];

let mockAulas = [
  { idAula: 1, nombre: 'Aula 101 - Ciencias', nivel: 'Preuniversitario', capacidad: 40, estado: 'Activo' },
  { idAula: 2, nombre: 'Aula 102 - Letras', nivel: 'Preuniversitario', capacidad: 35, estado: 'Activo' },
  { idAula: 3, nombre: '3er Grado A', nivel: 'Primaria', capacidad: 30, estado: 'Activo' },
  { idAula: 4, nombre: '5to Grado B - Selección', nivel: 'Secundaria', capacidad: 38, estado: 'Activo' }
];

let mockCursos = [
  { idCurso: 1, nombre: 'Álgebra Superior', codigo: 'MAT-ALG', descripcion: 'Polinomios, matrices y funciones' },
  { idCurso: 2, nombre: 'Geometría Plana', codigo: 'MAT-GEO', descripcion: 'Trigonometría y geometría del espacio' },
  { idCurso: 3, nombre: 'Física Clásica', codigo: 'CIEN-FIS', descripcion: 'Mecánica, dinámica y cinemática' },
  { idCurso: 4, nombre: 'Razonamiento Matemático', codigo: 'MAT-RM', descripcion: 'Lógica proposicional e inductiva' },
  { idCurso: 5, nombre: 'Química Orgánica', codigo: 'CIEN-QUI', descripcion: 'Termodinámica y enlaces moleculares' }
];

let mockAsignaciones = [
  { idAsignacion: 1, docente: 'Carlos Mendoza', curso: 'Álgebra Superior', aula: 'Aula 101 - Ciencias', horas: 6 },
  { idAsignacion: 2, docente: 'María Flores', curso: 'Física Clásica', aula: 'Aula 101 - Ciencias', horas: 4 },
  { idAsignacion: 3, docente: 'Dante Quispe', curso: 'Razonamiento Matemático', aula: 'Aula 102 - Letras', horas: 5 }
];

let mockAsistencias = {
  '1-2026-09-14': [
    { idAlumno: 101, nombre: 'Luis Fernando Tóccas', estado: 'presente', horaLlegada: '07:50 AM' },
    { idAlumno: 102, nombre: 'Carlos Andrés Benítez', estado: 'presente', horaLlegada: '07:52 AM' },
    { idAlumno: 103, nombre: 'Valeria Quispe Ruiz', estado: 'presente', horaLlegada: '07:48 AM' },
    { idAlumno: 104, nombre: 'Diego Martín Salazar', estado: 'presente', horaLlegada: '07:55 AM' },
    { idAlumno: 105, nombre: 'Camila Sofía Paredes', estado: 'justificado', horaLlegada: '--' }
  ]
};

let mockNotasDocente = {
  '1-1-bimestre-2': [
    { idAlumno: 101, codigo: 'ACAD-2026-755', nombre: 'Luis Fernando Tóccas', parcial: 16, tareas: 18, final: 15 },
    { idAlumno: 102, codigo: 'ACAD-2026-801', nombre: 'Carlos Andrés Benítez', parcial: 14, tareas: 15, final: 13 },
    { idAlumno: 103, codigo: 'ACAD-2026-812', nombre: 'Valeria Quispe Ruiz', parcial: 18, tareas: 19, final: 17 },
    { idAlumno: 104, codigo: 'ACAD-2026-820', nombre: 'Diego Martín Salazar', parcial: 9, tareas: 11, final: 10 },
    { idAlumno: 105, codigo: 'ACAD-2026-833', nombre: 'Camila Sofía Paredes', parcial: 13, tareas: 14, final: 14 }
  ]
};

let mockComunicados = [
  {
    id: 1,
    titulo: 'Simulacro Tipo Examen de Admisión UNI - Fase II',
    categoria: 'Académico',
    prioridad: 'alta',
    dirigidoA: '5to de Secundaria - Aula 101 UNI',
    fecha: '14/09/2026',
    hora: '08:30 AM',
    autor: 'Dirección Académica',
    contenido: 'Se convoca a los estudiantes de 5to año al simulacro general presencial con control estricto de tiempo. El ingreso será a las 07:30 AM con carné de estudiante.',
    leido: false,
    confirmado: false
  },
  {
    id: 2,
    titulo: 'Primera Reunión General de Padres y Entrega de Boletas Bimestrales',
    categoria: 'Reunión',
    prioridad: 'media',
    dirigidoA: 'Todos los Niveles',
    fecha: '18/09/2026',
    hora: '06:30 PM',
    autor: 'Comité Directivo',
    contenido: 'Estimados apoderados, se llevará a cabo la entrega oficial de boletas y balance pedagógico del II Bimestre en el auditorio principal.',
    leido: true,
    confirmado: true
  },
  {
    id: 3,
    titulo: 'Alerta Preventiva de Salud y Protocolo Estacional',
    categoria: 'Salud',
    prioridad: 'alta',
    dirigidoA: 'Toda la Comunidad',
    fecha: '10/09/2026',
    hora: '10:00 AM',
    autor: 'Tópico y Bienestar Estudiantil',
    contenido: 'Recordamos a las familias remitir al tópico el informe médico correspondiente ante cuadros gripales severos para justificar inasistencias en la plataforma.',
    leido: true,
    confirmado: false
  },
  {
    id: 4,
    titulo: 'Feriado Institucional y Suspensión de Labores Académicas',
    categoria: 'Feriado',
    prioridad: 'baja',
    dirigidoA: 'Todos los Niveles',
    fecha: '08/09/2026',
    hora: '07:00 AM',
    autor: 'Administración Central',
    contenido: 'Las actividades presenciales y virtuales se reanudarán al día hábil siguiente en su horario habitual.',
    leido: true,
    confirmado: true
  }
];

// ==========================================
// MÓDULO DE PERFILES (RBAC)
// ==========================================

export async function obtenerPerfiles() {
  try {
    const response = await fetchWithAuth(`/api/perfiles`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener perfiles, usando mock:", error);
    return [...mockPerfiles];
  }
}

export async function crearPerfil(nuevoPerfil) {
  try {
    const response = await fetchWithAuth(`/api/perfiles`, {
      method: "POST",
      body: JSON.stringify(nuevoPerfil),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al crear perfil en API, registrando en mock:", error);
    const id = Date.now();
    const creado = {
      IdPerfil: id,
      Nombre: nuevoPerfil.nombre || nuevoPerfil.Nombre,
      NombrePerfil: nuevoPerfil.nombre || nuevoPerfil.Nombre,
      Descripcion: nuevoPerfil.descripcion || nuevoPerfil.Descripcion,
      EstadoRegistro: 1
    };
    mockPerfiles = [...mockPerfiles, creado];
    return creado;
  }
}

export async function actualizarPerfil(idPerfil, perfilActualizado) {
  try {
    const response = await fetchWithAuth(`/api/perfiles/${idPerfil}`, {
      method: "PUT",
      body: JSON.stringify(perfilActualizado),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al actualizar perfil en API, aplicando en mock:", error);
    mockPerfiles = mockPerfiles.map(p => 
      (p.IdPerfil === idPerfil || p.id === idPerfil) 
        ? { ...p, ...perfilActualizado, IdPerfil: idPerfil } 
        : p
    );
    return { ok: true, idPerfil };
  }
}

export async function eliminarPerfil(idPerfil) {
  try {
    const response = await fetchWithAuth(`/api/perfiles/${idPerfil}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al eliminar perfil en API, removiendo de mock:", error);
    mockPerfiles = mockPerfiles.filter(p => p.IdPerfil !== idPerfil && p.id !== idPerfil);
    return { ok: true };
  }
}

// ==========================================
// MÓDULO DE USUARIOS
// ==========================================

export async function obtenerUsuarios() {
  try {
    const response = await fetchWithAuth(`/api/usuarios`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener usuarios, usando mock:", error);
    return [...mockUsuarios];
  }
}

export async function crearUsuario(datosUsuario) {
  const idPerfilPrincipal = Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 0
    ? Number(datosUsuario.perfiles[0])
    : Number(datosUsuario.idPerfil || datosUsuario.IdPerfil || 1);

  const payload = {
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

  try {
    const response = await fetchWithAuth(`/api/usuarios`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Fallo al crear usuario, simulando mock:", error);
    const nuevo = {
      IdUsuario: Date.now(),
      Nombres: payload.Nombres,
      ApellidoPaterno: payload.ApellidoPaterno,
      CorreoElectronico: payload.CorreoElectronico,
      DNI: payload.DNI,
      EstadoRegistro: 1
    };
    mockUsuarios = [nuevo, ...mockUsuarios];
    return nuevo;
  }
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

  try {
    const response = await fetchWithAuth(`/api/usuarios/${idUsuario}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json().catch(() => ({ mensaje: "Actualizado con éxito" }));
  } catch (error) {
    console.warn("Fallo al actualizar usuario, actualizando mock:", error);
    mockUsuarios = mockUsuarios.map(u => u.IdUsuario === idUsuario ? { ...u, ...payload } : u);
    return { mensaje: "Actualizado localmente" };
  }
}

export async function eliminarUsuario(idUsuario) {
  try {
    const response = await fetchWithAuth(`/api/usuarios/${idUsuario}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json().catch(() => ({ mensaje: "Eliminado con éxito" }));
  } catch (error) {
    console.warn("Fallo al eliminar usuario, borrando de mock:", error);
    mockUsuarios = mockUsuarios.filter(u => u.IdUsuario !== idUsuario);
    return { mensaje: "Eliminado localmente" };
  }
}

// ==========================================
// MÓDULO DE MENÚS Y PERMISOS
// ==========================================

export async function obtenerOpcionesMenu() {
  try {
    const response = await fetchWithAuth(`/api/menus`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener menús, usando mock:", error);
    return [...mockOpcionesMenu];
  }
}

export async function crearOpcionMenu(datosMenu) {
  try {
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
  } catch (error) {
    console.warn("Fallo al crear menú, guardando en mock:", error);
    const nuevo = {
      IdOpcionMenu: Date.now(),
      Nombre: datosMenu.nombre,
      Ruta: datosMenu.ruta,
      Icono: 'Menu',
      IdPadre: null
    };
    mockOpcionesMenu = [...mockOpcionesMenu, nuevo];
    return nuevo;
  }
}

export async function asignarMenuAPerfil(idOpcionMenu, idPerfil, orden = 1) {
  try {
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
  } catch (error) {
    console.warn("Asignación de menú guardada localmente:", error);
    return { ok: true };
  }
}

// ==========================================
// MÓDULO ACADÉMICO (AULAS, CURSOS, CARGA)
// ==========================================

export async function obtenerAulas() {
  try {
    const response = await fetchWithAuth(`/api/aulas`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockAulas];
  }
}

export async function crearAula(nuevaAula) {
  try {
    const response = await fetchWithAuth(`/api/aulas`, {
      method: "POST",
      body: JSON.stringify(nuevaAula),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    const creada = { idAula: Date.now(), ...nuevaAula, estado: 'Activo' };
    mockAulas = [creada, ...mockAulas];
    return creada;
  }
}

export async function actualizarAula(idAula, aulaActualizada) {
  try {
    const response = await fetchWithAuth(`/api/aulas/${idAula}`, {
      method: 'PUT',
      body: JSON.stringify(aulaActualizada),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    mockAulas = mockAulas.map(a => a.idAula === idAula ? { ...a, ...aulaActualizada } : a);
    return { ...aulaActualizada, idAula };
  }
}

export async function eliminarAula(idAula) {
  try {
    const response = await fetchWithAuth(`/api/aulas/${idAula}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return true;
  } catch {
    mockAulas = mockAulas.filter(a => a.idAula !== idAula);
    return true;
  }
}

export async function obtenerCursos() {
  try {
    const response = await fetchWithAuth(`/api/cursos`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockCursos];
  }
}

export async function crearCurso(nuevoCurso) {
  try {
    const response = await fetchWithAuth(`/api/cursos`, {
      method: "POST",
      body: JSON.stringify(nuevoCurso),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    const creado = { idCurso: Date.now(), ...nuevoCurso };
    mockCursos = [creado, ...mockCursos];
    return creado;
  }
}

export async function actualizarCurso(idCurso, cursoActualizado) {
  try {
    const response = await fetchWithAuth(`/api/cursos/${idCurso}`, {
      method: 'PUT',
      body: JSON.stringify(cursoActualizado),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    mockCursos = mockCursos.map(c => c.idCurso === idCurso ? { ...c, ...cursoActualizado } : c);
    return { ...cursoActualizado, idCurso };
  }
}

export async function eliminarCurso(idCurso) {
  try {
    const response = await fetchWithAuth(`/api/cursos/${idCurso}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return true;
  } catch {
    mockCursos = mockCursos.filter(c => c.idCurso !== idCurso);
    return true;
  }
}

export async function obtenerAsignacionesDocente() {
  try {
    const response = await fetchWithAuth(`/api/asignaciones`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockAsignaciones];
  }
}

export async function crearAsignacionDocente(nuevaAsig) {
  try {
    const response = await fetchWithAuth(`/api/asignaciones`, {
      method: "POST",
      body: JSON.stringify(nuevaAsig),
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    const creada = { idAsignacion: Date.now(), ...nuevaAsig };
    mockAsignaciones = [creada, ...mockAsignaciones];
    return creada;
  }
}

export async function eliminarAsignacionDocente(idAsignacion) {
  try {
    const response = await fetchWithAuth(`/api/asignaciones/${idAsignacion}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return true;
  } catch {
    mockAsignaciones = mockAsignaciones.filter(a => a.idAsignacion !== idAsignacion);
    return true;
  }
}

// ==========================================
// MÓDULO DE ASISTENCIA
// ==========================================

export async function obtenerAsistenciaPorAulaYFecha(idAula, fecha) {
  const claveStorage = `acadesys_asist_${idAula}_${fecha}`;
  const guardado = localStorage.getItem(claveStorage);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch (e) {
      console.warn("Error parseando asistencia local:", e);
    }
  }

  const clave = `${idAula}-${fecha}`;
  if (mockAsistencias[clave]) {
    return [...mockAsistencias[clave]];
  }

  const listaDefault = [
    { idAlumno: 101, nombre: 'Luis Fernando Tóccas', estado: 'presente', horaLlegada: '07:50 AM' },
    { idAlumno: 102, nombre: 'Carlos Andrés Benítez', estado: 'presente', horaLlegada: '07:52 AM' },
    { idAlumno: 103, nombre: 'Valeria Quispe Ruiz', estado: 'presente', horaLlegada: '07:48 AM' },
    { idAlumno: 104, nombre: 'Diego Martín Salazar', estado: 'presente', horaLlegada: '07:55 AM' },
    { idAlumno: 105, nombre: 'Camila Sofía Paredes', estado: 'justificado', horaLlegada: '--' }
  ];
  localStorage.setItem(claveStorage, JSON.stringify(listaDefault));
  return [...listaDefault];
}

export async function guardarAsistencia(idAula, fecha, listaAlumnos) {
  const claveStorage = `acadesys_asist_${idAula}_${fecha}`;
  localStorage.setItem(claveStorage, JSON.stringify(listaAlumnos));
  mockAsistencias[`${idAula}-${fecha}`] = [...listaAlumnos];
  return { ok: true, mensaje: 'Asistencia registrada con éxito' };
}

// ==========================================
// MÓDULO DE CALIFICACIONES
// ==========================================

export async function obtenerNotasPorAulaYCurso(idAula, idCurso, periodo = 'bimestre-2') {
  const claveStorage = `acadesys_notas_${idAula}_${idCurso}_${periodo}`;
  const guardado = localStorage.getItem(claveStorage);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch (e) {
      console.warn("Error parseando notas locales:", e);
    }
  }

  const clave = `${idAula}-${idCurso}-${periodo}`;
  if (mockNotasDocente[clave]) {
    return JSON.parse(JSON.stringify(mockNotasDocente[clave]));
  }

  const nominaBase = [
    { idAlumno: 101, codigo: 'ACAD-2026-755', nombre: 'Luis Fernando Tóccas', parcial: 16, tareas: 18, final: 15 },
    { idAlumno: 102, codigo: 'ACAD-2026-801', nombre: 'Carlos Andrés Benítez', parcial: 14, tareas: 15, final: 13 },
    { idAlumno: 103, codigo: 'ACAD-2026-812', nombre: 'Valeria Quispe Ruiz', parcial: 18, tareas: 19, final: 17 },
    { idAlumno: 104, codigo: 'ACAD-2026-820', nombre: 'Diego Martín Salazar', parcial: 9, tareas: 11, final: 10 },
    { idAlumno: 105, codigo: 'ACAD-2026-833', nombre: 'Camila Sofía Paredes', parcial: 13, tareas: 14, final: 14 }
  ];
  localStorage.setItem(claveStorage, JSON.stringify(nominaBase));
  return JSON.parse(JSON.stringify(nominaBase));
}

export async function guardarNotasDocente(idAula, idCurso, periodo, listaNotas) {
  const claveStorage = `acadesys_notas_${idAula}_${idCurso}_${periodo}`;
  localStorage.setItem(claveStorage, JSON.stringify(listaNotas));
  mockNotasDocente[`${idAula}-${idCurso}-${periodo}`] = JSON.parse(JSON.stringify(listaNotas));
  return { ok: true, mensaje: 'Calificaciones registradas correctamente' };
}

// ==========================================
// MÓDULO DE COMUNICADOS
// ==========================================

export async function obtenerComunicados() {
  const guardado = localStorage.getItem('acadesys_comunicados');
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch (e) {
      console.warn("Error parseando comunicados locales:", e);
    }
  }
  localStorage.setItem('acadesys_comunicados', JSON.stringify(mockComunicados));
  return JSON.parse(JSON.stringify(mockComunicados));
}

export async function crearComunicado(nuevo) {
  const actuales = await obtenerComunicados();
  const creado = {
    id: Date.now(),
    fecha: new Date().toLocaleDateString('es-PE'),
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    leido: false,
    confirmado: false,
    ...nuevo
  };
  const actualizados = [creado, ...actuales];
  localStorage.setItem('acadesys_comunicados', JSON.stringify(actualizados));
  mockComunicados = actualizados;
  return creado;
}

export async function confirmarLecturaComunicado(id) {
  const actuales = await obtenerComunicados();
  const actualizados = actuales.map(c => 
    c.id === id ? { ...c, leido: true, confirmado: true } : c
  );
  localStorage.setItem('acadesys_comunicados', JSON.stringify(actualizados));
  mockComunicados = actualizados;
  return { ok: true };
}

// ==========================================
// HIJOS Y EXPEDIENTES (MOCK OFICIAL)
// ==========================================

const MOCK_HIJOS = [
  {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
    gradoCorto: '5to Sec',
    codigo: 'ACAD-2026-755',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 3,
    totalAlumnos: 36,
    promedioGeneral: 15.8,
    cursosCriticos: 2,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 16, tareas: 18, final: 15, promedio: 16.2, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 17, tareas: 19, final: 18, promedio: 18.0, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 13, tareas: 15, final: 14, promedio: 14.0, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 10, tareas: 12, final: 11, promedio: 11.0, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 12, tareas: 13, final: 12, promedio: 12.3, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  },
  {
    id: 2,
    nombre: 'Andrea Sofía Tóccas',
    gradoCorto: '2do Sec',
    codigo: 'ACAD-2026-912',
    aula: '2do de Secundaria - Aula 204 B',
    puestoRanking: 1,
    totalAlumnos: 32,
    promedioGeneral: 18.2,
    cursosCriticos: 0,
    cursos: [
      { id: 10, nombre: 'Aritmética Básica', docente: 'Prof. Pedro Ramos', parcial: 18, tareas: 19, final: 19, promedio: 18.7, materialPdf: 'Guia_Fracciones_Decimales.pdf', pesoMb: '1.1 MB' },
      { id: 11, nombre: 'Comunicación Integral', docente: 'Prof. Carmen Vega', parcial: 17, tareas: 18, final: 18, promedio: 17.7, materialPdf: 'Comprension_Lectora_Bim2.pdf', pesoMb: '2.0 MB' },
      { id: 12, nombre: 'Biología y Ecosistemas', docente: 'Prof. Laura Méndez', parcial: 18, tareas: 18, final: 18, promedio: 18.0, materialPdf: 'Guia_Laboratorio_Celular.pdf', pesoMb: '1.5 MB' },
      { id: 13, nombre: 'Historia del Perú', docente: 'Prof. Manuel Salazar', parcial: 18, tareas: 19, final: 18, promedio: 18.4, materialPdf: 'Resumen_Tahuantinsuyo.pdf', pesoMb: '3.2 MB' }
    ]
  }
];

export async function obtenerHijosMock() {
  return MOCK_HIJOS;
}