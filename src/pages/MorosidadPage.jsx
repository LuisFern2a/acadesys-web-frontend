import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, BadgeAlert, CheckCircle2, DollarSign, Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { actualizarEstadoPago, obtenerCiclosGestionActivos, obtenerPagosPorCiclo, mensajeErrorApi } from '../services/api';

const estadoNormalizado = (estado) => String(estado || '').trim().toLowerCase();

export default function MorosidadPage() {
  const [ciclos, setCiclos] = useState([]);
  const [idCiclo, setIdCiclo] = useState('');
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [cargandoCiclos, setCargandoCiclos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(null);
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

  const cargarDatos = useCallback(async () => {
    const secuencia = ++cargaSeqRef.current;
    const vigente = () => secuencia === cargaSeqRef.current;
    if (!idCiclo) { setPagos([]); setLoading(false); return false; }
    setLoading(true);
    setMensaje(null);
    try {
      const data = await obtenerPagosPorCiclo(idCiclo);
      if (!vigente()) return false;
      const lista = Array.isArray(data) ? data : [];
      setPagos(lista.map((p) => {
        const rawEstado = p.Estado ?? p.estado ?? p.estadoPago ?? '';
        return {
          idPago: p.IdPago ?? p.idPago ?? null,
          idUsuario: p.IdUsuario ?? p.idUsuario ?? null,
          codigoUsuario: p.CodigoUsuario ?? p.codigoUsuario ?? '',
          alumno: p.Alumno ?? p.alumno ?? 'Alumno',
          ciclo: p.Ciclo ?? p.ciclo ?? '',
          estado: rawEstado ? String(rawEstado) : 'Sin registro',
          monto: Number(p.Monto ?? p.monto ?? 0),
          mes: p.Mes ?? p.mes ?? '—',
          fechaPago: p.FechaPago ?? p.fechaPago ?? null
        };
      }));
      return true;
    } catch (error) {
      if (!vigente()) return false;
      setPagos([]);
      setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudieron cargar los pagos del ciclo.') });
      return false;
    } finally {
      if (vigente()) setLoading(false);
    }
  }, [idCiclo]);

  useEffect(() => { cargarCiclos(); }, [cargarCiclos]);
  useEffect(() => { if (!cargandoCiclos) cargarDatos(); }, [cargandoCiclos, cargarDatos]);

  const alDia = (estado) => estadoNormalizado(estado) === 'pagado';
  const moroso = (estado) => ['moroso','vencido','pendiente'].includes(estadoNormalizado(estado));
  const sinRegistro = (estado) => estadoNormalizado(estado) === 'sin registro';
  const esInscripcionPendiente = (item) =>
    estadoNormalizado(item?.mes) === 'inscripcion' && estadoNormalizado(item?.estado) === 'pendiente';

  const alumnosUnicos = useMemo(() => new Set(pagos.map((p) => p.idUsuario).filter(Boolean)).size, [pagos]);
  const cantidadAlDia = pagos.filter((p) => alDia(p.estado)).length;
  const cantidadMorosos = pagos.filter((p) => moroso(p.estado)).length;
  const sinPago = pagos.filter((p) => sinRegistro(p.estado)).length;
  const deuda = pagos.reduce((sum,p) => sum + (moroso(p.estado) ? p.monto : 0), 0);
  const listaFiltrada = pagos.filter((p) => {
    const needle = busqueda.trim().toLowerCase();
    const coincide = !needle || p.alumno.toLowerCase().includes(needle) || p.codigoUsuario.toLowerCase().includes(needle);
    if (!coincide) return false;
    if (filtro === 'al-dia') return alDia(p.estado);
    if (filtro === 'morosos') return moroso(p.estado);
    if (filtro === 'sin-registro') return sinRegistro(p.estado);
    return true;
  });

  const actualizarEstado = async (item) => {
    if (!item.idPago || actualizandoRef.current || esInscripcionPendiente(item)) return;
    const nuevoEstado = alDia(item.estado) ? 'Moroso' : 'Pagado';
    const anterior = item.estado;
    actualizandoRef.current = true;
    setActualizando(item.idPago);
    setMensaje(null);
    setPagos((actuales) => actuales.map((p) => p.idPago === item.idPago ? { ...p, estado: nuevoEstado } : p));
    try {
      await actualizarEstadoPago(item.idPago, nuevoEstado);
      // Se recarga primero (el loader limpia el mensaje) y luego se confirma,
      // para que la confirmación no quede borrada de inmediato.
      const ok = await cargarDatos();
      if (ok) setMensaje({ tipo: 'exito', texto: `Estado de pago actualizado para ${item.alumno}.` });
    } catch (error) {
      setPagos((actuales) => actuales.map((p) => p.idPago === item.idPago ? { ...p, estado: anterior } : p));
      setMensaje({ tipo: 'error', texto: mensajeErrorApi(error, 'No se pudo actualizar el pago.') });
    } finally {
      actualizandoRef.current = false;
      setActualizando(null);
    }
  };

  const cicloActual = ciclos.find((c) => String(c.idCiclo) === String(idCiclo));
  const tarjetas = [
    { label: 'Alumnos matriculados en el ciclo', value: alumnosUnicos, icon: Users, chip: 'bg-teal-50 text-teal-700 border-teal-100', tone: 'text-slate-900' },
    { label: 'Registros de pago al día', value: cantidadAlDia, icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-700 border-emerald-100', tone: 'text-emerald-700' },
    { label: 'Registros morosos o pendientes', value: cantidadMorosos, icon: AlertTriangle, chip: 'bg-rose-50 text-rose-700 border-rose-100', tone: 'text-rose-700' },
    { label: 'Monto moroso o pendiente', value: `S/ ${deuda.toFixed(2)}`, icon: DollarSign, chip: 'bg-amber-50 text-amber-700 border-amber-100', tone: 'text-amber-700' }
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 text-slate-900 md:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700"><BadgeAlert className="h-4 w-4" aria-hidden="true"/> FINANZAS DE LA ACADEMIA</div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Pagos y morosidad por ciclo</h1>
          <p className="mt-1 text-sm text-slate-500">Consulta a los alumnos matriculados y el estado de sus pagos en cada ciclo.</p>
        </div>
        <button onClick={cargarDatos} disabled={loading || cargandoCiclos || !idCiclo} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true"/> Actualizar</button>
      </header>

      {mensaje && <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{mensaje.tipo === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true"/> : <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true"/>}<span>{mensaje.texto}</span></div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Selecciona el ciclo
          <select value={idCiclo} onChange={(e) => { cargaSeqRef.current += 1; setPagos([]); setIdCiclo(e.target.value); }} disabled={actualizando !== null || cargandoCiclos || ciclos.length === 0} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500">
            {ciclos.length === 0 && <option value="">No hay ciclos activos</option>}
            {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre} · {c.turno || 'Turno por definir'}</option>)}
          </select>
        </label>
        {cicloActual && <p className="mt-3 text-xs text-slate-500">{cicloActual.nombre} · {cicloActual.universidadObjetivo || 'Preuniversitario'} · {cicloActual.totalAlumnos ?? 0} matriculados registrados en catálogo</p>}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(({label,value,icon:Icon,chip,tone}) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className={`p-2 rounded-lg border ${chip}`}><Icon className="h-4 w-4" aria-hidden="true"/></span></div><p className={`mt-3 text-2xl font-bold ${tone}`}>{loading ? '…' : value}</p></div>)}
      </section>
      {sinPago > 0 && <p className="text-xs text-slate-500">Hay {sinPago} alumnos matriculados sin ningún registro de pago para este ciclo. Aparecen abajo como “Sin registro”; no se pueden marcar como pagados o morosos hasta que exista una cuota registrada.</p>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><h2 className="font-bold text-slate-900">Detalle de alumnos y pagos</h2><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno o código..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 sm:w-64"/></div><select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-500"><option value="todos">Todos los estados</option><option value="al-dia">Pagados</option><option value="morosos">Morosos / pendientes</option><option value="sin-registro">Sin registro de pago</option></select></div></div>
        {loading ? <div className="p-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin" aria-hidden="true"/>Cargando pagos del ciclo...</div> : listaFiltrada.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true"/><p className="mt-3 font-bold text-slate-900">No hay registros para los filtros seleccionados.</p><p className="mt-1 text-xs text-slate-500">Si el ciclo sí tiene alumnos, comprueba que sus matrículas estén activas.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4 font-semibold">Alumno</th><th className="px-5 py-4 font-semibold">Mes / concepto</th><th className="px-5 py-4 font-semibold">Monto</th><th className="px-5 py-4 font-semibold">Estado</th><th className="px-5 py-4 font-semibold">Fecha de pago</th><th className="px-5 py-4 font-semibold">Acción</th></tr></thead><tbody>{listaFiltrada.map((item,index) => <tr key={`${item.idPago || item.idUsuario || index}-${item.mes}`} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{item.alumno}</p><p className="mt-1 text-xs text-slate-500">{item.codigoUsuario || 'Sin código'}</p></td><td className="px-5 py-4 text-slate-700">{item.mes}</td><td className="px-5 py-4 font-bold text-slate-900">S/ {item.monto.toFixed(2)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-md border px-2.5 py-1 text-[10px] font-bold ${alDia(item.estado) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : moroso(item.estado) ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{item.estado}</span></td><td className="px-5 py-4 text-slate-500">{item.fechaPago ? new Date(item.fechaPago).toLocaleDateString('es-PE') : '—'}</td><td className="px-5 py-4">{esInscripcionPendiente(item) ? <span className="text-xs text-amber-700">Pendiente de confirmación</span> : item.idPago ? <button onClick={() => actualizarEstado(item)} disabled={actualizando !== null} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">{actualizando === item.idPago ? 'Actualizando…' : alDia(item.estado) ? 'Marcar moroso' : 'Marcar pagado'}</button> : <span className="text-xs text-slate-500">Crear cuota primero</span>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}


