import React, { useEffect, useState } from 'react';

import {
  BadgeAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  DollarSign,
  Users,
  RefreshCw,
  Loader2,
  Pencil,
  Check,
  X
} from 'lucide-react';

import {
  obtenerPagosPorCiclo,
  actualizarEstadoPago
} from '../services/api';

export default function MorosidadPage() {

  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [actualizando, setActualizando] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // ============================================================
  // FUNCIONES AUXILIARES
  // ============================================================

  const normalizarTexto = (valor) => {
    return String(valor || '')
      .trim()
      .toLowerCase();
  };

  const estaPagado = (estado) => {
    return normalizarTexto(estado) === 'pagado';
  };

  const estaMoroso = (estado) => {
    return normalizarTexto(estado) === 'moroso';
  };

  // ============================================================
  // CARGAR PAGOS REALES DEL BACKEND
  // ============================================================

  const cargarDatos = async () => {

    setLoading(true);
    setMensaje(null);

    try {

      const respuesta = await obtenerPagosPorCiclo(1);

      const pagos = Array.isArray(respuesta)
        ? respuesta
        : [];

      /*
       * Normalizamos los nombres del backend para que
       * el componente trabaje siempre con la misma estructura.
       */
      const pagosNormalizados = pagos.map((pago) => ({

        idPago:
          pago.IdPago ??
          pago.idPago ??
          null,

        idUsuario:
          pago.IdUsuario ??
          pago.idUsuario ??
          null,

        codigoUsuario:
          pago.CodigoUsuario ??
          pago.codigoUsuario ??
          '',

        alumno:
          pago.Alumno ??
          pago.alumno ??
          'Alumno',

        ciclo:
          pago.Ciclo ??
          pago.ciclo ??
          'Sin ciclo',

        estado:
          pago.Estado ??
          pago.estado ??
          pago.estadoPago ??
          'Moroso',

        monto:
          Number(
            pago.Monto ??
            pago.monto ??
            pago.montoPendiente ??
            0
          ),

        mes:
          pago.Mes ??
          pago.mes ??
          '-',

        fechaPago:
          pago.FechaPago ??
          pago.fechaPago ??
          null
      }));

      setDatos(pagosNormalizados);

    } catch (error) {

      console.error(
        'Error al cargar los pagos:',
        error
      );

      setDatos([]);

      setMensaje({
        tipo: 'error',
        texto:
          'No se pudo cargar la información de pagos.'
      });

    } finally {

      setLoading(false);
    }
  };

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  // ============================================================
  // ACTUALIZAR ESTADO
  // ============================================================

  const handleActualizarEstado = async (item) => {

    if (actualizando !== null) {
      return;
    }

    if (!item.idPago) {

      setMensaje({
        tipo: 'error',
        texto:
          'No se encontró el IdPago de este registro.'
      });

      return;
    }

    const nuevoEstado =
      estaPagado(item.estado)
        ? 'Moroso'
        : 'Pagado';

    const estadoAnterior = item.estado;

    setActualizando(item.idPago);
    setMensaje(null);

    // ==========================================================
    // OPTIMISTIC UI
    // ==========================================================

    setDatos((datosActuales) =>

      datosActuales.map((pago) =>

        pago.idPago === item.idPago

          ? {
              ...pago,
              estado: nuevoEstado
            }

          : pago
      )
    );

    try {

      await actualizarEstadoPago(
        item.idPago,
        nuevoEstado
      );

      setMensaje({
        tipo: 'exito',
        texto:
          `${item.alumno} ahora figura como ${
            nuevoEstado === 'Pagado'
              ? 'Al Día'
              : 'Moroso'
          }.`
      });

      /*
       * Después de confirmar el PUT volvemos a consultar
       * los datos reales para mantener sincronizada la UI.
       */
      await cargarDatos();

    } catch (error) {

      console.error(
        'Error actualizando estado del pago:',
        error
      );

      // ========================================================
      // ROLLBACK
      // ========================================================

      setDatos((datosActuales) =>

        datosActuales.map((pago) =>

          pago.idPago === item.idPago

            ? {
                ...pago,
                estado: estadoAnterior
              }

            : pago
        )
      );

      setMensaje({
        tipo: 'error',
        texto:
          error?.message ||
          'No se pudo actualizar el estado del pago.'
      });

    } finally {

      setActualizando(null);
    }
  };

  // ============================================================
  // MÉTRICAS
  // ============================================================

  const totalRegistros = datos.length;

  const totalAlDia = datos.filter((item) =>
    estaPagado(item.estado)
  ).length;

  const totalMorosos = datos.filter((item) =>
    estaMoroso(item.estado)
  ).length;

  const porcentajeMorosidad =
    totalRegistros > 0
      ? Math.round(
          (totalMorosos / totalRegistros) * 100
        )
      : 0;

  /*
   * Solo sumamos como deuda los registros
   * cuyo estado sea Moroso.
   */
  const totalDeuda = datos.reduce(
    (total, item) => {

      if (!estaMoroso(item.estado)) {
        return total;
      }

      return total + Number(item.monto || 0);
    },
    0
  );

  // ============================================================
  // FILTROS
  // ============================================================

  const alumnosFiltrados = datos.filter((item) => {

    const textoBusqueda =
      normalizarTexto(filtroTexto);

    const coincideTexto =
      normalizarTexto(item.alumno)
        .includes(textoBusqueda) ||

      normalizarTexto(item.codigoUsuario)
        .includes(textoBusqueda);

    if (filtroEstado === 'al dia') {

      return (
        coincideTexto &&
        estaPagado(item.estado)
      );
    }

    if (filtroEstado === 'moroso') {

      return (
        coincideTexto &&
        estaMoroso(item.estado)
      );
    }

    return coincideTexto;
  });

  // ============================================================
  // INTERFAZ
  // ============================================================

  return (

    <div className="p-6 md:p-10 font-sans text-slate-100 space-y-8 bg-slate-950 min-h-screen">

      {/* ====================================================== */}
      {/* ENCABEZADO */}
      {/* ====================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">

        <div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">

            <BadgeAlert className="w-3.5 h-3.5" />

            <span>
              HU-04: Control de Pensiones y Morosidad
            </span>

          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            Panel de Morosidad
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Supervisa y actualiza el estado de los pagos registrados.
          </p>

        </div>

        <button
          type="button"
          onClick={cargarDatos}
          disabled={
            loading ||
            actualizando !== null
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-slate-200 transition cursor-pointer self-start md:self-auto border border-slate-700"
        >

          <RefreshCw
            className={`w-4 h-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          <span>
            Actualizar Datos
          </span>

        </button>

      </div>

      {/* ====================================================== */}
      {/* MENSAJES */}
      {/* ====================================================== */}

      {mensaje && (

        <div
          className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-xs font-semibold ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >

          <div className="flex items-center gap-2">

            {mensaje.tipo === 'exito' ? (

              <CheckCircle2 className="w-4 h-4" />

            ) : (

              <AlertTriangle className="w-4 h-4" />

            )}

            <span>
              {mensaje.texto}
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setMensaje(null)
            }
            className="hover:text-white transition cursor-pointer"
          >

            <X className="w-4 h-4" />

          </button>

        </div>
      )}

      {/* ====================================================== */}
      {/* MÉTRICAS */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* DEUDA */}

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">

          <div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Deuda Pendiente
            </span>

            <span className="text-2xl font-black text-amber-400">
              S/ {totalDeuda.toFixed(2)}
            </span>

          </div>

          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">

            <DollarSign className="w-5 h-5" />

          </div>

        </div>

        {/* REGISTROS */}

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">

          <div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Registros
            </span>

            <span className="text-2xl font-black text-white">
              {totalRegistros}
            </span>

          </div>

          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">

            <Users className="w-5 h-5" />

          </div>

        </div>

        {/* PAGADOS */}

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">

          <div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Al Día
            </span>

            <span className="text-2xl font-black text-emerald-400">
              {totalAlDia}
            </span>

          </div>

          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">

            <CheckCircle2 className="w-5 h-5" />

          </div>

        </div>

        {/* MOROSOS */}

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">

          <div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">

              Morosos ({porcentajeMorosidad}%)

            </span>

            <span className="text-2xl font-black text-rose-400">
              {totalMorosos}
            </span>

          </div>

          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">

            <AlertTriangle className="w-5 h-5" />

          </div>

        </div>

      </div>

      {/* ====================================================== */}
      {/* FILTROS */}
      {/* ====================================================== */}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">

        <div className="relative w-full sm:w-80">

          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Buscar por alumno o código..."
            value={filtroTexto}
            onChange={(e) =>
              setFiltroTexto(
                e.target.value
              )
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
          />

        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">

          <button
            type="button"
            onClick={() =>
              setFiltroEstado('todos')
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >

            Todos ({totalRegistros})

          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroEstado('al dia')
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filtroEstado === 'al dia'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-emerald-400/80 hover:text-emerald-400'
            }`}
          >

            Al Día ({totalAlDia})

          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroEstado('moroso')
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filtroEstado === 'moroso'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-rose-400/80 hover:text-rose-400'
            }`}
          >

            Morosos ({totalMorosos})

          </button>

        </div>

      </div>

      {/* ====================================================== */}
      {/* TABLA */}
      {/* ====================================================== */}

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">

        {loading ? (

          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">

            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />

            <span className="text-xs">
              Cargando información de pagos...
            </span>

          </div>

        ) : alumnosFiltrados.length === 0 ? (

          <div className="py-16 text-center text-slate-500 text-xs">

            No se encontraron registros con los criterios seleccionados.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

              <thead>

                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">

                  <th className="py-4 px-6">
                    Código Pre-U
                  </th>

                  <th className="py-4 px-6">
                    Estudiante
                  </th>

                  <th className="py-4 px-6">
                    Ciclo
                  </th>

                  <th className="py-4 px-6">
                    Concepto
                  </th>

                  <th className="py-4 px-6">
                    Monto
                  </th>

                  <th className="py-4 px-6">
                    Estado
                  </th>

                  <th className="py-4 px-6 text-center">
                    Acción
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">

                {alumnosFiltrados.map((item) => {

                  const pagado =
                    estaPagado(item.estado);

                  const actualizandoEste =
                    actualizando === item.idPago;

                  return (

                    <tr
                      key={item.idPago}
                      className="hover:bg-slate-800/30 transition"
                    >

                      {/* CÓDIGO */}

                      <td className="py-4 px-6 font-mono font-bold text-indigo-400">

                        {item.codigoUsuario || '-'}

                      </td>

                      {/* ALUMNO */}

                      <td className="py-4 px-6 font-semibold text-white">

                        {item.alumno}

                      </td>

                      {/* CICLO */}

                      <td className="py-4 px-6 text-slate-400">

                        {item.ciclo}

                      </td>

                      {/* CONCEPTO */}

                      <td className="py-4 px-6 text-slate-300">

                        {item.mes}

                      </td>

                      {/* MONTO */}

                      <td className="py-4 px-6 font-mono font-bold text-slate-200">

                        S/ {Number(item.monto).toFixed(2)}

                      </td>

                      {/* ESTADO */}

                      <td className="py-4 px-6">

                        {pagado ? (

                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">

                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                            Al Día

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-[11px]">

                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />

                            Moroso

                          </span>

                        )}

                      </td>

                      {/* ACCIÓN */}

                      <td className="py-4 px-6">

                        <div className="flex justify-center">

                          <button
                            type="button"

                            onClick={() =>
                              handleActualizarEstado(
                                item
                              )
                            }

                            disabled={
                              actualizando !== null ||
                              !item.idPago
                            }

                            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold transition ${
                              pagado
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                          >

                            {actualizandoEste ? (

                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />

                                Actualizando...
                              </>

                            ) : pagado ? (

                              <>
                                <Pencil className="w-3.5 h-3.5" />

                                Marcar Moroso
                              </>

                            ) : (

                              <>
                                <Check className="w-3.5 h-3.5" />

                                Marcar Pagado
                              </>

                            )}

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

    </div>
  );
}