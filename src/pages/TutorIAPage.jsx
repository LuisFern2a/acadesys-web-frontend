import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  Brain,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import { consultarTutorIA, obtenerContextoTutorIA } from '../services/api';

const MENSAJE_INICIAL = {
  id: 'bienvenida',
  rol: 'ai',
  inicial: true,
  texto: '¡Hola! Soy tu Tutor Pedagógico IA de AcadeSys. Estoy aquí para ayudarte a aprender, no solo para evaluar tus resultados. Podemos estudiar teoría, resolver ejercicios paso a paso, practicar, corregir tus procedimientos y organizar repasos. ¿Qué tema trabajamos hoy?',
};

const MODOS = [
  { id: 'chat', label: 'Preguntar', icono: MessageCircle, descripcion: 'Resuelve dudas y conversa sobre un tema.' },
  { id: 'explicar', label: 'Aprender teoría', icono: BookOpen, descripcion: 'Explicaciones desde cero, analogías y ejemplos.' },
  { id: 'resolver', label: 'Resolver ejercicio', icono: Calculator, descripcion: 'Procedimiento detallado y comprobación.' },
  { id: 'practicar', label: 'Practicar', icono: Target, descripcion: 'Ejercicios progresivos con pistas.' },
  { id: 'corregir', label: 'Revisar mi respuesta', icono: ClipboardCheck, descripcion: 'Revisa tu procedimiento y explica los errores.' },
  { id: 'repasar', label: 'Repasar', icono: Brain, descripcion: 'Resumen, preguntas y mini ejercicios.' },
  { id: 'plan', label: 'Plan de estudio', icono: GraduationCap, descripcion: 'Organiza qué estudiar y cómo avanzar.' },
];

const ATAJOS = [
  {
    modo: 'explicar',
    titulo: 'Explícame un tema',
    detalle: 'Teoría clara, analogías y ejemplo guiado.',
    icono: BookOpen,
    pregunta: 'Explícame desde cero un tema del curso seleccionado. Usa una analogía sencilla, define los conceptos y termina con un ejemplo guiado.',
  },
  {
    modo: 'resolver',
    titulo: 'Ayúdame con un ejercicio',
    detalle: 'Lo resolvemos paso a paso y comprobamos.',
    icono: Calculator,
    pregunta: 'Quiero resolver un ejercicio paso a paso. Primero explícame qué datos debo identificar y qué método conviene utilizar.',
  },
  {
    modo: 'practicar',
    titulo: 'Ponme a practicar',
    detalle: 'Ejercicios de nivel progresivo, sin revelar la solución.',
    icono: Target,
    pregunta: 'Prepárame una práctica de 3 ejercicios progresivos del curso seleccionado. No muestres las soluciones todavía; dame pistas y espera mis intentos.',
  },
  {
    modo: 'repasar',
    titulo: 'Hagamos un repaso',
    detalle: 'Ideas clave y preguntas para recordar.',
    icono: Brain,
    pregunta: 'Prepara un repaso del curso seleccionado con los conceptos importantes, ejemplos y preguntas para comprobar si entendí.',
  },
];

function textoDeHistorial(mensaje) {
  if (mensaje.rol === 'user') return mensaje.texto || '';
  if (mensaje.rol !== 'ai') return '';

  const partes = [mensaje.datos?.respuesta || mensaje.texto || ''];
  if (Array.isArray(mensaje.datos?.pasos) && mensaje.datos.pasos.length) {
    partes.push(`Procedimiento: ${mensaje.datos.pasos.join(' ')}`);
  }
  if (Array.isArray(mensaje.datos?.conceptosClave) && mensaje.datos.conceptosClave.length) {
    partes.push(`Conceptos clave: ${mensaje.datos.conceptosClave.join('; ')}`);
  }
  return partes.filter(Boolean).join('\n').slice(0, 1400);
}

function TarjetaLista({ titulo, elementos, icono: Icono = CheckCircle2 }) {
  if (!Array.isArray(elementos) || !elementos.length) return null;

  return (
    <section className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        <Icono className="h-4 w-4 text-teal-700" />
        {titulo}
      </h4>
      <ul className="space-y-2 text-sm leading-6 text-slate-700">
        {elementos.map((elemento, indice) => (
          <li key={`${titulo}-${indice}`} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
            <span className="whitespace-pre-wrap">{elemento}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContenidoTutor({ mensaje }) {
  const datos = mensaje.datos;
  if (!datos) {
    return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{mensaje.texto}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{datos.respuesta || mensaje.texto}</p>

      <TarjetaLista titulo="Conceptos clave" elementos={datos.conceptosClave} icono={Lightbulb} />
      <TarjetaLista titulo="Procedimiento paso a paso" elementos={datos.pasos} icono={CheckCircle2} />

      {datos.ejemploGuiado && (
        <section className="mt-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-800">
            <BookOpen className="h-4 w-4" /> Ejemplo guiado
          </h4>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{datos.ejemploGuiado}</p>
        </section>
      )}

      {Array.isArray(datos.ejercicios) && datos.ejercicios.length > 0 && (
        <section className="mt-3 space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            <Calculator className="h-4 w-4 text-teal-700" /> Ejercicios propuestos
          </h4>
          {datos.ejercicios.map((ejercicio, indice) => (
            <article key={`ejercicio-${mensaje.id}-${indice}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">Ejercicio {indice + 1}</span>
                {ejercicio.nivel && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {ejercicio.nivel}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{ejercicio.enunciado}</p>
              {ejercicio.pista && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  <strong>Pista:</strong> {ejercicio.pista}
                </p>
              )}
              {ejercicio.solucion && (
                <details className="mt-2 rounded-lg border border-teal-100 bg-teal-50/60 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-semibold text-teal-800">Ver solución explicada</summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ejercicio.solucion}</p>
                </details>
              )}
            </article>
          ))}
          {mensaje.datos.modo === 'practicar' && (
            <p className="text-xs text-slate-500">Intenta resolverlos y envíame tu procedimiento. Revisaré tus pasos sin adelantarte la respuesta.</p>
          )}
        </section>
      )}

      <TarjetaLista titulo="Plan de estudio sugerido" elementos={datos.planEstudio} icono={GraduationCap} />

      {datos.recomendacionSiguiente && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
          <strong>¿Qué sigue?</strong>
          <p className="mt-1 whitespace-pre-wrap">{datos.recomendacionSiguiente}</p>
        </div>
      )}
    </div>
  );
}

function errorAmigable(error) {
  const mensaje = String(error?.message || '').trim();
  if (error?.status === 503) {
    return 'El servicio de IA no está disponible en este momento. Comprueba que GEMINI_API_KEY esté configurada en Render y vuelve a intentarlo.';
  }
  if (error?.status === 429) {
    return 'Has enviado varias consultas seguidas. Espera un momento antes de continuar.';
  }
  if (error?.status === 504) {
    return 'La respuesta tardó demasiado. Prueba con una pregunta más concreta.';
  }
  if (!mensaje || /failed to fetch|networkerror|load failed/i.test(mensaje)) {
    return 'No pude conectar con el servidor de AcadeSys. Comprueba tu conexión e inténtalo de nuevo.';
  }
  return mensaje;
}

export default function TutorIAPage() {
  const [mensajes, setMensajes] = useState([MENSAJE_INICIAL]);
  const [input, setInput] = useState('');
  const [modo, setModo] = useState('chat');
  const [cursoId, setCursoId] = useState('');
  const [contexto, setContexto] = useState(null);
  const [cargandoContexto, setCargandoContexto] = useState(true);
  const [errorContexto, setErrorContexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const listaMensajesRef = useRef(null);
  const idMensajeRef = useRef(2);
  const enviandoRef = useRef(false);

  const modoActual = useMemo(
    () => MODOS.find((item) => item.id === modo) || MODOS[0],
    [modo],
  );

  useEffect(() => {
    let activo = true;
    obtenerContextoTutorIA()
      .then((datos) => {
        if (!activo) return;
        setContexto(datos || null);
        setErrorContexto('');
      })
      .catch((error) => {
        if (!activo) return;
        setErrorContexto(errorAmigable(error));
      })
      .finally(() => {
        if (activo) setCargandoContexto(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const contenedor = listaMensajesRef.current;
    if (!contenedor) return;
    contenedor.scrollTo({ top: contenedor.scrollHeight, behavior: 'smooth' });
  }, [mensajes, escribiendo]);

  const seleccionarAtajo = (atajo) => {
    setModo(atajo.modo);
    setInput(atajo.pregunta);
    setErrorEnvio('');
  };

  const limpiarConversacion = () => {
    if (escribiendo) return;
    setMensajes([MENSAJE_INICIAL]);
    setInput('');
    setModo('chat');
    setErrorEnvio('');
    idMensajeRef.current = 2;
  };

  const enviarMensaje = async (event) => {
    event?.preventDefault?.();
    const pregunta = input.trim();
    if (!pregunta || escribiendo || enviandoRef.current) return;

    if (pregunta.length > 2000) {
      setErrorEnvio('Tu consulta no puede superar los 2000 caracteres.');
      return;
    }

    enviandoRef.current = true;
    setErrorEnvio('');

    const historial = mensajes
      .filter((mensaje) => !mensaje.inicial && (mensaje.rol === 'user' || mensaje.rol === 'ai'))
      .slice(-10)
      .map((mensaje) => ({
        rol: mensaje.rol === 'ai' ? 'model' : 'user',
        texto: textoDeHistorial(mensaje),
      }))
      .filter((mensaje) => mensaje.texto);

    const nuevoMensaje = {
      id: idMensajeRef.current++,
      rol: 'user',
      texto: pregunta,
    };

    setMensajes((prev) => [...prev, nuevoMensaje]);
    setInput('');
    setEscribiendo(true);

    try {
      const resultado = await consultarTutorIA(pregunta, {
        modo,
        cursoId: cursoId || null,
        historial,
      });

      const respuesta = String(resultado?.respuesta || '').trim();
      if (!respuesta) {
        throw new Error('El Tutor IA no devolvió una respuesta válida. Inténtalo otra vez.');
      }

      const mensajeTutor = {
        id: idMensajeRef.current++,
        rol: 'ai',
        texto: respuesta,
        datos: resultado,
      };
      setMensajes((prev) => [...prev, mensajeTutor]);
      if (resultado.contexto) setContexto(resultado.contexto);
    } catch (error) {
      const mensaje = errorAmigable(error);
      setErrorEnvio(mensaje);
      setMensajes((prev) => [...prev, {
        id: idMensajeRef.current++,
        rol: 'error',
        texto: mensaje,
      }]);
    } finally {
      enviandoRef.current = false;
      setEscribiendo(false);
    }
  };

  const manejarTecla = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      enviarMensaje(event);
    }
  };

  const cursos = Array.isArray(contexto?.cursos) ? contexto.cursos : [];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">AcadeSys · Aprendizaje personalizado</p>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Tutor Pedagógico IA</h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Aprende teoría, practica y resuelve tus dudas paso a paso.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={limpiarConversacion}
            disabled={escribiendo || mensajes.length <= 1}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" /> Nueva conversación
          </button>
        </header>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] sm:items-center sm:p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                {cargandoContexto ? 'Cargando tu contexto...' : contexto?.ciclo?.nombre || 'Sin ciclo activo registrado'}
              </span>
              {contexto?.totalEvaluaciones > 0 && (
                <span className="text-xs text-slate-500">{contexto.totalEvaluaciones} evaluación(es) registradas</span>
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              El tutor usa tu ciclo y tus cursos para adaptar las explicaciones. Tus consultas no modifican tus notas.
            </p>
            {errorContexto && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                No pude cargar el contexto académico; puedes seguir haciendo preguntas generales.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="curso-tutor-ia" className="mb-1.5 block text-xs font-semibold text-slate-600">Curso para enfocar la sesión</label>
            <select
              id="curso-tutor-ia"
              value={cursoId}
              onChange={(event) => setCursoId(event.target.value)}
              disabled={cargandoContexto || cursos.length === 0}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
            >
              <option value="">Todos los cursos / consulta general</option>
              {cursos.map((curso) => (
                <option key={curso.idCurso} value={curso.idCurso}>{curso.nombre}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">¿Cómo quieres aprender hoy?</h2>
              <p className="mt-0.5 text-xs text-slate-500">Elige un modo; puedes cambiarlo en cualquier momento.</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MODOS.map((item) => {
              const Icono = item.icono;
              const activo = modo === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModo(item.id)}
                  title={item.descripcion}
                  aria-pressed={activo}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    activo
                      ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                  }`}
                >
                  <Icono className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{modoActual.descripcion}</p>
        </section>

        {mensajes.length === 1 && (
          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {ATAJOS.map((atajo) => {
              const Icono = atajo.icono;
              return (
                <button
                  key={atajo.modo}
                  type="button"
                  onClick={() => seleccionarAtajo(atajo)}
                  className="group flex min-h-24 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
                    <Icono className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800">{atajo.titulo}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{atajo.detalle}</span>
                  </span>
                </button>
              );
            })}
          </section>
        )}

        <section className="flex min-h-[520px] max-h-[72vh] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">Tutor de AcadeSys</p>
                <p className="text-[11px] text-slate-500">Modo: {modoActual.label}</p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 text-[11px] font-medium text-teal-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-teal-500" /> Listo para aprender
            </span>
          </div>

          <div
            ref={listaMensajesRef}
            className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-3 sm:p-5"
            aria-live="polite"
            aria-label="Conversación con el Tutor Pedagógico IA"
          >
            {mensajes.map((mensaje) => {
              const esUsuario = mensaje.rol === 'user';
              const esError = mensaje.rol === 'error';
              return (
                <div key={mensaje.id} className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[96%] items-start gap-2.5 sm:max-w-[88%] ${esUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      esUsuario ? 'bg-blue-600 text-white' : esError ? 'bg-rose-600 text-white' : 'bg-teal-600 text-white'
                    }`}>
                      {esUsuario ? <User className="h-4 w-4" /> : esError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </span>
                    <div className={`min-w-0 rounded-2xl px-3.5 py-3 shadow-sm sm:px-4 ${
                      esUsuario
                        ? 'rounded-tr-sm bg-blue-600 text-white'
                        : esError
                          ? 'rounded-tl-sm border border-rose-200 bg-rose-50 text-rose-800'
                          : 'rounded-tl-sm border border-slate-200 bg-white'
                    }`}>
                      {esError
                        ? <p className="whitespace-pre-wrap text-sm leading-6">{mensaje.texto}</p>
                        : <ContenidoTutor mensaje={mensaje} />}
                      {mensaje.datos?.resumenGeneral && (
                        <p className="mt-3 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-500">
                          <strong>En resumen:</strong> {mensaje.datos.resumenGeneral}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {escribiendo && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  Estoy preparando una explicación para ti...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
            {errorEnvio && (
              <p className="mb-2 flex items-start gap-1.5 text-xs text-rose-700" role="alert">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {errorEnvio}
              </p>
            )}
            <form onSubmit={enviarMensaje} className="flex items-end gap-2">
              <label htmlFor="pregunta-tutor-ia" className="sr-only">Escribe tu consulta para el Tutor IA</label>
              <textarea
                id="pregunta-tutor-ia"
                rows={2}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (errorEnvio) setErrorEnvio('');
                }}
                onKeyDown={manejarTecla}
                maxLength={2000}
                placeholder="Escribe un tema, pega un ejercicio o cuéntame qué parte no entiendes..."
                disabled={escribiendo}
                className="max-h-36 min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || escribiendo}
                aria-label="Enviar pregunta"
                title="Enviar pregunta"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
              >
                {escribiendo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>Enter para enviar · Shift + Enter para nueva línea</span>
              <span>{input.length}/2000</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
              El tutor es una herramienta de apoyo. Comprueba fórmulas, procedimientos y datos importantes con tus materiales o docentes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
