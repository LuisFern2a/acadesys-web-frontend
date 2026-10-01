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
  Clock
} from 'lucide-react';
import {
  API_URL,
  obtenerCiclosPublicos,
  procesarCheckoutMatricula
} from '../services/api';

const MAPA_ROLES = {
  '1': 'Administrador',
  '2': 'Docente',
  '3': 'Tutor de Aula',
  '4': 'Alumno'
};

export default function LandingPage({ onLoginSuccess }) {
  const [authModal, setAuthModal] = useState(null);
  const [rolEsperado, setRolEsperado] = useState(null); // '1', '2', '4' o null si entra desde el header
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [loginData, setLoginData] = useState({ usuario: '', password: '' });
  

  const [ciclos, setCiclos] = useState([]);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [checkoutData, setCheckoutData] = useState({ nombres: '', apellidos: '', correo: '' });
  const [procesandoPago, setProcesandoPago] = useState(false);

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
        const data = await obtenerCiclosPublicos();
        setCiclos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Error al cargar ciclos públicos:', err);
      } finally {
        setLoadingCiclos(false);
      }
    }
    cargarCiclos();
  }, []);

  const abrirCheckout = (ciclo) => {
  setError(null);
  setCheckoutData({ nombres: '', apellidos: '', correo: '' });
  setCicloSeleccionado(ciclo);
};

const cerrarCheckout = () => {
  if (procesandoPago) return;
  setCicloSeleccionado(null);
  setError(null);
};

  const handlePagarCheckout = async (e) => {
  e.preventDefault();
  setError(null);
  setProcesandoPago(true);

  Swal.fire({
    title: 'Procesando pago...',
    text: 'Por favor espera un momento',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: '#0f172a',
    color: '#fff',
    didOpen: () => Swal.showLoading()
  });

  try {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // simulación

    await procesarCheckoutMatricula({
      idCiclo: cicloSeleccionado?.idCiclo ?? cicloSeleccionado?.id,
      nombres: checkoutData.nombres.trim(),
      apellidos: checkoutData.apellidos.trim(),
      correo: checkoutData.correo.trim(),
      monto: 1.0
    });

    await Swal.fire({
      icon: 'success',
      title: '¡Inscripción exitosa!',
      text: 'Revisa tu correo para obtener tus accesos',
      confirmButtonText: 'Ir al inicio',
      confirmButtonColor: '#4f46e5',
      background: '#0f172a',
      color: '#fff'
    });

    setCicloSeleccionado(null);
    window.location.href = '/';
  } catch (err) {
    Swal.close();
    setError(err.message || 'Error al procesar el pago.');
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

      // Identificación normalizada del perfil devuelto por la API
      const rolRecibidoTexto = (data.rol || data.perfil || data.NombrePerfil || '').toString().toLowerCase();
      const idPerfilRecibido = (data.idPerfil || data.IdPerfil || data.id_perfil || '').toString();

      // Validación de concordancia con la tarjeta por la que entró
      if (rolEsperado) {
        const nombreEsperado = (MAPA_ROLES[rolEsperado] || '').toLowerCase();
        
        const coincideId = idPerfilRecibido === rolEsperado;
        const coincideNombre = rolRecibidoTexto.includes(nombreEsperado);
        
        // El administrador (ID 1) siempre tiene permiso de entrar si lo requiere
        if (!coincideId && !coincideNombre) {
          const perfilCuenta = data.rol || data.perfil || data.NombrePerfil || 'Usuario';
          throw new Error(
            `Acceso restringido: Esta cuenta tiene asignado el perfil "${perfilCuenta}" y no puede ingresar por el portal de ${MAPA_ROLES[rolEsperado]}. Por favor ingresa por la tarjeta correspondiente.`
          );
        }
      }

      // Captura de datos de branding multi-tenant (res.data.academia)
      const academia = data.academia || {};

      const sessionUser = {
        nombre: data.usuario || data.nombres || data.nombre || inputUser,
        rol: data.rol || data.perfil || data.NombrePerfil || 'Administrador',
        token: data.token || data.jwt || data.accessToken,
        idAcademia: data.idAcademia || academia.idAcademia || academia.id || 1,
        colorTema: academia.colorTema || data.colorTema || '#4f46e5',
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-96 bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <header className="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/25 border border-white/10">
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
    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
  >
    Soy Alumno
  </button>

  <button
    type="button"
    onClick={() => openModal('login', 1)}
    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
  >
    Administrador / RRHH
  </button>

</div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>PREPARACIÓN PREUNIVERSITARIA</span>
        </div>

        <h1 className="max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
  Prepárate para ingresar a la universidad
  <br className="hidden sm:block" />
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300">
    con el ciclo ideal para ti
  </span>
</h1>

        <p className="max-w-2xl text-slate-400 text-base sm:text-lg mb-12 leading-relaxed font-normal">
  Conoce nuestros ciclos preuniversitarios, revisa los turnos y horarios disponibles
  y elige la preparación que mejor se adapte a tu objetivo universitario.
</p>


        <section className="w-full mb-16 text-left" id="ciclos">
  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 text-center">Ciclos disponibles</h2>
  <p className="text-slate-400 text-sm text-center mb-8">Elige tu ciclo e inscríbete en minutos</p>

  {loadingCiclos ? (
    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
  ) : ciclos.length === 0 ? (
    <p className="text-center text-slate-500 text-sm">No hay ciclos disponibles por el momento.</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {ciclos.map((ciclo) => (
       <div
  key={ciclo.idCiclo ?? ciclo.id}
  className="group p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/60 hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-xl"
>
  {/* CABECERA DE LA TARJETA */}
  <div className="flex items-start justify-between gap-3 mb-5">

    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
      <GraduationCap className="w-6 h-6" />
    </div>

    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold whitespace-nowrap">
      {ciclo.cantidadAlumnos ?? 0} inscritos
    </span>

  </div>

  {/* NOMBRE */}
  <h3 className="text-xl font-black text-white mb-5">
    {ciclo.nombre}
  </h3>

  {/* INFORMACIÓN */}
  <div className="space-y-3 mb-6">

    <div className="flex items-center gap-3 text-sm text-slate-300">
      <Clock className="w-4 h-4 text-indigo-400 shrink-0" />

      <span>
        <strong className="text-white">Turno:</strong>{' '}
        {ciclo.turno || 'Por confirmar'}
      </span>
    </div>

    <div className="flex items-center gap-3 text-sm text-slate-300">
      <Clock className="w-4 h-4 text-blue-400 shrink-0" />

      <span>
        <strong className="text-white">Horario:</strong>{' '}
        {ciclo.horario || 'Horario por confirmar'}
      </span>
    </div>

    <div className="flex items-center gap-3 text-sm text-slate-300">
      <Users className="w-4 h-4 text-cyan-400 shrink-0" />

      <span>
        <strong className="text-white">Alumnos:</strong>{' '}
        {ciclo.cantidadAlumnos ?? 0}
      </span>
    </div>

    <div className="flex items-center gap-3 text-sm text-slate-300">
      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />

      <span>
        <strong className="text-white">Modalidad:</strong>{' '}
        Preuniversitaria
      </span>
    </div>

  </div>

  {/* BOTÓN PRINCIPAL */}
  <button
    type="button"
    onClick={() => abrirCheckout(ciclo)}
    className="mt-auto w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all group-hover:scale-[1.01]"
  >
    Inscríbete aquí
  </button>

</div>
      ))}
    </div>
  )}
</section>

        <section className="w-full mb-16">
  <div className="text-center mb-8">
    <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
      Nuestra propuesta
    </p>

    <h2 className="text-2xl sm:text-3xl font-black text-white">
      Todo lo que necesitas para prepararte
    </h2>

    <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
      Una experiencia de preparación enfocada en tu objetivo universitario.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80">
      <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
        <GraduationCap className="w-5 h-5" />
      </div>

      <h3 className="text-base font-bold text-white mb-2">
        Ciclos preuniversitarios
      </h3>

      <p className="text-xs text-slate-400 leading-relaxed">
        Revisa nuestra oferta educativa y elige el ciclo que corresponda a tu objetivo.
      </p>
    </div>

    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80">
      <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
        <Clock className="w-5 h-5" />
      </div>

      <h3 className="text-base font-bold text-white mb-2">
        Turnos y horarios
      </h3>

      <p className="text-xs text-slate-400 leading-relaxed">
        Consulta los horarios disponibles y elige el turno que mejor se adapte a ti.
      </p>
    </div>

    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80">
      <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
        <CheckCircle2 className="w-5 h-5" />
      </div>

      <h3 className="text-base font-bold text-white mb-2">
        Inscripción rápida
      </h3>

      <p className="text-xs text-slate-400 leading-relaxed">
        Selecciona tu ciclo, completa tus datos y comienza tu proceso de matrícula.
      </p>
    </div>

  </div>
</section>

        
      </main>

      <footer className="relative z-20 max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/40 text-center text-xs text-slate-500">
        <p>© 2026 AcadeSys - Sistema de Gestión Académica e Inteligencia Artificial. Todos los derechos reservados.</p>
      </footer>

{authModal === 'login' && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    }}
  >
    <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">

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
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              AcadeSys
            </p>

            <h2 className="text-2xl font-black text-white">
              Iniciar sesión
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-400">
          Ingresa tus credenciales para acceder a tu panel.
        </p>

        {rolEsperado && (
          <div className="inline-flex mt-4 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300">
            Acceso para:{' '}
            {rolEsperado === '4'
              ? 'Alumno'
              : rolEsperado === '1'
                ? 'Administrador / RRHH'
                : MAPA_ROLES[rolEsperado]}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

          <div>
            <p className="font-bold">
              No fue posible iniciar sesión
            </p>

            <p className="mt-1 text-rose-300/80">
              {error}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleLoginSubmit}
        className="space-y-5"
      >

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Usuario / correo
          </label>

          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

            <input
              type="text"
              required
              autoComplete="username"
              placeholder={
                rolEsperado === '4'
                  ? 'Código de alumno o correo'
                  : 'Usuario o correo'
              }
              value={loginData.usuario}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  usuario: e.target.value
                })
              }
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Contraseña
          </label>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value
                })
              }
              className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
              aria-label={
                showPassword
                  ? 'Ocultar contraseña'
                  : 'Mostrar contraseña'
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}

          <span>
            {loading
              ? 'Autenticando...'
              : 'Ingresar al sistema'}
          </span>
        </button>

      </form>

      <div className="mt-6 pt-5 border-t border-slate-800">
        <p className="text-xs text-center text-slate-500">
          Las credenciales son asignadas según el perfil de tu cuenta.
        </p>
      </div>

    </div>
  </div>
)}


      {cicloSeleccionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <button type="button" onClick={cerrarCheckout} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl transition">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-white mb-1">Inscripción</h2>
            <p className="text-xs text-slate-400 mb-6">
              Ciclo: <span className="text-indigo-300 font-semibold">{cicloSeleccionado.nombre}</span>{cicloSeleccionado.turno ? ` · ${cicloSeleccionado.turno}` : ''}
            </p>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePagarCheckout} className="space-y-4 text-left">
              {[
                { key: 'nombres', label: 'Nombres', type: 'text', ph: 'Tus nombres' },
                { key: 'apellidos', label: 'Apellidos', type: 'text', ph: 'Tus apellidos' },
                { key: 'correo', label: 'Correo', type: 'email', ph: 'correo@ejemplo.com' }
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    placeholder={f.ph}
                    value={checkoutData[f.key]}
                    onChange={(e) => setCheckoutData({ ...checkoutData, [f.key]: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={procesandoPago}
                className="w-full mt-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {procesandoPago && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Pagar S/ 1.00</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}