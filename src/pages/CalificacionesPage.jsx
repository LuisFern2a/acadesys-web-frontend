import React from 'react';
import { 
  Award, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Download, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Printer,
  GraduationCap
} from 'lucide-react';

export default function CalificacionesPage({ 
  estudianteActivo, 
  listaEstudiantes = [], 
  onCambiarEstudiante, 
  onIrATutorIA,
  user
}) {
  const cursosPorDefecto = [
    { id: 1, nombre: 'Álgebra Superior', parcial: 16, tareas: 18, final: 15, promedio: 16.2, materialPdf: 'Guia_Matrices_Polinomios_v2.pdf', pesoMb: '2.4 MB' },
    { id: 2, nombre: 'Razonamiento Matemático', parcial: 17, tareas: 19, final: 18, promedio: 18.0, materialPdf: 'Compendio_Problemas_Tipo_UNI.pdf', pesoMb: '3.1 MB' },
    { id: 3, nombre: 'Geometría del Espacio', parcial: 13, tareas: 15, final: 14, promedio: 14.0, materialPdf: 'Solucionario_Poliedros_Regulares.pdf', pesoMb: '1.8 MB' },
    { id: 4, nombre: 'Física y Cinemática', parcial: 10, tareas: 12, final: 11, promedio: 11.0, materialPdf: 'Modulo_Cinematica_Vectorial.pdf', pesoMb: '4.2 MB' },
    { id: 5, nombre: 'Química Orgánica', parcial: 12, tareas: 13, final: 12, promedio: 12.3, materialPdf: 'Formulario_Reacciones_Quimicas.pdf', pesoMb: '1.5 MB' }
  ];

  const estudiante = {
    id: estudianteActivo?.id || 1,
    nombre: estudianteActivo?.nombre || user?.nombre || 'Jessenia Patricia',
    codigo: estudianteActivo?.codigo || 'ACAD-2026-755',
    aula: estudianteActivo?.aula || 'Semestral San Marcos',
    puestoRanking: estudianteActivo?.puestoRanking || 3,
    totalAlumnos: estudianteActivo?.totalAlumnos || 120,
    cursos: (estudianteActivo?.cursos && estudianteActivo.cursos.length > 0) ? estudianteActivo.cursos : cursosPorDefecto
  };

  // Cálculo reactivo de materias en riesgo y promedio ponderado
  const cursosEnRiesgo = estudiante.cursos.filter(c => c.promedio < 13);
  const totalCursos = estudiante.cursos.length;
  const promedioGeneralCalculado = totalCursos > 0 
    ? (estudiante.cursos.reduce((acc, c) => acc + c.promedio, 0) / totalCursos).toFixed(1)
    : '0.0';

  const handleImprimir = () => {
    window.print();
  };

  const handleDescargar = (archivo) => {
    alert(`Descargando material: ${archivo}`);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full print:p-0 print:bg-white">
      {/* CABECERA MEMBRETADA OFICIAL (SOLO VISIBLE AL IMPRIMIR / PDF) */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ACADESYS</h1>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                Academia Preuniversitaria
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <h2 className="text-sm font-bold text-slate-800 uppercase">Boleta Oficial de Resultados</h2>
            <p>Periodo: Ciclo Actual</p>
            <p>Fecha de emisión: {new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <p><span className="font-bold text-slate-700">Estudiante:</span> {estudiante.nombre}</p>
            <p><span className="font-bold text-slate-700">Código:</span> {estudiante.codigo}</p>
          </div>
          <div>
            <p><span className="font-bold text-slate-700">Ciclo Académico:</span> <strong className="text-slate-800">{estudiante.aula}</strong></p>
            <p><span className="font-bold text-slate-700">Puesto en el Ciclo:</span> <strong className="text-slate-800">#{estudiante.puestoRanking}</strong></p>
          </div>
        </div>
      </div>

      {/* HEADER DE PANTALLA (OCULTO AL IMPRIMIR) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Rendimiento Académico</h2>
          <p className="text-slate-500 text-sm mt-1">
            {/* Aquí mostramos el nombre del estudiante y el ciclo al que pertenece */}
            Estudiante: <strong className="text-slate-700">{estudianteActivo?.nombre || user?.nombre || 'Jessenia Patricia'}</strong>
            <span className="mx-2">|</span>
            Ciclo: <strong className="text-indigo-600">{estudianteActivo?.aula || 'Semestral San Marcos'}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleImprimir} 
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* MÉTRICAS SUPERIORES CON ARITMÉTICA EXACTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Ranking del Ciclo
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-slate-800">Puesto #{estudianteActivo?.puestoRanking || 1}</span>
            {/* Lo dejamos limpio, solo el puesto */}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200/50 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Puntaje Promedio</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">{promedioGeneralCalculado}</span>
              <span className="text-xs text-slate-500 font-medium">/ 20</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cursos en Riesgo</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-rose-600">
                {cursosEnRiesgo.length} {cursosEnRiesgo.length === 1 ? 'Curso' : 'Cursos'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
              <Sparkles className="w-4 h-4" /> Tutor IA
            </div>
            <p className="text-xs text-indigo-100 line-clamp-2 mt-1">
              Revisar sugerencias pedagógicas personalizadas para {estudiante.nombre ? estudiante.nombre.split(' ')[0] : 'el estudiante'}.
            </p>
          </div>
          <button
            type="button"
            onClick={onIrATutorIA}
            className="text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1 mt-2 transition cursor-pointer"
          >
            Ver diagnóstico completo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TABLA DE ASIGNATURAS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-8 overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between print:py-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 print:text-slate-900" />
            <h2 className="font-bold text-slate-800 text-base">Boleta de Rendimiento Académico</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium print:text-slate-600">
            Escala vigesimal (0 - 20) • Ponderación: Parcial (30%) + Simulacros (30%) + Final (40%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider print:bg-slate-100 print:text-slate-900">
                <th className="py-3 px-4 print:py-2 print:px-3">Asignatura</th>
                {/* ELIMINADO <th>DOCENTE</th> */}
                <th className="py-3 px-4 text-center print:py-2 print:px-2">Ex. Parcial (30%)</th>
                <th className="py-3 px-4 text-center print:py-2 print:px-2">Simulacros (30%)</th>
                <th className="py-3 px-4 text-center print:py-2 print:px-2">Ex. Final (40%)</th>
                <th className="py-3 px-4 text-center print:py-2 print:px-2">Promedio</th>
                <th className="py-3 px-4 text-center print:py-2 print:px-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm print:divide-slate-200">
              {estudiante.cursos.map((curso) => {
                const enRiesgo = curso.promedio < 13;
                return (
                  <tr key={curso.id} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                    <td className="py-3 px-4 font-semibold text-slate-800 print:py-2 print:px-3">{curso.nombre}</td>
                    {/* ELIMINADO <td>{curso.docente}</td> */}
                    <td className="py-3 px-4 text-center text-slate-600 font-mono text-xs print:py-2 print:px-2">{curso.parcial}</td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono text-xs print:py-2 print:px-2">{curso.tareas}</td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono text-xs print:py-2 print:px-2">{curso.final}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono print:py-2 print:px-2">
                      <span className={enRiesgo ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                        {curso.promedio.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center print:py-2 print:px-2">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enRiesgo
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {enRiesgo ? 'En Riesgo' : 'Aprobado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="hidden print:table-footer-group border-t-2 border-slate-900 text-xs font-bold text-slate-900">
              <tr>
                <td colSpan={4} className="py-3 px-3 text-right">PUNTAJE PROMEDIO GENERAL:</td>
                <td className="py-3 px-3 text-center text-sm">{promedioGeneralCalculado} / 20</td>
                <td className="py-3 px-3 text-center">
                  {Number(promedioGeneralCalculado) >= 13 ? 'APROBADO' : 'OBSERVADO'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECCIÓN DE FIRMAS PARA IMPRESIÓN */}
      <div className="hidden print:flex justify-between mt-12 text-xs font-bold text-slate-500 text-center">
        <div className="border-t border-slate-400 pt-2 w-48">
          Coordinación Académica
          <br />
          <span className="font-normal text-slate-500">AcadeSys Pre-U</span>
        </div>
        <div className="border-t border-slate-400 pt-2 w-48">
          Firma del Estudiante
          <br />
          <span className="font-normal text-slate-500">Conformidad de Resultados</span>
        </div>
      </div>

      {/* RECURSOS Y MATERIALES DE ESTUDIO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">Recursos y Materiales de Refuerzo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudiante.cursos.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors">
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
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
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