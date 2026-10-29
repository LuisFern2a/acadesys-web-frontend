import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  Loader2,
  FileText,
  RefreshCcw,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { API_URL, actualizarMiUsuario, eliminarMiFoto, obtenerMiIntranetAlumno, obtenerMiUsuario } from '../services/api';
import { promedioCalificaciones, escalaPorUniversidad } from '../utils/calificaciones';
import { normalizarCodigoAlumno, resolverUrlFoto, valorTexto } from '../utils/perfil';
import PanelReinscripcionAlumno from '../components/PanelReinscripcionAlumno';
import PanelPagosAlumno from '../components/PanelPagosAlumno';

const VIEWS = {
  home: 'student-home',
  ciclo: 'student-ciclo',
  horario: 'student-horario',
  cursos: 'student-cursos',
  notas: 'student-notas',
  materiales: 'student-materiales',
  pagos: 'student-pagos',
  perfil: 'student-perfil'
};

const normalizarFecha = (valor) => {
  if (!valor) return '—';
  const fecha = String(valor).slice(0, 10);
  const partes = fecha.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
};

// Avatar del alumno: el contenedor se renderiza SIEMPRE. Si no hay imagen o
// la imagen falla, muestra las iniciales sobre el fondo teal de la marca.
function AvatarAlumno({ src, iniciales }) {
  const [error, setError] = useState(false);
  const mostrarImagen = Boolean(src) && !error;

  return (
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-teal-600 text-white flex items-center justify-center overflow-hidden shrink-0 text-2xl font-semibold">
      {mostrarImagen ? (
        <img
          src={src}
          alt="Foto de perfil"
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{iniciales}</span>
      )}
    </div>
  );
}

// Tipo de archivo derivado EXCLUSIVAMENTE del dato real (tipoMime o extensión
// del nombre/URL). No se inventan tipos.
const tipoArchivoMaterial = (material) => {
  const mime = String(material?.tipoMime || '').toLowerCase();
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('wordprocessing') || mime.includes('msword')) return 'DOCX';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPTX';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'XLSX';
  if (mime.startsWith('image/')) return 'IMG';
  const nombre = String(material?.nombreArchivo || material?.urlArchivo || '').split('?')[0];
  const extension = nombre.includes('.') ? nombre.split('.').pop() : '';
  return extension ? extension.toUpperCase().slice(0, 4) : 'ARCHIVO';
};

function BotonDescarga({ material }) {
  const url = material?.urlArchivo;

  if (!url) {
    return <span className="text-[11px] font-semibold text-slate-400">No disponible</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition-colors hover:border-teal-300 hover:text-teal-700"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      Descargar
    </a>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5">
        <span className="p-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );
}

export default function StudentIntranetPage({ view, setActiveTab, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursoMaterial, setCursoMaterial] = useState('Todos');
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const cargar = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const result = await obtenerMiIntranetAlumno({ force: force === true });
      setData(result);
    } catch (err) {
      setError(err.message || 'No fue posible cargar tu portal del alumno.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // La vista de pagos usa su propio endpoint y no depende del expediente académico.
    if (view !== VIEWS.pagos) cargar();
  }, [cargar, view]);

  // Datos complementarios del usuario autenticado: teléfono y foto persistida.
  // /api/alumno/me no devuelve esos campos; /api/usuarios/me sí es el endpoint
  // canónico del perfil y está autorizado para el alumno. Un fallo aquí no
  // invalida el expediente académico ya cargado.
  const consultarPerfilUsuario = useCallback(async () => {
    try {
      const respuesta = await obtenerMiUsuario();
      const registro = respuesta?.data ?? respuesta;
      if (registro && typeof registro === 'object' && !Array.isArray(registro)) {
        return registro;
      }
    } catch {
      // Silencioso a propósito: la foto/teléfono son datos complementarios.
    }
    return null;
  }, []);

  useEffect(() => {
    if (view !== VIEWS.perfil) return undefined;
    let activo = true;
    consultarPerfilUsuario().then((registro) => {
      if (activo && registro) setPerfilUsuario(registro);
    });
    return () => {
      activo = false;
    };
  }, [view, consultarPerfilUsuario]);

  // Manejo de cambio de archivo para foto de perfil
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      e.target.value = '';
      alert('Formato de imagen no válido. Use JPG, PNG o WebP.');
      return;
    }

    // Validación de tamaño (máximo 2 MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      e.target.value = '';
      alert('La imagen no puede superar los 2 MB.');
      return;
    }

    // Validación de archivo vacío
    if (file.size === 0) {
      e.target.value = '';
      alert('El archivo está vacío.');
      return;
    }

    setSelectedFile(file);

    // Crear preview local usando FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result || null);
    };
    reader.onerror = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      e.target.value = '';
      alert('No se pudo leer la imagen seleccionada.');
    };
    reader.readAsDataURL(file);
  };

  // Subir foto al backend.
  // El contrato implementado en PUT /api/usuarios/me recibe base64 SIN el
  // prefijo "data:...;base64,". Se conserva la foto anterior si algo falla.
  const handleFotoUpload = async () => {
    if (!selectedFile || cargandoPerfil) return;
    setCargandoPerfil(true);

    const leerArchivoComoDataUrl = () =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evento) => resolve(String(evento.target?.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(selectedFile);
      });

    try {
      const dataUrl = await leerArchivoComoDataUrl();
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      if (!base64) throw new Error('El archivo no contiene una imagen válida.');

      const resultado = await actualizarMiUsuario({
        fotoBase64: base64,
        tipoMime: selectedFile.type || 'image/jpeg',
        tamanoBytes: selectedFile.size,
      });

      const fotoGuardada = resultado?.usuario?.fotoUrl || resultado?.usuario?.FotoUrl || null;
      if (resultado?.usuario) {
        setPerfilUsuario((actual) => ({
          ...(actual || {}),
          ...resultado.usuario,
          ...(fotoGuardada ? { fotoUrl: fotoGuardada, FotoUrl: fotoGuardada } : {}),
        }));
      }

      // Refrescar expediente y perfil desde el servidor (fuente de verdad).
      await cargar();
      const perfilActualizado = await consultarPerfilUsuario();
      if (perfilActualizado) setPerfilUsuario(perfilActualizado);

      setSelectedFile(null);
      setPreviewUrl(null);
      const input = document.getElementById('foto-perfil-input');
      if (input) input.value = '';

      alert('Foto de perfil actualizada correctamente.');
    } catch (err) {
      alert('No fue posible subir la foto: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargandoPerfil(false);
    }
  };

  // Elimina la foto persistida. Solo se ofrece cuando existe una foto guardada.
  const handleEliminarFoto = async () => {
    if (cargandoPerfil) return;
    if (!window.confirm('¿Eliminar tu foto de perfil? Se mostrarán tus iniciales.')) return;

    setCargandoPerfil(true);
    try {
      await eliminarMiFoto();
      setPerfilUsuario((actual) => (actual ? { ...actual, fotoUrl: null, FotoUrl: null } : actual));
      setData((actual) => (actual?.usuario ? { ...actual, usuario: { ...actual.usuario, fotoUrl: null } } : actual));
      setSelectedFile(null);
      setPreviewUrl(null);
      const perfilActualizado = await consultarPerfilUsuario();
      if (perfilActualizado) setPerfilUsuario(perfilActualizado);
      alert('Foto de perfil eliminada.');
    } catch (err) {
      alert('No fue posible eliminar la foto: ' + (err.message || 'Error desconocido'));
    } finally {
      setCargandoPerfil(false);
    }
  };

  // Cancela la selección local sin tocar la foto ya guardada en el servidor.
  const cancelarFoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    const input = document.getElementById('foto-perfil-input');
    if (input) input.value = '';
  };

  const cursos = Array.isArray(data?.cursos) ? data.cursos : [];
  const notas = Array.isArray(data?.notas?.historial) ? data.notas.historial : [];
  const materiales = Array.isArray(data?.materiales) ? data.materiales : [];
  const horarios = Array.isArray(data?.horarioDetalle) ? data.horarioDetalle : [];
  const promedio = promedioCalificaciones(notas.map((nota) => nota.calificacion ?? nota.Calificacion));
  const ranking = data?.notas?.puestoRanking ?? null;
  const ciclo = data?.ciclo;
  // Código normalizado UNA sola vez. El JSX lo pinta tal cual, sin volver a
  // concatenar "ACAD-" (eso producía el prefijo duplicado).
  const codigoAlumno = normalizarCodigoAlumno(
    data?.usuario?.codigoUsuario ||
      perfilUsuario?.CodigoUsuario ||
      perfilUsuario?.codigoUsuario ||
      user?.codigoUsuario
  );
  const nombreAlumno =
    data?.usuario?.nombreCompleto ||
    perfilUsuario?.NombreCompleto ||
    perfilUsuario?.nombreCompleto ||
    user?.nombre ||
    'Alumno';
  const inicialesAlumno = nombreAlumno.trim().slice(0, 2).toUpperCase() || 'AL';

  // Prioridad de imagen: preview local → foto persistida → iniciales.
  // La foto persistida puede venir de /api/alumno/me o de /api/usuarios/me.
  const fotoPersistida =
    data?.usuario?.fotoUrl ||
    perfilUsuario?.fotoUrl ||
    perfilUsuario?.FotoUrl ||
    null;
  const fotoAlumnoSrc = previewUrl || resolverUrlFoto(fotoPersistida, API_URL);

  // Datos personales: se completan con /api/usuarios/me (el expediente del
  // alumno no incluye teléfono ni todos los campos de contacto).
  const nombresAlumno = data?.usuario?.nombres || perfilUsuario?.Nombres || perfilUsuario?.nombres;
  const apellidoPaternoAlumno =
    data?.usuario?.apellidoPaterno || perfilUsuario?.ApellidoPaterno || perfilUsuario?.apellidoPaterno;
  const apellidoMaternoAlumno =
    data?.usuario?.apellidoMaterno || perfilUsuario?.ApellidoMaterno || perfilUsuario?.apellidoMaterno;
  const dniAlumno = data?.usuario?.dni || perfilUsuario?.DNI || perfilUsuario?.dni;
  const correoAlumno =
    data?.usuario?.correo ||
    perfilUsuario?.CorreoElectronico ||
    perfilUsuario?.correo ||
    perfilUsuario?.Correo;
  const telefonoAlumno =
    data?.usuario?.celular ||
    data?.usuario?.telefono ||
    perfilUsuario?.Celular ||
    perfilUsuario?.celular;

  // Escala máxima para el componente de notas
  const escalaMaxima = ciclo ? escalaPorUniversidad(ciclo?.universidadObjetivo || '') : '';

  // Filtro por curso: es el único filtro con datos reales (los materiales del
  // alumno ya vienen acotados a su ciclo activo y siempre son PDF).
  const cursosMaterial = Array.from(
    new Set(materiales.map((m) => m.curso).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'es'));
  const conteoCurso = materiales.reduce((acc, m) => {
    const clave = m.curso || 'General';
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});
  const filtroCurso =
    cursoMaterial !== 'Todos' && cursosMaterial.includes(cursoMaterial)
      ? cursoMaterial
      : 'Todos';
  const materialesFiltrados =
    filtroCurso === 'Todos'
      ? materiales
      : materiales.filter((m) => (m.curso || 'General') === filtroCurso);

  const tituloView = useMemo(() => ({
    [VIEWS.home]: 'Inicio',
    [VIEWS.ciclo]: 'Mi ciclo',
    [VIEWS.horario]: 'Mi horario',
    [VIEWS.cursos]: 'Mis cursos',
    [VIEWS.notas]: 'Calificaciones',
    [VIEWS.materiales]: 'Materiales de Estudio',
    [VIEWS.pagos]: 'Mis pagos',
    [VIEWS.perfil]: 'Mi perfil'
  }[view] || 'Inicio'), [view]);

  // Independiente del expediente: un fallo en datos académicos no debe ocultar la vista de pagos.
  if (view === VIEWS.pagos) {
    return <PanelPagosAlumno />;
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-teal-700" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-500">Cargando tu portal del alumno...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto p-6 rounded-xl bg-white border border-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">No pudimos cargar tu expediente</h1>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
              <button
                type="button"
                onClick={cargar}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-xs font-bold text-white hover:bg-teal-700"
              >
                <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ciclo) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto p-6 rounded-xl bg-white border border-slate-200">
          <span className="inline-flex p-2.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-4">Todavía no tienes un ciclo activo</h1>
          <p className="text-sm text-slate-500 mt-2">
            Tu cuenta existe, pero aún no encontramos una matrícula activa para mostrar tu información preuniversitaria. Comunícate con la administración de la academia.
          </p>
        </div>
      </div>
    );
  }

  const cycleSummary = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-5 rounded-xl bg-white border border-slate-200">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ciclo</span>
        <p className="text-base font-bold text-slate-900 mt-2">{ciclo.nombre}</p>
      </div>
      <div className="p-5 rounded-xl bg-white border border-slate-200">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Turno y horario</span>
        <p className="text-base font-bold text-slate-900 mt-2">{ciclo.turno || '—'}</p>
        <p className="text-xs text-slate-500 mt-1">{ciclo.horario || '—'}</p>
      </div>
      <div className="p-5 rounded-xl bg-white border border-slate-200">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Universidad objetivo</span>
        <p className="text-base font-bold text-slate-900 mt-2">{ciclo.universidadObjetivo || 'Preuniversitario'}</p>
        <p className="text-xs text-slate-500 mt-1">{ciclo.diasClase || 'Horario institucional'}</p>
      </div>
    </div>
  );

  const header = (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="text-teal-700 text-[11px] font-bold uppercase tracking-[0.16em]">Portal del Estudiante</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">{tituloView}</h1>
        <p className="text-sm text-slate-500 mt-2">
          {nombreAlumno} · {codigoAlumno || 'Sin código'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => cargar(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
      >
        <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
        Actualizar
      </button>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {header}

        {view === VIEWS.home && (
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Matrícula activa
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-4">
                    Hola, {data?.usuario?.nombres || user?.nombre || 'estudiante'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                    Este es tu espacio personal. Aquí solo verás la información correspondiente a tu matrícula y a tu ciclo actual.
                  </p>
                </div>
                <div className="min-w-[220px] p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mi ciclo</p>
                  <p className="text-lg font-bold text-slate-900 mt-2">{ciclo.nombre}</p>
                  <p className="text-xs text-teal-700 mt-1">{ciclo.universidadObjetivo}</p>
                </div>
              </div>
            </div>

            {cycleSummary}

            <PanelReinscripcionAlumno
              user={user}
              estudiante={{
                nombres: data?.usuario?.nombres || perfilUsuario?.Nombres || perfilUsuario?.nombres || user?.nombres,
                apellidoPaterno: data?.usuario?.apellidoPaterno || perfilUsuario?.ApellidoPaterno || perfilUsuario?.apellidoPaterno || user?.apellidoPaterno,
                apellidoMaterno: data?.usuario?.apellidoMaterno || perfilUsuario?.ApellidoMaterno || perfilUsuario?.apellidoMaterno || user?.apellidoMaterno,
                correo: data?.usuario?.correo || perfilUsuario?.CorreoElectronico || perfilUsuario?.correo || user?.correo,
              }}
              cicloActual={ciclo}
              onUpdated={() => cargar(true)}
            />

            <div>
              <SectionHeader icon={CalendarDays} title="Accesos rápidos" subtitle="Lo esencial para tu preparación." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  [VIEWS.horario, Clock3, 'Mi horario', 'Revisa tu turno y horario de clases.'],
                  [VIEWS.cursos, BookOpen, 'Mis cursos', `${cursos.length} cursos asignados a tu ciclo.`],
                  [VIEWS.notas, Award, 'Calificaciones', `${notas.length} registros${promedio !== null ? ` y promedio ${promedio.toFixed(2)} / ${escalaMaxima}` : ''}.`],
                  [VIEWS.materiales, FileText, 'Materiales', `${materiales.length} archivos disponibles.`]
                ].map(([id, Icon, title, text]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="text-left p-5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors"
                  >
                    <span className="inline-flex p-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-4">{title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.ciclo && (
          <div className="space-y-6">
            <SectionHeader icon={GraduationCap} title="Mi ciclo" subtitle="Esta sección corresponde únicamente a tu matrícula activa." />
            {cycleSummary}
            <div className="p-6 rounded-xl bg-white border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Detalle del ciclo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
                <div><span className="text-slate-500">Nombre:</span> <span className="text-slate-900 font-semibold">{ciclo.nombre}</span></div>
                <div><span className="text-slate-500">Universidad objetivo:</span> <span className="text-slate-900 font-semibold">{ciclo.universidadObjetivo || '—'}</span></div>
                <div><span className="text-slate-500">Turno:</span> <span className="text-slate-900 font-semibold">{ciclo.turno || '—'}</span></div>
                <div><span className="text-slate-500">Horario:</span> <span className="text-slate-900 font-semibold">{ciclo.horario || '—'}</span></div>
                <div><span className="text-slate-500">Días:</span> <span className="text-slate-900 font-semibold">{ciclo.diasClase || '—'}</span></div>
                <div><span className="text-slate-500">Inicio:</span> <span className="text-slate-900 font-semibold">{normalizarFecha(ciclo.fechaInicio)}</span></div>
                <div><span className="text-slate-500">Fin:</span> <span className="text-slate-900 font-semibold">{normalizarFecha(ciclo.fechaFin)}</span></div>
                <div><span className="text-slate-500">Inscritos en el ciclo:</span> <span className="text-slate-900 font-semibold">{ciclo.totalAlumnos ?? 0}</span></div>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.horario && (
          <div className="space-y-6">
            <SectionHeader icon={Clock3} title="Mi horario de clases" subtitle="Horario del ciclo y, cuando exista, detalle por curso." />
            {cycleSummary}
            {horarios.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-4 font-semibold">Día</th>
                      <th className="text-left px-5 py-4 font-semibold">Horario</th>
                      <th className="text-left px-5 py-4 font-semibold">Curso</th>
                      <th className="text-left px-5 py-4 font-semibold">Docente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h, index) => (
                      <tr key={h.idHorario || index} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-900">{h.diaSemana || '—'}</td>
                        <td className="px-5 py-4 text-slate-700">{h.horaInicio || '—'} - {h.horaFin || '—'}</td>
                        <td className="px-5 py-4 text-slate-700">{h.curso || '—'}</td>
                        <td className="px-5 py-4 text-slate-500">{h.docente || 'Por asignar'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-7 rounded-xl bg-white border border-slate-200 text-center">
                <Clock3 className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900 mt-3">Horario general de tu ciclo</p>
                <p className="text-xs text-slate-500 mt-1">
                  {ciclo.diasClase || 'Días de clase'} · {ciclo.horario || 'Horario por confirmar'}
                </p>
              </div>
            )}
          </div>
        )}

        {view === VIEWS.cursos && (
          <div>
            <SectionHeader icon={BookOpen} title="Mis cursos" subtitle={`Cursos asignados a ${ciclo.nombre}.`} />
            {cursos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {cursos.map((curso) => (
                  <div key={curso.idCurso} className="p-5 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">{curso.codigo || 'CURSO'}</span>
                      <span className="p-1.5 rounded-md bg-teal-50 border border-teal-100 text-teal-700">
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-3">{curso.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{curso.descripcion || 'Curso de preparación preuniversitaria.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white border border-slate-200">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900 mt-3">Aún no hay cursos vinculados a tu ciclo.</p>
                <p className="text-xs text-slate-500 mt-1">La administración debe completar la relación ciclo–curso.</p>
              </div>
            )}
          </div>
        )}

        {view === VIEWS.notas && (
          <div className="space-y-6">
            <SectionHeader icon={Award} title="Calificaciones" subtitle="Solo se muestran evaluaciones pertenecientes a tu cuenta." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Promedio general</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{promedio !== null ? promedio.toFixed(2) : '—'}</p>
                <p className="text-xs text-slate-500 mt-1">{promedio !== null ? `Escala máxima ${escalaMaxima}` : 'Sin evaluaciones registradas'}</p>
              </div>
              <div className="p-6 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Puesto</span>
                <p className="text-3xl font-bold text-teal-700 mt-2">{ranking ? `#${ranking}` : '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Dentro de tu ciclo</p>
              </div>
              <div className="p-6 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Evaluaciones</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{notas.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              {notas.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-4 font-semibold">Curso</th>
                      <th className="text-left px-5 py-4 font-semibold">Evaluación</th>
                      <th className="text-left px-5 py-4 font-semibold">Nota</th>
                      <th className="text-left px-5 py-4 font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map((nota, index) => (
                      <tr key={nota.idEvaluacion || index} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-4 text-slate-700">{nota.curso || 'Simulacro general'}</td>
                        <td className="px-5 py-4 text-slate-700">{nota.tipoEvaluacion || 'Evaluación'}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{nota.calificacion === null || nota.calificacion === undefined || nota.calificacion === '' ? '—' : Number(nota.calificacion).toFixed(2)}</td>
                        <td className="px-5 py-4 text-slate-500">{normalizarFecha(nota.fechaCreacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <Award className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                  <p className="text-sm font-bold text-slate-900 mt-3">Todavía no tienes calificaciones.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === VIEWS.materiales && (
          <div>
            <SectionHeader
              icon={BookOpen}
              title="Materiales de Estudio"
              subtitle="Consulta los materiales disponibles para tu preparación."
            />
            {materiales.length > 0 ? (
              <div className="space-y-5">
                {/* Filtros por curso (único filtro con datos reales) */}
                {cursosMaterial.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {['Todos', ...cursosMaterial].map((curso) => {
                      const activo = filtroCurso === curso;
                      const total = curso === 'Todos' ? materiales.length : (conteoCurso[curso] || 0);
                      return (
                        <button
                          type="button"
                          key={curso}
                          onClick={() => setCursoMaterial(curso)}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activo
                              ? 'border-teal-200 bg-teal-50 text-teal-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700'
                          }`}
                        >
                          {curso}
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tabla / listado (desktop y tablet) */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left font-semibold">Curso</th>
                        <th className="px-5 py-4 text-left font-semibold">Material</th>
                        <th className="px-5 py-4 text-left font-semibold">Fecha</th>
                        <th className="px-5 py-4 text-right font-semibold">Archivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialesFiltrados.map((material) => (
                        <tr
                          key={material.idMaterial}
                          className="border-t border-slate-100 align-top hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4 text-xs font-semibold text-slate-900">
                            {material.curso || 'General'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {material.titulo || 'Material de estudio'}
                              </p>
                              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                                {tipoArchivoMaterial(material)}
                              </span>
                            </div>
                            {material.descripcion && (
                              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                                {material.descripcion}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {normalizarFecha(material.fechaPublicacion)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <BotonDescarga material={material} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lista apilada (móvil): mismos datos, en bloques verticales */}
                <div className="space-y-3 md:hidden">
                  {materialesFiltrados.map((material) => (
                    <div key={material.idMaterial} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                            {material.curso || 'Material'}
                          </span>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {material.titulo || 'Material de estudio'}
                          </p>
                          {material.descripcion && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {material.descripcion}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                          {tipoArchivoMaterial(material)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-[11px] text-slate-500">
                          {normalizarFecha(material.fechaPublicacion)}
                        </span>
                        <BotonDescarga material={material} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-900">No hay materiales disponibles.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Cuando la academia publique materiales para tu ciclo, aparecerán aquí.
                </p>
              </div>
            )}
          </div>
        )}

        {view === VIEWS.perfil && (
          <div className="max-w-7xl mx-auto">
            {/* Sin subtitle redundante */}

            {/* TARJETA DE IDENTIDAD CON FOTO */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <AvatarAlumno
                  key={fotoAlumnoSrc || 'sin-foto'}
                  src={fotoAlumnoSrc}
                  iniciales={inicialesAlumno}
                />

                {/* Identidad y acciones junto al avatar */}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900 truncate">{nombreAlumno}</p>
                  <p className="mt-1 text-xs text-slate-500">{codigoAlumno || 'No registrado'} · Alumno</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {selectedFile ? (
                      <>
                        <button
                          type="button"
                          onClick={handleFotoUpload}
                          disabled={cargandoPerfil}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-xs font-bold text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
                        >
                          {cargandoPerfil ? 'Guardando…' : 'Guardar foto'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelarFoto}
                          disabled={cargandoPerfil}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => document.getElementById('foto-perfil-input').click()}
                          disabled={cargandoPerfil}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-xs font-bold text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
                        >
                          <RefreshCcw className="w-3 h-3" aria-hidden="true" />
                          {fotoPersistida ? 'Cambiar foto' : 'Agregar foto'}
                        </button>
                        {fotoPersistida && (
                          <button
                            type="button"
                            onClick={handleEliminarFoto}
                            disabled={cargandoPerfil}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                            Eliminar foto
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Input file oculto */}
                <input
                  id="foto-perfil-input"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFotoChange}
                />
              </div>
            </div>

            {/* GRID: Dos tarjetas separadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* TARJETA: Información Personal */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Información personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Nombres</p>
                    <span className="text-slate-900">{valorTexto(nombresAlumno)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Apellido paterno</p>
                    <span className="text-slate-900">{valorTexto(apellidoPaternoAlumno)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Apellido materno</p>
                    <span className="text-slate-900">{valorTexto(apellidoMaternoAlumno)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">DNI</p>
                    <span className="text-slate-900">{valorTexto(dniAlumno)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Correo</p>
                    <span className="text-slate-900">{valorTexto(correoAlumno)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Teléfono</p>
                    <span className="text-slate-900">{valorTexto(telefonoAlumno)}</span>
                  </div>
                </div>
              </div>

              {/* TARJETA: Información Académica */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Información académica</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Universidad objetivo</p>
                    <span className="text-slate-900">{valorTexto(ciclo?.universidadObjetivo)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Ciclo actual</p>
                    <span className="text-slate-900">{valorTexto(ciclo?.nombre)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Modalidad</p>
                    <span className="text-slate-900">{valorTexto(ciclo?.modalidad)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Fec. inicio</p>
                    <span className="text-slate-900">
                      {valorTexto(ciclo?.fechaInicio ? normalizarFecha(ciclo.fechaInicio) : '')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Fec. fin</p>
                    <span className="text-slate-900">
                      {valorTexto(ciclo?.fechaFin ? normalizarFecha(ciclo.fechaFin) : '')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
