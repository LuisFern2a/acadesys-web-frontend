import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  AlertTriangle, 
  BrainCircuit, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  School,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function DashboardOverviewPage({ setActiveTab }) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2026-B2');

  const periodos = [
    { id: '2026-B1', label: 'Periodo Lectivo 2026 - I Bimestre' },
    { id: '2026-B2', label: 'Periodo Lectivo 2026 - II Bimestre (En Curso)' },
    { id: '2026-B3', label: 'Periodo Lectivo 2026 - III Bimestre' },
    { id: '2026-B4', label: 'Periodo Lectivo 2026 - IV Bimestre' }
  ];

  const kpis = [
    {
      titulo: 'Estudiantes Activos',
      valor: '1,248',
      cambio: '+4.5%',
      sube: true,
      icono: Users,
      color: 'indigo'
    },
    {
      titulo: 'Asistencia Hoy',
      valor: '94.2%',
      cambio: '+1.2%',
      sube: true,
      icono: UserCheck,
      color: 'emerald'
    },
    {
      titulo: 'Promedio Institucional',
      valor: '15.4 / 20',
      cambio: '+0.3',
      sube: true,
      icono: TrendingUp,
      color: 'violet'
    },
    {
      titulo: 'En Riesgo Académico',
      valor: '28',
      cambio: '-3',
      sube: false,
      icono: AlertTriangle,
      color: 'rose'
    }
  ];

  const actividadReciente = [
    { id: 1, tipo: 'Simulacro', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200', titulo: 'Simulacro General UNI #3 calificado', tiempo: 'Hace 25 min', aula: 'Aula 101 - Ciencias' },
    { id: 2, tipo: 'Tutor IA', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200', titulo: '8 diagnósticos generados para el aula 5to B', tiempo: 'Hace 1 hora', aula: '5to Grado B' },
    { id: 3, tipo: 'Asistencia', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', titulo: 'Alerta de inasistencia recurrente enviada', tiempo: 'Hace 3 horas', aula: 'Aula 102 - Letras' },
    { id: 4, tipo: 'Carga', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200', titulo: 'Prof. Carlos Mendoza actualizó sílabo bimestral', tiempo: 'Hace 5 horas', aula: 'Álgebra Superior' }
  ];

  const rendimientoAulas = [
    { aula: 'Aula 101 - Ciencias', promedio: 16.2, aprobados: 94 },
    { aula: 'Aula 102 - Letras', promedio: 15.8, aprobados: 91 },
    { aula: '5to Grado B - Selección', promedio: 14.9, aprobados: 85 },
    { aula: '3er Grado A', promedio: 16.5, aprobados: 97 }
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel General AcadeSys</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Métricas institucionales consolidadas, control de asistencia y alertas académicas
          </p>
        </div>

        {/* SELECTOR DE PERIODO INTERACTIVO */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20">
          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-1"
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icono;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{kpi.titulo}</span>
                <span className={`p-2 rounded-xl text-white ${
                  kpi.color === 'indigo' ? 'bg-indigo-600' :
                  kpi.color === 'emerald' ? 'bg-emerald-600' :
                  kpi.color === 'violet' ? 'bg-violet-600' : 'bg-rose-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-800">{kpi.valor}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${
                  kpi.sube ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  {kpi.sube ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                  {kpi.cambio}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* COLUMNA 1 & 2: RENDIMIENTO POR AULAS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-base">Rendimiento Promedio por Aula</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('academico')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 group cursor-pointer"
            >
              <span>Gestionar Aulas</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>

          <div className="space-y-4">
            {rendimientoAulas.map((aula, i) => {
              const esSobresaliente = aula.promedio >= 16;
              const porcentaje = Math.min(Math.round((aula.promedio / 20) * 100), 100);

              return (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="font-bold text-slate-700">{aula.aula}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">Tasa de aprobación: <strong className="text-slate-700 font-semibold">{aula.aprobados}%</strong></span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-md border text-xs ${
                        esSobresaliente 
                          ? 'text-indigo-700 bg-indigo-50 border-indigo-100' 
                          : 'text-slate-700 bg-white border-slate-200'
                      }`}>
                        {aula.promedio.toFixed(1)} / 20
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        esSobresaliente ? 'bg-indigo-600' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA 3: ACCESO DIRECTO TUTOR IA Y ATAJOS */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" /> Diagnóstico Predictivo
              </div>
              <h3 className="font-bold text-base text-white mb-2">Tutor IA Institucional</h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Genera estrategias pedagógicas personalizadas a partir de los simulacros vigentes de los estudiantes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tutor-ia')}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-medium text-xs shadow-md transition cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" /> Abrir Tutor IA
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('calificaciones')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/70 text-xs font-medium text-slate-700 transition flex items-center justify-between group cursor-pointer"
              >
                <span>Revisar Boletas y Ranking</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('academico')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/70 text-xs font-medium text-slate-700 transition flex items-center justify-between group cursor-pointer"
              >
                <span>Asignar Carga Docente</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">Actividad Reciente del Sistema</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {actividadReciente.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] border ${item.badgeColor}`}>
                  {item.tipo}
                </span>
                <span className="font-medium text-slate-800">{item.titulo}</span>
                <span className="text-slate-400 hidden sm:inline">({item.aula})</span>
              </div>
              <span className="text-slate-400 font-medium">{item.tiempo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}