import React, { useState, useEffect } from 'react';
import { 
  BadgeAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  DollarSign, 
  Users, 
  GraduationCap, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { obtenerMonitoreoTutores } from '../services/api';

export default function MorosidadPage() {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', 'al dia', 'moroso'

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  })();

  const colorTema = sessionData.colorTema || '#4f46e5';

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await obtenerMonitoreoTutores(1);
      setDatos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error al cargar monitoreo:", err);
      setDatos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Métricas financieras y de aula
  const totalAlumnos = datos.length;
  const totalAlDia = datos.filter(d => (d.estadoPago || '').toLowerCase().includes('día') || (d.estadoPago || '').toLowerCase().includes('pagado')).length;
  const totalMorosos = datos.filter(d => (d.estadoPago || '').toLowerCase().includes('moroso')).length;
  const porcentajeMorosidad = totalAlumnos > 0 ? Math.round((totalMorosos / totalAlumnos) * 100) : 0;

  // Filtrado reactivo
  const alumnosFiltrados = datos.filter((item) => {
    const coincideTexto = 
      item.alumno.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      item.codigoUsuario.toLowerCase().includes(filtroTexto.toLowerCase());

    const estadoLower = (item.estadoPago || '').toLowerCase();
    const esAlDia = estadoLower.includes('día') || estadoLower.includes('pagado');
    const esMoroso = estadoLower.includes('moroso');

    if (filtroEstado === 'al dia') return coincideTexto && esAlDia;
    if (filtroEstado === 'moroso') return coincideTexto && esMoroso;
    return coincideTexto;
  });

  return (
    <div className="p-6 md:p-10 font-sans text-slate-100 space-y-8 bg-slate-950 min-h-screen">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <BadgeAlert className="w-3.5 h-3.5" />
            <span>HU-04: Panel de Tutoría y Control de Pensiones</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Semáforo de Morosidad y Rendimiento
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supervisa el estado financiero de tus alumnos y correlaciónalo con sus puntajes en simulacros.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer self-start md:self-auto border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Alumnos
            </span>
            <span className="text-2xl font-black text-white">{totalAlumnos}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Alumnos Al Día
            </span>
            <span className="text-2xl font-black text-emerald-400">{totalAlDia}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
              Alumnos Morosos ({porcentajeMorosidad}%)
            </span>
            <span className="text-2xl font-black text-rose-400">{totalMorosos}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por alumno o código..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filtroEstado === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({totalAlumnos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('al dia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filtroEstado === 'al dia' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400/80 hover:text-emerald-400'
            }`}
          >
            Al Día ({totalAlDia})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('moroso')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filtroEstado === 'moroso' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400/80 hover:text-rose-400'
            }`}
          >
            Morosos ({totalMorosos})
          </button>
        </div>
      </div>

      {/* Tabla del Semáforo */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">Sincronizando estado financiero y académico...</span>
          </div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No se encontraron alumnos con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Código Pre-U</th>
                  <th className="py-4 px-6">Estudiante</th>
                  <th className="py-4 px-6">Ciclo Activo</th>
                  <th className="py-4 px-6">Puntaje Prom.</th>
                  <th className="py-4 px-6">Estado / Semáforo</th>
                  <th className="py-4 px-6">Deuda Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {alumnosFiltrados.map((item) => {
                  const estadoLower = (item.estadoPago || '').toLowerCase();
                  const esAlDia = estadoLower.includes('día') || estadoLower.includes('pagado');

                  return (
                    <tr key={item.idAlumno} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-6 font-mono font-bold text-indigo-400">
                        {item.codigoUsuario}
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {item.alumno}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {item.ciclo}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-mono font-bold ${
                          item.puntajeSimulacro >= 14 ? 'text-emerald-400' : 
                          item.puntajeSimulacro >= 11 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {item.puntajeSimulacro.toFixed(1)} / 20.0
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {esAlDia ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Al Día
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Moroso
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold">
                        {esAlDia ? (
                          <span className="text-slate-500">S/ 0.00</span>
                        ) : (
                          <span className="text-rose-400">S/ {item.montoPendiente.toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}