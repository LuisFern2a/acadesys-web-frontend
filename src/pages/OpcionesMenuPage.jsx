import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, Plus, Search, Link as LinkIcon, Layers } from 'lucide-react';
import { obtenerOpcionesMenu, crearOpcionMenu, obtenerPerfiles, asignarMenuAPerfil } from '../services/api';

export default function OpcionesMenuPage() {
  const [menus, setMenus] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    ruta: '',
    descripcion: '',
    orden: 1,
    idPadre: '',
    idPerfil: ''
  });

  const extraerArreglo = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.perfiles)) return res.perfiles;
    if (res && Array.isArray(res.menus)) return res.menus;
    return [];
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resMenus, resPerfiles] = await Promise.all([
        obtenerOpcionesMenu().catch(() => []),
        obtenerPerfiles().catch(() => [])
      ]);

      setMenus(extraerArreglo(resMenus));
      setPerfiles(extraerArreglo(resPerfiles));
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // 1. Guardar la opción de menú en la API
      const respuestaMenu = await crearOpcionMenu(formData);
      const idMenuCreado = respuestaMenu?.id || respuestaMenu?.IdOpcionMenu || respuestaMenu?.data?.id || respuestaMenu?.data?.IdOpcionMenu;

      // 2. Si se seleccionó un perfil, vincular en OpcionesMenu_Perfiles
      if (formData.idPerfil && idMenuCreado) {
        await asignarMenuAPerfil(idMenuCreado, formData.idPerfil, formData.orden);
      }

      alert("¡Opción de menú guardada y asignada con éxito!");
      setIsModalOpen(false);
      setFormData({ nombre: '', ruta: '', descripcion: '', orden: 1, idPadre: '', idPerfil: '' });
      cargarDatos();
    } catch (error) {
      alert(`Error al guardar menú: ${error.message}`);
    }
  };

  const menusFiltrados = menus.filter(m => {
    const nom = m.Nombre || m.nombre || '';
    return nom.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <MenuIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Opciones de Menú</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Configuración jerárquica de menús y asignación a perfiles</p>
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
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Etiqueta Menú</th>
              <th className="py-4 px-6">Ruta / URL</th>
              <th className="py-4 px-6">Descripción</th>
              <th className="py-4 px-6">Jerarquía (Padre)</th>
              <th className="py-4 px-6">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {cargando ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400">Cargando opciones de menú desde la API...</td>
              </tr>
            ) : menusFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400">No hay opciones registradas. ¡Crea una con el botón Nueva Opción!</td>
              </tr>
            ) : (
              menusFiltrados.map((item) => {
                const id = item.IdOpcionMenu || item.id;
                const nombre = item.Nombre || item.nombre;
                const ruta = item.UrlMenu || item.ruta || '-';
                const descripcion = item.Descripcion || item.descripcion || '-';
                const idPadre = item.IdPadre;

                return (
                  <tr key={id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-400">#{id}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{nombre}</td>
                    <td className="py-4 px-6 text-indigo-600 flex items-center gap-1.5 font-mono text-xs">
                      <LinkIcon className="w-3.5 h-3.5" /> {ruta}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{descripcion}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {idPadre ? (
                        <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          <Layers className="w-3 h-3" /> Submenú de #{idPadre}
                        </span>
                      ) : (
                        <span className="text-slate-400">Menú Principal (Raíz)</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Activo
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ruta (UrlMenu)</label>
                <input required type="text" value={formData.ruta} onChange={e => setFormData({ ...formData, ruta: e.target.value })} placeholder="/calificaciones" className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label>
                  <input type="text" value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej: Registro de notas" className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Orden</label>
                  <input type="number" value={formData.orden} onChange={e => setFormData({ ...formData, orden: Number(e.target.value) })} className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm" />
                </div>
              </div>

              {/* COMBOBOX MENÚ PADRE */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Menú Padre (Submenú de:)</label>
                <select
                  value={formData.idPadre}
                  onChange={e => setFormData({ ...formData, idPadre: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm bg-white"
                >
                  <option value="">Ninguno (Es Menú Principal / Raíz)</option>
                  {menus.map(m => {
                    const mId = m.IdOpcionMenu || m.id;
                    const mNombre = m.Nombre || m.nombre;
                    return (
                      <option key={mId} value={mId}>
                        #{mId} - {mNombre}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* ASIGNAR A PERFIL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Asignar a Perfil</label>
                <select
                  value={formData.idPerfil}
                  onChange={e => setFormData({ ...formData, idPerfil: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl outline-none focus:border-indigo-600 text-sm bg-white"
                >
                  <option value="">Seleccionar Perfil...</option>
                  {perfiles.map((p, idx) => {
                    const pId = p.IdPerfil ?? p.idPerfil ?? p.Id ?? p.id ?? idx + 1;
                    const pNom = p.NombrePerfil ?? p.nombrePerfil ?? p.Nombre ?? p.nombre ?? p.Descripcion ?? p.descripcion ?? `Perfil #${pId}`;
                    return (
                      <option key={pId} value={pId}>
                        {pNom}
                      </option>
                    );
                  })}
                </select>
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