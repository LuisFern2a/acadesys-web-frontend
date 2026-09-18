import React, { useState, useEffect } from 'react';
import { 
  Menu as MenuIcon, 
  Plus, 
  Search, 
  Link as LinkIcon, 
  Layers, 
  Loader2, 
  X, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { obtenerOpcionesMenu, crearOpcionMenu, obtenerPerfiles, asignarMenuAPerfil } from '../services/api';

export default function OpcionesMenuPage() {
  const [menus, setMenus] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
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

  const menusBase = [
    { IdOpcionMenu: 1, Nombre: 'Dashboard', Ruta: '/dashboard', Descripcion: 'Panel general de métricas y rendimiento institucional', IdPadre: null },
    { IdOpcionMenu: 2, Nombre: 'Asistencia', Ruta: '/asistencia', Descripcion: 'Control diario de asistencias, tardanzas y justificaciones', IdPadre: null },
    { IdOpcionMenu: 3, Nombre: 'Registrar Notas', Ruta: '/registro-notas', Descripcion: 'Ingreso bimestral de notas por ponderación vigesimal', IdPadre: null },
    { IdOpcionMenu: 4, Nombre: 'Comunicados', Ruta: '/comunicados', Descripcion: 'Circulares institucionales y agenda directiva', IdPadre: null },
    { IdOpcionMenu: 5, Nombre: 'Académico', Ruta: '/academico', Descripcion: 'Gestión de salones, cursos y carga horaria docente', IdPadre: null },
    { IdOpcionMenu: 6, Nombre: 'Calificaciones', Ruta: '/calificaciones', Descripcion: 'Boletas individuales y posición en el ranking de aula', IdPadre: null },
    { IdOpcionMenu: 7, Nombre: 'Tutor IA', Ruta: '/tutor-ia', Descripcion: 'Asistente pedagógico inteligente y refuerzo escolar', IdPadre: null },
    { IdOpcionMenu: 8, Nombre: 'Perfiles', Ruta: '/perfiles', Descripcion: 'Administración de roles institucionales y privilegios RBAC', IdPadre: null },
    { IdOpcionMenu: 9, Nombre: 'Usuarios', Ruta: '/usuarios', Descripcion: 'Gestión de credenciales, cuentas y control de accesos', IdPadre: null }
  ];

  const perfilesBase = [
    { IdPerfil: 1, Nombre: 'Administrador' },
    { IdPerfil: 2, Nombre: 'Docente' },
    { IdPerfil: 3, Nombre: 'Padre' },
    { IdPerfil: 4, Nombre: 'Alumno' }
  ];

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
        obtenerOpcionesMenu ? obtenerOpcionesMenu().catch(() => null) : null,
        obtenerPerfiles ? obtenerPerfiles().catch(() => null) : null
      ]);

      const listaMenus = extraerArreglo(resMenus);
      const listaPerfiles = extraerArreglo(resPerfiles);

      setMenus(listaMenus.length > 0 ? listaMenus : menusBase);
      setPerfiles(listaPerfiles.length > 0 ? listaPerfiles : perfilesBase);
    } catch (error) {
      console.warn("Cargando catálogo local de menús:", error);
      setMenus(menusBase);
      setPerfiles(perfilesBase);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.ruta.trim()) return;

    setGuardando(true);
    try {
      const payloadMenu = {
        nombre: formData.nombre.trim(),
        Nombre: formData.nombre.trim(),
        ruta: formData.ruta.trim(),
        UrlMenu: formData.ruta.trim(),
        descripcion: formData.descripcion.trim(),
        Descripcion: formData.descripcion.trim(),
        orden: Number(formData.orden) || 1,
        Orden: Number(formData.orden) || 1,
        idPadre: formData.idPadre ? Number(formData.idPadre) : null,
        IdPadre: formData.idPadre ? Number(formData.idPadre) : null,
      };

      let respuestaMenu = null;
      if (typeof crearOpcionMenu === 'function') {
        respuestaMenu = await crearOpcionMenu(payloadMenu);
      }

      const idMenuCreado = 
        respuestaMenu?.IdOpcionMenu ||
        respuestaMenu?.id ||
        Date.now();

      if (formData.idPerfil && typeof asignarMenuAPerfil === 'function') {
        await asignarMenuAPerfil(Number(idMenuCreado), Number(formData.idPerfil), Number(formData.orden) || 1);
      }

      setMenus(prev => [...prev, { ...payloadMenu, IdOpcionMenu: idMenuCreado }]);
      setIsModalOpen(false);
      setFormData({ nombre: '', ruta: '', descripcion: '', orden: 1, idPadre: '', idPerfil: '' });
    } catch (error) {
      console.warn("Guardado local de menú:", error);
      setIsModalOpen(false);
    } finally {
      setGuardando(false);
    }
  };

  const menusFiltrados = menus.filter(m => {
    const nom = m.Nombre || m.nombre || '';
    const rut = m.UrlMenu || m.url_menu || m.ruta || m.Url || '';
    const term = searchTerm.toLowerCase();
    return nom.toLowerCase().includes(term) || rut.toLowerCase().includes(term);
  });

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <MenuIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Opciones del Menú Institucional</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Configuración de accesos de navegación y mapeo por perfiles de usuario
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDatos}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition shadow-sm cursor-pointer"
            title="Recargar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nueva Opción
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar opción por nombre o ruta de acceso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-xs"
        />
      </div>

      {/* Tabla de Menús */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Etiqueta Menú</th>
                <th className="py-4 px-6">Ruta del Módulo</th>
                <th className="py-4 px-6">Descripción de Función</th>
                <th className="py-4 px-6">Jerarquía</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span className="text-xs">Cargando catálogo de navegación...</span>
                  </td>
                </tr>
              ) : menusFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron opciones para el filtro ingresado.
                  </td>
                </tr>
              ) : (
                menusFiltrados.map((item, idx) => {
                  const id = item.IdOpcionMenu || item.id || item.id_opcion_menu || idx + 1;
                  const nombre = item.Nombre || item.nombre || '-';
                  const ruta = item.UrlMenu || item.url_menu || item.ruta || item.Url || '-';
                  const descripcion = item.Descripcion || item.descripcion || '-';
                  const idPadre = item.IdPadre ?? item.idPadre ?? item.id_padre;

                  return (
                    <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-400">#{id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800 text-xs">{nombre}</td>
                      <td className="py-4 px-6 text-indigo-600 font-mono text-xs">
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          <LinkIcon className="w-3.5 h-3.5" /> {ruta}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-sm">{descripcion}</td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {idPadre ? (
                          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            <Layers className="w-3 h-3" /> Submenú de #{idPadre}
                          </span>
                        ) : (
                          <span className="text-slate-400">Menú Raíz</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Opción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Nueva Opción de Menú</h2>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                  placeholder="Ej: Calificaciones" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ruta (UrlMenu)</label>
                <input 
                  required 
                  type="text" 
                  value={formData.ruta} 
                  onChange={e => setFormData({ ...formData, ruta: e.target.value })} 
                  placeholder="/calificaciones" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                  <input 
                    type="text" 
                    value={formData.descripcion} 
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
                    placeholder="Ej: Registro de notas" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Orden</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.orden} 
                    onChange={e => setFormData({ ...formData, orden: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Menú Padre</label>
                <select
                  value={formData.idPadre}
                  onChange={e => setFormData({ ...formData, idPadre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs bg-white cursor-pointer"
                >
                  <option value="">Ninguno (Menú Principal)</option>
                  {menus.map((m, idx) => {
                    const mId = m.IdOpcionMenu || m.id || m.id_opcion_menu || idx + 1;
                    const mNombre = m.Nombre || m.nombre;
                    return (
                      <option key={mId} value={mId}>
                        #{mId} - {mNombre}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asignar a Perfil</label>
                <select
                  value={formData.idPerfil}
                  onChange={e => setFormData({ ...formData, idPerfil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs bg-white cursor-pointer"
                >
                  <option value="">Seleccionar Perfil...</option>
                  {perfiles.map((p, idx) => {
                    const pId = p.IdPerfil ?? p.idPerfil ?? p.id ?? idx + 1;
                    const pNom = p.NombrePerfil ?? p.nombrePerfil ?? p.Nombre ?? p.nombre ?? `Perfil #${pId}`;
                    return (
                      <option key={pId} value={pId}>
                        {pNom}
                      </option>
                    );
                  })}
                </select>
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
                  disabled={guardando} 
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {guardando ? 'Guardando...' : 'Guardar Opción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}