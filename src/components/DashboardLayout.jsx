import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Menu as MenuIcon, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  GraduationCap, 
  LogOut, 
  BrainCircuit, 
  Award, 
  Layers, 
  UserCheck,
  CalendarCheck,
  ClipboardCheck,
  Megaphone
} from 'lucide-react';
import ModalMiPerfil from './ModalMiPerfil';

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout, 
  hijos = [], 
  hijoSeleccionado, 
  onSeleccionarHijo,
  onUpdateUser
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);

  const rolUsuario = (user?.rol || user?.Perfil || 'Administrador').toLowerCase();

  const todosLosMenuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'padre de familia', 'apoderado'] 
    },
    { 
      id: 'comunicados', 
      label: 'Comunicados', 
      icon: Megaphone, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'alumno', 'estudiante', 'padre de familia', 'apoderado'] 
    },
    { 
      id: 'asistencia', 
      label: 'Asistencia', 
      icon: CalendarCheck, 
      rolesPermitidos: ['administrador', 'admin', 'docente'] 
    },
    { 
      id: 'registro-notas', 
      label: 'Registrar Notas', 
      icon: ClipboardCheck, 
      rolesPermitidos: ['administrador', 'admin', 'docente'] 
    },
    { 
      id: 'academico', 
      label: 'Académico', 
      icon: Layers, 
      rolesPermitidos: ['administrador', 'admin', 'docente'] 
    },
    { 
      id: 'calificaciones', 
      label: 'Calificaciones', 
      icon: Award, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'alumno', 'estudiante', 'padre de familia', 'apoderado'] 
    },
    { 
      id: 'tutor-ia', 
      label: 'Tutor IA', 
      icon: BrainCircuit, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'alumno', 'estudiante', 'padre de familia', 'apoderado'] 
    },
    { 
      id: 'usuarios', 
      label: 'Usuarios', 
      icon: Users, 
      rolesPermitidos: ['administrador', 'admin'] 
    },
    { 
      id: 'perfiles', 
      label: 'Perfiles', 
      icon: ShieldCheck, 
      rolesPermitidos: ['administrador', 'admin'] 
    },
    { 
      id: 'menu-options', 
      label: 'Opciones Menú', 
      icon: MenuIcon, 
      rolesPermitidos: ['administrador', 'admin'] 
    },
  ];

  const menuItems = todosLosMenuItems.filter(item => 
    item.rolesPermitidos.some(r => rolUsuario.includes(r))
  );

  const esPadre = rolUsuario.includes('padre') || rolUsuario.includes('apoderado');
  const nombreDisplay = user?.nombre || user?.NombreCompleto || user?.Nombre || 'Usuario';
  const iniciales = nombreDisplay ? nombreDisplay.trim().slice(0, 2).toUpperCase() : 'US';

  const handleLogoutClick = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar Lateral */}
      <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col justify-between border-r border-slate-800 shrink-0 print:hidden`}>
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="leading-tight">
                  <span className="font-bold text-base text-white tracking-wide">Acade<span className="text-indigo-400">Sys</span></span>
                  <span className="block text-[10px] text-slate-400 font-medium">SaaS Educativo</span>
                </div>
              )}
            </div>
            <button 
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800">
          <button 
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between print:hidden">
          <div className="text-sm text-slate-500 font-medium">
            Intranet Escolar <span className="mx-2 text-slate-300">/</span> <span className="text-slate-800 capitalize font-semibold">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {esPadre && hijos && hijos.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-indigo-900 hidden md:inline">Hijo:</span>
                <select
                  value={hijoSeleccionado?.id || ''}
                  onChange={(e) => onSeleccionarHijo(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-indigo-700 outline-none cursor-pointer"
                >
                  {hijos.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nombre} ({h.gradoCorto})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button 
              type="button" 
              onClick={() => setActiveTab('comunicados')}
              title="Ver Avisos y Notificaciones"
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </button>

            {/* BOTÓN DE PERFIL INTERACTIVO */}
            <button
              type="button"
              title="Haz clic para editar tu perfil"
              onClick={() => setModalPerfilAbierto(true)}
              className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-xl transition text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                {user?.foto ? (
                  <img src={user.foto} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  iniciales
                )}
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-xs font-semibold text-slate-800">
                  {nombreDisplay}
                </span>
                <span className="block text-[11px] text-slate-400 capitalize">
                  {user?.rol || user?.Perfil || 'Docente'}
                </span>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>
      </div>

      {/* MODAL DE PERFIL */}
      <ModalMiPerfil
        isOpen={modalPerfilAbierto}
        onClose={() => setModalPerfilAbierto(false)}
        user={user}
        onGuardarUsuario={(usuarioActualizado) => {
          if (onUpdateUser) onUpdateUser(usuarioActualizado);
        }}
      />
    </div>
  );
}