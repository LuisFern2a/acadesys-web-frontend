import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import PerfilesPage from './pages/PerfilesPage';
import OpcionesMenuPage from './pages/OpcionesMenuPage';
import UsuariosPage from './pages/UsuariosPage';
import TutorIAPage from './pages/TutorIAPage';
import CalificacionesPage from './pages/CalificacionesPage';
import AcademicoPage from './pages/AcademicoPage';

// Lista de subcuentas vinculadas al apoderado
const MOCK_HIJOS = [
  {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
    gradoCorto: '5to Sec',
    codigo: 'ACAD-2026-755',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 3,
    totalAlumnos: 36,
    promedioGeneral: 15.8,
    cursosCriticos: 1,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 16, tareas: 18, final: 15, promedio: 16.3, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 17, tareas: 19, final: 18, promedio: 18.0, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 13, tareas: 15, final: 14, promedio: 14.0, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 10, tareas: 12, final: 11, promedio: 11.0, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 12, tareas: 13, final: 12, promedio: 12.3, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  },
  {
    id: 2,
    nombre: 'Andrea Sofía Tóccas',
    gradoCorto: '2do Sec',
    codigo: 'ACAD-2026-912',
    aula: '2do de Secundaria - Aula 204 B',
    puestoRanking: 1,
    totalAlumnos: 32,
    promedioGeneral: 18.2,
    cursosCriticos: 0,
    cursos: [
      { id: 10, nombre: 'Aritmética Básica', docente: 'Prof. Pedro Ramos', parcial: 18, tareas: 19, final: 19, promedio: 18.7, materialPdf: 'Guia_Fracciones_Decimales.pdf', pesoMb: '1.1 MB' },
      { id: 11, nombre: 'Comunicación Integral', docente: 'Prof. Carmen Vega', parcial: 17, tareas: 18, final: 18, promedio: 17.7, materialPdf: 'Comprension_Lectora_Bim2.pdf', pesoMb: '2.0 MB' },
      { id: 12, nombre: 'Biología y Ecosistemas', docente: 'Prof. Laura Méndez', parcial: 18, tareas: 18, final: 18, promedio: 18.0, materialPdf: 'Guia_Laboratorio_Celular.pdf', pesoMb: '1.5 MB' },
      { id: 13, nombre: 'Historia del Perú', docente: 'Prof. Manuel Salazar', parcial: 18, tareas: 19, final: 18, promedio: 18.4, materialPdf: 'Resumen_Tahuantinsuyo.pdf', pesoMb: '3.2 MB' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('calificaciones');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [idHijoSeleccionado, setIdHijoSeleccionado] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('acadesys_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
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

  const hijoActivo = MOCK_HIJOS.find(h => h.id === idHijoSeleccionado) || MOCK_HIJOS[0];

  if (loadingSession) {
    return null;
  }

  if (!session) {
    return <LandingPage onLoginSuccess={(user) => setSession(user)} />;
  }

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      user={session}
      onLogout={handleLogout}
      hijos={MOCK_HIJOS}
      hijoSeleccionado={hijoActivo}
      onSeleccionarHijo={(id) => setIdHijoSeleccionado(id)}
    >
      {activeTab === 'perfiles' && <PerfilesPage />}
      {activeTab === 'menu-options' && <OpcionesMenuPage />}
      {activeTab === 'usuarios' && <UsuariosPage />}
      {activeTab === 'academico' && <AcademicoPage />}
      {activeTab === 'calificaciones' && (
        <CalificacionesPage 
          estudianteActivo={hijoActivo} 
          onIrATutorIA={() => setActiveTab('tutor-ia')} 
        />
      )}
      {activeTab === 'tutor-ia' && <TutorIAPage estudianteActivo={hijoActivo} />}
      {activeTab === 'dashboard' && (
        <div className="p-8 text-slate-500">
          Panel Principal de Estadísticas AcadeSys.
        </div>
      )}
    </DashboardLayout>
  );
}