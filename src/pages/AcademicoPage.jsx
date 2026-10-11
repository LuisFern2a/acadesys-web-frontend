
import React, { useState, useEffect } from 'react';
import {
  Layers,
  School,
  BookOpen,
  UserCheck,
  Plus,
  Search,
  Clock,
  CalendarClock,
  X,
  Users,
  Pencil,
  Trash2,
  Filter,
  GraduationCap
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
  eliminarAsignacionDocente,
  obtenerUsuarios,
  obtenerCiclosPublicos,
  obtenerCiclosAdmin,
  obtenerDetalleCicloAdmin,
  crearCicloAdmin,
  actualizarCicloAdmin,
  eliminarCicloAdmin,
  obtenerHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario
} from '../services/api';
function CampoCiclo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {React.cloneElement(children, {
        className: `${children.props.className || ''} w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100`
      })}
    </label>
  );
}
export default function AcademicoPage({ vistaInicial = 'asignaciones' }) {
  const [tabActiva, setTabActiva] = useState(vistaInicial);
  useEffect(() => {
    setTabActiva(vistaInicial);
  }, [vistaInicial]);
  const [aulas, setAulas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [errorDatos, setErrorDatos] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  // Modal y modo edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [pasoCiclo, setPasoCiclo] = useState(1);
  const [errorCiclo, setErrorCiclo] = useState('');
  const [guardandoCiclo, setGuardandoCiclo] = useState(false);
  // Formularios
  const [formAula, setFormAula] = useState({ nombre: '', nivel: 'Preuniversitario', capacidad: 35 });
  const [formCurso, setFormCurso] = useState({ nombre: '', codigo: '', descripcion: '' });
  const [formAsig, setFormAsig] = useState({ idUsuario: '', idCiclo: '', idCurso: '', horas: 4 });
  const [formCiclo, setFormCiclo] = useState({
    tipo: 'Anual',
    universidadObjetivo: 'UNMSM',
    modalidad: 'Presencial',
    periodo: String(new Date().getFullYear()),
    nombre: '',
    turno: 'Mañana',
    horario: '08:00 - 13:00',
    fechaInicio: '',
    fechaFin: '',
    capacidad: 100,
    precio: '',
    diasClase: 'Lunes a Viernes',
    prefijoCodigo: '',
    publicar: false,
    cursosSeleccionados: []
  });
  const [formTurno, setFormTurno] = useState({
    idCiclo: '',
    idCurso: '',
    diaNumero: 1,
    diaSemana: 'Lunes',
    horaInicio: '08:00',
    horaFin: '09:00',
    orden: 1
  });
  useEffect(() => {
    cargarDatos();
  }, []);
  const cargarDatos = async () => {
    setErrorDatos('');
    const [aulasRes, cursosRes, asignacionesRes, ciclosRes, usuariosRes, horariosRes] = await Promise.allSettled([
      obtenerAulas(),
      obtenerCursos(),
      obtenerAsignacionesDocente(),
      obtenerCiclosAdmin().catch(() => obtenerCiclosPublicos()),
      obtenerUsuarios(),
      obtenerHorarios(),
    ]);
    const errores = [];
    const valor = (resultado, nombre) => {
      if (resultado.status === 'fulfilled') return resultado.value;
      errores.push(`${nombre}: ${resultado.reason?.message || 'error de conexión'}`);
      return [];
    };
    const aulasRaw = valor(aulasRes, 'Aulas');
    const cursosRaw = valor(cursosRes, 'Cursos');
    const asignacionesRaw = valor(asignacionesRes, 'Asignaciones');
    const ciclosRaw = valor(ciclosRes, 'Ciclos');
    const usuariosRaw = valor(usuariosRes, 'Usuarios');
    const horariosRaw = valor(horariosRes, 'Horarios');
    const listaAulas = (Array.isArray(aulasRaw) ? aulasRaw : []).map((a) => ({
      ...a,
      idAula: Number(a.idAula ?? a.IdAula),
      nombre: a.nombre ?? a.Nombre ?? '',
      nivel: a.nivel ?? a.Nivel ?? 'Preuniversitario',
      capacidad: Number(a.capacidad ?? a.Capacidad ?? 35),
    }));
    const listaCursos = (Array.isArray(cursosRaw) ? cursosRaw : []).map((c) => ({
      ...c,
      idCurso: Number(c.idCurso ?? c.IdCurso),
      nombre: c.nombre ?? c.Nombre ?? '',
      codigo: c.codigo ?? c.Codigo ?? '',
      descripcion: c.descripcion ?? c.Descripcion ?? '',
    }));
    const listaCiclos = (Array.isArray(ciclosRaw) ? ciclosRaw : []).map((c) => ({
      ...c,
      idCiclo: Number(c.idCiclo ?? c.IdCiclo),
      nombre: c.nombre ?? c.Nombre ?? '',
      turno: c.turno ?? c.Turno ?? '',
      horario: c.horario ?? c.Horario ?? '',
      capacidad: Math.min(100, Number(c.capacidad ?? c.Capacidad ?? 100) || 100),
      universidadObjetivo: c.universidadObjetivo ?? c.UniversidadObjetivo ?? '',
      diasClase: c.diasClase ?? c.DiasClase ?? '',
      fechaInicio: c.fechaInicio ?? c.FechaInicio ?? null,
      fechaFin: c.fechaFin ?? c.FechaFin ?? null,
      precio: Number(c.precio ?? c.Precio ?? 0),
      prefijoCodigo: c.prefijoCodigo ?? c.PrefijoCodigo ?? '',
      publicar: Number(c.estadoRegistro ?? c.EstadoRegistro ?? 0) === 1,
      estado: Number(c.estadoRegistro ?? c.EstadoRegistro ?? 0) === 1 ? 'Activo' : 'Cerrado',
      totalAlumnos: Number(c.totalAlumnos ?? c.TotalAlumnos ?? 0),
      totalCursos: Number(c.totalCursos ?? c.TotalCursos ?? 0),
      alumnos: Number(c.totalAlumnos ?? c.TotalAlumnos ?? 0),
      cursos: Number(c.totalCursos ?? c.TotalCursos ?? 0),
    }));
    const listaDocentes = (Array.isArray(usuariosRaw) ? usuariosRaw : []).filter((u) => {
      const perfil = String(u.Perfil ?? u.NombrePerfil ?? u.perfil ?? '').toLowerCase();
      return perfil.includes('docente') || perfil.includes('tutor');
    });
    setAulas(listaAulas);
    setCursos(listaCursos);
    setAsignaciones(Array.isArray(asignacionesRaw) ? asignacionesRaw : []);
    setCiclos(listaCiclos);
    setUsuarios(listaDocentes);
    setTurnos(Array.isArray(horariosRaw) ? horariosRaw : []);
    setErrorDatos(errores.join(' | '));
    setFormAsig((prev) => {
      const userId = String(prev.idUsuario || '');
      const cycleId = String(prev.idCiclo || '');
      const courseId = String(prev.idCurso || '');
      return {
        ...prev,
        idUsuario: listaDocentes.some((u) => String(u.IdUsuario ?? u.idUsuario) === userId)
          ? userId : String(listaDocentes[0]?.IdUsuario ?? listaDocentes[0]?.idUsuario ?? ''),
        idCiclo: listaCiclos.some((c) => String(c.idCiclo) === cycleId)
          ? cycleId : String(listaCiclos[0]?.idCiclo ?? ''),
        idCurso: listaCursos.some((c) => String(c.idCurso) === courseId)
          ? courseId : String(listaCursos[0]?.idCurso ?? ''),
      };
    });
  };
  const abrirCrear = () => {
    setEditandoId(null);
    setFormAula({ nombre: '', nivel: 'Preuniversitario', capacidad: 35 });
    setFormCurso({ nombre: '', codigo: '', descripcion: '' });
    setFormAsig({
      idUsuario: String(usuarios[0]?.IdUsuario ?? usuarios[0]?.idUsuario ?? ''),
      idCiclo: String(ciclos[0]?.idCiclo ?? ''),
      idCurso: String(cursos[0]?.idCurso ?? ''),
      horas: 4,
    });
    setFormCiclo({
      tipo: 'Anual',
      universidadObjetivo: 'UNMSM',
      modalidad: 'Presencial',
      periodo: String(new Date().getFullYear()),
      nombre: '',
      turno: 'Mañana',
      horario: '08:00 - 13:00',
      fechaInicio: '',
      fechaFin: '',
      capacidad: 100,
      precio: '',
      diasClase: 'Lunes a Viernes',
      prefijoCodigo: '',
      publicar: false,
      cursosSeleccionados: []
    });
    setPasoCiclo(1);
    setErrorCiclo('');
    setFormTurno({
      idCiclo: String(ciclos[0]?.idCiclo ?? ''),
      idCurso: String(cursos[0]?.idCurso ?? ''),
      diaNumero: 1,
      diaSemana: 'Lunes',
      horaInicio: '08:00',
      horaFin: '09:00',
      orden: 1
    });
    setModalAbierto(true);
  };
  const abrirEditarAula = (aula) => {
    setEditandoId(aula.idAula ?? aula.IdAula);
    setFormAula({
      nombre: aula.nombre ?? aula.Nombre,
      nivel: 'Preuniversitario',
      capacidad: Number(aula.capacidad ?? aula.Capacidad ?? 35)
    });
    setModalAbierto(true);
  };
  const abrirEditarCurso = (curso) => {
    setEditandoId(curso.idCurso ?? curso.IdCurso);
    setFormCurso({ nombre: curso.nombre ?? curso.Nombre, codigo: curso.codigo ?? curso.Codigo, descripcion: curso.descripcion ?? curso.Descripcion ?? '' });
    setModalAbierto(true);
  };
  const abrirEditarCiclo = async (ciclo) => {
    setEditandoId(ciclo.idCiclo);
    setErrorCiclo('');
    let cursosSeleccionados = [];
    try {
      const detalle = await obtenerDetalleCicloAdmin(ciclo.idCiclo);
      cursosSeleccionados = (detalle.cursos || [])
        .map((curso) => Number(curso.IdCurso ?? curso.idCurso))
        .filter((id) => Number.isInteger(id) && id > 0);
    } catch (error) {
      setErrorCiclo(error.message || 'No se pudo cargar la oferta de cursos de este ciclo.');
    }
    setFormCiclo({
      tipo: ciclo.nombre?.includes('Semestral') ? 'Semestral' : ciclo.nombre?.includes('Intensivo') ? 'Intensivo' : ciclo.nombre?.includes('Repaso') ? 'Repaso' : 'Anual',
      universidadObjetivo: ciclo.universidadObjetivo || 'UNMSM',
      modalidad: 'Presencial',
      periodo: String(new Date(ciclo.fechaInicio || Date.now()).getFullYear()),
      nombre: ciclo.nombre || '',
      turno: ciclo.turno || 'Mañana',
      horario: ciclo.horario || '08:00 - 13:00',
      fechaInicio: String(ciclo.fechaInicio || '').slice(0, 10),
      fechaFin: String(ciclo.fechaFin || '').slice(0, 10),
      capacidad: Math.min(100, Number(ciclo.capacidad || 100)),
      precio: Number(ciclo.precio || 0),
      diasClase: ciclo.diasClase || 'Lunes a Viernes',
      prefijoCodigo: ciclo.prefijoCodigo || '',
      publicar: Boolean(ciclo.publicar),
      cursosSeleccionados
    });
    setPasoCiclo(1);
    setModalAbierto(true);
  };
  const abrirEditarTurno = (turno) => {
    setEditandoId(turno.idHorario);
    setFormTurno({
      idCiclo: String(turno.idCiclo ?? ''),
      idCurso: String(turno.idCurso ?? ''),
      diaNumero: Number(turno.diaNumero ?? 1),
      diaSemana: turno.diaSemana ?? 'Lunes',
      horaInicio: String(turno.horaInicio ?? '').slice(0, 5),
      horaFin: String(turno.horaFin ?? '').slice(0, 5),
      orden: Number(turno.orden ?? 1)
    });
    setModalAbierto(true);
  };
  const NOMBRE_MINIMO = 3;
  const nombreValido = (valor) => {
    const limpio = String(valor || '').trim();
    return limpio.length >= NOMBRE_MINIMO && /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .'-]+$/.test(limpio);
  };
  const codigoCursoValido = (valor) => {
    const limpio = String(valor || '').trim();
    return limpio.length >= 2 && /^[A-Z0-9-]+$/.test(limpio);
  };
  const formularioActualValido = (() => {
    if (tabActiva === 'cursos') return nombreValido(formCurso.nombre) && codigoCursoValido(formCurso.codigo);
    if (tabActiva === 'aulas') return nombreValido(formAula.nombre);
    if (tabActiva === 'asignaciones') return Boolean(formAsig.idUsuario && formAsig.idCiclo && formAsig.idCurso && Number(formAsig.horas) >= 1);
    if (tabActiva === 'turnos') return Boolean(
      formTurno.idCiclo &&
      formTurno.idCurso &&
      Number(formTurno.diaNumero) >= 1 &&
      Number(formTurno.diaNumero) <= 7 &&
      formTurno.diaSemana &&
      formTurno.horaInicio &&
      formTurno.horaFin &&
      formTurno.horaInicio < formTurno.horaFin &&
      Number(formTurno.orden) >= 1 &&
      Number(formTurno.orden) <= 100
    );
    return true;
  })();
  const handleGuardar = async (e) => {
    e.preventDefault();
    setErrorDatos('');
    try {
      if (tabActiva === 'aulas') {
        if (!nombreValido(formAula.nombre)) throw new Error('Ingresa un nombre válido para el aula.');
        if (!Number.isInteger(Number(formAula.capacidad)) || Number(formAula.capacidad) < 1 || Number(formAula.capacidad) > 500) {
          throw new Error('La capacidad del aula debe estar entre 1 y 500.');
        }
        const payload = { ...formAula, nombre: formAula.nombre.trim(), capacidad: Number(formAula.capacidad) };
        if (editandoId) await actualizarAula(editandoId, payload);
        else await crearAula(payload);
      } else if (tabActiva === 'cursos') {
        if (!nombreValido(formCurso.nombre) || !codigoCursoValido(formCurso.codigo)) {
          throw new Error('Revisa el nombre y el código del curso.');
        }
        const payload = { ...formCurso, nombre: formCurso.nombre.trim(), codigo: formCurso.codigo.trim().toUpperCase() };
        if (editandoId) await actualizarCurso(editandoId, payload);
        else await crearCurso(payload);
      } else if (tabActiva === 'asignaciones') {
        if (!formularioActualValido) throw new Error('Selecciona un docente, ciclo y curso, e indica las horas semanales.');
        await crearAsignacionDocente({
          idUsuario: Number(formAsig.idUsuario),
          idCiclo: Number(formAsig.idCiclo),
          idCurso: Number(formAsig.idCurso),
          horas: Number(formAsig.horas),
        });
      } else if (tabActiva === 'turnos') {
        if (!formularioActualValido) throw new Error('Completa correctamente todos los datos del horario.');
        const payload = {
          idCiclo: Number(formTurno.idCiclo),
          idCurso: Number(formTurno.idCurso),
          diaNumero: Number(formTurno.diaNumero),
          diaSemana: formTurno.diaSemana,
          horaInicio: formTurno.horaInicio,
          horaFin: formTurno.horaFin,
          orden: Number(formTurno.orden)
        };
        if (editandoId) await actualizarHorario(editandoId, payload);
        else await crearHorario(payload);
      } else {
        throw new Error('No hay una operación de guardado disponible para este módulo.');
      }
      await cargarDatos();
      setModalAbierto(false);
      setEditandoId(null);
    } catch (err) {
      window.alert(err?.message || 'No se pudo guardar. No se modificó la lista local.');
    }
  };
  const handleEliminarAula = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar el aula "${nombre}"?`)) return;
    try {
      await eliminarAula(id);
      await cargarDatos();
    } catch (err) {
      window.alert(err?.message || 'No se pudo desactivar el aula.');
    }
  };
  const handleEliminarCurso = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar el curso "${nombre}"?`)) return;
    try {
      await eliminarCurso(id);
      await cargarDatos();
    } catch (err) {
      window.alert(err?.message || 'No se pudo desactivar el curso.');
    }
  };
  const handleEliminarAsignacion = async (id, docente, curso) => {
    if (!window.confirm(`¿Desactivar la carga de "${curso}" asignada a ${docente}?`)) return;
    try {
      await eliminarAsignacionDocente(id);
      await cargarDatos();
    } catch (err) {
      window.alert(err?.message || 'No se pudo desactivar la asignación.');
    }
  };
  const handleEliminarCiclo = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el ciclo "${nombre}"?`)) return;
    try {
      await eliminarCicloAdmin(id);
      setCiclos((prev) => prev.filter((ciclo) => ciclo.idCiclo !== id));
    } catch (err) {
      window.alert(err?.message || 'No se pudo eliminar el ciclo.');
    }
  };
  const handleEliminarTurno = async (id, descripcion) => {
    if (!window.confirm(`¿Desactivar el horario "${descripcion}"?`)) return;
    try {
      await eliminarHorario(id);
      await cargarDatos();
    } catch (err) {
      window.alert(err?.message || 'No se pudo desactivar el horario.');
    }
  };
  const pasosCiclo = ['Identidad', 'Nombre', 'Fechas y capacidad', 'Oferta', 'Horarios', 'Revisión'];
  const validarPasoCiclo = (paso) => {
    if (paso === 1) {
      if (!formCiclo.tipo || !formCiclo.universidadObjetivo || !formCiclo.modalidad || !/^\d{4}$/.test(formCiclo.periodo)) {
        return 'Completa correctamente la identidad académica.';
      }
    }
    if (paso === 2) {
      const nombre = formCiclo.nombre.trim();
      if (nombre.length < 10 || nombre.length > 100) return 'El nombre del ciclo debe tener entre 10 y 100 caracteres.';
    }
    if (paso === 3) {
      if (!formCiclo.fechaInicio || !formCiclo.fechaFin) return 'Completa las fechas del ciclo.';
      if (new Date(formCiclo.fechaFin) <= new Date(formCiclo.fechaInicio)) return 'La fecha final debe ser posterior a la fecha de inicio.';
      if (!Number.isInteger(Number(formCiclo.capacidad)) || Number(formCiclo.capacidad) < 1 || Number(formCiclo.capacidad) > 100) return 'La capacidad del ciclo debe estar entre 1 y 100 alumnos.';
      if (formCiclo.precio === '' || !Number.isFinite(Number(formCiclo.precio)) || Number(formCiclo.precio) < 0 || Number(formCiclo.precio) > 9999.99) return 'El precio ingresado no es válido.';
    }
    if (paso === 4 && cursos.length > 0 && formCiclo.cursosSeleccionados.length === 0) {
      return 'Selecciona al menos un curso para continuar.';
    }
    if (paso === 5 && (!formCiclo.turno || !formCiclo.horario.trim() || !formCiclo.diasClase.trim())) {
      return 'Completa turno, horario y días de clase.';
    }
    return '';
  };
  const checklistPublicacion = [
    { texto: 'Identidad académica completa', ok: !validarPasoCiclo(1) },
    { texto: 'Nombre válido', ok: !validarPasoCiclo(2) },
    { texto: 'Fechas, capacidad y precio válidos', ok: !validarPasoCiclo(3) },
    { texto: 'Oferta académica con cursos', ok: formCiclo.cursosSeleccionados.length > 0 },
    { texto: 'Turno, horario y días de clase definidos', ok: !validarPasoCiclo(5) }
  ];
  const puedePublicarCiclo = checklistPublicacion.every((requisito) => requisito.ok);
  const siguientePasoCiclo = () => {
    const error = validarPasoCiclo(pasoCiclo);
    if (error) {
      setErrorCiclo(error);
      return;
    }
    setErrorCiclo('');
    setPasoCiclo((prev) => Math.min(prev + 1, 6));
  };
  const toggleCursoCiclo = (idCurso) => {
    setFormCiclo((prev) => ({
      ...prev,
      cursosSeleccionados: prev.cursosSeleccionados.includes(idCurso)
        ? prev.cursosSeleccionados.filter((id) => id !== idCurso)
        : [...prev.cursosSeleccionados, idCurso]
    }));
    setErrorCiclo('');
  };
  const guardarCiclo = async () => {
    for (let paso = 1; paso <= 5; paso += 1) {
      const error = validarPasoCiclo(paso);
      if (error) {
        setPasoCiclo(paso);
        setErrorCiclo(error);
        return;
      }
    }
    if (formCiclo.publicar && !puedePublicarCiclo) {
      setPasoCiclo(6);
      setErrorCiclo('No se puede publicar el ciclo mientras existan requisitos críticos pendientes.');
      return;
    }
    const payload = {
      nombre: formCiclo.nombre.trim(),
      universidadObjetivo: formCiclo.universidadObjetivo,
      turno: formCiclo.turno,
      horario: formCiclo.horario.trim(),
      fechaInicio: formCiclo.fechaInicio,
      fechaFin: formCiclo.fechaFin,
      capacidad: Number(formCiclo.capacidad),
      cursosSeleccionados: formCiclo.cursosSeleccionados.map(Number),
      precio: Number(formCiclo.precio),
      diasClase: formCiclo.diasClase.trim(),
      prefijoCodigo: formCiclo.prefijoCodigo.trim() || formCiclo.universidadObjetivo.slice(0, 4).toUpperCase(),
      publicar: Boolean(formCiclo.publicar)
    };
    try {
      setGuardandoCiclo(true);
      setErrorCiclo('');
      if (editandoId) await actualizarCicloAdmin(editandoId, payload);
      else await crearCicloAdmin(payload);
      await cargarDatos();
      setModalAbierto(false);
      setEditandoId(null);
    } catch (err) {
      setErrorCiclo(err?.message || 'No se pudo guardar el ciclo.');
    } finally {
      setGuardandoCiclo(false);
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
    (a.ciclo || '').toLowerCase().includes(busqueda.toLowerCase())
  );
  const ciclosFiltrados = ciclos.filter((ciclo) =>
    (ciclo.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (ciclo.turno || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (ciclo.horario || '').toLowerCase().includes(busqueda.toLowerCase())
  );
  const turnosFiltrados = turnos.filter((turno) =>
    (turno.ciclo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (turno.curso || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (turno.diaSemana || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (turno.horaInicio || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (turno.horaFin || '').toLowerCase().includes(busqueda.toLowerCase())
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
              <p className="text-slate-600 text-sm mt-0.5">
                Organiza ciclos, cursos, horarios y asignaciones docentes de la academia
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
          {tabActiva === 'aulas' && 'Nueva Aula'}
          {tabActiva === 'cursos' && 'Nuevo Curso'}
          {tabActiva === 'ciclos' && 'Nuevo Ciclo'}
          {tabActiva === 'turnos' && 'Nuevo Horario'}
        </button>
      </div>
      {errorDatos && (
        <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          No todos los datos pudieron cargarse desde el backend: {errorDatos}
        </div>
      )}
      {/* PESTAÑAS */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => setTabActiva('ciclos')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tabActiva === 'ciclos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Ciclos ({ciclos.length})
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('turnos')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tabActiva === 'turnos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Horarios ({turnos.length})
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('asignaciones')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tabActiva === 'asignaciones'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Carga Docente ({asignaciones.length})
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('cursos')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tabActiva === 'cursos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Cursos Académicos ({cursos.length})
        </button>
      </div>
      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ciclo, curso, docente o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 text-xs"
          />
        </div>
        {tabActiva === 'aulas' && (
          <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Programa:</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="todos">Todos los programas</option>
              <option value="Preuniversitario">Preuniversitario</option>
            </select>
          </div>
        )}
      </div>
      {/* CICLOS */}
      {tabActiva === 'ciclos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {ciclosFiltrados.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 py-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-base font-bold text-slate-800">No hay ciclos disponibles</p>
              <p className="text-sm text-slate-600 mt-1">No existen ciclos que coincidan con la búsqueda actual.</p>
            </div>
          ) : (
            ciclosFiltrados.map((ciclo) => {
              const capacidad = Math.min(100, Number(ciclo.capacidad || 100));
              const totalAlumnos = Number(ciclo.totalAlumnos ?? ciclo.alumnos ?? 0);
              const vacantes = Math.max(capacidad - totalAlumnos, 0);
              return (
                <div key={ciclo.idCiclo} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${ciclo.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {ciclo.estado}
                      </span>
                      <button type="button" title="Editar ciclo" onClick={() => abrirEditarCiclo(ciclo)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Eliminar ciclo" onClick={() => handleEliminarCiclo(ciclo.idCiclo, ciclo.nombre)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-4">{ciclo.nombre}</h3>
                  <div className="space-y-2.5 mt-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between"><span>Turno</span><strong className="text-slate-800">{ciclo.turno}</strong></div>
                    <div className="flex items-center justify-between"><span>Horario</span><strong className="text-slate-800">{ciclo.horario}</strong></div>
                    <div className="flex items-center justify-between"><span>Estudiantes</span><strong className="text-slate-800">{totalAlumnos}</strong></div>
                    <div className="flex items-center justify-between"><span>Vacantes</span><strong className="text-indigo-600">{vacantes} / {capacidad}</strong></div>
                    <div className="flex items-center justify-between"><span>Cursos</span><strong className="text-slate-800">{ciclo.cursos}</strong></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* TURNOS Y HORARIOS */}
      {tabActiva === 'turnos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {turnosFiltrados.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 py-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <CalendarClock className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-base font-bold text-slate-800">No hay horarios disponibles</p>
              <p className="text-sm text-slate-600 mt-1">No existen horarios que coincidan con la búsqueda actual.</p>
            </div>
          ) : (
            turnosFiltrados.map((turno) => (
              <div key={turno.idHorario} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" title="Editar horario" onClick={() => abrirEditarTurno(turno)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" title="Eliminar horario" onClick={() => handleEliminarTurno(turno.idHorario, `${turno.curso} - ${turno.diaSemana}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-4">{turno.curso}</h3>
                <p className="text-sm text-slate-600 mt-1">{turno.ciclo}</p>
                <div className="space-y-2.5 mt-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Día</span><strong className="text-slate-800">{turno.diaSemana}</strong></div>
                  <div className="flex items-center justify-between"><span>Horario</span><strong className="text-slate-800">{turno.horaInicio} - {turno.horaFin}</strong></div>
                  <div className="flex items-center justify-between"><span>Orden</span><strong className="text-indigo-600">{turno.orden}</strong></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* TABLA ASIGNACIONES */}
      {tabActiva === 'asignaciones' && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-4 px-6">Docente Titular</th>
                <th className="py-4 px-6">Curso</th>
                <th className="py-4 px-6">Aula Asignada</th>
                <th className="py-4 px-6">Carga Semanal</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {asignacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-base font-bold text-slate-800">No hay cargas docentes</p>
                    <p className="text-sm text-slate-600 mt-1">No se encontraron asignaciones de docentes con el filtro aplicado.</p>
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
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {asig.horas} horas lectivas
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button type="button" title="Eliminar asignación" onClick={() => handleEliminarAsignacion(asig.idAsignacion, asig.docente, asig.curso)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
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
            <div className="col-span-3 py-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <School className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-base font-bold text-slate-800">No hay aulas registradas</p>
              <p className="text-sm text-slate-600 mt-1">Esta sección todavía no tiene aulas disponibles para mostrar.</p>
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
                      <button type="button" title="Editar Aula" onClick={() => abrirEditarAula(aula)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Eliminar Aula" onClick={() => handleEliminarAula(aula.idAula, aula.nombre)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{aula.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{aula.nivel}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> Capacidad:</span>
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
            <div className="col-span-3 py-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-base font-bold text-slate-800">No hay cursos registrados</p>
              <p className="text-sm text-slate-600 mt-1">No se encontraron cursos que coincidan con la búsqueda.</p>
            </div>
          ) : (
            cursosFiltrados.map((c) => (
              <div key={c.idCurso} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-indigo-600 rounded-md">{c.codigo}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" title="Editar Curso" onClick={() => abrirEditarCurso(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Eliminar Curso" onClick={() => handleEliminarCurso(c.idCurso, c.nombre)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{c.nombre}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{c.descripcion}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <span className="text-xs text-slate-400 font-medium">Oferta académica</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* MODAL CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl p-6 w-full ${tabActiva === 'ciclos' ? 'max-w-5xl' : 'max-w-md'} max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-100`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {tabActiva === 'asignaciones' && 'Asignar Docente a Curso y Ciclo'}
                {tabActiva === 'aulas' && (editandoId ? 'Editar Aula' : 'Registrar Nueva Aula')}
                {tabActiva === 'cursos' && (editandoId ? 'Editar Curso' : 'Registrar Nuevo Curso')}
                {tabActiva === 'ciclos' && (editandoId ? 'Editar Ciclo' : 'Registrar Nuevo Ciclo')}
                {tabActiva === 'turnos' && (editandoId ? 'Editar Horario' : 'Registrar Nuevo Horario')}
              </h3>
              <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              {tabActiva === 'ciclos' && (
                <div className="space-y-5">
                  <div className="overflow-x-auto pb-1">
                    <div className="flex min-w-[650px]">
                      {pasosCiclo.map((nombre, index) => {
                        const numero = index + 1;
                        return (
                          <div key={nombre} className="flex-1 flex items-center">
                            <button type="button" onClick={() => numero < pasoCiclo && setPasoCiclo(numero)} className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                numero < pasoCiclo ? 'bg-emerald-500 text-white' :
                                numero === pasoCiclo ? 'bg-indigo-600 text-white' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                                {numero < pasoCiclo ? '✓' : numero}
                              </span>
                              <span className={`text-[11px] font-semibold ${numero === pasoCiclo ? 'text-indigo-700' : 'text-slate-500'}`}>{nombre}</span>
                            </button>
                            {numero < 6 && <div className="h-px bg-slate-200 flex-1 mx-2" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {errorCiclo && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                      {errorCiclo}
                    </div>
                  )}
                  {pasoCiclo === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CampoCiclo label="Tipo de ciclo">
                        <select value={formCiclo.tipo} onChange={(e) => setFormCiclo({ ...formCiclo, tipo: e.target.value })} className="campo-ciclo">
                          <option>Anual</option><option>Semestral</option><option>Intensivo</option><option>Repaso</option>
                        </select>
                      </CampoCiclo>
                      <CampoCiclo label="Universidad objetivo">
                        <select value={formCiclo.universidadObjetivo} onChange={(e) => setFormCiclo({ ...formCiclo, universidadObjetivo: e.target.value })} className="campo-ciclo">
                          {['UNMSM','UNI','PUCP','UNFV','UNAC','UNT','Preuniversitario'].map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </CampoCiclo>
                      <CampoCiclo label="Modalidad">
                        <select value={formCiclo.modalidad} onChange={(e) => setFormCiclo({ ...formCiclo, modalidad: e.target.value })} className="campo-ciclo">
                          <option>Presencial</option><option>Virtual</option><option>Mixta</option>
                        </select>
                      </CampoCiclo>
                      <CampoCiclo label="Periodo">
                        <input value={formCiclo.periodo} maxLength={4} onChange={(e) => setFormCiclo({ ...formCiclo, periodo: e.target.value })} className="campo-ciclo" placeholder="2027" />
                      </CampoCiclo>
                    </div>
                  )}
                  {pasoCiclo === 2 && (
                    <div>
                      <CampoCiclo label="Nombre oficial del ciclo">
                        <input value={formCiclo.nombre} maxLength={100} onChange={(e) => setFormCiclo({ ...formCiclo, nombre: e.target.value })} className="campo-ciclo" placeholder={`Ciclo ${formCiclo.tipo} ${formCiclo.universidadObjetivo} ${formCiclo.periodo}`} />
                      </CampoCiclo>
                      <button type="button" onClick={() => setFormCiclo({ ...formCiclo, nombre: `Ciclo ${formCiclo.tipo} ${formCiclo.universidadObjetivo} ${formCiclo.periodo}` })} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800">
                        Usar nombre sugerido
                      </button>
                    </div>
                  )}
                  {pasoCiclo === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CampoCiclo label="Fecha de inicio"><input type="date" value={formCiclo.fechaInicio} onChange={(e) => setFormCiclo({ ...formCiclo, fechaInicio: e.target.value })} className="campo-ciclo" /></CampoCiclo>
                      <CampoCiclo label="Fecha de fin"><input type="date" value={formCiclo.fechaFin} onChange={(e) => setFormCiclo({ ...formCiclo, fechaFin: e.target.value })} className="campo-ciclo" /></CampoCiclo>
                      <CampoCiclo label="Capacidad"><input type="number" min="1" max="100" value={formCiclo.capacidad} onChange={(e) => setFormCiclo({ ...formCiclo, capacidad: Number(e.target.value) })} className="campo-ciclo" /></CampoCiclo>
                      <CampoCiclo label="Precio (S/)"><input type="number" min="0" max="9999.99" step="0.01" placeholder="0.00" value={formCiclo.precio} onChange={(e) => setFormCiclo({ ...formCiclo, precio: e.target.value })} className="campo-ciclo" /></CampoCiclo>
                    </div>
                  )}
                  {pasoCiclo === 4 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">Selecciona los cursos que formarán parte de la oferta académica.</p>
                      {cursos.length === 0 ? (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                          No hay cursos disponibles.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {cursos.map((curso) => {
                            const seleccionado = formCiclo.cursosSeleccionados.includes(curso.idCurso);
                            return (
                              <button key={curso.idCurso} type="button" onClick={() => toggleCursoCiclo(curso.idCurso)} className={`p-3 rounded-xl border text-left ${seleccionado ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                                <div className="flex justify-between gap-3">
                                  <div><p className="text-xs font-bold text-slate-800">{curso.nombre}</p><p className="text-[11px] text-slate-500">{curso.codigo}</p></div>
                                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${seleccionado ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>{seleccionado ? '✓' : ''}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {pasoCiclo === 5 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CampoCiclo label="Turno">
                          <select value={formCiclo.turno} onChange={(e) => setFormCiclo({ ...formCiclo, turno: e.target.value })} className="campo-ciclo"><option>Mañana</option><option>Tarde</option><option>Noche</option></select>
                        </CampoCiclo>
                        <CampoCiclo label="Horario general"><input value={formCiclo.horario} onChange={(e) => setFormCiclo({ ...formCiclo, horario: e.target.value })} className="campo-ciclo" placeholder="08:00 - 13:00" /></CampoCiclo>
                        <CampoCiclo label="Días de clase"><input value={formCiclo.diasClase} onChange={(e) => setFormCiclo({ ...formCiclo, diasClase: e.target.value })} className="campo-ciclo" placeholder="Lunes a Viernes" /></CampoCiclo>
                        <CampoCiclo label="Prefijo de código"><input value={formCiclo.prefijoCodigo} onChange={(e) => setFormCiclo({ ...formCiclo, prefijoCodigo: e.target.value.toUpperCase() })} className="campo-ciclo" placeholder="UNMSM" /></CampoCiclo>
                      </div>
                    </div>
                  )}
                  {pasoCiclo === 6 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Resumen</h4>
                        <div className="space-y-2 text-xs text-slate-600">
                          <p><b>Ciclo:</b> {formCiclo.nombre}</p>
                          <p><b>Universidad:</b> {formCiclo.universidadObjetivo}</p>
                          <p><b>Fechas:</b> {formCiclo.fechaInicio} → {formCiclo.fechaFin}</p>
                          <p><b>Turno:</b> {formCiclo.turno} · {formCiclo.horario}</p>
                          <p><b>Capacidad:</b> {formCiclo.capacidad}</p>
                          <p><b>Precio:</b> S/ {Number(formCiclo.precio || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Checklist de publicación</h4>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${puedePublicarCiclo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {puedePublicarCiclo ? 'Listo para publicar' : 'Requisitos pendientes'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {checklistPublicacion.map(({ texto, ok }) => (
                            <div key={texto} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${ok ? 'border-emerald-100 bg-emerald-50/60' : 'border-amber-100 bg-amber-50/60'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${ok ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                  {ok ? '✓' : '!'}
                                </span>
                                <span className={`text-xs font-semibold ${ok ? 'text-slate-700' : 'text-amber-800'}`}>{texto}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <label className={`mt-4 flex items-center gap-3 rounded-xl border p-3 text-xs font-semibold ${puedePublicarCiclo ? 'bg-indigo-50 border-indigo-100 text-slate-700 cursor-pointer' : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                          <input type="checkbox" checked={Boolean(formCiclo.publicar && puedePublicarCiclo)} disabled={!puedePublicarCiclo || guardandoCiclo} onChange={(e) => setFormCiclo((prev) => ({ ...prev, publicar: e.target.checked }))} className="accent-indigo-600" />
                          <span>Publicar ciclo al guardar</span>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => pasoCiclo === 1 ? setModalAbierto(false) : setPasoCiclo((prev) => prev - 1)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                      {pasoCiclo === 1 ? 'Cancelar' : 'Anterior'}
                    </button>
                    {pasoCiclo < 6 ? (
                      <button type="button" onClick={siguientePasoCiclo} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Siguiente</button>
                    ) : (
                      <button type="button" disabled={guardandoCiclo} onClick={guardarCiclo} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl">
                        {guardandoCiclo ? 'Guardando...' : editandoId ? 'Guardar Cambios' : formCiclo.publicar ? 'Crear y publicar' : 'Crear ciclo'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {tabActiva === 'turnos' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ciclo</label>
                    <select required value={formTurno.idCiclo} onChange={(e) => setFormTurno({ ...formTurno, idCiclo: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100">
                      <option value="">Selecciona un ciclo</option>
                      {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Curso</label>
                    <select required value={formTurno.idCurso} onChange={(e) => setFormTurno({ ...formTurno, idCurso: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100">
                      <option value="">Selecciona un curso</option>
                      {cursos.map((c) => <option key={c.idCurso} value={c.idCurso}>{c.nombre}{c.codigo ? ` (${c.codigo})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Día</label>
                    <select required value={formTurno.diaNumero} onChange={(e) => {
                      const diaNumero = Number(e.target.value);
                      const dias = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                      setFormTurno({ ...formTurno, diaNumero, diaSemana: dias[diaNumero] });
                    }} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100">
                      <option value={1}>Lunes</option>
                      <option value={2}>Martes</option>
                      <option value={3}>Miércoles</option>
                      <option value={4}>Jueves</option>
                      <option value={5}>Viernes</option>
                      <option value={6}>Sábado</option>
                      <option value={7}>Domingo</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de inicio</label>
                      <input type="time" required value={formTurno.horaInicio} onChange={(e) => setFormTurno({ ...formTurno, horaInicio: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de fin</label>
                      <input type="time" required value={formTurno.horaFin} onChange={(e) => setFormTurno({ ...formTurno, horaFin: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Orden</label>
                    <input type="number" required min="1" max="100" value={formTurno.orden} onChange={(e) => setFormTurno({ ...formTurno, orden: Number(e.target.value) })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </>
              )}

              {tabActiva === 'asignaciones' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Docente</label>
                    <select required value={formAsig.idUsuario} onChange={(e) => setFormAsig({ ...formAsig, idUsuario: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100">
                      <option value="">Selecciona un docente o tutor</option>
                      {usuarios.map((u) => <option key={u.IdUsuario ?? u.idUsuario} value={u.IdUsuario ?? u.idUsuario}>{u.NombreCompleto ?? u.Nombres ?? u.nombre ?? `Usuario ${u.IdUsuario ?? u.idUsuario}`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Ciclo</label>
                    <select required value={formAsig.idCiclo} onChange={(e) => setFormAsig({ ...formAsig, idCiclo: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100">
                      <option value="">Selecciona un ciclo</option>
                      {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Curso</label>
                    <select required value={formAsig.idCurso} onChange={(e) => setFormAsig({ ...formAsig, idCurso: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100">
                      <option value="">Selecciona un curso</option>
                      {cursos.map((c) => <option key={c.idCurso} value={c.idCurso}>{c.nombre}{c.codigo ? ` (${c.codigo})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-800">
                    La carga docente se organiza por ciclo y curso. El sistema gestiona internamente el registro técnico de aula; no necesitas seleccionar ni administrar un aula.
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Horas semanales</label>
                    <input required type="number" min="1" max="30" value={formAsig.horas} onChange={(e) => setFormAsig({ ...formAsig, horas: Number(e.target.value) })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </>
              )}
              {tabActiva === 'aulas' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador</label>
                    <input type="text" required placeholder="Ej: Aula QB-01" value={formAula.nombre} onChange={(e) => setFormAula({ ...formAula, nombre: e.target.value })} className="w-full text-sm text-slate-800 placeholder-slate-400 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Educativo</label>
                    <select value={formAula.nivel} onChange={(e) => setFormAula({ ...formAula, nivel: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white cursor-pointer">
                      <option value="Preuniversitario">Preuniversitario</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidad Máxima</label>
                    <input type="number" min="5" max="100" value={formAula.capacidad} onChange={(e) => setFormAula({ ...formAula, capacidad: Number(e.target.value) })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </>
              )}
              {tabActiva === 'cursos' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Curso</label>
                    <input type="text" required placeholder="Ej: Trigonometría Analítica" value={formCurso.nombre} minLength={NOMBRE_MINIMO} onChange={(e) => setFormCurso({ ...formCurso, nombre: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código Único</label>
                    <input type="text" required placeholder="Ej: MAT-TRI" value={formCurso.codigo} minLength={2} onChange={(e) => setFormCurso({ ...formCurso, codigo: e.target.value.toUpperCase() })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Breve</label>
                    <textarea rows="2" placeholder="Identidades trigonométricas y geometría analítica" value={formCurso.descripcion} onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })} className="w-full text-sm text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none" />
                  </div>
                </>
              )}
              {tabActiva !== 'ciclos' && (
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" disabled={!formularioActualValido} className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-sm transition ${formularioActualValido ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                    {editandoId ? 'Guardar Cambios' : 'Registrar'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
