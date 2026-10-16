import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Mail,
  UserRound,
  FileText,
  MapPin,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { obtenerMiIntranetAlumno } from '../services/api';

const VIEWS = {
  home: 'student-home',
  ciclo: 'student-ciclo',
  horario: 'student-horario',
  cursos: 'student-cursos',
  notas: 'student-notas',
  materiales: 'student-materiales',
  perfil: 'student-perfil'
};

const normalizarFecha = (valor) => {
  if (!valor) return '—';
  const fecha = String(valor).slice(0, 10);
  const partes = fecha.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
};

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5">
        <span className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );
}

export default function StudentIntranetPage({ view, setActiveTab, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await obtenerMiIntranetAlumno();
      setData(result);
    } catch (err) {
      setError(err.message || 'No fue posible cargar tu portal del alumno.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ciclo = data?.ciclo;
  const cursos = Array.isArray(data?.cursos) ? data.cursos : [];
  const notas = Array.isArray(data?.notas?.historial) ? data.notas.historial : [];
  const materiales = Array.isArray(data?.materiales) ? data.materiales : [];
  const horarios = Array.isArray(data?.horarioDetalle) ? data.horarioDetalle : [];
  const promedio = Number(data?.notas?.promedioGeneral || 0);
  const ranking = data?.notas?.puestoRanking ?? null;

  const tituloView = useMemo(() => ({
    [VIEWS.home]: 'Inicio',
    [VIEWS.ciclo]: 'Mi ciclo',
    [VIEWS.horario]: 'Mi horario',
    [VIEWS.cursos]: 'Mis cursos',
    [VIEWS.notas]: 'Calificaciones',
    [VIEWS.materiales]: 'Materiales',
    [VIEWS.perfil]: 'Mi perfil'
  }[view] || 'Inicio'), [view]);

  const abrirMaterial = (material) => {
    if (material?.urlArchivo) {
      window.open(material.urlArchivo, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-700" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-500">Cargando tu portal del alumno...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto p-6 rounded-xl bg-white border border-rose-200 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">No pudimos cargar tu expediente</h1>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
              <button
                type="button"
                onClick={cargar}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-xs font-bold text-white hover:bg-blue-600"
              >
                <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ciclo) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="inline-flex p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-4">Todavía no tienes un ciclo activo</h1>
          <p className="text-sm text-slate-500 mt-2">
            Tu cuenta existe, pero aún no encontramos una matrícula activa para mostrar tu información preuniversitaria. Comunícate con la administración de la academia.
          </p>
        </div>
      </div>
    );
  }

  const cycleSummary = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ciclo</span>
        <p className="text-base font-bold text-slate-900 mt-2">{ciclo.nombre}</p>
      </div>
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Turno y horario</span>
        <p className="text-base font-bold text-slate-900 mt-2">{ciclo.turno || '—'}</p>
        <p className="text-xs text-slate-500 mt-1">{ciclo.horario || '—'}</p>
      </div>
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Universidad objetivo</span>
        <p className="text-base font-bold text-slate-900 mt-2">{ciclo.universidadObjetivo || 'Preuniversitario'}</p>
        <p className="text-xs text-slate-500 mt-1">{ciclo.diasClase || 'Horario institucional'}</p>
      </div>
    </div>
  );

  const header = (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="text-blue-700 text-[11px] font-bold uppercase tracking-[0.16em]">Portal del Estudiante</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">{tituloView}</h1>
        <p className="text-sm text-slate-500 mt-2">
          {data?.usuario?.nombreCompleto || user?.nombre || 'Alumno'} · {user?.codigoUsuario || data?.usuario?.codigoUsuario || 'Sin código'}
        </p>
      </div>
      <button
        type="button"
        onClick={cargar}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
      >
        <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
        Actualizar
      </button>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {header}

        {view === VIEWS.home && (
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Matrícula activa
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-4">
                    Hola, {data?.usuario?.nombres || user?.nombre || 'estudiante'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                    Este es tu espacio personal. Aquí solo verás la información correspondiente a tu matrícula y a tu ciclo actual.
                  </p>
                </div>
                <div className="min-w-[220px] p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mi ciclo</p>
                  <p className="text-lg font-bold text-slate-900 mt-2">{ciclo.nombre}</p>
                  <p className="text-xs text-blue-700 mt-1">{ciclo.universidadObjetivo}</p>
                </div>
              </div>
            </div>

            {cycleSummary}

            <div>
              <SectionHeader icon={CalendarDays} title="Accesos rápidos" subtitle="Lo esencial para tu preparación." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  [VIEWS.horario, Clock3, 'Mi horario', 'Revisa tu turno y horario de clases.'],
                  [VIEWS.cursos, BookOpen, 'Mis cursos', `${cursos.length} cursos asignados a tu ciclo.`],
                  [VIEWS.notas, Award, 'Calificaciones', `${notas.length} registros y promedio ${promedio.toFixed(2)}.`],
                  [VIEWS.materiales, FileText, 'Materiales', `${materiales.length} archivos disponibles.`]
                ].map(([id, Icon, title, text]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="text-left p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-shadow"
                  >
                    <span className="inline-flex p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-4">{title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.ciclo && (
          <div className="space-y-6">
            <SectionHeader icon={GraduationCap} title="Mi ciclo" subtitle="Esta sección corresponde únicamente a tu matrícula activa." />
            {cycleSummary}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Detalle del ciclo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
                <div><span className="text-slate-500">Nombre:</span> <span className="text-slate-900 font-semibold">{ciclo.nombre}</span></div>
                <div><span className="text-slate-500">Universidad objetivo:</span> <span className="text-slate-900 font-semibold">{ciclo.universidadObjetivo || '—'}</span></div>
                <div><span className="text-slate-500">Turno:</span> <span className="text-slate-900 font-semibold">{ciclo.turno || '—'}</span></div>
                <div><span className="text-slate-500">Horario:</span> <span className="text-slate-900 font-semibold">{ciclo.horario || '—'}</span></div>
                <div><span className="text-slate-500">Días:</span> <span className="text-slate-900 font-semibold">{ciclo.diasClase || '—'}</span></div>
                <div><span className="text-slate-500">Inicio:</span> <span className="text-slate-900 font-semibold">{normalizarFecha(ciclo.fechaInicio)}</span></div>
                <div><span className="text-slate-500">Fin:</span> <span className="text-slate-900 font-semibold">{normalizarFecha(ciclo.fechaFin)}</span></div>
                <div><span className="text-slate-500">Inscritos en el ciclo:</span> <span className="text-slate-900 font-semibold">{ciclo.totalAlumnos ?? 0}</span></div>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.horario && (
          <div className="space-y-6">
            <SectionHeader icon={Clock3} title="Mi horario de clases" subtitle="Horario del ciclo y, cuando exista, detalle por curso." />
            {cycleSummary}
            {horarios.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-4 font-semibold">Día</th>
                      <th className="text-left px-5 py-4 font-semibold">Horario</th>
                      <th className="text-left px-5 py-4 font-semibold">Curso</th>
                      <th className="text-left px-5 py-4 font-semibold">Docente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h, index) => (
                      <tr key={h.idHorario || index} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-900">{h.diaSemana || '—'}</td>
                        <td className="px-5 py-4 text-slate-700">{h.horaInicio || '—'} - {h.horaFin || '—'}</td>
                        <td className="px-5 py-4 text-slate-700">{h.curso || '—'}</td>
                        <td className="px-5 py-4 text-slate-500">{h.docente || 'Por asignar'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-7 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                <Clock3 className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900 mt-3">Horario general de tu ciclo</p>
                <p className="text-xs text-slate-500 mt-1">
                  {ciclo.diasClase || 'Días de clase'} · {ciclo.horario || 'Horario por confirmar'}
                </p>
              </div>
            )}
          </div>
        )}

        {view === VIEWS.cursos && (
          <div>
            <SectionHeader icon={BookOpen} title="Mis cursos" subtitle={`Cursos asignados a ${ciclo.nombre}.`} />
            {cursos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {cursos.map((curso) => (
                  <div key={curso.idCurso} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{curso.codigo || 'CURSO'}</span>
                      <span className="p-1.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700">
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-3">{curso.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{curso.descripcion || 'Curso de preparación preuniversitaria.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white border border-slate-200 shadow-sm">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900 mt-3">Aún no hay cursos vinculados a tu ciclo.</p>
                <p className="text-xs text-slate-500 mt-1">La administración debe completar la relación ciclo–curso.</p>
              </div>
            )}
          </div>
        )}

        {view === VIEWS.notas && (
          <div className="space-y-6">
            <SectionHeader icon={Award} title="Calificaciones" subtitle="Solo se muestran evaluaciones pertenecientes a tu cuenta." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Promedio general</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{promedio.toFixed(2)}</p>
              </div>
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Puesto</span>
                <p className="text-3xl font-bold text-blue-700 mt-2">{ranking ? `#${ranking}` : '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Dentro de tu ciclo</p>
              </div>
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Evaluaciones</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{notas.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              {notas.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-4 font-semibold">Curso</th>
                      <th className="text-left px-5 py-4 font-semibold">Evaluación</th>
                      <th className="text-left px-5 py-4 font-semibold">Nota</th>
                      <th className="text-left px-5 py-4 font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map((nota, index) => (
                      <tr key={nota.idEvaluacion || index} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-4 text-slate-700">{nota.curso || 'Simulacro general'}</td>
                        <td className="px-5 py-4 text-slate-700">{nota.tipoEvaluacion || 'Evaluación'}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{Number(nota.calificacion || 0).toFixed(2)}</td>
                        <td className="px-5 py-4 text-slate-500">{normalizarFecha(nota.fechaCreacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <Award className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                  <p className="text-sm font-bold text-slate-900 mt-3">Todavía no tienes calificaciones.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === VIEWS.materiales && (
          <div>
            <SectionHeader icon={BookOpen} title="Materiales de estudio" subtitle="Materiales PDF que la academia haya publicado para tu ciclo." />
            {materiales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materiales.map((material) => (
                  <div key={material.idMaterial} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700">{material.curso || 'Material'}</span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">{material.titulo || material.tema || 'Material de estudio'}</h3>
                        <p className="text-xs text-slate-500 mt-2">{material.descripcion || 'Archivo académico de refuerzo.'}</p>
                      </div>
                      <span className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500">{normalizarFecha(material.fechaPublicacion)}</span>
                      <button
                        type="button"
                        onClick={() => abrirMaterial(material)}
                        disabled={!material.urlArchivo}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        Abrir PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white border border-slate-200 shadow-sm">
                <FileText className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900 mt-3">Aún no hay materiales para tu ciclo.</p>
              </div>
            )}
          </div>
        )}

        {view === VIEWS.perfil && (
          <div className="max-w-3xl">
            <SectionHeader icon={UserRound} title="Mi perfil" subtitle="Datos básicos de tu cuenta institucional." />
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-blue-700 flex items-center justify-center text-xl font-bold text-white">
                  {(data?.usuario?.nombreCompleto || user?.nombre || 'AL').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{data?.usuario?.nombreCompleto || user?.nombre}</h2>
                  <p className="text-xs text-slate-500">Código: {data?.usuario?.codigoUsuario || user?.codigoUsuario || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 text-sm">
                <div className="flex items-center gap-3"><UserRound className="w-4 h-4 text-blue-700" aria-hidden="true" /><div><span className="block text-[10px] uppercase text-slate-500 font-bold">Nombres</span><span className="text-slate-900">{data?.usuario?.nombres || '—'}</span></div></div>
                <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-blue-700" aria-hidden="true" /><div><span className="block text-[10px] uppercase text-slate-500 font-bold">DNI</span><span className="text-slate-900">{data?.usuario?.dni || '—'}</span></div></div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-blue-700" aria-hidden="true" /><div><span className="block text-[10px] uppercase text-slate-500 font-bold">Correo</span><span className="text-slate-900">{data?.usuario?.correo || '—'}</span></div></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-blue-700" aria-hidden="true" /><div><span className="block text-[10px] uppercase text-slate-500 font-bold">Universidad objetivo</span><span className="text-slate-900">{ciclo.universidadObjetivo || '—'}</span></div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


