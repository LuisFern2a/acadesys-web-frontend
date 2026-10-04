import React, { useEffect, useState } from 'react';
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
import TutorDashboardPage from './pages/TutorDashboardPage';
import StudentIntranetPage from './pages/StudentIntranetPage';
import AdminMaterialesPage from './pages/AdminMaterialesPage';
import { obtenerMiIntranetAlumno } from './services/api';

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
            <StudentIntranetPage
              view={activeTab}
              setActiveTab={handleTabChange}
              user={session}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverviewPage setActiveTab={handleTabChange} />
              )}

              {activeTab === 'tutor-dashboard' && (esAdmin || esTutor) && (
                <TutorDashboardPage setActiveTab={handleTabChange} />
              )}

              {activeTab === 'matriculas' && (esAdmin || esTutor) && (
                <UsuariosPage />
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
