import React, { useEffect, useState } from 'react';
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
  BookOpen,
  LogOut,
  BrainCircuit,
  Award,
  Layers,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  Megaphone,
  FileUp,
  BadgeAlert,
  CreditCard
} from 'lucide-react';
import ModalMiPerfil from './ModalMiPerfil';
import AcadeSysBrand from './AcadeSysBrand';
import { obtenerMenusPorPerfil, obtenerComunicados } from '../services/api';
import { normalizarRol, grupoDeRol, rolDeUsuario } from '../utils/roles';

const normalizeRole = (user) => normalizarRol(rolDeUsuario(user));

function resolverVistaMenu(ruta, grupoRol) {
  // Lista cerrada de vistas que App.jsx ya renderiza. No evalúa rutas, HTML ni importaciones.
  const clave = String(ruta || '').trim().toLowerCase().replace(/^\//, '').replace(/\/$/, '');
  const vistas = {
    dashboard: 'dashboard', academico: 'academico', 'academico-ciclos': 'academico-ciclos',
    'academico-turnos': 'academico-turnos', asistencia: 'asistencia', 'registro-notas': 'registro-notas',
    morosidad: 'morosidad', calificaciones: 'calificaciones', 'tutor-ia': 'tutor-ia',
    comunicados: 'comunicados', 'materiales-admin': 'materiales-admin', usuarios: 'usuarios',
    perfiles: 'perfiles', 'menu-options': 'menu-options', 'opciones-menu': 'menu-options',
    'student-home': 'student-home', 'student-ciclo': 'student-ciclo', 'student-horario': 'student-horario',
    'student-cursos': 'student-cursos', 'student-notas': 'student-notas',
    'student-materiales': 'student-materiales', 'student-pagos': 'student-pagos', 'student-perfil': 'student-perfil'
  };
  if (!Object.hasOwn(vistas, clave)) return null;
  const alumno = grupoRol === 'alumno';
  if (alumno && clave === 'dashboard') return 'student-home';
  if (alumno && clave === 'calificaciones') return 'student-notas';
  return vistas[clave];
}

function integrarMenusNavegacion(items, grupoRol, menusBD) {
  const anteriores = items.filter((item) => item.rolesPermitidos.some((r) => grupoDeRol(r) === grupoRol));
  const hojas = anteriores.flatMap((item) => item.submenus || [item]);
  const catalogo = new Map(hojas.map((item) => [item.id, item]));
  const staff = ['administrador', 'docente', 'tutor'].includes(grupoRol);
  if (staff) catalogo.set('academico', { id: 'academico', label: 'Cargas Docentes por Ciclo', icon: Layers });
  const asignados = new Map();
  let omitidos = 0;
  for (const menu of menusBD || []) {
    const vista = resolverVistaMenu(menu.UrlMenu, grupoRol);
    if (!vista || !catalogo.has(vista)) { omitidos += 1; continue; }
    if (!asignados.has(vista)) asignados.set(vista, menu);
  }
  // Mientras falte cualquier vista histórica, no se retira navegación de ese perfil.
  const completa = Array.isArray(menusBD) && hojas.length > 0 && hojas.every((h) => asignados.has(h.id));
  const visibles = new Set(completa ? asignados.keys() : [...catalogo.keys()].filter((id) => id !== 'academico'));
  for (const id of asignados.keys()) visibles.add(id);
  const orden = (item) => Number(asignados.get(item.id)?.Orden ?? Number.MAX_SAFE_INTEGER);
  const aplicar = (item) => ({ ...item, label: asignados.get(item.id)?.Nombre?.trim() || item.label });
  const resultado = anteriores.flatMap((item) => {
    if (!item.submenus) return visibles.has(item.id) ? [aplicar(item)] : [];
    const submenus = item.submenus.filter((sub) => visibles.has(sub.id)).map(aplicar);
    if (item.id === 'academico_grupo' && asignados.has('academico')) submenus.push(aplicar(catalogo.get('academico')));
    submenus.sort((a, b) => orden(a) - orden(b));
    return submenus.length ? [{ ...item, submenus }] : [];
  });
  const ordenGrupo = (item) => item.submenus ? Math.min(...item.submenus.map(orden)) : orden(item);
  resultado.sort((a, b) => ordenGrupo(a) - ordenGrupo(b));
  return { items: resultado, completa, omitidos };
}

export default function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onUpdateUser
}) {
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [configuracionMenu, setConfiguracionMenu] = useState(null);
  const [revisionMenu, setRevisionMenu] = useState(0);
  const [noLeidos, setNoLeidos] = useState(0);

  const [openAccordions, setOpenAccordions] = useState({
    academico_grupo: true,
    seguridad_grupo: false
  });

  const rolSesion = normalizeRole(user);
  // Grupo canónico seguro ('administrador' | 'docente' | 'tutor' | 'alumno' | 'padre' | null).
  // Solo controla la navegación visible; no sustituye las comprobaciones de App ni del backend.
  const grupoRol = grupoDeRol(rolDeUsuario(user));
  const idPerfilSesion = user?.idPerfil ?? user?.IdPerfil;
  const claveSesion = `${user?.idUsuario ?? user?.IdUsuario ?? user?.id ?? ''}:${idPerfilSesion ?? ''}:${rolSesion}`;

  useEffect(() => {
    // Este layout es compartido por TODOS los portales. La navegación del alumno
    // (y la del resto de roles no administrativos) está definida de forma
    // estática en itemsNavegacion + rolesPermitidos, así que aquí NUNCA se
    // consulta el catálogo administrativo GET /api/perfiles: era la causa del
    // 403 real del alumno. Solo un administrador consulta los menús de su
    // propio perfil, usando el idPerfil que ya trae la sesión.
    if (grupoRol !== 'administrador') {
      return undefined;
    }

    const idPerfilMenu = Number(idPerfilSesion);
    if (!Number.isSafeInteger(idPerfilMenu) || idPerfilMenu <= 0) {
      // Sesión antigua sin idPerfil: se conserva la navegación estática.
      return undefined;
    }

    let activo = true;
    let solicitud = 0;
    async function cargar() {
      const numero = ++solicitud;
      setConfiguracionMenu({ clave: claveSesion, menus: null, cargando: true, error: '' });
      try {
        const data = await obtenerMenusPorPerfil(idPerfilMenu);
        if (activo && numero === solicitud) setConfiguracionMenu({ clave: claveSesion, menus: data.menus, cargando: false, error: '' });
      } catch (error) {
        if (activo && numero === solicitud) setConfiguracionMenu({ clave: claveSesion, menus: null, cargando: false, error: error.message || 'No se pudo consultar la navegación.' });
      }
    }
    cargar();
    window.addEventListener('acadesys-menus-actualizados', cargar);
    window.addEventListener('focus', cargar);
    return () => {
      activo = false;
      window.removeEventListener('acadesys-menus-actualizados', cargar);
      window.removeEventListener('focus', cargar);
    };
  }, [claveSesion, idPerfilSesion, rolSesion, revisionMenu, grupoRol]);

  useEffect(() => {
    let activo = true;

    let solicitud = 0;
    async function cargarNoLeidos() {
      const numero = ++solicitud;
      try {
        const lista = await obtenerComunicados();
        if (!activo || numero !== solicitud) return;
        setNoLeidos((Array.isArray(lista) ? lista : []).filter(
          (comunicado) => !comunicado?.confirmado && !comunicado?.leido
        ).length);
      } catch {
        // La campana no debe romper la navegación si el módulo no está disponible.
        if (activo && numero === solicitud) setNoLeidos(0);
      }
    }

    cargarNoLeidos();
    window.addEventListener('focus', cargarNoLeidos);
    window.addEventListener('acadesys-comunicados-actualizados', cargarNoLeidos);
    return () => {
      activo = false;
      window.removeEventListener('focus', cargarNoLeidos);
      window.removeEventListener('acadesys-comunicados-actualizados', cargarNoLeidos);
    };
  }, [activeTab, claveSesion]);
  const nombreDisplay =
    user?.nombre ||
    user?.NombreCompleto ||
    user?.Nombre ||
    'Usuario';

  const iniciales =
    nombreDisplay.trim().slice(0, 2).toUpperCase() || 'US';

  const cambiarTab = (tab) => {
    if (!idsNavegacion.has(tab)) return;
    setActiveTab(tab);

    if (window.innerWidth < 1024) {
      setCollapsed(true);
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
      id: grupoRol === 'alumno' ? 'student-home' : 'dashboard',
      label: grupoRol === 'alumno' ? 'Inicio del Alumno' : 'Resumen de la Academia',
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
      id: 'student-ciclo',
      label: 'Mi Ciclo',
      icon: GraduationCap,
      rolesPermitidos: ['alumno', 'estudiante']
    },
    {
      id: 'student-horario',
      label: 'Mi Horario',
      icon: CalendarClock,
      rolesPermitidos: ['alumno', 'estudiante']
    },
    {
      id: 'student-cursos',
      label: 'Mis Cursos',
      icon: BookOpen,
      rolesPermitidos: ['alumno', 'estudiante']
    },
    {
      id: 'student-notas',
      label: 'Mis Resultados',
      icon: Award,
      rolesPermitidos: ['alumno', 'estudiante']
    },
    {
      id: 'student-materiales',
      label: 'Materiales de Estudio',
      icon: FileUp,
      rolesPermitidos: ['alumno', 'estudiante']
    },
    {
      id: 'student-pagos',
      label: 'Mis pagos',
      icon: CreditCard,
      rolesPermitidos: ['alumno', 'estudiante']
    },
    {
      id: 'student-perfil',
      label: 'Mi Perfil',
      icon: Users,
      rolesPermitidos: ['alumno', 'estudiante']
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
          id: 'asistencia',
          label: 'Asistencia por Ciclo',
          icon: CalendarCheck
        },
        {
          id: 'registro-notas',
          label: 'Registro de Simulacros',
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
        'admin'
      ]
    },

    {
      id: 'calificaciones',
      label: 'Simulacros y Cuadro de Mérito',
      icon: Award,
      rolesPermitidos: [
        'administrador',
        'admin',
        'docente',
        'tutor de aula'
      ]
    },

    {
      id: 'tutor-ia',
      label: 'Tutor Pedagógico IA',
      icon: BrainCircuit,
      rolesPermitidos: [
        'alumno',
        'estudiante'
      ]
    },

    {
      id: 'comunicados',
      label: 'Comunicados y Avisos',
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
  ];

  const configuracionActual = grupoRol === 'administrador' && configuracionMenu?.clave === claveSesion ? configuracionMenu : null;
  const navegacion = integrarMenusNavegacion(itemsNavegacion, grupoRol, configuracionActual?.menus);
  const menuItemsFiltrados = navegacion.items;
  const idsNavegacion = new Set(menuItemsFiltrados.flatMap((item) => item.submenus || [item]).map((item) => item.id));

  const titulosTabs = {
    dashboard: 'Dashboard Preuniversitario',
    comunicados: 'Comunicados Institucionales',
    'materiales-admin': 'Materiales Académicos',
    asistencia: 'Asistencia por Ciclo',
    'registro-notas': 'Registro de Notas de Simulacro',
    'academico': 'Cargas Docentes por Ciclo',
    'academico-ciclos': 'Ciclos y Cursos',
    'academico-turnos': 'Turnos y Horarios',
    morosidad: 'Monitoreo de Pagos y Morosidad',
    calificaciones: 'Simulacros y Cuadro de Mérito',
    'tutor-ia': 'Asistente de Orientación Preuniversitaria IA',
    usuarios: 'Directorio de Usuarios y Alumnos',
    perfiles: 'Seguridad y Roles RBAC',
    'menu-options': 'Estructura de Menús',

    // Vistas del portal del alumno
    'student-home': 'Inicio del Alumno',
    'student-ciclo': 'Mi Ciclo',
    'student-horario': 'Mi Horario',
    'student-cursos': 'Mis Cursos',
    'student-notas': 'Mis Resultados',
    'student-materiales': 'Materiales de Estudio',
    'student-pagos': 'Mis pagos',
    'student-perfil': 'Mi Perfil'
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* SIDEBAR */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-60'
        } bg-[#0F172A] border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 print:hidden`}
      >

        {/* CABECERA */}
        <div className={`h-16 flex items-center border-b border-white/10 shrink-0 ${collapsed ? 'justify-center gap-1 px-1.5' : 'justify-between px-4'}`}>

          <AcadeSysBrand compacto={collapsed} className="overflow-hidden" />

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav aria-label="Navegación principal" data-menu-source={navegacion.completa ? 'database' : 'compatibility'} className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">

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
                    aria-expanded={!collapsed && estaAbierto}
                    title={item.label}
                    aria-label={item.label}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                      esSubmenuActivo
                        ? 'text-white bg-teal-600/15 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
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
                    <div className="pl-6 space-y-1 border-l border-white/10 ml-4 py-1">

                      {item.submenus.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          activeTab === sub.id;

                        return (
                          <button
                            type="button"
                            key={sub.id}
                            onClick={() => cambiarTab(sub.id)}
                            title={sub.label}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                              isSubActive
                                ? 'bg-teal-600 hover:bg-teal-700 text-white font-semibold'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
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
                title={item.label}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  isActive
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
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
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="w-4 h-4 shrink-0" />

            {!collapsed && (
              <span>Cerrar Sesión</span>
            )}
          </button>
        </div>

      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between print:hidden shrink-0">

          <div className="text-sm text-slate-500 font-medium flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline">Portal Preuniversitario</span>

            <span className="hidden sm:inline text-slate-300">
              /
            </span>

            <span className="text-slate-900 font-semibold truncate">
              {titulosTabs[activeTab] || activeTab}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            <button
              type="button"
              onClick={() => cambiarTab('comunicados')}
              title="Avisos y Comunicados"
              aria-label={noLeidos > 0 ? `Avisos y comunicados: ${noLeidos} sin leer` : 'Avisos y comunicados'}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />

              {noLeidos > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              title="Ver datos del perfil"
              onClick={() =>
                setModalPerfilAbierto(true)
              }
              className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >

              <div
                className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase"
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
                <span className="block text-sm font-semibold text-slate-900">
                  {nombreDisplay}
                </span>

                <span className="block text-xs text-slate-500 capitalize">
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
          {/*
            El respaldo de navegación (menú en "compatibilidad") sigue activo:
            si la BD aún no cubre todas las vistas, se conservan las opciones
            actuales. Ese aviso era informativo y solo se muestra ahora cuando
            existe un error real de servidor, para no exponer mensajes técnicos
            durante la operación normal.
          */}
          {configuracionActual?.error && (
            <div role="alert" className="mx-4 sm:mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 print:hidden">
              {configuracionActual.error}
              <button
                type="button"
                onClick={() => setRevisionMenu((n) => n + 1)}
                className="ml-2 font-semibold text-teal-700 hover:text-teal-800"
              >
                Reintentar
              </button>
            </div>
          )}
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
