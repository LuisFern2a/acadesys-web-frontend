import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Menu as MenuIcon, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Bell, 
  GraduationCap, 
  LogOut, 
  BrainCircuit, 
  Award, 
  Layers, 
  UserCheck,
  CalendarCheck,
  ClipboardCheck,
  Megaphone,
  UserPlus,
  BadgeAlert,
  FolderOpen
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

  // HU-03: Estado para controlar acordeones abiertos/cerrados (submenús)
  const [openAccordions, setOpenAccordions] = useState({
    academico_grupo: true,
    seguridad_grupo: false
  });

  // HU-03: Extracción dinámica del color institucional de la academia
  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  })();

  const colorTema = user?.colorTema || sessionData?.colorTema || '#4f46e5';
  const nombreAcademia = user?.nombreAcademia || sessionData?.nombreAcademia || 'AcadeSys Pre-U';
  const rolUsuario = (user?.rol || user?.Perfil || 'Administrador').toLowerCase();

  const toggleAccordion = (id) => {
    if (collapsed) setCollapsed(false);
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // HU-03: Estructura de menú con soporte jerárquico (padres e hijos)
  const itemsNavegacion = [
    { 
      id: 'dashboard', 
      label: 'Dashboard General', 
      icon: LayoutDashboard, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'tutor de aula', 'alumno', 'estudiante'] 
    },
    { 
      id: 'matriculas', 
      label: 'Matrícula Ágil', 
      icon: UserPlus, 
      rolesPermitidos: ['administrador', 'admin', 'tutor de aula'] 
    },
    { 
      id: 'academico_grupo', 
      label: 'Gestión Académica', 
      icon: Layers, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'tutor de aula'],
      submenus: [
        { id: 'asistencia', label: 'Control Asistencia', icon: CalendarCheck },
        { id: 'registro-notas', label: 'Registro Simulacros', icon: ClipboardCheck },
        { id: 'academico', label: 'Aulas y Cursos', icon: FolderOpen }
      ]
    },
    { 
      id: 'morosidad', 
      label: 'Semáforo Morosidad', 
      icon: BadgeAlert, 
      rolesPermitidos: ['administrador', 'admin', 'tutor de aula'] 
    },
    { 
      id: 'calificaciones', 
      label: 'Ranking y Notas', 
      icon: Award, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'tutor de aula', 'alumno', 'estudiante'] 
    },
    { 
      id: 'tutor-ia', 
      label: 'Tutor Pedagógico IA', 
      icon: BrainCircuit, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'alumno', 'estudiante', 'tutor de aula'] 
    },
    { 
      id: 'comunicados', 
      label: 'Circulares y Avisos', 
      icon: Megaphone, 
      rolesPermitidos: ['administrador', 'admin', 'docente', 'alumno', 'estudiante', 'tutor de aula'] 
    },
    { 
      id: 'seguridad_grupo', 
      label: 'Seguridad y Acceso', 
      icon: ShieldCheck, 
      rolesPermitidos: ['administrador', 'admin'],
      submenus: [
        { id: 'usuarios', label: 'Usuarios y Códigos', icon: Users },
        { id: 'perfiles', label: 'Roles y Permisos', icon: ShieldCheck },
        { id: 'menu-options', label: 'Opciones de Menú', icon: MenuIcon }
      ]
    }
  ];

  // Filtrado de menús según permisos del usuario
  const menuItemsFiltrados = itemsNavegacion.filter(item => 
    item.rolesPermitidos.some(r => rolUsuario.includes(r))
  );

  const titulosTabs = {
    'dashboard': 'Dashboard Preuniversitario',
    'matriculas': 'Matrícula Ágil y Generación de Códigos',
    'comunicados': 'Comunicados Institucionales',
    'asistencia': 'Control de Asistencia',
    'registro-notas': 'Registro de Notas de Simulacro',
    'academico': 'Gestión de Ciclos, Cursos y Aulas',
    'morosidad': 'Monitoreo de Pagos y Morosidad',
    'calificaciones': 'Resultados y Cuadro de Mérito',
    'tutor-ia': 'Asistente de Orientación Preuniversitaria IA',
    'usuarios': 'Directorio de Usuarios y Alumnos',
    'perfiles': 'Seguridad y Roles RBAC',
    'menu-options': 'Estructura de Menús'
  };

  const nombreDisplay = user?.nombre || user?.NombreCompleto || user?.Nombre || 'Usuario';
  const iniciales = nombreDisplay ? nombreDisplay.trim().slice(0, 2).toUpperCase() : 'US';

  const handleLogoutClick = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Sidebar Lateral */}
      <aside 
        className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col justify-between border-r border-slate-800 shrink-0 print:hidden select-none`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header del Sidebar con branding de la Academia */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div 
                className="p-2 rounded-xl text-white shrink-0 shadow-md flex items-center justify-center transition"
                style={{ backgroundColor: colorTema }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="leading-tight truncate">
                  <span className="font-extrabold text-sm text-white tracking-wide block truncate">
                    {nombreAcademia}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Plataforma Pre-U
                  </span>
                </div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Lista de Navegación con Acordeones (HU-03) */}
          <nav className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
            {menuItemsFiltrados.map((item) => {
              const Icon = item.icon;
              const tieneHijos = Array.isArray(item.submenus) && item.submenus.length > 0;
              const estaAbierto = openAccordions[item.id];
              const esSubmenuActivo = tieneHijos && item.submenus.some(sub => sub.id === activeTab);
              const isActive = activeTab === item.id || esSubmenuActivo;

              if (tieneHijos) {
                return (
                  <div key={item.id} className="space-y-1">
                    {/* Botón Padre Acordeón */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        esSubmenuActivo 
                          ? 'text-white bg-slate-800/80 border border-slate-700/60' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {/* Iconos triangulares interactivos acordeón */}
                      {!collapsed && (
                        <span className="text-slate-400 hover:text-white p-0.5 transition-transform duration-200">
                          {estaAbierto ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </button>

                    {/* Submenús Hijos Desplegables */}
                    {!collapsed && estaAbierto && (
                      <div className="pl-6 space-y-1 border-l-2 border-slate-800 ml-4 py-1 animate-in fade-in duration-150">
                        {item.submenus.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeTab === sub.id;

                          return (
                            <button
                              type="button"
                              key={sub.id}
                              onClick={() => setActiveTab(sub.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                                isSubActive
                                  ? 'text-white font-bold shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                              style={isSubActive ? { backgroundColor: colorTema } : {}}
                            >
                              <SubIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Menú Simple sin Hijos
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive 
                      ? 'text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  style={isActive ? { backgroundColor: colorTema } : {}}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer de Sidebar: Cerrar Sesión */}
          <div className="p-3 border-t border-slate-800 shrink-0">
            <button 
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* Contenedor Principal de Vistas */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        
        {/* Barra Superior / Header */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md print:hidden shrink-0">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
            <span>Portal Preuniversitario</span>
            <span className="text-slate-600">/</span> 
            <span className="text-slate-200 font-bold">{titulosTabs[activeTab] || activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Indicador multi-tenant del ciclo o academia */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorTema }}></span>
              <span>{nombreAcademia}</span>
            </div>

            {/* Notificaciones */}
            <button 
              type="button" 
              onClick={() => setActiveTab('comunicados')}
              title="Avisos y Comunicados"
              className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: colorTema }}></span>
            </button>

            {/* Perfil del Usuario Activo */}
            <button
              type="button"
              title="Ver datos del perfil"
              onClick={() => setModalPerfilAbierto(true)}
              className="flex items-center gap-3 pl-3 border-l border-slate-800 hover:bg-slate-800/50 p-1.5 rounded-xl transition text-left cursor-pointer"
            >
              <div 
                className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner"
                style={{ backgroundColor: colorTema }}
              >
                {user?.foto ? (
                  <img src={user.foto} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  iniciales
                )}
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-xs font-bold text-slate-200">
                  {nombreDisplay}
                </span>
                <span className="block text-[10px] text-slate-400 capitalize">
                  {user?.rol || user?.Perfil || 'Administrador'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Renderizado de la página o módulo activo */}
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>
      </div>

      {/* Modal de Mi Perfil */}
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