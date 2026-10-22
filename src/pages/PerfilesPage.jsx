import React, { useState, useEffect, useRef } from 'react';
import useModalDialog from '../hooks/useModalDialog';
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
import { grupoDeRol, GRUPO_ADMIN, GRUPO_DOCENTE, GRUPO_PADRE, GRUPO_ALUMNO } from '../utils/roles';

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorAccion, setErrorAccion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para crear / editar perfil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const dialogRef = useModalDialog(isModalOpen, () => setIsModalOpen(false), saving);
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
    if (savingRef.current || loading) return;
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    const estado = p.EstadoRegistro ?? p.estadoRegistro ?? p.estado ?? 1;
    const activo = String(estado) === '1' || String(estado).toUpperCase() === 'ACTIVO';
    const nuevoEstado = activo ? 0 : 1;

    setErrorAccion('');
    savingRef.current = true;
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
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEliminar = async (p) => {
    if (savingRef.current || loading) return;
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    const nombre = p.Nombre || p.nombre || `Perfil #${id}`;

    if (window.confirm(`¿Estás seguro de eliminar el rol "${nombre}"? Los usuarios vinculados deberán ser reasignados.`)) {
      setErrorAccion('');
      savingRef.current = true;
      setSaving(true);
      try {
        await eliminarPerfil(id);
        if (!await cargarPerfiles()) {
          setErrorAccion('El servidor confirmó la eliminación, pero no se pudo recargar el catálogo. Reintenta la consulta para verificar los datos actuales.');
        }
      } catch (err) {
        setErrorAccion(err.message || 'No se pudo eliminar el perfil.');
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (savingRef.current || loading) return;
    setErrorAccion('');
    if (!formData.nombre.trim()) {
      setErrorAccion('Ingresa el nombre del perfil.');
      return;
    }

    savingRef.current = true;
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
      savingRef.current = false;
      setSaving(false);
    }
  };

  const resolverBadgeColor = (nombre = '') => {
    // Color de etiqueta por perfil exacto (solo presentación, no autorización).
    const grupo = grupoDeRol(nombre);
    if (grupo === GRUPO_ADMIN) return 'bg-teal-600 text-white border-teal-600';
    if (grupo === GRUPO_DOCENTE) return 'bg-teal-50 text-teal-700 border-teal-100';
    if (grupo === GRUPO_PADRE) return 'bg-teal-100 text-teal-800 border-teal-200';
    if (grupo === GRUPO_ALUMNO) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const perfilesFiltrados = perfiles.filter((p) => {
    const nom = (p.Nombre || p.nombre || p.nombre_perfil || p.NombrePerfil || '').toLowerCase();
    const desc = (p.Descripcion || p.descripcion || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return nom.includes(query) || desc.includes(query);
  });

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-xl text-white">
              <Shield className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Seguridad y Perfiles RBAC</h1>
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
            className="p-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Sincronizar perfiles"
            aria-label="Sincronizar perfiles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={abrirModalCrear}
            disabled={loading || saving}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg font-bold transition-colors text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo Perfil
          </button>
        </div>
      </div>

      {errorAccion && <p role="alert" className="text-xs text-rose-600 mb-4">{errorAccion}</p>}

      {/* Buscador */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar rol por nombre o descripción de accesos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-xs"
        />
      </div>

      {/* Tabla de Perfiles */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-teal-700 animate-spin mb-3" aria-hidden="true" />
            <p className="text-slate-500 font-medium text-xs">Cargando catálogo de perfiles...</p>
          </div>
        ) : error ? (
          <div role="alert" className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-600 mb-2" aria-hidden="true" />
            <p className="text-slate-700 font-medium text-xs">{error}</p>
            <button
              type="button"
              onClick={cargarPerfiles}
              className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : perfilesFiltrados.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-700">{perfiles.length === 0 ? 'No hay perfiles registrados' : 'Sin coincidencias'}</h3>
            <p className="text-xs text-slate-500 mt-1">{perfiles.length === 0 ? 'El servidor no devolvió perfiles activos o inactivos.' : 'No hay roles que coincidan con la búsqueda ingresada.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">ID</th>
                  <th className="py-4 px-6 font-semibold">Perfil Institucional</th>
                  <th className="py-4 px-6 font-semibold">Descripción de Alcance</th>
                  <th className="py-4 px-6 text-center font-semibold">Estado</th>
                  <th className="py-4 px-6 text-center font-semibold">Acciones</th>
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
                    <tr key={id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">#{id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-xs ${resolverBadgeColor(nombre)}`}>
                            <Shield className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{nombre}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-md leading-relaxed">
                        {descripcion}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
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
                            aria-label={`Editar ${nombre}`}
                            className="p-1.5 rounded-lg hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(p)}
                            disabled={loading || saving}
                            title={activo ? 'Desactivar perfil' : 'Activar perfil'}
                            aria-label={activo ? `Desactivar ${nombre}` : `Activar ${nombre}`}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              activo
                                ? 'hover:text-amber-600 hover:bg-amber-50'
                                : 'text-amber-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {activo ? <Lock className="w-4 h-4" aria-hidden="true" /> : <Unlock className="w-4 h-4" aria-hidden="true" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminar(p)}
                            disabled={loading || saving}
                            title="Eliminar perfil"
                            aria-label={`Eliminar ${nombre}`}
                            className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
        <div className="fixed inset-0 z-50 bg-[#0F172A]/80 flex items-center justify-center p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Perfil de acceso" tabIndex={-1} className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editandoId ? 'Actualizar Perfil RBAC' : 'Registrar Nuevo Perfil'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                aria-label="Cerrar"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorAccion && <p role="alert" className="text-xs text-rose-600">{errorAccion}</p>}
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
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
