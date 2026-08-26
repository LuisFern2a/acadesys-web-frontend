import React, { useEffect, useState } from 'react';
import { Plus, Users, Search, Loader2, X } from 'lucide-react';
import { obtenerPerfiles } from '../services/api';

export default function UsuariosPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loadingPerfiles, setLoadingPerfiles] = useState(true);
  const [errorPerfiles, setErrorPerfiles] = useState('');

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

      const lista = Array.isArray(data)
        ? data
        : data.data || [];

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

    const usuario = {
      ...formData,
      perfiles: perfilesSeleccionados,
    };

    console.log('DATOS DEL USUARIO:', usuario);

    /*
      AQUÍ conectaremos el POST cuando el Integrante 2
      nos entregue el endpoint y el JSON exacto del backend.

      Ejemplo futuro:

      const response = await fetch(
        'https://acadesys-api.onrender.com/api/usuarios',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(usuario),
        }
      );
    */

    alert('Formulario preparado. Revisa la consola para ver el JSON.');

    setIsModalOpen(false);

    setFormData({
      nombreUsuario: '',
      nombre: '',
      apellido: '',
      correo: '',
      contrasena: '',
      estadoRegistro: 'Activo',
    });

    setPerfilesSeleccionados([]);
  };

  // --------------------------------------------------
  // FILTRAR PERFILES
  // --------------------------------------------------
  const perfilesFiltrados = perfiles.filter((perfil) => {
    const nombre =
      perfil.NombrePerfil ||
      perfil.nombrePerfil ||
      '';

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
      </div>

      {/* CONTENIDO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">

        <div className="p-10 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />

          <h2 className="text-lg font-semibold text-slate-600 mb-1">
            Gestión de usuarios
          </h2>

          <p className="text-sm">
            Aquí se mostrarán los usuarios registrados.
          </p>
        </div>

      </div>

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
                  onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                  value={formData.contrasena}
                  onChange={handleChange}
                  placeholder="********"
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

                        const idPerfil =
                          perfil.IdPerfil ||
                          perfil.idPerfil ||
                          perfil.id;

                        const nombrePerfil =
                          perfil.NombrePerfil ||
                          perfil.nombrePerfil ||
                          'Sin nombre';

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