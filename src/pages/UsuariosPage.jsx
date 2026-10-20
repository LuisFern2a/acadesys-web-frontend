import React, { useEffect, useRef, useState } from 'react';
import { Plus, Users, Search, Loader2, X, AlertCircle, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
import { obtenerPerfiles, obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, mensajeErrorApi } from '../services/api';
import { grupoDeRol, GRUPO_ADMIN, GRUPO_DOCENTE, GRUPO_TUTOR, GRUPO_ALUMNO, GRUPO_PADRE } from '../utils/roles';
import useModalDialog from '../hooks/useModalDialog';

export default function UsuariosPage({ user }) {
  const [perfiles, setPerfiles] = useState([]);

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [operandoId, setOperandoId] = useState(null);
  const [errorUsuarios, setErrorUsuarios] = useState('');
  const [errorPerfiles, setErrorPerfiles] = useState('');
  const [errorOperacion, setErrorOperacion] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombreUsuario: '',
    dni: '',
    nombre: '',
    apellido: '',
    apellidoMaterno: '',
    correo: '',
    contrasena: '',
    estadoRegistro: 'Activo',
  });

  const [errores, setErrores] = useState({});
  const [perfilesSeleccionados, setPerfilesSeleccionados] = useState([]);
  const guardandoRef = useRef(false);
  const dialogRef = useModalDialog(isModalOpen, () => setIsModalOpen(false), guardando);

  // Validaciones RegEx
  const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]+$/;
  const DNI_REGEX = /^\d{8}$/;
  const CORREO_PERMITIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const CONTRASENA_PERMITIDA = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{8,}$/;

  async function cargarPerfiles() {
    setErrorPerfiles('');
    try {
      const data = await obtenerPerfiles();
      const lista = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(lista)) throw new Error('El servidor devolvió un catálogo de perfiles no válido.');
      setPerfiles(lista);
    } catch (error) {
      setErrorPerfiles(error.message || 'No se pudieron cargar los perfiles.');
    }
  };

  async function cargarUsuarios() {
    setLoadingUsuarios(true);
    setErrorUsuarios('');
    try {
      if (typeof obtenerUsuarios === 'function') {
        const data = await obtenerUsuarios();
        const lista = Array.isArray(data) ? data : data?.data;
        if (!Array.isArray(lista)) throw new Error('El servidor devolvió una lista de usuarios no válida.');

        const mapaUsuarios = new Map();
        lista.forEach((u) => {
          const dni = String(u.dni || u.DNI || u.Dni || '').trim();
          const correo = String(u.correo || u.Correo || u.CorreoElectronico || u.email || '').toLowerCase().trim();
          const user = String(u.nombreUsuario || u.NombreUsuario || u.usuario || '').toLowerCase().trim();

          const claveUnica = (dni && dni !== '-') ? dni : (correo || user);
          if (!claveUnica) return;

          if (!mapaUsuarios.has(claveUnica)) {
            const perfilesIniciales = [];
            if (u.perfiles && Array.isArray(u.perfiles)) perfilesIniciales.push(...u.perfiles);
            if (u.idPerfil || u.IdPerfil || u.id_perfil) perfilesIniciales.push(u.idPerfil || u.IdPerfil || u.id_perfil);
            if (u.NombrePerfil || u.nombrePerfil || u.perfil || u.rol) {
              perfilesIniciales.push(u.NombrePerfil || u.nombrePerfil || u.perfil || u.rol);
            }

            mapaUsuarios.set(claveUnica, {
              ...u,
              perfilesUnificados: perfilesIniciales.filter(Boolean)
            });
          } else {
            const existente = mapaUsuarios.get(claveUnica);
            const nuevos = [...existente.perfilesUnificados];

            if (u.perfiles && Array.isArray(u.perfiles)) nuevos.push(...u.perfiles);
            if (u.idPerfil || u.IdPerfil || u.id_perfil) nuevos.push(u.idPerfil || u.IdPerfil || u.id_perfil);
            if (u.NombrePerfil || u.nombrePerfil || u.perfil || u.rol) {
              nuevos.push(u.NombrePerfil || u.nombrePerfil || u.perfil || u.rol);
            }

            existente.perfilesUnificados = Array.from(
              new Set(nuevos.map(p => (typeof p === 'object' ? JSON.stringify(p) : p)))
            ).map(p => (typeof p === 'string' && p.startsWith('{') ? JSON.parse(p) : p));
          }
        });

        setUsuarios(Array.from(mapaUsuarios.values()));
        return true;
      } else {
        throw new Error('No está disponible el servicio de usuarios.');
      }
    } catch (error) {
      setErrorUsuarios(error.message || 'No fue posible cargar la nómina desde el backend.');
      return false;
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const resolverUsuario = (u) => {
    const user = (u.CodigoUsuario || u.codigoUsuario || u.NombreUsuario || u.nombreUsuario || u.usuario || u.Usuario || u.username || u.login);
    if (user && String(user).trim() !== '') return String(user).trim();
    const email = u.correo || u.Correo || u.email || '';
    if (email.includes('@')) return email.split('@')[0];
    const nombres = u.nombre || u.Nombre || u.nombres || '';
    return nombres ? String(nombres).trim() : '-';
  };

  const resolverDni = (u) => u.dni || u.DNI || u.Dni || '-';

  const resolverNombreCompleto = (u) => {
    const nombres = u.nombres || u.Nombres || u.nombre || u.Nombre || '';
    const apellidos = u.ApellidoPaterno
      ? `${u.ApellidoPaterno} ${u.ApellidoMaterno || ''}`.trim()
      : (u.apellidos || u.Apellidos || u.apellido || u.Apellido || '');
    const completo = `${nombres} ${apellidos}`.trim();
    return completo || resolverUsuario(u);
  };

  const resolverCorreo = (u) => u.correo || u.Correo || u.CorreoElectronico || u.email || '-';

  // El perfil SIEMPRE proviene del servidor (NombrePerfil + EstadoPerfil).
  // Sin IDs mágicos ni heurísticas por correo/DNI/nombre de usuario.
  const resolverPerfil = (u) => {
    const idPerfil = u.IdPerfil ?? u.idPerfil ?? u.id_perfil ?? null;
    const nombre = String(u.NombrePerfil ?? u.nombrePerfil ?? u.Perfil ?? '').trim();
    if (idPerfil === null || idPerfil === undefined || Number(idPerfil) <= 0) {
      return { etiqueta: 'Sin perfil', tipo: 'sin-perfil' };
    }
    const estadoPerfil = u.EstadoPerfil ?? u.estadoPerfil;
    const inactivo = estadoPerfil !== undefined && estadoPerfil !== null && Number(estadoPerfil) !== 1;
    if (inactivo) {
      return {
        etiqueta: nombre ? `${nombre} (Perfil inactivo)` : 'Perfil inactivo',
        tipo: 'inactivo',
      };
    }
    return { etiqueta: nombre || `Perfil #${idPerfil}`, tipo: 'activo' };
  };

  const resolverBadgeRol = (rolTexto = '') => {
    // Color de etiqueta por perfil exacto (no es autorización; solo presentación).
    const grupo = grupoDeRol(rolTexto);
    if (grupo === GRUPO_ADMIN) return 'bg-blue-700 text-white border-blue-700';
    if (grupo === GRUPO_DOCENTE) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (grupo === GRUPO_TUTOR || grupo === GRUPO_PADRE) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grupo === GRUPO_ALUMNO) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const estiloBadgePerfil = (perfil) => {
    if (perfil.tipo === 'sin-perfil') return 'bg-slate-100 text-slate-500 border-slate-200';
    if (perfil.tipo === 'inactivo') return 'bg-rose-50 text-rose-600 border-rose-200';
    return resolverBadgeRol(perfil.etiqueta);
  };

  const resolverEstado = (u) => {
    const est = u.estadoRegistro ?? u.EstadoRegistro ?? u.estado ?? u.Estado ?? 1;
    return String(est) === '1' || String(est).toUpperCase() === 'ACTIVO' ? 'Activo' : 'Inactivo';
  };

  const idUsuarioSesion = user?.idUsuario ?? user?.IdUsuario ?? user?.id ?? null;
  const esMiCuenta = (u) => {
    const id = u?.idUsuario ?? u?.IdUsuario ?? u?.id_usuario ?? u?.id;
    return idUsuarioSesion !== null && String(id) === String(idUsuarioSesion);
  };

  // Solo se pueden asignar perfiles activos; el backend lo valida igualmente.
  const perfilesAsignables = perfiles.filter((p) => {
    const estado = p.EstadoRegistro ?? p.estadoRegistro ?? p.estado;
    return estado === undefined || Number(estado) === 1;
  });

  const abrirModalCrear = () => {
    setErrorOperacion('');
    setUsuarioEditando(null);
    setFormData({
      nombreUsuario: '',
      dni: '',
      nombre: '',
      apellido: '',
      apellidoMaterno: '',
      correo: '',
      contrasena: '',
      estadoRegistro: 'Activo',
    });
    setPerfilesSeleccionados([]);
    setErrores({});
    setIsModalOpen(true);
  };

  const handleEditar = (u) => {
    setErrorOperacion('');
    setUsuarioEditando(u);
    setFormData({
      nombreUsuario: resolverUsuario(u),
      dni: resolverDni(u) !== '-' ? resolverDni(u) : '',
      nombre: u.Nombres ?? u.nombre ?? u.Nombre ?? u.nombres ?? '',
      apellido: u.ApellidoPaterno || u.apellido || u.Apellido || u.apellidos || '',
      apellidoMaterno: u.ApellidoMaterno || u.apellidoMaterno || '',
      correo: resolverCorreo(u) !== '-' ? resolverCorreo(u) : '',
      contrasena: '',
      estadoRegistro: resolverEstado(u),
    });

    const perfs = u.perfilesUnificados || u.perfiles || [u.IdPerfil ?? u.idPerfil];
    const idsAsignables = new Set(perfilesAsignables.map((p) => Number(p.IdPerfil ?? p.idPerfil ?? p.id)));
    setPerfilesSeleccionados(
      Array.isArray(perfs)
        ? [...new Set(perfs.map(p => Number(typeof p === 'object' && p !== null ? (p.id ?? p.IdPerfil ?? p.idPerfil ?? p.id_perfil) : p)).filter(id => Number.isSafeInteger(id) && id > 0 && idsAsignables.has(id)))]
        : []
    );
    setErrores({});
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (u) => {
    if (operandoId !== null || guardandoRef.current) return;
    if (esMiCuenta(u)) {
      setErrorOperacion('No puedes desactivar tu propia cuenta desde este módulo.');
      return;
    }
    const id = u.idUsuario ?? u.IdUsuario ?? u.id_usuario ?? u.id;
    const estadoActual = resolverEstado(u);
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';

    guardandoRef.current = true;
    setOperandoId(id ?? 'sin-id');
    setErrorOperacion('');
    try {
      // Enviamos SOLO el estado: el PUT es parcial y no debe tocar
      // campos que no se están modificando.
      await actualizarUsuario(id, {
        EstadoRegistro: nuevoEstado === 'Activo' ? 1 : 0,
      });
      if (!await cargarUsuarios()) {
        setErrorOperacion('El servidor confirmó el cambio de estado, pero no se pudo actualizar la lista. Recarga la página para verificarlo.');
      }
    } catch (error) {
      setErrorOperacion(mensajeErrorApi(error, 'No se pudo cambiar el estado del usuario.'));
    } finally {
      guardandoRef.current = false;
      setOperandoId(null);
    }
  };

  const handleEliminar = async (u) => {
    if (operandoId !== null || guardandoRef.current) return;
    if (esMiCuenta(u)) {
      setErrorOperacion('No puedes eliminar tu propia cuenta.');
      return;
    }
    const nombre = resolverNombreCompleto(u);
    const id = u.idUsuario ?? u.IdUsuario ?? u.id_usuario ?? u.id;

    if (window.confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"?`)) {
      guardandoRef.current = true;
      setOperandoId(id ?? 'sin-id');
      setErrorOperacion('');
      try {
        await eliminarUsuario(id);
        if (!await cargarUsuarios()) {
          setErrorOperacion('El servidor confirmó la eliminación, pero no se pudo actualizar la lista. Recarga la página para verificarlo.');
        }
      } catch (error) {
        setErrorOperacion(mensajeErrorApi(error, 'No se pudo eliminar el usuario.'));
      } finally {
        guardandoRef.current = false;
        setOperandoId(null);
      }
    }
  };

  const cambiarPerfil = (idPerfil) => {
    // La API recibe un único IdPerfil, no un arreglo de asignaciones.
    setPerfilesSeleccionados((actuales) => actuales.includes(idPerfil) ? [] : [idPerfil]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((actual) => ({ ...actual, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (guardandoRef.current || operandoId !== null) return;
    setErrorOperacion('');
    const nuevosErrores = {};

    if (!formData.nombreUsuario.trim()) nuevosErrores.nombreUsuario = 'El nombre de usuario es obligatorio.';
    if (!DNI_REGEX.test(formData.dni.trim())) nuevosErrores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    if (!SOLO_LETRAS.test(formData.nombre.trim())) nuevosErrores.nombre = 'El nombre debe contener solo letras.';
    if (!SOLO_LETRAS.test(formData.apellido.trim())) nuevosErrores.apellido = 'El apellido paterno debe contener solo letras.';
    if (formData.apellidoMaterno.trim() && !SOLO_LETRAS.test(formData.apellidoMaterno.trim())) nuevosErrores.apellidoMaterno = 'El apellido materno debe contener solo letras.';
    if (!CORREO_PERMITIDO.test(formData.correo.trim())) nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    if ((!usuarioEditando || formData.contrasena) && !CONTRASENA_PERMITIDA.test(formData.contrasena)) {
      nuevosErrores.contrasena = 'La contraseña requiere mínimo 8 caracteres con letras y números.';
    }
    if (perfilesSeleccionados.length !== 1) nuevosErrores.perfiles = 'La API requiere seleccionar un único perfil.';
    if (usuarioEditando && esMiCuenta(usuarioEditando) &&
        (formData.estadoRegistro !== 'Activo' || String(perfilesSeleccionados[0]) !== String(user?.idPerfil ?? user?.IdPerfil))) {
      nuevosErrores.perfiles = 'No puedes desactivar tu cuenta ni cambiar tu propio perfil desde este módulo.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const primerPerfil = Number(perfilesSeleccionados[0]);
    const payloadUsuario = {
      apellidoMaterno: usuarioEditando?.ApellidoMaterno ?? usuarioEditando?.apellidoMaterno ?? '',
      celular: usuarioEditando?.Celular ?? usuarioEditando?.celular ?? '',
      ...formData,
      perfiles: perfilesSeleccionados.map(Number),
      idPerfil: primerPerfil,
      IdPerfil: primerPerfil
    };

    guardandoRef.current = true;
    setGuardando(true);
    try {
      if (usuarioEditando) {
        const id = usuarioEditando.idUsuario ?? usuarioEditando.IdUsuario ?? usuarioEditando.id_usuario ?? usuarioEditando.id;
        await actualizarUsuario(id, payloadUsuario);
      } else {
        await crearUsuario(payloadUsuario);
      }
      setIsModalOpen(false);
      if (!await cargarUsuarios()) {
        setErrorOperacion('El servidor confirmó el guardado, pero no se pudo actualizar la lista. Recarga la página para verificarlo.');
      }
    } catch (error) {
      setErrorOperacion(mensajeErrorApi(error, 'No se pudo guardar el usuario.'));
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

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

  useEffect(() => {
    cargarPerfiles();
    cargarUsuarios();
  }, []);

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-700 rounded-xl text-white">
              <Users className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Administración de credenciales, estados de acceso y roles institucionales
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold transition-colors text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {(errorUsuarios || errorPerfiles || errorOperacion) && (
        <p role="alert" className="text-[11px] text-rose-600 mb-4">
          {[errorUsuarios, errorPerfiles, errorOperacion].filter(Boolean).join(' ')}
        </p>
      )}

      {/* BUSCADOR */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por usuario, nombre completo, correo o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-xs"
        />
      </div>

      {/* TABLA DE USUARIOS */}
      {loadingUsuarios ? (
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-700" />
          <p className="text-xs">Cargando nómina de usuarios...</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <h2 className="text-sm font-semibold text-slate-600 mb-1">Sin registros coincidentes</h2>
          <p className="text-xs">No se encontraron usuarios para el criterio de búsqueda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">DNI</th>
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Nombre Completo</th>
                <th className="py-4 px-6">Correo</th>
                <th className="py-4 px-6">Rol / Perfil</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {usuariosFiltrados.map((u, idx) => {
                const idFila = u.idUsuario || u.IdUsuario || u.id_usuario || u.id || u.dni || idx;
                const estadoTxt = resolverEstado(u);
                const perfil = resolverPerfil(u);
                const esActivo = estadoTxt === 'Activo';

                return (
                  <tr key={idFila} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">
                      {resolverDni(u)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                      {resolverUsuario(u)}
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {resolverNombreCompleto(u)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {resolverCorreo(u)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${estiloBadgePerfil(perfil)}`}>
                        {perfil.etiqueta}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        esActivo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {estadoTxt}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5 text-slate-400">
                        <button
                          type="button"
                          disabled={operandoId !== null || guardando}
                          onClick={() => handleEditar(u)}
                          title="Editar usuario"
                          className="p-1.5 rounded-lg hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={operandoId !== null || guardando || esMiCuenta(u)}
                          onClick={() => handleToggleEstado(u)}
                          title={esActivo ? 'Bloquear acceso' : 'Desbloquear acceso'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            esActivo 
                              ? 'hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-amber-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {esActivo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          disabled={operandoId !== null || guardando || esMiCuenta(u)}
                          onClick={() => handleEliminar(u)}
                          title="Eliminar usuario"
                          className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/80 flex items-center justify-center p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={usuarioEditando ? 'Editar credenciales' : 'Registrar usuario'} tabIndex={-1} className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {usuarioEditando ? 'Editar Credenciales' : 'Registrar Nuevo Usuario'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={guardando}
                aria-label="Cerrar"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorOperacion && <p role="alert" className="text-[11px] text-rose-600">{errorOperacion}</p>}
              {errorPerfiles && <p role="alert" className="text-[11px] text-rose-600">{errorPerfiles}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="usuario-codigo" className="block text-xs font-semibold text-slate-700 mb-1">Nombre de Usuario</label>
                  <input
                    type="text"
                    name="nombreUsuario"
                    id="usuario-codigo"
                    readOnly={Boolean(usuarioEditando)}
                    value={formData.nombreUsuario}
                    onChange={handleChange}
                    placeholder="Ej: jperalta"
                    className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 outline-none ${
                      errores.nombreUsuario ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {usuarioEditando && <p className="text-[11px] text-slate-500 mt-1">La API no permite modificar el código de usuario.</p>}
                  {errores.nombreUsuario && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.nombreUsuario}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="usuario-dni" className="block text-xs font-semibold text-slate-700 mb-1">DNI (8 dígitos)</label>
                  <input
                    type="text"
                    name="dni"
                    id="usuario-dni"
                    inputMode="numeric"
                    maxLength={8}
                    value={formData.dni}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, dni: val }));
                    }}
                    placeholder="74839201"
                    className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 outline-none ${
                      errores.dni ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errores.dni && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.dni}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="usuario-nombre" className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    id="usuario-nombre"
                    value={formData.nombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]*$/.test(val)) {
                        setFormData((prev) => ({ ...prev, nombre: val }));
                      }
                    }}
                    placeholder="Juan"
                    className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 outline-none ${
                      errores.nombre ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errores.nombre && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="usuario-apellido" className="block text-xs font-semibold text-slate-700 mb-1">Apellido paterno</label>
                  <input
                    type="text"
                    name="apellido"
                    id="usuario-apellido"
                    value={formData.apellido}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]*$/.test(val)) {
                        setFormData((prev) => ({ ...prev, apellido: val }));
                      }
                    }}
                    placeholder="Pérez"
                    className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 outline-none ${
                      errores.apellido ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errores.apellido && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errores.apellido}
                    </p>
                  )}
                </div>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Apellido materno (opcional)
                <input name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} maxLength={100} className="mt-1 block w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600" />
                {errores.apellidoMaterno && <span className="text-rose-600">{errores.apellidoMaterno}</span>}
              </label>
              <div>
                <label htmlFor="usuario-correo" className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  name="correo"
                  id="usuario-correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 outline-none ${
                    errores.correo ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {errores.correo && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.correo}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="usuario-clave" className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña {usuarioEditando && <span className="text-slate-500 font-normal">(dejar en blanco para conservar la actual)</span>}
                </label>
                <input
                  type="password"
                  name="contrasena"
                  id="usuario-clave"
                  autoComplete="new-password"
                  value={formData.contrasena}
                  onChange={handleChange}
                  placeholder={usuarioEditando ? "••••••••••••••••" : "Mínimo 8 caracteres con letras y números"}
                  className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 outline-none ${
                    errores.contrasena ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {errores.contrasena && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.contrasena}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Perfil Asignado</label>
                <div className={`border rounded-xl p-3 bg-slate-50 ${errores.perfiles ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'}`}>
                  {perfilesAsignables.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No hay perfiles activos disponibles para asignar.</p>
                  ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {perfilesAsignables.map((perfil) => {
                      const id = Number(perfil.IdPerfil ?? perfil.idPerfil ?? perfil.id);
                      const nombre = perfil.Nombre || perfil.nombre;
                      return (
                        <label key={id} className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={perfilesSeleccionados.includes(id)}
                            onChange={() => cambiarPerfil(id)}
                            className="w-3.5 h-3.5 text-blue-700 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span>{nombre}</span>
                        </label>
                      );
                    })}
                  </div>
                  )}
                </div>
                {errores.perfiles && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.perfiles}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={guardando}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {guardando ? 'Guardando...' : usuarioEditando ? 'Actualizar Usuario' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
