import React, { useEffect, useState } from 'react';
import { Plus, Users, Search, Loader2, X } from 'lucide-react';
import { obtenerPerfiles } from '../services/api';

export default function UsuariosPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loadingPerfiles, setLoadingPerfiles] = useState(true);
  const [errorPerfiles, setErrorPerfiles] = useState('');

  const [usuarios, setUsuarios] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombreUsuario: '',
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    estadoRegistro: 'Activo',
  });

  const [errores, setErrores] = useState({});

  const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
  const CORREO_PERMITIDO = /^[^\s@]+@(gmail\.com|acadesys\.edu)$/;
  const CONTRASENA_PERMITIDA = /^(?=(?:.*[A-Za-z]){8})(?=(?:.*\d){8})[A-Za-z\d]{16}$/;



  const [perfilesSeleccionados, setPerfilesSeleccionados] = useState([]);

  // --------------------------------------------------
  // CARGAR PERFILES DESDE EL BACKEND
  // --------------------------------------------------
  useEffect(() => {
    cargarPerfiles();
  }, []);

  const cargarPerfiles = async () => {
    setLoadingPerfiles(true);
    setErrorPerfiles('');

    try {
      
const data = await obtenerPerfiles();

console.log("PERFILES QUE RECIBE USUARIOS:", data);

const lista = Array.isArray(data)
  ? data
  : data.data || [];

console.log("LISTA DE PERFILES:", lista);

setPerfiles(lista);

    } catch (error) {
      console.error('Error al cargar perfiles:', error);
      setErrorPerfiles('No se pudieron cargar los perfiles.');
    } finally {
      setLoadingPerfiles(false);
    }
  };

  // --------------------------------------------------
  // SELECCIONAR / DESELECCIONAR PERFIL
  // --------------------------------------------------
  const cambiarPerfil = (idPerfil) => {
    setPerfilesSeleccionados((actuales) => {
      if (actuales.includes(idPerfil)) {
        return actuales.filter((id) => id !== idPerfil);
      }

      return [...actuales, idPerfil];
    });
  };

  // --------------------------------------------------
  // CAMBIAR CAMPOS DEL FORMULARIO
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // GUARDAR
  // --------------------------------------------------
  const handleSave = async (e) => {
  e.preventDefault();

  const nuevosErrores = {};

  // Validar nombre de usuario
  if (!SOLO_LETRAS.test(formData.nombreUsuario)) {
  nuevosErrores.nombreUsuario =
    'El nombre de usuario debe contener únicamente letras y espacios, sin números ni símbolos.';
}

  // Validar nombre
  if (!SOLO_LETRAS.test(formData.nombre)) {
  nuevosErrores.nombre =
    'El nombre debe contener únicamente letras y espacios, sin números ni símbolos.';
}

  // Validar apellido
  if (!SOLO_LETRAS.test(formData.apellido)) {
  nuevosErrores.apellido =
    'El apellido debe contener únicamente letras y espacios, sin números ni símbolos.';
}

  // Validar correo
  if (!CORREO_PERMITIDO.test(formData.correo)) {
    nuevosErrores.correo =
      'El correo debe terminar en @gmail.com o @acadesys.edu.';
  }

  // Validar contraseña
  if (!CONTRASENA_PERMITIDA.test(formData.contrasena)) {
    nuevosErrores.contrasena =
      'La contraseña debe tener exactamente 16 caracteres: 8 letras y 8 números, sin símbolos.';
  }

  // Validar que haya al menos un perfil
  if (perfilesSeleccionados.length === 0) {
    nuevosErrores.perfiles =
      'Debes seleccionar al menos un perfil.';
  }

  // Si hay errores, no guardar
  if (Object.keys(nuevosErrores).length > 0) {
    setErrores(nuevosErrores);
    return;
  }

  // Crear objeto del usuario
  const usuario = {
    ...formData,
    perfiles: perfilesSeleccionados,
  };

  console.log('DATOS DEL USUARIO:', usuario);

  // Agregar temporalmente a la lista
  setUsuarios((actuales) => [...actuales, usuario]);

  alert('Usuario agregado correctamente.');

  // Cerrar modal
  setIsModalOpen(false);

  // Limpiar formulario
  setFormData({
    nombreUsuario: '',
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    estadoRegistro: 'Activo',
  });

  setPerfilesSeleccionados([]);
  setErrores({});
};

  // --------------------------------------------------
  // FILTRAR PERFILES
  // --------------------------------------------------
  const perfilesFiltrados = perfiles.filter((perfil) => {
  const nombre = perfil.Nombre || '';

  return nombre
    .toLowerCase()
    .includes(searchTerm.toLowerCase());
});

  return (
    <div className="p-8 bg-slate-50 min-h-full">

      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />

            <h1 className="text-2xl font-bold text-slate-800">
              Gestión de Usuarios
            </h1>
          </div>

          <p className="text-slate-500 text-sm mt-1">
            Administración de usuarios y asignación de perfiles
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />

        <input
          type="text"
          placeholder="Buscar usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
        {errores.nombreUsuario && (
  <p className="text-xs text-rose-600 mt-1">
    {errores.nombreUsuario}
  </p>
)}
        {errores.nombre && (
  <p className="text-xs text-rose-600 mt-1">
    {errores.nombre}
  </p>
)}
        {errores.apellido && (
  <p className="text-xs text-rose-600 mt-1">
    {errores.apellido}
  </p>
)}
        {errores.correo && (
  <p className="text-xs text-rose-600 mt-1">
    {errores.correo}
  </p>
)}
        {errores.contrasena && (
  <p className="text-xs text-rose-600 mt-1">
    {errores.contrasena}
  </p>
)}
        
      </div>

      {/* CONTENIDO */}
      {usuarios.length === 0 ? (
  <div className="p-10 text-center text-slate-400">
    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />

    <h2 className="text-lg font-semibold text-slate-600 mb-1">
      Gestión de usuarios
    </h2>

    <p className="text-sm">
      No hay usuarios registrados todavía.
    </p>
  </div>
) : (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">

      <thead>
        <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <th className="py-4 px-6">Usuario</th>
          <th className="py-4 px-6">Nombre</th>
          <th className="py-4 px-6">Correo</th>
          <th className="py-4 px-6">Perfiles</th>
          <th className="py-4 px-6">Estado</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100 text-sm text-slate-600">

        {usuarios.map((usuario, index) => (
          <tr
            key={index}
            className="hover:bg-slate-50 transition-colors"
          >

            <td className="py-4 px-6 font-semibold text-slate-800">
              {usuario.nombreUsuario}
            </td>

            <td className="py-4 px-6">
              {usuario.nombre} {usuario.apellido}
            </td>

            <td className="py-4 px-6">
              {usuario.correo}
            </td>

            <td className="py-4 px-6">
              {usuario.perfiles.length > 0
                ? usuario.perfiles.join(', ')
                : 'Sin perfil'}
            </td>

            <td className="py-4 px-6">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                {usuario.estadoRegistro}
              </span>
            </td>

          </tr>
        ))}

      </tbody>

    </table>
  </div>
)}


      {/* MODAL NUEVO USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">

            {/* CABECERA MODAL */}
            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-bold text-slate-800">
                Crear Nuevo Usuario
              </h2>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form onSubmit={handleSave} className="space-y-5">

              {/* USUARIO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nombre de usuario
                </label>

                <input
                  type="text"
                  name="nombreUsuario"
                  required
                  value={formData.nombreUsuario}
                  onChange={(e) => {
  const valor = e.target.value;

  if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]*$/.test(valor)) {
    setFormData({
      ...formData,
      nombreUsuario: valor,
    });
  }
}}

                  placeholder="Ej: jperez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm"
                />
              </div>

              {/* NOMBRE Y APELLIDO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Nombre
                  </label>

                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={(e) => {
  const valor = e.target.value;

  if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]*$/.test(valor)) {
    setFormData({
      ...formData,
      nombre: valor,
    });
  }
}}
                    placeholder="Juan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Apellido
                  </label>

                  <input
                    type="text"
                    name="apellido"
                    required
                    value={formData.apellido}
                    onChange={(e) => {
  const valor = e.target.value;

  if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]*$/.test(valor)) {
    setFormData({
      ...formData,
      apellido: valor,
    });
  }
}}

                    placeholder="Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm"
                  />
                </div>

              </div>

              {/* CORREO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  name="correo"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="usuario@acadesys.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm"
                />
              </div>

              {/* CONTRASEÑA */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Contraseña
                </label>

                <input
  type="password"
  name="contrasena"
  required
  maxLength={16}
  value={formData.contrasena}
  onChange={handleChange}
  placeholder="8 letras + 8 números"
  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm"
/>
              </div>

              {/* PERFILES */}
              <div>

                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                  Perfiles
                </label>

                <div className="border border-slate-200 rounded-xl p-4">

                  {loadingPerfiles ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando perfiles...
                    </div>
                  ) : errorPerfiles ? (
                    <div className="text-sm text-rose-600">
                      {errorPerfiles}
                    </div>
                  ) : perfilesFiltrados.length === 0 ? (
                    <div className="text-sm text-slate-400">
                      No hay perfiles disponibles.
                    </div>
                  ) : (
                    <div className="space-y-3">

                      {perfilesFiltrados.map((perfil) => {

                        const idPerfil = perfil.IdPerfil;

                        const nombrePerfil = perfil.Nombre;

                        return (
                          <label
                            key={idPerfil}
                            className="flex items-center gap-3 cursor-pointer"
                          >

                            <input
                              type="checkbox"
                              checked={perfilesSeleccionados.includes(idPerfil)}
                              onChange={() => cambiarPerfil(idPerfil)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />

                            <span className="text-sm text-slate-700">
                              {nombrePerfil}
                            </span>

                          </label>
                        );
                      })}

                    </div>
                  )}

                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Puedes seleccionar uno o varios perfiles.
                </p>
                {errores.perfiles && (
  <p className="text-xs text-rose-600 mt-1">
    {errores.perfiles}
  </p>
)}

              </div>

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Guardar Usuario
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}