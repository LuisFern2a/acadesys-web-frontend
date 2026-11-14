import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import PanelPagosAlumno from '../components/PanelPagosAlumno.jsx';
import ModalMiPerfil from '../components/ModalMiPerfil.jsx';
import { descargarMaterial } from '../services/materiales.api.js';

const VIEWS = Object.freeze({
  home: 'student-home',
  ciclo: 'student-ciclo',
  horario: 'student-horario',
  cursos: 'student-cursos',
  notas: 'student-notas',
  materiales: 'student-materiales',
  pagos: 'student-pagos',
  perfil: 'student-perfil',
});

const TITULOS = {
  [VIEWS.home]: 'Inicio del Alumno',
  [VIEWS.ciclo]: 'Mi Ciclo',
  [VIEWS.horario]: 'Mi Horario',
  [VIEWS.cursos]: 'Mis Cursos',
  [VIEWS.notas]: 'Mis Resultados',
  [VIEWS.materiales]: 'Materiales de Estudio',
  [VIEWS.pagos]: 'Mis pagos',
  [VIEWS.perfil]: 'Mi Perfil',
};

const DIAS_ORDEN = [
  'lunes',
  'martes',
  'miércoles',
  'miercoles',
  'jueves',
  'viernes',
  'sábado',
  'sabado',
  'domingo',
];

const listaSegura = (valor) => (Array.isArray(valor) ? valor : []);

function primerTexto(...valores) {
  const encontrado = valores.find(
    (valor) => valor !== null && valor !== undefined && String(valor).trim() !== '',
  );
  return encontrado === undefined ? '' : String(encontrado).trim();
}

function formatearFecha(valor) {
  if (!valor) return '—';
  const texto = String(valor).slice(0, 10);
  const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!coincidencia) return texto;

  const [, anio, mes, dia] = coincidencia;
  return `${dia}/${mes}/${anio}`;
}

function formatearNota(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const nota = Number(valor);
  return Number.isFinite(nota) ? String(nota) : '—';
}

function BotonDescargarMaterial({ material }) {
  const [estado, setEstado] = useState({ cargando: false, error: '' });
  const descargar = async () => {
    setEstado({ cargando: true, error: '' });
    try {
      await descargarMaterial(material);
      setEstado({ cargando: false, error: '' });
    } catch (error) {
      setEstado({ cargando: false, error: error.message || 'No se pudo descargar el material.' });
    }
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={descargar} disabled={estado.cargando} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60">
        {estado.cargando ? 'Descargando…' : 'Descargar material'} <Download className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {estado.error && <span role="alert" className="text-xs text-red-700">{estado.error}</span>}
    </div>
  );
}

function obtenerNombre(usuario, user) {
  return primerTexto(
    user?.nombre,
    user?.NombreCompleto,
    usuario?.nombreCompleto,
    [usuario?.nombres, usuario?.apellidoPaterno, usuario?.apellidoMaterno]
      .filter(Boolean)
      .join(' '),
    'Estudiante',
  );
}

function TarjetaMetrica({ icon: Icono, etiqueta, valor, detalle, tono = 'teal' }) {
  const tonos = {
    teal: 'bg-teal-50 text-teal-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {etiqueta}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
        </div>
        <span className={`rounded-xl p-3 ${tonos[tono] || tonos.teal}`}>
          <Icono className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function EstadoVacio({ icon: Icono = FileText, titulo, detalle, accion }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <Icono className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
      <h3 className="mt-3 font-bold text-slate-800">{titulo}</h3>
      {detalle && <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">{detalle}</p>}
      {accion}
    </div>
  );
}

function BotonActualizar({ onRefresh, loading }) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading || !onRefresh}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      )}
      Actualizar información
    </button>
  );
}

export default function StudentIntranetPage({
  view,
  setActiveTab,
  user,
  expediente,
  loading = false,
  error = '',
  onRefresh,
  onUpdateUser,
}) {
  const [perfilModalAbierto, setPerfilModalAbierto] = useState(false);

  const usuario = expediente?.usuario || {};
  const ciclo = expediente?.ciclo || user?.ciclo || null;
  const cursos = listaSegura(expediente?.cursos);
  const horario = listaSegura(expediente?.horarioDetalle);
  const materiales = listaSegura(expediente?.materiales);
  const notas = expediente?.notas || {};
  const historial = listaSegura(notas.historial);

  const nombre = obtenerNombre(usuario, user);
  const primerNombre = nombre.split(/\s+/)[0] || 'Estudiante';
  const titulo = TITULOS[view] || 'Portal del Estudiante';
  const promedio = Number(notas.promedioGeneral);
  const totalEvaluaciones = Number(notas.totalEvaluaciones ?? historial.length) || 0;
  const promedioTexto = totalEvaluaciones > 0 && Number.isFinite(promedio) ? promedio.toFixed(2) : '—';
  const puesto = notas.puestoRanking;

  const horarioOrdenado = useMemo(() => {
    return [...horario].sort((a, b) => {
      const diaA = String(a.diaSemana || '').trim().toLowerCase();
      const diaB = String(b.diaSemana || '').trim().toLowerCase();
      const ordenA = DIAS_ORDEN.indexOf(diaA);
      const ordenB = DIAS_ORDEN.indexOf(diaB);
      const posicionA = ordenA < 0 ? 99 : ordenA;
      const posicionB = ordenB < 0 ? 99 : ordenB;
      return posicionA - posicionB || String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''));
    });
  }, [horario]);

  // Pagos tiene que funcionar aunque el expediente académico no tenga ciclo o esté cargando.
  if (view === VIEWS.pagos) {
    return <PanelPagosAlumno />;
  }

  if (loading && !expediente) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Portal del Estudiante</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center" role="status">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-600">Cargando tu información académica...</p>
        </div>
      </div>
    );
  }

  if (error && !expediente) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Portal del Estudiante</h1>
        <div className="rounded-xl border border-rose-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" aria-hidden="true" />
          <h2 className="mt-3 font-bold text-slate-900">No pudimos cargar tu expediente</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const renderInicio = () => (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-900 px-6 py-7 text-white md:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Portal del estudiante
              </span>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">¡Hola, {primerNombre}!</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Aquí puedes consultar tu ciclo, horario, cursos, resultados y materiales de estudio.
              </p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold">
              {nombre.trim().slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Código de alumno</p>
            <p className="mt-1 font-bold text-slate-900">{primerTexto(usuario.codigoUsuario, user?.codigoUsuario, 'No disponible')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ciclo actual</p>
            <p className="mt-1 font-bold text-slate-900">{primerTexto(ciclo?.nombre, 'Sin ciclo activo')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Universidad objetivo</p>
            <p className="mt-1 font-bold text-slate-900">{primerTexto(ciclo?.universidadObjetivo, 'No especificada')}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica icon={GraduationCap} etiqueta="Ciclo" valor={ciclo?.nombre || 'No asignado'} detalle={ciclo?.turno || 'Sin turno registrado'} />
        <TarjetaMetrica icon={BookOpen} etiqueta="Mis cursos" valor={cursos.length} detalle="Cursos asociados a tu ciclo" tono="blue" />
        <TarjetaMetrica icon={Award} etiqueta="Evaluaciones" valor={totalEvaluaciones} detalle="Resultados registrados" tono="violet" />
        <TarjetaMetrica icon={TrendingUp} etiqueta="Promedio general" valor={promedioTexto} detalle={ciclo?.universidadObjetivo || 'Según tus evaluaciones'} tono="amber" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Accesos rápidos</h2>
            <p className="text-sm text-slate-500">Continúa con tu actividad académica.</p>
          </div>
          <BotonActualizar onRefresh={onRefresh} loading={loading} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { id: VIEWS.ciclo, titulo: 'Mi Ciclo', detalle: 'Consulta tu matrícula y ciclo actual.', Icono: GraduationCap },
            { id: VIEWS.horario, titulo: 'Mi Horario', detalle: 'Revisa tus días y horas de clase.', Icono: CalendarDays },
            { id: VIEWS.cursos, titulo: 'Mis Cursos', detalle: 'Conoce los cursos de tu ciclo.', Icono: BookOpen },
            { id: VIEWS.notas, titulo: 'Mis Resultados', detalle: 'Consulta tus notas y promedio.', Icono: Award },
            { id: VIEWS.materiales, titulo: 'Materiales', detalle: 'Accede a tus recursos de estudio.', Icono: FileText },
            { id: VIEWS.pagos, titulo: 'Mis pagos', detalle: 'Consulta tus cuotas y su estado.', Icono: CreditCard },
          ].map(({ id, titulo: texto, detalle, Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab?.(id)}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              <span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Icono className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-900">{texto}</span>
                <span className="mt-1 block text-xs text-slate-500">{detalle}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          No se pudo actualizar la información más reciente: {error}
        </p>
      )}
    </div>
  );

  const renderCiclo = () => {
    if (!ciclo) {
      return (
        <EstadoVacio
          icon={GraduationCap}
          titulo="No tienes un ciclo activo asignado"
          detalle="Cuando administración confirme tu matrícula y active el ciclo correspondiente, la información aparecerá aquí."
        />
      );
    }

    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">Mi matrícula</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{ciclo.nombre}</h2>
              <p className="mt-1 text-sm text-slate-500">{primerTexto(ciclo.universidadObjetivo, 'Universidad objetivo no especificada')}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 sm:text-right">
              <p className="text-xs text-slate-500">Código de alumno</p>
              <p className="mt-1 font-bold text-slate-900">{primerTexto(usuario.codigoUsuario, user?.codigoUsuario, '—')}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs font-semibold text-slate-500">Turno</p><p className="mt-1 font-semibold text-slate-900">{primerTexto(ciclo.turno, 'No especificado')}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Horario referencial</p><p className="mt-1 font-semibold text-slate-900">{primerTexto(ciclo.horario, 'Por confirmar')}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Inicio</p><p className="mt-1 font-semibold text-slate-900">{formatearFecha(ciclo.fechaInicio)}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Fin</p><p className="mt-1 font-semibold text-slate-900">{formatearFecha(ciclo.fechaFin)}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Días de clase</p><p className="mt-1 font-semibold text-slate-900">{primerTexto(ciclo.diasClase, 'Por confirmar')}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Alumnos registrados</p><p className="mt-1 font-semibold text-slate-900">{Number(ciclo.totalAlumnos) || 0}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">ID de ciclo</p><p className="mt-1 font-semibold text-slate-900">{ciclo.idCiclo ?? '—'}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">ID de matrícula</p><p className="mt-1 font-semibold text-slate-900">{expediente?.matricula?.idMatricula ?? '—'}</p></div>
          </div>
        </section>
        <div className="flex justify-end"><BotonActualizar onRefresh={onRefresh} loading={loading} /></div>
      </div>
    );
  };

  const renderHorario = () => {
    if (!ciclo) {
      return <EstadoVacio icon={CalendarDays} titulo="No hay un ciclo activo" detalle="Tu horario aparecerá cuando tengas una matrícula activa." />;
    }
    if (horarioOrdenado.length === 0) {
      return <EstadoVacio icon={CalendarClock} titulo="Todavía no hay horarios publicados" detalle="Tu horario se mostrará aquí cuando la academia registre las sesiones de tu ciclo." />;
    }

    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Horario de clases</h2>
          <p className="mt-1 text-sm text-slate-500">{ciclo.nombre} · {primerTexto(ciclo.turno, 'Turno por confirmar')}</p>
        </div>
        <div className="divide-y divide-slate-100">
          {horarioOrdenado.map((sesion, indice) => (
            <article key={sesion.idHorario ?? `${sesion.diaSemana}-${sesion.horaInicio}-${indice}`} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex min-w-36 items-center gap-2 text-sm font-bold capitalize text-teal-800">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {primerTexto(sesion.diaSemana, 'Día por confirmar')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{primerTexto(sesion.curso, 'Curso por confirmar')}</p>
                <p className="mt-1 text-xs text-slate-500">Docente: {primerTexto(sesion.docente, 'Por asignar')}</p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 sm:self-auto">
                <Clock3 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {primerTexto(sesion.horaInicio, '—')} – {primerTexto(sesion.horaFin, '—')}
              </div>
            </article>
          ))}
        </div>
        <div className="border-t border-slate-100 p-4"><BotonActualizar onRefresh={onRefresh} loading={loading} /></div>
      </section>
    );
  };

  const renderCursos = () => {
    if (!ciclo) {
      return <EstadoVacio icon={BookOpen} titulo="No tienes cursos asociados a un ciclo activo" detalle="Los cursos aparecerán después de confirmar tu matrícula." />;
    }
    if (cursos.length === 0) {
      return <EstadoVacio icon={BookOpen} titulo="Aún no hay cursos publicados" detalle="La academia todavía no ha asociado cursos a tu ciclo." />;
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-bold text-slate-900">{cursos.length} curso(s)</h2><p className="text-sm text-slate-500">{ciclo.nombre}</p></div>
          <BotonActualizar onRefresh={onRefresh} loading={loading} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cursos.map((curso, indice) => (
            <article key={curso.idCurso ?? `${curso.nombre}-${indice}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-teal-50 p-3 text-teal-700"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
                {curso.codigo && <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{curso.codigo}</span>}
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{primerTexto(curso.nombre, 'Curso sin nombre')}</h3>
              <p className="mt-2 min-h-10 text-sm text-slate-500">{primerTexto(curso.descripcion, 'No hay una descripción disponible.')}</p>
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <p><span className="font-semibold">Docente:</span> {primerTexto(curso.docente, 'Por asignar')}</p>
                <p className="mt-1"><span className="font-semibold">Objetivo:</span> {primerTexto(curso.universidadObjetivo, ciclo.universidadObjetivo, 'No especificado')}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };

  const renderResultados = () => (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaMetrica icon={TrendingUp} etiqueta="Promedio general" valor={promedioTexto} detalle="Promedio de tus evaluaciones registradas" tono="teal" />
        <TarjetaMetrica icon={Award} etiqueta="Puesto en ranking" valor={puesto == null ? 'Sin puesto' : `#${puesto}`} detalle="Según el ranking de tu ciclo" tono="blue" />
        <TarjetaMetrica icon={FileText} etiqueta="Evaluaciones" valor={totalEvaluaciones} detalle="Registros disponibles en tu historial" tono="violet" />
      </section>

      {historial.length === 0 ? (
        <EstadoVacio
          icon={Award}
          titulo="Todavía no tienes resultados registrados"
          detalle="Cuando tus docentes registren tus calificaciones, podrás consultar aquí tus simulacros y evaluaciones."
          accion={<button type="button" onClick={onRefresh} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Actualizar resultados</button>}
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div><h2 className="font-bold text-slate-900">Historial de evaluaciones</h2><p className="mt-1 text-sm text-slate-500">Resultados registrados para tu matrícula.</p></div>
            <BotonActualizar onRefresh={onRefresh} loading={loading} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Evaluación</th>
                  <th className="px-5 py-3 font-semibold">Curso</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 text-right font-semibold">Calificación</th>
                  <th className="px-5 py-3 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((nota, indice) => {
                  const cerrada = Number(nota.estadoRegistro ?? nota.EstadoRegistro) === 2;
                  return (
                    <tr key={nota.idEvaluacion ?? `${nota.fechaCreacion}-${indice}`} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">{primerTexto(nota.tipoEvaluacion, nota.TipoEvaluacion, 'Evaluación')}</td>
                      <td className="px-5 py-4 text-slate-700">{primerTexto(nota.curso, nota.Curso, 'Simulacro general')}</td>
                      <td className="px-5 py-4 text-slate-600">{formatearFecha(nota.fechaCreacion ?? nota.FechaCreacion)}</td>
                      <td className="px-5 py-4 text-right text-base font-bold text-slate-900">{formatearNota(nota.calificacion ?? nota.Calificacion)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold ${cerrada ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {cerrada ? 'Cerrada' : 'Registrada'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );

  const renderMateriales = () => {
    if (!ciclo) {
      return <EstadoVacio icon={FileText} titulo="No hay un ciclo activo" detalle="Los materiales se mostrarán cuando tengas un ciclo y recursos académicos publicados." />;
    }
    if (materiales.length === 0) {
      return <EstadoVacio icon={FileText} titulo="Todavía no hay materiales publicados" detalle="Cuando la academia comparta recursos para tu ciclo, aparecerán en esta sección." />;
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-bold text-slate-900">Recursos de estudio</h2><p className="text-sm text-slate-500">Materiales publicados para {ciclo.nombre}.</p></div>
          <BotonActualizar onRefresh={onRefresh} loading={loading} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {materiales.map((material, indice) => {
            const disponible = Boolean((material.urlArchivo ?? material.UrlArchivo) && (material.idMaterial ?? material.IdMaterial));
            return (
              <article key={material.idMaterial ?? `${material.titulo}-${indice}`} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-blue-50 p-3 text-blue-700"><FileText className="h-5 w-5" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">{primerTexto(material.titulo, 'Material de estudio')}</h3>
                    <p className="mt-1 text-xs text-slate-500">{primerTexto(material.curso, 'Material general')}</p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm text-slate-600">{primerTexto(material.descripcion, 'Sin descripción adicional.')}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">Publicado: {formatearFecha(material.fechaPublicacion)}</span>
                  {disponible ? (
                    <BotonDescargarMaterial material={material} />
                  ) : (
                    <span className="text-xs text-amber-700">Archivo no disponible</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPerfil = () => (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-800">
              {nombre.trim().slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{nombre}</h2>
              <p className="text-sm text-slate-500">Alumno · {primerTexto(usuario.codigoUsuario, user?.codigoUsuario, 'Sin código')}</p>
            </div>
          </div>
          <button type="button" onClick={() => setPerfilModalAbierto(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800">
            <UserRound className="h-4 w-4" aria-hidden="true" /> Editar mi perfil
          </button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div><p className="text-xs font-semibold text-slate-500">DNI</p><p className="mt-1 font-semibold text-slate-900">{primerTexto(user?.dni, usuario.dni, 'No registrado')}</p></div>
          <div><p className="text-xs font-semibold text-slate-500">Correo electrónico</p><p className="mt-1 break-all font-semibold text-slate-900">{primerTexto(user?.correo, usuario.correo, 'No registrado')}</p></div>
          <div><p className="text-xs font-semibold text-slate-500">Nombres</p><p className="mt-1 font-semibold text-slate-900">{primerTexto(user?.nombres, usuario.nombres, nombre)}</p></div>
          <div><p className="text-xs font-semibold text-slate-500">Ciclo actual</p><p className="mt-1 font-semibold text-slate-900">{primerTexto(ciclo?.nombre, 'Sin ciclo activo')}</p></div>
        </div>
      </section>
      <ModalMiPerfil
        isOpen={perfilModalAbierto}
        onClose={() => setPerfilModalAbierto(false)}
        user={user}
        onGuardarUsuario={onUpdateUser}
      />
    </div>
  );

  let contenido;
  switch (view) {
    case VIEWS.home:
      contenido = renderInicio();
      break;
    case VIEWS.ciclo:
      contenido = renderCiclo();
      break;
    case VIEWS.horario:
      contenido = renderHorario();
      break;
    case VIEWS.cursos:
      contenido = renderCursos();
      break;
    case VIEWS.notas:
      contenido = renderResultados();
      break;
    case VIEWS.materiales:
      contenido = renderMateriales();
      break;
    case VIEWS.perfil:
      contenido = renderPerfil();
      break;
    default:
      contenido = (
        <EstadoVacio
          icon={AlertCircle}
          titulo="No encontramos esta sección"
          detalle="Selecciona una opción disponible en el menú lateral."
          accion={<button type="button" onClick={() => setActiveTab?.(VIEWS.home)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white">Ir al inicio <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
        />
      );
  }

  return (
    <div className="min-h-full bg-slate-50 p-5 text-slate-900 md:p-8">
      <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Portal Preuniversitario</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">{nombre}</p>
        </div>
        {view !== VIEWS.perfil && <BotonActualizar onRefresh={onRefresh} loading={loading} />}
      </header>

      {contenido}

      {error && expediente && (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          Se muestran los últimos datos cargados. No se pudo actualizar la información: {error}
        </p>
      )}
    </div>
  );
}
