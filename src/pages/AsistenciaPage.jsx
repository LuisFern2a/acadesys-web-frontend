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
    if (!idCiclo || !fecha) { setAlumnos([]); return false; }
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
      return true;
    } catch (error) {
      setAlumnos([]);
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo cargar la asistencia del ciclo.' });
      return false;
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
      // Se recarga primero (el loader limpia el mensaje) y luego se confirma,
      // para que la confirmación no quede borrada de inmediato.
      const ok = await cargarAsistencia();
      if (ok) setMensaje({ tipo: 'exito', texto: `Asistencia guardada para ${alumnos.length} alumnos del ciclo ${cicloActual?.nombre || ''}.` });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo guardar la asistencia.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 text-slate-900 md:p-8 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-2"><CalendarCheck className="h-4 w-4" aria-hidden="true"/> CONTROL ACADÉMICO</div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Asistencia por ciclo</h1>
          <p className="mt-1 text-sm text-slate-500">Registra la asistencia de los alumnos matriculados en el ciclo seleccionado, sin filtrar por aula.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={cargarAsistencia} disabled={cargando || !idCiclo} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true"/> Actualizar</button>
          <button onClick={guardar} disabled={guardando || cargando || alumnos.length === 0 || alumnos.some((a) => !estadoAsistenciaValido(a.estado))} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true"/>{guardando ? 'Guardando...' : 'Guardar asistencia'}</button>
        </div>
      </header>

      {mensaje && <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{mensaje.tipo === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true"/> : <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true"/>}<span>{mensaje.texto}</span></div>}

      <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Ciclo preuniversitario
          <select value={idCiclo} onChange={(e) => setIdCiclo(e.target.value)} disabled={cargandoInicial || ciclos.length === 0} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600">
            {ciclos.length === 0 && <option value="">No hay ciclos activos</option>}
            {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre} · {c.turno || 'Turno por definir'}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Fecha de asistencia
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600"/>
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
          <span className="text-slate-700"><strong className="text-slate-900">{cicloActual?.nombre || 'Sin ciclo seleccionado'}</strong> {cicloActual?.universidadObjetivo ? `· ${cicloActual.universidadObjetivo}` : ''}</span>
          <span className="inline-flex items-center gap-2 text-slate-500"><Users className="h-4 w-4" aria-hidden="true"/>{alumnos.length} alumnos matriculados consultados</span>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Presentes', resumen.presente, 'text-emerald-700'],
          ['Tardanzas', resumen.tardanza, 'text-amber-700'],
          ['Faltas', resumen.falta, 'text-rose-700'],
          ['Justificados', resumen.justificado, 'text-blue-700']
        ].map(([label, valor, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{valor}</p></div>)}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Lista de alumnos</h2>{cargando && <span className="inline-flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>Cargando...</span>}</div>
        {cargandoInicial ? <div className="p-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin" aria-hidden="true"/>Cargando ciclos...</div> : alumnos.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true"/><p className="mt-3 font-bold text-slate-900">No se encontraron matrículas activas para este ciclo.</p><p className="mt-1 text-sm text-slate-500">Verifica que el ciclo tenga alumnos registrados.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4 font-semibold">N.º</th><th className="px-5 py-4 font-semibold">Alumno</th><th className="px-5 py-4 font-semibold">Estado</th><th className="px-5 py-4 font-semibold"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true"/>Hora de llegada</span></th></tr></thead><tbody>{alumnos.map((a,i) => <tr key={a.idMatricula} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4 text-slate-500">{i+1}</td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{a.nombre}</p>{a.codigo && <p className="mt-1 text-xs text-slate-500">{a.codigo}</p>}</td><td className="px-5 py-4"><select value={ESTADOS.some((e) => e.value === a.estado) ? a.estado : 'pendiente'} onChange={(e) => cambiarEstado(a.idMatricula,e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600"><option value="pendiente">Seleccionar estado...</option>{ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}</select></td><td className="px-5 py-4"><input aria-label={`Hora de llegada de ${a.nombre}`} type="time" value={a.horaLlegada || ''} disabled={!['presente','tardanza'].includes(a.estado)} onChange={(e) => setAlumnos((actuales) => actuales.map((x) => x.idMatricula === a.idMatricula ? {...x,horaLlegada:e.target.value} : x))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 disabled:opacity-40"/></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
