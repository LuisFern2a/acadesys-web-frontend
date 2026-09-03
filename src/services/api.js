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
    // Tomamos el primer perfil seleccionado como entero
    const idPerfilPrincipal = Array.isArray(datosUsuario.perfiles) && datosUsuario.perfiles.length > 0
      ? Number(datosUsuario.perfiles[0])
      : 1;

    const payload = {
      ...datosUsuario,
      // DNI
      DNI: String(datosUsuario.dni || datosUsuario.DNI),
      dni: String(datosUsuario.dni || datosUsuario.DNI),

      // Nombres
      Nombres: datosUsuario.nombre || datosUsuario.Nombres || datosUsuario.nombreUsuario,
      Nombre: datosUsuario.nombre || datosUsuario.Nombre,
      nombres: datosUsuario.nombre,

      // Apellidos
      Apellidos: datosUsuario.apellido || datosUsuario.Apellidos,
      Apellido: datosUsuario.apellido || datosUsuario.Apellido,
      apellidos: datosUsuario.apellido,

      // Nombre de Usuario
      NombreUsuario: datosUsuario.nombreUsuario || datosUsuario.NombreUsuario,
      nombreUsuario: datosUsuario.nombreUsuario,

      // Correo
      Correo: datosUsuario.correo || datosUsuario.Correo,
      CorreoElectronico: datosUsuario.correo || datosUsuario.Correo,
      email: datosUsuario.correo,
      correo: datosUsuario.correo,

      // Clave
      Contrasena: datosUsuario.contrasena || datosUsuario.Contrasena,
      Password: datosUsuario.contrasena || datosUsuario.Contrasena,
      clave: datosUsuario.contrasena,
      Clave: datosUsuario.contrasena,

      // EstadoRegistro (entero: 1 = Activo)
      EstadoRegistro: 1,
      estadoRegistro: 1,
      Estado: 1,
      estado: 1,

      // Perfil único para la columna de MySQL
      IdPerfil: idPerfilPrincipal,
      idPerfil: idPerfilPrincipal,
      Id_Perfil: idPerfilPrincipal,
      id_perfil: idPerfilPrincipal,

      // Arreglo de perfiles por si el backend también maneja tabla intermedia
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