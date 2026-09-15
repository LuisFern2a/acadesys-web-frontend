import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  School, 
  BookOpen, 
  UserCheck, 
  Plus, 
  Search, 
  Clock, 
  X, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { 
  obtenerAulas, 
  crearAula, 
  obtenerCursos, 
  crearCurso, 
  obtenerAsignacionesDocente, 
  crearAsignacionDocente 
} from '../services/api';

export default function AcademicoPage() {
  const [tabActiva, setTabActiva] = useState('asignaciones'); // 'asignaciones' | 'aulas' | 'cursos'
  const [aulas, setAulas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formularios para modales
  const [formAula, setFormAula] = useState({ nombre: '', nivel: 'Secundaria', capacidad: 35 });
  const [formCurso, setFormCurso] = useState({ nombre: '', codigo: '', descripcion: '' });
  const [formAsig, setFormAsig] = useState({ docente: '', curso: '', aula: '', horas: 4 });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const [dataAulas, dataCursos, dataAsig] = await Promise.all([
      obtenerAulas(),
      obtenerCursos(),
      obtenerAsignacionesDocente()
    ]);
    setAulas(dataAulas || []);
    setCursos(dataCursos || []);
    setAsignaciones(dataAsig || []);
    if (dataCursos?.length > 0 && dataAulas?.length > 0) {
      setFormAsig(prev => ({
        ...prev,
        curso: dataCursos[0].nombre,
        aula: dataAulas[0].nombre,
        docente: 'Carlos Mendoza'
      }));
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (tabActiva === 'aulas') {
      if (!formAula.nombre.trim()) return;
      await crearAula(formAula);
      setFormAula({ nombre: '', nivel: 'Secundaria', capacidad: 35 });
    } else if (tabActiva === 'cursos') {
      if (!formCurso.nombre.trim() || !formCurso.codigo.trim()) return;
      await crearCurso(formCurso);
      setFormCurso({ nombre: '', codigo: '', descripcion: '' });
    } else {
      if (!formAsig.docente.trim()) return;
      await crearAsignacionDocente(formAsig);
      setFormAsig({ docente: '', curso: cursos[0]?.nombre || '', aula: aulas[0]?.nombre || '', horas: 4 });
    }
    await cargarDatos();
    setModalAbierto(false);
  };

  const asignacionesFiltradas = asignaciones.filter(a => 
    a.docente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.curso?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.aula?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const aulasFiltradas = aulas.filter(a =>
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.nivel?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const cursosFiltrados = cursos.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestión Académica</h1>
              <p className="text-slate-500 text-sm">
                Control de salones, plan de estudios y distribución de carga horaria docente
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          {tabActiva === 'asignaciones' && 'Nueva Carga Docente'}
          {tabActiva === 'aulas' && 'Nueva Aula / Salón'}
          {tabActiva === 'cursos' && 'Nuevo Curso'}
        </button>
      </div>

      {/* PESTAÑAS */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => setTabActiva('asignaciones')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            tabActiva === 'asignaciones'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Carga Docente ({asignaciones.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('aulas')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            tabActiva === 'aulas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          Aulas y Salones ({aulas.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('cursos')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            tabActiva === 'cursos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Cursos Oficiales ({cursos.length})
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por curso, docente, código o nivel..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-700 text-sm"
        />
      </div>

      {/* VISTA: ASIGNACIONES */}
      {tabActiva === 'asignaciones' && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6">Docente Titular</th>
                <th className="py-4 px-6">Asignatura</th>
                <th className="py-4 px-6">Aula Asignada</th>
                <th className="py-4 px-6">Carga Semanal</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {asignacionesFiltradas.map((asig) => (
                <tr key={asig.idAsignacion} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                      {asig.docente?.slice(0, 2).toUpperCase()}
                    </div>
                    {asig.docente}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {asig.curso}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">{asig.aula}</td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {asig.horas} horas lectivas
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Asignado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA: AULAS */}
      {tabActiva === 'aulas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {aulasFiltradas.map((aula) => (
            <div key={aula.idAula} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <School className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-medium">
                  {aula.estado}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-base">{aula.nombre}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{aula.nivel}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Capacidad máxima:
                </span>
                <span className="font-semibold text-slate-700">{aula.capacidad} estudiantes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISTA: CURSOS */}
      {tabActiva === 'cursos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursosFiltrados.map((c) => (
            <div key={c.idCurso} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-indigo-600 rounded-md">
                    {c.codigo}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{c.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{c.descripcion}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <span className="text-[11px] text-slate-400 font-medium">Plan Vigente</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {tabActiva === 'asignaciones' && 'Asignar Docente a Aula'}
                {tabActiva === 'aulas' && 'Registrar Nueva Aula'}
                {tabActiva === 'cursos' && 'Registrar Nuevo Curso'}
              </h3>
              <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              {tabActiva === 'asignaciones' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Docente</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos Mendoza"
                      value={formAsig.docente}
                      onChange={(e) => setFormAsig({ ...formAsig, docente: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Curso</label>
                    <select
                      value={formAsig.curso}
                      onChange={(e) => setFormAsig({ ...formAsig, curso: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    >
                      {cursos.map(c => <option key={c.idCurso} value={c.nombre}>{c.nombre} ({c.codigo})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Aula Destino</label>
                    <select
                      value={formAsig.aula}
                      onChange={(e) => setFormAsig({ ...formAsig, aula: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    >
                      {aulas.map(a => <option key={a.idAula} value={a.nombre}>{a.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Horas Semanales</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formAsig.horas}
                      onChange={(e) => setFormAsig({ ...formAsig, horas: Number(e.target.value) })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                </>
              )}

              {tabActiva === 'aulas' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Aula 103 - Ciencias UNI"
                      value={formAula.nombre}
                      onChange={(e) => setFormAula({ ...formAula, nombre: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Educativo</label>
                    <select
                      value={formAula.nivel}
                      onChange={(e) => setFormAula({ ...formAula, nivel: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    >
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                      <option value="Preuniversitario">Preuniversitario</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidad Máxima</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={formAula.capacidad}
                      onChange={(e) => setFormAula({ ...formAula, capacidad: Number(e.target.value) })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                </>
              )}

              {tabActiva === 'cursos' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Curso</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Trigonometría Analítica"
                      value={formCurso.nombre}
                      onChange={(e) => setFormCurso({ ...formCurso, nombre: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código Único</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: MAT-TRI"
                      value={formCurso.codigo}
                      onChange={(e) => setFormCurso({ ...formCurso, codigo: e.target.value.toUpperCase() })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Breve</label>
                    <textarea
                      rows="2"
                      placeholder="Identidades trigonométricas y geometría analítica"
                      value={formCurso.descripcion}
                      onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}