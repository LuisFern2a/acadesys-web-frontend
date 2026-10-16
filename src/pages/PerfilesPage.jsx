import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Pencil, 
  Trash2, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { obtenerPerfiles, crearPerfil, actualizarPerfil, eliminarPerfil } from '../services/api';

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorAccion, setErrorAccion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para crear / editar perfil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const extraerArreglo = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.perfiles)) return res.perfiles;
    throw new Error('El servidor devolvió un formato de perfiles no válido.');
  };

  const cargarPerfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorAccion('');
      const res = await obtenerPerfiles();
      const lista = extraerArreglo(res);
      if (lista.some((p) => !p || typeof p !== 'object' ||
        !Number.isSafeInteger(Number(p.IdPerfil ?? p.id_perfil ?? p.id)) ||
        Number(p.IdPerfil ?? p.id_perfil ?? p.id) <= 0)) {
        throw new Error('El servidor devolvió perfiles sin identificadores válidos.');
      }
      setPerfiles(lista);
      return true;
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los perfiles.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfiles();
  }, []);

  const abrirModalCrear = () => {
    setErrorAccion('');
    setEditandoId(null);
    setFormData({ nombre: '', descripcion: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (p) => {
    setErrorAccion('');
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    setEditandoId(id);
    setFormData({
      nombre: p.Nombre || p.NombrePerfil || p.nombre || p.nombre_perfil || '',
      descripcion: p.Descripcion || p.descripcion || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (p) => {
    if (saving || loading) return;
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    const estado = p.EstadoRegistro ?? p.estadoRegistro ?? p.estado ?? 1;
    const activo = String(estado) === '1' || String(estado).toUpperCase() === 'ACTIVO';
    const nuevoEstado = activo ? 0 : 1;

    setErrorAccion('');
    setSaving(true);
    try {
      await actualizarPerfil(id, { EstadoRegistro: nuevoEstado });
      // El estado visual solo cambia al recargar el catálogo desde el servidor.
      if (!await cargarPerfiles()) {
        setErrorAccion('El servidor confirmó el cambio de estado, pero no se pudo recargar el catálogo. Reintenta la consulta para verificar el estado real.');
      }
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo cambiar el estado del perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (p) => {
    if (saving || loading) return;
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    const nombre = p.Nombre || p.nombre || `Perfil #${id}`;

    if (window.confirm(`¿Estás seguro de eliminar el rol "${nombre}"? Los usuarios vinculados deberán ser reasignados.`)) {
      setErrorAccion('');
      setSaving(true);
      try {
        await eliminarPerfil(id);
        if (!await cargarPerfiles()) {
          setErrorAccion('El servidor confirmó la eliminación, pero no se pudo recargar el catálogo. Reintenta la consulta para verificar los datos actuales.');
        }
      } catch (err) {
        setErrorAccion(err.message || 'No se pudo eliminar el perfil.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || loading) return;
    setErrorAccion('');
    if (!formData.nombre.trim()) {
      setErrorAccion('Ingresa el nombre del perfil.');
      return;
    }

    setSaving(true);
    const payload = {
      NombrePerfil: formData.nombre.trim(),
      Descripcion: formData.descripcion.trim()
    };

    try {
      if (editandoId) {
        await actualizarPerfil(editandoId, payload);
      } else {
        await crearPerfil(payload);
      }
      setIsModalOpen(false);
      setFormData({ nombre: '', descripcion: '' });
      if (!await cargarPerfiles()) {
        setErrorAccion('El servidor confirmó el guardado, pero no se pudo recargar el catálogo. Reintenta la consulta antes de volver a guardar.');
      }
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const resolverBadgeColor = (nombre = '') => {
    const n = nombre.toLowerCase();
    if (n.includes('admin')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (n.includes('docente')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (n.includes('padre')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (n.includes('alumno')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  const perfilesFiltrados = perfiles.filter((p) => {
    const nom = (p.Nombre || p.nombre || p.nombre_perfil || p.NombrePerfil || '').toLowerCase();
    const desc = (p.Descripcion || p.descripcion || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return nom.includes(query) || desc.includes(query);
  });

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Seguridad y Perfiles RBAC</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Administración de roles institucionales, privilegios de acceso y jerarquías
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarPerfiles}
            disabled={loading || saving}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-sm cursor-pointer"
            title="Sincronizar perfiles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={abrirModalCrear}
            disabled={loading || saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Perfil
          </button>
        </div>
      </div>

      {errorAccion && <p role="alert" className="text-xs text-rose-500 mb-4">{errorAccion}</p>}

      {/* Buscador */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar rol por nombre o descripción de accesos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-500 text-xs"
        />
      </div>

      {/* Tabla de Perfiles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-700 font-medium text-xs">Cargando catálogo de perfiles...</p>
          </div>
        ) : error ? (
          <div role="alert" className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-slate-700 font-medium text-xs">{error}</p>
            <button
              type="button"
              onClick={cargarPerfiles}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : perfilesFiltrados.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700">{perfiles.length === 0 ? 'No hay perfiles registrados' : 'Sin coincidencias'}</h3>
            <p className="text-xs text-slate-400 mt-1">{perfiles.length === 0 ? 'El servidor no devolvió perfiles activos o inactivos.' : 'No hay roles que coincidan con la búsqueda ingresada.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Perfil Institucional</th>
                  <th className="py-4 px-6">Descripción de Alcance</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {perfilesFiltrados.map((p) => {
                  const id = p.IdPerfil ?? p.id_perfil ?? p.id;
                  const nombre = p.Nombre || p.nombre || p.nombre_perfil || p.NombrePerfil || `Perfil #${id}`;
                  const descripcion = p.Descripcion || p.descripcion || 'Sin descripción asignada';
                  const estado = p.EstadoRegistro ?? p.estadoRegistro ?? p.estado ?? 1;
                  const activo = String(estado) === '1' || String(estado).toUpperCase() === 'ACTIVO';

                  return (
                    <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-400">#{id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center border font-bold text-xs ${resolverBadgeColor(nombre)}`}>
                            <Shield className="w-4 h-4" />
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{nombre}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-md leading-relaxed">
                        {descripcion}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(p)}
                            disabled={loading || saving}
                            title="Editar perfil"
                            className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(p)}
                            disabled={loading || saving}
                            title={activo ? 'Desactivar perfil' : 'Activar perfil'}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              activo 
                                ? 'hover:text-amber-600 hover:bg-amber-50' 
                                : 'text-amber-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {activo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminar(p)}
                            disabled={loading || saving}
                            title="Eliminar perfil"
                            className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
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
      </div>

      {/* Modal Crear / Editar Perfil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                {editandoId ? 'Actualizar Perfil RBAC' : 'Registrar Nuevo Perfil'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorAccion && <p role="alert" className="text-xs text-rose-500">{errorAccion}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Rol / Perfil
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Coordinador Académico"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-500 outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción y Alcance de Accesos
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe las atribuciones y módulos permitidos para este rol..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-500 outline-none focus:border-indigo-600 transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Registrar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
