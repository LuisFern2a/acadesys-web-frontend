import React, { useState, useEffect } from 'react';
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
  // Datos del estudiante activo con valores de respaldo
  const estudiante = estudianteActivo || {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
    gradoCorto: '5to Sec',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 3,
    totalAlumnos: 36,
    promedioGeneral: 15.8,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', promedio: 16.3 },
      { id: 4, nombre: 'Física y Cinemática', promedio: 11.0 }
    ]
  };

  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [planEstudio, setPlanEstudio] = useState(null);
  const [analizandoPlan, setAnalizandoPlan] = useState(false);

  // Reiniciar contexto cuando se cambie de hijo en la cabecera
  useEffect(() => {
    setMensajes([
      {
        emisor: 'ia',
        texto: `¡Hola! Soy el Tutor Pedagógico Inteligente de AcadeSys. Estoy revisando el historial académico de **${estudiante.nombre}** (${estudiante.aula}). ¿En qué tema o curso te gustaría que enfoquemos su plan de refuerzo hoy?`
      }
    ]);
    generarPlanPedagogico();
  }, [estudiante.id]);

  const cursosCriticos = estudiante.cursos?.filter(c => c.promedio < 13) || [];
  const cursosDestacados = estudiante.cursos?.filter(c => c.promedio >= 16) || [];

  // Llamada o simulación a la API de Gemini
  const generarPlanPedagogico = async () => {
    setAnalizandoPlan(true);

    const resumenMaterias = estudiante.cursos?.map(c => `${c.nombre}: Promedio ${c.promedio}`).join(', ');

    const promptContextual = `Actúa como tutor pedagógico escolar de élite. Analiza al estudiante:
Nombre: ${estudiante.nombre}
Grado: ${estudiante.aula}
Promedio Ponderado: ${estudiante.promedioGeneral}/20
Materias: ${resumenMaterias}

Genera un diagnóstico preciso y 3 acciones clave para mejorar su desempeño.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API Key");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptContextual }] }]
        })
      });

      if (!response.ok) throw new Error("Error en Gemini API");
      const data = await response.json();
      const respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text;

      setPlanEstudio({
        diagnostico: respuestaTexto,
        fecha: new Date().toLocaleDateString('es-PE')
      });
    } catch {
      // Fallback pedagógico dinámico según notas reales del estudiante
      const tieneRiesgo = cursosCriticos.length > 0;
      setPlanEstudio({
        diagnostico: tieneRiesgo
          ? `Se observa un rendimiento global sólido (${estudiante.promedioGeneral}/20), pero requiere intervención prioritaria en **${cursosCriticos.map(c => c.nombre).join(', ')}**, donde el promedio se sitúa por debajo de la valla de 13.0.`
          : `Excelente desempeño general con promedio sobresaliente de **${estudiante.promedioGeneral}/20**. Se sugiere potenciar su nivel competitivo con ejercicios de olimpiadas y simulacros avanzados en **${cursosDestacados.map(c => c.nombre).join(', ')}**.`,
        acciones: tieneRiesgo
          ? [
              `Dedicar 45 minutos diarios de resolución guiada para ${cursosCriticos[0]?.nombre}.`,
              'Revisar el banco de ejercicios y simulacros pasados con retroalimentación paso a paso.',
              'Coordinar asesoría de reforzamiento con el docente titular antes del examen final.'
            ]
          : [
              'Entrenamiento en bancos de preguntas tipo admisión con control estricto de tiempo.',
              'Profundizar en demostraciones teóricas y aplicaciones interdisciplinarias.',
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
    setInputMensaje('');
    setMensajes(prev => [...prev, { emisor: 'usuario', texto: textoUsuario }]);
    setCargando(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API Key");

      const promptChat = `Eres el Tutor IA de AcadeSys para el estudiante ${estudiante.nombre} (${estudiante.aula}).
Promedio actual: ${estudiante.promedioGeneral}/20.
Cursos: ${estudiante.cursos?.map(c => `${c.nombre} (${c.promedio})`).join(', ')}.
Pregunta del usuario: "${textoUsuario}".
Responde con tono motivador, conciso, pedagógico y práctico en 2 o 3 párrafos con viñetas si aplica.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptChat }] }]
        })
      });

      if (!response.ok) throw new Error("Error en respuesta");
      const data = await response.json();
      const respuestaIA = data.candidates?.[0]?.content?.parts?.[0]?.text;

      setMensajes(prev => [...prev, { emisor: 'ia', texto: respuestaIA }]);
    } catch {
      // Fallback de respuesta conversacional
      setTimeout(() => {
        setMensajes(prev => [
          ...prev,
          {
            emisor: 'ia',
            texto: `Para apoyar a **${estudiante.nombre.split(' ')[0]}** en esta consulta sobre "${textoUsuario}", recomiendo enfocar la sesión en descomponer el problema en sub-pasos y repasar la guía descargable del curso en la pestaña de Calificaciones.`
          }
        ]);
      }, 700);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-sm">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">Tutor Pedagógico IA</h1>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">
                Gemini 1.5
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Analizando expediente académico de: <strong className="text-slate-800">{estudiante.nombre}</strong> ({estudiante.gradoCorto})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generarPlanPedagogico}
          disabled={analizandoPlan}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${analizandoPlan ? 'animate-spin' : ''}`} />
          Recalcular Diagnóstico
        </button>
      </div>

      {/* METRICAS DEL ESTUDIANTE SELECCIONADO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Promedio del Alumno</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{estudiante.promedioGeneral}</span>
              <span className="text-xs text-slate-400 font-medium">/ 20</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Posición en Aula</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">Puesto #{estudiante.puestoRanking}</span>
              <span className="text-xs text-slate-400 font-medium">de {estudiante.totalAlumnos}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            cursosCriticos.length > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {cursosCriticos.length > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Asignaturas en Riesgo</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{cursosCriticos.length}</span>
              <span className="text-xs text-slate-400 font-medium">
                {cursosCriticos.length === 1 ? 'materia' : 'materias'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: PLAN PEDAGÓGICO + CHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* COLUMNA IZQUIERDA: DIAGNÓSTICO Y ACCIONES (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-base">Estrategia Personalizada</h2>
            </div>

            {analizandoPlan ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Generando diagnóstico cognitivo con Gemini...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {planEstudio?.diagnostico}
                </p>

                {planEstudio?.acciones && (
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Ruta de Acción Recomendada:
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
              Cursos Evaluados de {estudiante.nombre.split(' ')[0]}
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

        {/* COLUMNA DERECHA: CHAT PEDAGÓGICO INTERACTIVO (3 columnas) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Chat Pedagógico</h3>
                <span className="text-[11px] text-slate-400">Contexto activo: {estudiante.nombre}</span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> En línea
            </span>
          </div>

          {/* LISTA DE MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {mensajes.map((m, idx) => {
              const esIA = m.emisor === 'ia';
              return (
                <div key={idx} className={`flex gap-3 ${esIA ? 'justify-start' : 'justify-end'}`}>
                  {esIA && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    esIA
                      ? 'bg-slate-50 border border-slate-200/80 text-slate-700'
                      : 'bg-indigo-600 text-white shadow-sm'
                  }`}>
                    {m.texto}
                  </div>
                  {!esIA && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
            {cargando && (
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                </div>
                <span>El Tutor IA está analizando la respuesta...</span>
              </div>
            )}
          </div>

          {/* INPUT DEL CHAT */}
          <form onSubmit={handleEnviarMensaje} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={`Hazle una pregunta pedagógica sobre ${estudiante.nombre.split(' ')[0]}...`}
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              className="flex-1 text-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={cargando || !inputMensaje.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}