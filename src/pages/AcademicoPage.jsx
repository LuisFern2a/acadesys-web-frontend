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
  Users,
  Pencil,
  Trash2,
  Filter
} from 'lucide-react';
import { 
  obtenerAulas, 
  crearAula, 
  actualizarAula,
  eliminarAula,
  obtenerCursos, 
  crearCurso, 
  actualizarCurso,
  eliminarCurso,
  obtenerAsignacionesDocente, 
  crearAsignacionDocente,
  eliminarAsignacionDocente
} from '../services/api';

export default function AcademicoPage() {
  const [tabActiva, setTabActiva] = useState('asignaciones');
  const [aulas, setAulas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');

  // Modal y modo edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // Datos base de respaldo institucional
  const aulasBase = [
    { idAula: 1, nombre: 'Aula 101 - Ciencias', nivel: 'Preuniversitario', capacidad: 35 },
    { idAula: 2, nombre: 'Aula 102 - Letras', nivel: 'Preuniversitario', capacidad: 30 },
    { idAula: 3, nombre: '5to Grado B - Selección', nivel: 'Secundaria', capacidad: 32 },
    { idAula: 4, nombre: '3er Grado A', nivel: 'Primaria', capacidad: 28 }
  ];

  const cursosBase = [
    { idCurso: 1, nombre: 'Álgebra Superior', codigo: 'MAT-ALG', descripcion: 'Ecuaciones polinómicas, matrices y determinantes' },
    { idCurso: 2, nombre: 'Física Clásica', codigo: 'CTA-FIS', descripcion: 'Cinemática vectorial, dinámica y trabajo mecánico' },
    { idCurso: 3, nombre: 'Razonamiento Matemático', codigo: 'MAT-RM', descripcion: 'Lógica inductiva-deductiva y problemas de optimización' },
    { idCurso: 4, nombre: 'Geometría del Espacio', codigo: 'MAT-GEO', descripcion: 'Poliedros regulares, prismas y sólidos de revolución' },
    { idCurso: 5, nombre: 'Química Orgánica', codigo: 'CTA-QUI', descripcion: 'Hidrocarburos, grupos funcionales y reacciones orgánicas' }
  ];

  const asignacionesBase = [
    { idAsignacion: 1, docente: 'Carlos Mendoza', curso: 'Álgebra Superior', aula: 'Aula 101 - Ciencias', horas: 6 },
    { idAsignacion: 2, docente: 'María Flores', curso: 'Física Clásica', aula: 'Aula 101 - Ciencias', horas: 4 },
    { idAsignacion: 3, docente: 'Dante Quispe', curso: 'Razonamiento Matemático', aula: 'Aula 102 - Letras', horas: 5 }
  ];

  // Formularios
  const [formAula, setFormAula] = useState({ nombre: '', nivel: 'Secundaria', capacidad: 35 });
  const [formCurso, setFormCurso] = useState({ nombre: '', codigo: '', descripcion: '' });
  const [formAsig, setFormAsig] = useState({ docente: '', curso: '', aula: '', horas: 4 });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [dataAulas, dataCursos, dataAsig] = await Promise.all([
        obtenerAulas ? obtenerAulas().catch(() => null) : null,
        obtenerCursos ? obtenerCursos().catch(() => null) : null,
        obtenerAsignacionesDocente ? obtenerAsignacionesDocente().catch(() => null) : null
      ]);

      const listaAulas = (dataAulas && dataAulas.length > 0) ? dataAulas : aulasBase;
      const listaCursos = (dataCursos && dataCursos.length > 0) ? dataCursos : cursosBase;
      const listaAsig = (dataAsig && dataAsig.length > 0) ? dataAsig : asignacionesBase;

      setAulas(listaAulas);
      setCursos(listaCursos);
      setAsignaciones(listaAsig);

      if (listaCursos.length > 0 && listaAulas.length > 0) {
        setFormAsig({
          docente: 'Carlos Mendoza',
          curso: listaCursos[0].nombre,
          aula: listaAulas[0].nombre,
          horas: 4
        });
      }
    } catch (err) {
      console.warn('Cargando datos locales de contingencia:', err);
      setAulas(aulasBase);
      setCursos(cursosBase);
      setAsignaciones(asignacionesBase);
    }
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setFormAula({ nombre: '', nivel: 'Secundaria', capacidad: 35 });
    setFormCurso({ nombre: '', codigo: '', descripcion: '' });
    setFormAsig({
      docente: '',
      curso: cursos[0]?.nombre || 'Álgebra Superior',
      aula: aulas[0]?.nombre || 'Aula 101 - Ciencias',
      horas: 4
    });
    setModalAbierto(true);
  };

  const abrirEditarAula = (aula) => {
    setEditandoId(aula.idAula);
    setFormAula({ nombre: aula.nombre, nivel: aula.nivel, capacidad: aula.capacidad });
    setModalAbierto(true);
  };

  const abrirEditarCurso = (curso) => {
    setEditandoId(curso.idCurso);
    setFormCurso({ nombre: curso.nombre, codigo: curso.codigo, descripcion: curso.descripcion });
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (tabActiva === 'aulas') {
      if (!formAula.nombre.trim()) return;
      if (editandoId) {
        try {
          if (actualizarAula) await actualizarAula(editandoId, formAula);
        } catch (err) {
          console.warn('Actualización local de aula:', err);
        }
        setAulas(prev => prev.map(a => a.idAula === editandoId ? { ...a, ...formAula } : a));
      } else {
        const nueva = { ...formAula, idAula: Date.now() };
        try {
          if (crearAula) await crearAula(formAula);
        } catch (err) {
          console.warn('Creación local de aula:', err);
        }
        setAulas(prev => [...prev, nueva]);
      }
    } else if (tabActiva === 'cursos') {
      if (!formCurso.nombre.trim() || !formCurso.codigo.trim()) return;
      if (editandoId) {
        try {
          if (actualizarCurso) await actualizarCurso(editandoId, formCurso);
        } catch (err) {
          console.warn('Actualización local de curso:', err);
        }
        setCursos(prev => prev.map(c => c.idCurso === editandoId ? { ...c, ...formCurso } : c));
      } else {
        const nuevo = { ...formCurso, idCurso: Date.now() };
        try {
          if (crearCurso) await crearCurso(formCurso);
        } catch (err) {
          console.warn('Creación local de curso:', err);
        }
        setCursos(prev => [...prev, nuevo]);
      }
    } else {
      if (!formAsig.docente.trim()) return;
      const nueva = { ...formAsig, idAsignacion: Date.now() };
      try {
        if (crearAsignacionDocente) await crearAsignacionDocente(formAsig);
      } catch (err) {
        console.warn('Creación local de asignación:', err);
      }
      setAsignaciones(prev => [...prev, nueva]);
    }

    setModalAbierto(false);
  };

  const handleEliminarAula = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el aula "${nombre}"?`)) {
      try {
        if (eliminarAula) await eliminarAula(id);
      } catch (err) {
        console.warn('Eliminación local de aula:', err);
      }
      setAulas(prev => prev.filter(a => a.idAula !== id));
    }
  };

  const handleEliminarCurso = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el curso "${nombre}"?`)) {
      try {
        if (eliminarCurso) await eliminarCurso(id);
      } catch (err) {
        console.warn('Eliminación local de curso:', err);
      }
      setCursos(prev => prev.filter(c => c.idCurso !== id));
    }
  };

  const handleEliminarAsignacion = async (id, docente, curso) => {
    if (window.confirm(`¿Eliminar la carga de "${curso}" asignada a ${docente}?`)) {
      try {
        if (eliminarAsignacionDocente) await eliminarAsignacionDocente(id);
      } catch (err) {
        console.warn('Eliminación local de asignación:', err);
      }
      setAsignaciones(prev => prev.filter(a => a.idAsignacion !== id));
    }
  };

  // Filtros combinados
  const aulasFiltradas = aulas.filter(a => {
    const coincideTexto = (a.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                          (a.nivel || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideNivel = filtroNivel === 'todos' || a.nivel === filtroNivel;
    return coincideTexto && coincideNivel;
  });

  const cursosFiltrados = cursos.filter(c =>
    (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const asignacionesFiltradas = asignaciones.filter(a =>
    (a.docente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.curso || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.aula || '').toLowerCase().includes(busqueda.toLowerCase())
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
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión Académica</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Control de salones, plan de estudios y distribución de carga horaria docente
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition text-xs cursor-pointer"
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
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tabActiva === 'cursos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Cursos Oficiales ({cursos.length})
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por curso, docente, código o nivel..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 text-xs"
          />
        </div>

        {tabActiva === 'aulas' && (
          <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-500">Nivel:</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="todos">Todos los niveles</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Preuniversitario">Preuniversitario</option>
            </select>
          </div>
        )}
      </div>

      {/* TABLA ASIGNACIONES */}
      {tabActiva === 'asignaciones' && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6">Docente Titular</th>
                <th className="py-4 px-6">Asignatura</th>
                <th className="py-4 px-6">Aula Asignada</th>
                <th className="py-4 px-6">Carga Semanal</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {asignacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No se encontraron asignaciones con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                asignacionesFiltradas.map((asig) => (
                  <tr key={asig.idAsignacion} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                        {(asig.docente || 'DC').slice(0, 2).toUpperCase()}
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
                      <button
                        type="button"
                        title="Eliminar asignación"
                        onClick={() => handleEliminarAsignacion(asig.idAsignacion, asig.docente, asig.curso)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TARJETAS AULAS */}
      {tabActiva === 'aulas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {aulasFiltradas.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No se encontraron aulas con el filtro actual.
            </div>
          ) : (
            aulasFiltradas.map((aula) => (
              <div key={aula.idAula} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <School className="w-5 h-5" />
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Editar Aula"
                        onClick={() => abrirEditarAula(aula)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar Aula"
                        onClick={() => handleEliminarAula(aula.idAula, aula.nombre)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{aula.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{aula.nivel}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Capacidad:
                  </span>
                  <span className="font-semibold text-slate-700">{aula.capacidad} vacantes</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TARJETAS CURSOS */}
      {tabActiva === 'cursos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursosFiltrados.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No se encontraron cursos con el criterio ingresado.
            </div>
          ) : (
            cursosFiltrados.map((c) => (
              <div key={c.idCurso} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-indigo-600 rounded-md">
                      {c.codigo}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Editar Curso"
                        onClick={() => abrirEditarCurso(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar Curso"
                        onClick={() => handleEliminarCurso(c.idCurso, c.nombre)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{c.nombre}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{c.descripcion}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <span className="text-[11px] text-slate-400 font-medium">Plan Vigente</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {tabActiva === 'asignaciones' && 'Asignar Docente a Aula'}
                {tabActiva === 'aulas' && (editandoId ? 'Editar Aula' : 'Registrar Nueva Aula')}
                {tabActiva === 'cursos' && (editandoId ? 'Editar Curso' : 'Registrar Nuevo Curso')}
              </h3>
              <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Curso</label>
                    <select
                      value={formAsig.curso}
                      onChange={(e) => setFormAsig({ ...formAsig, curso: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white cursor-pointer"
                    >
                      {cursos.map(c => <option key={c.idCurso} value={c.nombre}>{c.nombre} ({c.codigo})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Aula Destino</label>
                    <select
                      value={formAsig.aula}
                      onChange={(e) => setFormAsig({ ...formAsig, aula: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white cursor-pointer"
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Educativo</label>
                    <select
                      value={formAula.nivel}
                      onChange={(e) => setFormAula({ ...formAula, nivel: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white cursor-pointer"
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Breve</label>
                    <textarea
                      rows="2"
                      placeholder="Identidades trigonométricas y geometría analítica"
                      value={formCurso.descripcion}
                      onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition cursor-pointer"
                >
                  {editandoId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}