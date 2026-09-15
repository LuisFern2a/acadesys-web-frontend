const API_URL = "https://acadesys-api.onrender.com";

// ==========================================
// MOCKS BASE DE DATOS LOCAL
// ==========================================

let mockPerfiles = [
  { IdPerfil: 1, NombrePerfil: 'Administrador', EstadoRegistro: 1 },
  { IdPerfil: 2, NombrePerfil: 'Docente', EstadoRegistro: 1 },
  { IdPerfil: 3, NombrePerfil: 'Alumno', EstadoRegistro: 1 },
  { IdPerfil: 4, NombrePerfil: 'Padre de Familia', EstadoRegistro: 1 }
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
  { IdUsuario: 1, NombreCompleto: 'Yan Leví Picon', Correo: 'yan@acadesys.edu', Perfil: 'Administrador', EstadoRegistro: 1 },
  { IdUsuario: 2, NombreCompleto: 'Carlos Mendoza', Correo: 'cmendoza@acadesys.edu', Perfil: 'Docente', EstadoRegistro: 1 },
  { IdUsuario: 3, NombreCompleto: 'Luis Fernando Tóccas', Correo: 'ltoccas@acadesys.edu', Perfil: 'Alumno', EstadoRegistro: 1 }
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
    { idAlumno: 101, nombre: 'Luis Fernando Tóccas', estado: 'presente', horaLlegada: '07:45 AM' },
    { idAlumno: 102, nombre: 'Carlos Andrés Benítez', estado: 'tardanza', horaLlegada: '08:15 AM' },
    { idAlumno: 103, nombre: 'Valeria Quispe Ruiz', estado: 'presente', horaLlegada: '07:50 AM' },
    { idAlumno: 104, nombre: 'Diego Martín Salazar', estado: 'falta', horaLlegada: '--' },
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
    categoria: 'Academico',
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
    categoria: 'Reunion',
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

// --------------------------------------------------
// OBTENER PERFILES
// --------------------------------------------------
export async function obtenerPerfiles() {
  try {
    const response = await fetch(`${API_URL}/api/perfiles`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener perfiles, usando mock:", error);
    return [...mockPerfiles];
  }
}

// --------------------------------------------------
// OBTENER USUARIOS
// --------------------------------------------------
export async function obtenerUsuarios() {
  try {
    const response = await fetch(`${API_URL}/api/usuarios`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener usuarios, usando mock:", error);
    return [...mockUsuarios];
  }
}

// --------------------------------------------------
// REGISTRAR USUARIO CON PERFILES (POST)
// --------------------------------------------------
export async function crearUsuario(datosUsuario) {
  try {
    const idPerfilPrincipal = Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 0
      ? Number(datosUsuario.perfiles[0])
      : 1;

    const dniLimpio = String(datosUsuario.dni || datosUsuario.DNI || '00000000').trim().slice(0, 8);

    const payload = {
      ...datosUsuario,
      DNI: dniLimpio,
      dni: dniLimpio,
      Nombres: datosUsuario.nombre || datosUsuario.Nombres || datosUsuario.nombreUsuario,
      Nombre: datosUsuario.nombre || datosUsuario.Nombre,
      nombres: datosUsuario.nombre,
      Apellidos: datosUsuario.apellido || datosUsuario.Apellidos,
      Apellido: datosUsuario.apellido || datosUsuario.Apellido,
      apellidos: datosUsuario.apellido,
      NombreUsuario: datosUsuario.nombreUsuario || datosUsuario.NombreUsuario,
      nombreUsuario: datosUsuario.nombreUsuario,
      Correo: datosUsuario.correo || datosUsuario.Correo,
      CorreoElectronico: datosUsuario.correo || datosUsuario.Correo,
      email: datosUsuario.correo,
      correo: datosUsuario.correo,
      Contrasena: datosUsuario.contrasena || datosUsuario.Contrasena,
      Password: datosUsuario.contrasena || datosUsuario.Contrasena,
      clave: datosUsuario.contrasena,
      Clave: datosUsuario.contrasena,
      EstadoRegistro: 1,
      estadoRegistro: 1,
      Estado: 1,
      estado: 1,
      IdPerfil: idPerfilPrincipal,
      idPerfil: idPerfilPrincipal,
      Id_Perfil: idPerfilPrincipal,
      id_perfil: idPerfilPrincipal,
      Perfiles: datosUsuario.perfiles,
      IdPerfiles: datosUsuario.perfiles,
      idPerfiles: datosUsuario.perfiles,
      perfiles: datosUsuario.perfiles
    };

    const response = await fetch(`${API_URL}/api/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      NombreCompleto: `${datosUsuario.nombre || ''} ${datosUsuario.apellido || ''}`.trim() || datosUsuario.nombreUsuario,
      Correo: datosUsuario.correo,
      Perfil: 'Alumno',
      EstadoRegistro: 1
    };
    mockUsuarios = [nuevo, ...mockUsuarios];
    return nuevo;
  }
}

// --------------------------------------------------
// ACTUALIZAR USUARIO (PUT /api/usuarios/:id)
// --------------------------------------------------
export async function actualizarUsuario(idUsuario, datosUsuario) {
  try {
    const idPerfilPrincipal = Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 0
      ? Number(datosUsuario.perfiles[0])
      : 1;

    const payload = {
      ...datosUsuario,
      DNI: datosUsuario.dni,
      dni: datosUsuario.dni,
      Nombres: datosUsuario.nombre,
      Nombre: datosUsuario.nombre,
      Apellidos: datosUsuario.apellido,
      Apellido: datosUsuario.apellido,
      NombreUsuario: datosUsuario.nombreUsuario,
      nombreUsuario: datosUsuario.nombreUsuario,
      Correo: datosUsuario.correo,
      correo: datosUsuario.correo,
      EstadoRegistro: datosUsuario.estadoRegistro === 'Activo' || datosUsuario.estadoRegistro === 1 ? 1 : 0,
      IdPerfil: idPerfilPrincipal,
      idPerfil: idPerfilPrincipal,
      Perfiles: datosUsuario.perfiles
    };

    if (datosUsuario.contrasena && datosUsuario.contrasena.trim() !== '') {
      payload.Contrasena = datosUsuario.contrasena;
      payload.Password = datosUsuario.contrasena;
      payload.clave = datosUsuario.contrasena;
    }

    const response = await fetch(`${API_URL}/api/usuarios/${idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json().catch(() => ({ mensaje: "Actualizado con éxito" }));
  } catch (error) {
    console.warn("Fallo al actualizar usuario, actualizando mock:", error);
    mockUsuarios = mockUsuarios.map(u => u.IdUsuario === idUsuario ? { ...u, ...datosUsuario } : u);
    return { mensaje: "Actualizado localmente" };
  }
}

// --------------------------------------------------
// ELIMINAR USUARIO (DELETE /api/usuarios/:id)
// --------------------------------------------------
export async function eliminarUsuario(idUsuario) {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/${idUsuario}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
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

// --------------------------------------------------
// OBTENER OPCIONES DE MENÚ (GET /api/menus)
// --------------------------------------------------
export async function obtenerOpcionesMenu() {
  try {
    const response = await fetch(`${API_URL}/api/menus`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Fallo al obtener menús, usando mock:", error);
    return [...mockOpcionesMenu];
  }
}

// --------------------------------------------------
// CREAR OPCIÓN DE MENÚ (POST /api/menus)
// --------------------------------------------------
export async function crearOpcionMenu(datosMenu) {
  try {
    const payload = {
      Nombre: datosMenu.nombre,
      UrlMenu: datosMenu.ruta,
      Descripcion: datosMenu.descripcion || datosMenu.icono || 'Opción de Menú',
      IdPadre: datosMenu.idPadre ? Number(datosMenu.idPadre) : null,
      EstadoRegistro: 1
    };

    const response = await fetch(`${API_URL}/api/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// --------------------------------------------------
// ASIGNAR MENÚ A PERFIL (POST /api/menus/asignar)
// --------------------------------------------------
export async function asignarMenuAPerfil(idOpcionMenu, idPerfil, orden = 1) {
  try {
    const payload = {
      IdOpcionMenu: Number(idOpcionMenu),
      IdPerfil: Number(idPerfil),
      Orden: Number(orden) || 1,
      EstadoRegistro: 1
    };

    const response = await fetch(`${API_URL}/api/menus/asignar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// ==================================================
// MÓDULO ACADÉMICO (AULAS, CURSOS, CARGA DOCENTE)
// ==================================================

export async function obtenerAulas() {
  try {
    const response = await fetch(`${API_URL}/api/aulas`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockAulas];
  }
}

export async function crearAula(nuevaAula) {
  try {
    const response = await fetch(`${API_URL}/api/aulas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(`${API_URL}/api/aulas/${idAula}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_URL}/api/aulas/${idAula}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return true;
  } catch {
    mockAulas = mockAulas.filter(a => a.idAula !== idAula);
    return true;
  }
}

export async function obtenerCursos() {
  try {
    const response = await fetch(`${API_URL}/api/cursos`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockCursos];
  }
}

export async function crearCurso(nuevoCurso) {
  try {
    const response = await fetch(`${API_URL}/api/cursos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(`${API_URL}/api/cursos/${idCurso}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_URL}/api/cursos/${idCurso}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return true;
  } catch {
    mockCursos = mockCursos.filter(c => c.idCurso !== idCurso);
    return true;
  }
}

export async function obtenerAsignacionesDocente() {
  try {
    const response = await fetch(`${API_URL}/api/asignaciones`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockAsignaciones];
  }
}

export async function crearAsignacionDocente(nuevaAsig) {
  try {
    const response = await fetch(`${API_URL}/api/asignaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(`${API_URL}/api/asignaciones/${idAsignacion}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return true;
  } catch {
    mockAsignaciones = mockAsignaciones.filter(a => a.idAsignacion !== idAsignacion);
    return true;
  }
}

// ==================================================
// MÓDULO DE ASISTENCIA
// ==================================================

export async function obtenerAsistenciaPorAulaYFecha(idAula, fecha) {
  const clave = `${idAula}-${fecha}`;
  if (mockAsistencias[clave]) {
    return [...mockAsistencias[clave]];
  }

  const listaDefault = [
    { idAlumno: 101, nombre: 'Luis Fernando Tóccas', estado: 'presente', horaLlegada: '07:50 AM' },
    { idAlumno: 102, nombre: 'Carlos Andrés Benítez', estado: 'presente', horaLlegada: '07:52 AM' },
    { idAlumno: 103, nombre: 'Valeria Quispe Ruiz', estado: 'presente', horaLlegada: '07:48 AM' },
    { idAlumno: 104, nombre: 'Diego Martín Salazar', estado: 'presente', horaLlegada: '07:55 AM' },
    { idAlumno: 105, nombre: 'Camila Sofía Paredes', estado: 'presente', horaLlegada: '07:40 AM' }
  ];
  mockAsistencias[clave] = listaDefault;
  return [...listaDefault];
}

export async function guardarAsistencia(idAula, fecha, listaAlumnos) {
  const clave = `${idAula}-${fecha}`;
  mockAsistencias[clave] = [...listaAlumnos];
  return { ok: true, mensaje: 'Asistencia registrada con éxito' };
}

// ==================================================
// MÓDULO DE REGISTRO DE CALIFICACIONES (DOCENTE)
// ==================================================

export async function obtenerNotasPorAulaYCurso(idAula, idCurso, periodo = 'bimestre-2') {
  const clave = `${idAula}-${idCurso}-${periodo}`;
  if (mockNotasDocente[clave]) {
    return JSON.parse(JSON.stringify(mockNotasDocente[clave]));
  }

  const nominaBase = [
    { idAlumno: 101, codigo: 'ACAD-2026-755', nombre: 'Luis Fernando Tóccas', parcial: 15, tareas: 16, final: 14 },
    { idAlumno: 102, codigo: 'ACAD-2026-801', nombre: 'Carlos Andrés Benítez', parcial: 13, tareas: 14, final: 12 },
    { idAlumno: 103, codigo: 'ACAD-2026-812', nombre: 'Valeria Quispe Ruiz', parcial: 17, tareas: 18, final: 17 },
    { idAlumno: 104, codigo: 'ACAD-2026-820', nombre: 'Diego Martín Salazar', parcial: 10, tareas: 12, final: 11 },
    { idAlumno: 105, codigo: 'ACAD-2026-833', nombre: 'Camila Sofía Paredes', parcial: 14, tareas: 15, final: 13 }
  ];
  mockNotasDocente[clave] = nominaBase;
  return JSON.parse(JSON.stringify(nominaBase));
}

export async function guardarNotasDocente(idAula, idCurso, periodo, listaNotas) {
  const clave = `${idAula}-${idCurso}-${periodo}`;
  mockNotasDocente[clave] = JSON.parse(JSON.stringify(listaNotas));
  return { ok: true, mensaje: 'Calificaciones registradas correctamente' };
}

// ==================================================
// MÓDULO DE COMUNICADOS Y NOTIFICACIONES
// ==================================================

export async function obtenerComunicados() {
  try {
    const response = await fetch(`${API_URL}/api/comunicados`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return JSON.parse(JSON.stringify(mockComunicados));
  }
}

export async function crearComunicado(nuevo) {
  try {
    const response = await fetch(`${API_URL}/api/comunicados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    });
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    const creado = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-PE'),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      confirmado: false,
      ...nuevo
    };
    mockComunicados = [creado, ...mockComunicados];
    return creado;
  }
}

export async function confirmarLecturaComunicado(id) {
  mockComunicados = mockComunicados.map(c => 
    c.id === id ? { ...c, leido: true, confirmado: true } : c
  );
  return { ok: true };
}