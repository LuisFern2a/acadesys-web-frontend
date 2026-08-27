import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import PerfilesPage from './pages/PerfilesPage';
import OpcionesMenuPage from './pages/OpcionesMenuPage';
import UsuariosPage from './pages/UsuariosPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('perfiles');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Verificar si hay una sesión guardada en el navegador
  useEffect(() => {
    const saved = localStorage.getItem('acadesys_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('acadesys_session');
      }
    }
    setLoadingSession(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('acadesys_session');
    setSession(null);
    setActiveTab('perfiles');
  };

  if (loadingSession) {
    return null;
  }

  // 1. Si no hay sesión, muestra la Landing Page de bienvenida
  if (!session) {
    return <LandingPage onLoginSuccess={(user) => setSession(user)} />;
  }

  // 2. Si el usuario inició sesión, entra al Dashboard completo
  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      user={session}
      onLogout={handleLogout}
    >
      {activeTab === 'perfiles' && <PerfilesPage />}
      {activeTab === 'menu-options' && <OpcionesMenuPage />}
      {activeTab === 'usuarios' && <UsuariosPage />}
      {activeTab === 'dashboard' && (
        <div className="p-8 text-slate-500">
          Panel Principal de Estadísticas AcadeSys.
        </div>
      )}
    </DashboardLayout>
  );
}