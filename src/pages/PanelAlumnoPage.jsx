import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Video,
  ExternalLink,
  Award,
  TrendingUp,
  Calendar,
  Sparkles,
  Loader2,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  BarChart3
} from 'lucide-react';

import {
  obtenerMaterialesAlumno,
  obtenerNotasSimulacroAlumno
} from '../services/api';

export default function PanelAlumnoPage() {
  const [materiales, setMateriales] = useState([]);
  const [reporteNotas, setReporteNotas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // =========================================================
  // DATOS DE SESIÓN
  // =========================================================
  const sessionData = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('acadesys_session') || '{}'
      );
    } catch {
      return {};
    }
  })();

  const colorTema = sessionData.colorTema || '#4f46e5';
  const nombreAcademia =
    sessionData.nombreAcademia || 'AcadeSys Pre-U';

  // =========================================================
  // CARGA DE DATOS
  // =========================================================
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setErrorCarga('');

      try {
        /*
         * Por ahora se mantienen los IDs utilizados originalmente
         * por el proyecto.
         *
         * No se inventan propiedades de sesión hasta conocer
         * exactamente qué identificadores entrega el login.
         */
        const [resMateriales, resNotas] = await Promise.all([
          obtenerMaterialesAlumno(1),
          obtenerNotasSimulacroAlumno(101)
        ]);

        setMateriales(
          Array.isArray(resMateriales) ? resMateriales : []
        );

        setReporteNotas(resNotas || null);
      } catch (err) {
        console.error(
          'Error al cargar datos del estudiante:',
          err
        );

        setErrorCarga(
          'No se pudo cargar la información del alumno.'
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // =========================================================
  // FUNCIONES AUXILIARES
  // =========================================================

  const obtenerEstiloNota = (puntaje) => {
    const nota = Number(puntaje);

    if (nota < 13) {
      return {
        texto: 'Por mejorar',
        textoColor: 'text-red-400',
        fondo: 'bg-red-500/10',
        borde: 'border-red-500/20',
        Icono: AlertTriangle
      };
    }

    return {
      texto: 'Aprobado',
      textoColor: 'text-emerald-400',
      fondo: 'bg-emerald-500/10',
      borde: 'border-emerald-500/20',
      Icono: CheckCircle2
    };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    const partes = String(fecha).split('-');

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return fecha;
  };

  const promedioGeneral = Number(
    reporteNotas?.promedioGeneral ?? 0
  );

  const simulacros = Array.isArray(reporteNotas?.simulacros)
    ? reporteNotas.simulacros
    : [];

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (
    <div className="p-6 md:p-10 font-sans text-slate-100 space-y-8 bg-slate-950 min-h-screen">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />

            <span>
              HU-05: Aula Virtual y Repositorio de Clases
            </span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            Panel del Alumno y Materiales
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Visualiza tus resultados, revisa tu posición en el
            ranking y accede a tus materiales de estudio.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colorTema }}
          />

          <span>{nombreAcademia}</span>
        </div>
      </div>

      {/* =====================================================
          CARGANDO
      ====================================================== */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />

          <span className="text-xs">
            Cargando materiales y resultados académicos...
          </span>
        </div>
      ) : (
        <>
          {/* =================================================
              ERROR DE CARGA
          ================================================== */}
          {errorCarga && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />

              <p className="text-sm text-red-300">
                {errorCarga}
              </p>
            </div>
          )}

          {/* =================================================
              INFORMACIÓN DEL ESTUDIANTE
          ================================================== */}
          {reporteNotas && (
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Estudiante
                  </span>

                  <h2 className="text-xl font-black text-white mt-1">
                    {reporteNotas.estudiante || 'Alumno AcadeSys'}
                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    Código:{' '}
                    <span className="text-slate-300 font-mono">
                      {reporteNotas.codigoUsuario || 'Sin código'}
                    </span>
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block">
                    Ciclo
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {reporteNotas.ciclo || 'No especificado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              TARJETAS DE MÉTRICAS
          ================================================== */}
          {reporteNotas && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* PROMEDIO */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Promedio en Simulacros
                  </span>

                  <span
                    className={`text-3xl font-black font-mono ${
                      promedioGeneral < 13
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {promedioGeneral.toFixed(1)} / 20.0
                  </span>

                  <span className="text-[11px] text-slate-500 block mt-1">
                    Ciclo: {reporteNotas.ciclo}
                  </span>
                </div>

                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    promedioGeneral < 13
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* RANKING */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Puesto en el Ranking
                  </span>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-400 font-mono">
                      #{reporteNotas.puestoRanking ?? '-'}
                    </span>

                    <span className="text-xs text-slate-400">
                      de {reporteNotas.totalAlumnos ?? 0} alumnos
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 block mt-1">
                    Ranking del ciclo
                  </span>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              {/* SIMULACROS */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Simulacros Rendidos
                  </span>

                  <span className="text-3xl font-black text-white font-mono">
                    {simulacros.length}
                  </span>

                  <span className="text-[11px] text-slate-500 block mt-1">
                    Historial actualizado
                  </span>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              HISTORIAL DE SIMULACROS
          ================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-400" />

                <span>Historial de Simulacros</span>
              </h2>

              <span className="text-xs text-slate-400">
                {simulacros.length} resultados registrados
              </span>
            </div>

            {simulacros.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {simulacros.map((simulacro, index) => {
                  const puntaje = Number(
                    simulacro.puntaje ?? 0
                  );

                  const estilo =
                    obtenerEstiloNota(puntaje);

                  const IconoEstado = estilo.Icono;

                  return (
                    <div
                      key={`${simulacro.numero || 'simulacro'}-${simulacro.fecha || index}`}
                      className={`p-5 rounded-2xl bg-slate-900/60 border ${estilo.borde} hover:bg-slate-900/80 transition duration-150 backdrop-blur-md`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                            Evaluación
                          </span>

                          <h3 className="text-sm font-bold text-white mt-1">
                            {simulacro.numero ||
                              `Simulacro ${index + 1}`}
                          </h3>
                        </div>

                        <div
                          className={`w-10 h-10 rounded-xl ${estilo.fondo} border ${estilo.borde} flex items-center justify-center ${estilo.textoColor}`}
                        >
                          <IconoEstado className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                            Puntaje
                          </span>

                          <span
                            className={`text-3xl font-black font-mono ${estilo.textoColor}`}
                          >
                            {puntaje.toFixed(1)}
                          </span>

                          <span className="text-xs text-slate-500 ml-1">
                            / 20
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${estilo.fondo} ${estilo.textoColor} text-[10px] font-bold uppercase border ${estilo.borde}`}
                          >
                            <IconoEstado className="w-3 h-3" />

                            {estilo.texto}
                          </span>

                          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-2">
                            <Calendar className="w-3 h-3" />

                            {formatearFecha(
                              simulacro.fecha
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />

                <p className="text-sm font-semibold text-slate-300">
                  Aún no tienes simulacros registrados.
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Tus resultados aparecerán aquí cuando estén
                  disponibles.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              MATERIALES Y CLASES
          ================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />

                <span>
                  Materiales de Clase y Grabaciones
                </span>
              </h2>

              <span className="text-xs text-slate-400">
                {materiales.length} recursos disponibles
              </span>
            </div>

            {materiales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materiales.map((mat, index) => (
                  <div
                    key={
                      mat.idMaterial ??
                      `${mat.curso || 'material'}-${index}`
                    }
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition duration-150 flex flex-col justify-between space-y-4 backdrop-blur-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                          {mat.curso || 'Curso'}
                        </span>

                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono whitespace-nowrap">
                          <Calendar className="w-3 h-3" />

                          {formatearFecha(
                            mat.fechaPublicacion
                          )}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug">
                        {mat.tema || 'Material de estudio'}
                      </h3>

                      <p className="text-xs text-slate-400">
                        Docente:{' '}
                        <span className="text-slate-300 font-medium">
                          {mat.docente ||
                            'No especificado'}
                        </span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Cloud className="w-4 h-4 text-cyan-400" />

                        <span className="capitalize">
                          {mat.tipo
                            ? `${mat.tipo} Cloud`
                            : 'Recurso digital'}
                        </span>
                      </div>

                      {mat.enlace ? (
                        <a
                          href={mat.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          style={{
                            backgroundColor: colorTema
                          }}
                        >
                          <Video className="w-3.5 h-3.5" />

                          <span>
                            Acceder al material
                          </span>

                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-500 text-xs font-semibold">
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />

                <p className="text-sm font-semibold text-slate-300">
                  No hay materiales disponibles.
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Los materiales publicados aparecerán en esta
                  sección.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}