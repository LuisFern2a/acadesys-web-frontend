import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Save, 
  CheckCheck,
  School
} from 'lucide-react';
import { 
  obtenerAulas, 
  obtenerAsistenciaPorAulaYFecha, 
  guardarAsistencia 
} from '../services/api';

export default function AsistenciaPage() {
  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('1');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  useEffect(() => {
    cargarAulas();
  }, []);

  useEffect(() => {
    if (aulaSeleccionada && fechaSeleccionada) {
      cargarAsistencia();
    }
  }, [aulaSeleccionada, fechaSeleccionada]);

  const cargarAulas = async () => {
    const dataAulas = await obtenerAulas();
    setAulas(dataAulas || []);
    if (dataAulas && dataAulas.length > 0) {
      setAulaSeleccionada(String(dataAulas[0].idAula));
    }
  };

  const cargarAsistencia = async () => {
    setCargando(true);
    setGuardadoExitoso(false);
    const data = await obtenerAsistenciaPorAulaYFecha(aulaSeleccionada, fechaSeleccionada);
    setAlumnos(data || []);
    setCargando(false);
  };

  const cambiarEstadoAlumno = (idAlumno, nuevoEstado) => {
    setAlumnos(prev =>
      prev.map(a =>
        a.idAlumno === idAlumno
          ? {
              ...a,
              estado: nuevoEstado,
              horaLlegada:
                nuevoEstado === 'presente'
                  ? '07:50 AM'
                  : nuevoEstado === 'tardanza'
                  ? '08:15 AM'
                  : '--'
            }
          : a
      )
    );
  };

  const marcarTodosPresentes = () => {
    setAlumnos(prev =>
      prev.map(a => ({
        ...a,
        estado: 'presente',
        horaLlegada: '07:50 AM'
      }))
    );
  };

  const handleGuardar = async () => {
    await guardarAsistencia(aulaSeleccionada, fechaSeleccionada, alumnos);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  const total = alumnos.length;
  const presentes = alumnos.filter(a => a.estado === 'presente').length;
  const tardanzas = alumnos.filter(a => a.estado === 'tardanza').length;
  const faltas = alumnos.filter(a => a.estado === 'falta').length;
  const porcentajeAsistencia = total > 0 ? (((presentes + tardanzas) / total) * 100).toFixed(1) : 0;

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Control de Asistencia</h1>
              <p className="text-slate-500 text-sm">
                Registro diario por salones, control de puntualidad y justificaciones
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={marcarTodosPresentes}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Marcar Todos Presente
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {guardadoExitoso ? '¡Guardado!' : 'Guardar Asistencia'}
          </button>
        </div>
      </div>

      {/* FILTROS DE SALÓN Y FECHA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <School className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Aula / Salón
            </label>
            <select
              value={aulaSeleccionada}
              onChange={(e) => setAulaSeleccionada(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {aulas.map((a) => (
                <option key={a.idAula} value={a.idAula}>
                  {a.nombre} ({a.nivel})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Fecha de Registro
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* RESUMEN ESTADÍSTICO */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Alumnos</span>
          <p className="text-xl font-bold text-slate-800 mt-1">{total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Presentes</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{presentes}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-amber-600">Tardanzas</span>
          <p className="text-xl font-bold text-amber-700 mt-1">{tardanzas}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-rose-600">Faltas</span>
          <p className="text-xl font-bold text-rose-700 mt-1">{faltas}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-indigo-600">Efectividad</span>
          <p className="text-xl font-bold text-indigo-700 mt-1">{porcentajeAsistencia}%</p>
        </div>
      </div>

      {/* TABLA NOMINAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Nómina de Estudiantes
          </h2>
          <span className="text-xs text-slate-400">Selecciona el estado con un clic</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3.5 px-6">N°</th>
                <th className="py-3.5 px-6">Estudiante</th>
                <th className="py-3.5 px-4 text-center">Hora Llegada</th>
                <th className="py-3.5 px-6 text-center">Estado de Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                    Cargando nómina...
                  </td>
                </tr>
              ) : (
                alumnos.map((alumno, idx) => (
                  <tr key={alumno.idAlumno} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">{alumno.nombre}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                      {alumno.horaLlegada}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(alumno.idAlumno, 'presente')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            alumno.estado === 'presente'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                        </button>

                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(alumno.idAlumno, 'tardanza')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            alumno.estado === 'tardanza'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Tardanza
                        </button>

                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(alumno.idAlumno, 'falta')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            alumno.estado === 'falta'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" /> Falta
                        </button>

                        <button
                          type="button"
                          onClick={() => cambiarEstadoAlumno(alumno.idAlumno, 'justificado')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            alumno.estado === 'justificado'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" /> Justificado
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}