
import React, { useState, useEffect, useRef, useMemo } from 'react';
import useModalDialog from '../hooks/useModalDialog';
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
  obtenerDirectorioUsuarios,
  obtenerCiclosPublicos,
  obtenerCiclosAdmin,
  obtenerDetalleCicloAdmin,
  crearCicloAdmin,
  actualizarCicloAdmin,
  actualizarEstadoCicloAdmin,
  eliminarCicloAdmin,
  obtenerHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
  obtenerCursosCiclo
} from '../services/api';
import { esAdmin, esDocente, esTutor } from '../utils/roles';
import { UNIVERSIDADES, nombreUniversidadPorClave } from '../utils/universidadCiclo';
import { cursosDeUniversidad, seleccionCompatible } from '../utils/ofertaCiclo';
import {
  claveUniversidadCurso,
  etiquetaDesdeClave,
  universidadesDelCatalogo,
  catalogoCursosVisible
} from '../utils/catalogoCursos';
import {
  universidadesDeHorarios,
  ciclosConHorarios,
  claveUniversidadHorario,
  cicloCompatible,
  horariosVisibles
} from '../utils/horariosAcademicos';
import UniversidadLogo from '../components/UniversidadLogo';
import CursoIcon from '../components/CursoIcon';

// ============================================================================
// Catálogo de cursos (pestaña «Cursos Académicos»): la universidad de cada
// curso sale EXCLUSIVAMENTE del campo estructurado `Curso.UniversidadObjetivo`
// (helper `catalogoCursos.js`); el prefijo del código (SM-, FV-, UNI-...) es
// solo descriptivo y NUNCA se usa para deducirla.
//
// `ETIQUETAS_UNIVERSIDAD` reutiliza el helper centralizado `universidadCiclo.js`
// con una sola copia de las siglas canónicas: clave normalizada → sigla. El
// nombre completo del footer se resuelve con `nombreUniversidadPorClave`.
// ============================================================================
const ETIQUETAS_UNIVERSIDAD = {
  ...Object.fromEntries(Object.keys(UNIVERSIDADES).map((clave) => [clave.toLowerCase(), clave])),
  preuniversitario: 'Preuniversitario'
};

// Nombre completo (o etiqueta) de una universidad a partir de su clave
// normalizada. Sin mappings duplicados: delega en el helper centralizado y
// cae a la sigla canónica si es necesario.
const resolverNombreUniversidadCurso = (clave) => {
  if (!clave) return '';
  return nombreUniversidadPorClave(clave) || ETIQUETAS_UNIVERSIDAD[clave] || clave.toUpperCase();
};

// Buscador genérico compartido por las cinco pestañas (mismo estado y misma
// lógica de filtrado); el placeholder se adapta al contenido de cada una.
const PLACEHOLDER_BUSQUEDA = {
  asignaciones: 'Buscar por docente, curso o ciclo...',
  aulas: 'Buscar aula por nombre o programa...',
  ciclos: 'Buscar ciclo por nombre, turno u horario...',
  cursos: 'Buscar curso, código o universidad...',
  turnos: 'Buscar por ciclo, curso, día u hora...'
};

function CampoCiclo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      {React.cloneElement(children, {
        className: `${children.props.className || ''} w-full text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100`
      })}
    </label>
  );
}

// --- Horario del ciclo -----------------------------------------------------
// El backend exige exactamente "HH:mm - HH:mm" y que la hora final sea mayor
// que la inicial. Estas utilidades sólo traducen el horario heredado (por
// ejemplo "Lunes a Jueves 3pm-10pm") al formulario; el formato "HH:mm - HH:mm"
// se construye al enviar, así que el contrato de la API no cambia.
function normalizarHoraSuelta(hora, minutos, sufijo) {
  let h = Number(hora);
  const m = minutos === undefined || minutos === null || minutos === '' ? 0 : Number(minutos);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  if (!Number.isInteger(m) || m < 0 || m > 59) return null;
  const marca = String(sufijo || '').replace(/[.\s]/g, '');
  if (marca === 'pm') {
    if (h > 12) return null;
    h = h === 12 ? 12 : h + 12;
  } else if (marca === 'am') {
    if (h > 12) return null;
    h = h === 12 ? 0 : h;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function extraerHorasDeHorario(texto) {
  const limpio = String(texto ?? '').toLowerCase();
  const encontradas = [];
  const patron = /(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm|a|p|h(?:rs?)?)?/g;
  let coincidencia = patron.exec(limpio);
  while (coincidencia) {
    const hora = normalizarHoraSuelta(coincidencia[1], coincidencia[2], coincidencia[3]);
    if (hora) encontradas.push(hora);
    if (encontradas.length === 2) break;
    coincidencia = patron.exec(limpio);
  }
  return encontradas;
}

// Devuelve { horaInicio, horaFin, crudo }. `crudo` sólo se rellena cuando el
// valor guardado no se pudo interpretar, para poder avisar al administrador.
function normalizarHorarioParaFormulario(valor) {
  const original = String(valor ?? '').trim();
  if (!original) return { horaInicio: '', horaFin: '', crudo: '' };

  const exacto = original.replace(/\s+/g, ' ').match(/^([01]\d|2[0-3]):([0-5]\d) - ([01]\d|2[0-3]):([0-5]\d)$/);
  if (exacto) {
    const inicio = `${exacto[1]}:${exacto[2]}`;
    const fin = `${exacto[3]}:${exacto[4]}`;
    if (fin > inicio) return { horaInicio: inicio, horaFin: fin, crudo: '' };
  }

  const horas = extraerHorasDeHorario(original);
  if (horas.length === 2 && horas[1] > horas[0]) {
    return { horaInicio: horas[0], horaFin: horas[1], crudo: '' };
  }
  return { horaInicio: '', horaFin: '', crudo: original };
}
export default function AcademicoPage({ vistaInicial = 'asignaciones', user }) {
  const puedeGestionar = esAdmin(user);
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
  // Filtro por universidad de la pestaña «Cursos Académicos»: clave
  // normalizada de UniversidadObjetivo ('todos' muestra el catálogo global
  // de 71 cursos; nunca se ocultan permanentemente otros cursos).
  const [filtroUniversidad, setFiltroUniversidad] = useState('todos');
  // Filtros de la pestaña «Horarios» (estado PROPIO, separado del de Cursos
  // Académicos: filtrar en una pestaña no altera la otra).
  const [filtroUniversidadTurnos, setFiltroUniversidadTurnos] = useState('todas');
  const [filtroCicloTurnos, setFiltroCicloTurnos] = useState('todos');
  useEffect(() => {
    // Al cambiar de pestaña, cada pestaña vuelve a sus valores por defecto.
    setFiltroUniversidad('todos');
    setFiltroUniversidadTurnos('todas');
    setFiltroCicloTurnos('todos');
  }, [tabActiva]);
  // Oferta del ciclo seleccionado en el modal de Horarios (relación
  // CicloCurso vía GET /api/ciclos/:id/cursos; nunca el catálogo global).
  const cursosCicloTurnosRef = useRef(0);
  const [cursosCicloTurnos, setCursosCicloTurnos] = useState([]);
  const [cargandoCursosCicloTurnos, setCargandoCursosCicloTurnos] = useState(false);
  const [errorCursosCicloTurnos, setErrorCursosCicloTurnos] = useState('');
  // Modal y modo edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const operacionRef = useRef(false);
  const edicionSeqRef = useRef(0);
  useEffect(() => {
    edicionSeqRef.current += 1;
    return () => { edicionSeqRef.current += 1; };
  }, [tabActiva]);
  const [editandoId, setEditandoId] = useState(null);
  const [pasoCiclo, setPasoCiclo] = useState(1);
  const [errorCiclo, setErrorCiclo] = useState('');
  const [guardandoCiclo, setGuardandoCiclo] = useState(false);
  const [avisoOferta, setAvisoOferta] = useState('');
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const dialogRef = useModalDialog(modalAbierto, () => setModalAbierto(false), guardandoCiclo || guardandoDatos);
  const [avisoHorario, setAvisoHorario] = useState('');
  const [publicadoOriginal, setPublicadoOriginal] = useState(null);
  // Mapa idCiclo → ciclo normalizado para resolver la universidad real de
  // cada horario (Ciclo.UniversidadObjetivo; nunca prefijos de código).
  const mapaCiclosHorarios = useMemo(() => {
    const mapa = new Map();
    (Array.isArray(ciclos) ? ciclos : []).forEach((ciclo) => {
      const id = Number(ciclo.idCiclo);
      if (Number.isSafeInteger(id) && id > 0) mapa.set(id, ciclo);
    });
    return mapa;
  }, [ciclos]);
  // Formularios
  const [formAula, setFormAula] = useState({ nombre: '', nivel: 'Preuniversitario', capacidad: 35 });
  // UniversidadObjetivo vacía al crear: se exige una elección explícita para
  // que nunca queden cursos «sin universidad» (el único valor implícito del
  // backend es Preuniversitario y no debe aplicarse por accidente).
  const [formCurso, setFormCurso] = useState({ nombre: '', codigo: '', descripcion: '', universidadObjetivo: '' });
  const [formAsig, setFormAsig] = useState({ idUsuario: '', idCiclo: '', idCurso: '', horas: 4 });
  const [formCiclo, setFormCiclo] = useState({
    universidadObjetivo: 'UNMSM',
    nombre: '',
    turno: 'Mañana',
    horaInicio: '08:00',
    horaFin: '13:00',
    fechaInicio: '',
    fechaFin: '',
    capacidad: 250,
    precio: '',
    diasClase: 'Lunes a Viernes',
    prefijoCodigo: '',
    publicar: true,
    cursosSeleccionados: []
  });
  const [formTurno, setFormTurno] = useState({
    universidad: '',
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

  async function cargarDatos() {
    setErrorDatos('');
    const [aulasRes, cursosRes, asignacionesRes, ciclosRes, usuariosRes, horariosRes] = await Promise.allSettled([
      obtenerAulas(),
      obtenerCursos(),
      obtenerAsignacionesDocente(),
      obtenerCiclosAdmin().catch((error) => {
        if (![403, 404].includes(error.status)) throw error;
        return obtenerCiclosPublicos();
      }),
      obtenerDirectorioUsuarios(),
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
      // Campo estructurado del catálogo (GET /api/cursos): única relación
      // Universidad ↔ Curso del modelo. El wizard lo usa para mostrar en el
      // paso Oferta solo los cursos de la universidad elegida en el paso 1.
      universidadObjetivo: c.universidadObjetivo ?? c.UniversidadObjetivo ?? '',
    }));
    const listaCiclos = (Array.isArray(ciclosRaw) ? ciclosRaw : []).map((c) => ({
      ...c,
      idCiclo: Number(c.idCiclo ?? c.IdCiclo),
      nombre: c.nombre ?? c.Nombre ?? '',
      turno: c.turno ?? c.Turno ?? '',
      horario: c.horario ?? c.Horario ?? '',
      capacidad: Number(c.capacidad ?? c.Capacidad ?? 0),
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
    const listaDocentes = (Array.isArray(usuariosRaw) ? usuariosRaw : []).filter((u) =>
      // Perfil real, comparación exacta (sin `includes`).
      esDocente(u) || esTutor(u)
    );
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
    if (operacionRef.current) return;
    edicionSeqRef.current += 1;
    setEditandoId(null);
    setFormAula({ nombre: '', nivel: 'Preuniversitario', capacidad: 35 });
    setFormCurso({ nombre: '', codigo: '', descripcion: '', universidadObjetivo: '' });
    setFormAsig({
      idUsuario: String(usuarios[0]?.IdUsuario ?? usuarios[0]?.idUsuario ?? ''),
      idCiclo: String(ciclos[0]?.idCiclo ?? ''),
      idCurso: String(cursos[0]?.idCurso ?? ''),
      horas: 4,
    });
    setFormCiclo({
      universidadObjetivo: 'UNMSM',
      nombre: '',
      turno: 'Mañana',
      horaInicio: '08:00',
      horaFin: '13:00',
      fechaInicio: '',
      fechaFin: '',
      capacidad: 250,
      precio: '',
      diasClase: 'Lunes a Viernes',
      prefijoCodigo: '',
      publicar: true,
      cursosSeleccionados: []
    });
    setPasoCiclo(1);
    setErrorCiclo('');
    setAvisoHorario('');
    setAvisoOferta('');
    setPublicadoOriginal(null);
    setFormTurno({
      universidad: '',
      idCiclo: '',
      idCurso: '',
      diaNumero: 1,
      diaSemana: 'Lunes',
      horaInicio: '08:00',
      horaFin: '09:00',
      orden: 1
    });
    setCursosCicloTurnos([]);
    setErrorCursosCicloTurnos('');
    setCargandoCursosCicloTurnos(false);
    cursosCicloTurnosRef.current += 1;
    setModalAbierto(true);
  };
  // Oferta de cursos del ciclo seleccionado en el modal de Horarios: la
  // relación REAL es CicloCurso(IdCiclo, IdCurso), obtenida del backend
  // (GET /api/ciclos/:id/cursos). Nunca el catálogo global: un horario solo
  // puede usar cursos vinculados a su ciclo y coherentes con su universidad
  // (el backend lo revalida en POST/PUT /api/horarios).
  const cargarOfertaTurnos = async (idCiclo) => {
    const secuencia = ++cursosCicloTurnosRef.current;
    if (!idCiclo) {
      setCursosCicloTurnos([]);
      setErrorCursosCicloTurnos('');
      setCargandoCursosCicloTurnos(false);
      return;
    }
    setCargandoCursosCicloTurnos(true);
    setErrorCursosCicloTurnos('');
    try {
      const lista = await obtenerCursosCiclo(idCiclo);
      if (secuencia !== cursosCicloTurnosRef.current) return;
      setCursosCicloTurnos(Array.isArray(lista) ? lista : []);
      setCargandoCursosCicloTurnos(false);
    } catch (error) {
      if (secuencia !== cursosCicloTurnosRef.current) return;
      setErrorCursosCicloTurnos(error?.message || 'No se pudo cargar la oferta de cursos del ciclo.');
      setCursosCicloTurnos([]);
      setCargandoCursosCicloTurnos(false);
    }
  };
  // Cambio de universidad en el modal de Horarios: si el ciclo que estaba
  // seleccionado pertenece a OTRA universidad se resetea el ciclo (y el
  // curso), evitando combinaciones imposibles (p. ej. UNI + Semestral San
  // Marcos). Solo se recarga la oferta cuando cambia el ciclo.
  const cambiarUniversidadTurnoModal = (universidad) => {
    const idCicloAnterior = formTurno.idCiclo;
    const compatible = cicloCompatible(mapaCiclosHorarios, idCicloAnterior, universidad);
    const nuevoIdCiclo = compatible ? idCicloAnterior : '';
    setFormTurno((prev) => ({
      ...prev,
      universidad,
      idCiclo: nuevoIdCiclo,
      idCurso: compatible ? prev.idCurso : ''
    }));
    if (Number(nuevoIdCiclo) !== Number(idCicloAnterior)) cargarOfertaTurnos(nuevoIdCiclo);
  };
  // Cambio de ciclo en el modal: el curso se limpia (solo se conservan
  // día/hora/orden) porque la oferta cambia con el ciclo, y se recarga.
  const cambiarCicloTurnoModal = (idCiclo) => {
    const cicloAnterior = formTurno.idCiclo;
    setFormTurno((prev) => ({ ...prev, idCiclo, idCurso: '' }));
    if (Number(idCiclo) !== Number(cicloAnterior)) cargarOfertaTurnos(idCiclo);
  };
  const abrirEditarAula = (aula) => {
    if (operacionRef.current) return;
    edicionSeqRef.current += 1;
    setEditandoId(aula.idAula ?? aula.IdAula);
    setFormAula({
      nombre: aula.nombre ?? aula.Nombre,
      nivel: 'Preuniversitario',
      capacidad: Number(aula.capacidad ?? aula.Capacidad ?? 35)
    });
    setModalAbierto(true);
  };
  // Al editar, la universidad objetivo de un curso queda FIJA si ya tiene
  // una asignada: el backend (PUT /api/cursos/:id) acepta cambiarla sin
  // validar sus vínculos CicloCurso, y un cambio silencioso dejaría ofertas
  // de ciclos incompatibles. El bloqueo se indica con un mensaje claro; si el
  // curso no tiene universidad (dato histórico sin asignar) sí se permite
  // completarla, porque no contradice ninguna relación previa coherente.
  // Un valor FUERA del catálogo del sistema tampoco se bloquea, pero se
  // muestra tal cual con su opción defensiva para permitir normalizarlo de
  // forma explícita (nunca automática).
  const OPCIONES_UNIVERSIDAD_CURSO = [...Object.keys(UNIVERSIDADES), 'Preuniversitario'];
  const cursoEnEdicion = (editandoId && tabActiva === 'cursos')
    ? cursos.find((curso) => curso.idCurso === editandoId)
    : null;
  const universidadOriginalCurso = cursoEnEdicion ? claveUniversidadCurso(cursoEnEdicion) : '';
  const universidadOriginalConocida = OPCIONES_UNIVERSIDAD_CURSO.some(
    (opcion) => opcion.toLowerCase() === universidadOriginalCurso
  );
  const bloquearUniversidadCurso = Boolean(editandoId) && universidadOriginalCurso !== '' && universidadOriginalConocida;
  const universidadFueraDeCatalogo = Boolean(editandoId) && universidadOriginalCurso !== '' && !universidadOriginalConocida;
  const abrirEditarCurso = (curso) => {
    if (operacionRef.current) return;
    edicionSeqRef.current += 1;
    setEditandoId(curso.idCurso ?? curso.IdCurso);
    // El valor inicial del select debe coincidir con una opción real: se usa
    // la etiqueta canónica si el valor almacenado solo difiere en espacios o
    // mayúsculas/minúsculas; si es desconocido se conserva el crudo (la UI lo
    // muestra con su opción defensiva para normalizarlo explícitamente).
    const claveCurso = claveUniversidadCurso(curso);
    const rawUniversidad = String(curso.universidadObjetivo ?? curso.UniversidadObjetivo ?? '').trim();
    setFormCurso({
      nombre: curso.nombre ?? curso.Nombre,
      codigo: curso.codigo ?? curso.Codigo,
      descripcion: curso.descripcion ?? curso.Descripcion ?? '',
      universidadObjetivo: (claveCurso && ETIQUETAS_UNIVERSIDAD[claveCurso]) || rawUniversidad
    });
    setModalAbierto(true);
  };
  const abrirEditarCiclo = async (ciclo) => {
    if (operacionRef.current) return;
    const secuencia = ++edicionSeqRef.current;
    setErrorCiclo('');
    setAvisoOferta('');
    let cursosSeleccionados = [];
    try {
      const detalle = await obtenerDetalleCicloAdmin(ciclo.idCiclo);
      if (secuencia !== edicionSeqRef.current) return;
      const idsDetalle = (detalle.cursos || [])
        .map((curso) => Number(curso.IdCurso ?? curso.idCurso))
        .filter((id) => Number.isInteger(id) && id > 0);
      // La universidad objetivo delimita la oferta: los vínculos históricos
      // con cursos de OTRA universidad se invalidan en el formulario (no en la
      // BD, que no se toca hasta guardar). Solo se recorta si el catálogo ya
      // está cargado; evita descartarlo todo ante un fallo puntual de /cursos.
      const catalogoUniversidad = cursos.length > 0
        ? cursosDeUniversidad(cursos, ciclo.universidadObjetivo || 'UNMSM')
        : [];
      cursosSeleccionados = cursos.length > 0
        ? seleccionCompatible(idsDetalle, catalogoUniversidad)
        : idsDetalle;
      if (cursos.length > 0 && cursosSeleccionados.length < idsDetalle.length) {
        setAvisoOferta(
          `${idsDetalle.length - cursosSeleccionados.length} curso(s) guardado(s) en este ciclo no corresponden a ${ciclo.universidadObjetivo || 'UNMSM'} y quedaron fuera de la oferta. Al guardar se retirarán sus relaciones.`
        );
      }
    } catch (error) {
      if (secuencia !== edicionSeqRef.current) return;
      setErrorDatos(error.message || 'No se pudo cargar la oferta de cursos de este ciclo. No se abrió la edición para evitar perder relaciones.');
      return;
    }
    const horarioNormalizado = normalizarHorarioParaFormulario(ciclo.horario);
    setEditandoId(ciclo.idCiclo);
    setPublicadoOriginal(Boolean(ciclo.publicar));
    setFormCiclo({
      universidadObjetivo: ciclo.universidadObjetivo || 'UNMSM',
      nombre: ciclo.nombre || '',
      turno: ciclo.turno || 'Mañana',
      horaInicio: horarioNormalizado.horaInicio,
      horaFin: horarioNormalizado.horaFin,
      fechaInicio: String(ciclo.fechaInicio || '').slice(0, 10),
      fechaFin: String(ciclo.fechaFin || '').slice(0, 10),
      capacidad: Number(ciclo.capacidad || 250),
      precio: Number(ciclo.precio || 0),
      diasClase: ciclo.diasClase || 'Lunes a Viernes',
      prefijoCodigo: ciclo.prefijoCodigo || '',
      publicar: Boolean(ciclo.publicar),
      cursosSeleccionados
    });
    setAvisoHorario(
      horarioNormalizado.crudo
        ? `El horario guardado («${horarioNormalizado.crudo}») no tiene formato HH:mm. Selecciona la hora de inicio y la hora de fin para actualizarlo.`
        : ''
    );
    setPasoCiclo(1);
    setModalAbierto(true);
  };
  const abrirEditarTurno = (turno) => {
    if (operacionRef.current) return;
    edicionSeqRef.current += 1;
    setEditandoId(turno.idHorario ?? turno.IdHorario);
    // La universidad del horario sale del ciclo (Ciclo.UniversidadObjetivo
    // vía mapa/idCiclo o campo universidadCiclo del backend; nunca el código
    // del curso) y se muestra canónica para que coincida con la opción.
    const claveTurno = claveUniversidadHorario(turno, mapaCiclosHorarios);
    setFormTurno({
      universidad: ETIQUETAS_UNIVERSIDAD[claveTurno] || (claveTurno ? claveTurno.toUpperCase() : ''),
      idCiclo: String(turno.idCiclo ?? turno.IdCiclo ?? ''),
      idCurso: String(turno.idCurso ?? turno.IdCurso ?? ''),
      diaNumero: Number(turno.diaNumero ?? turno.DiaNumero ?? 1),
      diaSemana: turno.diaSemana ?? turno.DiaSemana ?? 'Lunes',
      horaInicio: String(turno.horaInicio ?? turno.HoraInicio ?? '').slice(0, 5),
      horaFin: String(turno.horaFin ?? turno.HoraFin ?? '').slice(0, 5),
      orden: Number(turno.orden ?? turno.Orden ?? 1)
    });
    // La oferta del ciclo se carga del backend (CicloCurso); el curso
    // guardado queda visible aunque ya no forme parte de la oferta, marcado
    // como «fuera de la oferta» para normalizarlo explícitamente.
    cargarOfertaTurnos(turno.idCiclo ?? turno.IdCiclo);
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
    if (tabActiva === 'cursos') {
      return nombreValido(formCurso.nombre) &&
        codigoCursoValido(formCurso.codigo) &&
        Boolean(formCurso.universidadObjetivo);
    }
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
    if (operacionRef.current || !puedeGestionar) return;
    operacionRef.current = true;
    setErrorDatos('');
    setGuardandoDatos(true);
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
        // Universidad objetivo OBLIGATORIA: el backend no debe aplicar su
        // valor implícito (Preuniversitario) por omisión silenciosa.
        if (!formCurso.universidadObjetivo) {
          throw new Error('Selecciona la universidad objetivo del curso.');
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
    } finally {
      operacionRef.current = false;
      setGuardandoDatos(false);
    }
  };
  const eliminarRegistro = async (id, pregunta, operacion) => {
    if (!puedeGestionar || operacionRef.current || !window.confirm(pregunta)) return;
    operacionRef.current = true;
    setGuardandoDatos(true);
    try {
      await operacion(id);
      // Consultar el resultado real: no se presupone la forma de eliminación.
      await cargarDatos();
    } catch (err) {
      setErrorDatos(err?.message || 'No se pudo completar la operación.');
    } finally {
      operacionRef.current = false;
      setGuardandoDatos(false);
    }
  };
  const handleEliminarAula = (id, nombre) => eliminarRegistro(id, `¿Desactivar el aula "${nombre}"?`, eliminarAula);
  const handleEliminarCurso = (id, nombre) => eliminarRegistro(id, `¿Desactivar el curso "${nombre}"?`, eliminarCurso);
  const handleEliminarAsignacion = (id, docente, curso) => eliminarRegistro(id, `¿Desactivar la carga de "${curso}" asignada a ${docente}?`, eliminarAsignacionDocente);
  const handleEliminarCiclo = (id, nombre) => eliminarRegistro(id, `¿Eliminar el ciclo "${nombre}"?`, eliminarCicloAdmin);
  const handleEliminarTurno = (id, descripcion) => eliminarRegistro(id, `¿Desactivar el horario "${descripcion}"?`, eliminarHorario);
  const pasosCiclo = ['Universidad', 'Nombre', 'Fechas y capacidad', 'Oferta', 'Horarios', 'Revisión'];
  const anioSugerido = new Date().getFullYear();
  // Paso 4 (Oferta): únicamente el catálogo de la universidad objetivo elegida
  // en el paso 1. La relación es el campo estructurado Curso.UniversidadObjetivo
  // (el prefijo del código es solo descriptivo; NUNCA se filtra por SM-/FV-...).
  const cursosUniversidad = cursosDeUniversidad(cursos, formCiclo.universidadObjetivo);
  const validarPasoCiclo = (paso) => {
    if (paso === 1) {
      if (!formCiclo.universidadObjetivo) {
        return 'Selecciona la universidad objetivo del ciclo.';
      }
    }
    if (paso === 2) {
      const nombre = formCiclo.nombre.trim();
      if (nombre.length < 10 || nombre.length > 100) return 'El nombre del ciclo debe tener entre 10 y 100 caracteres.';
    }
    if (paso === 3) {
      if (!formCiclo.fechaInicio || !formCiclo.fechaFin) return 'Completa las fechas del ciclo.';
      if (new Date(formCiclo.fechaFin) <= new Date(formCiclo.fechaInicio)) return 'La fecha final debe ser posterior a la fecha de inicio.';
      if (!Number.isInteger(Number(formCiclo.capacidad)) || Number(formCiclo.capacidad) < 1 || Number(formCiclo.capacidad) > 500) return 'La capacidad del ciclo debe estar entre 1 y 500 alumnos.';
      if (formCiclo.precio === '' || !Number.isFinite(Number(formCiclo.precio)) || Number(formCiclo.precio) < 0 || Number(formCiclo.precio) > 9999.99) return 'El precio ingresado no es válido.';
    }
    if (paso === 4 && cursosUniversidad.length > 0 && formCiclo.cursosSeleccionados.length === 0) {
      return 'Selecciona al menos un curso para continuar.';
    }
    if (paso === 5) {
      if (!formCiclo.turno || !formCiclo.diasClase.trim()) return 'Completa turno y días de clase.';
      if (!formCiclo.horaInicio || !formCiclo.horaFin) return 'Selecciona la hora de inicio y la hora de fin del ciclo.';
      if (formCiclo.horaFin <= formCiclo.horaInicio) return 'La hora final debe ser mayor a la hora inicial.';
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
  // Paso 6 (Revisión): resumen coherente con la universidad objetivo.
  const idsOfertaResumen = new Set(formCiclo.cursosSeleccionados);
  const cursosResumen = cursosUniversidad.filter((curso) => idsOfertaResumen.has(curso.idCurso));
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
  // Cambio de universidad objetivo (paso 1). La oferta del paso 4 y la
  // selección dependen de la universidad, así que:
  //   - se recalcula el catálogo visible (solo cursos de ESA universidad);
  //   - se retiran los cursos seleccionados que no le corresponden;
  //   - el resto del formulario (nombre, fechas, capacidad, precio, horario)
  //     permanece intacto porque no depende de la universidad.
  const cambiarUniversidadCiclo = (universidad) => {
    const catalogo = cursosDeUniversidad(cursos, universidad);
    const conservados = seleccionCompatible(formCiclo.cursosSeleccionados, catalogo);
    const retirados = formCiclo.cursosSeleccionados.length - conservados.length;
    setAvisoOferta(
      retirados > 0
        ? `Se deseleccionaron ${retirados} curso(s) de la universidad anterior: la oferta solo puede incluir cursos de ${universidad}.`
        : ''
    );
    setFormCiclo((prev) => ({
      ...prev,
      universidadObjetivo: universidad,
      cursosSeleccionados: conservados,
    }));
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
    if (operacionRef.current || !puedeGestionar) return;
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
      horario: `${formCiclo.horaInicio} - ${formCiclo.horaFin}`,
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
      operacionRef.current = true;
      setGuardandoCiclo(true);
      setErrorCiclo('');
      if (editandoId) {
        await actualizarCicloAdmin(editandoId, payload);
        // El PUT no cambia la visibilidad: si el administrador la modificó se
        // usa el PATCH de estado ya existente en el backend.
        if (publicadoOriginal !== null && Boolean(formCiclo.publicar) !== publicadoOriginal) {
          try {
            await actualizarEstadoCicloAdmin(editandoId, formCiclo.publicar ? 'Activo' : 'Cerrado');
          } catch (errorVisibilidad) {
            await cargarDatos();
            setModalAbierto(false);
            setEditandoId(null);
            window.alert(`El ciclo se actualizó, pero no se pudo cambiar su visibilidad: ${errorVisibilidad?.message || 'error desconocido'}`);
            return;
          }
        }
      } else {
        await crearCicloAdmin(payload);
      }
      await cargarDatos();
      setModalAbierto(false);
      setEditandoId(null);
    } catch (err) {
      setErrorCiclo(err?.message || 'No se pudo guardar el ciclo.');
    } finally {
      operacionRef.current = false;
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
  // Pestaña «Cursos Académicos»: FILTRO POR UNIVERSIDAD (derivado de los
  // datos reales, fuente de verdad Curso.UniversidadObjetivo — nunca el
  // prefijo del código) COMBINADO con la búsqueda textual, más el orden
  // agrupado por universidad. Los chips y la lista usan el mismo orden.
  const universidadesCatalogo = universidadesDelCatalogo(cursos, ETIQUETAS_UNIVERSIDAD);
  const cursosFiltrados = catalogoCursosVisible(cursos, {
    universidad: filtroUniversidad,
    texto: busqueda,
    etiquetasUniversidad: ETIQUETAS_UNIVERSIDAD,
    resolverNombreUniversidad: resolverNombreUniversidadCurso
  });
  const universidadFiltrada = universidadesCatalogo.find((grupo) => grupo.clave === filtroUniversidad);
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
  // Pestaña «Horarios»: FILTRO POR UNIVERSIDAD (Ciclo.UniversidadObjetivo,
  // derivado de los datos reales) + FILTRO POR CICLO + búsqueda, con el orden
  // Universidad → Ciclo → Día → Orden → Hora. Los chips y el selector usan el
  // mismo orden y sus contadores salen de los datos, nunca hardcodeados.
  const universidadesHorarios = universidadesDeHorarios(turnos, mapaCiclosHorarios, ETIQUETAS_UNIVERSIDAD);
  const ciclosHorarios = ciclosConHorarios(turnos, mapaCiclosHorarios, ETIQUETAS_UNIVERSIDAD);
  const ciclosHorariosFiltrados = filtroUniversidadTurnos === 'todas'
    ? ciclosHorarios
    : ciclosHorarios.filter((ciclo) => ciclo.clave === filtroUniversidadTurnos);
  const turnosFiltrados = horariosVisibles(turnos, {
    universidad: filtroUniversidadTurnos,
    idCiclo: filtroCicloTurnos,
    texto: busqueda,
    ciclosPorId: mapaCiclosHorarios,
    etiquetasUniversidad: ETIQUETAS_UNIVERSIDAD,
    ordenGrupos: universidadesHorarios
  });
  const hayFiltrosHorarios = filtroUniversidadTurnos !== 'todas'
    || filtroCicloTurnos !== 'todos'
    || busqueda.trim() !== '';
  const cicloTurnoFiltroActivo = Number(filtroCicloTurnos) > 0
    ? ciclosHorarios.find((ciclo) => ciclo.idCiclo === Number(filtroCicloTurnos))
    : null;
  // Cambio de universidad en los filtros de Horarios: si el ciclo filtrado
  // pertenece a OTRA universidad, se resetea SOLO el filtro de ciclo a
  // «Todos los ciclos» (nunca queda una combinación imposible).
  const cambiarUniversidadTurnosFiltro = (clave) => {
    setFiltroUniversidadTurnos(clave);
    if (!cicloCompatible(mapaCiclosHorarios, filtroCicloTurnos, clave)) {
      setFiltroCicloTurnos('todos');
    }
  };
  const etiquetaUniversidadTurnosFiltro = filtroUniversidadTurnos !== 'todas'
    ? (universidadesHorarios.find((grupo) => grupo.clave === filtroUniversidadTurnos)?.etiqueta || filtroUniversidadTurnos.toUpperCase())
    : '';
  const totalCiclosFiltroTurnos = filtroUniversidadTurnos !== 'todas'
    ? (universidadesHorarios.find((grupo) => grupo.clave === filtroUniversidadTurnos)?.total || 0)
    : turnos.length;
  // Modal de Horarios: ciclos REALES de la universidad elegida (se permite
  // crear el primer horario de un ciclo aún sin horarios). El curso se elige
  // SOLO de la oferta del ciclo (CicloCurso vía obtenerCursosCiclo).
  const ciclosModalTurnos = formTurno.universidad
    ? ciclos
        .filter((ciclo) => claveUniversidadCurso(ciclo) === formTurno.universidad.toLowerCase())
        .slice()
        .sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es', { sensitivity: 'base' }))
    : [];
  const cursoTurnoFueraDeOferta = tabActiva === 'turnos'
    && formTurno.idCurso
    && !cargandoCursosCicloTurnos
    && !cursosCicloTurnos.some((curso) => Number(curso.idCurso) === Number(formTurno.idCurso));
  const nombreCursoTurnoGuardado = (() => {
    const idCurso = Number(formTurno.idCurso);
    const enOferta = cursosCicloTurnos.find((curso) => Number(curso.idCurso) === idCurso);
    if (enOferta) return enOferta.nombre;
    const enCatalogo = cursos.find((curso) => Number(curso.idCurso) === idCurso);
    return enCatalogo ? `${enCatalogo.nombre} (${enCatalogo.codigo})` : `Curso #${formTurno.idCurso}`;
  })();
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-600 rounded-xl text-white">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión Académica</h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Organiza ciclos, cursos, horarios y asignaciones docentes de la academia
              </p>
            </div>
          </div>
        </div>
        {puedeGestionar && (
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {tabActiva === 'asignaciones' && 'Nueva Carga Docente'}
          {tabActiva === 'aulas' && 'Nueva Aula'}
          {tabActiva === 'cursos' && 'Nuevo Curso'}
          {tabActiva === 'ciclos' && 'Nuevo Ciclo'}
          {tabActiva === 'turnos' && 'Nuevo Horario'}
        </button>
        )}
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
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4" />
          Aulas ({aulas.length})
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('cursos')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tabActiva === 'cursos'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Cursos Académicos ({cursos.length})
        </button>
      </div>
      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={PLACEHOLDER_BUSQUEDA[tabActiva] || 'Buscar por ciclo, curso, docente o código...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-xs"
          />
        </div>
        {tabActiva === 'aulas' && (
          <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-500" />
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
      {/* FILTRO POR UNIVERSIDAD (Cursos Académicos): chips derivados de los
          datos reales (Curso.UniversidadObjetivo) con sus cantidades reales.
          Las universidades nuevas aparecen solas cuando tengan cursos. */}
      {tabActiva === 'cursos' && (
        <div className="mb-6 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-start gap-2 flex-wrap" role="group" aria-label="Filtrar cursos por universidad objetivo">
            <span className="flex items-center gap-1.5 py-1.5 pr-1 text-xs font-semibold text-slate-600 shrink-0">
              <Filter className="w-4 h-4 text-slate-500" />
              Universidad:
            </span>
            <button
              type="button"
              aria-pressed={filtroUniversidad === 'todos'}
              onClick={() => setFiltroUniversidad('todos')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                filtroUniversidad === 'todos'
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              Todos ({cursos.length})
            </button>
            {universidadesCatalogo.map((grupo) => (
              <button
                type="button"
                key={grupo.clave || 'sin-asignar'}
                aria-pressed={filtroUniversidad === grupo.clave}
                title={
                  grupo.clave
                    ? `Universidad: ${resolverNombreUniversidadCurso(grupo.clave)}`
                    : 'Cursos sin universidad asignada'
                }
                onClick={() => setFiltroUniversidad(grupo.clave)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  filtroUniversidad === grupo.clave
                    ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                {grupo.etiqueta || 'Sin asignar'} ({grupo.total})
              </button>
            ))}
          </div>
        </div>
      )}
      {/* FILTROS DE HORARIOS: universidad (Ciclo.UniversidadObjetivo, chip
          dinámico con contadores reales) + ciclo (selector dependiente; el
          cambio de universidad resetea el ciclo incompatible). */}
      {tabActiva === 'turnos' && (
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 min-w-0">
            <div className="flex items-start gap-2 flex-wrap" role="group" aria-label="Filtrar horarios por universidad del ciclo">
              <span className="flex items-center gap-1.5 py-1.5 pr-1 text-xs font-semibold text-slate-600 shrink-0">
                <Filter className="w-4 h-4 text-slate-500" />
                Universidad:
              </span>
              <button
                type="button"
                aria-pressed={filtroUniversidadTurnos === 'todas'}
                title="Horarios de todas las universidades"
                onClick={() => cambiarUniversidadTurnosFiltro('todas')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  filtroUniversidadTurnos === 'todas'
                    ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                Todas ({turnos.length})
              </button>
              {universidadesHorarios.map((grupo) => (
                <button
                  type="button"
                  key={grupo.clave || 'sin-universidad'}
                  aria-pressed={filtroUniversidadTurnos === grupo.clave}
                  title={grupo.clave ? `Universidad: ${resolverNombreUniversidadCurso(grupo.clave)}` : 'Horarios sin universidad identificable'}
                  onClick={() => cambiarUniversidadTurnosFiltro(grupo.clave)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    filtroUniversidadTurnos === grupo.clave
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {grupo.etiqueta || 'Sin asignar'} ({grupo.total})
                </button>
              ))}
              {hayFiltrosHorarios && (
                <span className="ml-auto py-1.5 text-[11px] font-semibold text-slate-500 shrink-0">
                  {turnosFiltrados.length} mostrados
                </span>
              )}
            </div>
          </div>
          {ciclosHorariosFiltrados.length > 0 && (
            <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs shrink-0 max-w-full">
              <span className="font-semibold text-slate-600">Ciclo:</span>
              <select
                value={filtroCicloTurnos}
                onChange={(e) => setFiltroCicloTurnos(e.target.value)}
                aria-label="Filtrar horarios por ciclo"
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer min-w-0 max-w-[16rem]"
              >
                <option value="todos">
                  {filtroUniversidadTurnos === 'todas'
                    ? `Todos los ciclos (${totalCiclosFiltroTurnos})`
                    : `Todos los ciclos de ${etiquetaUniversidadTurnosFiltro} (${totalCiclosFiltroTurnos})`}
                </option>
                {ciclosHorariosFiltrados.map((ciclo) => (
                  <option key={ciclo.idCiclo} value={ciclo.idCiclo}>
                    {ciclo.nombre} ({ciclo.total})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      {/* CICLOS */}
      {tabActiva === 'ciclos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {ciclosFiltrados.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 py-12 text-center bg-white rounded-xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-teal-700" />
              </div>
              <p className="text-base font-bold text-slate-900">No hay ciclos disponibles</p>
              <p className="text-sm text-slate-600 mt-1">No existen ciclos que coincidan con la búsqueda actual.</p>
            </div>
          ) : (
            ciclosFiltrados.map((ciclo) => {
              const capacidad = Number(ciclo.capacidad || 0);
              const totalAlumnos = Number(ciclo.totalAlumnos ?? ciclo.alumnos ?? 0);
              const vacantes = Math.max(capacidad - totalAlumnos, 0);
              return (
                <div key={ciclo.idCiclo} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <UniversidadLogo ciclo={ciclo} />
                    <div className="flex items-center gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${ciclo.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {ciclo.estado}
                      </span>
                      {puedeGestionar && (
                      <>
                      <button type="button" title="Editar ciclo" onClick={() => abrirEditarCiclo(ciclo)} className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Eliminar ciclo" onClick={() => handleEliminarCiclo(ciclo.idCiclo, ciclo.nombre)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-4">{ciclo.nombre}</h3>
                  <div className="space-y-2.5 mt-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between"><span>Turno</span><strong className="text-slate-900">{ciclo.turno}</strong></div>
                    <div className="flex items-center justify-between"><span>Horario</span><strong className="text-slate-900">{ciclo.horario}</strong></div>
                    <div className="flex items-center justify-between"><span>Estudiantes</span><strong className="text-slate-900">{totalAlumnos}</strong></div>
                    <div className="flex items-center justify-between"><span>Vacantes</span><strong className="text-teal-700">{capacidad > 0 ? `${vacantes} / ${capacidad}` : 'Sin límite'}</strong></div>
                    <div className="flex items-center justify-between"><span>Cursos</span><strong className="text-slate-900">{ciclo.cursos}</strong></div>
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
            <div className="md:col-span-2 xl:col-span-3 py-12 text-center bg-white rounded-xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <CalendarClock className="w-6 h-6 text-teal-700" />
              </div>
              <p className="text-base font-bold text-slate-900">No hay horarios disponibles</p>
              <p className="text-sm text-slate-600 mt-1">
                {hayFiltrosHorarios
                  ? (busqueda.trim()
                    ? 'No existen horarios que coincidan con la búsqueda y los filtros actuales.'
                    : cicloTurnoFiltroActivo
                      ? `No hay horarios para ${cicloTurnoFiltroActivo.nombre}.`
                      : 'No hay horarios para esta universidad.')
                  : 'Todavía no hay horarios registrados.'}
              </p>
            </div>
          ) : (
            turnosFiltrados.map((turno) => {
              // Identificación discreta de la universidad del ciclo:
              // SIEMPRE Ciclo.UniversidadObjetivo (nunca el código del curso).
              const claveTurno = claveUniversidadHorario(turno, mapaCiclosHorarios);
              const siglaTurno = claveTurno ? etiquetaDesdeClave(claveTurno, ETIQUETAS_UNIVERSIDAD) : '';
              const nombreUniversidadTurno = claveTurno ? resolverNombreUniversidadCurso(claveTurno) : '';
              return (
                <div key={turno.idHorario ?? turno.IdHorario} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <CursoIcon nombre={turno.curso} className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {puedeGestionar && (
                      <>
                      <button type="button" title="Editar horario" onClick={() => abrirEditarTurno(turno)} className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Eliminar horario" onClick={() => handleEliminarTurno(turno.idHorario, `${turno.curso} - ${turno.diaSemana}`)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-4">{turno.curso}</h3>
                  <p
                    className="text-sm text-slate-600 mt-1 truncate"
                    title={claveTurno ? `Universidad: ${nombreUniversidadTurno} · Ciclo: ${turno.ciclo}` : turno.ciclo}
                  >
                    {siglaTurno ? `${siglaTurno} · ` : ''}{turno.ciclo}
                  </p>
                  <div className="space-y-2.5 mt-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between"><span>Día</span><strong className="text-slate-900">{turno.diaSemana}</strong></div>
                    <div className="flex items-center justify-between"><span>Horario</span><strong className="text-slate-900">{turno.horaInicio} - {turno.horaFin}</strong></div>
                    <div className="flex items-center justify-between"><span>Orden</span><strong className="text-teal-700">{turno.orden}</strong></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* TABLA ASIGNACIONES */}
      {tabActiva === 'asignaciones' && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
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
                    <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-teal-700" />
                    </div>
                    <p className="text-base font-bold text-slate-900">No hay cargas docentes</p>
                    <p className="text-sm text-slate-600 mt-1">No se encontraron asignaciones de docentes con el filtro aplicado.</p>
                  </td>
                </tr>
              ) : (
                asignacionesFiltradas.map((asig) => (
                  <tr key={asig.idAsignacion} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs border border-teal-100">
                        {(asig.docente || 'DC').slice(0, 2).toUpperCase()}
                      </div>
                      {asig.docente}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                        {asig.curso}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{asig.aula}</td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {asig.horas} horas lectivas
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {puedeGestionar && (
                      <button type="button" title="Eliminar asignación" onClick={() => handleEliminarAsignacion(asig.idAsignacion, asig.docente, asig.curso)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
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
            <div className="col-span-3 py-12 text-center bg-white rounded-xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <School className="w-6 h-6 text-teal-700" />
              </div>
              <p className="text-base font-bold text-slate-900">No hay aulas registradas</p>
              <p className="text-sm text-slate-600 mt-1">Esta sección todavía no tiene aulas disponibles para mostrar.</p>
            </div>
          ) : (
            aulasFiltradas.map((aula) => (
              <div key={aula.idAula} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                      <School className="w-5 h-5" />
                    </span>
                    <div className="flex items-center gap-1">
                      {puedeGestionar && (
                      <>
                      <button type="button" title="Editar Aula" onClick={() => abrirEditarAula(aula)} className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Eliminar Aula" onClick={() => handleEliminarAula(aula.idAula, aula.nombre)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{aula.nombre}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{aula.nivel}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-500" /> Capacidad:</span>
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
            <div className="col-span-3 py-12 text-center bg-white rounded-xl border border-slate-200">
              <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-teal-700" />
              </div>
              <p className="text-base font-bold text-slate-900">No hay cursos registrados</p>
              <p className="text-sm text-slate-600 mt-1">
                {busqueda.trim()
                  ? 'No se encontraron cursos que coincidan con la búsqueda.'
                  : universidadFiltrada
                    ? 'No hay cursos académicos registrados para esta universidad.'
                    : 'Todavía no hay cursos académicos registrados.'}
              </p>
              {universidadFiltrada && !busqueda.trim() && puedeGestionar && (
                <p className="text-xs text-slate-500 mt-2">Usa «Nuevo Curso» para registrar el primero.</p>
              )}
            </div>
          ) : (
            cursosFiltrados.map((c) => {
              // Identificación por universidad: SIEMPRE del campo
              // UniversidadObjetivo (nunca del prefijo del código).
              const claveUniversidad = claveUniversidadCurso(c);
              const siglaUniversidad = etiquetaDesdeClave(claveUniversidad, ETIQUETAS_UNIVERSIDAD);
              const nombreUniversidadCurso = claveUniversidad
                ? resolverNombreUniversidadCurso(claveUniversidad)
                : 'Sin universidad asignada';
              const etiquetaCodigoCurso = [siglaUniversidad, c.codigo].filter(Boolean).join(' · ');
              return (
                <div key={c.idCurso} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-11 h-11 shrink-0 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                          <CursoIcon nombre={c.nombre} className="w-5 h-5" />
                        </span>
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-teal-700 rounded-md truncate"
                          title={`${nombreUniversidadCurso}${c.codigo ? ` · Código: ${c.codigo}` : ''}`}
                        >
                          {etiquetaCodigoCurso}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {puedeGestionar && (
                        <>
                        <button type="button" title="Editar Curso" onClick={() => abrirEditarCurso(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" title="Eliminar Curso" onClick={() => handleEliminarCurso(c.idCurso, c.nombre)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        </>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{c.nombre}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{c.descripcion}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <span
                      className="text-xs text-slate-500 font-medium text-right"
                      title={`Universidad objetivo del curso${siglaUniversidad ? ` (${siglaUniversidad})` : ''}`}
                    >
                      {nombreUniversidadCurso}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* MODAL CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/80 flex items-center justify-center p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Gestión académica" tabIndex={-1} className={`bg-white rounded-xl p-6 w-full ${tabActiva === 'ciclos' ? 'max-w-5xl' : 'max-w-md'} max-h-[94vh] overflow-y-auto shadow-xl border border-slate-200`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {tabActiva === 'asignaciones' && 'Asignar Docente a Curso y Ciclo'}
                {tabActiva === 'aulas' && (editandoId ? 'Editar Aula' : 'Registrar Nueva Aula')}
                {tabActiva === 'cursos' && (editandoId ? 'Editar Curso' : 'Registrar Nuevo Curso')}
                {tabActiva === 'ciclos' && (editandoId ? 'Editar Ciclo' : 'Registrar Nuevo Ciclo')}
                {tabActiva === 'turnos' && (editandoId ? 'Editar Horario' : 'Registrar Nuevo Horario')}
              </h3>
              <button type="button" aria-label="Cerrar" disabled={guardandoCiclo || guardandoDatos} onClick={() => setModalAbierto(false)} className="text-slate-500 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={tabActiva === 'ciclos' ? (event) => {
              event.preventDefault();
              if (pasoCiclo === 6) guardarCiclo();
              else siguientePasoCiclo();
            } : handleGuardar} className="space-y-4">
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
                                numero === pasoCiclo ? 'bg-teal-600 text-white' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {numero < pasoCiclo ? '✓' : numero}
                              </span>
                              <span className={`text-[11px] font-semibold ${numero === pasoCiclo ? 'text-teal-700' : 'text-slate-500'}`}>{nombre}</span>
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
                      <CampoCiclo label="Universidad objetivo">
                        <select value={formCiclo.universidadObjetivo} onChange={(e) => cambiarUniversidadCiclo(e.target.value)} className="campo-ciclo">
                          {[...Object.keys(UNIVERSIDADES), 'Preuniversitario'].map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </CampoCiclo>
                      <p className="md:col-span-2 text-[11px] text-slate-500">Al cambiar la universidad objetivo se retiran de la oferta los cursos seleccionados que no le correspondan. Nombre, fechas y horario no se alteran.</p>
                    </div>
                  )}
                  {pasoCiclo === 2 && (
                    <div>
                      <CampoCiclo label="Nombre oficial del ciclo">
                        <input value={formCiclo.nombre} maxLength={100} onChange={(e) => setFormCiclo({ ...formCiclo, nombre: e.target.value })} className="campo-ciclo" placeholder={`Ciclo ${formCiclo.universidadObjetivo} ${anioSugerido}`} />
                      </CampoCiclo>
                      <button type="button" onClick={() => setFormCiclo({ ...formCiclo, nombre: `Ciclo ${formCiclo.universidadObjetivo} ${anioSugerido}` })} className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-800">
                        Usar nombre sugerido
                      </button>
                    </div>
                  )}
                  {pasoCiclo === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CampoCiclo label="Fecha de inicio"><input type="date" value={formCiclo.fechaInicio} onChange={(e) => setFormCiclo({ ...formCiclo, fechaInicio: e.target.value })} className="campo-ciclo" /></CampoCiclo>
                      <CampoCiclo label="Fecha de fin"><input type="date" value={formCiclo.fechaFin} onChange={(e) => setFormCiclo({ ...formCiclo, fechaFin: e.target.value })} className="campo-ciclo" /></CampoCiclo>
                      <CampoCiclo label="Capacidad"><input type="number" min="1" max="500" value={formCiclo.capacidad} onChange={(e) => setFormCiclo({ ...formCiclo, capacidad: Number(e.target.value) })} className="campo-ciclo" /></CampoCiclo>
                      <CampoCiclo label="Precio (S/)"><input type="number" min="0" max="9999.99" step="0.01" placeholder="0.00" value={formCiclo.precio} onChange={(e) => setFormCiclo({ ...formCiclo, precio: e.target.value })} className="campo-ciclo" /></CampoCiclo>
                    </div>
                  )}
                  {pasoCiclo === 4 && (
                    <div>
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <p className="text-xs text-slate-500">Selecciona los cursos que formarán parte de la oferta académica.</p>
                        <span className="text-[11px] font-bold text-teal-700 shrink-0">Oferta académica · {formCiclo.universidadObjetivo}</span>
                      </div>
                      {avisoOferta && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-3 text-xs text-amber-800">
                          {avisoOferta}
                        </div>
                      )}
                      {cursosUniversidad.length === 0 ? (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                          No hay cursos configurados para esta universidad. Puedes crearlos en la pestaña «Cursos Académicos» asignándole la universidad objetivo correspondiente.
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] font-semibold text-slate-500 mb-2">
                            {formCiclo.cursosSeleccionados.length} de {cursosUniversidad.length} cursos de {formCiclo.universidadObjetivo} seleccionados
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                            {cursosUniversidad.map((curso) => {
                              const seleccionado = formCiclo.cursosSeleccionados.includes(curso.idCurso);
                              return (
                                <button key={curso.idCurso} type="button" onClick={() => toggleCursoCiclo(curso.idCurso)} className={`p-3 rounded-xl border text-left ${seleccionado ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                                  <div className="flex justify-between gap-3">
                                    <div><p className="text-xs font-bold text-slate-900">{curso.nombre}</p><p className="text-[11px] text-slate-500">{curso.codigo}</p></div>
                                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${seleccionado ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>{seleccionado ? '✓' : ''}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {pasoCiclo === 5 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CampoCiclo label="Turno">
                          <select value={formCiclo.turno} onChange={(e) => setFormCiclo({ ...formCiclo, turno: e.target.value })} className="campo-ciclo"><option>Mañana</option><option>Tarde</option><option>Noche</option></select>
                        </CampoCiclo>
                        <CampoCiclo label="Hora de inicio">
                          <input type="time" required value={formCiclo.horaInicio} onChange={(e) => { setFormCiclo({ ...formCiclo, horaInicio: e.target.value }); setAvisoHorario(''); }} />
                        </CampoCiclo>
                        <CampoCiclo label="Hora de fin">
                          <input type="time" required value={formCiclo.horaFin} onChange={(e) => { setFormCiclo({ ...formCiclo, horaFin: e.target.value }); setAvisoHorario(''); }} />
                        </CampoCiclo>
                        <CampoCiclo label="Días de clase"><input value={formCiclo.diasClase} onChange={(e) => setFormCiclo({ ...formCiclo, diasClase: e.target.value })} className="campo-ciclo" placeholder="Lunes a Viernes" /></CampoCiclo>
                        <CampoCiclo label="Prefijo de código"><input value={formCiclo.prefijoCodigo} onChange={(e) => setFormCiclo({ ...formCiclo, prefijoCodigo: e.target.value.toUpperCase() })} className="campo-ciclo" placeholder="UNMSM" /></CampoCiclo>
                      </div>
                      {avisoHorario && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                          {avisoHorario}
                        </div>
                      )}
                      <p className="text-xs text-slate-500">El horario del ciclo se guarda como <b>HH:mm - HH:mm</b>. Los días de dictado se registran en «Turnos y Horarios».</p>
                    </div>
                  )}
                  {pasoCiclo === 6 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-3">Resumen</h4>
                        <div className="space-y-2 text-xs text-slate-600">
                          <p><b>Ciclo:</b> {formCiclo.nombre}</p>
                          <p><b>Universidad:</b> {formCiclo.universidadObjetivo}</p>
                          <p>
                            <b>Cursos ({cursosResumen.length}):</b>{' '}
                            {cursosResumen.length > 0 ? cursosResumen.map((curso) => `${curso.nombre} (${curso.codigo})`).join(', ') : 'Sin cursos seleccionados'}
                          </p>
                          <p><b>Fechas:</b> {formCiclo.fechaInicio} → {formCiclo.fechaFin}</p>
                          <p><b>Turno:</b> {formCiclo.turno} · {formCiclo.horaInicio} - {formCiclo.horaFin}</p>
                          <p><b>Capacidad:</b> {formCiclo.capacidad}</p>
                          <p><b>Precio:</b> S/ {Number(formCiclo.precio || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Checklist de publicación</h4>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${puedePublicarCiclo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {puedePublicarCiclo ? 'Listo para publicar' : 'Requisitos pendientes'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {checklistPublicacion.map(({ texto, ok }) => (
                            <div key={texto} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${ok ? 'border-emerald-100 bg-emerald-50/60' : 'border-amber-100 bg-amber-50/60'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${ok ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                  {ok ? '✓' : '!'}
                                </span>
                                <span className={`text-xs font-semibold ${ok ? 'text-slate-700' : 'text-amber-800'}`}>{texto}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <label className="mt-4 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={Boolean(formCiclo.publicar)} disabled={guardandoCiclo} onChange={(e) => setFormCiclo((prev) => ({ ...prev, publicar: e.target.checked }))} className="accent-teal-600" />
                          <span>Publicar ciclo al guardar (visible en Notas, Asistencia y Morosidad)</span>
                        </label>
                        {!formCiclo.publicar && (
                          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                            Se guardará como borrador: no aparecerá en Notas, Asistencia, Calificaciones, Morosidad ni Materiales hasta que lo publiques.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => pasoCiclo === 1 ? setModalAbierto(false) : setPasoCiclo((prev) => prev - 1)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                      {pasoCiclo === 1 ? 'Cancelar' : 'Anterior'}
                    </button>
                    {pasoCiclo < 6 ? (
                      <button type="button" onClick={siguientePasoCiclo} className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">Siguiente</button>
                    ) : (
                      <button type="button" disabled={guardandoCiclo} onClick={guardarCiclo} className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg transition-colors">
                        {guardandoCiclo ? 'Guardando...' : editandoId ? 'Guardar Cambios' : formCiclo.publicar ? 'Crear y publicar ciclo' : 'Guardar como borrador'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {tabActiva === 'turnos' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Universidad del ciclo</label>
                    {/* Mismo catálogo canónico del wizard. La universidad no
                        se detecta por prefijos: la entrega el ciclo. */}
                    <select
                      required
                      value={formTurno.universidad}
                      onChange={(e) => cambiarUniversidadTurnoModal(e.target.value)}
                      className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer"
                    >
                      <option value="" disabled>Selecciona la universidad del ciclo...</option>
                      {OPCIONES_UNIVERSIDAD_CURSO.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ciclo</label>
                    <select
                      required
                      value={formTurno.idCiclo}
                      disabled={!formTurno.universidad}
                      onChange={(e) => cambiarCicloTurnoModal(e.target.value)}
                      className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formTurno.universidad ? 'Selecciona un ciclo de esa universidad...' : 'Primero selecciona la universidad...'}
                      </option>
                      {ciclosModalTurnos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre}{c.turno ? ` · ${c.turno}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Curso (oferta del ciclo)</label>
                    {/* Solo cursos de CicloCurso para el ciclo elegido; el
                        backend revalida la pertenencia y la universidad. Si el
                        horario guardado usa un curso fuera de la oferta
                        actual, se muestra marcado para normalizarlo. */}
                    <select
                      required
                      value={formTurno.idCurso}
                      disabled={!formTurno.idCiclo || cargandoCursosCicloTurnos}
                      onChange={(e) => setFormTurno({ ...formTurno, idCurso: e.target.value })}
                      className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    >
                      {!formTurno.idCiclo && <option value="">Selecciona primero el ciclo...</option>}
                      {formTurno.idCiclo && cargandoCursosCicloTurnos && <option value="">Cargando la oferta del ciclo...</option>}
                      {formTurno.idCiclo && !cargandoCursosCicloTurnos && <option value="">Selecciona un curso de la oferta...</option>}
                      {formTurno.idCiclo && !cargandoCursosCicloTurnos && cursoTurnoFueraDeOferta && (
                        <option value={formTurno.idCurso}>{nombreCursoTurnoGuardado} (fuera de la oferta actual)</option>
                      )}
                      {cursosCicloTurnos.map((c) => (
                        <option key={c.idCurso} value={c.idCurso}>
                          {c.nombre}{c.codigo ? ` (${c.codigo})` : ''}
                        </option>
                      ))}
                    </select>
                    {errorCursosCicloTurnos && (
                      <p className="text-[11px] font-semibold text-amber-800 mt-1">{errorCursosCicloTurnos} Cambia de ciclo o vuelve a abrir el horario para reintentar.</p>
                    )}
                    {formTurno.idCiclo && !errorCursosCicloTurnos && (
                      <p className="text-[11px] text-slate-500 mt-1">Solo los cursos de la oferta del ciclo (CicloCurso), coherentes con su universidad objetivo.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Día</label>
                    <select required value={formTurno.diaNumero} onChange={(e) => {
                      const diaNumero = Number(e.target.value);
                      const dias = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                      setFormTurno({ ...formTurno, diaNumero, diaSemana: dias[diaNumero] });
                    }} className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
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
                      <input type="time" required value={formTurno.horaInicio} onChange={(e) => setFormTurno({ ...formTurno, horaInicio: e.target.value })} className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de fin</label>
                      <input type="time" required value={formTurno.horaFin} onChange={(e) => setFormTurno({ ...formTurno, horaFin: e.target.value })} className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Orden</label>
                    <input type="number" required min="1" max="100" value={formTurno.orden} onChange={(e) => setFormTurno({ ...formTurno, orden: Number(e.target.value) })} className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  </div>
                </>
              )}

              {tabActiva === 'asignaciones' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Docente</label>
                    <select required value={formAsig.idUsuario} onChange={(e) => setFormAsig({ ...formAsig, idUsuario: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                      <option value="">Selecciona un docente o tutor</option>
                      {usuarios.map((u) => <option key={u.IdUsuario ?? u.idUsuario} value={u.IdUsuario ?? u.idUsuario}>{u.NombreCompleto ?? u.Nombres ?? u.nombre ?? `Usuario ${u.IdUsuario ?? u.idUsuario}`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Ciclo</label>
                    <select required value={formAsig.idCiclo} onChange={(e) => setFormAsig({ ...formAsig, idCiclo: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                      <option value="">Selecciona un ciclo</option>
                      {ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Curso</label>
                    <select required value={formAsig.idCurso} onChange={(e) => setFormAsig({ ...formAsig, idCurso: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                      <option value="">Selecciona un curso</option>
                      {cursos.map((c) => <option key={c.idCurso} value={c.idCurso}>{c.nombre}{c.codigo ? ` (${c.codigo})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs leading-relaxed text-teal-800">
                    La carga docente se organiza por ciclo y curso. El sistema gestiona internamente el registro técnico de aula; no necesitas seleccionar ni administrar un aula.
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Horas semanales</label>
                    <input required type="number" min="1" max="30" value={formAsig.horas} onChange={(e) => setFormAsig({ ...formAsig, horas: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  </div>
                </>
              )}
              {tabActiva === 'aulas' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Identificador</label>
                    <input type="text" required placeholder="Ej: Aula QB-01" value={formAula.nombre} onChange={(e) => setFormAula({ ...formAula, nombre: e.target.value })} className="w-full text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Educativo</label>
                    <select value={formAula.nivel} onChange={(e) => setFormAula({ ...formAula, nivel: e.target.value })} className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white cursor-pointer">
                      <option value="Preuniversitario">Preuniversitario</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidad Máxima</label>
                    <input type="number" min="5" max="100" value={formAula.capacidad} onChange={(e) => setFormAula({ ...formAula, capacidad: Number(e.target.value) })} className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  </div>
                </>
              )}
              {tabActiva === 'cursos' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Curso</label>
                    <input type="text" required placeholder="Ej: Trigonometría Analítica" value={formCurso.nombre} minLength={NOMBRE_MINIMO} onChange={(e) => setFormCurso({ ...formCurso, nombre: e.target.value })} className="w-full text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Universidad Objetivo</label>
                    {/* Mismo catálogo canónico del wizard (UNIVERSIDADES +
                        Preuniversitario). La fuente de verdad de la relación
                        es el campo estructurado UniversidadObjetivo, nunca el
                        prefijo del código. Al editar un curso que ya tiene
                        universidad el cambio queda BLOQUEADO: el backend
                        (PUT /api/cursos/:id) no valida sus vínculos
                        CicloCurso y un cambio silencioso rompería la oferta. */}
                    <select
                      required
                      value={formCurso.universidadObjetivo}
                      disabled={bloquearUniversidadCurso}
                      onChange={(e) => setFormCurso({ ...formCurso, universidadObjetivo: e.target.value })}
                      className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    >
                      {!editandoId && <option value="" disabled>Selecciona la universidad objetivo...</option>}
                      {universidadFueraDeCatalogo && <option value={formCurso.universidadObjetivo}>{formCurso.universidadObjetivo}</option>}
                      {OPCIONES_UNIVERSIDAD_CURSO.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {bloquearUniversidadCurso
                        ? 'La universidad objetivo de un curso existente no se cambia aquí: protege la oferta de los ciclos que ya lo incluyen. Si ya no corresponde, crea el curso correcto y desactiva este.'
                        : universidadFueraDeCatalogo
                          ? 'La universidad registrada no pertenece al catálogo del sistema: selecciónala para normalizarla.'
                          : universidadOriginalCurso === ''
                            ? editandoId
                              ? 'Este curso no tiene universidad asignada; selecciónala para completarla.'
                              : 'El curso quedará disponible solo para los ciclos de esta universidad.'
                            : null}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código Único</label>
                    <input type="text" required placeholder="Ej: MAT-TRI" value={formCurso.codigo} minLength={2} onChange={(e) => setFormCurso({ ...formCurso, codigo: e.target.value.toUpperCase() })} className="w-full text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Breve</label>
                    <textarea rows="2" placeholder="Identidades trigonométricas y geometría analítica" value={formCurso.descripcion} onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })} className="w-full text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none" />
                  </div>
                </>
              )}
              {tabActiva !== 'ciclos' && (
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" disabled={!formularioActualValido || guardandoDatos} className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-sm transition ${formularioActualValido && !guardandoDatos ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                    {guardandoDatos ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Registrar'}
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
