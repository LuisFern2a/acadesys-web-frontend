const API_URL = "https://acadesys-api.onrender.com";

// --------------------------------------------------
// OBTENER PERFILES
// --------------------------------------------------
export async function obtenerPerfiles() {
  try {
    const response = await fetch(`${API_URL}/api/perfiles`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener los perfiles:", error);
    throw error;
  }
}

// --------------------------------------------------
// OBTENER USUARIOS
// --------------------------------------------------
export async function obtenerUsuarios() {
  try {
    const response = await fetch(`${API_URL}/api/usuarios`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json().catch(() => ({ mensaje: "Actualizado con éxito" }));
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw error;
  }
}

// --------------------------------------------------
// ELIMINAR USUARIO (DELETE /api/usuarios/:id)
// --------------------------------------------------
export async function eliminarUsuario(idUsuario) {
  try {
    const response = await fetch(`${API_URL}/api/usuarios/${idUsuario}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json().catch(() => ({ mensaje: "Eliminado con éxito" }));
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    throw error;
  }
}

// --------------------------------------------------
// OBTENER OPCIONES DE MENÚ (GET /api/menus)
// --------------------------------------------------
export async function obtenerOpcionesMenu() {
  try {
    const response = await fetch(`${API_URL}/api/menus`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener opciones de menú:", error);
    throw error;
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear opción de menú:", error);
    throw error;
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al asignar menú a perfil:", error);
    throw error;
  }
}

// ==================================================
// MÓDULO ACADÉMICO (AULAS, CURSOS, CARGA DOCENTE)
// ==================================================

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