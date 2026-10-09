import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  CheckCheck,
  School,
  RefreshCw,
} from 'lucide-react';
import {
  obtenerAulas,
  obtenerAsistenciaPorAulaYFecha,
  guardarAsistencia,
} from '../services/api';

const ESTADOS_VALIDOS = ['presente', 'tardanza', 'falta', 'justificado'];

function fechaLocalISO() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function horaLocalHHMM() {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

export default function AsistenciaPage() {
  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaLocalISO);
  const [alumnos, setAlumnos] = useState([]);
  const [cargandoAulas, setCargandoAulas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const cargarAulas = async () => {
    setCargandoAulas(true);
    setMensajeError('');
    try {
      const data = await obtenerAulas();
      setAulas(data);
      setAulaSeleccionada((actual) => {
        if (actual && data.some((a) => String(a.idAula ?? a.IdAula) === String(actual))) return actual;
        return data.length ? String(data[0].idAula ?? data[0].IdAula) : '';
      });
    } catch (error) {
      setAulas([]);
      setAulaSeleccionada('');
      setMensajeError(error.message || 'No se pudieron cargar las aulas desde el servidor.');
    } finally {
      setCargandoAulas(false);
    }
  };

  const cargarAsistencia = async () => {
    if (!aulaSeleccionada || !fechaSeleccionada) {
      setAlumnos([]);
      return;
    }
    setCargando(true);
    setMensajeError('');
    setMensajeExito('');
    try {
      const data = await obtenerAsistenciaPorAulaYFecha(aulaSeleccionada, fechaSeleccionada);
      setAlumnos(data.map((alumno) => ({
        ...alumno,
        idMatricula: Number(alumno.idMatricula ?? alumno.IdMatricula),
        idAlumno: Number(alumno.idAlumno ?? alumno.IdAlumno ?? alumno.idMatricula ?? alumno.IdMatricula),
        nombre: alumno.nombre ?? alumno.Nombre ?? 'Alumno sin nombre',
        estado: alumno.estado ?? alumno.Estado ?? 'pendiente',
        horaLlegada: alumno.horaLlegada ?? alumno.HoraLlegada ?? '--',
      })));
    } catch (error) {
      setAlumnos([]);
      setMensajeError(error.message || 'No se pudo consultar la asistencia desde el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAulas();
  }, []);

  useEffect(() => {
    if (aulaSeleccionada && fechaSeleccionada) cargarAsistencia();
    else setAlumnos([]);
  }, [aulaSeleccionada, fechaSeleccionada]);

  const cambiarEstadoAlumno = (idMatricula, nuevoEstado) => {
    const hora = ['presente', 'tardanza'].includes(nuevoEstado) ? horaLocalHHMM() : '--';
    setMensajeExito('');
    setAlumnos((prev) => prev.map((alumno) => (
      Number(alumno.idMatricula) === Number(idMatricula)
        ? { ...alumno, estado: nuevoEstado, horaLlegada: hora }
        : alumno
    )));
  };

  const marcarTodosPresentes = () => {
    const hora = horaLocalHHMM();
    setMensajeExito('');
    setAlumnos((prev) => prev.map((alumno) => ({
      ...alumno,
      estado: 'presente',
      horaLlegada: hora,
    })));
  };

  const handleGuardar = async () => {
    if (!aulaSeleccionada) {
      setMensajeError('Selecciona un aula antes de guardar.');
      return;
    }
    if (alumnos.length === 0) {
      setMensajeError('No hay alumnos para guardar en esta aula y fecha.');
      return;
    }
    const pendientes = alumnos.filter((alumno) => !ESTADOS_VALIDOS.includes(alumno.estado));
    if (pendientes.length) {
      setMensajeError(`Debes seleccionar el estado de asistencia de los ${pendientes.length} alumno(s) pendientes.`);
      return;
    }

    setGuardando(true);
    setMensajeError('');
    setMensajeExito('');
    try {
      const respuesta = await guardarAsistencia(aulaSeleccionada, fechaSeleccionada, alumnos);
      await cargarAsistencia();
      setMensajeExito(respuesta.message || 'Asistencia guardada correctamente en la base de datos.');
    } catch (error) {
      setMensajeError(error.message || 'No se pudo guardar la asistencia en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const resumen = useMemo(() => {
    const total = alumnos.length;
    const presentes = alumnos.filter((a) => a.estado === 'presente').length;
    const tardanzas = alumnos.filter((a) => a.estado === 'tardanza').length;
    const faltas = alumnos.filter((a) => a.estado === 'falta').length;
    const justificados = alumnos.filter((a) => a.estado === 'justificado').length;
    const porcentaje = total ? (((presentes + tardanzas + justificados) / total) * 100).toFixed(1) : '0.0';
    return { total, presentes, tardanzas, faltas, justificados, porcentaje };
  }, [alumnos]);

  const aulasDisponibles = aulas.map((aula) => ({
    id: aula.idAula ?? aula.IdAula,
    nombre: aula.nombre ?? aula.Nombre,
    nivel: aula.nivel ?? aula.Nivel ?? 'General',
  }));

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Control de Asistencia</h1>
            <p className="mt-0.5 text-sm text-slate-500">Registro diario por salones y control de puntualidad</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={cargarAsistencia} disabled={!aulaSeleccionada || cargando}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button type="button" onClick={marcarTodosPresentes} disabled={alumnos.length === 0 || cargando}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <CheckCheck className="h-4 w-4 text-emerald-600" /> Marcar todos presentes
          </button>
          <button type="button" onClick={handleGuardar} disabled={guardando || cargando || alumnos.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Save className="h-4 w-4" /> {guardando ? 'Guardando...' : 'Guardar asistencia'}
          </button>
        </div>
      </div>

      {mensajeError && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{mensajeError}</span>
        </div>
      )}
      {mensajeExito && (
        <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{mensajeExito}</span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <School className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="w-full">
            <label htmlFor="aula-asistencia" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Aula / salón</label>
            <select id="aula-asistencia" value={aulaSeleccionada} onChange={(e) => setAulaSeleccionada(e.target.value)} disabled={cargandoAulas}
              className="w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:opacity-60">
              {cargandoAulas && <option value="">Cargando aulas...</option>}
              {!cargandoAulas && aulasDisponibles.length === 0 && <option value="">Sin aulas registradas</option>}
              {aulasDisponibles.map((aula) => <option key={aula.id} value={aula.id}>{aula.nombre} ({aula.nivel})</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
          <Clock className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="w-full">
            <label htmlFor="fecha-asistencia" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Fecha de registro</label>
            <input id="fecha-asistencia" type="date" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-800 outline-none" />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ['Total alumnos', resumen.total, 'text-slate-800'],
          ['Presentes', resumen.presentes, 'text-emerald-700'],
          ['Tardanzas', resumen.tardanzas, 'text-amber-700'],
          ['Faltas', resumen.faltas, 'text-rose-700'],
          ['Justificados', resumen.justificados, 'text-indigo-700'],
          ['Efectividad', `${resumen.porcentaje}%`, 'text-violet-700'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-bold uppercase text-slate-400">{label}</span>
            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Users className="h-4 w-4 text-indigo-600" /> Nómina de estudiantes</h2>
          <span className="text-xs font-medium text-slate-400">Selecciona el estado con un clic</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <th className="px-6 py-3.5">N°</th><th className="px-6 py-3.5">Estudiante</th><th className="px-4 py-3.5 text-center">Hora llegada</th><th className="px-6 py-3.5 text-center">Estado de asistencia</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {cargando ? <tr><td colSpan={4} className="py-8 text-center text-xs text-slate-400">Cargando nómina desde el servidor...</td></tr>
                : alumnos.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-xs text-slate-400">{mensajeError ? 'No se pudo cargar la nómina.' : 'No se encontraron alumnos asignados a esta aula.'}</td></tr>
                  : alumnos.map((alumno, index) => (
                    <tr key={alumno.idMatricula} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{index + 1}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{alumno.nombre}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500">{alumno.horaLlegada || '--'}</td>
                      <td className="px-6 py-3.5"><div className="flex flex-wrap items-center justify-center gap-1.5">
                        <button type="button" onClick={() => cambiarEstadoAlumno(alumno.idMatricula, 'presente')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${alumno.estado === 'presente' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}><CheckCircle2 className="h-3.5 w-3.5" />Presente</button>
                        <button type="button" onClick={() => cambiarEstadoAlumno(alumno.idMatricula, 'tardanza')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${alumno.estado === 'tardanza' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'}`}><Clock className="h-3.5 w-3.5" />Tardanza</button>
                        <button type="button" onClick={() => cambiarEstadoAlumno(alumno.idMatricula, 'falta')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${alumno.estado === 'falta' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'}`}><AlertCircle className="h-3.5 w-3.5" />Falta</button>
                        <button type="button" onClick={() => cambiarEstadoAlumno(alumno.idMatricula, 'justificado')} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${alumno.estado === 'justificado' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}>Justificado</button>
                      </div></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
