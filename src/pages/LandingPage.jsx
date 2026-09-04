import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, Eye, EyeOff, Loader2, 
  ArrowRight, Users, Sparkles, X, CheckCircle2, UserPlus, Check, CreditCard 
} from 'lucide-react';
import { crearUsuario } from '../services/api';

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

  // Datos para Registro (incluye DNI)
  const [registerData, setRegisterData] = useState({
    usuario: '',
    dni: '',
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });

  // Resetear estados al alternar modales
  const resetFormStates = () => {
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoginData({ usuario: '', password: '' });
    setRegisterData({
      usuario: '',
      dni: '',
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      confirmPassword: ''
    });
  };

  const openModal = (modalType) => {
    resetFormStates();
    setAuthModal(modalType);
  };

  const closeModal = () => {
    resetFormStates();
    setAuthModal(null);
  };

  // Reglas de contraseña
  const validarPasswordSegura = (pass) => {
    if (pass.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    const tieneLetra = /[a-zA-Z]/.test(pass);
    const tieneNumero = /\d/.test(pass);
    if (!tieneLetra || !tieneNumero) {
      return 'La contraseña debe incluir al menos una letra y un número.';
    }
    return null;
  };

  // 1. Manejar Registro de Nuevo Usuario
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (registerData.dni.trim().length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden. Verifícalas.');
      return;
    }

    const errorReglaPass = validarPasswordSegura(registerData.password);
    if (errorReglaPass) {
      setError(errorReglaPass);
      return;
    }

    setLoading(true);

    try {
      const nuevoUsuarioPayload = {
        nombreUsuario: registerData.usuario.trim(),
        dni: registerData.dni.trim(),
        nombre: registerData.nombre.trim() || registerData.usuario.trim(),
        apellido: registerData.apellido.trim() || 'General',
        correo: registerData.correo.trim() || `${registerData.usuario.trim().toLowerCase()}@acadesys.edu.pe`,
        contrasena: registerData.password,
        perfiles: [2] // Perfil asignado por defecto
      };

      await crearUsuario(nuevoUsuarioPayload);

      setSuccessMsg('¡Cuenta registrada exitosamente en la base de datos! Redirigiendo al inicio de sesión...');
      resetFormStates();

      setTimeout(() => {
        setAuthModal('login');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor para registrar el usuario.');
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

      // Bypass de contingencia para desarrollo
      if (inputUser.toLowerCase() === 'admin' && inputPass === 'admin123') {
        const sessionUser = {
          nombre: 'admin',
          rol: 'Administrador General',
          token: 'dev-token-admin'
        };
        localStorage.setItem('acadesys_session', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);
        return;
      }

      throw new Error('Credenciales inválidas. Verifica tu usuario y contraseña.');

    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Luces de Fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-96 bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Rejilla */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Navbar */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            AcadeSys
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
          <a href="#modulos" className="hover:text-white transition">Módulos</a>
          <a href="#seguridad" className="hover:text-white transition">Seguridad RBAC</a>
          <a href="#institucional" className="hover:text-white transition">Institucional</a>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => openModal('register')}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
          >
            Registrarse
          </button>
          <button
            onClick={() => openModal('login')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition border border-white/10"
          >
            Iniciar Sesión
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ecosistema de Gestión Académica 4.0</span>
        </div>

        <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          Control institucional y perfiles con <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300">
            precisión en tiempo real
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-base sm:text-lg mb-10 leading-relaxed font-normal">
          Plataforma centralizada para la administración de roles, control de accesos RBAC, notas y gestión directiva escolar con infraestructura en la nube.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <button
            onClick={() => openModal('login')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-3 transition group"
          >
            <span>Acceder al Panel de Control</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

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
              Control de accesos y persistencia con validación estricta de parámetros en base de datos.
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

      {/* Modal flotante */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0d1322]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl">
            
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

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
                  : 'Regístrate directamente en la base de datos de AcadeSys'}
              </p>
            </div>

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
                      placeholder="Ej. admin"
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
                    onClick={() => openModal('register')}
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Usuario
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="usuario"
                        value={registerData.usuario}
                        onChange={(e) => setRegisterData({ ...registerData, usuario: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      DNI (8 dígitos)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="72345678"
                        value={registerData.dni}
                        onChange={(e) => setRegisterData({ ...registerData, dni: e.target.value.replace(/\D/g, '') })}
                        className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      placeholder="Yan"
                      value={registerData.nombre}
                      onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      placeholder="Picon"
                      value={registerData.apellido}
                      onChange={(e) => setRegisterData({ ...registerData, apellido: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="yan.picon@acadesys.edu.pe"
                    value={registerData.correo}
                    onChange={(e) => setRegisterData({ ...registerData, correo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Contraseña (mínimo 6 caracteres, letras y números)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full pl-8 pr-9 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full pl-8 pr-9 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Creando cuenta en BD...' : 'Completar Registro'}
                </button>

                <div className="mt-3 text-center text-xs text-slate-400">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => openModal('login')}
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