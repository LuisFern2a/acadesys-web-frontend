import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Loader2, AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { obtenerPerfiles } from '../services/api';

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para nuevo perfil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const extraerArreglo = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.perfiles)) return res.perfiles;
    return [];
  };

  const cargarPerfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await obtenerPerfiles();
      const lista = extraerArreglo(res);
      setPerfiles(lista);
    } catch (err) {
      console.error('Error al cargar perfiles:', err);
      setError('No se pudieron obtener los perfiles desde el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfiles();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre del perfil es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nombre: formData.nombre.trim(),
        Nombre: formData.nombre.trim(),
        nombrePerfil: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        Descripcion: formData.descripcion.trim()
      };

      if (typeof crearPerfil === 'function') {
        await crearPerfil(payload);
      } else {
        // Fallback directo a la API si no existiera la función en api.js
        await fetch('https://acadesys-api.onrender.com/api/perfiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      alert('¡Perfil creado exitosamente!');
      setIsModalOpen(false);
      setFormData({ nombre: '', descripcion: '' });
      await cargarPerfiles();
    } catch (err) {
      alert(`Error al registrar el perfil: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const perfilesFiltrados = perfiles.filter((p) => {
    const nom = (p.Nombre || p.nombre || p.nombre_perfil || p.NombrePerfil || '').toLowerCase();
    const desc = (p.Descripcion || p.descripcion || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return nom.includes(query) || desc.includes(query);
  });

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Perfiles</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Administración de roles institucionales y permisos de acceso RBAC
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={cargarPerfiles}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-sm"
            title="Recargar perfiles"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
          >
            <Plus className="w-5 h-5" /> Nuevo Perfil
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar perfil por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* Tabla de Perfiles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-700 font-medium text-sm">Cargando perfiles desde la base de datos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-slate-700 font-medium text-sm">{error}</p>
            <button
              onClick={cargarPerfiles}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
            >
              Reintentar
            </button>
          </div>
        ) : perfilesFiltrados.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700">Sin perfiles encontrados</h3>
            <p className="text-xs text-slate-400 mt-1">No hay roles registrados que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Nombre del Perfil</th>
                <th className="py-4 px-6">Descripción</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {perfilesFiltrados.map((p, idx) => {
                const id = p.IdPerfil ?? p.id_perfil ?? p.id ?? idx + 1;
                const nombre = p.Nombre || p.nombre || p.nombre_perfil || p.NombrePerfil || `Perfil #${id}`;
                const descripcion = p.Descripcion || p.descripcion || 'Sin descripción asignada';
                const estado = p.EstadoRegistro ?? p.estadoRegistro ?? p.estado ?? 1;
                const activo = String(estado) === '1' || String(estado).toUpperCase() === 'ACTIVO';

                return (
                  <tr key={id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-400">#{id}</td>
                    <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Shield className="w-4 h-4" />
                      </span>
                      {nombre}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{descripcion}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          activo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear Perfil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Registrar Nuevo Perfil</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nombre del Perfil
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Auxiliar, Coordinador, etc."
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe las responsabilidades o accesos de este rol..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}