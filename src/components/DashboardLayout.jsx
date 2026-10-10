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
  FileUp,
  BadgeAlert,
  FolderOpen
} from 'lucide-react';
import ModalMiPerfil from './ModalMiPerfil';

const normalizeRole = (user) =>
  String(user?.rol || user?.Perfil || '')
    .trim()
    .toLowerCase();

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

  const esAdmin =
    rolUsuario.includes('admin') ||
    rolUsuario.includes('administrador') ||
    rolUsuario.includes('recursos humanos') ||
    rolUsuario === 'rrhh';

  const esTutor = rolUsuario.includes('tutor');
  const esDocente = rolUsuario.includes('docente');

  const nombreAcademia = user?.nombreAcademia || 'AcadeSys Pre-U';
  const colorTema = user?.colorTema || '#2563eb';

  const nombreDisplay =
    user?.nombre ||
    user?.NombreCompleto ||
    user?.Nombre ||
    'Usuario';

  const iniciales =
    nombreDisplay.trim().slice(0, 2).toUpperCase() || 'US';

  const cambiarTab = (tab) => {
    setActiveTab(tab);

    if (window.innerWidth < 1024) {
      setCollapsed(false);
    }
  };

  const toggleAccordion = (id) => {
    if (collapsed) {
      setCollapsed(false);
    }

    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const cerrarSesion = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      onLogout?.();
    }
  };

  const itemsNavegacion = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      icon: LayoutDashboard,
      rolesPermitidos: [
        'administrador',
        'admin',
        'docente',
        'tutor de aula',
        'alumno',
        'estudiante'
      ]
    },

    {
      id: 'matriculas',
      label: 'Matrícula Ágil',
      icon: UserPlus,
      rolesPermitidos: [
        'administrador',
        'admin',
        'tutor de aula'
      ]
    },

    {
      id: 'academico_grupo',
      label: 'Gestión Académica',
      icon: Layers,
      rolesPermitidos: [
        'administrador',
        'admin',
        'docente',
        'tutor de aula'
      ],
      submenus: [
        {
          id: 'academico-ciclos',
          label: 'Ciclos y Cursos',
          icon: GraduationCap
        },
        {
          id: 'academico-turnos',
          label: 'Turnos y Horarios',
          icon: CalendarClock
        },
        {
          id: 'academico',
          label: 'Aulas y Cursos',
          icon: FolderOpen
        },
        {
          id: 'asistencia',
          label: 'Control Asistencia',
          icon: CalendarCheck
        },
        {
          id: 'registro-notas',
          label: 'Registro Simulacros',
          icon: ClipboardCheck
        }
      ]
    },

    {
      id: 'morosidad',
      label: 'Morosidad',
      icon: BadgeAlert,
      rolesPermitidos: [
        'administrador',
        'admin',
        'tutor de aula'
      ]
    },

    {
      id: 'calificaciones',
      label: 'Ranking y Notas',
      icon: Award,
      rolesPermitidos: [
        'administrador',
        'admin',
        'docente',
        'tutor de aula',
        'alumno',
        'estudiante'
      ]
    },

    {
      id: 'tutor-ia',
      label: 'Tutor Pedagógico IA',
      icon: BrainCircuit,
      rolesPermitidos: [
        'administrador',
        'admin',
        'docente',
        'alumno',
        'estudiante',
        'tutor de aula'
      ]
    },

    {
      id: 'comunicados',
      label: 'Circulares y Avisos',
      icon: Megaphone,
      rolesPermitidos: [
        'administrador',
        'admin',
        'docente',
        'alumno',
        'estudiante',
        'tutor de aula'
      ]
    },

    {
      id: 'materiales-admin',
      label: 'Materiales Académicos',
      icon: FileUp,
      rolesPermitidos: [
        'administrador',
        'admin'
      ]
    },

    {
      id: 'seguridad_grupo',
      label: 'Seguridad y Acceso',
      icon: ShieldCheck,
      rolesPermitidos: [
        'administrador',
        'admin'
      ],
      submenus: [
        {
          id: 'usuarios',
          label: 'Usuarios y Códigos',
          icon: Users
        },
        {
          id: 'perfiles',
          label: 'Roles y Permisos',
          icon: ShieldCheck
        },
        {
          id: 'menu-options',
          label: 'Opciones de Menú',
          icon: MenuIcon
        }
      ]
    },

    {
      id: 'tutor-dashboard',
      label: 'Dashboard Tutor',
      icon: Users,
      rolesPermitidos: [
        'administrador',
        'admin',
        'tutor de aula'
      ]
    }
  ];

  const menuItemsFiltrados = itemsNavegacion.filter((item) =>
    item.rolesPermitidos.some((rolPermitido) =>
      rolUsuario.includes(rolPermitido)
    )
  );

  const titulosTabs = {
    dashboard: 'Dashboard Preuniversitario',
    matriculas: 'Matrícula Ágil y Generación de Códigos',
    'tutor-dashboard': 'Dashboard de Tutor de Aula',
    comunicados: 'Comunicados Institucionales',
    'materiales-admin': 'Materiales Académicos',
    asistencia: 'Control de Asistencia',
    'registro-notas': 'Registro de Notas de Simulacro',
    'academico': 'Gestión de Ciclos, Cursos y Aulas',
    'academico-ciclos': 'Ciclos y Cursos',
    'academico-turnos': 'Turnos y Horarios',
    morosidad: 'Monitoreo de Pagos y Morosidad',
    calificaciones: 'Resultados y Cuadro de Mérito',
    'tutor-ia': 'Asistente de Orientación Preuniversitaria IA',
    usuarios: 'Directorio de Usuarios y Alumnos',
    perfiles: 'Seguridad y Roles RBAC',
    'menu-options': 'Estructura de Menús',

    // Vistas de la intranet del alumno
    'student-home': 'Inicio del Alumno',
    'student-ciclo': 'Mi Ciclo',
    'student-horario': 'Mi Horario',
    'student-cursos': 'Mis Cursos',
    'student-notas': 'Calificaciones',
    'student-materiales': 'Materiales de Estudio',
    'student-perfil': 'Mi Perfil'
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">

      {/* SIDEBAR */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 print:hidden`}
      >

        {/* CABECERA */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">

          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="p-2 rounded-xl text-white shrink-0 shadow-md flex items-center justify-center"
              style={{ backgroundColor: colorTema }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>

            {!collapsed && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-sm text-white tracking-wide block truncate">
                  {nombreAcademia}
                </span>

                <span className="text-sm text-slate-300 font-medium block">
                  Plataforma Pre-U
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">

          {menuItemsFiltrados.map((item) => {
            const Icon = item.icon;

            const tieneHijos =
              Array.isArray(item.submenus) &&
              item.submenus.length > 0;

            const estaAbierto = openAccordions[item.id];

            const esSubmenuActivo =
              tieneHijos &&
              item.submenus.some(
                (sub) => sub.id === activeTab
              );

            const isActive =
              activeTab === item.id ||
              esSubmenuActivo;

            if (tieneHijos) {
              return (
                <div
                  key={item.id}
                  className="space-y-1"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      esSubmenuActivo
                        ? 'text-white bg-slate-800/80 border border-slate-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className="w-4 h-4 shrink-0" />

                      {!collapsed && (
                        <span className="truncate">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && (
                      <span className="text-slate-300 p-0.5">
                        {estaAbierto ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </button>

                  {!collapsed && estaAbierto && (
                    <div className="pl-6 space-y-1 border-l-2 border-slate-800 ml-4 py-1">

                      {item.submenus.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          activeTab === sub.id;

                        return (
                          <button
                            type="button"
                            key={sub.id}
                            onClick={() => cambiarTab(sub.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                              isSubActive
                                ? 'text-white font-bold shadow-sm'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                            }`}
                            style={
                              isSubActive
                                ? { backgroundColor: colorTema }
                                : {}
                            }
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />

                            <span className="truncate">
                              {sub.label}
                            </span>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                style={
                  isActive
                    ? { backgroundColor: colorTema }
                    : {}
                }
              >
                <Icon className="w-4 h-4 shrink-0" />

                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}

        </nav>

        {/* CERRAR SESIÓN */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />

            {!collapsed && (
              <span>Cerrar Sesión</span>
            )}
          </button>
        </div>

      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">

        {/* HEADER */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md print:hidden shrink-0">

          <div className="text-sm text-slate-300 font-medium flex items-center gap-2">
            <span>Portal Preuniversitario</span>

            <span className="text-slate-500">
              /
            </span>

            <span className="text-slate-200 font-bold">
              {titulosTabs[activeTab] || activeTab}
            </span>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-sm font-semibold text-slate-300">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colorTema }}
              />

              <span>{nombreAcademia}</span>
            </div>

            <button
              type="button"
              onClick={() => cambiarTab('comunicados')}
              title="Avisos y Comunicados"
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />

              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: colorTema }}
              />
            </button>

            <button
              type="button"
              title="Ver datos del perfil"
              onClick={() =>
                setModalPerfilAbierto(true)
              }
              className="flex items-center gap-3 pl-3 border-l border-slate-800 hover:bg-slate-800/50 p-1.5 rounded-xl transition text-left cursor-pointer"
            >

              <div
                className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner"
                style={{ backgroundColor: colorTema }}
              >
                {user?.foto ? (
                  <img
                    src={user.foto}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  iniciales
                )}
              </div>

              <div className="hidden sm:block leading-tight">
                <span className="block text-sm font-bold text-slate-200">
                  {nombreDisplay}
                </span>

                <span className="block text-sm text-slate-300 capitalize">
                  {user?.rol ||
                    user?.Perfil ||
                    'Administrador'}
                </span>
              </div>

            </button>
          </div>
        </header>

        {/* VISTA ACTIVA */}
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>

      </div>

      {/* MODAL DE PERFIL */}
      <ModalMiPerfil
        isOpen={modalPerfilAbierto}
        onClose={() =>
          setModalPerfilAbierto(false)
        }
        user={user}
        onGuardarUsuario={(usuarioActualizado) => {
          if (onUpdateUser) {
            onUpdateUser(usuarioActualizado);
          }
        }}
      />

    </div>
  );
}