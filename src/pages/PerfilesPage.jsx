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
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para crear / editar perfil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  // Catálogo base institucional RBAC
  const perfilesBase = [
    { 
      IdPerfil: 1, 
      Nombre: 'Administrador', 
      Descripcion: 'Acceso total a métricas institucionales, asignaciones docentes, seguridad y usuarios.', 
      EstadoRegistro: 1 
    },
    { 
      IdPerfil: 2, 
      Nombre: 'Docente', 
      Descripcion: 'Control de asistencia, cuaderno de calificaciones bimestrales y publicación de circulares.', 
      EstadoRegistro: 1 
    },
    { 
      IdPerfil: 3, 
      Nombre: 'Padre', 
      Descripcion: 'Visualización de boletas de notas de hijos, alertas de asistencia y comunicados directivos.', 
      EstadoRegistro: 1 
    },
    { 
      IdPerfil: 4, 
      Nombre: 'Alumno', 
      Descripcion: 'Consulta de calificaciones personales, agenda escolar e interacción con el Tutor Pedagógico IA.', 
      EstadoRegistro: 1 
    }
  ];

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
      let lista = [];
      if (typeof obtenerPerfiles === 'function') {
        const res = await obtenerPerfiles();
        lista = extraerArreglo(res);
      }
      setPerfiles(lista.length > 0 ? lista : perfilesBase);
    } catch (err) {
      console.warn('Usando perfiles base locales ante error de conexión:', err);
      setPerfiles(perfilesBase);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfiles();
  }, []);

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({ nombre: '', descripcion: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (p) => {
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    setEditandoId(id);
    setFormData({
      nombre: p.Nombre || p.nombre || p.nombre_perfil || '',
      descripcion: p.Descripcion || p.descripcion || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (p) => {
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    const estadoActual = p.EstadoRegistro ?? p.estadoRegistro ?? 1;
    const nuevoEstado = String(estadoActual) === '1' || String(estadoActual).toUpperCase() === 'ACTIVO' ? 0 : 1;

    try {
      if (typeof actualizarPerfil === 'function') {
        await actualizarPerfil(id, { ...p, EstadoRegistro: nuevoEstado, estadoRegistro: nuevoEstado });
      }
    } catch (err) {
      console.warn('Actualización local de estado del perfil:', err);
    }

    setPerfiles(prev => prev.map(item => {
      const itemId = item.IdPerfil ?? item.id_perfil ?? item.id;
      return itemId === id ? { ...item, EstadoRegistro: nuevoEstado, estadoRegistro: nuevoEstado } : item;
    }));
  };

  const handleEliminar = async (p) => {
    const id = p.IdPerfil ?? p.id_perfil ?? p.id;
    const nombre = p.Nombre || p.nombre || `Perfil #${id}`;

    if (window.confirm(`¿Estás seguro de eliminar el rol "${nombre}"? Los usuarios vinculados deberán ser reasignados.`)) {
      try {
        if (typeof eliminarPerfil === 'function') {
          await eliminarPerfil(id);
        }
      } catch (err) {
        console.warn('Eliminación local de perfil:', err);
      }
      setPerfiles(prev => prev.filter(item => {
        const itemId = item.IdPerfil ?? item.id_perfil ?? item.id;
        return itemId !== id;
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setSaving(true);
    const payload = {
      nombre: formData.nombre.trim(),
      Nombre: formData.nombre.trim(),
      nombrePerfil: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      Descripcion: formData.descripcion.trim(),
      EstadoRegistro: 1
    };

    try {
      if (editandoId) {
        if (typeof actualizarPerfil === 'function') {
          await actualizarPerfil(editandoId, payload);
        }
        setPerfiles(prev => prev.map(item => {
          const itemId = item.IdPerfil ?? item.id_perfil ?? item.id;
          return itemId === editandoId ? { ...item, ...payload } : item;
        }));
      } else {
        const nuevo = { ...payload, IdPerfil: Date.now(), id: Date.now() };
        if (typeof crearPerfil === 'function') {
          await crearPerfil(payload);
        }
        setPerfiles(prev => [...prev, nuevo]);
      }
      setIsModalOpen(false);
      setFormData({ nombre: '', descripcion: '' });
    } catch (err) {
      console.warn('Guardado local ante contingencia de red:', err);
      setIsModalOpen(false);
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
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-sm cursor-pointer"
            title="Sincronizar perfiles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Perfil
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar rol por nombre o descripción de accesos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-xs"
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
          <div className="p-8 text-center flex flex-col items-center justify-center">
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
            <h3 className="text-sm font-semibold text-slate-700">Sin coincidencias</h3>
            <p className="text-xs text-slate-400 mt-1">No hay roles que coincidan con la búsqueda ingresada.</p>
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
                {perfilesFiltrados.map((p, idx) => {
                  const id = p.IdPerfil ?? p.id_perfil ?? p.id ?? idx + 1;
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
                            title="Editar perfil"
                            className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(p)}
                            title={activo ? 'Desactivar rol' : 'Activar rol'}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 transition"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 transition resize-none"
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