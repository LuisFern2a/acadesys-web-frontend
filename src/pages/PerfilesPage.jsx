import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Loader2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

const API_URL = 'https://acadesys-api.onrender.com/api/perfiles';

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre_perfil: '',
    descripcion: '',
    estado: 'ACTIVO'
  });

  // Función para listar perfiles desde el backend
  const fetchPerfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener los datos de la API');
      const data = await res.json();
      setPerfiles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError('El servidor está iniciando o hubo un problema de conexión. Intenta de nuevo en unos segundos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfiles();
  }, []);

  // Guardar nuevo perfil (POST compatible con múltiples nombres de campo)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        Nombre: formData.nombre_perfil,
        nombre: formData.nombre_perfil,
        nombre_perfil: formData.nombre_perfil,
        NombrePerfil: formData.nombre_perfil,
        Descripcion: formData.descripcion,
        descripcion: formData.descripcion,
        Estado: formData.estado,
        estado: formData.estado
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || responseData.message || 'Error al guardar el perfil');
      }

      setIsModalOpen(false);
      setFormData({ nombre_perfil: '', descripcion: '', estado: 'ACTIVO' });
      fetchPerfiles(); // Recargar la lista
    } catch (err) {
      alert('Error al registrar perfil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredPerfiles = perfiles.filter(p => 
    (p.Nombre || p.nombre_perfil || p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.Descripcion || p.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Perfiles</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Gestión de roles y niveles de acceso a la plataforma</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={fetchPerfiles}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-sm"
            title="Recargar datos"
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

      {/* Tabla con estados de Carga / Error */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-700 font-medium text-sm">Cargando perfiles desde el servidor...</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm">Si es la primera petición, el servidor de Render puede tardar ~50 segundos en despertar.</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-slate-700 font-medium text-sm">{error}</p>
            <button 
              onClick={fetchPerfiles}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
            >
              Reintentar conexión
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Nombre del Perfil</th>
                <th className="py-4 px-6">Descripción</th>
                <th className="py-4 px-6">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredPerfiles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    No se encontraron perfiles registrados.
                  </td>
                </tr>
              ) : (
                filteredPerfiles.map((p, idx) => (
                  <tr key={p.id_perfil || p.id || p.Id || idx} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-400">#{p.id_perfil || p.id || p.Id || idx + 1}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{p.Nombre || p.nombre_perfil || p.nombre}</td>
                    <td className="py-4 px-6 text-slate-500">{p.Descripcion || p.descripcion || 'Sin descripción'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        ((p.Estado || p.estado || '').toUpperCase() === 'ACTIVO')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.Estado || p.estado || 'ACTIVO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para Crear Perfil */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Registrar Nuevo Perfil</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del Perfil</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Coordinador Académico"
                  value={formData.nombre_perfil}
                  onChange={(e) => setFormData({ ...formData, nombre_perfil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label>
                <textarea
                  placeholder="Describe los permisos o alcance del rol..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
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