import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, BadgeAlert, Banknote, CheckCircle2, ClipboardCheck, DollarSign, Loader2, RefreshCw, Search, Users, XCircle } from 'lucide-react';
import {
  actualizarEstadoPago,
  generarMensualidadesCiclo,
  obtenerCiclosGestionActivos,
  obtenerPagosPorCiclo,
  obtenerComprobantesPago,
  revisarComprobantePago,
  mensajeErrorApi
} from '../services/api';

const estadoNormalizado = (estado) => String(estado || '').trim().toLowerCase();
const formatoDinero = (valor) => `S/ ${Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fechaLocal = (valor) => {
  if (!valor) return '—';
  const texto = String(valor).slice(0, 10);
  const partes = texto.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : texto;
};
const periodoActual = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};
const vencimientoInicial = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
};

export default function MorosidadPage() {
  const [ciclos, setCiclos] = useState([]);
  const [idCiclo, setIdCiclo] = useState('');
  const [pagos, setPagos] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [errorComprobantes, setErrorComprobantes] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [periodo, setPeriodo] = useState(periodoActual);
  const [fechaVencimiento, setFechaVencimiento] = useState(vencimientoInicial);
  const [cargandoCiclos, setCargandoCiclos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [revisando, setRevisando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const cargaSeqRef = useRef(0);
  const actualizandoRef = useRef(false);

  const cargarCiclos = useCallback(async () => {
    setCargandoCiclos(true);
    try {
      const lista = await obtenerCiclosGestionActivos();
      setCiclos(lista);
      setIdCiclo((actual) => actual && lista.some((c) => String(c.idCiclo) === actual)
        ? actual : (lista.length ? String(lista[0].idCiclo) : ''));
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudieron cargar los ciclos.') });
      setCiclos([]);
    } finally {
      setCargandoCiclos(false);
    }
  }, []);

  const cargarDatos = useCallback(async ({ silencioso = false } = {}) => {
    const secuencia = ++cargaSeqRef.current;
    const vigente = () => secuencia === cargaSeqRef.current;
    if (!idCiclo) { setPagos([]); setLoading(false); return false; }
    if (!silencioso) setLoading(true);
    if (!silencioso) setMensaje(null);
    try {
      const data = await obtenerPagosPorCiclo(idCiclo);
      if (!vigente()) return false;
      const lista = Array.isArray(data) ? data : [];
      setPagos(lista.map((p) => {
        const rawEstado = p.Estado ?? p.estado ?? p.estadoPago ?? '';
        return {
          idPago: p.IdPago ?? p.idPago ?? null,
          idCiclo: p.IdCiclo ?? p.idCiclo ?? Number(idCiclo),
          idUsuario: p.IdUsuario ?? p.idUsuario ?? null,
          codigoUsuario: p.CodigoUsuario ?? p.codigoUsuario ?? '',
          alumno: p.Alumno ?? p.alumno ?? 'Alumno',
          ciclo: p.Ciclo ?? p.ciclo ?? '',
          estado: rawEstado ? String(rawEstado) : 'Sin registro',
          monto: Number(p.Monto ?? p.monto ?? 0),
          mes: p.Mes ?? p.mes ?? '—',
          fechaPago: p.FechaPago ?? p.fechaPago ?? null,
          fechaVencimiento: p.FechaVencimiento ?? p.fechaVencimiento ?? null,
          estadoComprobante: p.EstadoRevisionComprobante ?? p.estadoRevisionComprobante ?? null,
          referenciaComprobante: p.ReferenciaComprobante ?? p.referenciaComprobante ?? null,
          urlComprobante: p.UrlComprobante ?? p.urlComprobante ?? null,
          motivoRevision: p.MotivoRevision ?? p.motivoRevision ?? null,
          idComprobante: p.IdComprobante ?? p.idComprobante ?? null
        };
      }));
      return true;
    } catch (error) {
      if (!vigente()) return false;
      setPagos([]);
      if (!silencioso) setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudieron cargar los pagos del ciclo.') });
      return false;
    } finally {
      if (vigente() && !silencioso) setLoading(false);
    }
  }, [idCiclo]);

  const cargarComprobantes = useCallback(async () => {
    try {
      const lista = await obtenerComprobantesPago('EN_REVISION');
      setComprobantes((Array.isArray(lista) ? lista : []).filter((p) => {
        // El backend ya acota los comprobantes a la academia del administrador.
        // Si el registro no informa el ciclo, no se descarta: ocultarlo haría
        // que un comprobante pendiente quedara sin revisar.
        const idCicloComprobante = p.IdCiclo ?? p.idCiclo;
        return idCicloComprobante === null || idCicloComprobante === undefined
          || String(idCicloComprobante) === String(idCiclo);
      }));
      setErrorComprobantes('');
    } catch (error) {
      setComprobantes([]);
      // Error propio de esta sección: no debe pisar el mensaje del resultado
      // de una aprobación o rechazo.
      setErrorComprobantes(mensajeErrorApi(error, 'No se pudieron consultar los comprobantes pendientes.'));
    }
  }, [idCiclo]);

  const actualizarTodo = useCallback(async () => {
    await Promise.all([cargarDatos(), cargarComprobantes()]);
  }, [cargarDatos, cargarComprobantes]);

  useEffect(() => { cargarCiclos(); }, [cargarCiclos]);
  useEffect(() => { if (!cargandoCiclos && idCiclo) actualizarTodo(); }, [cargandoCiclos, idCiclo, actualizarTodo]);

  const alDia = (estado) => estadoNormalizado(estado) === 'pagado';
  const moroso = (estado) => ['moroso', 'vencido'].includes(estadoNormalizado(estado));
  const sinRegistro = (estado) => estadoNormalizado(estado) === 'sin registro';
  const enRevision = (item) => estadoNormalizado(item?.estadoComprobante) === 'en_revision';
  const esInscripcionPendiente = (item) => estadoNormalizado(item?.mes) === 'inscripcion' && estadoNormalizado(item?.estado) === 'pendiente';

  const alumnosUnicos = useMemo(() => new Set(pagos.map((p) => p.idUsuario).filter(Boolean)).size, [pagos]);
  const cantidadAlDia = pagos.filter((p) => alDia(p.estado)).length;
  const cantidadMorosos = pagos.filter((p) => moroso(p.estado) || estadoNormalizado(p.estado) === 'pendiente').length;
  const sinPago = pagos.filter((p) => sinRegistro(p.estado)).length;
  const deuda = pagos.reduce((sum, p) => sum + (!alDia(p.estado) ? p.monto : 0), 0);
  const listaFiltrada = pagos.filter((p) => {
    const needle = busqueda.trim().toLowerCase();
    const coincide = !needle || p.alumno.toLowerCase().includes(needle) || p.codigoUsuario.toLowerCase().includes(needle);
    if (!coincide) return false;
    if (filtro === 'al-dia') return alDia(p.estado);
    if (filtro === 'morosos') return moroso(p.estado) || estadoNormalizado(p.estado) === 'pendiente';
    if (filtro === 'sin-registro') return sinRegistro(p.estado);
    if (filtro === 'comprobante') return enRevision(p);
    return true;
  });

  const actualizarEstado = async (item) => {
    if (!item.idPago || actualizandoRef.current || alDia(item.estado) || enRevision(item) || esInscripcionPendiente(item) || moroso(item.estado)) return;
    if (!window.confirm(`¿Marcar como morosa la cuota ${item.mes} de ${item.alumno}? Esta acción no registra un cobro.`)) return;
    actualizandoRef.current = true;
    setActualizando(item.idPago);
    setMensaje(null);
    try {
      await actualizarEstadoPago(item.idPago, 'Moroso');
      await cargarDatos({ silencioso: true });
      setMensaje({ tipo: 'exito', texto: `La cuota de ${item.alumno} quedó marcada como morosa.` });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudo actualizar el estado.') });
    } finally {
      actualizandoRef.current = false;
      setActualizando(null);
    }
  };

  const generarCuotas = async (event) => {
    event.preventDefault();
    if (!idCiclo || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento)) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un ciclo, un periodo AAAA-MM y un vencimiento válido.' });
      return;
    }
    if (!window.confirm(`¿Generar las cuotas de ${periodo}? Las cuotas existentes no se duplicarán. Revisa que el precio mensual del ciclo esté configurado.`)) return;
    setGenerando(true);
    setMensaje(null);
    try {
      const resultado = await generarMensualidadesCiclo(idCiclo, { periodo, fechaVencimiento });
      await actualizarTodo();
      setMensaje({ tipo: 'exito', texto: resultado.mensaje || `Cuotas creadas: ${resultado.cuotasCreadas ?? 0}.` });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudieron generar las mensualidades. Confirma que el ciclo tenga PrecioMensual configurado y la migración aplicada.') });
    } finally {
      setGenerando(false);
    }
  };

  const revisarComprobante = async (item, decision) => {
    const motivo = decision === 'RECHAZADO'
      ? String(window.prompt('Motivo del rechazo (mínimo 4 caracteres):') || '').trim()
      : '';
    if (decision === 'RECHAZADO' && motivo.length < 4) {
      setMensaje({ tipo: 'error', texto: 'Para rechazar un comprobante debes indicar un motivo de al menos 4 caracteres.' });
      return;
    }
    if (decision === 'APROBADO' && !window.confirm(`¿Confirmas haber verificado la transferencia de ${formatoDinero(item.Monto)} de ${item.Alumno}? Esto marcará la cuota como pagada.`)) return;
    setRevisando(item.IdComprobante);
    setMensaje(null);
    try {
      const resultado = await revisarComprobantePago(item.IdComprobante, decision, motivo);
      await actualizarTodo();
      setMensaje({ tipo: 'exito', texto: resultado.mensaje || (decision === 'APROBADO' ? 'Comprobante aprobado; pago confirmado.' : 'Comprobante rechazado.') });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudo revisar el comprobante.') });
    } finally {
      setRevisando(null);
    }
  };

  const cicloActual = ciclos.find((c) => String(c.idCiclo) === String(idCiclo));
  const tarjetas = [
    { label: 'Alumnos matriculados', value: alumnosUnicos, icon: Users, tone: 'text-slate-900' },
    { label: 'Cuotas confirmadas', value: cantidadAlDia, icon: CheckCircle2, tone: 'text-emerald-700' },
    { label: 'Cuotas pendientes / morosas', value: cantidadMorosos, icon: AlertTriangle, tone: 'text-rose-700' },
    { label: 'Saldo pendiente estimado', value: formatoDinero(deuda), icon: DollarSign, tone: 'text-amber-700' }
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 text-slate-900 md:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700"><BadgeAlert className="h-4 w-4" aria-hidden="true"/> FINANZAS DE LA ACADEMIA</div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Pagos, mensualidades y comprobantes</h1><p className="mt-1 text-sm text-slate-500">Genera las cuotas del ciclo y revisa referencias antes de confirmar pagos.</p></div>
        <button type="button" onClick={actualizarTodo} disabled={loading || cargandoCiclos || !idCiclo || generando || revisando !== null} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true"/> Actualizar</button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"><strong>No marcar pagos sin verificar.</strong> La aprobación confirma que la transferencia fue verificada por el responsable. Esta integración no es una pasarela automática ni consulta el banco.</div>
      {mensaje && <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{mensaje.tipo === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true"/> : <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true"/>}<span>{mensaje.texto}</span></div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Selecciona el ciclo<select value={idCiclo} onChange={(e) => { cargaSeqRef.current += 1; setPagos([]); setComprobantes([]); setIdCiclo(e.target.value); }} disabled={actualizando !== null || generando || revisando !== null || cargandoCiclos || ciclos.length === 0} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500">{ciclos.length === 0 && <option value="">No hay ciclos activos</option>}{ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre} · {c.turno || 'Turno por definir'}</option>)}</select></label>
        {cicloActual && <p className="mt-3 text-xs text-slate-500">{cicloActual.nombre} · {cicloActual.universidadObjetivo || 'Preuniversitario'} · {cicloActual.totalAlumnos ?? cicloActual.TotalAlumnos ?? 0} matriculados</p>}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{tarjetas.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className="rounded-lg border border-teal-100 bg-teal-50 p-2 text-teal-700"><Icon className="h-4 w-4" aria-hidden="true"/></span></div><p className={`mt-3 text-2xl font-bold ${tone}`}>{loading ? '…' : value}</p></div>)}</section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-teal-700"/><h2 className="font-bold">Generar mensualidades</h2></div>
        <p className="mt-1 text-xs text-slate-500">El backend usa el precio mensual configurado en el ciclo. Las cuotas existentes del mismo periodo se conservan y no se duplican.</p>
        <form onSubmit={generarCuotas} className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold text-slate-600">Periodo<input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"/></label>
          <label className="text-xs font-bold text-slate-600">Fecha de vencimiento<input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} required className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"/></label>
          <button type="submit" disabled={!idCiclo || generando || revisando !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50">{generando ? <Loader2 className="h-4 w-4 animate-spin"/> : <Banknote className="h-4 w-4"/>}{generando ? 'Generando…' : 'Generar cuotas del periodo'}</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-slate-900">Comprobantes por revisar</h2><p className="mt-1 text-xs text-slate-500">Solo aprobar después de verificar la operación por el canal oficial.</p></div><span className="self-start rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800">{comprobantes.length} pendientes</span></div>
        {errorComprobantes && <div role="alert" className="flex items-start gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true"/><span>{errorComprobantes}</span></div>}
        {revisando !== null ? <div className="p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin"/>Actualizando revisión…</div> : comprobantes.length === 0 ? <div className="p-8 text-center"><ClipboardCheck className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-2 text-sm font-bold">No hay comprobantes pendientes para este ciclo.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Alumno</th><th className="px-5 py-3">Periodo</th><th className="px-5 py-3">Monto</th><th className="px-5 py-3">Referencia</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Revisión</th></tr></thead><tbody>{comprobantes.map((item) => <tr key={item.IdComprobante} className="border-t border-slate-100"><td className="px-5 py-4"><p className="font-semibold">{item.Alumno}</p><p className="mt-1 text-xs text-slate-500">{item.CodigoUsuario || 'Sin código'}</p></td><td className="px-5 py-4">{item.Mes || '—'}</td><td className="px-5 py-4 font-bold">{formatoDinero(item.Monto)}</td><td className="px-5 py-4"><p>{item.Referencia || '—'}</p>{item.UrlComprobante && <a className="mt-1 inline-block text-xs font-semibold text-teal-700 underline" href={item.UrlComprobante} target="_blank" rel="noreferrer">Abrir comprobante</a>}</td><td className="px-5 py-4 text-slate-500">{fechaLocal(item.FechaCreacion)}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => revisarComprobante(item, 'APROBADO')} disabled={revisando !== null || generando} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5"/> Aprobar</button><button type="button" onClick={() => revisarComprobante(item, 'RECHAZADO')} disabled={revisando !== null || generando} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><XCircle className="h-3.5 w-3.5"/> Rechazar</button></div></td></tr>)}</tbody></table></div>}
      </section>

      {sinPago > 0 && <p className="text-xs text-slate-500">{sinPago} alumnos matriculados no tienen cuotas registradas. Genera el periodo que corresponda una vez validado el precio mensual.</p>}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-slate-900">Detalle de alumnos y pagos</h2><p className="mt-1 text-xs text-slate-500">No se permite convertir directamente una cuota pendiente en pagada.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno o código..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-teal-500 sm:w-64"/></div><select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-teal-500"><option value="todos">Todos los estados</option><option value="al-dia">Pagados</option><option value="morosos">Morosos / pendientes</option><option value="comprobante">Comprobante en revisión</option><option value="sin-registro">Sin registro de pago</option></select></div></div>
        {loading ? <div className="p-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin" aria-hidden="true"/>Cargando pagos del ciclo...</div> : listaFiltrada.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 font-bold">No hay registros para los filtros seleccionados.</p><p className="mt-1 text-xs text-slate-500">Si el ciclo tiene alumnos, genera las cuotas y comprueba que las matrículas estén activas.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Alumno</th><th className="px-5 py-4">Mes / concepto</th><th className="px-5 py-4">Monto</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Vencimiento</th><th className="px-5 py-4">Fecha de pago</th><th className="px-5 py-4">Acción</th></tr></thead><tbody>{listaFiltrada.map((item, index) => <tr key={`${item.idPago || item.idUsuario || index}-${item.mes}`} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold">{item.alumno}</p><p className="mt-1 text-xs text-slate-500">{item.codigoUsuario || 'Sin código'}</p></td><td className="px-5 py-4 text-slate-700">{item.mes}</td><td className="px-5 py-4 font-bold">{formatoDinero(item.monto)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-md border px-2.5 py-1 text-[10px] font-bold ${alDia(item.estado) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : enRevision(item) ? 'border-sky-200 bg-sky-50 text-sky-700' : moroso(item.estado) ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{enRevision(item) ? 'En revisión' : item.estado}</span></td><td className="px-5 py-4 text-slate-500">{fechaLocal(item.fechaVencimiento)}</td><td className="px-5 py-4 text-slate-500">{fechaLocal(item.fechaPago)}</td><td className="px-5 py-4">{alDia(item.estado) ? <span className="text-xs font-semibold text-emerald-700">Pago confirmado</span> : enRevision(item) ? <span className="text-xs text-sky-700">Revisar comprobante</span> : esInscripcionPendiente(item) ? <span className="text-xs text-amber-700">Pendiente de confirmación</span> : moroso(item.estado) ? <span className="text-xs text-rose-700">Ya está moroso</span> : item.idPago ? <button type="button" onClick={() => actualizarEstado(item)} disabled={actualizando !== null || generando || revisando !== null} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">{actualizando === item.idPago ? 'Actualizando…' : 'Marcar moroso'}</button> : <span className="text-xs text-slate-500">Crear cuota primero</span>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
