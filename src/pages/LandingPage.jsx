
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  ShieldCheck,
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
  Clock,
  BookOpen,
  Phone
} from 'lucide-react';
import {
  API_URL,
  obtenerCiclosPublicos,
  obtenerCursosCiclo,
  verificarMatriculaExistente,
  procesarCheckoutMatricula
} from '../services/api';

const MAPA_ROLES = {
  '1': 'Administrador',
  '2': 'Docente',
  '3': 'Tutor de Aula',
  '4': 'Estudiante'
};

// Normaliza nombres/alias de rol para compatibilidad (Admin≈Administrador,
// Estudiante≈Alumno, Tutor≈Tutor de Aula, RRHH≈Recursos Humanos).
// No se hardcodean IDs: el backend entrega el perfil real.
const normalizarRol = (texto) => {
  const t = String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (t.includes('admin') || t.includes('recursos humanos') || t === 'rrhh') return 'administrador';
  if (t.includes('docente')) return 'docente';
  if (t.includes('tutor')) return 'tutor de aula';
  if (t.includes('alumno') || t.includes('estudiante')) return 'alumno';
  return t;
};

// Identidad visual determinista por universidad objetivo.
// La variante se elige por hash estable del nombre: nunca cambia entre recargas
// y no usa Math.random(). Todas las variantes se mantienen dentro de la paleta
// azul/celeste de AcadeSys.
const VARIANTES_UNIVERSIDAD = [
  {
    cabecera: 'from-blue-700 via-blue-800 to-[#0a2149]',
    acento: 'text-blue-300',
    linea: 'from-blue-400/50'
  },
  {
    cabecera: 'from-indigo-700 via-blue-800 to-[#0a1f45]',
    acento: 'text-indigo-300',
    linea: 'from-indigo-400/50'
  },
  {
    cabecera: 'from-sky-700 via-blue-800 to-[#08204a]',
    acento: 'text-sky-300',
    linea: 'from-sky-400/50'
  },
  {
    cabecera: 'from-cyan-700 via-blue-800 to-[#08203f]',
    acento: 'text-cyan-300',
    linea: 'from-cyan-400/50'
  },
  {
    cabecera: 'from-blue-800 via-slate-800 to-[#0b1c3a]',
    acento: 'text-blue-200',
    linea: 'from-blue-300/50'
  },
  {
    cabecera: 'from-slate-700 via-blue-800 to-[#0a1f45]',
    acento: 'text-slate-300',
    linea: 'from-slate-400/50'
  }
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
          background: '#0a192f',
          color: '#fff'
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
          background: '#0a192f',
          color: '#fff'
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
        background: '#0a192f',
        color: '#fff'
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
        background: '#0a192f',
        color: '#fff'
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
      background: '#0a192f',
      color: '#fff',
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
        background: '#0a192f',
        color: '#fff'
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
      const perfilNormalizado = normalizarRol(data.rol || data.perfil || data.NombrePerfil);
      const idPerfilRecibido = (data.idPerfil || data.IdPerfil || data.id_perfil || '').toString();
      
      if (rolEsperado) {
        const perfilEsperado = normalizarRol(MAPA_ROLES[rolEsperado]);
        const coincideId = idPerfilRecibido === rolEsperado;
        const coincideNombre = perfilNormalizado !== '' && perfilNormalizado === perfilEsperado;
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
        idAcademia: data.idAcademia || academia.idAcademia || academia.id || 1,
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
      localStorage.setItem('acadesys_token', sessionUser.token);
      localStorage.setItem('acadesys_session', JSON.stringify(sessionUser));
      onLoginSuccess(sessionUser);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen scroll-smooth bg-[linear-gradient(145deg,#07152f_0%,#0a2149_42%,#0a3272_72%,#071a3c_100%)] text-slate-100 overflow-hidden font-sans select-none">
      <div className="absolute -top-48 -left-56 w-[760px] h-[760px] bg-blue-500/14 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[18%] -right-72 w-[900px] h-[900px] bg-blue-500/14 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute -bottom-72 -left-40 w-[900px] h-[700px] bg-blue-600/14 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:38px_38px]" />

      <header className="relative z-20 border-b border-white/10 bg-[#06142b]/35 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a href="#inicio" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25 border border-white/10">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-white">AcadeSys</span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">Plataforma Pre-U</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#inicio" className="hover:text-white transition">Inicio</a>
            <a href="#ciclos" className="hover:text-white transition">Ciclos</a>
            <a href="#nosotros" className="hover:text-white transition">Nosotros</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openModal('login', 4)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => openModal('login', 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Administrador
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 sm:pt-10 pb-20 flex flex-col items-center text-center">
        {/* HERO UNIVERSIDADES Y ESTUDIANTES */}
        <section id="inicio" className="relative w-full scroll-mt-24 min-h-[390px] sm:min-h-[440px] rounded-[2rem] overflow-hidden border border-blue-400/30 shadow-2xl shadow-blue-950/50 mb-12 flex items-center justify-center">
          <div className="absolute inset-0 grid grid-cols-2 lg:grid-cols-4">
            {[
              { nombre: 'UNMSM', src: 'https://images.openai.com/static-rsc-4/A9WTlnq_FRbD6ehh18vI-V788eVGGuTs0_-orzjbGyNmAz-0tJZfp6rLBbXZFX0H2_gy_PP-v2EcERGI43T4XYkaejZYfypKtLvHtg3wLuxPm_n6LRpSlbcjhstuvkZgYniBLCIyDqG0xfTVlVf2ie4KgC1E7sBLWMguuQucX2BbXWWT9bqLOTcJRgoL11mp?purpose=fullsize' },
              { nombre: 'UNI', src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGj-svbJXdNoKR3DDZwXOVqP7AK3XjX5lc7n_M3BengBanvixuanQItK6u&s=10' },
              { nombre: 'PUCP', src: 'https://reservatuespacio.pucp.edu.pe/wp-content/uploads/2019/02/Auditorio_1.jpg' },
              { nombre: 'UNAC', src: 'https://unac.edu.pe/wp-content/uploads/2026/oti/landing/web_2.png' }
            ].map((universidad) => (
              <div key={universidad.nombre} className="relative min-h-[215px] sm:min-h-[250px] lg:min-h-full overflow-hidden group">
                <img
                  src={universidad.src}
                  alt={`Campus ${universidad.nombre}`}
                  className="absolute inset-0 w-full h-full object-cover grayscale-[15%] saturate-[0.85] scale-[1.03] group-hover:scale-[1.08] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-[#07111F]/22" />
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-[#07111F]/70 border border-white/10 backdrop-blur-md text-[10px] font-black tracking-[0.16em] text-white/80">
                  {universidad.nombre}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050B18]/35 via-[#07111F]/58 to-[#050B18]/82" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.10),transparent_55%)]" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-10 sm:py-12 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-300/25 text-blue-200 text-[11px] font-bold tracking-[0.12em] mb-4 backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>PREPARACIÓN PREUNIVERSITARIA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.035em] leading-[1.08] mb-4 drop-shadow-2xl">
              Prepárate para ingresar a la universidad<br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-sky-300 to-cyan-200">con el ciclo ideal para ti</span>
            </h1>
            <p className="max-w-2xl text-slate-200/80 text-sm sm:text-base lg:text-[17px] leading-relaxed font-normal drop-shadow-lg">
              Conoce nuestros ciclos preuniversitarios, revisa los turnos y horarios disponibles y elige la preparación que mejor se adapte a tu objetivo universitario.
            </p>
            <a
              href="#ciclos"
              className="mt-7 inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition shadow-lg shadow-blue-600/25"
            >
              Ver ciclos
            </a>
          </div>
        </section>

        {/* CICLOS DISPONIBLES */}
        <section className="w-full scroll-mt-24 mb-16 text-left" id="ciclos">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 text-center">Nuestros ciclos</h2>
          <p className="text-slate-400 text-sm text-center max-w-2xl mx-auto mb-6">Elige tu universidad objetivo y encuentra el programa de preparación adecuado.</p>
          {loadingCiclos ? (
  <div
    className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-[#071a38]/80 border border-blue-400/20 text-center shadow-xl"
    role="status"
    aria-live="polite"
  >
    <Loader2
      className="w-7 h-7 mx-auto mb-3 text-blue-400 animate-spin"
      aria-hidden="true"
    />
    <h3 className="text-base sm:text-lg font-bold text-white">
      Cargando ciclos disponibles
    </h3>
    <p className="text-sm text-slate-300 mt-2">
      Estamos consultando la oferta académica.
    </p>
  </div>
) : errorCiclos ? (
  <div
    className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-[#071a38]/80 border border-rose-400/25 text-center shadow-xl"
    role="alert"
  >
    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-400/20 flex items-center justify-center">
      <AlertCircle
        className="w-7 h-7 text-rose-300"
        aria-hidden="true"
      />
    </div>

    <h3 className="text-base sm:text-lg font-bold text-white">
      No pudimos cargar los ciclos
    </h3>

    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
      No fue posible consultar la oferta académica en este momento.
    </p>

    <p className="text-sm text-rose-200/80 mt-2">
      {errorCiclos}
    </p>
  </div>
) : ciclos.length === 0 ? (
  <div
    className="w-full max-w-2xl mx-auto p-10 rounded-3xl bg-[#071a38]/80 border border-blue-400/20 text-center shadow-xl"
    role="status"
  >
    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
      <GraduationCap
        className="w-7 h-7 text-blue-400"
        aria-hidden="true"
      />
    </div>

    <h3 className="text-lg font-bold text-white">
      Nuevos ciclos se aperturarán pronto
    </h3>

    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
      Actualmente no hay ciclos disponibles para matrícula.
      Vuelve a revisar próximamente para conocer nuevas fechas,
      turnos y horarios.
    </p>
  </div>
) : (
  <div className="w-full">
    {/* SELECTOR DE UNIVERSIDAD OBJETIVO (dinámico, con los datos reales) */}
    <div className="mb-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 text-center mb-2.5">
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
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                activo
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-[#0B1528]/60 border-blue-950/70 text-slate-300 hover:text-white hover:border-blue-500/40'
              }`}
            >
              {opcion.clave === 'TODOS' ? 'Todos' : opcion.clave}
            </button>
          );
        })}
      </div>
    </div>

    {/* SECCIONES POR UNIVERSIDAD */}
    <div className="space-y-10">
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
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mt-1">
                    {nombreCompleto}
                  </h3>
                </>
              ) : (
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {universidad.clave}
                </h3>
              )}
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ciclos de preparación · {universidad.ciclos.length} {universidad.ciclos.length === 1 ? 'programa' : 'programas'}
              </p>
            </div>
            <div className={`h-px w-full bg-gradient-to-r ${variante.linea} to-transparent mb-5`} />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {universidad.ciclos.map((ciclo) => {
                const capacidad = Number(ciclo.capacidad || 0);
                const inscritos = Number(ciclo.totalAlumnos || 0);
                const vacantes = Math.max(capacidad - inscritos, 0);
                const cupoCompleto = capacidad > 0 && vacantes <= 0;

                return (
                  <article
                    key={ciclo.idCiclo ?? ciclo.id}
                    className="group rounded-2xl overflow-hidden bg-[#071a38]/80 border border-blue-400/20 hover:border-blue-400/45 hover:-translate-y-0.5 transition-all duration-300 flex flex-col shadow-lg shadow-black/20"
                  >
                    {/* CABECERA GRÁFICA (identidad sutil por universidad) */}
                    <div className="relative h-20 sm:h-24 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${variante.cabecera}`} />
                      <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full border border-white/10" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071a38] to-transparent" />

                      <div className="relative h-full flex items-center justify-between gap-3 px-4 sm:px-5">
                        <span className={`text-xs font-bold uppercase tracking-[0.14em] ${variante.acento}`}>
                          {ciclo.universidadObjetivo || universidad.clave}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap ${
                            cupoCompleto ? 'text-rose-200' : 'text-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cupoCompleto ? 'bg-rose-300' : 'bg-emerald-300'}`}
                            aria-hidden="true"
                          />
                          {cupoCompleto ? 'Cupo completo' : 'Disponible'}
                        </span>
                      </div>
                    </div>

                    {/* INFORMACIÓN DEL CICLO */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-xl font-bold text-white leading-snug">
                        {ciclo.nombre || 'Ciclo sin nombre'}
                      </h3>

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Turno</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-100">{ciclo.turno || 'Por confirmar'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Horario</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-100">{ciclo.horario || 'Por confirmar'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Días</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-100">{ciclo.diasClase || 'Por confirmar'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cursos</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-100">
                            {ciclo.totalCursos} {Number(ciclo.totalCursos) === 1 ? 'curso' : 'cursos'}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 pt-3.5 border-t border-blue-950/60">
                        <p className="text-xs text-slate-400">
                          <strong className="font-semibold text-slate-200">{inscritos}</strong> inscritos
                          {capacidad > 0
                            ? <> · <strong className="font-semibold text-slate-200">{vacantes}</strong> vacantes</>
                            : <> · vacantes por confirmar</>}
                        </p>
                      </div>

                      <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => abrirDetalleCiclo(ciclo)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-600/70 text-slate-200 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#071a38] text-sm font-semibold transition-colors"
                          aria-label={`Ver detalle del ciclo ${ciclo.nombre || ''}`}
                        >
                          Ver detalle
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirCheckout(ciclo)}
                          disabled={cupoCompleto}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-[#071a38] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/*PROPUESTA DE VALOR */}
        <section id="nosotros" className="w-full scroll-mt-24 mb-16">
          <div className="text-center mb-8">
            <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">Nuestra propuesta</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Todo lo que necesitas para prepararte</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
              Una experiencia de preparación enfocada en tu objetivo universitario.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-3xl bg-[#0B1528]/75 border border-blue-950/80 shadow-xl">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-300 mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Ciclos preuniversitarios</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Revisa nuestra oferta educativa y elige el ciclo que corresponda a tu objetivo.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#0B1528]/75 border border-blue-950/80 shadow-xl">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Turnos y horarios</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consulta los horarios disponibles y elige el turno que mejor se adapte a ti.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#0B1528]/75 border border-blue-950/80 shadow-xl">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Inscripción rápida</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecciona tu ciclo, completa tus datos y comienza tu proceso de matrícula.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-20 max-w-7xl mx-auto px-6 pt-8 pb-28 sm:pb-8 border-t border-slate-800/40 text-center text-xs text-slate-400">
        <p>© 2026 AcadeSys - Sistema de Gestión Académica e Inteligencia Artificial. Todos los derechos reservados.</p>
      </footer>

      {/* WIDGET FLOTANTE DE CONTACTO (z-30: sobre el contenido, debajo de los modales z-40/z-50) */}
      <div className="fixed z-30 right-4 bottom-4 sm:right-6 sm:bottom-6 flex flex-col items-end gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center rounded-xl bg-[#0B1528] border border-blue-950/80 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-black/30">
            ¿Contáctanos?
          </span>
          <button
            type="button"
            onClick={contactarPorTelefono}
            aria-label="Contactar con AcadeSys"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0B1528] hover:bg-blue-700 border border-blue-400/30 text-white flex items-center justify-center shadow-lg shadow-black/30 transition duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050B18] p-4 sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Fondo académico provisional (sin fotografía por ahora) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-[linear-gradient(150deg,#050B18_0%,#0a1f45_46%,#0b2a5e_74%,#050B18_100%)]" />
            <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="absolute -left-28 top-1/4 h-[420px] w-[420px] rotate-45 rounded-[3rem] border border-blue-400/15" />
            <div className="absolute -right-32 -top-24 h-[520px] w-[520px] rotate-12 rounded-[4rem] border border-sky-400/10" />
            <div className="absolute -bottom-32 right-1/4 h-[360px] w-[360px] rotate-45 rounded-[3rem] border border-blue-300/10" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-blue-400/10 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-[#050B18]/45 pointer-events-none" aria-hidden="true" />

          {/* Panel de inicio de sesión */}
          <div className="relative z-10 w-full max-w-[420px] rounded-3xl border border-blue-950/80 bg-[#0B1528]/95 p-6 sm:p-8 shadow-2xl shadow-black/50">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25 border border-white/10">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-extrabold tracking-tight text-white">AcadeSys</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" aria-hidden="true" />
                    Plataforma Pre-U
                  </p>
                </div>
              </div>
              <h2 className="text-2xl font-black text-white">Bienvenido a AcadeSys</h2>
              <p className="text-sm text-slate-400 mt-1.5">Ingresa tus datos para acceder a tu portal académico.</p>
              {rolEsperado && (
                <div className="inline-flex mt-4 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-bold text-blue-300">
                  Acceso para: {rolEsperado === '4' ? 'Estudiante' : rolEsperado === '1' ? 'Administrador' : MAPA_ROLES[rolEsperado]}
                </div>
              )}
            </div>
            {error && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No fue posible iniciar sesión</p>
                  <p className="mt-1 text-rose-300/80">{error}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label
  htmlFor="login-usuario"
  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label
  htmlFor="login-password"
  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
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
                    className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
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
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Autenticando...' : 'Iniciar sesión'}</span>
              </button>
            </form>
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-sm text-center text-slate-300">Acceso para estudiantes y personal autorizado.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CICLO */}
      {cicloDetalle && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCicloDetalle(null);
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0B1528] border border-blue-950/80 rounded-3xl p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setCicloDetalle(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl transition"
              aria-label="Cerrar detalle del ciclo"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pr-12">
              <span className={`inline-block px-3 py-1 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-[0.16em] ${varianteUniversidad(cicloDetalle.universidadObjetivo || 'Ciclo').acento}`}>
                {cicloDetalle.universidadObjetivo || 'Ciclo'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">{cicloDetalle.nombre}</h2>
              {nombreUniversidad(cicloDetalle.universidadObjetivo) && (
                <p className="text-sm text-slate-400 mt-1.5">{nombreUniversidad(cicloDetalle.universidadObjetivo)}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-6 pb-6 border-b border-blue-950/60">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Turno</dt>
                <dd className="mt-1 text-sm font-semibold text-white">{cicloDetalle.turno || 'Por confirmar'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Horario</dt>
                <dd className="mt-1 text-sm font-semibold text-white">{cicloDetalle.horario || 'Por confirmar'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cursos</dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  {Array.isArray(cicloDetalle.cursos) ? cicloDetalle.cursos.length : cicloDetalle.cantidadCursos ?? 0} cursos
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Días</dt>
                <dd className="mt-1 text-sm font-semibold text-white">{cicloDetalle.diasClase || 'Por confirmar'}</dd>
              </div>
              {formatearFecha(cicloDetalle.fechaInicio) && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inicio</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">{formatearFecha(cicloDetalle.fechaInicio)}</dd>
                </div>
              )}
              {formatearFecha(cicloDetalle.fechaFin) && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fin</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">{formatearFecha(cicloDetalle.fechaFin)}</dd>
                </div>
              )}
              {precioValido(cicloDetalle.precio) && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Precio</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">S/ {Number(cicloDetalle.precio).toFixed(2)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-blue-300 mb-3">Cursos del ciclo</h3>
              {cargandoDetalle ? (
                <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-6 text-center">
                  <Loader2 className="w-7 h-7 mx-auto mb-2 text-blue-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Cargando programación académica...</p>
                  <p className="text-sm text-slate-300 mt-1">Estamos consultando los cursos y docentes de este ciclo.</p>
                </div>
              ) : Array.isArray(cicloDetalle.cursos) && cicloDetalle.cursos.length > 0 ? (
                <div className="space-y-2">
                  {cicloDetalle.cursos.map((curso, index) => (
                    <div key={curso.idCurso ?? curso.id ?? index} className="rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{curso.nombre || curso.nombreCurso || curso.curso || 'Curso sin nombre'}</p>
                          {(curso.docente || curso.profesor) && (
                            <p className="text-xs text-slate-400 mt-1">Docente: {curso.docente || curso.profesor}</p>
                          )}
                          {curso.codigo && <p className="text-xs text-slate-500 mt-1">Código: {curso.codigo}</p>}
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          {(curso.horario || cicloDetalle.horario) && <p className="text-xs text-blue-300">{curso.horario || cicloDetalle.horario}</p>}
                          {(curso.diasClase || cicloDetalle.diasClase) && <p className="text-xs text-slate-400 mt-1">Días: {curso.diasClase || cicloDetalle.diasClase}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
  className="rounded-2xl bg-slate-900/70 border border-slate-700 p-6 text-center"
  role="status"
>
  <BookOpen
    className="w-7 h-7 mx-auto mb-3 text-blue-300"
    aria-hidden="true"
  />

  <p className="text-sm font-semibold text-white">
    Aún no hay cursos disponibles para mostrar
  </p>

  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
    La programación académica de este ciclo todavía no está disponible en la consulta pública.
  </p>
</div>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">¿Listo para comenzar?</p>
                <p className="text-sm font-semibold text-white">Puedes iniciar tu matrícula ahora.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCicloDetalle(null);
                  abrirCheckout(cicloDetalle);
                }}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition shadow-lg shadow-blue-600/20"
              >
                Inscribirme en este ciclo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT DE MATRÍCULA */}
      {cicloSeleccionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0B1528] border border-blue-950/80 rounded-3xl p-8 shadow-2xl">
            <button type="button" onClick={cerrarCheckout} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-white mb-1">Inscripción</h2>
            <p className="text-xs text-slate-300 mb-3">Modo demostración: esta pantalla no procesa pagos reales. La matrícula de prueba se registra con pago pendiente.</p>
            <p className="text-xs text-slate-400 mb-6">
              Ciclo: <span className="text-blue-300 font-semibold">{cicloSeleccionado.nombre}</span>{cicloSeleccionado.turno ? ` · ${cicloSeleccionado.turno}` : ''}
            </p>
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
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
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
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
                    className={`w-full px-4 py-3 bg-slate-800/80 border rounded-2xl text-sm text-white placeholder-slate-400 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                      checkoutErrors[f.key]
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />

                  {checkoutErrors[f.key] && (
                    <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {checkoutErrors[f.key]}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={procesandoPago || verificandoCorreo}
                className="w-full mt-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
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
