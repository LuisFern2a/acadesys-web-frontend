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
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  Megaphone,
  UserPlus,
  BadgeAlert,
  FolderOpen,
  BookOpen,
  FileUp,
  UserRound,
  Clock3,
  NotebookTabs
} from 'lucide-react';
import ModalMiPerfil from './ModalMiPerfil';

const normalizeRole = (user) =>
  String(user?.rol || user?.Perfil || '').trim().toLowerCase();

export default function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onUpdateUser
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({
    academico_grupo: true,
    seguridad_grupo: false
  });

  const rolUsuario = normalizeRole(user);
  const esAlumno = rolUsuario.includes('alumno') || rolUsuario.includes('estudiante');
  const esAdmin = rolUsuario.includes('admin') || rolUsuario.includes('administrador') || rolUsuario.includes('recursos humanos') || rolUsuario === 'rrhh';
  const esTutor = rolUsuario.includes('tutor');
  const esDocente = rolUsuario.includes('docente');
  const nombreAcademia = user?.nombreAcademia || 'AcadeSys Pre-U';
  const colorTema = user?.colorTema || '#2563eb';
  const nombreDisplay = user?.nombre || user?.NombreCompleto || user?.Nombre || 'Usuario';
  const iniciales = nombreDisplay.trim().slice(0, 2).toUpperCase() || 'US';

  const cambiarTab = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) setCollapsed(false);
  };

  const toggleAccordion = (id) => {
    if (collapsed) setCollapsed(false);
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cerrarSesion = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      onLogout?.();
    }
  };

  const studentMenu = [
    { id: 'student-home', label: 'Inicio', icon: LayoutDashboard },
    { id: 'student-ciclo', label: 'Mi ciclo', icon: GraduationCap },
    { id: 'student-horario', label: 'Mi horario', icon: Clock3 },
    { id: 'student-cursos', label: 'Mis cursos', icon: NotebookTabs },
    { id: 'student-notas', label: 'Calificaciones', icon: Award },
    { id: 'student-materiales', label: 'Materiales', icon: BookOpen },
  ];

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard, show: true },
    { id: 'matriculas', label: 'Matrícula Ágil', icon: UserPlus, show: esAdmin || esTutor },
    {
      id: 'academico_grupo',
      label: 'Gestión Académica',
      icon: Layers,
      show: esAdmin || esTutor || esDocente,
      submenus: [
        { id: 'academico-ciclos', label: 'Ciclos y Cursos', icon: GraduationCap },
        { id: 'academico-turnos', label: 'Turnos y Horarios', icon: CalendarClock },
        { id: 'academico', label: 'Aulas y Cursos', icon: FolderOpen },
        { id: 'asistencia', label: 'Control Asistencia', icon: CalendarCheck },
        { id: 'registro-notas', label: 'Registro Simulacros', icon: ClipboardCheck }
      ]
    },
    { id: 'morosidad', label: 'Morosidad', icon: BadgeAlert, show: esAdmin || esTutor },
    { id: 'calificaciones', label: 'Ranking y Notas', icon: Award, show: true },
    { id: 'tutor-ia', label: 'Tutor Pedagógico IA', icon: BrainCircuit, show: esAdmin || esTutor || esDocente },
    { id: 'comunicados', label: 'Circulares y Avisos', icon: Megaphone, show: true },
    { id: 'materiales-admin', label: 'Materiales Académicos', icon: FileUp, show: esAdmin },
    {
      id: 'seguridad_grupo',
      label: 'Seguridad y Acceso',
      icon: ShieldCheck,
      show: esAdmin,
      submenus: [
        { id: 'usuarios', label: 'Usuarios y Códigos', icon: Users },
        { id: 'perfiles', label: 'Roles y Permisos', icon: ShieldCheck },
        { id: 'menu-options', label: 'Opciones de Menú', icon: MenuIcon }
      ]
    },
    { id: 'tutor-dashboard', label: 'Dashboard Tutor', icon: Users, show: esAdmin || esTutor }
  ].filter((item) => item.show);

  const menu = esAlumno ? studentMenu : adminMenu;
  const titulos = {
    'student-home': 'Inicio del alumno',
    'student-ciclo': 'Mi ciclo',
    'student-horario': 'Mi horario de clases',
    'student-cursos': 'Mis cursos',
    'student-notas': 'Mis calificaciones',
    'student-materiales': 'Materiales de estudio',
    dashboard: 'Dashboard Preuniversitario',
    matriculas: 'Matrícula Ágil y Gestión de Alumnos',
    'academico-ciclos': 'Ciclos y Cursos',
    'academico-turnos': 'Turnos y Horarios',
    academico: 'Gestión de Aulas y Cursos',
    asistencia: 'Control de Asistencia',
    'registro-notas': 'Registro de Simulacros',
    morosidad: 'Monitoreo de Pagos y Morosidad',
    calificaciones: 'Resultados y Cuadro de Mérito',
    'tutor-ia': 'Tutor Pedagógico IA',
    comunicados: 'Circulares y Avisos',
    'materiales-admin': 'Materiales Académicos',
    usuarios: 'Usuarios y Códigos',
    perfiles: 'Roles y Permisos',
    'menu-options': 'Opciones de Menú',
    'tutor-dashboard': 'Dashboard de Tutor'
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      <aside
        className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 print:hidden`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: colorTema }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block text-sm font-black truncate">{nombreAcademia}</span>
                <span className="block text-[10px] text-slate-500">
                  {esAlumno ? 'Intranet del alumno' : 'Portal administrativo'}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && esAlumno && (
          <div className="mx-3 mt-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
              <UserRound className="w-3.5 h-3.5" />
              Alumno
            </div>
            <p className="mt-1 text-xs text-slate-300 truncate">{nombreDisplay}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.codigoUsuario || 'Sin código'}</p>
          </div>
        )}

        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const tieneHijos = Array.isArray(item.submenus) && item.submenus.length > 0;
            const abierto = openAccordions[item.id];
            const submenuActivo = tieneHijos && item.submenus.some((sub) => sub.id === activeTab);
            const activo = activeTab === item.id || submenuActivo;

            if (tieneHijos) {
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      activo ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && (abierto ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                  </button>

                  {!collapsed && abierto && (
                    <div className="ml-4 pl-3 mt-1 border-l border-slate-800 space-y-1">
                      {item.submenus.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActivo = activeTab === sub.id;
                        return (
                          <button
                            type="button"
                            key={sub.id}
                            onClick={() => cambiarTab(sub.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                              subActivo ? 'text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                            style={subActivo ? { backgroundColor: colorTema } : undefined}
                          >
                            <SubIcon className="w-3.5 h-3.5" />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => cambiarTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activo ? 'text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
                style={activo ? { backgroundColor: colorTema } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            type="button"
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              {esAlumno ? 'Intranet del alumno' : 'Portal administrativo'}
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
              {titulos[activeTab] || activeTab}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorTema }} />
              {nombreAcademia}
            </div>

            {esAlumno && (
              <button
                type="button"
                onClick={() => cambiarTab('student-ciclo')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Mi ciclo
              </button>
            )}

            <button
              type="button"
              onClick={() => cambiarTab(esAlumno ? 'student-home' : 'comunicados')}
              className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Avisos"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => (esAlumno ? cambiarTab('student-perfil') : setModalPerfilAbierto(true))}
              className="flex items-center gap-2 pl-2 border-l border-slate-800"
              title="Perfil"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ backgroundColor: colorTema }}
              >
                {iniciales}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-200 max-w-40 truncate">{nombreDisplay}</p>
                <p className="text-[10px] text-slate-500">{esAlumno ? 'Alumno' : (user?.rol || 'Staff')}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {!esAlumno && (
        <ModalMiPerfil
          isOpen={modalPerfilAbierto}
          onClose={() => setModalPerfilAbierto(false)}
          user={user}
          onGuardarUsuario={onUpdateUser}
        />
      )}
    </div>
  );
}
