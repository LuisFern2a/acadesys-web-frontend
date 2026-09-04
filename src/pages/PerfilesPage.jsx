import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Loader2, AlertCircle, RefreshCw, Trash2, Mail, CreditCard, Shield } from 'lucide-react';
import { obtenerUsuarios, obtenerPerfiles, crearUsuario } from '../services/api';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del modal de registro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    dni: '',
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    idPerfil: 2
  });

  // Cargar usuarios y perfiles
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataUsuarios, dataPerfiles] = await Promise.all([
        obtenerUsuarios(),
        obtenerPerfiles().catch(() => [])
      ]);

      const listaUsuarios = Array.isArray(dataUsuarios) ? dataUsuarios : dataUsuarios.data || [];
      const listaPerfiles = Array.isArray(dataPerfiles) ? dataPerfiles : dataPerfiles.data || [];

      setUsuarios(listaUsuarios);
      setPerfiles(listaPerfiles);
    } catch (err) {
      setError('Error al cargar la lista de usuarios desde el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper para resolver propiedades con mayúsculas/minúsculas de la BD
  const resolverDNI = (u) => u.DNI || u.dni || u.Dni || u.documento || '-';
  const resolverUsuario = (u) => u.NombreUsuario || u.nombreUsuario || u.usuario || u.Usuario || '-';
  const resolverNombre = (u) => {
    const nombres = u.Nombres || u.nombres || u.Nombre || u.nombre || '';
    const apellidos = u.Apellidos || u.apellidos || u.Apellido || u.apellido || '';
    const completo = `${nombres} ${apellidos}`.trim();
    return completo || resolverUsuario(u);
  };
  const resolverCorreo = (u) => u.Correo || u.correo || u.CorreoElectronico || u.email || '-';
  const resolverPerfil = (u) => {
    if (u.NombrePerfil || u.nombrePerfil || u.perfil || u.Perfil) {
      return u.NombrePerfil || u.nombrePerfil || u.perfil || u.Perfil;
    }
    const idPerfil = u.IdPerfil ?? u.idPerfil ?? u.id_perfil;
    const encontrado = perfiles.find(p => (p.id_perfil ?? p.IdPerfil ?? p.id) === Number(idPerfil));
    return encontrado ? (encontrado.Nombre || encontrado.nombre_perfil || encontrado.nombre) : 'Docente';
  };
  const resolverEstado = (u) => {
    const estado = u.EstadoRegistro ?? u.estadoRegistro ?? u.Estado ?? u.estado ?? 1;
    return String(estado) === '1' || String(estado).toUpperCase() === 'ACTIVO';
  };

  // Enviar nuevo usuario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.dni.length !== 8) {
      alert('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    try {
      setSaving(true);
      await crearUsuario({
        nombreUsuario: formData.nombreUsuario.trim(),
        dni: formData.dni.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        correo: formData.correo.trim(),
        contrasena: formData.contrasena,
        perfiles: [Number(formData.idPerfil)]
      });

      setIsModalOpen(false);
      setFormData({
        nombreUsuario: '',
        dni: '',
        nombre: '',
        apellido: '',
        correo: '',
        contrasena: '',
        idPerfil: 2
      });
      fetchData();
    } catch (err) {
      alert('Error al registrar usuario: ' + (err.message || 'Ocurrió un error'));
    } finally {
      setSaving(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      resolverUsuario(u).toLowerCase().includes(term) ||
      resolverNombre(u).toLowerCase().includes(term) ||
      resolverDNI(u).toLowerCase().includes(term) ||
      resolverCorreo(u).toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Administración de usuarios y asignación de perfiles</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-sm"
            title="Recargar datos"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
          >
            <Plus className="w-5 h-5" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Buscador */}
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

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-700 font-medium text-sm">Cargando usuarios desde el servidor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-slate-700 font-medium text-sm">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
            >
              Reintentar conexión
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6">DNI</th>
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Nombre Completo</th>
                <th className="py-4 px-6">Correo</th>
                <th className="py-4 px-6">Perfiles</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u, idx) => {
                  const idUnico = u.IdUsuario || u.id_usuario || u.id || idx;
                  const activo = resolverEstado(u);

                  return (
                    <tr key={idUnico} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">
                        {resolverDNI(u)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {resolverUsuario(u)}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {resolverNombre(u)}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {resolverCorreo(u)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          <Shield className="w-3 h-3 text-indigo-500" />
                          {resolverPerfil(u)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          activo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Registrar Nuevo Usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Usuario</label>
                  <input
                    type="text"
                    required
                    placeholder="usuario123"
                    value={formData.nombreUsuario}
                    onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">DNI (8 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="12345678"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Nombres</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombres"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    placeholder="Apellidos"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Perfil Asignado</label>
                <select
                  value={formData.idPerfil}
                  onChange={(e) => setFormData({ ...formData, idPerfil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 bg-white"
                >
                  {perfiles.length > 0 ? (
                    perfiles.map((p) => {
                      const id = p.id_perfil ?? p.IdPerfil ?? p.id;
                      const nombre = p.Nombre || p.nombre_perfil || p.nombre || `Perfil #${id}`;
                      return (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="1">Administrador</option>
                      <option value="2">Docente</option>
                      <option value="3">Padre</option>
                      <option value="4">Alumno</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}