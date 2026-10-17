
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Phone,
  CalendarClock,
  FileText,
  Award,
  BrainCircuit,
  Megaphone,
  Calculator,
  FlaskConical,
  BookText,
  Landmark,
  Puzzle,
  ArrowRight
} from 'lucide-react';
import logoAcadeSys from '../assets/acadesys-logo.png';
import heroAcademico from '../assets/hero.png';
import {
  API_URL,
  obtenerCiclosPublicos,
  obtenerCursosCiclo,
  verificarMatriculaExistente,
  procesarCheckoutMatricula,
  guardarSesion
} from '../services/api';
import { grupoDeRol } from '../utils/roles';

// El perfil real de la cuenta se resuelve con la normalización central
// (comparación EXACTA por perfil, sin `includes`). Mapas cerrados y seguros.
const MAPA_ROLES = {
  '1': 'Administrador',
  '2': 'Docente',
  '3': 'Tutor de Aula',
  '4': 'Estudiante'
};

// Identidad visual determinista por universidad objetivo.
// La variante se elige por hash estable del nombre: nunca cambia entre recargas
// y no usa Math.random(). Todas las variantes se mantienen dentro de la paleta
// institucional de AcadeSys (azul + slate), en tonos legibles sobre fondos claros.
const VARIANTES_UNIVERSIDAD = [
  { acento: 'text-blue-700', linea: 'from-blue-600/40' },
  { acento: 'text-blue-800', linea: 'from-blue-700/40' },
  { acento: 'text-blue-900', linea: 'from-blue-800/40' },
  { acento: 'text-slate-700', linea: 'from-slate-400/50' }
];

const hashEstable = (texto = '') => {
  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 31 + texto.charCodeAt(i)) % 1000000007;
  }
  return Math.abs(hash);
};

const varianteUniversidad = (clave = '') =>
  VARIANTES_UNIVERSIDAD[hashEstable(String(clave).toUpperCase()) % VARIANTES_UNIVERSIDAD.length];

// Nombres completos SOLO para presentación. No alteran los datos recibidos ni
// se usan para lógica: si una universidad no está en el mapa, se muestra su
// sigla/valor tal cual (la agrupación sigue siendo dinámica).
const NOMBRES_UNIVERSIDAD = {
  UNMSM: 'Universidad Nacional Mayor de San Marcos',
  UNI: 'Universidad Nacional de Ingeniería',
  PUCP: 'Pontificia Universidad Católica del Perú',
  UNFV: 'Universidad Nacional Federico Villarreal',
  UNAC: 'Universidad Nacional del Callao',
  UNT: 'Universidad Nacional de Trujillo'
};

const nombreUniversidad = (clave = '') =>
  NOMBRES_UNIVERSIDAD[String(clave).trim().toUpperCase()] || '';

// Formatea 'YYYY-MM-DD' sin desfase de zona horaria. Devuelve '' si no es válida.
const formatearFecha = (valor = '') => {
  const coincidencia = String(valor).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!coincidencia) return '';
  const fecha = new Date(
    Number(coincidencia[1]),
    Number(coincidencia[2]) - 1,
    Number(coincidencia[3])
  );
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
};

// El precio solo se muestra cuando es un monto real: se descartan 0 y 1, que en
// la base figuran como valores de relleno.
const precioValido = (precio) => {
  const numero = Number(precio);
  return Number.isFinite(numero) && numero > 1;
};

// --- Contacto oficial ---
// Números confirmados para el widget de contacto.
const TELEFONO_CONTACTO = '+51991587243';
const WHATSAPP_CONTACTO = '51991587243';

const contactarPorTelefono = () => {
  if (!TELEFONO_CONTACTO) return;
  window.location.href = `tel:${TELEFONO_CONTACTO}`;
};

const contactarPorWhatsApp = () => {
  if (!WHATSAPP_CONTACTO) return;
  window.open(`https://wa.me/${WHATSAPP_CONTACTO}`, '_blank', 'noopener,noreferrer');
};

// Icono de WhatsApp local (SVG propio, sin dependencias ni imágenes externas).
const IconoWhatsApp = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Áreas académicas: agrupación SOLO de presentación (materia -> área).
// No inventa cursos: las materias se obtienen de los ciclos públicos reales y
// cualquier nombre no mapeado cae en "Otras materias".
const AREAS_MATERIAS = [
  {
    area: 'Matemáticas',
    icono: Calculator,
    materias: ['Aritmética', 'Álgebra', 'Geometría', 'Trigonometría', 'Matemática']
  },
  {
    area: 'Ciencias',
    icono: FlaskConical,
    materias: ['Física', 'Química', 'Biología']
  },
  {
    area: 'Letras',
    icono: BookText,
    materias: ['Lenguaje', 'Literatura', 'Comunicación']
  },
  {
    area: 'Humanidades',
    icono: Landmark,
    materias: [
      'Historia',
      'Historia del Perú y Universal',
      'Geografía',
      'Economía',
      'Filosofía',
      'Psicología',
      'Educación Cívica'
    ]
  },
  {
    area: 'Razonamiento',
    icono: Puzzle,
    materias: [
      'Habilidad Verbal',
      'Razonamiento Verbal',
      'Comprensión Lectora (RV)',
      'Razonamiento Matemático',
      'Habilidad Lógico-Matemática',
      'Habilidad Matemática'
    ]
  }
];

const normalizarMateria = (texto = '') =>
  String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const AREA_POR_MATERIA = new Map();
for (const grupo of AREAS_MATERIAS) {
  for (const materia of grupo.materias) {
    AREA_POR_MATERIA.set(normalizarMateria(materia), grupo.area);
  }
}

// El PNG del logo oficial es un lienzo cuadrado (347x347) con ~40% de aire
// arriba y abajo. Se recorta de forma NO destructiva con `object-cover` sobre una
// caja con el aspecto real del contenido (277x66 px ≈ 4.2:1, medido del archivo).
// Así el logo se ve nítido y proporcionado sin deformarlo ni editarlo.
const LOGO_ASPECT = '4.2 / 1';

export default function LandingPage({ onLoginSuccess }) {
  const [authModal, setAuthModal] = useState(null);
  const [rolEsperado, setRolEsperado] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginData, setLoginData] = useState({ usuario: '', password: '' });
  const [ciclos, setCiclos] = useState([]);
  const [filtroUniversidad, setFiltroUniversidad] = useState('TODOS');
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [errorCiclos, setErrorCiclos] = useState(null);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [cicloDetalle, setCicloDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    nombres: '',
    apellidos: '',
    correo: ''
  });
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [verificacionMatricula, setVerificacionMatricula] = useState(null);
  const [areasAcademicas, setAreasAcademicas] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(false);
  const [areasCargadas, setAreasCargadas] = useState(false);
  const areasRef = React.useRef(null);
  const areasSolicitadasRef = React.useRef(false);

  const resetFormStates = () => {
    setError(null);
    setShowPassword(false);
    setLoginData({
      usuario: '',
      password: ''
    });
  };

  const openModal = (modalType, idPerfil = null) => {
    resetFormStates();
    setRolEsperado(idPerfil ? idPerfil.toString() : null);
    setAuthModal(modalType);
  };

  const closeModal = () => {
    resetFormStates();
    setRolEsperado(null);
    setAuthModal(null);
  };

 React.useEffect(() => {
  async function cargarCiclos() {
    try {
      setLoadingCiclos(true);
      setErrorCiclos(null);

      const data = await obtenerCiclosPublicos();
      setCiclos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error al cargar ciclos públicos:', err);
      setCiclos([]);
      setErrorCiclos(
        err.message || 'No fue posible cargar los ciclos disponibles.'
      );
    } finally {
      setLoadingCiclos(false);
    }
  }

  cargarCiclos();
}, []);

  // Áreas académicas: se construyen con los cursos reales de los ciclos
  // publicados. Se cargan de forma diferida (al acercarse a la sección) para no
  // penalizar la carga inicial y se deduplican por nombre normalizado.
  React.useEffect(() => {
    if (ciclos.length === 0 || areasSolicitadasRef.current) return undefined;
    const nodo = areasRef.current;
    if (!nodo) return undefined;

    const cargarAreas = async () => {
      if (areasSolicitadasRef.current) return;
      areasSolicitadasRef.current = true;
      setCargandoAreas(true);
      try {
        const respuestas = await Promise.allSettled(
          ciclos.map((ciclo) => obtenerCursosCiclo(ciclo.idCiclo ?? ciclo.id))
        );

        const nombresUnicos = new Map();
        for (const respuesta of respuestas) {
          if (respuesta.status !== 'fulfilled' || !Array.isArray(respuesta.value)) continue;
          for (const curso of respuesta.value) {
            const nombre = String(curso?.nombre || '').trim();
            if (!nombre) continue;
            const clave = normalizarMateria(nombre);
            if (!nombresUnicos.has(clave)) nombresUnicos.set(clave, nombre);
          }
        }

        const porArea = new Map();
        for (const nombre of nombresUnicos.values()) {
          const area = AREA_POR_MATERIA.get(normalizarMateria(nombre)) || 'Otras materias';
          if (!porArea.has(area)) porArea.set(area, []);
          porArea.get(area).push(nombre);
        }

        const ordenAreas = [...AREAS_MATERIAS.map((grupo) => grupo.area), 'Otras materias'];
        const resultado = ordenAreas
          .filter((area) => porArea.has(area))
          .map((area) => ({
            area,
            icono: AREAS_MATERIAS.find((grupo) => grupo.area === area)?.icono || Sparkles,
            materias: porArea.get(area).sort((a, b) => a.localeCompare(b, 'es'))
          }));

        setAreasAcademicas(resultado);
      } catch (err) {
        console.warn('No se pudieron cargar las áreas académicas:', err);
        setAreasAcademicas([]);
      } finally {
        setCargandoAreas(false);
        setAreasCargadas(true);
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      cargarAreas();
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          observador.disconnect();
          cargarAreas();
        }
      },
      { rootMargin: '200px' }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [ciclos]);

  // Agrupación dinámica por universidad objetivo: se construye con los datos
  // reales, sin listas fijas. Si aparece una universidad nueva, se crea su
  // sección automáticamente.
  const universidadesAgrupadas = React.useMemo(() => {
    const mapa = new Map();

    for (const ciclo of ciclos) {
      const etiqueta = String(ciclo.universidadObjetivo || '').trim();
      const clave = etiqueta || 'Por confirmar';

      if (!mapa.has(clave)) {
        mapa.set(clave, { clave, sinDato: !etiqueta, ciclos: [] });
      }

      mapa.get(clave).ciclos.push(ciclo);
    }

    return Array.from(mapa.values()).sort((a, b) => {
      if (a.sinDato !== b.sinDato) return a.sinDato ? 1 : -1;
      return a.clave.localeCompare(b.clave, 'es');
    });
  }, [ciclos]);

  const filtroActivo = universidadesAgrupadas.some((u) => u.clave === filtroUniversidad)
    ? filtroUniversidad
    : 'TODOS';

  const universidadesVisibles = filtroActivo === 'TODOS'
    ? universidadesAgrupadas
    : universidadesAgrupadas.filter((u) => u.clave === filtroActivo);

  const abrirDetalleCiclo = async (ciclo) => {
    const idCiclo = ciclo.idCiclo ?? ciclo.id;
    setError(null);
    setCargandoDetalle(true);
    setCicloDetalle({
      ...ciclo,
      cursos: []
    });
    try {
      const cursos = await obtenerCursosCiclo(idCiclo);
      setCicloDetalle({
        ...ciclo,
        cursos: Array.isArray(cursos) ? cursos : []
      });
    } catch (err) {
      console.warn('No se pudo cargar el detalle del ciclo:', err);
      setCicloDetalle({
        ...ciclo,
        cursos: []
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirCheckout = (ciclo) => {
    setError(null);
    setCheckoutData({
      nombres: '',
      apellidos: '',
      correo: ''
    });
    setCheckoutErrors({});
    setVerificacionMatricula(null);
    setVerificandoCorreo(false);
    setCicloSeleccionado(ciclo);
  };

  const cerrarCheckout = () => {
    if (procesandoPago || verificandoCorreo) return;

    setCicloSeleccionado(null);
    setVerificacionMatricula(null);
    setCheckoutErrors({});
    setError(null);
  };

  const validarCheckout = () => {
    const errores = {};

    const nombres = checkoutData.nombres.trim();
    const apellidos = checkoutData.apellidos.trim();
    const correo = checkoutData.correo.trim().toLowerCase();

    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombres) {
      errores.nombres = 'Ingresa tus nombres.';
    } else if (nombres.length < 2) {
      errores.nombres = 'El nombre debe tener al menos 2 caracteres.';
    } else if (!regexNombre.test(nombres)) {
      errores.nombres = 'El nombre contiene caracteres no permitidos.';
    }

    if (!apellidos) {
      errores.apellidos = 'Ingresa tus apellidos.';
    } else if (apellidos.length < 2) {
      errores.apellidos = 'El apellido debe tener al menos 2 caracteres.';
    } else if (!regexNombre.test(apellidos)) {
      errores.apellidos = 'El apellido contiene caracteres no permitidos.';
    }

    if (!correo) {
      errores.correo = 'Ingresa tu correo electrónico.';
    } else if (!regexCorreo.test(correo)) {
      errores.correo = 'Ingresa un correo electrónico válido.';
    }

    setCheckoutErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handleCorreoCheckoutChange = (e) => {
    const valor = e.target.value;

    setCheckoutData((actual) => ({
      ...actual,
      correo: valor
    }));

    setCheckoutErrors((actual) => ({
      ...actual,
      correo: ''
    }));

    setVerificacionMatricula(null);
    setError(null);
  };

  const verificarCorreoParaCheckout = async (correoIngresado) => {
    const correo = String(correoIngresado || '').trim().toLowerCase();
    const idCiclo = cicloSeleccionado?.idCiclo ?? cicloSeleccionado?.id;
    if (!correo || !idCiclo) return false;

    setVerificandoCorreo(true);
    setError(null);

    try {
      const resultado = await verificarMatriculaExistente(correo, idCiclo);

      if (!resultado.existe) {
        setVerificacionMatricula({ ...resultado, correoVerificado: correo, autorizado: true });
        return true;
      }

      if (!resultado.esAlumno) {
        setVerificacionMatricula({ ...resultado, correoVerificado: correo, autorizado: false });
        await Swal.fire({
          icon: 'warning',
          title: 'Correo ya registrado',
          text: resultado.message || 'Este correo ya está registrado y no corresponde a una cuenta de estudiante.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb',
          background: '#ffffff',
          color: '#0f172a'
        });
        return false;
      }

      if (resultado.yaInscritoEnCiclo || resultado.puedeReinscribirse === false) {
        setVerificacionMatricula({ ...resultado, correoVerificado: correo, autorizado: false });
        await Swal.fire({
          icon: 'info',
          title: 'Matrícula existente',
          text: resultado.message || 'Ya estás matriculado en este ciclo.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb',
          background: '#ffffff',
          color: '#0f172a'
        });
        return false;
      }

      const nombreCicloActual = resultado.ciclos?.[0]?.nombre || resultado.cicloActual?.nombre;
      const mensajeConfirmacion = nombreCicloActual
        ? `Usted ya está registrado en ${nombreCicloActual}. ¿Desea registrarse en este nuevo ciclo con la misma cuenta?`
        : 'Usted ya está registrado en el sistema. ¿Desea registrarse en este nuevo ciclo con la misma cuenta?';

      const confirmacion = await Swal.fire({
        icon: 'question',
        title: 'Estudiante encontrado',
        text: mensajeConfirmacion,
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a'
      });

      setVerificacionMatricula({
        ...resultado,
        correoVerificado: correo,
        autorizado: confirmacion.isConfirmed
      });
      return confirmacion.isConfirmed;
    } catch (err) {
      setVerificacionMatricula(null);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo verificar el correo',
        text: err.message || 'Ocurrió un error al verificar la matrícula.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a'
      });
      return false;
    } finally {
      setVerificandoCorreo(false);
    }
  };

  const handlePagarCheckout = async (e) => {
    e.preventDefault();

    if (procesandoPago || verificandoCorreo) return;

    setError(null);

    if (!validarCheckout()) return;

    const correoNormalizado = checkoutData.correo.trim().toLowerCase();
    let autorizado =
      verificacionMatricula?.correoVerificado === correoNormalizado &&
      verificacionMatricula?.autorizado === true;

    if (!autorizado) autorizado = await verificarCorreoParaCheckout(correoNormalizado);
    if (!autorizado) return;

    setProcesandoPago(true);

    Swal.fire({
      title: 'Procesando matrícula...',
      text: 'Modo demostración: no se realizará ningún cobro real. Espera mientras registramos la matrícula de prueba.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#0f172a',
      didOpen: () => Swal.showLoading()
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const resultado = await procesarCheckoutMatricula({
        idCiclo: cicloSeleccionado?.idCiclo ?? cicloSeleccionado?.id,
        nombres: checkoutData.nombres.trim(),
        apellidos: checkoutData.apellidos.trim(),
        correo: correoNormalizado,
      });

      await Swal.fire({
        icon: 'info',
        title: resultado.esReinscripcion ? 'Reinscripción registrada' : 'Matrícula registrada',
        text: resultado.esReinscripcion
          ? 'La matrícula quedó registrada y el pago figura pendiente. Este flujo es una demostración: no se realizó un cobro real. Revisa tu correo para recuperar el acceso.'
          : 'La matrícula quedó registrada y el pago figura pendiente. Este flujo es una demostración: no se realizó un cobro real. Revisa tu correo para obtener tus accesos.',
        confirmButtonText: 'Ir al inicio',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a'
      });

      setVerificacionMatricula(null);
      setCicloSeleccionado(null);
      window.location.href = '/';
    } catch (err) {
      Swal.close();
      setError(err.message || 'Error al procesar la matrícula.');
    } finally {
      setProcesandoPago(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const inputUser = loginData.usuario.trim().replace(/\s+/g, '');
    const inputPass = loginData.password.trim();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: inputUser,
          codigoUsuario: inputUser,
          correo: inputUser,
          password: inputPass,
          clave: inputPass
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.mensaje || data.message || 'Credenciales inválidas.');
      }
      const grupoRecibido = grupoDeRol(data.rol || data.perfil || data.NombrePerfil);
      const idPerfilRecibido = (data.idPerfil || data.IdPerfil || data.id_perfil || '').toString();
      
      if (rolEsperado) {
        const grupoEsperado = grupoDeRol(MAPA_ROLES[rolEsperado]);
        const coincideId = idPerfilRecibido === rolEsperado;
        const coincideNombre = grupoRecibido !== null && grupoRecibido === grupoEsperado;
        if (!coincideId && !coincideNombre) {
          const perfilCuenta = data.rol || data.perfil || data.NombrePerfil || 'Usuario';
          throw new Error(
            `Acceso restringido: Esta cuenta tiene asignado el perfil "${perfilCuenta}" y no puede ingresar por el portal de ${MAPA_ROLES[rolEsperado]}. Por favor ingresa por la tarjeta correspondiente.`
          );
        }
      }
      
      const academia = data.academia || {};
      const sessionUser = {
        idUsuario: data.idUsuario ?? data.user?.idUsuario ?? data.user?.id,
        nombre: data.usuario || data.nombres || data.nombre || inputUser,
        correo: data.correo ?? data.user?.correo,
        dni: data.dni ?? data.user?.dni,
        codigoUsuario: data.codigoUsuario ?? data.user?.codigoUsuario,
        rol: data.rol || data.perfil || data.NombrePerfil || '',
        idPerfil: idPerfilRecibido || null,
        token: data.token || data.jwt || data.accessToken,
        idAcademia: data.idAcademia || academia.idAcademia || academia.id || null,
        colorTema: academia.colorTema || data.colorTema || '#2563eb',
        logoUrl: academia.logoUrl || data.logoUrl || null,
        nombreAcademia: academia.nombreAcademia || data.nombreAcademia || 'AcadeSys'
      };
      if (!sessionUser.token) {
        throw new Error('El servidor no devolvió un token de sesión válido.');
      }
      if (!sessionUser.rol) {
        throw new Error('El servidor no devolvió un perfil válido para tu cuenta.');
      }
      // Persistencia coherente: el token va a `acadesys_token` y el objeto de
      // sesión (sin token duplicado) a `acadesys_session`.
      guardarSesion(sessionUser);
      onLoginSuccess(sessionUser);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen scroll-smooth bg-slate-50 text-slate-900 font-sans select-none">
      <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between gap-3 sm:gap-4">
          <a href="#inicio" className="flex items-center shrink-0" aria-label="AcadeSys, ir al inicio">
            <img
              src={logoAcadeSys}
              alt="AcadeSys"
              style={{ aspectRatio: LOGO_ASPECT }}
              className="h-9 sm:h-10 w-auto object-cover rounded-lg ring-1 ring-black/5"
            />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#inicio" className="hover:text-white transition-colors">Inicio</a>
            <a href="#ciclos" className="hover:text-white transition-colors">Ciclos</a>
            <a href="#preparacion" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openModal('login', 4)}
              className="px-3.5 sm:px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => openModal('login', 1)}
              className="hidden sm:inline-flex px-4 py-2.5 rounded-lg border border-slate-600 text-slate-200 hover:bg-white/5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Administrador
            </button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* HERO ACADÉMICO */}
        <section id="inicio" className="scroll-mt-20 bg-[#0F172A] text-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="order-1">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-blue-300 mb-4">
                Preparación preuniversitaria
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.12] tracking-[-0.01em] text-white">
                Tu camino a la universidad
                <span className="block text-blue-300">empieza aquí</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed">
                Conoce nuestros ciclos preuniversitarios, revisa los turnos y horarios disponibles
                y elige la preparación que mejor se adapte a tu objetivo universitario.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="#ciclos"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Ver ciclos
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={contactarPorWhatsApp}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-slate-600 text-slate-100 hover:bg-white/5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  <IconoWhatsApp className="w-4 h-4" />
                  Contáctanos
                </button>
              </div>

              <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 max-w-lg">
                {[
                  'Ciclos organizados',
                  'Docentes',
                  'Materiales de estudio',
                  'Simulacros y evaluaciones'
                ].map((beneficio) => (
                  <li key={beneficio} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                    {beneficio}
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-2">
              <img
                src={heroAcademico}
                alt="Estudiantes en una sesión de clase preuniversitaria"
                style={{ objectPosition: '50% 35%' }}
                className="w-full h-64 sm:h-80 lg:h-[420px] object-cover rounded-2xl border border-white/10"
              />
            </div>
          </div>
        </section>

        {/* SECCIONES ACADÉMICAS (fondo claro) */}
        <div className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 space-y-20">

        {/* CICLOS DISPONIBLES */}
        <section className="scroll-mt-24" id="ciclos">
          <div className="text-center mb-8">
            <p className="text-blue-700 text-xs font-bold uppercase tracking-[0.16em] mb-2">Oferta académica</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900">Nuestros ciclos</h2>
            <p className="text-slate-600 text-sm mt-2 max-w-2xl mx-auto">Elige tu universidad objetivo y encuentra el programa de preparación adecuado.</p>
          </div>
          {loadingCiclos ? (
  <div
    className="w-full max-w-2xl mx-auto p-8 rounded-xl bg-white border border-slate-200 text-center shadow-sm"
    role="status"
    aria-live="polite"
  >
    <Loader2
      className="w-7 h-7 mx-auto mb-3 text-blue-700 animate-spin"
      aria-hidden="true"
    />
    <h3 className="text-base sm:text-lg font-bold text-slate-900">
      Cargando ciclos disponibles
    </h3>
    <p className="text-sm text-slate-600 mt-2">
      Estamos consultando la oferta académica.
    </p>
  </div>
) : errorCiclos ? (
  <div
    className="w-full max-w-2xl mx-auto p-8 rounded-xl bg-white border border-rose-200 text-center shadow-sm"
    role="alert"
  >
    <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
      <AlertCircle
        className="w-7 h-7 text-rose-600"
        aria-hidden="true"
      />
    </div>

    <h3 className="text-base sm:text-lg font-bold text-slate-900">
      No pudimos cargar los ciclos
    </h3>

    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
      No fue posible consultar la oferta académica en este momento.
    </p>

    <p className="text-sm text-rose-600 mt-2">
      {errorCiclos}
    </p>
  </div>
) : ciclos.length === 0 ? (
  <div
    className="w-full max-w-2xl mx-auto p-10 rounded-xl bg-white border border-slate-200 text-center shadow-sm"
    role="status"
  >
    <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
      <GraduationCap
        className="w-7 h-7 text-blue-700"
        aria-hidden="true"
      />
    </div>

    <h3 className="text-lg font-bold text-slate-900">
      Nuevos ciclos se aperturarán pronto
    </h3>

    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
      Actualmente no hay ciclos disponibles para matrícula.
      Vuelve a revisar próximamente para conocer nuevas fechas,
      turnos y horarios.
    </p>
  </div>
) : (
  <div className="w-full">
    {/* SELECTOR DE UNIVERSIDAD OBJETIVO (dinámico, con los datos reales) */}
    <div className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 text-center mb-3">
        Universidad objetivo
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[{ clave: 'TODOS' }, ...universidadesAgrupadas.map((u) => ({ clave: u.clave }))].map((opcion) => {
          const activo = filtroActivo === opcion.clave;
          return (
            <button
              key={opcion.clave}
              type="button"
              onClick={() => setFiltroUniversidad(opcion.clave)}
              aria-pressed={activo}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                activo
                  ? 'bg-blue-700 border-blue-700 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-700 hover:text-blue-800'
              }`}
            >
              {opcion.clave === 'TODOS' ? 'Todos' : opcion.clave}
            </button>
          );
        })}
      </div>
    </div>

    {/* SECCIONES POR UNIVERSIDAD */}
    <div className="space-y-12">
      {universidadesVisibles.map((universidad) => {
        const variante = varianteUniversidad(universidad.clave);
        const nombreCompleto = nombreUniversidad(universidad.clave);
        return (
          <section key={universidad.clave} className="text-left">
            <div className="mb-3">
              {nombreCompleto ? (
                <>
                  <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${variante.acento}`}>
                    {universidad.clave}
                  </p>
                  <h3 className="font-serif text-lg sm:text-xl text-slate-900 leading-tight mt-1">
                    {nombreCompleto}
                  </h3>
                </>
              ) : (
                <h3 className="font-serif text-lg sm:text-xl text-slate-900 leading-tight">
                  {universidad.clave}
                </h3>
              )}
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Ciclos de preparación · {universidad.ciclos.length} {universidad.ciclos.length === 1 ? 'programa' : 'programas'}
              </p>
            </div>
            <div className={`h-px w-full bg-gradient-to-r ${variante.linea} to-transparent mb-6`} />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {universidad.ciclos.map((ciclo) => {
                const capacidad = Number(ciclo.capacidad || 0);
                const inscritos = Number(ciclo.totalAlumnos || 0);
                const vacantes = Math.max(capacidad - inscritos, 0);
                const cupoCompleto = capacidad > 0 && vacantes <= 0;

                return (
                  <article
                    key={ciclo.idCiclo ?? ciclo.id}
                    className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-shadow flex flex-col shadow-sm"
                  >
                    {/* CABECERA: universidad objetivo + disponibilidad */}
                    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3.5 border-b border-slate-100">
                      <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${variante.acento}`}>
                        {ciclo.universidadObjetivo || universidad.clave}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap ${
                          cupoCompleto ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cupoCompleto ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          aria-hidden="true"
                        />
                        {cupoCompleto ? 'Cupo completo' : 'Disponible'}
                      </span>
                    </div>

                    {/* INFORMACIÓN DEL CICLO */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {ciclo.nombre || 'Ciclo sin nombre'}
                      </h3>

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Turno</dt>
                          <dd className="mt-1 text-sm font-medium text-slate-800">{ciclo.turno || 'Por confirmar'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Horario</dt>
                          <dd className="mt-1 text-sm font-medium text-slate-800">{ciclo.horario || 'Por confirmar'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Días</dt>
                          <dd className="mt-1 text-sm font-medium text-slate-800">{ciclo.diasClase || 'Por confirmar'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cursos</dt>
                          <dd className="mt-1 text-sm font-medium text-slate-800">
                            {ciclo.totalCursos} {Number(ciclo.totalCursos) === 1 ? 'curso' : 'cursos'}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 pt-3.5 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          <strong className="font-semibold text-slate-700">{inscritos}</strong> inscritos
                          {capacidad > 0
                            ? <> · <strong className="font-semibold text-slate-700">{vacantes}</strong> vacantes</>
                            : <> · vacantes por confirmar</>}
                        </p>
                      </div>

                      <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => abrirDetalleCiclo(ciclo)}
                          className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 text-sm font-semibold transition-colors"
                          aria-label={`Ver detalle del ciclo ${ciclo.nombre || ''}`}
                        >
                          Ver detalle
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirCheckout(ciclo)}
                          disabled={cupoCompleto}
                          className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cupoCompleto ? 'Cupo completo' : 'Inscribirme'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  </div>
)}

        </section>

        {/* TODO LO QUE INCLUYE TU PREPARACIÓN */}
        <section id="preparacion" className="scroll-mt-24 text-left">
          <div className="text-center mb-10">
            <p className="text-blue-700 text-xs font-bold uppercase tracking-[0.16em] mb-2">Tu preparación</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900">Todo lo que incluye tu preparación</h2>
            <p className="text-slate-600 text-sm mt-2 max-w-2xl mx-auto">
              Herramientas y servicios que acompañan tu ciclo dentro de tu cuenta de AcadeSys.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-9">
            {[
              {
                icono: GraduationCap,
                titulo: 'Ciclos y cursos',
                texto: 'Consulta los ciclos publicados, sus cursos y la universidad objetivo de cada uno.'
              },
              {
                icono: CalendarClock,
                titulo: 'Horarios y turnos',
                texto: 'Revisa el turno, los días de clase y el horario del ciclo antes de inscribirte.'
              },
              {
                icono: FileText,
                titulo: 'Materiales de estudio',
                texto: 'Accede a los materiales que la academia publica para los cursos de tu ciclo.'
              },
              {
                icono: Award,
                titulo: 'Resultados y calificaciones',
                texto: 'Revisa tus evaluaciones y simulacros registrados en tu cuenta de estudiante.'
              },
              {
                icono: BrainCircuit,
                titulo: 'Tutor IA',
                texto: 'Apoyo académico mediante el asistente de orientación preuniversitaria de AcadeSys.'
              },
              {
                icono: Megaphone,
                titulo: 'Comunicados',
                texto: 'Mantente al tanto de los avisos y comunicados institucionales de la academia.'
              }
            ].map((item) => {
              const Icono = item.icono;
              return (
                <div key={item.titulo} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                    <Icono className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.titulo}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{item.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ÁREAS DE PREPARACIÓN (construida con los cursos reales de los ciclos publicados) */}
        {ciclos.length > 0 && !(areasCargadas && areasAcademicas.length === 0) && (
          <section id="areas" ref={areasRef} className="scroll-mt-24 text-left">
            <div className="text-center mb-10">
              <p className="text-blue-700 text-xs font-bold uppercase tracking-[0.16em] mb-2">Áreas de estudio</p>
              <h2 className="font-serif text-2xl sm:text-3xl text-slate-900">Áreas académicas</h2>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl mx-auto">
                Materias que forman parte de los ciclos publicados, agrupadas por área.
              </p>
            </div>
            {cargandoAreas || !areasCargadas ? (
              <div
                className="flex items-center justify-center gap-2 text-slate-500 text-sm py-6"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Cargando áreas académicas...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {areasAcademicas.map((grupo) => {
                  const Icono = grupo.icono;
                  return (
                    <div key={grupo.area} className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center gap-2.5 mb-3">
                        <Icono className="w-4 h-4 text-blue-700" aria-hidden="true" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900">{grupo.area}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {grupo.materias.join(' · ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* POR QUÉ ELEGIR ACADESYS */}
        <section id="nosotros" className="scroll-mt-24 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 items-start">
            <div>
              <p className="text-blue-700 text-xs font-bold uppercase tracking-[0.16em] mb-2">La plataforma</p>
              <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 leading-tight">¿Por qué elegir AcadeSys?</h2>
              <p className="text-slate-600 text-sm mt-4 leading-relaxed">
                AcadeSys reúne la preparación preuniversitaria y la gestión académica en una sola
                plataforma: tu ciclo, tus cursos, tus horarios y tus resultados en un mismo lugar.
              </p>
              <div className="mt-6 h-px w-40 bg-blue-200" />
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {[
                { titulo: 'Organización académica', texto: 'Toda tu información académica reunida en tu cuenta.' },
                { titulo: 'Seguimiento de progreso', texto: 'Consulta tus evaluaciones y resultados cuando quieras.' },
                { titulo: 'Acceso a materiales', texto: 'Materiales de estudio organizados por curso.' },
                { titulo: 'Tutor IA', texto: 'Asistente de orientación preuniversitaria disponible en tu cuenta.' },
                { titulo: 'Información centralizada', texto: 'Cursos, horarios y comunicados desde un mismo portal.' },
                { titulo: 'Preparación por universidad', texto: 'Ciclos organizados según tu universidad objetivo.' }
              ].map((punto) => (
                <li key={punto.titulo}>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                    {punto.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5 pl-6">{punto.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CÓMO INSCRIBIRTE */}
        <section id="inscripcion" className="scroll-mt-24 text-left">
          <div className="text-center mb-10">
            <p className="text-blue-700 text-xs font-bold uppercase tracking-[0.16em] mb-2">Matrícula</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900">¿Cómo inscribirte?</h2>
            <p className="text-slate-600 text-sm mt-2 max-w-2xl mx-auto">
              El proceso de inscripción en AcadeSys, paso a paso.
            </p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {[
              {
                n: '1',
                titulo: 'Elige tu universidad',
                texto: 'Selecciona la universidad a la que deseas postular en el filtro de ciclos.'
              },
              {
                n: '2',
                titulo: 'Elige tu ciclo',
                texto: 'Revisa horario, turno, días, cursos y vacantes de cada ciclo disponible.'
              },
              {
                n: '3',
                titulo: 'Inscríbete',
                texto: 'Presiona “Inscribirme”, completa tus datos y confirma tu matrícula.'
              },
              {
                n: '4',
                titulo: 'Accede a tu portal',
                texto: 'Revisa tu correo para obtener tus accesos e ingresa a tu cuenta de estudiante.'
              }
            ].map((paso) => (
              <li key={paso.n} className="border-t border-slate-200 pt-5">
                <span
                  className="block font-serif text-3xl sm:text-4xl text-blue-700 leading-none"
                  aria-hidden="true"
                >
                  {paso.n}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-3">{paso.titulo}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

          </div>
        </div>

        {/* CTA FINAL (banda azul marino) */}
        <section className="bg-[#0F172A] text-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-16 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl text-white">¿Listo para comenzar tu preparación?</h2>
            <p className="text-slate-300 text-sm mt-3 max-w-xl mx-auto">
              Encuentra el ciclo adecuado para tu universidad objetivo.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#ciclos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                Ver ciclos
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={contactarPorWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-slate-600 text-slate-100 hover:bg-white/5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                <IconoWhatsApp className="w-4 h-4" />
                Escríbenos por WhatsApp
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0B1220] border-t border-white/10 text-slate-400">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-10 pb-28 sm:pb-10 flex flex-col items-center gap-5 text-center">
          <img
            src={logoAcadeSys}
            alt="AcadeSys"
            style={{ aspectRatio: LOGO_ASPECT }}
            className="h-9 w-auto object-cover rounded-lg ring-1 ring-black/5"
          />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <a href="#inicio" className="hover:text-white transition-colors">Inicio</a>
            <a href="#ciclos" className="hover:text-white transition-colors">Ciclos</a>
            <a href="#preparacion" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#inscripcion" className="hover:text-white transition-colors">Inscripción</a>
            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={contactarPorTelefono}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              Llamar
            </button>
            <button
              type="button"
              onClick={contactarPorWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <IconoWhatsApp className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          </div>
          <p className="text-xs text-slate-500">© 2026 AcadeSys · Sistema de Gestión Académica. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* WIDGET FLOTANTE DE CONTACTO (z-30: sobre el contenido, debajo de los modales z-40/z-50) */}
      <div className="fixed z-30 right-4 bottom-4 sm:right-6 sm:bottom-6 flex flex-col items-end gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center rounded-lg bg-[#0F172A] border border-slate-700 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-black/20">
            ¿Contáctanos?
          </span>
          <button
            type="button"
            onClick={contactarPorTelefono}
            aria-label="Contactar con AcadeSys"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0F172A] hover:bg-blue-700 border border-slate-700 text-white flex items-center justify-center shadow-lg shadow-black/20 transition duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={contactarPorWhatsApp}
          aria-label="Contactar por WhatsApp"
          title="Contactar por WhatsApp"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1FBE5A] border border-white/15 text-white flex items-center justify-center shadow-lg shadow-black/30 transition duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <IconoWhatsApp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* ACCESO / INICIO DE SESIÓN (pantalla completa) */}
      {authModal === 'login' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0F172A]/80 p-4 sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Panel de inicio de sesión */}
          <div className="relative w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-7">
              <div className="flex flex-col items-center text-center mb-6">
                <img
                  src={logoAcadeSys}
                  alt="AcadeSys"
                  style={{ aspectRatio: LOGO_ASPECT }}
                  className="h-12 w-auto object-cover rounded-lg"
                />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 mt-3">
                  Plataforma Preuniversitaria
                </p>
              </div>
              <h2 className="font-serif text-2xl text-slate-900 text-center">Iniciar sesión</h2>
              <p className="text-sm text-slate-600 mt-1.5 text-center">Ingresa tus datos para acceder a tu portal académico.</p>
              {rolEsperado && (
                <div className="flex justify-center mt-4">
                  <span className="inline-flex px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-blue-800">
                    Acceso para: {rolEsperado === '4' ? 'Estudiante' : rolEsperado === '1' ? 'Administrador' : MAPA_ROLES[rolEsperado]}
                  </span>
                </div>
              )}
            </div>
            {error && (
              <div className="mb-5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No fue posible iniciar sesión</p>
                  <p className="mt-1 text-rose-600">{error}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label
  htmlFor="login-usuario"
  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2"
>
  Usuario / correo
</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    id="login-usuario"
                    placeholder={rolEsperado === '4' ? 'Código de estudiante o correo' : 'Usuario o correo'}
                    value={loginData.usuario}
                    onChange={(e) => setLoginData({ ...loginData, usuario: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>
              <div>
                <label
  htmlFor="login-password"
  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2"
>
  Contraseña
</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    id="login-password"
                    placeholder="Ingresa tu contraseña"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-blue-700 hover:bg-blue-600 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Autenticando...' : 'Iniciar sesión'}</span>
              </button>
            </form>
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-sm text-center text-slate-600">Acceso para estudiantes y personal autorizado.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CICLO */}
      {cicloDetalle && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0F172A]/80"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCicloDetalle(null);
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-7 shadow-xl">
            <button
              type="button"
              onClick={() => setCicloDetalle(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 rounded-lg transition-colors"
              aria-label="Cerrar detalle del ciclo"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pr-12">
              <span className={`inline-block px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-[0.16em] ${varianteUniversidad(cicloDetalle.universidadObjetivo || 'Ciclo').acento}`}>
                {cicloDetalle.universidadObjetivo || 'Ciclo'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 mt-3">{cicloDetalle.nombre}</h2>
              {nombreUniversidad(cicloDetalle.universidadObjetivo) && (
                <p className="text-sm text-slate-600 mt-1.5">{nombreUniversidad(cicloDetalle.universidadObjetivo)}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-6 pb-6 border-b border-slate-200">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Turno</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{cicloDetalle.turno || 'Por confirmar'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Horario</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{cicloDetalle.horario || 'Por confirmar'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cursos</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {Array.isArray(cicloDetalle.cursos) ? cicloDetalle.cursos.length : cicloDetalle.cantidadCursos ?? 0} cursos
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Días</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{cicloDetalle.diasClase || 'Por confirmar'}</dd>
              </div>
              {formatearFecha(cicloDetalle.fechaInicio) && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inicio</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{formatearFecha(cicloDetalle.fechaInicio)}</dd>
                </div>
              )}
              {formatearFecha(cicloDetalle.fechaFin) && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fin</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{formatearFecha(cicloDetalle.fechaFin)}</dd>
                </div>
              )}
              {precioValido(cicloDetalle.precio) && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Precio</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">S/ {Number(cicloDetalle.precio).toFixed(2)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 mb-3">Cursos del ciclo</h3>
              {cargandoDetalle ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
                  <Loader2 className="w-7 h-7 mx-auto mb-2 text-blue-700 animate-spin" />
                  <p className="text-sm font-semibold text-slate-900">Cargando programación académica...</p>
                  <p className="text-sm text-slate-600 mt-1">Estamos consultando los cursos y docentes de este ciclo.</p>
                </div>
              ) : Array.isArray(cicloDetalle.cursos) && cicloDetalle.cursos.length > 0 ? (
                <div className="space-y-2">
                  {cicloDetalle.cursos.map((curso, index) => (
                    <div key={curso.idCurso ?? curso.id ?? index} className="rounded-lg bg-white border border-slate-200 px-4 py-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{curso.nombre || curso.nombreCurso || curso.curso || 'Curso sin nombre'}</p>
                          {(curso.docente || curso.profesor) && (
                            <p className="text-xs text-slate-600 mt-1">Docente: {curso.docente || curso.profesor}</p>
                          )}
                          {curso.codigo && <p className="text-xs text-slate-500 mt-1">Código: {curso.codigo}</p>}
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          {(curso.horario || cicloDetalle.horario) && <p className="text-xs text-blue-700">{curso.horario || cicloDetalle.horario}</p>}
                          {(curso.diasClase || cicloDetalle.diasClase) && <p className="text-xs text-slate-600 mt-1">Días: {curso.diasClase || cicloDetalle.diasClase}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
  className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center"
  role="status"
>
  <BookOpen
    className="w-7 h-7 mx-auto mb-3 text-blue-700"
    aria-hidden="true"
  />

  <p className="text-sm font-semibold text-slate-900">
    Aún no hay cursos disponibles para mostrar
  </p>

  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
    La programación académica de este ciclo todavía no está disponible en la consulta pública.
  </p>
</div>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">¿Listo para comenzar?</p>
                <p className="text-sm font-semibold text-slate-900">Puedes iniciar tu matrícula ahora.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCicloDetalle(null);
                  abrirCheckout(cicloDetalle);
                }}
                className="px-5 py-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold transition-colors"
              >
                Inscribirme en este ciclo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT DE MATRÍCULA */}
      {cicloSeleccionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0F172A]/80">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
            <button type="button" onClick={cerrarCheckout} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors" aria-label="Cerrar inscripción">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-serif text-2xl text-slate-900 mb-1">Inscripción</h2>
            <p className="text-xs text-slate-500 mb-3">Modo demostración: esta pantalla no procesa pagos reales. La matrícula de prueba se registra con pago pendiente.</p>
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Resumen de inscripción</p>
              <p className="text-sm font-bold text-slate-900 mt-1.5">{cicloSeleccionado.nombre}</p>
              {cicloSeleccionado.universidadObjetivo && (
                <p className="text-xs text-blue-700 mt-0.5">
                  {nombreUniversidad(cicloSeleccionado.universidadObjetivo) || cicloSeleccionado.universidadObjetivo}
                </p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {cicloSeleccionado.turno && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">Turno</dt>
                    <dd className="text-xs font-semibold text-slate-800">{cicloSeleccionado.turno}</dd>
                  </div>
                )}
                {cicloSeleccionado.horario && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">Horario</dt>
                    <dd className="text-xs font-semibold text-slate-800">{cicloSeleccionado.horario}</dd>
                  </div>
                )}
                {cicloSeleccionado.diasClase && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">Días</dt>
                    <dd className="text-xs font-semibold text-slate-800">{cicloSeleccionado.diasClase}</dd>
                  </div>
                )}
                {formatearFecha(cicloSeleccionado.fechaInicio) && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">Inicio</dt>
                    <dd className="text-xs font-semibold text-slate-800">{formatearFecha(cicloSeleccionado.fechaInicio)}</dd>
                  </div>
                )}
                {precioValido(cicloSeleccionado.precio) && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">Precio</dt>
                    <dd className="text-xs font-semibold text-slate-800">S/ {Number(cicloSeleccionado.precio).toFixed(2)}</dd>
                  </div>
                )}
              </dl>
            </div>
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handlePagarCheckout} className="space-y-4 text-left">
              {[
                { key: 'nombres', label: 'Nombres', type: 'text', ph: 'Tus nombres' },
                { key: 'apellidos', label: 'Apellidos', type: 'text', ph: 'Tus apellidos' },
                { key: 'correo', label: 'Correo', type: 'email', ph: 'correo@ejemplo.com' }
              ].map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={`checkout-${f.key}`}
                    className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
                  >
                    {f.label}
                  </label>

                  <input
                    type={f.type}
                    required
                    id={`checkout-${f.key}`}
                    disabled={procesandoPago || verificandoCorreo}
                    placeholder={f.ph}
                    value={checkoutData[f.key]}
                    onChange={(e) => {
                      if (f.key === 'correo') {
                        handleCorreoCheckoutChange(e);
                        return;
                      }

                      setCheckoutData((actual) => ({
                        ...actual,
                        [f.key]: e.target.value
                      }));

                      setCheckoutErrors((actual) => ({
                        ...actual,
                        [f.key]: ''
                      }));

                      setError(null);
                    }}
                    onBlur={(e) => {
                      if (
                        f.key === 'correo' &&
                        e.target.validity.valid &&
                        e.target.value.trim()
                      ) {
                        verificarCorreoParaCheckout(e.target.value);
                      }
                    }}
                    aria-invalid={Boolean(checkoutErrors[f.key])}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                      checkoutErrors[f.key]
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />

                  {checkoutErrors[f.key] && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {checkoutErrors[f.key]}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={procesandoPago || verificandoCorreo}
                className="w-full mt-2 py-3.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(procesandoPago || verificandoCorreo) && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{verificandoCorreo ? 'Verificando correo...' : 'Simular matrícula (sin cobro)'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
