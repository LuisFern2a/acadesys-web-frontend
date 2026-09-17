import React, { useState, useEffect } from 'react';
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
import { obtenerHijosMock } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [hijos, setHijos] = useState([]);
  const [idHijoSeleccionado, setIdHijoSeleccionado] = useState(1);

  useEffect(() => {
    // 1. Cargar estudiantes/hijos desde el servicio centralizado
    obtenerHijosMock().then((data) => {
      setHijos(data || []);
      if (data && data.length > 0) {
        setIdHijoSeleccionado(data[0].id);
      }
    });

    // 2. Restaurar sesión activa
    const saved = localStorage.getItem('acadesys_session');
    if (saved) {
      try {
        const userParsed = JSON.parse(saved);
        setSession(userParsed);

        const rol = (userParsed?.rol || userParsed?.Perfil || '').toLowerCase();
        if (rol.includes('alumno') || rol.includes('estudiante')) {
          setActiveTab('calificaciones');
        }
      } catch {
        localStorage.removeItem('acadesys_session');
      }
    }
    setLoadingSession(false);
  }, []);

  const handleLogin = (user) => {
    setSession(user);
    const rol = (user?.rol || user?.Perfil || '').toLowerCase();
    if (rol.includes('alumno') || rol.includes('estudiante')) {
      setActiveTab('calificaciones');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('acadesys_session');
    setSession(null);
    setActiveTab('dashboard');
  };

  const handleUpdateUser = (nuevoUsuario) => {
    setSession(nuevoUsuario);
    localStorage.setItem('acadesys_session', JSON.stringify(nuevoUsuario));
  };

  const hijoActivo = hijos.find(h => h.id === idHijoSeleccionado) || hijos[0] || null;
  const rolActual = (session?.rol || session?.Perfil || 'Administrador').toLowerCase();
  const esAdmin = rolActual.includes('admin');
  const esDocenteOAdmin = esAdmin || rolActual.includes('docente');

  if (loadingSession) return null;

  if (!session) {
    return <LandingPage onLoginSuccess={handleLogin} />;
  }

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      user={session}
      onLogout={handleLogout}
      hijos={hijos}
      hijoSeleccionado={hijoActivo}
      onSeleccionarHijo={(id) => setIdHijoSeleccionado(id)}
      onUpdateUser={handleUpdateUser}
    >
      {activeTab === 'dashboard' && (
        <DashboardOverviewPage setActiveTab={setActiveTab} />
      )}
      {activeTab === 'comunicados' && (
        <ComunicadosPage user={session} />
      )}
      {activeTab === 'asistencia' && esDocenteOAdmin && (
        <AsistenciaPage />
      )}
      {activeTab === 'registro-notas' && esDocenteOAdmin && (
        <RegistroNotasPage />
      )}
      {activeTab === 'calificaciones' && (
        <CalificacionesPage 
          estudianteActivo={hijoActivo} 
          onIrATutorIA={() => setActiveTab('tutor-ia')} 
        />
      )}
      {activeTab === 'tutor-ia' && <TutorIAPage estudianteActivo={hijoActivo} />}

      {/* Rutas con restricción de permisos */}
      {activeTab === 'academico' && esDocenteOAdmin && <AcademicoPage />}
      {activeTab === 'usuarios' && esAdmin && <UsuariosPage />}
      {activeTab === 'perfiles' && esAdmin && <PerfilesPage />}
      {activeTab === 'menu-options' && esAdmin && <OpcionesMenuPage />}
    </DashboardLayout>
  );
}