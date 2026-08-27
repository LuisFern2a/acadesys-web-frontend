import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, Eye, EyeOff, Loader2, 
  ArrowRight, Users, Sparkles, X, CheckCircle2, UserPlus, Check 
} from 'lucide-react';

export default function LandingPage({ onLoginSuccess }) {
  // Modales: 'login' | 'register' | null
  const [authModal, setAuthModal] = useState(null);
  
  // Visibilidad de contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados de formulario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Datos para Login
  const [loginData, setLoginData] = useState({
    usuario: '',
    password: ''
  });

  // Datos para Registro
  const [registerData, setRegisterData] = useState({
    usuario: '',
    password: '',
    confirmPassword: ''
  });

  // Obtener usuarios locales registrados
  const getRegisteredUsers = () => {
    try {
      const stored = localStorage.getItem('acadesys_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // 1. Manejar Registro de Nuevo Usuario
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden. Verifícalas.');
      return;
    }

    if (registerData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const users = getRegisteredUsers();
      const userExists = users.some(
        u => u.usuario.toLowerCase() === registerData.usuario.trim().toLowerCase()
      );

      if (userExists) {
        throw new Error('Ese nombre de usuario ya está registrado.');
      }

      // Guardar el nuevo usuario en la lista
      const newUser = {
        usuario: registerData.usuario.trim(),
        password: registerData.password,
        rol: 'Docente / Usuario Registrado'
      };

      users.push(newUser);
      localStorage.setItem('acadesys_users', JSON.stringify(users));

      setSuccessMsg('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
      setRegisterData({ usuario: '', password: '', confirmPassword: '' });

      // Cambiar a la pestaña de login tras 1.2 segundos
      setTimeout(() => {
        setAuthModal('login');
        setSuccessMsg(null);
        setError(null);
      }, 1200);

    } catch (err) {
      setError(err.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejar Inicio de Sesión
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputUser = loginData.usuario.trim();
    const inputPass = loginData.password.trim();

    try {
      // Intento API remota si el backend tiene el endpoint listo
      const res = await fetch('https://acadesys-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: inputUser, password: inputPass })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const sessionUser = {
          nombre: data.usuario || inputUser,
          rol: data.rol || 'Administrador',
          token: data.token || 'auth-token'
        };
        localStorage.setItem('acadesys_session', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);
        return;
      }

      // Validación local con usuarios registrados o cuenta Administrador
      const users = getRegisteredUsers();
      const foundUser = users.find(
        u => u.usuario.toLowerCase() === inputUser.toLowerCase() && u.password === inputPass
      );

      // Permite el usuario registrado O la cuenta por defecto 'admin'
      if (foundUser || (inputUser.toLowerCase() === 'admin' && inputPass.length > 0)) {
        const sessionUser = {
          nombre: foundUser ? foundUser.usuario : inputUser,
          rol: foundUser ? foundUser.rol : 'Administrador General',
          token: 'demo-session-token'
        };
        localStorage.setItem('acadesys_session', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);
      } else {
        throw new Error('Usuario o contraseña incorrectos. Si no tienes cuenta, regístrate primero.');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setAuthModal(null);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* ================= LUCES DE FONDO 3D GLOW ================= */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-96 bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Rejilla geométrica */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* ================= NAVBAR SUPERIOR ================= */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            AcadeSys
          </span>
        </div>

        {/* Enlaces informativos */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
          <a href="#modulos" className="hover:text-white transition">Módulos</a>
          <a href="#seguridad" className="hover:text-white transition">Seguridad RBAC</a>
          <a href="#institucional" className="hover:text-white transition">Institucional</a>
        </nav>

        {/* Botones de acción en la esquina derecha */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setError(null); setSuccessMsg(null); setAuthModal('register'); }}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
          >
            Registrarse
          </button>
          <button
            onClick={() => { setError(null); setSuccessMsg(null); setAuthModal('login'); }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition border border-white/10"
          >
            Iniciar Sesión
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ecosistema de Gestión Académica 4.0</span>
        </div>

        {/* Titular */}
        <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          Control institucional y perfiles con <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300">
            precisión en tiempo real
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="max-w-2xl text-slate-400 text-base sm:text-lg mb-10 leading-relaxed font-normal">
          Plataforma centralizada para la administración de roles, control de accesos RBAC, notas y gestión directiva escolar con infraestructura en la nube.
        </p>

        {/* Botón CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <button
            onClick={() => { setError(null); setSuccessMsg(null); setAuthModal('login'); }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-3 transition group"
          >
            <span>Acceder al Panel de Control</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Tarjetas 3D Glassmorphism */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/40 transition group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Mantenimiento de Perfiles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administración granular de roles (Administrador, Docente, Alumno y Padre) con persistencia segura.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-blue-500/40 transition group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Seguridad & Auditoría</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Control de registros activos/inactivos y validación estricta de parámetros en base de datos Aiven MySQL.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-cyan-500/40 transition group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Alta Disponibilidad</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arquitectura desacoplada en Node.js + React desplegada en la nube con monitoreo de endpoints.
            </p>
          </div>

        </div>

      </main>

      {/* ================= MODAL FLOTANTE (LOGIN / REGISTRO) ================= */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0d1322]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl">
            
            {/* Botón cerrar */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado dinámico */}
            <div className="text-left mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                {authModal === 'login' ? <ShieldCheck className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {authModal === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {authModal === 'login' 
                  ? 'Ingresa al portal administrativo de AcadeSys' 
                  : 'Regístrate para solicitar acceso a la intranet'}
              </p>
            </div>

            {/* Mensajes de Alerta */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. FORMULARIO DE LOGIN */}
            {authModal === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. admin o tu usuario"
                      value={loginData.usuario}
                      onChange={(e) => setLoginData({ ...loginData, usuario: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Accediendo...' : 'Entrar al Sistema'}
                </button>

                <div className="mt-4 text-center text-xs text-slate-400">
                  ¿No tienes una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => { setError(null); setAuthModal('register'); }}
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </div>
              </form>
            ) : (
              /* 2. FORMULARIO DE REGISTRO */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Elige tu nombre de usuario"
                      value={registerData.usuario}
                      onChange={(e) => setRegisterData({ ...registerData, usuario: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repite la contraseña"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Creando cuenta...' : 'Completar Registro'}
                </button>

                <div className="mt-4 text-center text-xs text-slate-400">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => { setError(null); setAuthModal('login'); }}
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    Inicia sesión
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}