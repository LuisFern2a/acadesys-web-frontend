import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  School, 
  Award, 
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { 
  obtenerDirectorioUsuarios,
  obtenerCiclosPublicos,
  obtenerPagosPorCiclo 
} from '../services/api';
import { esAlumno } from '../utils/roles';

export default function DashboardOverviewPage({ setActiveTab, user }) {
  const [cargando, setCargando] = useState(true);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalMorosos, setTotalMorosos] = useState(0);
  const [promedioGeneral, setPromedioGeneral] = useState('--');
  const [ciclos, setCiclos] = useState([]);

  useEffect(() => {
    async function cargarDatosReales() {
      try {
        setCargando(true);

        // 1. Cargar directorio mínimo (no sensible) y Ciclos
        const [resUsuarios, resCiclos] = await Promise.allSettled([
          obtenerDirectorioUsuarios ? obtenerDirectorioUsuarios() : Promise.resolve([]),
          obtenerCiclosPublicos ? obtenerCiclosPublicos() : Promise.resolve([])
        ]);

        const listUsuarios = resUsuarios.status === 'fulfilled' && Array.isArray(resUsuarios.value) ? resUsuarios.value : [];
        const listCiclos = resCiclos.status === 'fulfilled' && Array.isArray(resCiclos.value) ? resCiclos.value : [];

        // Filtro real de alumnos (perfil exacto, sin `includes`).
        const estudiantes = listUsuarios.filter((u) => esAlumno(u));
        setTotalEstudiantes(estudiantes.length);
        setCiclos(listCiclos);

        // 2. Métrica Institucional Global de Morosidad (Recorre todos los ciclos activos dinámicamente)
        let conteoMorososGlobal = 0;
        if (listCiclos.length > 0) {
          const promesasPagos = listCiclos.map(c => {
            const id = c.idCiclo ?? c.id;
            return obtenerPagosPorCiclo ? obtenerPagosPorCiclo(id).catch(() => []) : Promise.resolve([]);
          });

          const resultadosPagos = await Promise.all(promesasPagos);
          const mapaMorosos = new Set();

          resultadosPagos.forEach(listPagos => {
            if (Array.isArray(listPagos)) {
              listPagos.forEach(p => {
                const estado = String(p.estado || p.Estado || p.estadoPago || '').toLowerCase();
                if (['pendiente', 'vencido', 'moroso'].includes(estado)) {
                  mapaMorosos.add(p.idUsuario || p.IdUsuario || p.idAlumno || p.correo || p.alumno);
                }
              });
            }
          });

          conteoMorososGlobal = mapaMorosos.size;
        } else {
          // Sin ciclos activos, no existe una cartera morosa que consolidar.
          conteoMorososGlobal = 0;
        }
        setTotalMorosos(conteoMorososGlobal);

        // 3. Promedio Institucional Dinámico (vacío o cargado según respuesta del backend)
        setPromedioGeneral('--'); // Se mantiene sin registros hasta disponer de una fuente agregada real.

      } catch (err) {
        console.error('Error al cargar métricas del dashboard:', err);
      } finally {
        setCargando(false);
      }
    }

    cargarDatosReales();
  }, []);

  const kpis = [
    {
      titulo: 'Estudiantes Registrados',
      valor: cargando ? '...' : totalEstudiantes.toString(),
      icono: Users,
      tono: 'text-blue-600'
    },
    {
      titulo: 'Ciclos Académicos',
      valor: cargando ? '...' : ciclos.length.toString(),
      icono: School,
      tono: 'text-blue-600'
    },
    {
      titulo: 'Promedio Institucional',
      valor: cargando ? '...' : (promedioGeneral !== '--' ? `${promedioGeneral} / 20` : 'Sin registros'),
      icono: TrendingUp,
      tono: 'text-slate-500'
    },
    {
      titulo: 'Estudiantes Morosos',
      valor: cargando ? '...' : totalMorosos.toString(),
      icono: DollarSign,
      tono: 'text-rose-500'
    }
  ];

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
                    <span className="text-slate-500">Turno: {c.turno || c.Turno || 'General'}</span>
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

