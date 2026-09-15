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
  ChevronRight,
  Printer,
  GraduationCap
} from 'lucide-react';

export default function CalificacionesPage({ estudianteActivo, onIrATutorIA }) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('bimestre-2');

  const estudiante = estudianteActivo || {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
    codigo: 'ACAD-2026-755',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 3,
    totalAlumnos: 36,
    promedioGeneral: 15.8,
    cursosCriticos: 1,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 16, tareas: 18, final: 15, promedio: 16.3, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 17, tareas: 19, final: 18, promedio: 18.0, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 13, tareas: 15, final: 14, promedio: 14.0, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 10, tareas: 12, final: 11, promedio: 11.0, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 12, tareas: 13, final: 12, promedio: 12.3, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  };

  const handleImprimirBoleta = () => {
    window.print();
  };

  const handleDescargar = (archivo) => {
    alert(`Descargando material: ${archivo}`);
  };

  const nombresPeriodo = {
    'bimestre-1': 'I Bimestre',
    'bimestre-2': 'II Bimestre',
    'simulacros': 'Simulacros de Examen'
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full print:p-0 print:bg-white">
      {/* CABECERA MEMBRETADA OFICIAL (SOLO VISIBLE AL IMPRIMIR / GUARDAR EN PDF) */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ACADESYS</h1>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                Plataforma de Gestión Educativa Integral
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-800">BOLETA OFICIAL DE CALIFICACIONES</p>
            <p>Periodo: {nombresPeriodo[periodoSeleccionado]}</p>
            <p>Fecha de emisión: {new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <p><span className="font-bold text-slate-700">Estudiante:</span> {estudiante.nombre}</p>
            <p><span className="font-bold text-slate-700">Código:</span> {estudiante.codigo}</p>
          </div>
          <div>
            <p><span className="font-bold text-slate-700">Grado y Sección:</span> {estudiante.aula}</p>
            <p><span className="font-bold text-slate-700">Posición en el Aula:</span> Puesto #{estudiante.puestoRanking} de {estudiante.totalAlumnos}</p>
          </div>
        </div>
      </div>

      {/* HEADER DE PANTALLA (OCULTO AL IMPRIMIR) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Calificaciones y Rendimiento</h1>
              <p className="text-slate-500 text-sm">
                Mostrando registro de: <span className="font-semibold text-slate-800">{estudiante.nombre}</span> ({estudiante.aula})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN DE IMPRESIÓN / DESCARGA PDF */}
          <button
            type="button"
            onClick={handleImprimirBoleta}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Exportar PDF / Imprimir</span>
          </button>

          {/* SELECTOR DE PERIODO */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-sm">
            <button
              type="button"
              onClick={() => setPeriodoSeleccionado('bimestre-1')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                periodoSeleccionado === 'bimestre-1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bimestre I
            </button>
            <button
              type="button"
              onClick={() => setPeriodoSeleccionado('bimestre-2')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                periodoSeleccionado === 'bimestre-2' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bimestre II (Actual)
            </button>
            <button
              type="button"
              onClick={() => setPeriodoSeleccionado('simulacros')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                periodoSeleccionado === 'simulacros' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Simulacros
            </button>
          </div>
        </div>
      </div>

      {/* MÉTRICAS SUPERIORES (OCULTAS AL IMPRIMIR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Ranking del Aula</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">Puesto #{estudiante.puestoRanking}</span>
              <span className="text-xs text-slate-500 font-medium">de {estudiante.totalAlumnos}</span>
            </div>
          </div>
        </div>

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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Materias en Riesgo</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{estudiante.cursosCriticos} {estudiante.cursosCriticos === 1 ? 'Curso' : 'Cursos'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
            <Sparkles className="w-4 h-4" /> Tutor IA
          </div>
          <p className="text-xs text-indigo-100 line-clamp-2 mt-1">
            Revisar sugerencias pedagógicas personalizadas para {estudiante.nombre.split(' ')[0]}.
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

      {/* BOLETA DETALLADA DE CALIFICACIONES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-8 overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between print:py-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 print:text-slate-900" />
            <h2 className="font-bold text-slate-800 text-base">Boleta Oficial de Asignaturas</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium print:text-slate-600">
            Escala vigesimal (0 - 20)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase print:bg-slate-100 print:text-slate-900">
                <th className="py-4 px-6 print:py-2 print:px-3">Asignatura</th>
                <th className="py-4 px-6 print:py-2 print:px-3">Docente</th>
                <th className="py-4 px-4 text-center print:py-2 print:px-2">Ex. Parcial</th>
                <th className="py-4 px-4 text-center print:py-2 print:px-2">Tareas</th>
                <th className="py-4 px-4 text-center print:py-2 print:px-2">Ex. Final</th>
                <th className="py-4 px-6 text-center print:py-2 print:px-3">Promedio</th>
                <th className="py-4 px-6 text-center print:py-2 print:px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600 print:divide-slate-200">
              {estudiante.cursos.map((c) => {
                const enRiesgo = c.promedio < 13;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                    <td className="py-4 px-6 font-semibold text-slate-800 print:py-2 print:px-3">{c.nombre}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 print:py-2 print:px-3 print:text-slate-700">{c.docente}</td>
                    <td className="py-4 px-4 text-center font-mono text-xs print:py-2 print:px-2">{c.parcial}</td>
                    <td className="py-4 px-4 text-center font-mono text-xs print:py-2 print:px-2">{c.tareas}</td>
                    <td className="py-4 px-4 text-center font-mono text-xs print:py-2 print:px-2">{c.final}</td>
                    <td className="py-4 px-6 text-center font-bold font-mono text-base print:py-2 print:px-3 print:text-sm">
                      <span className={enRiesgo ? 'text-rose-600 print:text-slate-900' : 'text-slate-800'}>
                        {c.promedio.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center print:py-2 print:px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enRiesgo
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 print:border-none print:text-slate-900'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-none print:text-slate-900'
                      }`}>
                        {enRiesgo ? (
                          <>
                            <AlertCircle className="w-3 h-3 print:hidden" /> En Riesgo
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 print:hidden" /> Aprobado
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="hidden print:table-footer-group border-t-2 border-slate-900 text-xs font-bold text-slate-900">
              <tr>
                <td colSpan={5} className="py-3 px-3 text-right">PROMEDIO PONDERADO GENERAL:</td>
                <td className="py-3 px-3 text-center text-sm">{estudiante.promedioGeneral} / 20</td>
                <td className="py-3 px-3 text-center">APROBADO</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECCIÓN DE FIRMAS (SOLO VISIBLE EN IMPRESIÓN / PDF) */}
      <div className="hidden print:grid grid-cols-2 gap-16 mt-20 text-center text-xs text-slate-700">
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-900">Dirección Académica</p>
          <p className="text-[11px] text-slate-500">AcadeSys Institución Educativa</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-900">Firma del Apoderado</p>
          <p className="text-[11px] text-slate-500">Conformidad de Notas</p>
        </div>
      </div>

      {/* RECURSOS Y MATERIALES DE ESTUDIO (OCULTO AL IMPRIMIR) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">Recursos de Estudio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudiante.cursos.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-800 truncate">{c.materialPdf}</span>
                  <span className="text-[11px] text-slate-400">{c.nombre} • {c.pesoMb}</span>
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