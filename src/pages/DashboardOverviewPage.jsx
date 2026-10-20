import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  School, 
  Award, 
  ChevronRight,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  obtenerDashboardAdmin,
  obtenerDirectorioUsuarios,
  obtenerCiclosPublicos,
  mensajeErrorApi
} from '../services/api';
import { esAdmin, esAlumno } from '../utils/roles';

export default function DashboardOverviewPage({ setActiveTab, user }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState({
    estudiantes: 0,
    matriculasActivas: 0,
    ciclosActivos: 0,
    estudiantesMorosos: 0,
    promedioInstitucional: 0,
  });
  const [rendimientoPorCiclo, setRendimientoPorCiclo] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const usuarioEsAdmin = esAdmin(user);

  useEffect(() => {
    async function cargarDatosReales() {
      try {
        setCargando(true);
        setError('');

        if (usuarioEsAdmin) {
          const data = await obtenerDashboardAdmin();
          setResumen(data.resumen);
          setCiclos(data.ciclos);
          setRendimientoPorCiclo(data.rendimientoPorCiclo);
          return;
        }

        // Perfiles no administradores no tienen acceso al overview agregado.
        // Se muestran únicamente contadores verificables con endpoints permitidos.
        const [resUsuarios, resCiclos] = await Promise.allSettled([
          obtenerDirectorioUsuarios(),
          obtenerCiclosPublicos()
        ]);
        if (resUsuarios.status === 'rejected') throw resUsuarios.reason;
        if (resCiclos.status === 'rejected') throw resCiclos.reason;
        const listUsuarios = resUsuarios.status === 'fulfilled' && Array.isArray(resUsuarios.value)
          ? resUsuarios.value
          : [];
        const listCiclos = resCiclos.status === 'fulfilled' && Array.isArray(resCiclos.value)
          ? resCiclos.value
          : [];
        setResumen({
          estudiantes: listUsuarios.filter((u) => esAlumno(u)).length,
          matriculasActivas: 0,
          ciclosActivos: listCiclos.length,
          estudiantesMorosos: 0,
          promedioInstitucional: 0,
        });
        setCiclos(listCiclos);
        setRendimientoPorCiclo([]);
      } catch (err) {
        setError(mensajeErrorApi(err, 'No se pudieron cargar las métricas institucionales.'));
      } finally {
        setCargando(false);
      }
    }

    cargarDatosReales();
  }, [usuarioEsAdmin]);

  const kpis = [
    {
      titulo: 'Estudiantes Registrados',
      valor: cargando ? '...' : error ? '—' : resumen.estudiantes.toString(),
      icono: Users,
      tono: 'text-blue-600'
    },
    {
      titulo: 'Ciclos Activos',
      valor: cargando ? '...' : error ? '—' : resumen.ciclosActivos.toString(),
      icono: School,
      tono: 'text-blue-600'
    },
    {
      titulo: 'Promedio Institucional',
      valor: cargando ? '...' : error ? '—' : !usuarioEsAdmin ? 'Solo administración' : (rendimientoPorCiclo.some((item) => Number(item.evaluaciones) > 0) ? `${resumen.promedioInstitucional.toFixed(2)} / 20` : 'Sin registros'),
      icono: TrendingUp,
      tono: 'text-slate-500'
    },
    ...(usuarioEsAdmin ? [{
      titulo: 'Estudiantes Morosos',
      valor: cargando ? '...' : error ? '—' : resumen.estudiantesMorosos.toString(),
      icono: DollarSign,
      tono: 'text-rose-500'
    }] : [])
  ];

  const rendimientoPorId = new Map(
    rendimientoPorCiclo.map((item) => [String(item.idCiclo ?? item.IdCiclo), item])
  );

  return (
    <div className="p-6 sm:p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Panel General AcadeSys</h1>
          <p className="text-slate-500 text-sm mt-1">
            Métricas institucionales consolidadas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
          <span className="text-xs font-semibold text-slate-700">Consolidado Institucional</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icono;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{kpi.titulo}</span>
                <span className={`shrink-0 ${kpi.tono}`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">{kpi.valor}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="font-bold text-slate-900">Ciclos del Sistema</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('academico-ciclos')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 rounded"
            >
              <span>Gestionar Ciclos</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {ciclos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No hay ciclos registrados actualmente en la base de datos.
            </div>
          ) : (
            <div className="space-y-3">
              {ciclos.map((c, i) => (
                <div key={c.idCiclo || c.id || i} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block text-sm truncate">{c.nombre || c.Nombre}</span>
                    <span className="text-slate-500">{c.universidadObjetivo || 'Universidad por definir'} · {c.totalAlumnos} matriculados{rendimientoPorId.has(String(c.idCiclo ?? c.id)) ? ` · Promedio ${Number(rendimientoPorId.get(String(c.idCiclo ?? c.id)).promedio).toFixed(2)} / 20` : ''}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-slate-700 font-semibold rounded-md border border-slate-200 shrink-0">
                    {c.estado || 'Activo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-700" aria-hidden="true" />
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('calificaciones')}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 flex justify-between items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                Revisar Boletas y Ranking
              </button>
              {!esAlumno(user) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('academico')}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 flex justify-between items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Asignar Carga Docente
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

