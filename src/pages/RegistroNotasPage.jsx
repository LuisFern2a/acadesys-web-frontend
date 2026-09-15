import React, { useState, useEffect } from 'react';
import { 
  Award, 
  School, 
  BookOpen, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  obtenerAulas, 
  obtenerCursos, 
  obtenerNotasPorAulaYCurso, 
  guardarNotasDocente 
} from '../services/api';

export default function RegistroNotasPage() {
  const [aulas, setAulas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('1');
  const [cursoSeleccionado, setCursoSeleccionado] = useState('1');
  const [periodo, setPeriodo] = useState('bimestre-2');

  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  useEffect(() => {
    cargarSelectores();
  }, []);

  useEffect(() => {
    if (aulaSeleccionada && cursoSeleccionado && periodo) {
      cargarNotas();
    }
  }, [aulaSeleccionada, cursoSeleccionado, periodo]);

  const cargarSelectores = async () => {
    const [dataAulas, dataCursos] = await Promise.all([
      obtenerAulas(),
      obtenerCursos()
    ]);
    setAulas(dataAulas || []);
    setCursos(dataCursos || []);
    if (dataAulas?.length > 0) setAulaSeleccionada(String(dataAulas[0].idAula));
    if (dataCursos?.length > 0) setCursoSeleccionado(String(dataCursos[0].idCurso));
  };

  const cargarNotas = async () => {
    setCargando(true);
    setGuardadoExitoso(false);
    const data = await obtenerNotasPorAulaYCurso(aulaSeleccionada, cursoSeleccionado, periodo);
    setEstudiantes(data || []);
    setCargando(false);
  };

  // Validación y actualización vigesimal (0 a 20)
  const handleNotaChange = (idAlumno, campo, valorString) => {
    let valorNumerico = valorString === '' ? '' : Number(valorString);
    if (valorNumerico !== '') {
      if (valorNumerico < 0) valorNumerico = 0;
      if (valorNumerico > 20) valorNumerico = 20;
    }

    setEstudiantes(prev =>
      prev.map(est =>
        est.idAlumno === idAlumno
          ? { ...est, [campo]: valorNumerico }
          : est
      )
    );
  };

  // Cálculo de promedio ponderado: Parcial (30%), Tareas (30%), Final (40%)
  const calcularPromedio = (parcial, tareas, final) => {
    const p = Number(parcial) || 0;
    const t = Number(tareas) || 0;
    const f = Number(final) || 0;
    return Number((p * 0.3 + t * 0.3 + f * 0.4).toFixed(1));
  };

  const handleGuardar = async () => {
    await guardarNotasDocente(aulaSeleccionada, cursoSeleccionado, periodo, estudiantes);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Métricas dinámicas en vivo
  const total = estudiantes.length;
  const promedios = estudiantes.map(e => calcularPromedio(e.parcial, e.tareas, e.final));
  const promedioGeneral = total > 0 ? (promedios.reduce((a, b) => a + b, 0) / total).toFixed(1) : 0;
  const aprobados = promedios.filter(p => p >= 13).length;
  const enRiesgo = total - aprobados;
  const tasaAprobacion = total > 0 ? ((aprobados / total) * 100).toFixed(0) : 0;

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Registro de Calificaciones</h1>
              <p className="text-slate-500 text-sm">
                Ingreso de evaluaciones parciales, tareas y examen final (Escala Vigesimal 0-20)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition text-xs"
        >
          <Save className="w-4 h-4" />
          {guardadoExitoso ? '¡Calificaciones Guardadas!' : 'Guardar Calificaciones'}
        </button>
      </div>

      {/* SELECTORES DE FILTRO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <School className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Aula / Grado
            </label>
            <select
              value={aulaSeleccionada}
              onChange={(e) => setAulaSeleccionada(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {aulas.map((a) => (
                <option key={a.idAula} value={a.idAula}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
          <BookOpen className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Asignatura a Cargo
            </label>
            <select
              value={cursoSeleccionado}
              onChange={(e) => setCursoSeleccionado(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {cursos.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>
                  {c.nombre} ({c.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
          <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Periodo Bimestral
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="bimestre-1">I Bimestre</option>
              <option value="bimestre-2">II Bimestre (En Curso)</option>
              <option value="bimestre-3">III Bimestre</option>
              <option value="bimestre-4">IV Bimestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIS EN TIEMPO REAL DEL AULA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Evaluados</span>
            <span className="text-xl font-bold text-slate-800">{total} alumnos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Promedio Aula</span>
            <span className="text-xl font-bold text-slate-800">{promedioGeneral} <small className="text-xs text-slate-400">/ 20</small></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Aprobados</span>
            <span className="text-xl font-bold text-emerald-700">{aprobados} ({tasaAprobacion}%)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 block">En Riesgo</span>
            <span className="text-xl font-bold text-rose-700">{enRiesgo} alumnos</span>
          </div>
        </div>
      </div>

      {/* TABLA DE CALIFICACIONES INTERACTIVA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cuaderno de Calificaciones • Ponderación: Parcial (30%) + Tareas (30%) + Final (40%)
            </span>
          </div>
          <span className="text-xs text-slate-400">Ingresa valores de 0 a 20</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3.5 px-6">Estudiante</th>
                <th className="py-3.5 px-4 text-center w-32">Ex. Parcial (30%)</th>
                <th className="py-3.5 px-4 text-center w-32">Tareas (30%)</th>
                <th className="py-3.5 px-4 text-center w-32">Ex. Final (40%)</th>
                <th className="py-3.5 px-6 text-center w-32">Promedio</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Cargando calificaciones...
                  </td>
                </tr>
              ) : (
                estudiantes.map((est) => {
                  const promedio = calcularPromedio(est.parcial, est.tareas, est.final);
                  const enRiesgoAlumno = promedio < 13;

                  return (
                    <tr key={est.idAlumno} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-800 block">{est.nombre}</span>
                        <span className="text-[11px] font-mono text-slate-400">{est.codigo}</span>
                      </td>

                      {/* INPUT: EXAMEN PARCIAL */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={est.parcial}
                          onChange={(e) => handleNotaChange(est.idAlumno, 'parcial', e.target.value)}
                          className="w-16 text-center py-1 px-2 border border-slate-200 rounded-lg text-sm font-bold font-mono outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>

                      {/* INPUT: TAREAS */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={est.tareas}
                          onChange={(e) => handleNotaChange(est.idAlumno, 'tareas', e.target.value)}
                          className="w-16 text-center py-1 px-2 border border-slate-200 rounded-lg text-sm font-bold font-mono outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>

                      {/* INPUT: EXAMEN FINAL */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={est.final}
                          onChange={(e) => handleNotaChange(est.idAlumno, 'final', e.target.value)}
                          className="w-16 text-center py-1 px-2 border border-slate-200 rounded-lg text-sm font-bold font-mono outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>

                      {/* PROMEDIO PONDERADO EN VIVO */}
                      <td className="py-3.5 px-6 text-center font-mono font-bold text-base">
                        <span className={enRiesgoAlumno ? 'text-rose-600' : 'text-indigo-700'}>
                          {promedio.toFixed(1)}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          enRiesgoAlumno
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {enRiesgoAlumno ? (
                            <>
                              <AlertCircle className="w-3 h-3" /> En Riesgo
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Aprobado
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}