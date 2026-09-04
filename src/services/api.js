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

    // Se asegura de que el DNI sea exactamente de 8 caracteres y nunca "undefined"
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