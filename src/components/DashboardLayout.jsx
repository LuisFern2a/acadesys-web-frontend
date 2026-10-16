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
  BadgeAlert
} from 'lucide-react';
import ModalMiPerfil from './ModalMiPerfil';
import { obtenerPerfiles, obtenerMenusPorPerfil } from '../services/api';

const normalizeRole = (user) =>
  String(user?.rol || user?.Perfil || '')
    .trim()
    .toLowerCase();

const normalizarNombrePerfil = (nombre) => String(nombre || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

function resolverPerfilNavegacion(data, idPerfil, rol) {
  const lista = Array.isArray(data) ? data : data?.data ?? data?.perfiles;
  if (!Array.isArray(lista) || lista.some((p) => !p || !Number.isSafeInteger(Number(p.IdPerfil)) ||
      Number(p.IdPerfil) <= 0 || typeof p.Nombre !== 'string')) {
    throw new Error('El catálogo de perfiles no tiene un formato válido.');
  }
  const activos = lista.filter((p) => Number(p.EstadoRegistro) === 1);
  if (idPerfil != null) {
    const perfil = activos.find((p) => String(p.IdPerfil) === String(idPerfil));
    if (!perfil) throw new Error('No se encontró el perfil activo de la sesión.');
    return perfil;
  }
  // Compatibilidad con sesiones existentes que no conservan idPerfil. Nunca se adivina un ID.
  const nombre = normalizarNombrePerfil(rol);
  const alias = (n) => ({ estudiante: 'alumno', admin: 'administrador', rrhh: 'recursos humanos' }[n] || n);
  const exactos = activos.filter((p) => normalizarNombrePerfil(p.Nombre) === nombre);
  const candidatos = exactos.length ? exactos : activos.filter((p) => alias(normalizarNombrePerfil(p.Nombre)) === alias(nombre));
  if (candidatos.length !== 1) throw new Error('No se pudo identificar de forma única el perfil de la sesión.');
  return candidatos[0];
}

function resolverVistaMenu(ruta, rol) {
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
    'student-materiales': 'student-materiales', 'student-perfil': 'student-perfil'
  };
  if (!Object.hasOwn(vistas, clave)) return null;
  const alumno = rol.includes('alumno') || rol.includes('estudiante');
  if (alumno && clave === 'dashboard') return 'student-home';
  if (alumno && clave === 'calificaciones') return 'student-notas';
  return vistas[clave];
}

function integrarMenusNavegacion(items, rol, menusBD) {
  const anteriores = items.filter((item) => item.rolesPermitidos.some((r) => rol.includes(r)));
  const hojas = anteriores.flatMap((item) => item.submenus || [item]);
  const catalogo = new Map(hojas.map((item) => [item.id, item]));
  const staff = ['admin', 'docente', 'tutor'].some((r) => rol.includes(r));
  if (staff) catalogo.set('academico', { id: 'academico', label: 'Cargas Docentes por Ciclo', icon: Layers });
  const asignados = new Map();
  let omitidos = 0;
  for (const menu of menusBD || []) {
    const vista = resolverVistaMenu(menu.UrlMenu, rol);
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
  const [collapsed, setCollapsed] = useState(false);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [configuracionMenu, setConfiguracionMenu] = useState(null);
  const [revisionMenu, setRevisionMenu] = useState(0);

  const [openAccordions, setOpenAccordions] = useState({
    academico_grupo: true,
    seguridad_grupo: false
  });

  const rolSesion = normalizeRole(user);
  // Solo compatibilidad de navegación; no sustituye las comprobaciones de App ni del backend.
  const rolUsuario = rolSesion.includes('recursos humanos') || rolSesion === 'rrhh'
    ? 'administrador' : rolSesion === 'tutor' ? 'tutor de aula' : rolSesion;
  const idPerfilSesion = user?.idPerfil ?? user?.IdPerfil;
  const claveSesion = `${user?.idUsuario ?? user?.IdUsuario ?? user?.id ?? ''}:${idPerfilSesion ?? ''}:${rolSesion}`;

  useEffect(() => {
    let activo = true;
    let solicitud = 0;
    async function cargar() {
      const numero = ++solicitud;
      setConfiguracionMenu({ clave: claveSesion, menus: null, cargando: true, error: '' });
      try {
        const perfil = resolverPerfilNavegacion(await obtenerPerfiles(), idPerfilSesion, rolSesion);
        const data = await obtenerMenusPorPerfil(perfil.IdPerfil);
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
  }, [claveSesion, idPerfilSesion, rolSesion, revisionMenu]);
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
    if (!idsNavegacion.has(tab)) return;
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
      id: (rolUsuario.includes('alumno') || rolUsuario.includes('estudiante')) ? 'student-home' : 'dashboard',
      label: (rolUsuario.includes('alumno') || rolUsuario.includes('estudiante')) ? 'Inicio del Alumno' : 'Resumen de la Academia',
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
        'admin',
        'tutor de aula'
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

  const configuracionActual = configuracionMenu?.clave === claveSesion ? configuracionMenu : null;
  const navegacion = integrarMenusNavegacion(itemsNavegacion, rolUsuario, configuracionActual?.menus);
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
        <nav data-menu-source={navegacion.completa ? 'database' : 'compatibility'} className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">

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
          {(!navegacion.completa || navegacion.omitidos > 0) && (
            <div role={configuracionActual?.error ? 'alert' : 'status'} className="px-6 py-2 text-xs text-slate-300 print:hidden">
              {!navegacion.completa && 'Navegación en compatibilidad temporal: se conservan las opciones actuales. '}
              {configuracionActual?.cargando || !configuracionActual ? 'Consultando asignaciones del servidor. ' : configuracionActual.error || (!navegacion.completa ? 'Las asignaciones de BD aún no cubren todas las vistas actuales. ' : '')}
              {navegacion.omitidos > 0 && ` Se omitieron ${navegacion.omitidos} opciones sin una vista compatible para este perfil. `}
              {configuracionActual?.error && <button type="button" onClick={() => setRevisionMenu((n) => n + 1)} className="text-indigo-300">Reintentar</button>}
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

