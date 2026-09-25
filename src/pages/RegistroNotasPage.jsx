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
  Sparkles,
  UserPlus,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  obtenerAulas, 
  obtenerCursos, 
  obtenerNotasPorAulaYCurso, 
  guardarNotasDocente,
  cerrarSimulacroActa
} from '../services/api';

export default function RegistroNotasPage() {
  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  })();

  const colorTema = sessionData.colorTema || '#4f46e5';

  const [aulas, setAulas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('1');
  const [cursoSeleccionado, setCursoSeleccionado] = useState('1');
  const [periodo, setPeriodo] = useState('simulacro-1');

  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [simulacroCerrado, setSimulacroCerrado] = useState(false);

  // Modal para nuevo alumno
  const [modalNuevoAlumno, setModalNuevoAlumno] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');

  useEffect(() => {
    cargarSelectores();
  }, []);

  useEffect(() => {
    if (aulaSeleccionada && cursoSeleccionado && periodo) {
      cargarNotas();
      verificarEstadoCierre();
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

  const getStorageKey = () => `notas_${aulaSeleccionada}_${cursoSeleccionado}_${periodo}`;
  const getCierreKey = () => `cierre_${aulaSeleccionada}_${cursoSeleccionado}_${periodo}`;

  const verificarEstadoCierre = () => {
    const estado = localStorage.getItem(getCierreKey());
    setSimulacroCerrado(estado === 'cerrado');
  };

  const cargarNotas = async () => {
    setCargando(true);
    setGuardadoExitoso(false);

    const key = getStorageKey();
    const guardadoLocal = localStorage.getItem(key);

    if (guardadoLocal) {
      try {
        setEstudiantes(JSON.parse(guardadoLocal));
        setCargando(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const data = await obtenerNotasPorAulaYCurso(aulaSeleccionada, cursoSeleccionado, periodo);
      const listaFinal = Array.isArray(data) ? data : [];
      setEstudiantes(listaFinal);
      localStorage.setItem(key, JSON.stringify(listaFinal));
    } catch (err) {
      console.error(err);
      setEstudiantes([]);
    } finally {
      setCargando(false);
    }
  };

  // HU-07: Bloqueo en tiempo real de letras, negativos y valores > 20
  const handleNotaChange = (idAlumno, campo, valorCrudo) => {
    if (simulacroCerrado) return;

    // 1. Eliminar cualquier caracter no numérico (evita signos, letras, puntos o exponenciales)
    const valorLimpio = valorCrudo.replace(/[^0-9]/g, '');

    let valorFinal = '';
    if (valorLimpio !== '') {
      let num = parseInt(valorLimpio, 10);
      if (isNaN(num) || num < 0) num = 0;
      if (num > 20) num = 20; // Techo estricto vigesimal
      valorFinal = num;
    }

    const actualizados = estudiantes.map(est =>
      est.idAlumno === idAlumno
        ? { ...est, [campo]: valorFinal }
        : est
    );

    setEstudiantes(actualizados);
    localStorage.setItem(getStorageKey(), JSON.stringify(actualizados));
  };

  // Cálculo de promedio vigesimal ponderado
  const calcularPromedio = (parcial, tareas, final) => {
    const p = Number(parcial) || 0;
    const t = Number(tareas) || 0;
    const f = Number(final) || 0;
    return Number((p * 0.3 + t * 0.3 + f * 0.4).toFixed(1));
  };

  const handleGuardar = async () => {
    if (simulacroCerrado) return;

    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(estudiantes));
    try {
      await guardarNotasDocente(aulaSeleccionada, cursoSeleccionado, periodo, estudiantes);
    } catch (e) {
      console.warn("Persistido localmente:", e);
    }
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // HU-07: SweetAlert2 para el cierre oficial e irreversible de actas
  const handleConfirmarCierre = async () => {
    if (simulacroCerrado) return;

    const aulaObj = aulas.find(a => String(a.idAula) === String(aulaSeleccionada));
    const cursoObj = cursos.find(c => String(c.idCurso) === String(cursoSeleccionado));
    const nombreAula = aulaObj ? aulaObj.nombre : 'Aula';
    const nombreCurso = cursoObj ? cursoObj.nombre : 'Curso';

    try {
      const result = await Swal.fire({
        title: '¿Confirmar cierre de simulacro?',
        html: `
          <div style="font-size: 13px; text-align: left; color: #94a3b8; line-height: 1.6;">
            Estás a punto de sellar el acta de calificaciones para:
            <br/><strong style="color: #ffffff;">${nombreCurso}</strong> en <strong style="color: #ffffff;">${nombreAula}</strong> (${periodo}).
            <br/><br/>
            <span style="color: #f87171; font-weight: 700;">⚠️ Advertencia:</span> Una vez cerrada el acta, las notas quedarán en modo <strong>solo lectura</strong> y no podrán ser modificadas por ningún docente.
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#334155',
        confirmButtonText: 'Sí, cerrar acta definitiva',
        cancelButtonText: 'Cancelar',
        background: '#0f172a',
        color: '#f8fafc',
        customClass: {
          popup: 'border border-slate-800 rounded-3xl shadow-2xl'
        }
      });

      if (result.isConfirmed) {
        await cerrarSimulacroActa(aulaSeleccionada, cursoSeleccionado, periodo);

        // Bloqueo persistido
        localStorage.setItem(getCierreKey(), 'cerrado');
        setSimulacroCerrado(true);

        await Swal.fire({
          title: '¡Acta Cerrada Exitosamente!',
          text: 'El registro de simulacro ha sido sellado y bloqueado para futuras ediciones.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          background: '#0f172a',
          color: '#f8fafc',
          customClass: {
            popup: 'border border-slate-800 rounded-3xl shadow-2xl'
          }
        });
      }
    } catch {
      // Fallback nativo tolerante
      if (window.confirm("¿Estás seguro de cerrar definitivamente el acta del simulacro? Esta acción es irreversible.")) {
        await cerrarSimulacroActa(aulaSeleccionada, cursoSeleccionado, periodo);
        localStorage.setItem(getCierreKey(), 'cerrado');
        setSimulacroCerrado(true);
        alert("Acta sellada correctamente.");
      }
    }
  };

  const handleAgregarEstudiante = (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || simulacroCerrado) return;

    const idGenerado = `alum-${Date.now()}`;
    const codigoGenerado = nuevoCodigo.trim() || `SEMSM-Q${Math.floor(1000 + Math.random() * 9000)}`;

    const nuevoEstudiante = {
      idAlumno: idGenerado,
      nombre: nuevoNombre.trim(),
      codigo: codigoGenerado,
      parcial: 0,
      tareas: 0,
      final: 0
    };

    const nuevaLista = [...estudiantes, nuevoEstudiante];
    setEstudiantes(nuevaLista);
    localStorage.setItem(getStorageKey(), JSON.stringify(nuevaLista));

    setNuevoNombre('');
    setNuevoCodigo('');
    setModalNuevoAlumno(false);
  };

  // Métricas
  const total = estudiantes.length;
  const promedios = estudiantes.map(e => calcularPromedio(e.parcial, e.tareas, e.final));
  const promedioGeneral = total > 0 ? (promedios.reduce((a, b) => a + b, 0) / total).toFixed(1) : 0;
  const aprobados = promedios.filter(p => p >= 13).length;
  const enRiesgo = total - aprobados;
  const tasaAprobacion = total > 0 ? ((aprobados / total) * 100).toFixed(0) : 0;

  return (
    <div className="p-6 md:p-10 font-sans text-slate-100 bg-slate-950 min-h-screen space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HU-07: Calificaciones Preuniversitarias y Cierre de Actas</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Registro de Notas de Simulacro
            </h1>
            {simulacroCerrado ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
                <Lock className="w-3.5 h-3.5" /> ACTA SELLADA (SOLO LECTURA)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                <Unlock className="w-3.5 h-3.5" /> EDICIÓN HABILITADA
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Escala vigesimal estricta (0 a 20). Los campos bloquean números negativos, letras y desbordes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={simulacroCerrado}
            onClick={() => setModalNuevoAlumno(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl font-semibold shadow-sm transition text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>+ Alumno</span>
          </button>

          <button
            type="button"
            disabled={simulacroCerrado}
            onClick={handleGuardar}
            className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: colorTema }}
          >
            <Save className="w-4 h-4" />
            <span>{guardadoExitoso ? '¡Guardado!' : 'Guardar Notas'}</span>
          </button>

          {/* Botón de Cierre con SweetAlert2 (HU-07) */}
          <button
            type="button"
            disabled={simulacroCerrado}
            onClick={handleConfirmarCierre}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-md transition text-xs cursor-pointer ${
              simulacroCerrado 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-95'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{simulacroCerrado ? 'Simulacro Cerrado' : 'Cerrar Acta de Simulacro'}</span>
          </button>
        </div>
      </div>

      {/* SELECTORES DE FILTRO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <School className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Aula / Ciclo
            </label>
            <select
              value={aulaSeleccionada}
              onChange={(e) => setAulaSeleccionada(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-indigo-500 transition"
            >
              {aulas.map((a) => (
                <option key={a.idAula} value={a.idAula}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Curso Evaluado
            </label>
            <select
              value={cursoSeleccionado}
              onChange={(e) => setCursoSeleccionado(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-indigo-500 transition"
            >
              {cursos.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>
                  {c.nombre} ({c.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Número de Simulacro
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-indigo-500 transition"
            >
              <option value="simulacro-1">Simulacro 1 - Admisión Fase I</option>
              <option value="simulacro-2">Simulacro 2 - Admisión Fase II</option>
              <option value="simulacro-3">Simulacro 3 - General Integral</option>
              <option value="simulacro-4">Simulacro 4 - Simulacro Final</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIS EN TIEMPO REAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Evaluados</span>
            <span className="text-xl font-black text-white">{total} alumnos</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Promedio General</span>
            <span className="text-xl font-black text-white font-mono">{promedioGeneral} <small className="text-xs text-slate-500 font-sans">/ 20</small></span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Aprobados</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{aprobados} ({tasaAprobacion}%)</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Bajo la Valla</span>
            <span className="text-xl font-black text-rose-400 font-mono">{enRiesgo} alumnos</span>
          </div>
        </div>
      </div>

      {/* TABLA DE CALIFICACIONES (HU-07) */}
      <div className="bg-slate-900/60 rounded-3xl shadow-xl border border-slate-800/80 overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Control de Ingreso Vigesimal • Ponderación: Parcial (30%) + Tareas (30%) + Final (40%)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">Validación Activa: [0 - 20]</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Estudiante</th>
                <th className="py-4 px-4 text-center w-36">Ex. Parcial (30%)</th>
                <th className="py-4 px-4 text-center w-36">Tareas (30%)</th>
                <th className="py-4 px-4 text-center w-36">Ex. Final (40%)</th>
                <th className="py-4 px-6 text-center w-32">Promedio</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Sincronizando libreta de calificaciones...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hay estudiantes registrados. Usa el botón "+ Alumno" para agregar uno.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est) => {
                  const promedio = calcularPromedio(est.parcial, est.tareas, est.final);
                  const enRiesgoAlumno = promedio < 13;

                  return (
                    <tr key={est.idAlumno} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-white block">{est.nombre}</span>
                        <span className="text-[11px] font-mono text-indigo-400">{est.codigo}</span>
                      </td>

                      {/* INPUT: EXAMEN PARCIAL */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={simulacroCerrado}
                          value={est.parcial}
                          onChange={(e) => handleNotaChange(est.idAlumno, 'parcial', e.target.value)}
                          className={`w-16 text-center py-1.5 px-2 border rounded-xl text-sm font-bold font-mono outline-none transition ${
                            simulacroCerrado
                              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                        />
                      </td>

                      {/* INPUT: TAREAS */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={simulacroCerrado}
                          value={est.tareas}
                          onChange={(e) => handleNotaChange(est.idAlumno, 'tareas', e.target.value)}
                          className={`w-16 text-center py-1.5 px-2 border rounded-xl text-sm font-bold font-mono outline-none transition ${
                            simulacroCerrado
                              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                        />
                      </td>

                      {/* INPUT: EXAMEN FINAL */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={simulacroCerrado}
                          value={est.final}
                          onChange={(e) => handleNotaChange(est.idAlumno, 'final', e.target.value)}
                          className={`w-16 text-center py-1.5 px-2 border rounded-xl text-sm font-bold font-mono outline-none transition ${
                            simulacroCerrado
                              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                        />
                      </td>

                      {/* PROMEDIO PONDERADO */}
                      <td className="py-4 px-6 text-center font-mono font-black text-sm">
                        <span className={enRiesgoAlumno ? 'text-rose-400' : 'text-emerald-400'}>
                          {promedio.toFixed(1)}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          enRiesgoAlumno
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {enRiesgoAlumno ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" /> En Riesgo
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado
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

      {/* MODAL MATRICULAR ALUMNO */}
      {modalNuevoAlumno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 text-slate-100">
            <button
              type="button"
              onClick={() => setModalNuevoAlumno(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Inscribir en Acta</h3>
                <p className="text-xs text-slate-400">Agregar a este simulacro y aula</p>
              </div>
            </div>

            <form onSubmit={handleAgregarEstudiante} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombres y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Ramírez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Código Pre-U (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: SEMSM-Q8921"
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevoAlumno(false)}
                  className="w-1/2 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white rounded-xl transition shadow-md cursor-pointer"
                  style={{ backgroundColor: colorTema }}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}