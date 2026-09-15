import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarCheck, 
  Loader2, 
  BookOpen, 
  GraduationCap 
} from 'lucide-react';
import { generarDiagnosticoAcademico } from '../services/geminiService';

export default function TutorIAPage() {
  const [generando, setGenerando] = useState(false);
  const [diagnostico, setDiagnostico] = useState(null);

  // Datos simulados del estudiante y sus últimos simulacros
  const datosAlumno = {
    nombre: 'Luis Fernando Tóccas',
    codigo: 'ACAD-2026-755',
    grado: '5to de Secundaria - Grupo UNI / San Marcos',
    sede: 'Sede Central'
  };

  const historialSimulacros = [
    { curso: 'Álgebra', s1: 14, s2: 15, s3: 16, promedio: 15 },
    { curso: 'Geometría', s1: 12, s2: 14, s3: 13, promedio: 13 },
    { curso: 'Física', s1: 09, s2: 11, s3: 10, promedio: 10 },
    { curso: 'Química', s1: 11, s2: 12, s3: 12, promedio: 11.6 },
    { curso: 'Raz. Matemático', s1: 16, s2: 18, s3: 17, promedio: 17 }
  ];

  const handleSolicitarDiagnostico = async () => {
    setGenerando(true);
    try {
      const resultado = await generarDiagnosticoAcademico(datosAlumno, historialSimulacros);
      setDiagnostico(resultado);
    } catch (error) {
      console.error(error);
      alert('No se pudo generar el diagnóstico en este momento.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-sm">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Tutor IA - Diagnóstico Inteligente</h1>
              <p className="text-slate-500 text-sm">
                Análisis predictivo y recomendaciones personalizadas potenciadas por Google Gemini
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSolicitarDiagnostico}
          disabled={generando}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
        >
          {generando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analizando con Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generar Diagnóstico IA</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: TARJETA DEL ESTUDIANTE Y NOTAS DE SIMULACROS */}
        <div className="space-y-6">
          {/* PERFIL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{datosAlumno.nombre}</h3>
                <p className="text-xs text-slate-500">{datosAlumno.codigo}</p>
              </div>
            </div>
            <div className="text-xs space-y-1.5 text-slate-600 pt-3 border-t border-slate-100">
              <p><span className="font-semibold text-slate-700">Modalidad:</span> {datosAlumno.grado}</p>
              <p><span className="font-semibold text-slate-700">Sede:</span> {datosAlumno.sede}</p>
            </div>
          </div>

          {/* HISTORIAL DE SIMULACROS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Últimos 3 Simulacros Oficiales
            </h3>

            <div className="space-y-3.5">
              {historialSimulacros.map((item) => {
                const esCritico = item.promedio < 13;
                const porcentaje = (item.promedio / 20) * 100;

                return (
                  <div key={item.curso} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-700">{item.curso}</span>
                      <span className={`font-bold ${esCritico ? 'text-rose-600' : 'text-slate-700'}`}>
                        {item.promedio.toFixed(1)} / 20
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          esCritico ? 'bg-rose-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESULTADOS DEL DIAGNÓSTICO DEL TUTOR IA */}
        <div className="lg:col-span-2 space-y-6">
          {!diagnostico && !generando && (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Sin diagnóstico generado aún</h3>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                Presiona el botón superior para que el motor de IA analice las notas de los simulacros y genere sugerencias personalizadas de mejora.
              </p>
              <button
                type="button"
                onClick={handleSolicitarDiagnostico}
                className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
              >
                Ejecutar análisis ahora →
              </button>
            </div>
          )}

          {generando && (
            <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Procesando datos académicos</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Evaluando curvas de rendimiento en álgebra, ciencias y razonamiento...
              </p>
            </div>
          )}

          {diagnostico && !generando && (
            <div className="space-y-6 animate-fadeIn">
              {/* RESUMEN EJECUTIVO */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" /> Diagnóstico Sintético
                </div>
                <p className="text-sm leading-relaxed text-indigo-50">
                  {diagnostico.resumenGeneral}
                </p>
              </div>

              {/* CURSOS CRÍTICOS Y PLAN DE ACCIÓN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Áreas Críticas que Requieren Atención Inmediata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnostico.areasMejora.map((area, index) => (
                    <div key={index} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
                      <span className="text-xs font-bold text-amber-800 uppercase px-2 py-0.5 bg-amber-100/70 rounded-md">
                        {area.curso}
                      </span>
                      <p className="text-xs text-slate-700 mt-2 font-medium">{area.motivo}</p>
                      <p className="text-xs text-slate-500 mt-1.5 pt-2 border-t border-amber-200/40">
                        <span className="font-semibold text-slate-700">Estrategia:</span> {area.estrategia}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PUNTOS FUERTES Y PLAN SEMANAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FORTALEZAS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Fortalezas Académicas
                  </h3>
                  <ul className="space-y-2">
                    {diagnostico.puntosFuertes.map((f, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* PLAN DE ESTUDIO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    Plan de Estudio Sugerido
                  </h3>
                  <ul className="space-y-2">
                    {diagnostico.planEstudioRecomendado.map((plan, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="font-bold text-indigo-600">{idx + 1}.</span>
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}