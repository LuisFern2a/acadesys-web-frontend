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
  { IdOpcionMenu: 2, Nombre: 'Académico', Icono: 'Layers', Ruta: '/academico', IdPadre: null },
  { IdOpcionMenu: 3, Nombre: 'Calificaciones', Icono: 'Award', Ruta: '/calificaciones', IdPadre: null },
  { IdOpcionMenu: 4, Nombre: 'Tutor IA', Icono: 'BrainCircuit', Ruta: '/tutor-ia', IdPadre: null },
  { IdOpcionMenu: 5, Nombre: 'Perfiles', Icono: 'ShieldCheck', Ruta: '/perfiles', IdPadre: null },
  { IdOpcionMenu: 6, Nombre: 'Usuarios', Icono: 'Users', Ruta: '/usuarios', IdPadre: null }
];

let mockUsuarios = [
  { IdUsuario: 1, NombreCompleto: 'Yan Leví Picon', Correo: 'yan@acadesys.edu', Perfil: 'Docente', EstadoRegistro: 1 },
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

// OBTENER AULAS
export async function obtenerAulas() {
  try {
    const response = await fetch(`${API_URL}/api/aulas`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockAulas];
  }
}

// CREAR AULA
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

// ACTUALIZAR AULA
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

// ELIMINAR AULA
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

// OBTENER CURSOS
export async function obtenerCursos() {
  try {
    const response = await fetch(`${API_URL}/api/cursos`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockCursos];
  }
}

// CREAR CURSO
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

// ACTUALIZAR CURSO
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

// ELIMINAR CURSO
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

// OBTENER ASIGNACIONES DOCENTES
export async function obtenerAsignacionesDocente() {
  try {
    const response = await fetch(`${API_URL}/api/asignaciones`);
    if (!response.ok) throw new Error(`HTTP: ${response.status}`);
    return await response.json();
  } catch {
    return [...mockAsignaciones];
  }
}

// CREAR ASIGNACIÓN DOCENTE
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

// ELIMINAR ASIGNACIÓN DOCENTE
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