import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Users,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Clock,
  BookOpen,
  Calendar
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

export default function LandingPage({ onLoginSuccess }) {
  const [authModal, setAuthModal] = useState(null);
  const [rolEsperado, setRolEsperado] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginData, setLoginData] = useState({ usuario: '', password: '' });
  const [ciclos, setCiclos] = useState([]);
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
      text: 'Por favor espera un momento',
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
        monto: 1.0
      });

      await Swal.fire({
        icon: 'success',
        title: resultado.esReinscripcion ? '¡Reinscripción exitosa!' : '¡Inscripción exitosa!',
        text: resultado.esReinscripcion
          ? 'Tu matrícula fue registrada usando tu cuenta existente. Revisa tu correo para generar una contraseña temporal nueva y acceder.'
          : 'Revisa tu correo para obtener tus accesos.',
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
      const rolRecibidoTexto = (data.rol || data.perfil || data.NombrePerfil || '').toString().toLowerCase();
      const idPerfilRecibido = (data.idPerfil || data.IdPerfil || data.id_perfil || '').toString();
      
      if (rolEsperado) {
        const nombreEsperado = (MAPA_ROLES[rolEsperado] || '').toLowerCase();
        const coincideId = idPerfilRecibido === rolEsperado;
        const coincideNombre = rolRecibidoTexto.includes(nombreEsperado);
        if (!coincideId && !coincideNombre) {
          const perfilCuenta = data.rol || data.perfil || data.NombrePerfil || 'Usuario';
          throw new Error(
            `Acceso restringido: Esta cuenta tiene asignado el perfil "${perfilCuenta}" y no puede ingresar por el portal de ${MAPA_ROLES[rolEsperado]}. Por favor ingresa por la tarjeta correspondiente.`
          );
        }
      }
      
      const academia = data.academia || {};
      const sessionUser = {
        nombre: data.usuario || data.nombres || data.nombre || inputUser,
        rol: data.rol || data.perfil || data.NombrePerfil || 'Administrador',
        token: data.token || data.jwt || data.accessToken,
        idAcademia: data.idAcademia || academia.idAcademia || academia.id || 1,
        colorTema: academia.colorTema || data.colorTema || '#2563eb',
        logoUrl: academia.logoUrl || data.logoUrl || null,
        nombreAcademia: academia.nombreAcademia || data.nombreAcademia || 'AcadeSys'
      };
      if (!sessionUser.token) {
        throw new Error('El servidor no devolvió un token de sesión válido.');
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
    <div className="relative min-h-screen bg-[linear-gradient(145deg,#07152f_0%,#0a2149_42%,#0a3272_72%,#071a3c_100%)] text-slate-100 overflow-hidden font-sans select-none">
      <div className="absolute -top-48 -left-56 w-[760px] h-[760px] bg-blue-500/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[18%] -right-72 w-[900px] h-[900px] bg-blue-500/20 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute -bottom-72 -left-40 w-[900px] h-[700px] bg-blue-600/20 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.11] pointer-events-none bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:32px_32px]" />

      <header className="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/10 bg-[#06142b]/35 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25 border border-white/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            AcadeSys
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => openModal('login', 4)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20"
          >
            Soy Estudiante
          </button>
          <button
            type="button"
            onClick={() => openModal('login', 1)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
          >
            Administrador
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 sm:pt-10 pb-20 flex flex-col items-center text-center">
        {/* HERO UNIVERSIDADES Y ESTUDIANTES */}
        <section className="relative w-full min-h-[390px] sm:min-h-[440px] rounded-[2rem] overflow-hidden border border-blue-400/30 shadow-2xl shadow-blue-950/50 mb-12 flex items-center justify-center">
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
          </div>
        </section>

        {/* CICLOS DISPONIBLES */}
        <section className="w-full mb-16 text-left" id="ciclos">
          <h2 className="text-2xl sm:text-[28px] font-black text-white mb-2 text-center">Ciclos disponibles</h2>
          <p className="text-slate-400 text-sm text-center mb-8">Elige tu ciclo e inscríbete en minutos</p>
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
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {ciclos.map((ciclo) => {
      const capacidad = Number(ciclo.capacidad || 0);
      const inscritos = Number(ciclo.totalAlumnos || 0);
      const vacantes = Math.max(capacidad - inscritos, 0);
      const cupoCompleto = capacidad > 0 && vacantes <= 0;

      return (
        <article
          key={ciclo.idCiclo ?? ciclo.id}
          className="group p-6 rounded-3xl bg-[#071a38]/90 border border-blue-400/35 backdrop-blur-xl hover:border-sky-400/60 hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-xl shadow-black/20"
        >
          <div className="flex items-start justify-between gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-300"
              aria-hidden="true"
            >
              <GraduationCap className="w-6 h-6" />
            </div>

            <span
              className={`px-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${
                cupoCompleto
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
              }`}
            >
              {cupoCompleto ? 'Cupo completo' : 'Disponible'}
            </span>
          </div>

          <h3 className="text-xl font-black text-white mb-2">
            {ciclo.nombre || 'Ciclo sin nombre'}
          </h3>

          <p className="text-sm text-slate-300 mb-5">
            Universidad objetivo:{' '}
            <span className="font-semibold text-white">
              {ciclo.universidadObjetivo || 'Por confirmar'}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-400">
                Inscritos
              </p>
              <p className="text-base font-bold text-white mt-1">
                {inscritos}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-400">
                Vacantes
              </p>
              <p className="text-base font-bold text-white mt-1">
                {capacidad > 0 ? vacantes : 'Por confirmar'}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Clock
                className="w-4 h-4 text-indigo-300 shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="text-white">Turno:</strong>{' '}
                {ciclo.turno || 'Por confirmar'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Calendar
                className="w-4 h-4 text-blue-300 shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="text-white">Horario:</strong>{' '}
                {ciclo.horario || 'Por confirmar'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <BookOpen
                className="w-4 h-4 text-cyan-300 shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="text-white">Cursos:</strong>{' '}
                {ciclo.totalCursos}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Users
                className="w-4 h-4 text-cyan-300 shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="text-white">Días:</strong>{' '}
                {ciclo.diasClase || 'Por confirmar'}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => abrirDetalleCiclo(ciclo)}
              className="flex-1 py-3 rounded-2xl border border-slate-600 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#071a38] text-sm font-bold transition"
              aria-label={`Ver detalle del ciclo ${ciclo.nombre || ''}`}
            >
              Ver detalle
            </button>

            <button
              type="button"
              onClick={() => abrirCheckout(ciclo)}
              disabled={cupoCompleto}
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-[#071a38] text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cupoCompleto ? 'Cupo completo' : 'Inscribirme'}
            </button>
          </div>
        </article>
      );
    })}
  </div>
)}

        </section>

        {/*PROPUESTA DE VALOR */}
        <section className="w-full mb-16">
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

      <footer className="relative z-20 max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/40 text-center text-xs text-slate-400">
        <p>© 2026 AcadeSys - Sistema de Gestión Académica e Inteligencia Artificial. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL DE INICIO DE SESIÓN */}
      {authModal === 'login' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-md bg-[#0B1528] border border-blue-950/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-indigo-500/30 flex items-center justify-center text-blue-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300">AcadeSys</p>
                  <h2 className="text-2xl font-black text-white">Iniciar sesión</h2>
                </div>
              </div>
              <p className="text-sm text-slate-400">Ingresa tus credenciales para acceder a tu panel.</p>
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
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
                    className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
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
                <span>{loading ? 'Autenticando...' : 'Ingresar al sistema'}</span>
              </button>
            </form>
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-sm text-center text-slate-300">Las credenciales son asignadas según el perfil de tu cuenta.</p>
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
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">Detalle del ciclo</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{cicloDetalle.nombre}</h2>
              <p className="text-sm text-slate-300 mt-2">Revisa la programación y las condiciones de este ciclo antes de inscribirte.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs font-semibold text-slate-300">Turno</p>
                </div>
                <p className="text-sm font-bold text-white mt-2">{cicloDetalle.turno || 'Por confirmar'}</p>
              </div>
              <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <p className="text-xs font-semibold text-slate-300">Horario</p>
                </div>
                <p className="text-sm font-bold text-white mt-2">{cicloDetalle.horario || 'Por confirmar'}</p>
              </div>
              <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs font-semibold text-slate-300">Modalidad</p>
                </div>
                <p className="text-sm font-bold text-white mt-2">{cicloDetalle.modalidad || 'Preuniversitaria'}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-800/50 border border-slate-700 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Programación académica</h3>
                  <p className="text-sm text-slate-300 mt-1">Cursos y docentes disponibles para este ciclo.</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xs font-bold text-blue-300">
                    {Array.isArray(cicloDetalle.cursos) ? cicloDetalle.cursos.length : cicloDetalle.cantidadCursos ?? 0} cursos
                  </span>
                </div>
              </div>
              {cargandoDetalle ? (
                <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-6 text-center">
                  <Loader2 className="w-7 h-7 mx-auto mb-2 text-blue-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Cargando programación académica...</p>
                  <p className="text-sm text-slate-300 mt-1">Estamos consultando los cursos y docentes de este ciclo.</p>
                </div>
              ) : Array.isArray(cicloDetalle.cursos) && cicloDetalle.cursos.length > 0 ? (
                <div className="space-y-2">
                  {cicloDetalle.cursos.map((curso, index) => (
                    <div key={curso.idCurso ?? curso.id ?? index} className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{curso.nombre || curso.nombreCurso || curso.curso || 'Curso sin nombre'}</p>
                          {curso.codigo && <p className="text-xs text-slate-300 mt-1">Código: {curso.codigo}</p>}
                        </div>
                        <div className="text-left sm:text-right">
                          {(curso.horario || cicloDetalle.horario) && <p className="text-xs text-blue-300">{curso.horario || cicloDetalle.horario}</p>}
                          {(curso.diasClase || cicloDetalle.diasClase) && <p className="text-xs text-slate-300 mt-1">Días: {curso.diasClase || cicloDetalle.diasClase}</p>}
                          {(curso.docente || curso.profesor) && <p className="text-xs text-slate-300 mt-1">Docente: {curso.docente || curso.profesor}</p>}
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
                <span>{verificandoCorreo ? 'Verificando correo...' : 'Pagar S/ 1.00'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
