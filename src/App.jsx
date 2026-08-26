import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import PerfilesPage from './pages/PerfilesPage';
import OpcionesMenuPage from './pages/OpcionesMenuPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('perfiles');

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'perfiles' && <PerfilesPage />}
      {activeTab === 'menu-options' && <OpcionesMenuPage />}
      {activeTab === 'usuarios' && (
        <div className="p-8 text-slate-500">Módulo de Gestión de Usuarios .</div>
      )}
      {activeTab === 'dashboard' && (
        <div className="p-8 text-slate-500">Panel Principal de Estadísticas AcadeSys.</div>
      )}
    </DashboardLayout>
  );
}