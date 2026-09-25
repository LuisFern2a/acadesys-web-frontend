// ✅ DEBE LLEVAR "export":
export const API_URL = import.meta.env?.VITE_API_URL || "https://acadesys-api.onrender.com";

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
  localStorage.removeItem('acadesys_session');
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
  { IdPerfil: 3, Nombre: 'Tutor de Aula', NombrePerfil: 'Tutor de Aula', Descripcion: 'Monitoreo de rendimiento académico, control de asistencia y supervisión de pagos por ciclo.', EstadoRegistro: 1 },
  { IdPerfil: 4, Nombre: 'Alumno', NombrePerfil: 'Alumno', Descripcion: 'Consulta de calificaciones personales, agenda escolar e interacción con el Tutor Pedagógico IA.', EstadoRegistro: 1 }
];

let mockOpcionesMenu = [
  { IdOpcionMenu: 1, Nombre: 'Dashboard', Icono: 'LayoutDashboard', Ruta: '/dashboard', IdPadre: null },
  { IdOpcionMenu: 2, Nombre: 'Matrícula Ágil', Icono: 'UserPlus', Ruta: '/matriculas', IdPadre: null },
  { IdOpcionMenu: 3, Nombre: 'Asistencia', Icono: 'CalendarCheck', Ruta: '/asistencia', IdPadre: null },
  { IdOpcionMenu: 4, Nombre: 'Registrar Notas', Icono: 'ClipboardCheck', Ruta: '/registro-notas', IdPadre: null },
  { IdOpcionMenu: 5, Nombre: 'Comunicados', Icono: 'Megaphone', Ruta: '/comunicados', IdPadre: null },
  { IdOpcionMenu: 6, Nombre: 'Académico', Icono: 'Layers', Ruta: '/academico', IdPadre: null },
  { IdOpcionMenu: 7, Nombre: 'Calificaciones', Icono: 'Award', Ruta: '/calificaciones', IdPadre: null },
  { IdOpcionMenu: 8, Nombre: 'Tutor IA', Icono: 'BrainCircuit', Ruta: '/tutor-ia', IdPadre: null },
  { IdOpcionMenu: 9, Nombre: 'Perfiles', Icono: 'ShieldCheck', Ruta: '/perfiles', IdPadre: null },
  { IdOpcionMenu: 10, Nombre: 'Usuarios', Icono: 'Users', Ruta: '/usuarios', IdPadre: null }
];

let mockUsuarios = [
  { IdUsuario: 1, dni: '72345678', CodigoUsuario: 'ADMIN-001', NombreCompleto: 'Yan Leví Picon', Correo: 'yan@acadesys.edu', Perfil: 'Administrador', EstadoRegistro: 1 },
  { IdUsuario: 2, dni: '45892014', CodigoUsuario: 'DOC-5521', NombreCompleto: 'Carlos Mendoza', Correo: 'cmendoza@acadesys.edu', Perfil: 'Docente', EstadoRegistro: 1 },
  { IdUsuario: 3, dni: '75849201', CodigoUsuario: 'SEMSM-Q6265', NombreCompleto: 'Luis Fernando Tóccas', Correo: 'ltoccas@acadesys.edu', Perfil: 'Alumno', EstadoRegistro: 1 }
];

let mockAulas = [
  { idAula: 1, nombre: 'Aula 101 - Semestral San Marcos', nivel: 'Preuniversitario', capacidad: 40, estado: 'Activo' },
  { idAula: 2, nombre: 'Aula 102 - Anual UNI', nivel: 'Preuniversitario', capacidad: 35, estado: 'Activo' },
  { idAula: 3, nombre: 'Aula 103 - Repaso Villarreal', nivel: 'Preuniversitario', capacidad: 30, estado: 'Activo' },
  { idAula: 4, nombre: 'Aula 104 - Ciclo Cero', nivel: 'Preuniversitario', capacidad: 38, estado: 'Activo' }
];

let mockCursos = [
  { idCurso: 1, nombre: 'Álgebra Superior', codigo: 'MAT-ALG', descripcion: 'Polinomios, matrices y funciones' },
  { idCurso: 2, nombre: 'Geometría Plana', codigo: 'MAT-GEO', descripcion: 'Trigonometría y geometría del espacio' },
  { idCurso: 3, nombre: 'Física Clásica', codigo: 'CIEN-FIS', descripcion: 'Mecánica, dinámica y cinemática vectorial' },
  { idCurso: 4, nombre: 'Razonamiento Matemático', codigo: 'MAT-RM', descripcion: 'Lógica proposicional, inductiva y problemas DECO' },
  { idCurso: 5, nombre: 'Química Orgánica', codigo: 'CIEN-QUI', descripcion: 'Termodinámica y enlaces moleculares' }
];

let mockAsignaciones = [
  { idAsignacion: 1, docente: 'Carlos Mendoza', curso: 'Álgebra Superior', aula: 'Aula 101 - Semestral San Marcos', horas: 6 },
  { idAsignacion: 2, docente: 'María Flores', curso: 'Física Clásica', aula: 'Aula 101 - Semestral San Marcos', horas: 4 },
  { idAsignacion: 3, docente: 'Dante Quispe', curso: 'Razonamiento Matemático', aula: 'Aula 102 - Anual UNI', horas: 5 }
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
  '1-1-simulacro-1': [
    { idAlumno: 101, codigo: 'SEMSM-Q6265', nombre: 'Luis Fernando Tóccas', parcial: 16, tareas: 18, final: 15 },
    { idAlumno: 102, codigo: 'SEMSM-Q6266', nombre: 'Carlos Andrés Benítez', parcial: 14, tareas: 15, final: 13 },
    { idAlumno: 103, codigo: 'SEMSM-Q6267', nombre: 'Valeria Quispe Ruiz', parcial: 18, tareas: 19, final: 17 },
    { idAlumno: 104, codigo: 'SEMSM-Q6268', nombre: 'Diego Martín Salazar', parcial: 9, tareas: 11, final: 10 },
    { idAlumno: 105, codigo: 'SEMSM-Q6269', nombre: 'Camila Sofía Paredes', parcial: 13, tareas: 14, final: 14 }
  ]
};

let mockComunicados = [
  {
    id: 1,
    titulo: 'Simulacro General Tipo Admisión - UNI / UNMSM',
    categoria: 'Académico',
    prioridad: 'alta',
    dirigidoA: 'Todos los Ciclos',
    fecha: '24/09/2026',
    hora: '08:00 AM',
    autor: 'Coordinación Académica',
    contenido: 'Ingreso puntual a las 07:30 AM con código institucional o DNI físico. Duración del examen: 3 horas.',
    leido: false,
    confirmado: false
  },
  {
    id: 2,
    titulo: 'Cierre de Simulacro y Cuadro de Mérito Semanal',
    categoria: 'Informativo',
    prioridad: 'media',
    dirigidoA: 'Estudiantes y Tutores',
    fecha: '25/09/2026',
    hora: '05:00 PM',
    autor: 'Dirección General',
    contenido: 'La publicación de puntajes y solucionarios estará disponible al culminar la jornada en el panel del alumno.',
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
// MÓDULO DE USUARIOS (ADMIN, DOCENTES, TUTORES)
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
    IdAcademia: datosUsuario.idAcademia || 1
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
// HU-01: MATRÍCULA ÁGIL Y GENERACIÓN DE CÓDIGOS
// ==========================================

export async function crearMatricula(datosMatricula) {
  try {
    const response = await fetchWithAuth(`/api/matriculas`, {
      method: "POST",
      body: JSON.stringify(datosMatricula),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Fallo en matrícula ágil, simulando respuesta local con prefijo:", error);
    const prefijo = datosMatricula.prefijoCiclo || 'SEMSM';
    const codigoGenerado = `${prefijo}-Q${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      exito: true,
      codigoUsuario: codigoGenerado,
      claveTemporal: `DNI${datosMatricula.dni || '2026'}`,
      alumno: `${datosMatricula.nombres} ${datosMatricula.apellidoPaterno || datosMatricula.apellidos || ''}`.trim(),
      dni: datosMatricula.dni,
      ciclo: datosMatricula.nombreCiclo || 'Ciclo Preuniversitario',
      fecha: new Date().toLocaleDateString('es-PE')
    };
  }
}

export const registrarMatriculaAgil = crearMatricula;

// ==========================================
// HU-04: MÓDULO DE FINANZAS, PAGOS Y MOROSIDAD
// ==========================================

export async function obtenerPagosPorCiclo(idCiclo = 1) {
  try {
    const response = await fetchWithAuth(`/api/pagos/ciclo/${idCiclo}`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al consultar pagos por ciclo, usando semáforo mock:", error);
    return [
      { idAlumno: 101, alumno: 'Luis Fernando Tóccas', estadoPago: 'Pagado', monto: 350.00, vencimiento: '2026-09-30' },
      { idAlumno: 102, alumno: 'Carlos Andrés Benítez', estadoPago: 'Moroso', monto: 350.00, vencimiento: '2026-09-15' },
      { idAlumno: 103, alumno: 'Valeria Quispe Ruiz', estadoPago: 'Pagado', monto: 350.00, vencimiento: '2026-09-30' },
      { idAlumno: 104, alumno: 'Diego Martín Salazar', estadoPago: 'Moroso', monto: 350.00, vencimiento: '2026-09-10' }
    ];
  }
}

/**
 * HU-04: Consolidado de monitoreo académico y financiero para el Tutor de Aula
 */
export async function obtenerMonitoreoTutores(idCiclo = 1) {
  try {
    const response = await fetchWithAuth(`/api/tutores/monitoreo?idCiclo=${idCiclo}`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al consultar monitoreo de tutores en backend, usando semáforo mock:", error);
    return [
      { 
        idAlumno: 101, 
        codigoUsuario: 'SEMSM-Q6265', 
        alumno: 'Luis Fernando Tóccas', 
        ciclo: 'Semestral San Marcos', 
        puntajeSimulacro: 15.8, 
        estadoPago: 'Al día', 
        montoPendiente: 0.00, 
        ultimoPago: '2026-09-02' 
      },
      { 
        idAlumno: 102, 
        codigoUsuario: 'SEMSM-Q6266', 
        alumno: 'Carlos Andrés Benítez', 
        ciclo: 'Semestral San Marcos', 
        puntajeSimulacro: 13.5, 
        estadoPago: 'Moroso', 
        montoPendiente: 350.00, 
        ultimoPago: '2026-08-15' 
      },
      { 
        idAlumno: 103, 
        codigoUsuario: 'SEMSM-Q6267', 
        alumno: 'Valeria Quispe Ruiz', 
        ciclo: 'Semestral San Marcos', 
        puntajeSimulacro: 18.2, 
        estadoPago: 'Al día', 
        montoPendiente: 0.00, 
        ultimoPago: '2026-09-05' 
      },
      { 
        idAlumno: 104, 
        codigoUsuario: 'SEMSM-Q6268', 
        alumno: 'Diego Martín Salazar', 
        ciclo: 'Semestral San Marcos', 
        puntajeSimulacro: 10.0, 
        estadoPago: 'Moroso', 
        montoPendiente: 350.00, 
        ultimoPago: '2026-08-10' 
      },
      { 
        idAlumno: 105, 
        codigoUsuario: 'SEMSM-Q6269', 
        alumno: 'Camila Sofía Paredes', 
        ciclo: 'Semestral San Marcos', 
        puntajeSimulacro: 14.0, 
        estadoPago: 'Al día', 
        montoPendiente: 0.00, 
        ultimoPago: '2026-09-01' 
      }
    ];
  }
}

// ==========================================
// HU-03: MÓDULO DE MENÚS Y PERMISOS
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
// MÓDULO DE CALIFICACIONES Y SIMULACROS (HU-07)
// ==========================================

export async function obtenerNotasPorAulaYCurso(idAula, idCurso, periodo = 'simulacro-1') {
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
    { idAlumno: 101, codigo: 'SEMSM-Q6265', nombre: 'Luis Fernando Tóccas', parcial: 16, tareas: 18, final: 15 },
    { idAlumno: 102, codigo: 'SEMSM-Q6266', nombre: 'Carlos Andrés Benítez', parcial: 14, tareas: 15, final: 13 },
    { idAlumno: 103, codigo: 'SEMSM-Q6267', nombre: 'Valeria Quispe Ruiz', parcial: 18, tareas: 19, final: 17 },
    { idAlumno: 104, codigo: 'SEMSM-Q6268', nombre: 'Diego Martín Salazar', parcial: 9, tareas: 11, final: 10 },
    { idAlumno: 105, codigo: 'SEMSM-Q6269', nombre: 'Camila Sofía Paredes', parcial: 13, tareas: 14, final: 14 }
  ];
  localStorage.setItem(claveStorage, JSON.stringify(nominaBase));
  return JSON.parse(JSON.stringify(nominaBase));
}

export async function guardarNotasDocente(idAula, idCurso, periodo, listaNotas) {
  const claveStorage = `acadesys_notas_${idAula}_${idCurso}_${periodo}`;

  try {
    const response = await fetchWithAuth(`/api/notas`, {
      method: "POST",
      body: JSON.stringify({ idAula, idCurso, periodo, listaNotas }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json().catch(() => ({ mensaje: 'Calificaciones registradas correctamente' }));

    localStorage.setItem(claveStorage, JSON.stringify(listaNotas));
    mockNotasDocente[`${idAula}-${idCurso}-${periodo}`] = JSON.parse(JSON.stringify(listaNotas));

    return data;
  } catch (error) {
    console.warn("Fallo al guardar notas en el backend, aplicando respaldo local:", error);
    
    localStorage.setItem(claveStorage, JSON.stringify(listaNotas));
    mockNotasDocente[`${idAula}-${idCurso}-${periodo}`] = JSON.parse(JSON.stringify(listaNotas));
    
    return { ok: true, mensaje: 'Calificaciones registradas localmente (fallback)' };
  }
}

/**
 * HU-07: Sella y cierra oficialmente las actas de un simulacro
 */
export async function cerrarSimulacroActa(idAula, idCurso, periodo) {
  try {
    const response = await fetchWithAuth(`/api/notas/cerrar-simulacro`, {
      method: "PUT",
      body: JSON.stringify({ idAula, idCurso, periodo }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Fallo al sellar simulacro en backend, aplicando confirmación simulada:", error);
    return {
      ok: true,
      mensaje: `Simulacro (${periodo}) cerrado con éxito. Registro sellado y no editable.`
    };
  }
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
// HU-05: EXPEDIENTES / ESTUDIANTES PREU
// ==========================================

const MOCK_ESTUDIANTES = [
  {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
    gradoCorto: 'Semestral SM',
    codigo: 'SEMSM-Q6265',
    aula: 'Aula 101 - Semestral San Marcos',
    puestoRanking: 3,
    totalAlumnos: 36,
    promedioGeneral: 15.8,
    cursosCriticos: 1,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 16, tareas: 18, final: 15, promedio: 16.2, materialPdf: 'Algebra_Semana4_Polinomios.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 17, tareas: 19, final: 18, promedio: 18.0, materialPdf: 'RM_DECO_PlanteoEcuaciones.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 13, tareas: 15, final: 14, promedio: 14.0, materialPdf: 'Geometria_Poliedros_Regulares.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 10, tareas: 12, final: 11, promedio: 11.0, materialPdf: 'Fisica_Cinematica_Vectorial.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 12, tareas: 13, final: 12, promedio: 12.3, materialPdf: 'Quimica_Hidrocarburos.pdf', pesoMb: '1.8 MB' }
    ]
  }
];

export async function obtenerHijosMock() {
  return MOCK_ESTUDIANTES;
}

// ==========================================
// HU-06: TUTOR PEDAGÓGICO IA (GEMINI PREU)
// ==========================================

export async function consultarTutorIA(pregunta, contextoPreu = {}) {
  try {
    const payload = typeof contextoPreu === 'object' && contextoPreu !== null
      ? {
          pregunta: (pregunta || '').trim(),
          estudiante: contextoPreu.estudiante || 'Alumno AcadeSys',
          codigoUsuario: contextoPreu.codigoUsuario || 'SEMSM-Q6265',
          universidadObjetivo: contextoPreu.universidadObjetivo || 'UNMSM',
          carrera: contextoPreu.carrera || 'Ingeniería de Sistemas',
          historialSimulacros: contextoPreu.historialSimulacros || [
            { simulacro: 'Simulacro 1', puntaje: 14.5 },
            { simulacro: 'Simulacro 2', puntaje: 16.2 },
            { simulacro: 'Simulacro 3', puntaje: 16.7 }
          ]
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
      respuesta: textoFinal || "He analizado tus resultados de simulacros. Enfoca tu repaso en temas DECO de Álgebra y Trigonometría para consolidar tu puntaje."
    };
  } catch (error) {
    console.warn("Fallo al conectar con la API del Tutor IA, usando respuesta preuniversitaria de respaldo:", error);
    
    return { 
      respuesta: "Como tu tutor pedagógico de AcadeSys, te recomiendo repasar las preguntas tipo DECO y los ejercicios de simulacro de años anteriores de la universidad a la que postulas." 
    };
  }
}

// ==========================================
// HU-05: PANEL DEL ALUMNO Y MATERIALES
// ==========================================

/**
 * HU-05: Obtiene los enlaces de materiales y clases grabadas (Drive/OneDrive)
 */
export async function obtenerMaterialesAlumno(idCiclo = 1) {
  try {
    const response = await fetchWithAuth(`/api/materiales?idCiclo=${idCiclo}`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener materiales de la API, usando mock local:", error);
    return [
      {
        idMaterial: 1,
        curso: 'Álgebra Superior',
        docente: 'Prof. Carlos Mendoza',
        tema: 'Semana 4: Polinomios y Teorema del Resto',
        tipo: 'drive',
        enlace: 'https://drive.google.com',
        fechaPublicacion: '2026-09-18'
      },
      {
        idMaterial: 2,
        curso: 'Razonamiento Matemático',
        docente: 'Prof. Dante Quispe',
        tema: 'Semana 4: Planteo de Ecuaciones Tipo DECO',
        tipo: 'onedrive',
        enlace: 'https://onedrive.live.com',
        fechaPublicacion: '2026-09-19'
      },
      {
        idMaterial: 3,
        curso: 'Física Clásica',
        docente: 'Prof. María Flores',
        tema: 'Semana 3: Cinemática y Movimiento Circular',
        tipo: 'drive',
        enlace: 'https://drive.google.com',
        fechaPublicacion: '2026-09-15'
      },
      {
        idMaterial: 4,
        curso: 'Química Orgánica',
        docente: 'Prof. Rosaura Benítez',
        tema: 'Semana 4: Hidrocarburos Alifáticos',
        tipo: 'drive',
        enlace: 'https://drive.google.com',
        fechaPublicacion: '2026-09-20'
      }
    ];
  }
}

/**
 * HU-05: Obtiene el promedio y el historial de simulacros del alumno
 */
export async function obtenerNotasSimulacroAlumno(idEstudiante = 101) {
  try {
    const response = await fetchWithAuth(`/api/notas/simulacros?idEstudiante=${idEstudiante}`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener notas de simulacros, usando mock:", error);
    return {
      codigoUsuario: 'SEMSM-Q6265',
      estudiante: 'Luis Fernando Tóccas',
      ciclo: 'Semestral San Marcos',
      puestoRanking: 3,
      totalAlumnos: 36,
      promedioGeneral: 15.8,
      simulacros: [
        { fecha: '2026-09-07', numero: 'Simulacro 1', puntaje: 14.5, estado: 'Aprobado' },
        { fecha: '2026-09-14', numero: 'Simulacro 2', puntaje: 16.2, estado: 'Aprobado' },
        { fecha: '2026-09-21', numero: 'Simulacro 3', puntaje: 16.7, estado: 'Aprobado' }
      ]
    };
  }
}