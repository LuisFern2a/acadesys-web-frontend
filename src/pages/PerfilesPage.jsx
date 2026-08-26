import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Search, Loader2 } from 'lucide-react';

const API_URL = 'https://acadesys-api.onrender.com/api/perfiles';

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nombrePerfil: '', descripcion: '', estadoRegistro: 'Activo' });

  const fetchPerfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setPerfiles(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Error al conectar con la API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfiles();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const nuevo = {
      IdPerfil: Date.now(),
      NombrePerfil: formData.nombrePerfil,
      Descripcion: formData.descripcion,
      EstadoRegistro: formData.estadoRegistro
    };
    setPerfiles([...perfiles, nuevo]);
    setIsModalOpen(false);
    setFormData({ nombrePerfil: '', descripcion: '', estadoRegistro: 'Activo' });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Confirmas la eliminación lógica de este perfil?')) {
      setPerfiles(perfiles.map(p => {
        const pId = p.IdPerfil || p.id;
        return pId === id ? { ...p, EstadoRegistro: 'Inactivo', estadoRegistro: 'Inactivo' } : p;
      }));
    }
  };

  const filtered = perfiles.filter(p => {
    const name = p.NombrePerfil || p.nombrePerfil || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Perfiles</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Gestión de roles y niveles de acceso a la plataforma </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Perfil
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar perfil por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Consultando datos en la nube (Render)...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Nombre del Perfil</th>
                  <th className="py-4 px-6">Descripción</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      No hay perfiles disponibles o no coinciden con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const id = item.IdPerfil || item.id;
                    const nombre = item.NombrePerfil || item.nombrePerfil;
                    const desc = item.Descripcion || item.descripcion || 'Sin descripción';
                    const estado = item.EstadoRegistro || item.estadoRegistro || 'Activo';

                    return (
                      <tr key={id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-400">#{id}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800">{nombre}</td>
                        <td className="py-4 px-6 max-w-xs truncate">{desc}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {estado}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Crear Nuevo Perfil</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.nombrePerfil}
                  onChange={(e) => setFormData({ ...formData, nombrePerfil: e.target.value })}
                  placeholder="Ej: Administrador, Docente, Alumno"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label>
                <textarea
                  rows="3"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Permisos del perfil..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 text-sm resize-none"
                />
              </div>
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}