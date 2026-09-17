import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  Phone, 
  IdCard, 
  Camera, 
  Bell, 
  KeyRound, 
  Sliders, 
  Smartphone,
  CalendarCheck
} from 'lucide-react';
import { actualizarUsuario, obtenerUsuarios } from '../services/api';

export default function ModalMiPerfil({ isOpen, onClose, user, onGuardarUsuario }) {
  if (!isOpen) return null;

  const [tabActiva, setTabActiva] = useState('general'); // 'general' | 'seguridad' | 'preferencias'
  
  // Datos personales
  const [nombre, setNombre] = useState(user?.nombre || user?.NombreCompleto || user?.Nombre || 'Yan Leví');
  const [correo, setCorreo] = useState(user?.correo || user?.Correo || user?.email || user?.CorreoElectronico || 'yan@acadesys.edu');
  const [dni, setDni] = useState(user?.dni || user?.DNI || '74829103');
  const [telefono, setTelefono] = useState(user?.telefono || '+51 987 654 321');
  const [fotoPerfil, setFotoPerfil] = useState(user?.foto || null);

  // Seguridad
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferencias
  const [notifCorreo, setNotifCorreo] = useState(true);
  const [notifInasistencias, setNotifInasistencias] = useState(true);
  const [modoCompacto, setModoCompacto] = useState(false);

  const [mensajeExito, setMensajeExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const iniciales = nombre ? nombre.trim().slice(0, 2).toUpperCase() : 'US';
  const rol = user?.rol || user?.Perfil || 'Docente';
  const codigo = user?.codigo || user?.IdUsuario ? `ACAD-USR-${user?.IdUsuario || '102'}` : 'ACAD-USR-102';

  const handleSubirFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const urlTemp = URL.createObjectURL(file);
      setFotoPerfil(urlTemp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nuevoPassword && nuevoPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const idUsuario = user?.IdUsuario || user?.id;
    let registroActual = null;

    if (idUsuario) {
      try {
        const lista = await obtenerUsuarios();
        registroActual = (Array.isArray(lista) ? lista : lista.data || [])
          .find((u) => (u.IdUsuario || u.id) === idUsuario) || null;
      } catch {
        registroActual = null;
      }
    }

    // Validación estricta de contraseña actual
    if (nuevoPassword) {
      if (!passwordActual) {
        alert('Debes ingresar tu contraseña actual para poder cambiarla.');
        return;
      }

      const claveGuardada = (
        registroActual?.Clave ?? registroActual?.clave ?? registroActual?.Password ??
        registroActual?.password ?? registroActual?.Contrasena ?? registroActual?.contrasena ??
        user?.contrasena ?? user?.password ?? user?.Clave ?? ''
      ).toString();

      if (!claveGuardada || claveGuardada !== passwordActual) {
        alert('La contraseña actual ingresada es incorrecta.');
        return;
      }

      if (nuevoPassword.length < 6) {
        alert('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    setGuardando(true);

    const usuarioActualizado = {
      ...user,
      nombre,
      NombreCompleto: nombre,
      Nombre: nombre,
      correo,
      Correo: correo,
      email: correo,
      dni,
      DNI: dni,
      apellido: registroActual?.ApellidoPaterno || user?.apellido || '',
      apellidoMaterno: registroActual?.ApellidoMaterno || user?.apellidoMaterno || '',
      celular: registroActual?.Celular || telefono,
      telefono,
      foto: fotoPerfil,
      ...(nuevoPassword ? { contrasena: nuevoPassword } : {})
    };

    try {
      if (idUsuario) {
        await actualizarUsuario(idUsuario, usuarioActualizado);
      }
    } catch {
      // Manejo de contingencia local
    }

    onGuardarUsuario(usuarioActualizado);
    setGuardando(false);
    setMensajeExito(true);
    setTimeout(() => {
      setMensajeExito(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* BANNER INSTITUCIONAL & HEADER */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* AVATAR INTERACTIVO */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 border-2 border-white/20 text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden">
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{iniciales}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-2 bg-white text-slate-700 hover:text-indigo-600 rounded-xl shadow-md cursor-pointer border border-slate-200 transition">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleSubirFoto} className="hidden" />
              </label>
            </div>

            {/* INFO PRINCIPAL */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">{nombre}</h2>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-400/30">
                  <Shield className="w-3.5 h-3.5" /> {rol}
                </span>
                <span className="text-slate-400 font-mono">{codigo}</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Activo
                </span>
              </div>
            </div>
          </div>

          {/* TABS DE CONFIGURACIÓN */}
          <div className="flex gap-2 mt-6 pt-2 border-t border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTabActiva('general')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                tabActiva === 'general'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" /> Datos Generales
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('seguridad')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                tabActiva === 'seguridad'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Seguridad y Clave
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('preferencias')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                tabActiva === 'preferencias'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" /> Notificaciones
            </button>
          </div>
        </div>

        {/* CUERPO DEL MODAL CON SCROLL */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {mensajeExito && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-700 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cambios guardados con éxito en la plataforma.</span>
            </div>
          )}

          {/* VISTA: GENERAL */}
          {tabActiva === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombres y Apellidos
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Documento de Identidad (DNI)
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={8}
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* FICHA TÉCNICA */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Registro del Sistema
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Sede Asignada:</span>
                    <strong className="text-slate-700">Sede Central - Lima</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Año Lectivo:</span>
                    <strong className="text-slate-700">2026 Vigente</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nivel de Acceso:</span>
                    <strong className="text-indigo-600">{rol}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: SEGURIDAD */}
          {tabActiva === 'seguridad' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Ingresa tu clave actual para validar"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={nuevoPassword}
                      onChange={(e) => setNuevoPassword(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* ESTADO DE DISPOSITIVOS */}
              <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Sesión Activa</span>
                    <span className="text-[11px] text-slate-400">Navegador Web • Render Cloud API</span>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md font-bold">
                  Este equipo
                </span>
              </div>
            </div>
          )}

          {/* VISTA: PREFERENCIAS Y NOTIFICACIONES */}
          {tabActiva === 'preferencias' && (
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Reportes Bimestrales por Correo</span>
                    <span className="text-[11px] text-slate-400">Recibe una copia de las calificaciones consolidadas</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifCorreo}
                  onChange={(e) => setNotifCorreo(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Alertas de Asistencia Inmediatas</span>
                    <span className="text-[11px] text-slate-400">Notificar inasistencias o tardanzas en tiempo real</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifInasistencias}
                  onChange={(e) => setNotifInasistencias(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Avisos de Simulacros y Eventos</span>
                    <span className="text-[11px] text-slate-400">Recordatorios de fechas claves del calendario académico</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={modoCompacto}
                  onChange={(e) => setModoCompacto(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}