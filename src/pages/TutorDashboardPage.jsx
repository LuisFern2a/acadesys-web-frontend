import React from 'react';
import {
  Users,
  CreditCard,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function TutorDashboardPage({ setActiveTab }) {

  // Datos visuales de prueba.
  // Posteriormente pueden reemplazarse por datos reales del backend.
  const alumnos = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      aula: 'Aula 101',
      promedio: 17.2,
      estadoPago: 'Pagado'
    },
    {
      id: 2,
      nombre: 'María López',
      aula: 'Aula 101',
      promedio: 14.6,
      estadoPago: 'Moroso'
    },
    {
      id: 3,
      nombre: 'Carlos Torres',
      aula: 'Aula 102',
      promedio: 16.4,
      estadoPago: 'Pagado'
    },
    {
      id: 4,
      nombre: 'Ana García',
      aula: 'Aula 102',
      promedio: 12.8,
      estadoPago: 'Moroso'
    },
    {
      id: 5,
      nombre: 'Luis Sánchez',
      aula: 'Aula 103',
      promedio: 15.9,
      estadoPago: 'Pagado'
    }
  ];

  const totalAlumnos = alumnos.length;

  const totalPagados = alumnos.filter(
    alumno => alumno.estadoPago === 'Pagado'
  ).length;

  const totalMorosos = alumnos.filter(
    alumno => alumno.estadoPago === 'Moroso'
  ).length;

  const promedioGeneral =
    alumnos.reduce((suma, alumno) => suma + alumno.promedio, 0) /
    alumnos.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full">

      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-100">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Dashboard del Tutor
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Seguimiento académico y financiero de tus alumnos
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('tutor-ia')}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
        >
          <GraduationCap className="w-4 h-4" />
          Abrir Tutor IA
        </button>

      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        {/* ALUMNOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Alumnos
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-2">
                {totalAlumnos}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Registrados en tus aulas
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>

          </div>
        </div>

        {/* PAGADOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Pagados
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-2">
                {totalPagados}
              </p>

              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                Al día
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>

          </div>
        </div>

        {/* MOROSOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Morosos
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-2">
                {totalMorosos}
              </p>

              <div className="flex items-center gap-1 mt-1 text-xs text-rose-600 font-semibold">
                <ArrowDownRight className="w-3 h-3" />
                Requieren seguimiento
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50">
              <CreditCard className="w-5 h-5 text-rose-600" />
            </div>

          </div>
        </div>

        {/* PROMEDIO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Promedio general
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-2">
                {promedioGeneral.toFixed(1)}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Escala vigesimal
              </p>
            </div>

            <div className="p-3 rounded-xl bg-violet-50">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>

          </div>
        </div>

      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 sm:p-6 border-b border-slate-200">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Seguimiento de Alumnos
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Estado académico y financiero de tus estudiantes
              </p>
            </div>

            <span className="text-xs text-slate-400">
              {totalAlumnos} alumnos
            </span>

          </div>

        </div>

        {/* TABLA RESPONSIVE */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[720px]">

            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Alumno
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Aula
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Promedio
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado de Pago
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {alumnos.map((alumno) => (

                <tr
                  key={alumno.id}
                  className="hover:bg-slate-50 transition"
                >

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {alumno.nombre
                          .split(' ')
                          .map(parte => parte[0])
                          .slice(0, 2)
                          .join('')}
                      </div>

                      <span className="font-semibold text-slate-800 text-sm">
                        {alumno.nombre}
                      </span>

                    </div>

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {alumno.aula}
                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`font-bold text-sm ${
                        alumno.promedio >= 16
                          ? 'text-emerald-600'
                          : alumno.promedio >= 13
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {alumno.promedio.toFixed(1)} / 20
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={
                        alumno.estadoPago === 'Moroso'
                          ? 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white'
                          : 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white'
                      }
                    >
                      {alumno.estadoPago}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}