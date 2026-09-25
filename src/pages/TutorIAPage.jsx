import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Send, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  Target,
  RefreshCw,
  Award,
  Bot
} from 'lucide-react';
import { consultarTutorIA, obtenerNotasSimulacroAlumno } from '../services/api';

export default function TutorIAPage({ estudianteActivo }) {
  // Configuración de Sesión y Branding Multi-tenant
  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  })();

  const colorTema = sessionData.colorTema || '#4f46e5';
  const nombreAcademia = sessionData.nombreAcademia || 'AcadeSys Pre-U';

  // Perfil Preuniversitario del Estudiante (HU-06)
  const estudiante = {
    id: estudianteActivo?.id || 101,
    codigoUsuario: estudianteActivo?.codigoUsuario || sessionData.codigoUsuario || 'SEMSM-Q6265',
    nombre: estudianteActivo?.nombre || sessionData.nombre || 'Luis Fernando Tóccas',
    ciclo: estudianteActivo?.ciclo || 'Semestral San Marcos',
    universidadObjetivo: estudianteActivo?.universidadObjetivo || 'UNMSM (Universidad Nacional Mayor de San Marcos)',
    carrera: estudianteActivo?.carrera || 'Ingeniería de Sistemas',
    puestoRanking: estudianteActivo?.puestoRanking || 3,
    totalAlumnos: estudianteActivo?.totalAlumnos || 36,
    promedioGeneral: estudianteActivo?.promedioGeneral || 15.8,
    simulacros: estudianteActivo?.simulacros || [
      { simulacro: 'Simulacro 1', puntaje: 14.5, fecha: '2026-09-07' },
      { simulacro: 'Simulacro 2', puntaje: 16.2, fecha: '2026-09-14' },
      { simulacro: 'Simulacro 3', puntaje: 16.7, fecha: '2026-09-21' }
    ],
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', promedio: 16.2 },
      { id: 2, nombre: 'Razonamiento Matemático (DECO)', promedio: 18.0 },
      { id: 3, nombre: 'Geometría del Espacio', promedio: 14.0 },
      { id: 4, nombre: 'Física y Cinemática', promedio: 11.0 },
      { id: 5, nombre: 'Química Orgánica', promedio: 12.3 }
    ]
  };

  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [planEstudio, setPlanEstudio] = useState(null);
  const [analizandoPlan, setAnalizandoPlan] = useState(false);

  const chatFinRef = useRef(null);

  const autoScroll = () => {
    chatFinRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    autoScroll();
  }, [mensajes, cargando]);

  const cursosCriticos = estudiante.cursos?.filter(c => c.promedio < 13) || [];
  const cursosDestacados = estudiante.cursos?.filter(c => c.promedio >= 16) || [];

  // Inicialización del Chat y Diagnóstico Preuniversitario
  useEffect(() => {
    setMensajes([
      {
        emisor: 'ia',
        texto: `¡Hola ${estudiante.nombre.split(' ')[0]}! Soy tu Tutor Pedagógico Preuniversitario en ${nombreAcademia}. He sincronizado tu rendimiento del ciclo ${estudiante.ciclo} con destino a ${estudiante.universidadObjetivo} (${estudiante.carrera}). ¿En qué tema, problema o estrategia de simulacro deseas enfocarte hoy?`,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    generarPlanPedagogico();
  }, [estudiante.id]);

  const generarPlanPedagogico = async () => {
    setAnalizandoPlan(true);
    const resumenMaterias = estudiante.cursos?.map(c => `${c.nombre}: ${c.promedio}`).join(', ');

    const consulta = `Analiza mi tendencia en simulacros y genera un diagnóstico estratégico de admisión.
Universidad Objetivo: ${estudiante.universidadObjetivo}
Carrera: ${estudiante.carrera}
Promedio General: ${estudiante.promedioGeneral}/20
Materias: ${resumenMaterias}
Historial de Simulacros: ${estudiante.simulacros.map(s => `${s.simulacro}:${s.puntaje}`).join(', ')}`;

    try {
      const resultado = await consultarTutorIA(consulta, {
        estudiante: estudiante.nombre,
        codigoUsuario: estudiante.codigoUsuario,
        universidadObjetivo: estudiante.universidadObjetivo,
        carrera: estudiante.carrera,
        historialSimulacros: estudiante.simulacros
      });

      setPlanEstudio({
        diagnostico: resultado.respuesta,
        fecha: new Date().toLocaleDateString('es-PE')
      });
    } catch {
      const tieneRiesgo = cursosCriticos.length > 0;
      setPlanEstudio({
        diagnostico: tieneRiesgo
          ? `Tu rendimiento general es competitivo (${estudiante.promedioGeneral}/20), pero necesitas asegurar la valla en ${cursosCriticos.map(c => c.nombre).join(' y ')} para garantizar tu ingreso a ${estudiante.carrera}.`
          : `Excelente consistencia en simulacros con promedio ${estudiante.promedioGeneral}/20. Te encuentras en rango favorable para alcanzar la vacante en ${estudiante.universidadObjetivo}.`,
        acciones: tieneRiesgo
          ? [
              `Priorizar 45 minutos diarios de problemas DECO en ${cursosCriticos[0]?.nombre || 'Física'}.`,
              'Resolver a tiempo real el banco de preguntas tipo admisión del último simulacro.',
              'Revisar las claves y justificaciones teóricas de los errores de cálculo vectorial.'
            ]
          : [
              'Simulación de examen con control riguroso de 3 minutos por pregunta.',
              'Refuerzo en preguntas trampa de Razonamiento Verbal y Matemático.',
              'Mantener la velocidad de resolución en ciencias exactas.'
            ],
        fecha: new Date().toLocaleDateString('es-PE')
      });
    } finally {
      setAnalizandoPlan(false);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!inputMensaje.trim() || cargando) return;

    const textoUsuario = inputMensaje.trim();
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setInputMensaje('');
    setMensajes(prev => [...prev, { emisor: 'usuario', texto: textoUsuario, hora }]);
    setCargando(true);

    try {
      const resultado = await consultarTutorIA(textoUsuario, {
        estudiante: estudiante.nombre,
        codigoUsuario: estudiante.codigoUsuario,
        universidadObjetivo: estudiante.universidadObjetivo,
        carrera: estudiante.carrera,
        historialSimulacros: estudiante.simulacros
      });

      setMensajes(prev => [
        ...prev, 
        { 
          emisor: 'ia', 
          texto: resultado.respuesta, 
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch {
      setMensajes(prev => [
        ...prev,
        {
          emisor: 'ia',
          texto: `Para ingresar a ${estudiante.carrera}, te aconsejo analizar el solucionario de este último simulacro y practicar las preguntas tipo DECO de los temas que más puntos otorgan en el prospecto.`,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl text-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: colorTema }}
          >
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Tutor Pedagógico IA</h1>
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini Pre-U
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Estudiante: <strong className="text-slate-200">{estudiante.nombre}</strong> | Código: <span className="font-mono text-indigo-400">{estudiante.codigoUsuario}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generarPlanPedagogico}
          disabled={analizandoPlan}
          className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${analizandoPlan ? 'animate-spin' : ''}`} />
          <span>Recalcular Diagnóstico Pre-U</span>
        </button>
      </div>

      {/* MÉTRICAS RÁPIDAS PREUNIVERSITARIAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promedio Simulacros</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black font-mono text-white">{estudiante.promedioGeneral}</span>
              <span className="text-xs text-slate-500 font-medium">/ 20.0</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cuadro de Mérito</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black font-mono text-amber-400">Puesto #{estudiante.puestoRanking}</span>
              <span className="text-xs text-slate-500 font-medium">de {estudiante.totalAlumnos}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            cursosCriticos.length > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {cursosCriticos.length > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cursos por Reforzar</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black font-mono text-white">{cursosCriticos.length}</span>
              <span className="text-xs text-slate-500 font-medium ml-1">
                {cursosCriticos.length === 1 ? 'materia crítica' : 'materias críticas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* PANEL IZQUIERDO: Diagnóstico y Meta */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ficha de Meta de Ingreso */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Objetivo de Admisión</span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Universidad Postulada:</p>
              <p className="text-sm font-bold text-white">{estudiante.universidadObjetivo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Especialidad / Carrera:</p>
              <p className="text-sm font-bold text-emerald-400">{estudiante.carrera}</p>
            </div>
          </div>

          {/* Diagnóstico Pedagógico de IA */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">Plan Pedagógico Predictivo</h2>
            </div>

            {analizandoPlan ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                Sintetizando tendencia con IA...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  {planEstudio?.diagnostico}
                </p>

                {planEstudio?.acciones && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Ruta de Acción Recomendada:
                    </span>
                    <ul className="space-y-2">
                      {planEstudio.acciones.map((acc, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{acc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rendimiento por Cursos */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Notas de Simulacro por Área</span>
            </h3>
            <div className="space-y-2">
              {estudiante.cursos?.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="font-medium text-slate-300">{c.nombre}</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                    c.promedio < 13 ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {c.promedio.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PANEL DERECHO: Chat Interactivo (HU-06) */}
        <div className="lg:col-span-3 bg-slate-900/60 rounded-3xl border border-slate-800/80 backdrop-blur-xl flex flex-col h-[650px] overflow-hidden shadow-xl">
          
          {/* Header del Chat */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: colorTema }}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-tight">Tutor Virtual Preuniversitario</h3>
                <span className="text-[11px] text-slate-400">Analizando el historial de: {estudiante.nombre}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Conectado
            </span>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
            {mensajes.map((m, idx) => {
              const esIA = m.emisor === 'ia';
              return (
                <div key={idx} className={`flex items-end gap-2.5 ${esIA ? 'justify-start' : 'justify-end'}`}>
                  {esIA && (
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mb-1 shadow-md"
                      style={{ backgroundColor: colorTema }}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl max-w-[82%] text-xs leading-relaxed transition-all shadow-md ${
                    esIA 
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none' 
                      : 'text-white rounded-br-none'
                  }`}
                  style={!esIA ? { backgroundColor: colorTema } : {}}
                  >
                    <p className="whitespace-pre-wrap">{m.texto}</p>
                    {m.hora && (
                      <span className={`block text-[10px] mt-1.5 text-right font-mono ${
                        esIA ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {m.hora}
                      </span>
                    )}
                  </div>

                  {!esIA && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Checklist 3 de HU-06: Animación "Tutor analizando..." */}
            {cargando && (
              <div className="flex items-end gap-2.5 justify-start">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mb-1 shadow-md"
                  style={{ backgroundColor: colorTema }}
                >
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-400 ml-2 font-medium">Tutor analizando...</span>
                </div>
              </div>
            )}

            <div ref={chatFinRef} />
          </div>

          {/* Barra de Entrada de Consulta */}
          <form onSubmit={handleEnviarMensaje} className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Pregúntale al tutor sobre tu puntaje en simulacros o tips para ${estudiante.universidadObjetivo}...`}
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              className="flex-1 text-xs px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition font-sans"
            />
            <button
              type="submit"
              disabled={cargando || !inputMensaje.trim()}
              className="p-3 text-white rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer active:scale-95"
              style={{ backgroundColor: colorTema }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}