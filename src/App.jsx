import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import PerfilesPage from './pages/PerfilesPage';
import OpcionesMenuPage from './pages/OpcionesMenuPage';
import UsuariosPage from './pages/UsuariosPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('perfiles');

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
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