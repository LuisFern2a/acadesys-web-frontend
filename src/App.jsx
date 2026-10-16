import React, { useEffect, useRef, useState } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import PerfilesPage from './pages/PerfilesPage';
import OpcionesMenuPage from './pages/OpcionesMenuPage';
import UsuariosPage from './pages/UsuariosPage';
import TutorIAPage from './pages/TutorIAPage';
import CalificacionesPage from './pages/CalificacionesPage';
import AcademicoPage from './pages/AcademicoPage';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import AsistenciaPage from './pages/AsistenciaPage';
import RegistroNotasPage from './pages/RegistroNotasPage';
import ComunicadosPage from './pages/ComunicadosPage';
import MorosidadPage from './pages/MorosidadPage';
import OfflineFallback from './components/OfflineFallback';
import StudentIntranetPage from './pages/StudentIntranetPage';
import AdminMaterialesPage from './pages/AdminMaterialesPage';
import { obtenerMiIntranetAlumno, obtenerMiUsuario } from './services/api';

const leerSesionGuardada = () => {
  const saved = localStorage.getItem('acadesys_session') || localStorage.getItem('usuario');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('acadesys_tab') || 'dashboard');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [studentBootstrapped, setStudentBootstrapped] = useState(false);
  const revalidandoSesionRef = useRef(0);

  const esAlumnoRol = (user) => {
    const rol = String(user?.rol || user?.Perfil || '').toLowerCase();
    return rol.includes('alumno') || rol.includes('estudiante');
  };

  const esAdminRol = (user) => {
    const rol = String(user?.rol || user?.Perfil || '').toLowerCase();
    return rol.includes('admin') || rol.includes('administrador') || rol.includes('recursos humanos') || rol === 'rrhh';
  };

  const esTutorRol = (user) => String(user?.rol || user?.Perfil || '').toLowerCase().includes('tutor');
  const esDocenteRol = (user) => String(user?.rol || user?.Perfil || '').toLowerCase().includes('docente');

  useEffect(() => {
    const savedUser = leerSesionGuardada();

    if (!savedUser) {
      setLoadingSession(false);
      return;
    }

    setSession(savedUser);
    const rol = String(savedUser?.rol || savedUser?.Perfil || '').toLowerCase();

    if (rol.includes('alumno') || rol.includes('estudiante')) {
      setActiveTab('student-home');
      setStudentBootstrapped(false);
    } else {
      setActiveTab('dashboard');
    }

    setLoadingSession(false);
  }, []);

  useEffect(() => {
    if (session && esAlumnoRol(session) && !studentBootstrapped) {
      obtenerMiIntranetAlumno()
        .then((data) => {
          if (data?.ciclo?.idCiclo) {
            const sessionActualizada = {
              ...session,
              idUsuario: data.usuario?.idUsuario ?? session.idUsuario,
              nombre: data.usuario?.nombreCompleto ?? session.nombre,
              correo: data.usuario?.correo ?? session.correo,
              dni: data.usuario?.dni ?? session.dni,
              codigoUsuario: data.usuario?.codigoUsuario ?? session.codigoUsuario,
              ciclo: data.ciclo,
            };
            setSession(sessionActualizada);
            localStorage.setItem('acadesys_session', JSON.stringify(sessionActualizada));
          }
        })
        .catch((error) => {
          console.warn('[Alumno] No fue posible precargar el expediente:', error.message);
        })
        .finally(() => setStudentBootstrapped(true));
    }
  }, [session, studentBootstrapped]);

  // Punto 18: si el perfil operativo cambió durante la sesión, no conservar
  // indefinidamente permisos visuales obsoletos. Se revalida contra el backend
  // SOLO al recuperar el foco de la ventana (no es polling constante) y se
  // reutiliza el mecanismo de sesión existente. La seguridad real está en el
  // backend (auth.middleware); esto solo sincroniza la apariencia del sidebar.
  useEffect(() => {
    if (!session) return undefined;

    const normalizarRol = (valor) => {
      const base = String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
      if (!base) return '';
      if (base === 'admin' || base.includes('administrador')) return 'administrador';
      if (base === 'rrhh' || base.includes('recursos humanos')) return 'administrador';
      if (base.includes('estudiante')) return 'alumno';
      if (base.includes('alumno')) return 'alumno';
      return base;
    };

    const revalidarSesion = async () => {
      const ahora = Date.now();
      if (ahora - revalidandoSesionRef.current < 5000) return; // evita ráfagas de foco
      revalidandoSesionRef.current = ahora;
      try {
        const me = await obtenerMiUsuario();
        if (!me) return;

        const rolNuevo = me.NombrePerfil || me.Perfil || me.rol || '';
        const idNuevo = me.IdPerfil ?? me.idPerfil ?? null;
        const idActual = session.idPerfil ?? session.IdPerfil ?? null;
        const rolActual = session.rol || session.Perfil || '';

        const idDisponibles = idNuevo != null && idActual != null;
        const cambioId = idDisponibles && String(idNuevo) !== String(idActual);
        const cambioRol = !idDisponibles && normalizarRol(rolNuevo) !== normalizarRol(rolActual);
        if (!cambioId && !cambioRol) return;

        const actualizada = {
          ...session,
          rol: rolNuevo || session.rol,
          Perfil: rolNuevo || session.Perfil,
          idPerfil: idNuevo ?? session.idPerfil,
        };
        setSession(actualizada);
        localStorage.setItem('acadesys_session', JSON.stringify(actualizada));
        setStudentBootstrapped(false);

        // La pestaña actual pudo dejar de ser válida para el nuevo perfil.
        const esAlumnoNuevo = normalizarRol(rolNuevo) === 'alumno';
        setActiveTab(esAlumnoNuevo ? 'student-home' : 'dashboard');
        localStorage.setItem('acadesys_tab', esAlumnoNuevo ? 'student-home' : 'dashboard');
      } catch {
        // 401 (sesión inválida) ya lo maneja fetchWithAuth cerrando sesión.
        // Otros errores no deben forzar un logout.
      }
    };

    window.addEventListener('focus', revalidarSesion);
    return () => window.removeEventListener('focus', revalidarSesion);
  }, [session]);

  const handleLogin = (user) => {
    setSession(user);
    setStudentBootstrapped(false);

    if (esAlumnoRol(user)) {
      setActiveTab('student-home');
    } else {
      setActiveTab('dashboard');
    }
    localStorage.setItem('acadesys_tab', esAlumnoRol(user) ? 'student-home' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('acadesys_session');
    localStorage.removeItem('acadesys_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('acadesys_tab');
    setSession(null);
    setActiveTab('dashboard');
    setStudentBootstrapped(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('acadesys_tab', tab);
  };

  if (loadingSession) return null;

  const esAlumno = esAlumnoRol(session);
  const esAdmin = esAdminRol(session);
  const esTutor = esTutorRol(session);
  const esDocente = esDocenteRol(session);
  const esStaff = esAdmin || esTutor || esDocente;

  return (
    <OfflineFallback>
      {!session ? (
        <LandingPage onLoginSuccess={handleLogin} />
      ) : (
        <DashboardLayout
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          user={session}
          onLogout={handleLogout}
          onUpdateUser={(nuevoUsuario) => {
            setSession(nuevoUsuario);
            localStorage.setItem('acadesys_session', JSON.stringify(nuevoUsuario));
          }}
        >
          {esAlumno ? (
            activeTab === 'tutor-ia' ? (
              <TutorIAPage
                estudianteActivo={{
                  id: session?.idUsuario,
                  codigoUsuario: session?.codigoUsuario,
                  nombre: session?.nombre,
                  ciclo: session?.ciclo?.nombre,
                  universidadObjetivo: session?.ciclo?.universidadObjetivo,
                  totalAlumnos: session?.ciclo?.totalAlumnos
                }}
              />
            ) : activeTab === 'comunicados' ? (
              <ComunicadosPage user={session} />
            ) : (
              <StudentIntranetPage
                view={
                  activeTab === 'dashboard'
                    ? 'student-home'
                    : activeTab === 'calificaciones'
                      ? 'student-notas'
                      : activeTab
                }
                setActiveTab={handleTabChange}
                user={session}
              />
            )
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverviewPage setActiveTab={handleTabChange} />
              )}

              {activeTab === 'comunicados' && (
                <ComunicadosPage user={session} />
              )}

              {activeTab === 'asistencia' && esStaff && (
                <AsistenciaPage />
              )}

              {activeTab === 'registro-notas' && esStaff && (
                <RegistroNotasPage />
              )}

              {activeTab === 'morosidad' && (esAdmin || esTutor) && (
                <MorosidadPage />
              )}

              {activeTab === 'calificaciones' && esStaff && (
                <CalificacionesPage />
              )}

              {activeTab === 'tutor-ia' && esStaff && (
                <TutorIAPage />
              )}

              {(activeTab === 'academico' ||
                activeTab === 'academico-ciclos' ||
                activeTab === 'academico-turnos') && esStaff && (
                <AcademicoPage
                  vistaInicial={
                    activeTab === 'academico-ciclos'
                      ? 'ciclos'
                      : activeTab === 'academico-turnos'
                        ? 'turnos'
                        : 'asignaciones'
                  }
                />
              )}

              {activeTab === 'materiales-admin' && esAdmin && (
                <AdminMaterialesPage />
              )}

              {activeTab === 'usuarios' && esAdmin && <UsuariosPage />}
              {activeTab === 'perfiles' && esAdmin && <PerfilesPage />}
              {activeTab === 'menu-options' && esAdmin && <OpcionesMenuPage />}
            </>
          )}
        </DashboardLayout>
      )}
    </OfflineFallback>
  );
}

