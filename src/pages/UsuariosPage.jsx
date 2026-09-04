import React, { useEffect, useState } from 'react';
import { Plus, Users, Search, Loader2, X, AlertCircle } from 'lucide-react';
import { obtenerPerfiles, obtenerUsuarios, crearUsuario } from '../services/api';

export default function UsuariosPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loadingPerfiles, setLoadingPerfiles] = useState(true);
  const [errorPerfiles, setErrorPerfiles] = useState('');

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombreUsuario: '',
    dni: '',
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    estadoRegistro: 'Activo',
  });

  const [errores, setErrores] = useState({});
  const [perfilesSeleccionados, setPerfilesSeleccionados] = useState([]);

  // Validaciones RegEx
  const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
  const DNI_REGEX = /^\d{8}$/;
  const CORREO_PERMITIDO = /^[^\s@]+@(gmail\.com|acadesys\.edu|acadesys\.edu\.pe)$/;
  const CONTRASENA_PERMITIDA = /^(?=(?:.*[A-Za-z]){8})(?=(?:.*\d){8})[A-Za-z\d]{16}$/;

  // --------------------------------------------------
  // CARGA INICIAL
  // --------------------------------------------------
  useEffect(() => {
    cargarPerfiles();
    cargarUsuarios();
  }, []);

  const cargarPerfiles = async () => {
    setLoadingPerfiles(true);
    setErrorPerfiles('');
    try {
      const data = await obtenerPerfiles();
      const lista = Array.isArray(data) ? data : data.data || [];
      setPerfiles(lista);
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
      setErrorPerfiles('No se pudieron cargar los perfiles.');
    } finally {
      setLoadingPerfiles(false);
    }
  };

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      if (typeof obtenerUsuarios === 'function') {
        const data = await obtenerUsuarios();
        const lista = Array.isArray(data) ? data : data.data || [];
        setUsuarios(lista);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // --------------------------------------------------
  // RESOLVEDORES ROBUSTOS PARA CAMPOS DE LA BD
  // --------------------------------------------------
  const resolverUsuario = (u) => {
    const user = (
      u.NombreUsuario ||
      u.nombreUsuario ||
      u.usuario ||
      u.Usuario ||
      u.username ||
      u.UserName ||
      u.login ||
      u.cuenta
    );
    if (user && String(user).trim() !== '') return String(user).trim();
    
    // Si la BD no guardó o no retornó la columna de alias, usa el prefijo del correo
    const email = u.correo || u.Correo || u.email || '';
    if (email.includes('@')) return email.split('@')[0];
    
    return u.nombres || u.Nombres || '-';
  };

  const resolverDni = (u) => {
    return u.dni || u.DNI || u.Dni || '-';
  };

  const resolverNombreCompleto = (u) => {
    const nombres = u.nombres || u.Nombres || u.nombre || u.Nombre || '';
    const apellidos = u.apellidos || u.Apellidos || u.apellido || u.Apellido || '';
    const completo = `${nombres} ${apellidos}`.trim();
    return completo || resolverUsuario(u);
  };

  const resolverCorreo = (u) => {
    return u.correo || u.Correo || u.CorreoElectronico || u.email || '-';
  };

  const resolverPerfilNombre = (u) => {
    if (Array.isArray(u.perfiles) && u.perfiles.length > 0) {
      return u.perfiles.map(p => {
        if (typeof p === 'object' && p !== null) return p.Nombre || p.nombre || p.nombre_perfil;
        const encontrado = perfiles.find(item => (item.id_perfil ?? item.IdPerfil ?? item.id) === Number(p));
        return encontrado ? (encontrado.Nombre || encontrado.nombre) : p;
      }).join(', ');
    }

    if (u.NombrePerfil || u.nombrePerfil || u.perfil || u.Perfil) {
      return u.NombrePerfil || u.nombrePerfil || u.perfil || u.Perfil;
    }

    const idPerfil = u.idPerfil ?? u.IdPerfil ?? u.id_perfil ?? u.Id_Perfil;
    if (idPerfil) {
      const encontrado = perfiles.find(p => (p.id_perfil ?? p.IdPerfil ?? p.id) === Number(idPerfil));
      if (encontrado) return encontrado.Nombre || encontrado.nombre_perfil || encontrado.nombre;
    }

    return 'Docente';
  };

  const resolverEstado = (u) => {
    const est = u.estadoRegistro ?? u.EstadoRegistro ?? u.estado ?? u.Estado ?? 1;
    return String(est) === '1' || String(est).toUpperCase() === 'ACTIVO' ? 'Activo' : 'Inactivo';
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
  // GUARDAR USUARIO
  // --------------------------------------------------
  const handleSave = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    if (!formData.nombreUsuario.trim()) {
      nuevosErrores.nombreUsuario = 'El nombre de usuario es obligatorio.';
    }

    if (!DNI_REGEX.test(formData.dni)) {
      nuevosErrores.dni = 'El DNI debe tener exactamente 8 dígitos numéricos.';
    }

    if (!SOLO_LETRAS.test(formData.nombre)) {
      nuevosErrores.nombre = 'El nombre debe contener únicamente letras y espacios.';
    }

    if (!SOLO_LETRAS.test(formData.apellido)) {
      nuevosErrores.apellido = 'El apellido debe contener únicamente letras y espacios.';
    }

    if (!CORREO_PERMITIDO.test(formData.correo)) {
      nuevosErrores.correo = 'El correo debe ser válido (@gmail.com, @acadesys.edu o @acadesys.edu.pe).';
    }

    if (!CONTRASENA_PERMITIDA.test(formData.contrasena)) {
      nuevosErrores.contrasena = 'La contraseña debe tener exactamente 16 caracteres (8 letras y 8 números).';
    }

    if (perfilesSeleccionados.length === 0) {
      nuevosErrores.perfiles = 'Debes seleccionar al menos un perfil.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const payloadUsuario = {
      ...formData,
      perfiles: perfilesSeleccionados,
    };

    setGuardando(true);
    try {
      await crearUsuario(payloadUsuario);
      alert('¡Usuario registrado con éxito!');

      await cargarUsuarios();
      setIsModalOpen(false);

      setFormData({
        nombreUsuario: '',
        dni: '',
        nombre: '',
        apellido: '',
        correo: '',
        contrasena: '',
        estadoRegistro: 'Activo',
      });
      setPerfilesSeleccionados([]);
      setErrores({});
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      alert(error.message || 'Hubo un problema al registrar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado de usuarios por término de búsqueda
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchUser = resolverUsuario(u).toLowerCase();
    const matchNombre = resolverNombreCompleto(u).toLowerCase();
    const matchDni = resolverDni(u).toString();
    const matchCorreo = resolverCorreo(u).toLowerCase();
    const query = searchTerm.toLowerCase();

    return (
      matchUser.includes(query) ||
      matchNombre.includes(query) ||
      matchDni.includes(query) ||
      matchCorreo.includes(query)
    );
  });

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Administración de usuarios y asignación de perfiles
          </p>
        </div>

        <button
          onClick={() => {
            setErrores({});
            setIsModalOpen(true);
          }}
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
          placeholder="Buscar por usuario, nombre o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* LISTA / TABLA */}
      {loadingUsuarios ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-sm">Cargando lista de usuarios...</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-600 mb-1">Sin registros</h2>
          <p className="text-sm">No se encontraron usuarios registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">DNI</th>
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Nombre Completo</th>
                <th className="py-4 px-6">Correo</th>
                <th className="py-4 px-6">Perfiles</th>
                <th className="py-4 px-6">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {usuariosFiltrados.map((u, idx) => {
                const idFila = u.idUsuario || u.IdUsuario || u.id_usuario || idx;
                const estadoTxt = resolverEstado(u);

                return (
                  <tr key={idFila} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">
                      {resolverDni(u)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {resolverUsuario(u)}
                    </td>
                    <td className="py-4 px-6">
                      {resolverNombreCompleto(u)}
                    </td>
                    <td className="py-4 px-6">
                      {resolverCorreo(u)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {resolverPerfilNombre(u)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        estadoTxt === 'Activo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {estadoTxt}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL NUEVO USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Crear Nuevo Usuario</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NOMBRE DE USUARIO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    name="nombreUsuario"
                    value={formData.nombreUsuario}
                    onChange={handleChange}
                    placeholder="Ej: jperalta"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      errores.nombreUsuario ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {errores.nombreUsuario && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.nombreUsuario}
                    </p>
                  )}
                </div>

                {/* DNI (8 DÍGITOS) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    DNI (8 dígitos)
                  </label>
                  <input
                    type="text"
                    name="dni"
                    maxLength={8}
                    value={formData.dni}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, dni: val }));
                    }}
                    placeholder="74839201"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      errores.dni ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {errores.dni && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.dni}
                    </p>
                  )}
                </div>
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
                    value={formData.nombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]*$/.test(val)) {
                        setFormData((prev) => ({ ...prev, nombre: val }));
                      }
                    }}
                    placeholder="Juan"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      errores.nombre ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {errores.nombre && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]*$/.test(val)) {
                        setFormData((prev) => ({ ...prev, apellido: val }));
                      }
                    }}
                    placeholder="Pérez"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      errores.apellido ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {errores.apellido && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.apellido}
                    </p>
                  )}
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
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="usuario@acadesys.edu o @gmail.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    errores.correo ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {errores.correo && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.correo}
                  </p>
                )}
              </div>

              {/* CONTRASEÑA */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Contraseña (16 caracteres: 8 letras y 8 números)
                </label>
                <input
                  type="password"
                  name="contrasena"
                  maxLength={16}
                  value={formData.contrasena}
                  onChange={handleChange}
                  placeholder="Ej: ClaveSec12345678"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    errores.contrasena ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {errores.contrasena && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.contrasena}
                  </p>
                )}
              </div>

              {/* CHECKBOXES DE PERFILES */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                  Perfiles asignados
                </label>
                <div className={`border rounded-xl p-4 ${errores.perfiles ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'}`}>
                  {loadingPerfiles ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      Cargando perfiles...
                    </div>
                  ) : errorPerfiles ? (
                    <div className="text-sm text-rose-600">{errorPerfiles}</div>
                  ) : perfiles.length === 0 ? (
                    <div className="text-sm text-slate-400">No hay perfiles disponibles.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {perfiles.map((perfil) => {
                        const id = perfil.IdPerfil || perfil.idPerfil || perfil.id;
                        const nombre = perfil.Nombre || perfil.nombre;
                        return (
                          <label key={id} className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perfilesSeleccionados.includes(id)}
                              onChange={() => cambiarPerfil(id)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">{nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                {errores.perfiles && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.perfiles}
                  </p>
                )}
              </div>

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}