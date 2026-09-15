import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function CalificacionesPage({ onIrATutorIA }) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('bimestre-2');

  const estudiante = {
    nombre: 'Luis Fernando Tóccas',
    codigo: 'ACAD-2026-755',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 3,
    totalAlumnos: 36,
    promedioGeneral: 15.8,
    creditosAprobados: '100%'
  };

  const cursosData = [
    {
      id: 1,
      nombre: 'Álgebra Superior',
      docente: 'Prof. Carlos Mendoza',
      parcial: 16,
      tareas: 18,
      final: 15,
      promedio: 16.3,
      materialPdf: 'Silabo_Algebra_Bimestre2.pdf',
      pesoMb: '1.4 MB'
    },
    {
      id: 2,
      nombre: 'Razonamiento Matemático',
      docente: 'Prof. Dante Quispe',
      parcial: 17,
      tareas: 19,
      final: 18,
      promedio: 18.0,
      materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf',
      pesoMb: '2.1 MB'
    },
    {
      id: 3,
      nombre: 'Geometría del Espacio',
      docente: 'Prof. Juan David Peralta',
      parcial: 13,
      tareas: 15,
      final: 14,
      promedio: 14.0,
      materialPdf: 'Formulario_Geometria_Espacio.pdf',
      pesoMb: '980 KB'
    },
    {
      id: 4,
      nombre: 'Física y Cinemática',
      docente: 'Prof. María Flores',
      parcial: 10,
      tareas: 12,
      final: 11,
      promedio: 11.0,
      materialPdf: 'Problemas_Resueltos_Cinematica.pdf',
      pesoMb: '3.5 MB'
    },
    {
      id: 5,
      nombre: 'Química Orgánica',
      docente: 'Prof. Rosaura Benítez',
      parcial: 12,
      tareas: 13,
      final: 12,
      promedio: 12.3,
      materialPdf: 'Tabla_Compuestos_Organicos.pdf',
      pesoMb: '1.8 MB'
    }
  ];

  const handleDescargar = (archivo) => {
    alert(`Descargando material: ${archivo}`);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Panel de Calificaciones y Ranking</h1>
              <p className="text-slate-500 text-sm">
                Seguimiento del rendimiento académico bimestral y posición relativa en el aula
              </p>
            </div>
          </div>
        </div>

        {/* SELECTOR DE BIMESTRE / PERIODO */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-sm">
          <button
            onClick={() => setPeriodoSeleccionado('bimestre-1')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              periodoSeleccionado === 'bimestre-1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bimestre I
          </button>
          <button
            onClick={() => setPeriodoSeleccionado('bimestre-2')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              periodoSeleccionado === 'bimestre-2' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bimestre II (Actual)
          </button>
          <button
            onClick={() => setPeriodoSeleccionado('simulacros')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              periodoSeleccionado === 'simulacros' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Simulacros UNI
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS RÁPIDAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* RANKING */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Ranking del Salón</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">Puesto #{estudiante.puestoRanking}</span>
              <span className="text-xs text-slate-500 font-medium">de {estudiante.totalAlumnos}</span>
            </div>
          </div>
        </div>

        {/* PROMEDIO GENERAL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200/50 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Promedio Ponderado</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{estudiante.promedioGeneral}</span>
              <span className="text-xs text-slate-500 font-medium">/ 20</span>
            </div>
          </div>
        </div>

        {/* CURSOS EN RIESGO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Materias en Riesgo</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">1 Curso</span>
              <span className="text-xs text-rose-500 font-semibold">(Física &lt; 12)</span>
            </div>
          </div>
        </div>

        {/* BANNER RECOMENDACIÓN IA */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
            <Sparkles className="w-4 h-4" /> Recomendación IA
          </div>
          <p className="text-xs text-indigo-100 line-clamp-2 mt-1">
            Tu rendimiento en Física y Química puede mejorar con 45m diarios de ejercicios clave.
          </p>
          <button
            type="button"
            onClick={onIrATutorIA}
            className="text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1 mt-2 transition"
          >
            Ver diagnóstico completo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TABLA DE CALIFICACIONES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-8 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">Boleta Detallada por Cursos</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Escala vigesimal oficial (0 - 20)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6">Asignatura</th>
                <th className="py-4 px-6">Docente Titular</th>
                <th className="py-4 px-4 text-center">Ex. Parcial</th>
                <th className="py-4 px-4 text-center">Tareas / Práct.</th>
                <th className="py-4 px-4 text-center">Ex. Final</th>
                <th className="py-4 px-6 text-center">Promedio</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {cursosData.map((c) => {
                const enRiesgo = c.promedio < 13;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {c.nombre}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {c.docente}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs">
                      {c.parcial}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs">
                      {c.tareas}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs">
                      {c.final}
                    </td>
                    <td className="py-4 px-6 text-center font-bold font-mono text-base">
                      <span className={enRiesgo ? 'text-rose-600' : 'text-slate-800'}>
                        {c.promedio.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enRiesgo
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {enRiesgo ? (
                          <>
                            <AlertCircle className="w-3 h-3" /> En Riesgo
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Aprobado
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZONA DE MATERIALES Y RECURSOS EN PDF */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">Recursos de Estudio y Sílabos Descargables</h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Documentos y guías oficiales subidas por los docentes asignados para el periodo activo
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursosData.map((c) => (
            <div 
              key={c.id} 
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition bg-slate-50/50 flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-800 truncate" title={c.materialPdf}>
                    {c.materialPdf}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {c.nombre} • {c.pesoMb}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDescargar(c.materialPdf)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Material
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}