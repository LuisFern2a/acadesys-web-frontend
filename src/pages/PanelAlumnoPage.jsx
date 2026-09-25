import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Video, 
  ExternalLink, 
  Award, 
  TrendingUp, 
  Calendar, 
  Sparkles,
  Loader2,
  Cloud
} from 'lucide-react';
import { obtenerMaterialesAlumno, obtenerNotasSimulacroAlumno } from '../services/api';

export default function PanelAlumnoPage() {
  const [materiales, setMateriales] = useState([]);
  const [reporteNotas, setReporteNotas] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  })();

  const colorTema = sessionData.colorTema || '#4f46e5';
  const nombreAcademia = sessionData.nombreAcademia || 'AcadeSys Pre-U';

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [resMateriales, resNotas] = await Promise.all([
          obtenerMaterialesAlumno(1),
          obtenerNotasSimulacroAlumno(101)
        ]);
        setMateriales(Array.isArray(resMateriales) ? resMateriales : []);
        setReporteNotas(resNotas);
      } catch (err) {
        console.error("Error al cargar datos del estudiante:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return (
    <div className="p-6 md:p-10 font-sans text-slate-100 space-y-8 bg-slate-950 min-h-screen">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HU-05: Aula Virtual y Repositorio de Clases</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Panel del Alumno y Materiales
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualiza tus promedios, haz seguimiento de simulacros y accede a las grabaciones en Drive y OneDrive.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorTema }}></span>
          <span>{nombreAcademia}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs">Cargando repositorio de materiales y simulacros...</span>
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas de Simulacro */}
          {reporteNotas && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Promedio en Simulacros
                  </span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">
                    {reporteNotas.promedioGeneral?.toFixed(1)} / 20.0
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Ciclo: {reporteNotas.ciclo}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Puesto en el Ranking
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-400 font-mono">
                      #{reporteNotas.puestoRanking}
                    </span>
                    <span className="text-xs text-slate-400">
                      de {reporteNotas.totalAlumnos} alumnos
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Código: {reporteNotas.codigoUsuario}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Simulacros Rendidos
                  </span>
                  <span className="text-3xl font-black text-white font-mono">
                    {reporteNotas.simulacros?.length || 0}
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

          {/* Galería de Materiales y Clases Grabadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Materiales de Clase y Grabaciones</span>
              </h2>
              <span className="text-xs text-slate-400">
                {materiales.length} recursos disponibles
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materiales.map((mat) => (
                <div 
                  key={mat.idMaterial} 
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition duration-150 flex flex-col justify-between space-y-4 backdrop-blur-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                        {mat.curso}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {mat.fechaPublicacion}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {mat.tema}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Docente: <span className="text-slate-300 font-medium">{mat.docente}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Cloud className="w-4 h-4 text-cyan-400" />
                      <span className="capitalize">{mat.tipo} Cloud</span>
                    </div>

                    {/* Hipervínculo con redirección segura (HU-05) */}
                    <a
                      href={mat.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      style={{ backgroundColor: colorTema }}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Acceder a la Clase</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}