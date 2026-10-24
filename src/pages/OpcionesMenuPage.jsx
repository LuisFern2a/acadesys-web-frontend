import React, { useState, useEffect, useCallback, useRef } from 'react';
import useModalDialog from '../hooks/useModalDialog';
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
  const [errorMenus, setErrorMenus] = useState('');
  const [errorPerfiles, setErrorPerfiles] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [menuCreado, setMenuCreado] = useState(null);
  const guardandoRef = useRef(false);
  const dialogRef = useModalDialog(isModalOpen, () => setIsModalOpen(false), guardando);
  
  const [formData, setFormData] = useState({
    nombre: '',
    ruta: '',
    descripcion: '',
    orden: 1,
    idPadre: '',
    idPerfil: ''
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorMenus('');
    setErrorPerfiles('');
    try {
      const [resMenus, resPerfiles] = await Promise.allSettled([
        obtenerOpcionesMenu(), obtenerPerfiles()
      ]);
      if (resMenus.status === 'fulfilled' && Array.isArray(resMenus.value)) setMenus(resMenus.value);
      else if (resMenus.status === 'fulfilled') setErrorMenus('El servidor devolvió un catálogo de menús no válido.');
      else setErrorMenus(resMenus.reason?.message || 'No se pudieron cargar los menús.');

      if (resPerfiles.status === 'rejected') {
        setErrorPerfiles(resPerfiles.reason?.message || 'No se pudieron cargar los perfiles.');
      } else {
        const data = resPerfiles.value;
        const lista = Array.isArray(data) ? data : data?.data ?? data?.perfiles;
        if (!Array.isArray(lista) || lista.some((p) => !p || !Number.isSafeInteger(Number(p.IdPerfil)) || Number(p.IdPerfil) <= 0 || typeof p.Nombre !== 'string')) {
          setErrorPerfiles('El servidor devolvió un catálogo de perfiles no válido.');
        } else setPerfiles(lista);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const abrirModal = () => {
    setErrorAccion('');
    setMensaje('');
    setMenuCreado(null);
    setFormData({ nombre: '', ruta: '', descripcion: '', orden: 1, idPadre: '', idPerfil: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (guardandoRef.current || cargando) return;
    setErrorAccion('');
    setMensaje('');
    if (!formData.nombre.trim() || !formData.ruta.trim() || !Number.isInteger(Number(formData.orden)) || Number(formData.orden) <= 0) {
      setErrorAccion('Completa el nombre, la ruta interna y un orden entero positivo.');
      return;
    }
    if (formData.idPerfil && (errorPerfiles || !perfiles.some((p) => Number(p.IdPerfil) === Number(formData.idPerfil) && Number(p.EstadoRegistro) === 1))) {
      setErrorAccion('Selecciona un perfil activo obtenido del servidor.');
      return;
    }
    if (!menuCreado && formData.idPadre && !menus.some((m) => m.IdOpcionMenu === Number(formData.idPadre))) {
      setErrorAccion('Selecciona un menú padre obtenido del servidor.');
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    let creado = menuCreado;
    try {
      if (!creado) {
        const respuesta = await crearOpcionMenu({
          nombre: formData.nombre.trim(), ruta: formData.ruta.trim(),
          descripcion: formData.descripcion.trim(), idPadre: formData.idPadre || null
        });
        const id = Number(respuesta.id);
        creado = { id: Number.isSafeInteger(id) && id > 0 ? id : null };
        setMenuCreado(creado);
        if (!creado.id) {
          setErrorAccion('El servidor confirmó la creación, pero no devolvió un ID válido. No se ha intentado asignar ni volver a crear el menú; revisa el catálogo.');
          return;
        }
      }
      if (!creado.id) return;
      if (formData.idPerfil) await asignarMenuAPerfil(creado.id, Number(formData.idPerfil), Number(formData.orden));
      setMensaje(`Menú #${creado.id} creado. ${formData.idPerfil ? 'Asignación al perfil confirmada.' : 'No se solicitó asignación a un perfil.'}`);
      setIsModalOpen(false);
    } catch (error) {
      setErrorAccion(creado
        ? `El menú #${creado.id} fue creado, pero la asignación al perfil falló: ${error.message}. Puedes reintentar la asignación sin crear otro menú.`
        : (error.message || 'No se pudo crear el menú.'));
    } finally {
      if (creado) await cargarDatos();
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const coincidencias = new Set(menus.filter(m => {
    const nom = m.Nombre || m.nombre || '';
    const rut = m.UrlMenu || m.url_menu || m.ruta || m.Url || '';
    const term = searchTerm.toLowerCase();
    return nom.toLowerCase().includes(term) || rut.toLowerCase().includes(term);
  }).map((m) => m.IdOpcionMenu));
  const menusPorId = new Map(menus.map((m) => [m.IdOpcionMenu, m]));
  for (const id of [...coincidencias]) {
    let padre = menusPorId.get(id)?.IdPadre;
    while (padre != null && !coincidencias.has(padre)) {
      coincidencias.add(padre);
      padre = menusPorId.get(padre)?.IdPadre;
    }
  }
  const menusFiltrados = menus.filter((m) => coincidencias.has(m.IdOpcionMenu));

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-600 rounded-xl text-white">
              <MenuIcon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Opciones del Menú Institucional</h1>
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
            disabled={cargando || guardando}
            className="p-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Recargar catálogo"
            aria-label="Recargar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-teal-700' : ''}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={abrirModal}
            disabled={cargando || guardando || Boolean(errorMenus)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg font-bold transition-colors text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Nueva Opción
          </button>
        </div>
      </div>

      {errorMenus && <p role="alert" className="text-xs text-rose-600 mb-4">{errorMenus} <button type="button" onClick={cargarDatos} disabled={cargando || guardando}>Reintentar</button></p>}
      {errorPerfiles && <p role="alert" className="text-xs text-rose-600 mb-4">{errorPerfiles} <button type="button" onClick={cargarDatos} disabled={cargando || guardando}>Reintentar perfiles</button></p>}
      {errorAccion && <p role="alert" className="text-xs text-rose-600 mb-4">{errorAccion}</p>}
      {mensaje && <p role="status" className="text-xs text-slate-700 mb-4">{mensaje}</p>}

      {/* Buscador */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar opción por nombre o ruta de acceso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-xs"
        />
      </div>

      {/* Tabla de Menús */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-700" />
                    <span className="text-xs">Cargando catálogo de navegación...</span>
                  </td>
                </tr>
              ) : errorMenus ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500 text-xs">No se pudo consultar el catálogo. Reintenta la carga.</td></tr>
              ) : menusFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                    {menus.length === 0 ? 'No hay menús activos registrados en el servidor.' : 'No se encontraron opciones para el filtro ingresado.'}
                  </td>
                </tr>
              ) : (
                menusFiltrados.map((item) => {
                  const id = item.IdOpcionMenu;
                  const nombre = item.Nombre || item.nombre || '-';
                  const ruta = item.UrlMenu || item.url_menu || item.ruta || item.Url || '-';
                  const descripcion = item.Descripcion || item.descripcion || '-';
                  const idPadre = item.IdPadre ?? item.idPadre ?? item.id_padre;

                  return (
                    <tr key={id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">#{id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900 text-xs">{nombre}</td>
                      <td className="py-4 px-6 text-teal-700 font-mono text-xs">
                        <span className="inline-flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                          <LinkIcon className="w-3.5 h-3.5" /> {ruta}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-sm">{descripcion}</td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {idPadre ? (
                          <span className="inline-flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            <Layers className="w-3 h-3" /> Submenú de #{idPadre} · {menusPorId.get(idPadre)?.Nombre}
                          </span>
                        ) : (
                          <span className="text-slate-500">Menú Raíz</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
        <div className="fixed inset-0 z-50 bg-[#0F172A]/80 flex items-center justify-center p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Nueva opción de menú" tabIndex={-1} className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Nueva Opción de Menú</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar"
                disabled={guardando}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorAccion && <p role="alert" className="text-xs text-rose-600">{errorAccion}</p>}
              {errorPerfiles && <p role="alert" className="text-xs text-rose-600">{errorPerfiles}</p>}
              {menuCreado && <p role="status" className="text-xs text-slate-700">El menú ya fue creado{menuCreado.id ? ` con ID #${menuCreado.id}` : ''}. No se volverá a crear al reintentar.</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nombre} 
                  disabled={guardando || Boolean(menuCreado)}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                  placeholder="Ej: Calificaciones" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ruta (UrlMenu)</label>
                <input 
                  required 
                  type="text" 
                  value={formData.ruta} 
                  disabled={guardando || Boolean(menuCreado)}
                  onChange={e => setFormData({ ...formData, ruta: e.target.value })} 
                  placeholder="/calificaciones" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                  <input 
                    type="text" 
                    value={formData.descripcion} 
                    disabled={guardando || Boolean(menuCreado)}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
                    placeholder="Ej: Registro de notas" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500 text-xs text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Orden</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.orden} 
                    disabled={guardando}
                    onChange={e => setFormData({ ...formData, orden: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Menú Padre</label>
                <select
                  value={formData.idPadre}
                  disabled={guardando || Boolean(menuCreado)}
                  onChange={e => setFormData({ ...formData, idPadre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500 text-xs text-slate-900 bg-white cursor-pointer"
                >
                  <option value="">Ninguno (Menú Principal)</option>
                  {menus.map((m) => {
                    const mId = m.IdOpcionMenu;
                    const mNombre = m.Nombre || m.nombre;
                    return (
                      <option key={mId} value={mId}>
                        #{mId} - {mNombre}{m.IdPadre ? ` (submenú de #${m.IdPadre})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asignar a Perfil</label>
                <select
                  value={formData.idPerfil}
                  disabled={guardando || cargando || Boolean(errorPerfiles) || !perfiles.some((p) => Number(p.EstadoRegistro) === 1)}
                  onChange={e => setFormData({ ...formData, idPerfil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500 text-xs text-slate-900 bg-white cursor-pointer"
                >
                  <option value="">{perfiles.some((p) => Number(p.EstadoRegistro) === 1) ? 'Seleccionar Perfil...' : 'No hay perfiles activos disponibles'}</option>
                  {perfiles.filter((p) => Number(p.EstadoRegistro) === 1).map((p) => {
                    const pId = p.IdPerfil;
                    const pNom = p.Nombre;
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
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={guardando || cargando || (Boolean(menuCreado) && (!menuCreado.id || !formData.idPerfil))}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {guardando ? 'Guardando...' : menuCreado ? 'Reintentar asignación' : 'Guardar Opción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


