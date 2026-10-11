import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock, Loader2, RefreshCw, Save, Users } from 'lucide-react';
import { obtenerCiclosPublicos, obtenerAsistenciaPorCiclo, guardarAsistenciaPorCiclo } from '../services/api';

const ESTADOS = [
  { value: 'presente', label: 'Presente' },
  { value: 'tardanza', label: 'Tardanza' },
  { value: 'falta', label: 'Falta' },
  { value: 'justificado', label: 'Justificado' }
];

const estadoAsistenciaValido = (estado) => ['presente', 'tardanza', 'falta', 'justificado'].includes(String(estado || '').toLowerCase());

function fechaLocalISO() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function AsistenciaPage() {
  const [ciclos, setCiclos] = useState([]);
  const [idCiclo, setIdCiclo] = useState('');
  const [fecha, setFecha] = useState(fechaLocalISO);
  const [alumnos, setAlumnos] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarCiclos = useCallback(async () => {
    setCargandoInicial(true);
    setMensaje(null);
    try {
      const lista = await obtenerCiclosPublicos();
      setCiclos(lista);
      setIdCiclo((actual) => actual && lista.some((c) => String(c.idCiclo) === actual)
        ? actual
        : (lista.length ? String(lista[0].idCiclo) : ''));
    } catch (error) {
      setCiclos([]);
      setIdCiclo('');
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudieron cargar los ciclos.' });
    } finally {
      setCargandoInicial(false);
    }
  }, []);

  const cargarAsistencia = useCallback(async () => {
    if (!idCiclo || !fecha) { setAlumnos([]); return; }
    setCargando(true);
    setMensaje(null);
    try {
      const lista = await obtenerAsistenciaPorCiclo(idCiclo, fecha);
      setAlumnos(lista.map((alumno) => ({
        idMatricula: Number(alumno.idMatricula ?? alumno.IdMatricula),
        idUsuario: Number(alumno.idUsuario ?? alumno.IdUsuario),
        nombre: alumno.nombre ?? alumno.Nombre ?? 'Alumno sin nombre',
        codigo: alumno.codigoUsuario ?? alumno.CodigoUsuario ?? '',
        estado: String(alumno.estado ?? alumno.Estado ?? 'pendiente').toLowerCase(),
        horaLlegada: ['--', '—'].includes(String(alumno.horaLlegada ?? alumno.HoraLlegada ?? '')) ? '' : String(alumno.horaLlegada ?? alumno.HoraLlegada ?? '')
      })));
    } catch (error) {
      setAlumnos([]);
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo cargar la asistencia del ciclo.' });
    } finally {
      setCargando(false);
    }
  }, [idCiclo, fecha]);

  useEffect(() => { cargarCiclos(); }, [cargarCiclos]);
  useEffect(() => { if (!cargandoInicial) cargarAsistencia(); }, [cargandoInicial, cargarAsistencia]);

  const cicloActual = useMemo(() => ciclos.find((c) => String(c.idCiclo) === String(idCiclo)), [ciclos, idCiclo]);
  const resumen = useMemo(() => ({
    presente: alumnos.filter((a) => a.estado === 'presente').length,
    tardanza: alumnos.filter((a) => a.estado === 'tardanza').length,
    falta: alumnos.filter((a) => a.estado === 'falta').length,
    justificado: alumnos.filter((a) => a.estado === 'justificado').length
  }), [alumnos]);

  const cambiarEstado = (idMatricula, estado) => {
    setAlumnos((actuales) => actuales.map((a) => a.idMatricula === idMatricula
      ? { ...a, estado, horaLlegada: ['presente', 'tardanza'].includes(estado) ? (a.horaLlegada || new Date().toTimeString().slice(0, 5)) : '' }
      : a));
  };

  const guardar = async () => {
    if (!idCiclo) { setMensaje({ tipo: 'error', texto: 'Selecciona un ciclo antes de guardar.' }); return; }
    if (!alumnos.length) { setMensaje({ tipo: 'error', texto: 'No hay alumnos matriculados para registrar.' }); return; }
    if (alumnos.some((a) => !estadoAsistenciaValido(a.estado))) { setMensaje({ tipo: 'error', texto: 'Selecciona un estado para cada alumno antes de guardar.' }); return; }
    setGuardando(true);
    setMensaje(null);
    try {
      await guardarAsistenciaPorCiclo(idCiclo, fecha, alumnos.map((a) => ({
        idMatricula: a.idMatricula,
        estado: a.estado,
        horaLlegada: a.horaLlegada || null
      })));
      setMensaje({ tipo: 'exito', texto: `Asistencia guardada para ${alumnos.length} alumnos del ciclo ${cicloActual?.nombre || ''}.` });
      await cargarAsistencia();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo guardar la asistencia.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-6 md:p-10 text-slate-100 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300 mb-2"><CalendarCheck className="h-4 w-4"/> CONTROL ACADÉMICO</div>
          <h1 className="text-3xl font-black">Asistencia por ciclo</h1>
          <p className="mt-1 text-sm text-slate-400">Registra la asistencia de los alumnos matriculados en el ciclo seleccionado, sin filtrar por aula.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={cargarAsistencia} disabled={cargando || !idCiclo} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`}/> Actualizar</button>
          <button onClick={guardar} disabled={guardando || cargando || alumnos.length === 0 || alumnos.some((a) => !estadoAsistenciaValido(a.estado))} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"><Save className="h-4 w-4"/>{guardando ? 'Guardando...' : 'Guardar asistencia'}</button>
        </div>
      </header>

      {mensaje && <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${mensaje.tipo === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>{mensaje.tipo === 'error' ? <AlertCircle className="h-5 w-5 shrink-0"/> : <CheckCircle2 className="h-5 w-5 shrink-0"/>}<span>{mensaje.texto}</span></div>}

      <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Ciclo preuniversitario
          <select value={idCiclo} onChange={(e) => setIdCiclo(e.target.value)} disabled={cargandoInicial || ciclos.length === 0} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500">
            {ciclos.length === 0 && <option value="">No hay ciclos activos</option>}
            {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre} · {c.turno || 'Turno por definir'}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Fecha de asistencia
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"/>
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/70 p-3 text-sm">
          <span className="text-slate-300"><strong className="text-white">{cicloActual?.nombre || 'Sin ciclo seleccionado'}</strong> {cicloActual?.universidadObjetivo ? `· ${cicloActual.universidadObjetivo}` : ''}</span>
          <span className="inline-flex items-center gap-2 text-slate-400"><Users className="h-4 w-4"/>{alumnos.length} alumnos matriculados consultados</span>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Presentes', resumen.presente, 'text-emerald-300'],
          ['Tardanzas', resumen.tardanza, 'text-amber-300'],
          ['Faltas', resumen.falta, 'text-rose-300'],
          ['Justificados', resumen.justificado, 'text-sky-300']
        ].map(([label, valor, color]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-2xl font-black ${color}`}>{valor}</p></div>)}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><h2 className="font-bold">Lista de alumnos</h2>{cargando && <span className="inline-flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin"/>Cargando...</span>}</div>
        {cargandoInicial ? <div className="p-10 text-center text-slate-400"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin"/>Cargando ciclos...</div> : alumnos.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto h-8 w-8 text-slate-600"/><p className="mt-3 font-bold">No se encontraron matrículas activas para este ciclo.</p><p className="mt-1 text-sm text-slate-500">Verifica que el ciclo tenga alumnos registrados.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">N.º</th><th className="px-5 py-4">Alumno</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>Hora de llegada</span></th></tr></thead><tbody>{alumnos.map((a,i) => <tr key={a.idMatricula} className="border-t border-slate-800"><td className="px-5 py-4 text-slate-500">{i+1}</td><td className="px-5 py-4"><p className="font-semibold text-white">{a.nombre}</p>{a.codigo && <p className="mt-1 text-xs text-slate-500">{a.codigo}</p>}</td><td className="px-5 py-4"><select value={ESTADOS.some((e) => e.value === a.estado) ? a.estado : 'pendiente'} onChange={(e) => cambiarEstado(a.idMatricula,e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"><option value="pendiente">Seleccionar estado...</option>{ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}</select></td><td className="px-5 py-4"><input aria-label={`Hora de llegada de ${a.nombre}`} type="time" value={a.horaLlegada || ''} disabled={!['presente','tardanza'].includes(a.estado)} onChange={(e) => setAlumnos((actuales) => actuales.map((x) => x.idMatricula === a.idMatricula ? {...x,horaLlegada:e.target.value} : x))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-40"/></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
