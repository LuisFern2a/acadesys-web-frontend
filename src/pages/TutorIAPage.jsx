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
  Award
} from 'lucide-react';

export default function TutorIAPage({ estudianteActivo }) {
  // Lista oficial sincronizada con CalificacionesPage
  const cursosOficiales = [
    { id: 1, nombre: 'Álgebra Superior', promedio: 16.2 },
    { id: 2, nombre: 'Razonamiento Matemático', promedio: 18.0 },
    { id: 3, nombre: 'Geometría del Espacio', promedio: 14.0 },
    { id: 4, nombre: 'Física y Cinemática', promedio: 11.0 },
    { id: 5, nombre: 'Química Orgánica', promedio: 12.3 }
  ];

  const estudiante = {
    id: estudianteActivo?.id || 1,
    nombre: estudianteActivo?.nombre || 'Luis Fernando Tóccas',
    gradoCorto: estudianteActivo?.gradoCorto || '5to Sec',
    aula: estudianteActivo?.aula || '5to de Secundaria - Aula 101 UNI',
    puestoRanking: estudianteActivo?.puestoRanking || 3,
    totalAlumnos: estudianteActivo?.totalAlumnos || 36,
    promedioGeneral: estudianteActivo?.promedioGeneral || 15.8,
    cursos: (estudianteActivo?.cursos && estudianteActivo.cursos.length > 0) 
      ? estudianteActivo.cursos 
      : cursosOficiales
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

  useEffect(() => {
    setMensajes([
      {
        emisor: 'ia',
        texto: `¡Hola! Soy el Tutor Pedagógico Inteligente de AcadeSys. Estoy analizando el historial académico de **${estudiante.nombre}** (${estudiante.aula}). ¿En qué tema o curso te gustaría enfocar el plan de refuerzo hoy?`,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    generarPlanPedagogico();
  }, [estudiante.id]);

  const generarPlanPedagogico = async () => {
    setAnalizandoPlan(true);
    const resumenMaterias = estudiante.cursos?.map(c => `${c.nombre}: Promedio ${c.promedio}`).join(', ');

    const promptContextual = `Actúa como tutor pedagógico escolar de élite. Analiza al estudiante:
Nombre: ${estudiante.nombre}
Grado: ${estudiante.aula}
Promedio Ponderado: ${estudiante.promedioGeneral}/20
Materias: ${resumenMaterias}

Genera un diagnóstico conciso y 3 acciones clave para potenciar su aprendizaje.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API Key");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptContextual }] }] })
      });

      if (!response.ok) throw new Error("Error en Gemini API");
      const data = await response.json();
      const respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text;

      setPlanEstudio({
        diagnostico: respuestaTexto,
        fecha: new Date().toLocaleDateString('es-PE')
      });
    } catch {
      const tieneRiesgo = cursosCriticos.length > 0;
      setPlanEstudio({
        diagnostico: tieneRiesgo
          ? `Rendimiento global estable (${estudiante.promedioGeneral}/20), con necesidad de refuerzo focalizado en ${cursosCriticos.map(c => c.nombre).join(' y ')} para superar la valla aprobatoria institucional.`
          : `Excelente nivel académico con promedio de ${estudiante.promedioGeneral}/20. Se sugiere resolver ejercicios de nivel preuniversitario en ${cursosDestacados.map(c => c.nombre).join(', ')}.`,
        acciones: tieneRiesgo
          ? [
              `Dedicar 40 minutos diarios a repasar ejercicios prácticos de ${cursosCriticos[0]?.nombre || 'Física'} y ${cursosCriticos[1]?.nombre || 'Química'}.`,
              'Resolver el simulacro de diagnóstico paso a paso antes de la próxima evaluación parcial.',
              'Solicitar retroalimentación puntual al docente de área sobre el balance de errores comunes.'
            ]
          : [
              'Entrenamiento en simulacros con límite estricto de tiempo por problema.',
              'Aplicación de conceptos avanzados mediante proyectos prácticos.',
              'Mantener la constancia en el ritmo de entrega de tareas y evaluaciones.'
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API Key");

      const promptChat = `Eres el Tutor IA de AcadeSys para el estudiante ${estudiante.nombre} (${estudiante.aula}).
Promedio: ${estudiante.promedioGeneral}/20.
Cursos: ${estudiante.cursos?.map(c => `${c.nombre} (${c.promedio})`).join(', ')}.
Pregunta del usuario: "${textoUsuario}".
Responde con tono pedagógico, directo y resolutivo en 2 párrafos concisos.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptChat }] }] })
      });

      if (!response.ok) throw new Error("Error en respuesta");
      const data = await response.json();
      const respuestaIA = data.candidates?.[0]?.content?.parts?.[0]?.text;

      setMensajes(prev => [
        ...prev, 
        { 
          emisor: 'ia', 
          texto: respuestaIA, 
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch {
      setTimeout(() => {
        let respuestaSimulada = `Para consolidar el aprendizaje de **${estudiante.nombre.split(' ')[0]}** en "${textoUsuario}", sugiero descomponer el tema en sub-conceptos clave y practicar al menos dos problemas guiados el día de hoy.`;
        
        const q = textoUsuario.toLowerCase();
        if (q.includes('física') || q.includes('cinemática')) {
          respuestaSimulada = `En **Física y Cinemática** (Promedio actual: 11.0), el error principal suele radicar en la descomposición de vectores y el planteamiento de unidades. Se aconseja resolver 3 problemas tipo de MRUV y Movimiento Parabólico revisando las gráficas posición-tiempo.`;
        } else if (q.includes('química') || q.includes('orgánica')) {
          respuestaSimulada = `En **Química Orgánica** (Promedio actual: 12.3), recomiendo elaborar fichas nemotécnicas para los grupos funcionales y repasar nomenclatura IUPAC para afianzar la base teórica del examen final.`;
        } else if (q.includes('álgebra') || q.includes('matemática')) {
          respuestaSimulada = `El estudiante presenta un gran dominio en **Álgebra Superior** (16.2) y **Razonamiento Matemático** (18.0). La recomendación es canalizar esa destreza para resolver problemas interdisciplinarios aplicados a la cinemática.`;
        }

        setMensajes(prev => [
          ...prev,
          {
            emisor: 'ia',
            texto: respuestaSimulada,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 700);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-full">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-600/20">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tutor Pedagógico IA</h1>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini 1.5
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Expediente activo: <strong className="text-slate-800">{estudiante.nombre}</strong> ({estudiante.gradoCorto})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generarPlanPedagogico}
          disabled={analizandoPlan}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${analizandoPlan ? 'animate-spin' : ''}`} />
          Recalcular Diagnóstico
        </button>
      </div>

      {/* MÉTRICAS RÁPIDAS COHERENTES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Promedio Ponderado</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{estudiante.promedioGeneral}</span>
              <span className="text-xs text-slate-400 font-medium">/ 20</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Posición en Aula</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">Puesto #{estudiante.puestoRanking}</span>
              <span className="text-xs text-slate-400 font-medium">de {estudiante.totalAlumnos}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            cursosCriticos.length > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {cursosCriticos.length > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cursos por Reforzar</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{cursosCriticos.length}</span>
              <span className="text-xs text-slate-400 font-medium ml-1">
                {cursosCriticos.length === 1 ? 'asignatura' : 'asignaturas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* PANEL IZQUIERDO: Diagnóstico y Cursos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Plan Pedagógico Sugerido</h2>
            </div>

            {analizandoPlan ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Sintetizando plan con IA...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {planEstudio?.diagnostico}
                </p>

                {planEstudio?.acciones && (
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Ruta de Acción:
                    </span>
                    <ul className="space-y-2">
                      {planEstudio.acciones.map((acc, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <Target className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{acc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Notas Registradas de {estudiante.nombre.split(' ')[0]}
            </h3>
            <div className="space-y-2">
              {estudiante.cursos?.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-xs">
                  <span className="font-medium text-slate-700">{c.nombre}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    c.promedio < 13 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {c.promedio.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Chat Interactivo */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
          {/* Header del Chat */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">Asistente Virtual</h3>
                <span className="text-[11px] text-slate-400">Enfocado en: {estudiante.nombre}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Activo
            </span>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
            {mensajes.map((m, idx) => {
              const esIA = m.emisor === 'ia';
              return (
                <div key={idx} className={`flex items-end gap-2.5 ${esIA ? 'justify-start' : 'justify-end'}`}>
                  {esIA && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl max-w-[82%] text-xs leading-relaxed transition-all shadow-sm ${
                    esIA 
                      ? 'bg-white border border-slate-200/90 text-slate-700 rounded-bl-none' 
                      : 'bg-indigo-600 text-white rounded-br-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.texto}</p>
                    {m.hora && (
                      <span className={`block text-[10px] mt-1.5 text-right font-medium ${
                        esIA ? 'text-slate-400' : 'text-indigo-200'
                      }`}>
                        {m.hora}
                      </span>
                    )}
                  </div>

                  {!esIA && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Spinner Animado: Estado "Thinking" */}
            {cargando && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-400 ml-2 font-medium">Generando respuesta...</span>
                </div>
              </div>
            )}

            <div ref={chatFinRef} />
          </div>

          {/* Barra de Entrada */}
          <form onSubmit={handleEnviarMensaje} className="p-3.5 border-t border-slate-200/80 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={`Escribe tu consulta pedagógica sobre ${estudiante.nombre.split(' ')[0]}...`}
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              className="flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={cargando || !inputMensaje.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}