import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, BadgeAlert, CheckCircle2, DollarSign, Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { actualizarEstadoPago, obtenerCiclosPublicos, obtenerPagosPorCiclo } from '../services/api';

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

  const cargarCiclos = useCallback(async () => {
    setCargandoCiclos(true);
    try {
      const lista = await obtenerCiclosPublicos();
      setCiclos(lista);
      setIdCiclo((actual) => actual && lista.some((c) => String(c.idCiclo) === actual)
        ? actual : (lista.length ? String(lista[0].idCiclo) : ''));
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudieron cargar los ciclos.' });
      setCiclos([]);
    } finally {
      setCargandoCiclos(false);
    }
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!idCiclo) { setPagos([]); return; }
    setLoading(true);
    setMensaje(null);
    try {
      const data = await obtenerPagosPorCiclo(idCiclo);
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
    } catch (error) {
      setPagos([]);
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudieron cargar los pagos del ciclo.' });
    } finally {
      setLoading(false);
    }
  }, [idCiclo]);

  useEffect(() => { cargarCiclos(); }, [cargarCiclos]);
  useEffect(() => { if (!cargandoCiclos) cargarDatos(); }, [cargandoCiclos, cargarDatos]);

  const alDia = (estado) => estadoNormalizado(estado) === 'pagado';
  const moroso = (estado) => ['moroso','vencido','pendiente'].includes(estadoNormalizado(estado));
  const sinRegistro = (estado) => estadoNormalizado(estado) === 'sin registro';

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
    if (!item.idPago || actualizando) return;
    const nuevoEstado = alDia(item.estado) ? 'Moroso' : 'Pagado';
    const anterior = item.estado;
    setActualizando(item.idPago);
    setMensaje(null);
    setPagos((actuales) => actuales.map((p) => p.idPago === item.idPago ? { ...p, estado: nuevoEstado } : p));
    try {
      await actualizarEstadoPago(item.idPago, nuevoEstado);
      setMensaje({ tipo: 'exito', texto: `Estado de pago actualizado para ${item.alumno}.` });
      await cargarDatos();
    } catch (error) {
      setPagos((actuales) => actuales.map((p) => p.idPago === item.idPago ? { ...p, estado: anterior } : p));
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo actualizar el pago.' });
    } finally { setActualizando(null); }
  };

  const cicloActual = ciclos.find((c) => String(c.idCiclo) === String(idCiclo));
  const tarjetas = [
    { label: 'Alumnos matriculados en el ciclo', value: alumnosUnicos, icon: Users, color: 'text-sky-300' },
    { label: 'Registros de pago al día', value: cantidadAlDia, icon: CheckCircle2, color: 'text-emerald-300' },
    { label: 'Registros morosos o pendientes', value: cantidadMorosos, icon: AlertTriangle, color: 'text-rose-300' },
    { label: 'Monto de pagos morosos', value: `S/ ${deuda.toFixed(2)}`, icon: DollarSign, color: 'text-amber-300' }
  ];

  return (
    <div className="min-h-full space-y-6 bg-slate-950 p-6 text-slate-100 md:p-10">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300"><BadgeAlert className="h-4 w-4"/> FINANZAS DE LA ACADEMIA</div>
          <h1 className="text-3xl font-black">Pagos y morosidad por ciclo</h1>
          <p className="mt-1 text-sm text-slate-400">Consulta a los alumnos matriculados y el estado de sus pagos en cada ciclo.</p>
        </div>
        <button onClick={cargarDatos} disabled={loading || cargandoCiclos || !idCiclo} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Actualizar</button>
      </header>

      {mensaje && <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${mensaje.tipo === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>{mensaje.tipo === 'error' ? <AlertCircle className="h-5 w-5 shrink-0"/> : <CheckCircle2 className="h-5 w-5 shrink-0"/>}<span>{mensaje.texto}</span></div>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Selecciona el ciclo
          <select value={idCiclo} onChange={(e) => setIdCiclo(e.target.value)} disabled={cargandoCiclos || ciclos.length === 0} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500">
            {ciclos.length === 0 && <option value="">No hay ciclos activos</option>}
            {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre} · {c.turno || 'Turno por definir'}</option>)}
          </select>
        </label>
        {cicloActual && <p className="mt-3 text-xs text-slate-400">{cicloActual.nombre} · {cicloActual.universidadObjetivo || 'Preuniversitario'} · {cicloActual.totalAlumnos ?? 0} matriculados registrados en catálogo</p>}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(({label,value,icon:Icon,color}) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span><Icon className={`h-5 w-5 ${color}`}/></div><p className={`mt-3 text-2xl font-black ${color}`}>{loading ? '…' : value}</p></div>)}
      </section>
      {sinPago > 0 && <p className="text-xs text-slate-400">Hay {sinPago} alumnos matriculados sin ningún registro de pago para este ciclo. Aparecen abajo como “Sin registro”; no se pueden marcar como pagados o morosos hasta que exista una cuota registrada.</p>}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 md:flex-row md:items-center md:justify-between"><h2 className="font-bold">Detalle de alumnos y pagos</h2><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno o código..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 sm:w-64"/></div><select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white"><option value="todos">Todos los estados</option><option value="al-dia">Pagados</option><option value="morosos">Morosos / pendientes</option><option value="sin-registro">Sin registro de pago</option></select></div></div>
        {loading ? <div className="p-10 text-center text-slate-400"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin"/>Cargando pagos del ciclo...</div> : listaFiltrada.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto h-8 w-8 text-slate-600"/><p className="mt-3 font-bold">No hay registros para los filtros seleccionados.</p><p className="mt-1 text-xs text-slate-500">Si el ciclo sí tiene alumnos, comprueba que sus matrículas estén activas.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Alumno</th><th className="px-5 py-4">Mes / concepto</th><th className="px-5 py-4">Monto</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Fecha de pago</th><th className="px-5 py-4">Acción</th></tr></thead><tbody>{listaFiltrada.map((item,index) => <tr key={`${item.idPago || item.idUsuario || index}-${item.mes}`} className="border-t border-slate-800"><td className="px-5 py-4"><p className="font-semibold text-white">{item.alumno}</p><p className="mt-1 text-xs text-slate-500">{item.codigoUsuario || 'Sin código'}</p></td><td className="px-5 py-4 text-slate-300">{item.mes}</td><td className="px-5 py-4 font-bold text-white">S/ {item.monto.toFixed(2)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${alDia(item.estado) ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : moroso(item.estado) ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{item.estado}</span></td><td className="px-5 py-4 text-slate-400">{item.fechaPago ? new Date(item.fechaPago).toLocaleDateString('es-PE') : '—'}</td><td className="px-5 py-4">{item.idPago ? <button onClick={() => actualizarEstado(item)} disabled={actualizando !== null} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-800 disabled:opacity-40">{actualizando === item.idPago ? 'Actualizando…' : alDia(item.estado) ? 'Marcar moroso' : 'Marcar pagado'}</button> : <span className="text-xs text-slate-500">Crear cuota primero</span>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
