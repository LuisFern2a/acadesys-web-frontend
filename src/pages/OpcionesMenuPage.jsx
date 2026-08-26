import React, { useState } from 'react';
import { Menu as MenuIcon, Plus, Trash2, Search, Link as LinkIcon } from 'lucide-react';

export default function OpcionesMenuPage() {
  const [menus, setMenus] = useState([
    { id: 1, nombre: 'Dashboard General', ruta: '/dashboard', icono: 'LayoutDashboard', orden: 1, estado: 'Activo' },
    { id: 2, nombre: 'Gestión de Perfiles', ruta: '/perfiles', icono: 'ShieldCheck', orden: 2, estado: 'Activo' },
    { id: 3, nombre: 'Gestión de Usuarios', ruta: '/usuarios', icono: 'Users', orden: 3, estado: 'Activo' },
    { id: 4, nombre: 'Opciones de Menú', ruta: '/menu-options', icono: 'Menu', orden: 4, estado: 'Activo' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', ruta: '', icono: '', orden: 1 });

  const handleSave = (e) => {
    e.preventDefault();
    setMenus([...menus, { id: Date.now(), ...formData, estado: 'Activo' }]);
    setIsModalOpen(false);
    setFormData({ nombre: '', ruta: '', icono: '', orden: 1 });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar opción de menú de forma lógica?')) {
      setMenus(menus.map(m => m.id === id ? { ...m, estado: 'Inactivo' } : m));
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <MenuIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Opciones de Menú</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Configuración del árbol de navegación dinámica </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
        >
          <Plus className="w-5 h-5" /> Nueva Opción
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar opción por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase">
              <th className="py-4 px-6">Orden</th>
              <th className="py-4 px-6">Etiqueta Menú</th>
              <th className="py-4 px-6">Ruta</th>
              <th className="py-4 px-6">Icono</th>
              <th className="py-4 px-6">Estado</th>
              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {menus.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="py-4 px-6 font-semibold text-slate-400">#{item.orden}</td>
                <td className="py-4 px-6 font-semibold text-slate-800">{item.nombre}</td>
                <td className="py-4 px-6 text-indigo-600 flex items-center gap-1.5 font-mono text-xs">
                  <LinkIcon className="w-3.5 h-3.5" /> {item.ruta}
                </td>
                <td className="py-4 px-6 font-mono text-xs text-slate-500">{item.icono}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {item.estado}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Nueva Opción de Menú</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Calificaciones" className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ruta</label>
                <input required type="text" value={formData.ruta} onChange={e => setFormData({ ...formData, ruta: e.target.value })} placeholder="/calificaciones" className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Icono</label>
                  <input type="text" value={formData.icono} onChange={e => setFormData({ ...formData, icono: e.target.value })} placeholder="BookOpen" className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Orden</label>
                  <input type="number" value={formData.orden} onChange={e => setFormData({ ...formData, orden: Number(e.target.value) })} className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}