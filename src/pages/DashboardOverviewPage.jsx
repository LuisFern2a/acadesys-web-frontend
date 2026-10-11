import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  School, 
  Sparkles, 
  BrainCircuit, 
  Award, 
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { 
  obtenerUsuarios, 
  obtenerCiclosPublicos, 
  obtenerPagosPorCiclo 
} from '../services/api';

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

        // 1. Cargar Usuarios y Ciclos
        const [resUsuarios, resCiclos] = await Promise.allSettled([
          obtenerUsuarios ? obtenerUsuarios() : Promise.resolve([]),
          obtenerCiclosPublicos ? obtenerCiclosPublicos() : Promise.resolve([])
        ]);

        const listUsuarios = resUsuarios.status === 'fulfilled' && Array.isArray(resUsuarios.value) ? resUsuarios.value : [];
        const listCiclos = resCiclos.status === 'fulfilled' && Array.isArray(resCiclos.value) ? resCiclos.value : [];

        // Filtro real de alumnos
        const estudiantes = listUsuarios.filter((u) => {
          const rol = String(u.rol || u.Rol || u.Perfil || u.NombrePerfil || u.perfil || '').trim().toLowerCase();
          return rol.includes('alumno') || rol.includes('estudiante');
        });
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
      color: 'indigo'
    },
    {
      titulo: 'Ciclos Académicos',
      valor: cargando ? '...' : ciclos.length.toString(),
      icono: School,
      color: 'emerald'
    },
    {
      titulo: 'Promedio Institucional',
      valor: cargando ? '...' : (promedioGeneral !== '--' ? `${promedioGeneral} / 20` : 'Sin registros'),
      icono: TrendingUp,
      color: 'violet'
    },
    {
      titulo: 'Estudiantes Morosos',
      valor: cargando ? '...' : totalMorosos.toString(),
      icono: DollarSign,
      color: 'rose'
    }
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel General AcadeSys</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Métricas institucionales consolidadas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-700">Consolidado Institucional</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icono;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
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
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-800">{kpi.valor}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-base">Ciclos del Sistema</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('academico-ciclos')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Gestionar Ciclos</span>
              <span>→</span>
            </button>
          </div>

          {ciclos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No hay ciclos registrados actualmente en la base de datos.
            </div>
          ) : (
            <div className="space-y-3">
              {ciclos.map((c, i) => (
                <div key={c.idCiclo || c.id || i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block text-sm">{c.nombre || c.Nombre}</span>
                    <span className="text-slate-400">Turno: {c.turno || c.Turno || 'General'}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 font-semibold rounded-lg border border-indigo-100">
                    {c.estado || 'Activo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" /> Diagnóstico Predictivo
              </div>
              <h3 className="font-bold text-base text-white mb-2">Tutor IA Institucional</h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Genera estrategias pedagógicas personalizadas a partir de los simulacros vigentes.
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
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition border border-transparent hover:border-indigo-100 flex justify-between items-center cursor-pointer"
              >
                Revisar Boletas y Ranking
              </button>
              {Number(user?.idPerfil) !== 4 && user?.rol?.toLowerCase() !== 'alumno' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('academico')}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition border border-transparent hover:border-indigo-100 flex justify-between items-center cursor-pointer"
                >
                  Asignar Carga Docente
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

