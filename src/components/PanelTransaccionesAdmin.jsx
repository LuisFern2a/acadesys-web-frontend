import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, CreditCard, History, Loader2, RefreshCw, X } from 'lucide-react';
import {
  conciliarTransaccionAdmin,
  obtenerAuditoriaPagoAdmin,
  obtenerTransaccionesAdmin,
} from '../services/pagosOnline.api.js';
import { mensajeErrorApi } from '../services/api';

// Panel de pagos online (Mercado Pago) para administración. Solo lectura: las
// transacciones las confirma el backend a partir del webhook o la conciliación.
// Los comprobantes manuales siguen en su propia sección de MorosidadPage.

const LIMITE = 20;
const ESTADOS = [
  { id: '', label: 'Todos los estados' },
  { id: 'REQUIERE_REVISION', label: 'Requiere revisión' },
  { id: 'APROBADA', label: 'Aprobada' },
  { id: 'PENDIENTE', label: 'Pendiente' },
  { id: 'RECHAZADA', label: 'Rechazada' },
  { id: 'CANCELADA', label: 'Cancelada' },
  { id: 'EXPIRADA', label: 'Expirada' },
  { id: 'PAGO_DUPLICADO', label: 'Pago duplicado' },
  { id: 'REEMBOLSADA', label: 'Reembolsada' },
  { id: 'CONTRACARGO', label: 'Contracargo' },
  { id: 'CREANDO', label: 'Creando' },
  { id: 'ERROR', label: 'Error' },
];

const ESTILO_ESTADO = {
  APROBADA: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDIENTE: 'border-amber-200 bg-amber-50 text-amber-800',
  CREANDO: 'border-amber-200 bg-amber-50 text-amber-800',
  RECHAZADA: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELADA: 'border-slate-200 bg-slate-100 text-slate-600',
  EXPIRADA: 'border-slate-200 bg-slate-100 text-slate-600',
  ERROR: 'border-slate-200 bg-slate-100 text-slate-600',
  PAGO_DUPLICADO: 'border-orange-200 bg-orange-50 text-orange-800',
  REEMBOLSADA: 'border-orange-200 bg-orange-50 text-orange-800',
  CONTRACARGO: 'border-rose-200 bg-rose-50 text-rose-700',
};

const ESTADOS_CONCILIABLES = new Set(['PENDIENTE', 'RECHAZADA', 'CANCELADA', 'EXPIRADA', 'APROBADA']);

const dinero = (valor) => `S/ ${Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fechaHora = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 16).replace('T', ' ');
  return fecha.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};
const etiquetaPeriodo = (periodo) => (String(periodo || '').toLowerCase() === 'inscripcion' ? 'Inscripción' : (periodo || '—'));

export default function PanelTransaccionesAdmin({ idCiclo = '', periodoSugerido = '' }) {
  const [estado, setEstado] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [desde, setDesde] = useState(0);
  const [datos, setDatos] = useState({ transacciones: [], paginacion: { total: 0, limite: LIMITE, desde: 0 } });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [conciliando, setConciliando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const secuenciaRef = useRef(0);

  const cargar = useCallback(async () => {
    const secuencia = ++secuenciaRef.current;
    setCargando(true);
    setError('');
    try {
      const respuesta = await obtenerTransaccionesAdmin({ idCiclo, periodo, estado, limite: LIMITE, desde });
      if (secuencia !== secuenciaRef.current) return;
      setDatos({
        transacciones: Array.isArray(respuesta?.transacciones) ? respuesta.transacciones : [],
        paginacion: respuesta?.paginacion || { total: 0, limite: LIMITE, desde },
      });
    } catch (err) {
      if (secuencia !== secuenciaRef.current) return;
      setDatos({ transacciones: [], paginacion: { total: 0, limite: LIMITE, desde: 0 } });
      setError(mensajeErrorApi(err, 'No se pudieron cargar las transacciones online.'));
    } finally {
      if (secuencia === secuenciaRef.current) setCargando(false);
    }
  }, [idCiclo, periodo, estado, desde]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarFiltro = (setter) => (event) => { setDesde(0); setter(event.target.value); };

  const conciliar = async (tx) => {
    if (conciliando !== null) return;
    setConciliando(tx.idTransaccion);
    setAviso(null);
    try {
      const r = await conciliarTransaccionAdmin(tx.idTransaccion);
      setAviso(r?.confirmada
        ? { tipo: 'exito', texto: `Transacción ${tx.idTransaccion}: Mercado Pago confirmó el pago y la cuota quedó pagada.` }
        : { tipo: 'aviso', texto: `Transacción ${tx.idTransaccion}: Mercado Pago tiene ${r?.pagosEncontrados ?? 0} operación(es); no hay un pago nuevo por confirmar.${r?.requiereRevision ? ' Hay eventos que requieren revisión: abre el historial.' : ''}` });
      await cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeErrorApi(err, 'No se pudo consultar la transacción en Mercado Pago.') });
    } finally {
      setConciliando(null);
    }
  };

  const verHistorial = async (tx) => {
    setHistorial({ tx, cargando: true, eventos: [], error: '' });
    try {
      const r = await obtenerAuditoriaPagoAdmin(tx.idPago);
      setHistorial({ tx, cargando: false, eventos: Array.isArray(r?.eventos) ? r.eventos : [], error: '' });
    } catch (err) {
      setHistorial({ tx, cargando: false, eventos: [], error: mensajeErrorApi(err, 'No se pudo cargar el historial.') });
    }
  };

  const { transacciones, paginacion } = datos;
  const total = Number(paginacion?.total || 0);
  const hayAnterior = desde > 0;
  const haySiguiente = desde + LIMITE < total;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-teal-700" aria-hidden="true"/><h2 className="font-bold text-slate-900">Pagos online (Mercado Pago)</h2></div>
          <p className="mt-1 text-xs text-slate-500">Solo lectura: el backend confirma cada pago con Mercado Pago. No requieren aprobación manual.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select aria-label="Estado de la transacción" value={estado} onChange={cambiarFiltro(setEstado)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-teal-500">
            {ESTADOS.map((op) => <option key={op.id} value={op.id}>{op.label}</option>)}
          </select>
          <select aria-label="Periodo" value={periodo} onChange={cambiarFiltro(setPeriodo)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-teal-500">
            <option value="">Todos los periodos</option>
            <option value="Inscripcion">Inscripción</option>
            {periodoSugerido && <option value={periodoSugerido}>{periodoSugerido}</option>}
          </select>
          <button type="button" onClick={cargar} disabled={cargando} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true"/> Actualizar
          </button>
        </div>
      </div>

      {!idCiclo && <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">Mostrando todos los ciclos de la academia. Selecciona un ciclo arriba para filtrar.</p>}
      {error && <div role="alert" className="flex items-start gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true"/><span>{error}</span></div>}
      {aviso && (
        <div role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`border-b px-4 py-3 text-xs ${aviso.tipo === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : aviso.tipo === 'exito' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-900'}`}>{aviso.texto}</div>
      )}

      {cargando && transacciones.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" aria-hidden="true"/>Cargando transacciones...</div>
      ) : transacciones.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">{error ? 'No hay datos disponibles.' : 'No hay transacciones online con estos filtros.'}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Ciclo · periodo</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacciones.map((tx) => (
                <tr key={tx.idTransaccion} className={tx.requiereRevision ? 'bg-orange-50/40' : ''}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fechaHora(tx.fechaConfirmacion || tx.fechaActualizacion || tx.fechaCreacion)}</td>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-800">{tx.alumno || '—'}</p><p className="text-slate-500">{tx.codigoUsuario || ''}</p></td>
                  <td className="px-4 py-3"><p className="text-slate-800">{tx.ciclo || '—'}</p><p className="text-slate-500">{etiquetaPeriodo(tx.periodo)} · cuota {tx.estadoCuota || '—'}</p></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{dinero(tx.monto)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${ESTILO_ESTADO[tx.estado] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{tx.estado}</span>
                    {tx.requiereRevision && <p className="mt-1 flex items-start gap-1 text-[11px] text-orange-800"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true"/>{tx.motivoRevision}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500" title={tx.referencia}>{String(tx.referencia || '').slice(0, 18)}…</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button type="button" onClick={() => verHistorial(tx)} className="mr-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><History className="h-3.5 w-3.5" aria-hidden="true"/> Historial</button>
                    {ESTADOS_CONCILIABLES.has(tx.estado) && tx.idOrdenProveedor && (
                      <button type="button" onClick={() => conciliar(tx)} disabled={conciliando !== null} className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800 disabled:opacity-50">
                        {conciliando === tx.idTransaccion ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true"/> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true"/>} Consultar en MP
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>{total === 0 ? '0 transacciones' : `${desde + 1}–${Math.min(desde + LIMITE, total)} de ${total}`}</span>
        <div className="flex gap-2">
          <button type="button" aria-label="Página anterior" onClick={() => setDesde(Math.max(0, desde - LIMITE))} disabled={!hayAnterior || cargando} className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button>
          <button type="button" aria-label="Página siguiente" onClick={() => setDesde(desde + LIMITE)} disabled={!haySiguiente || cargando} className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button>
        </div>
      </div>

      {historial && (
        <div role="dialog" aria-modal="true" aria-label="Historial de la cuota" className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setHistorial(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-bold text-slate-900">Historial de la cuota</h3><p className="mt-1 text-xs text-slate-500">{historial.tx.alumno} · {historial.tx.ciclo} · {etiquetaPeriodo(historial.tx.periodo)}</p></div>
              <button type="button" aria-label="Cerrar" onClick={() => setHistorial(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button>
            </div>
            {historial.cargando ? (
              <div className="p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin"/>Cargando...</div>
            ) : historial.error ? (
              <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{historial.error}</p>
            ) : historial.eventos.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">Sin eventos registrados.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {historial.eventos.map((ev) => (
                  <li key={ev.idAuditoria} className="rounded-lg border border-slate-200 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-800">{ev.evento}</span><span className="text-slate-500">{fechaHora(ev.fecha)}</span></div>
                    <p className="mt-1 text-slate-600">{ev.estadoAnterior || '—'} → {ev.estadoNuevo || '—'}{ev.montoNuevo !== null ? ` · ${dinero(ev.montoNuevo)}` : ''}</p>
                    {ev.motivo && <p className="mt-1 text-slate-500">{ev.motivo}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{ev.automatico ? 'Automático' : 'Usuario de la academia'}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
