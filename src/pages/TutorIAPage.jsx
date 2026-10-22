import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  Send,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { consultarTutorIA, obtenerMiIntranetAlumno } from '../services/api';
import { escalaPorUniversidad, promedioCalificaciones } from '../utils/calificaciones';

function horaActual() {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function agruparCursos(historial = []) {
  const mapa = new Map();

  for (const nota of historial) {
    if (nota.calificacion === null || nota.calificacion === undefined || nota.calificacion === '') continue;
    const curso = String(nota.curso || 'Simulacro general');
    const calificacion = Number(nota.calificacion);
    if (!Number.isFinite(calificacion)) continue;

    const actual = mapa.get(curso) || { curso, suma: 0, cantidad: 0 };
    actual.suma += calificacion;
    actual.cantidad += 1;
    mapa.set(curso, actual);
  }

  return Array.from(mapa.values()).map((item) => ({
    curso: item.curso,
    promedio: Number((item.suma / item.cantidad).toFixed(2)),
    evaluaciones: item.cantidad,
  }));
}

async function pedirTutor(pregunta) {
  const data = await consultarTutorIA(pregunta);

  const respuesta = data.respuesta || data.mensaje || data.analisis;
  if (typeof respuesta !== 'string' || !respuesta.trim()) {
    throw new Error('El servidor no devolvió una respuesta válida.');
  }

  return data;
}

export default function TutorIAPage() {
  const [expediente, setExpediente] = useState(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(true);
  const [errorExpediente, setErrorExpediente] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);
  const [planEstudio, setPlanEstudio] = useState(null);
  const [analizandoPlan, setAnalizandoPlan] = useState(false);
  const chatFinRef = useRef(null);
  const planEnCursoRef = useRef(false);
  const respuestaEnCursoRef = useRef(false);

  const sesion = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  }, []);

  // Identidad institucional AcadeSys: el acento de esta pantalla usa siempre el
  // teal de la marca (el color de tema de la academia podía llegar naranja).
  const acentoAcadesys = '#0D9488';
  const nombreAcademia = sesion.nombreAcademia || 'AcadeSys Pre-U';

  const cargarExpediente = useCallback(async () => {
    setCargandoExpediente(true);
    setErrorExpediente('');

    try {
      const data = await obtenerMiIntranetAlumno();
      setExpediente(data);
    } catch (error) {
      setErrorExpediente(error.message || 'No se pudo cargar tu expediente académico.');
      setExpediente(null);
    } finally {
      setCargandoExpediente(false);
    }
  }, []);

  useEffect(() => {
    cargarExpediente();
  }, [cargarExpediente]);

  const alumno = expediente?.usuario || {};
  const ciclo = expediente?.ciclo || null;
  const notas = expediente?.notas || {};
  const historial = useMemo(() => Array.isArray(expediente?.notas?.historial) ? expediente.notas.historial : [], [expediente]);
  const cursos = useMemo(() => agruparCursos(historial), [historial]);
  const escalaMaxima = escalaPorUniversidad(ciclo?.universidadObjetivo);
  const promedioGeneral = promedioCalificaciones(historial.map((nota) => nota.calificacion));
  const puestoRanking = notas.puestoRanking ?? null;
  const nombreAlumno = alumno.nombreCompleto || [alumno.nombres, alumno.apellidoPaterno, alumno.apellidoMaterno]
    .filter(Boolean)
    .join(' ') || 'Estudiante';

  useEffect(() => {
    if (cargandoExpediente || !expediente) return;

    const saludo = historial.length > 0
      ? `¡Hola ${nombreAlumno.split(' ')[0]}! Soy tu Tutor Pedagógico IA de ${nombreAcademia}. Ya puedo orientarte utilizando las evaluaciones que aparecen en tu expediente del ciclo ${ciclo?.nombre || 'actual'}. ¿Qué tema deseas reforzar?`
      : `¡Hola ${nombreAlumno.split(' ')[0]}! Soy tu Tutor Pedagógico IA de ${nombreAcademia}. Aún no aparecen evaluaciones registradas en tu expediente, pero puedes hacerme preguntas académicas o pedirme un plan de estudio general.`;

    setMensajes([{ emisor: 'ia', texto: saludo, hora: horaActual() }]);
  // Solo se inicializa el saludo cuando llega el expediente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoExpediente, expediente, nombreAcademia, nombreAlumno, ciclo?.nombre, historial.length]);

  useEffect(() => {
    chatFinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, cargandoRespuesta]);

  const generarPlanPedagogico = async () => {
    if (!expediente || planEnCursoRef.current) return;

    planEnCursoRef.current = true;
    setAnalizandoPlan(true);
    setPlanEstudio(null);

    try {
      const pregunta = historial.length > 0
        ? 'Genera un diagnóstico de mi rendimiento real en el ciclo actual. Resume mis fortalezas, las áreas que debo reforzar y un plan de estudio concreto. Usa la escala registrada para mi ciclo y no inventes datos.'
        : 'Todavía no tengo evaluaciones registradas. Dame un plan de estudio preuniversitario general para empezar, e indica que no hay notas suficientes para un diagnóstico personalizado.';

      const resultado = await pedirTutor(pregunta);
      setPlanEstudio({
        diagnostico: resultado.resumenGeneral || resultado.respuesta,
        puntosFuertes: Array.isArray(resultado.puntosFuertes) ? resultado.puntosFuertes : [],
        areasMejora: Array.isArray(resultado.areasMejora) ? resultado.areasMejora : [],
        acciones: Array.isArray(resultado.planEstudio) ? resultado.planEstudio : [],
        fecha: new Date().toLocaleDateString('es-PE'),
        error: false,
      });
    } catch (error) {
      setPlanEstudio({
        diagnostico: error.message || 'No fue posible generar el diagnóstico.',
        acciones: [],
        fecha: new Date().toLocaleDateString('es-PE'),
        error: true,
      });
    } finally {
      planEnCursoRef.current = false;
      setAnalizandoPlan(false);
    }
  };

  const handleEnviarMensaje = async (event) => {
    event.preventDefault();
    const pregunta = inputMensaje.trim();
    if (!pregunta || respuestaEnCursoRef.current) return;

    respuestaEnCursoRef.current = true;
    setInputMensaje('');
    setMensajes((actuales) => [
      ...actuales,
      { emisor: 'usuario', texto: pregunta, hora: horaActual() },
    ]);
    setCargandoRespuesta(true);

    try {
      const resultado = await pedirTutor(pregunta);
      setMensajes((actuales) => [
        ...actuales,
        { emisor: 'ia', texto: resultado.respuesta || resultado.mensaje, hora: horaActual() },
      ]);
    } catch (error) {
      setMensajes((actuales) => [
        ...actuales,
        {
          emisor: 'ia',
          texto: `No pude responder en este momento: ${error.message || 'error de comunicación con el servidor.'}`,
          error: true,
          hora: horaActual(),
        },
      ]);
    } finally {
      respuestaEnCursoRef.current = false;
      setCargandoRespuesta(false);
    }
  };

  if (cargandoExpediente) {
    return (
      <div className="min-h-full bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin text-teal-700" aria-hidden="true" />
          Cargando tu expediente académico...
        </div>
      </div>
    );
  }

  if (errorExpediente || !expediente) {
    return (
      <div className="min-h-full bg-slate-50 text-slate-900 p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" aria-hidden="true" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-900">No se pudo cargar tu expediente</h1>
              <p className="mt-2 text-sm text-rose-700">{errorExpediente || 'Intenta nuevamente.'}</p>
              <button type="button" onClick={cargarExpediente} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 transition-colors">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tieneEvaluaciones = historial.length > 0;

  return (
    <div className="min-h-full bg-slate-50 p-4 font-sans text-slate-900 sm:p-6 md:p-8">
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl p-3 text-white" style={{ backgroundColor: acentoAcadesys }}>
            <BrainCircuit className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tutor Pedagógico IA</h1>
              <span className="flex items-center gap-1 rounded-md border border-teal-100 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden="true" /> Gemini Pre-U
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Alumno: <strong className="text-slate-900">{nombreAlumno}</strong>
              {alumno.codigoUsuario ? <> · Código: <span className="font-mono text-teal-700">{alumno.codigoUsuario}</span></> : null}
            </p>
          </div>
        </div>
        <button type="button" onClick={generarPlanPedagogico} disabled={analizandoPlan} className="flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:self-auto">
          <RefreshCw className={`h-4 w-4 text-teal-700 ${analizandoPlan ? 'animate-spin' : ''}`} aria-hidden="true" />
          Recalcular diagnóstico
        </button>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<TrendingUp className="h-6 w-6" />} label="Promedio registrado" value={promedioGeneral === null ? 'Sin datos' : promedioGeneral.toLocaleString('es-PE')} detail={promedioGeneral === null ? 'Aún no hay evaluaciones' : `Escala máxima: ${escalaMaxima}`} color="brand" />
        <MetricCard icon={<Award className="h-6 w-6" />} label="Cuadro de mérito" value={puestoRanking == null ? 'Sin datos' : `Puesto #${puestoRanking}`} detail={puestoRanking == null ? 'No disponible' : (ciclo?.nombre || 'Ciclo actual')} color="brand" />
        <MetricCard icon={tieneEvaluaciones ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />} label="Evaluaciones" value={String(historial.length)} detail={tieneEvaluaciones ? 'Datos del expediente' : 'No hay notas registradas'} color={tieneEvaluaciones ? 'emerald' : 'slate'} />
        <MetricCard icon={<UserRound className="h-6 w-6" />} label="Ciclo activo" value={ciclo?.nombre || 'Sin matrícula activa'} detail={ciclo?.universidadObjetivo || 'Objetivo no registrado'} color="brand" />
      </section>

      <main className="grid grid-cols-1 gap-8 xl:grid-cols-5">
        <aside className="space-y-6 xl:col-span-2">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Target className="h-4 w-4" aria-hidden="true" /> Objetivo preuniversitario
            </div>
            <div>
              <p className="text-xs text-slate-500">Ciclo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{ciclo?.nombre || 'No hay ciclo activo'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Universidad objetivo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{ciclo?.universidadObjetivo || 'No registrada'}</p>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">Los datos mostrados proceden del expediente de tu sesión. El sistema no utiliza puntajes de ejemplo.</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Plan de estudio recomendado</h2>
            </div>
            {analizandoPlan ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-teal-700" aria-hidden="true" />
                Analizando los datos disponibles...
              </div>
            ) : planEstudio ? (
              <div className="space-y-4">
                <p className={`rounded-lg border p-4 text-sm leading-relaxed ${planEstudio.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{planEstudio.diagnostico}</p>
                {planEstudio.puntosFuertes?.length > 0 && <BulletSection title="Puntos fuertes" items={planEstudio.puntosFuertes} />}
                {planEstudio.areasMejora?.length > 0 && <BulletSection title="Áreas por reforzar" items={planEstudio.areasMejora} />}
                {planEstudio.acciones?.length > 0 && <BulletSection title="Próximas acciones" items={planEstudio.acciones} />}
                <p className="text-right text-[10px] text-slate-500">Actualizado: {planEstudio.fecha}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Pulsa «Recalcular diagnóstico» para generar un plan.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Rendimiento por curso</h2>
            </div>
            {!tieneEvaluaciones ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Todavía no existen evaluaciones para mostrar. Cuando se registren, aparecerán aquí.</p>
            ) : cursos.length === 0 ? (
              <p className="text-sm text-slate-500">Hay evaluaciones, pero no se pudieron agrupar por curso.</p>
            ) : (
              <div className="space-y-2">
                {cursos.map((curso) => (
                  <div key={curso.curso} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">{curso.curso}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{curso.evaluaciones} evaluación(es)</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-teal-100 bg-teal-50 px-2 py-1 font-mono text-sm font-bold text-teal-700">
                      {curso.promedio.toLocaleString('es-PE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="flex flex-col self-start overflow-hidden rounded-xl border border-slate-200 bg-white xl:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: acentoAcadesys }}><Bot className="h-5 w-5" aria-hidden="true" /></div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900">Tutor virtual preuniversitario</h2>
                <p className="truncate text-[11px] text-slate-500">Contexto asociado a tu sesión autenticada</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Listo
            </span>
          </div>

          <div className="max-h-[520px] min-h-[280px] flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-5" aria-live="polite">
            {mensajes.map((mensaje, indice) => {
              const esIA = mensaje.emisor === 'ia';
              return (
                <div key={`${indice}-${mensaje.hora}`} className={`flex items-end gap-2.5 ${esIA ? 'justify-start' : 'justify-end'}`}>
                  {esIA && <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: acentoAcadesys }}><Bot className="h-4 w-4" aria-hidden="true" /></div>}
                  <div className={`max-w-[88%] rounded-xl p-4 text-xs leading-relaxed sm:max-w-[82%] ${esIA ? 'rounded-bl-none border border-slate-200 bg-white text-slate-700' : 'rounded-br-none text-white'}`} style={!esIA ? { backgroundColor: acentoAcadesys } : undefined}>
                    <p className="whitespace-pre-wrap">{mensaje.texto}</p>
                    <span className="mt-2 block text-right font-mono text-[10px] opacity-60">{mensaje.hora}</span>
                  </div>
                </div>
              );
            })}
            {cargandoRespuesta && <div className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw className="h-4 w-4 animate-spin text-teal-700" aria-hidden="true" /> El tutor está preparando una respuesta...</div>}
            <div ref={chatFinRef} />
          </div>

          <form onSubmit={handleEnviarMensaje} className="border-t border-slate-200 bg-white p-3 sm:p-4">
            <label htmlFor="pregunta-tutor" className="sr-only">Pregunta para el tutor pedagógico</label>
            <div className="flex items-end gap-2">
              <textarea id="pregunta-tutor" value={inputMensaje} onChange={(event) => setInputMensaje(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }} rows={2} maxLength={2000} placeholder="Pregunta sobre un tema, ejercicio o estrategia de estudio..." className="max-h-32 min-h-[48px] flex-1 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500" />
              <button type="submit" disabled={!inputMensaje.trim() || cargandoRespuesta} aria-label="Enviar pregunta" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: acentoAcadesys }}>
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Enter para enviar · Shift + Enter para una nueva línea</p>
          </form>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, color }) {
  const colors = {
    brand: 'text-teal-600',
    emerald: 'text-emerald-600',
    slate: 'text-slate-400',
  };

  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className={`shrink-0 ${colors[color] || colors.brand}`}>{icon}</div>
      <div className="min-w-0">
        <p className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 line-clamp-2 text-lg font-bold text-slate-900">{value}</p>
        <p className="mt-1 truncate text-[10px] text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function BulletSection({ title, items }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
            <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


