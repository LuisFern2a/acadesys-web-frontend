import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  UserCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  obtenerComunicados,
  crearComunicado,
  confirmarLecturaComunicado
} from '../services/api';
import { esAdmin, esDocente } from '../utils/roles';

// El backend puede devolver destinatarios como varios valores o como etiquetas
// pegadas entre sí (p. ej. "Todos los NivelesAdministradores"). Esto es solo una
// separación para visualización: no altera el dato, ni el formulario, ni la API.
const separarEtiquetasPegadas = (valor) => {
  if (Array.isArray(valor)) return valor.map(separarEtiquetasPegadas).join(', ');
  return String(valor ?? '').replace(/([a-záéíóúüñ])([A-ZÁÉÍÓÚÜÑ])/g, '$1 $2');
};

export default function ComunicadosPage({ user }) {
  const [comunicados, setComunicados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario nuevo comunicado
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Académico');
  const [prioridad, setPrioridad] = useState('media');
  const [dirigidoA, setDirigidoA] = useState('Todos los Niveles');
  const [contenido, setContenido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Autorización visual por perfil real (comparación exacta, sin `includes`).
  const puedePublicar = esAdmin(user) || esDocente(user);

  const categoriasFiltro = [
    { id: 'todos', label: 'Todos' },
    { id: 'académico', label: 'Académico' },
    { id: 'reunión', label: 'Reunión' },
    { id: 'salud', label: 'Salud' },
    { id: 'feriado', label: 'Feriado' }
  ];

  async function cargarLista() {
  setCargando(true);
  setErrorCarga('');

  try {
    const data = await obtenerComunicados();

    const lista = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.comunicados)
          ? data.comunicados
          : null;

    if (!lista) {
      throw new Error(
        'El servidor devolvió un formato de comunicados no válido.'
      );
    }

    setComunicados(lista);
  } catch (err) {
    console.error('Error cargando comunicados:', err);
    setComunicados([]);
    setErrorCarga(
      err.message || 'No fue posible cargar los comunicados.'
    );
  } finally {
    setCargando(false);
  }
};

  const handleConfirmar = async (id) => {
  setErrorAccion('');
  setMensajeExito('');

  try {
    await confirmarLecturaComunicado(id);

    // Solo actualizamos la interfaz después de que la API responda bien.
    setComunicados((prev) =>
      prev.map((comunicado) =>
        comunicado.id === id
          ? {
              ...comunicado,
              confirmado: true,
              leido: true
            }
          : comunicado
      )
    );

    setMensajeExito('La lectura se confirmó correctamente.');
  } catch (err) {
    console.error('Error al confirmar la lectura:', err);

    setErrorAccion(
      err.message || 'No se pudo guardar la confirmación de lectura.'
    );
  }
};

  const handleCrear = async (e) => {
  e.preventDefault();

  if (guardando) return;

  if (titulo.trim().length < 3) {
    setErrorModal('El título debe tener al menos 3 caracteres.');
    return;
  }

  if (!contenido.trim()) {
    setErrorModal('Completa el contenido del comunicado.');
    return;
  }

  setErrorModal('');
  setGuardando(true);
  setErrorAccion('');
  setMensajeExito('');

  const autorNombre =
    user?.nombre || user?.NombreCompleto || 'Dirección Académica';

  try {
    await crearComunicado({
      titulo: titulo.trim(),
      categoria,
      prioridad,
      dirigidoA: dirigidoA.trim(),
      autor: autorNombre,
      contenido: contenido.trim()
    });

    setModalAbierto(false);
    setTitulo('');
    setContenido('');
    setCategoria('Académico');
    setPrioridad('media');
    setDirigidoA('Todos los Niveles');

    setMensajeExito('Comunicado publicado correctamente.');

    // Volvemos a consultar el servidor para mostrar los datos persistidos.
    await cargarLista();
  } catch (err) {
    console.error('Error creando comunicado:', err);

    setErrorModal(
      err.message || 'No se pudo publicar el comunicado.'
    );
  } finally {
    setGuardando(false);
  }
};

  const normalizarTexto = (txt = '') =>
    txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const comunicadosFiltrados = comunicados.filter(c => {
    const catNorm = normalizarTexto(c.categoria);
    const filtroNorm = normalizarTexto(filtroCategoria);
    const coincideCat = filtroCategoria === 'todos' || catNorm === filtroNorm;

    const termino = busqueda.toLowerCase();
    const coincideTexto = (c.titulo || '').toLowerCase().includes(termino) ||
                          (c.contenido || '').toLowerCase().includes(termino);
    return coincideCat && coincideTexto;
  });

  const getBadgeCategoria = (cat = '') => {
    const norm = normalizarTexto(cat);
    switch (norm) {
      case 'academico':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'reunion':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'salud':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'feriado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  useEffect(() => {
    cargarLista();
  }, []);


  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl text-white">
            <Megaphone className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda y Comunicados Oficiales</h1>
            <p className="text-slate-500 text-sm mt-0.5">
  Notificaciones institucionales, circulares pedagógicas y acuerdos directivos
</p>
          </div>
        </div>

        {puedePublicar && (
          <button
            type="button"
            onClick={() => {
              setErrorModal('');
              setModalAbierto(true);
            }}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo Comunicado
          </button>
        )}
      </div>
           {errorAccion && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {errorAccion}
        </div>
      )}

      {mensajeExito && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {mensajeExito}
        </div>
      )}



      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          <label htmlFor="buscar-comunicados" className="sr-only">
  Buscar comunicados por título o contenido
</label>

          <input
            type="text"
            placeholder="Buscar por título o contenido..."
            id="buscar-comunicados"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
          {categoriasFiltro.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                filtroCategoria === cat.id
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE COMUNICADOS */}
      {cargando ? (
  <div className="py-12 text-center text-sm text-slate-500">
    Cargando avisos de la institución...
  </div>
      ) : errorCarga ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center"
        >
          <p className="font-bold text-rose-700">
            No se pudieron cargar los comunicados
          </p>

          <p className="mt-2 text-sm text-rose-600">
            {errorCarga}
          </p>

          <button
            type="button"
            onClick={cargarLista}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : comunicadosFiltrados.length === 0 ? (
<div className="bg-white rounded-xl border border-slate-200 p-10 sm:p-12 text-center shadow-sm">

    <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
      <Bell className="w-7 h-7 text-blue-700" aria-hidden="true" />
    </div>

    <p className="text-base font-bold text-slate-900">
      No hay comunicados disponibles
    </p>

    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      Cuando la institución publique un nuevo aviso,
      comunicado o circular, aparecerá automáticamente en este espacio.
    </p>

  </div>
) : (
        <div className="space-y-4">
          {comunicadosFiltrados.map((item) => {
            const esUrgente = item.prioridad === 'alta';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md ${
                  esUrgente
                    ? 'border-l-4 border-l-rose-500 border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getBadgeCategoria(item.categoria)}`}>
                      {item.categoria}
                    </span>
                    {esUrgente && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-600 text-white">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Prioridad Alta
                      </span>
                    )}
                   <span className="text-sm font-semibold text-slate-500">
  Dirigido a: <strong className="text-slate-800 break-words">{separarEtiquetasPegadas(item.dirigidoA)}</strong>
</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" /> {item.fecha}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" /> {item.hora}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {item.titulo}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {item.contenido}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {(item.autor || 'DA').slice(0, 2).toUpperCase()}
                    </span>
                    <span>Emitido por: <strong className="text-slate-700">{item.autor}</strong></span>
                  </div>

                  <div>
                    {item.confirmado ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" /> Lectura Confirmada
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConfirmar(item.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" aria-hidden="true" /> Marcar como Enterado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NUEVO COMUNICADO */}
      {modalAbierto && (
  <div className="fixed inset-0 z-50 bg-[#0F172A]/80 flex items-center justify-center p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-comunicado"
      className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden"
    >
            <div className="border-b border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-700" aria-hidden="true" />
                <h2 className="font-bold text-base text-slate-900" id="titulo-modal-comunicado">
                  Redactar Circular Institucional
                </h2>
              </div>
              <button
  type="button"
  aria-label="Cerrar formulario"
  onClick={() => setModalAbierto(false)}
  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
>
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div>
  <label
  htmlFor="comunicado-titulo"
  className="block text-xs font-semibold text-slate-700 mb-1"
>
  Título del comunicado
</label>

  <input
    id="comunicado-titulo"
    type="text"
    required
    placeholder="Ej: Simulacro Oficial / Entrega de Boletas"
    value={titulo}
    onChange={(e) => setTitulo(e.target.value)}
    className="w-full text-sm text-slate-900 placeholder:text-slate-400 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
  />
</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
  htmlFor="comunicado-categoria"
  className="block text-xs font-semibold text-slate-700 mb-1"
>
  Categoría
</label>
<select
  id="comunicado-categoria"
  value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-sm text-slate-900 px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white cursor-pointer focus:border-blue-600"
                  >
                    <option value="Académico">Académico</option>
                    <option value="Reunión">Reunión de Padres</option>
                    <option value="Salud">Salud y Tópico</option>
                    <option value="Feriado">Feriado / Suspensión</option>
                  </select>
                </div>

                <div>
                  <label
  htmlFor="comunicado-prioridad"
  className="block text-xs font-semibold text-slate-700 mb-1"
>
  Prioridad
</label>
<select
  id="comunicado-prioridad"
  value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full text-sm text-slate-900 px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white cursor-pointer focus:border-blue-600"
                  >
                    <option value="baja">Informativa (Baja)</option>
                    <option value="media">Importante (Media)</option>
                    <option value="alta">Urgente (Alta)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
  htmlFor="comunicado-destinatarios"
  className="block text-xs font-semibold text-slate-700 mb-1"
>
  Destinatarios
</label>
<input
  id="comunicado-destinatarios"
  type="text"
                  value={dirigidoA}
                  onChange={(e) => setDirigidoA(e.target.value)}
                  placeholder="Ej: Todos los Niveles, 5to de Secundaria"
                  className="w-full text-sm text-slate-900 placeholder:text-slate-400 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label
  htmlFor="comunicado-contenido"
  className="block text-xs font-semibold text-slate-700 mb-1"
>
  Detalle del comunicado
</label>
<textarea
  id="comunicado-contenido"
  required
                  rows={4}
                  placeholder="Redacta las instrucciones, fechas u orden del día..."
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  className="w-full text-sm text-slate-900 placeholder:text-slate-400 p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {errorModal && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"
                >
                  {errorModal}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
