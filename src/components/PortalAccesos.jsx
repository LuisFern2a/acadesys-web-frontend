import React from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  BookOpen
} from 'lucide-react';

const roles = [
  {
    idPerfil: '1',
    rolKey: 'admin',
    title: 'Administrador',
    badge: 'Gestión Institucional',
    tagline: 'ADMINISTRA TU ACADEMIA',
    description: 'Control global financiero, sedes y personal.',
    colorAccent: 'orange',
    theme: {
      border: 'hover:border-orange-500/50',
      glow: 'group-hover:shadow-[0_0_35px_rgba(249,115,22,0.18)]',
      iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      button: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/30',
      subtext: 'text-orange-400'
    },
    icon: ShieldCheck,
    features: [
      'Control y cronograma de cobros/pagos',
      'Apertura de ciclos (San Marcos / UNI / Pre)',
      'Registro de docentes, tutores y directivos'
    ]
  },
  {
    idPerfil: '2',
    rolKey: 'docente',
    title: 'Docente o Tutor',
    badge: 'Seguimiento Académico',
    tagline: 'HAZ SEGUIMIENTO A TUS ALUMNOS',
    description: 'Gestión de simulacros, notas y asistencias.',
    colorAccent: 'blue',
    theme: {
      border: 'hover:border-blue-500/50',
      glow: 'group-hover:shadow-[0_0_35px_rgba(59,130,246,0.18)]',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30',
      subtext: 'text-blue-400'
    },
    icon: GraduationCap,
    features: [
      'Registro de notas en simulacros y prácticas',
      'Semáforo de alertas y morosidad por aula',
      'Publicación de enlaces a clases y separatas'
    ]
  },
  {
    idPerfil: '4',
    rolKey: 'alumno',
    title: 'Alumno / Postulante',
    badge: 'Intranet Preuniversitaria',
    tagline: 'INGRESA A TU INTRANET DISPONIBLE',
    description: 'Acceso a boletas, rankings y tutoría IA 24/7.',
    colorAccent: 'emerald',
    theme: {
      border: 'hover:border-emerald-500/50',
      glow: 'group-hover:shadow-[0_0_35px_rgba(16,185,129,0.18)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30',
      subtext: 'text-emerald-400'
    },
    icon: BookOpen,
    features: [
      'Descarga de separatas y material semanal',
      'Ranking consolidado por áreas y carreras',
      'Tutor Gemini IA preuniversitario disponible 24/7'
    ]
  }
];

export default function PortalAccesos({ onSelectRoleLogin, onSelectRoleRegister }) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 py-12 z-10" id="portal-accesos">
      {/* Cabecera del Portal */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Portal de Accesos Institucionales</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Selecciona cómo deseas ingresar a la plataforma
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Elige tu perfil preconfigurado para autenticarte o dar de alta tu cuenta institucional en AcadeSys.
        </p>
      </div>

      {/* Grid de Perfiles de Acceso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {roles.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.idPerfil}
              className={`group flex flex-col justify-between bg-slate-900/60 border border-slate-800/80 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-xl ${item.theme.border} ${item.theme.glow}`}
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${item.theme.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg border ${item.theme.badge}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Títulos y Subtítulo estilo imagen original */}
                <h3 className="text-xl font-black text-white mb-1 tracking-tight">
                  {item.title}
                </h3>
                <p className={`text-[11px] font-bold tracking-wider uppercase mb-3 ${item.theme.subtext}`}>
                  {item.tagline}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-normal">
                  {item.description}
                </p>

                {/* Lista de Características / Permisos */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-8">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start text-xs text-slate-300 gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 group-hover:text-slate-300 transition-colors" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botonera de Acción: Iniciar Sesión o Crear Cuenta con ese perfil */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => onSelectRoleLogin?.(item.idPerfil)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98] ${item.theme.button}`}
                >
                  <span>Ingresar como {item.title.split(' ')[0]}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRoleRegister?.(item.idPerfil)}
                  className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl transition font-medium text-center"
                >
                  Crear cuenta para {item.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}