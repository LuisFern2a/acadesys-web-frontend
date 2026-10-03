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
import MorosidadPage from './pages/MorosidadPage';
import PanelAlumnoPage from './pages/PanelAlumnoPage';
import OfflineFallback from './components/OfflineFallback';
import TutorDashboardPage from './pages/TutorDashboardPage';
import { obtenerHijosMock } from './services/api';

const ESTUDIANTES_DEMO = [
  {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
    codigo: 'SEMSM-Q6265',
    aula: 'Ciclo San Marcos',
    puestoRanking: 3,
    totalAlumnos: 120,
    promedioGeneral: 615,
    cursosCriticos: 1,
    cursos: [
      { id: 1, nombre: 'Habilidad Verbal', simulacro1: 150, simulacro2: 180, simulacro3: 160, promedio: 163, estado: 'Óptimo' },
      { id: 2, nombre: 'Habilidad Lógico-Matemática', simulacro1: 140, simulacro2: 170, simulacro3: 190, promedio: 167, estado: 'Óptimo' },
      { id: 3, nombre: 'Aritmética y Álgebra', simulacro1: 90, simulacro2: 110, simulacro3: 100, promedio: 100, estado: 'Regular' },
      { id: 4, nombre: 'Física y Química', simulacro1: 50, simulacro2: 60, simulacro3: 55, promedio: 55, estado: 'En Riesgo' },
      { id: 5, nombre: 'Historia del Perú y Universal', simulacro1: 120, simulacro2: 130, simulacro3: 140, promedio: 130, estado: 'Óptimo' }
    ]
  },
  {
    id: 2,
    nombre: 'Valeria Sofía Ramos',
    codigo: 'SEMSM-Q6267',
    aula: 'Ciclo San Marcos',
    puestoRanking: 1,
    totalAlumnos: 120,
    promedioGeneral: 845,
    cursosCriticos: 0,
    cursos: [
      { id: 1, nombre: 'Habilidad Verbal', simulacro1: 190, simulacro2: 200, simulacro3: 195, promedio: 195, estado: 'Óptimo' },
      { id: 2, nombre: 'Habilidad Lógico-Matemática', simulacro1: 200, simulacro2: 195, simulacro3: 210, promedio: 202, estado: 'Óptimo' },
      { id: 3, nombre: 'Aritmética y Álgebra', simulacro1: 180, simulacro2: 190, simulacro3: 175, promedio: 182, estado: 'Óptimo' },
      { id: 4, nombre: 'Física y Química', simulacro1: 130, simulacro2: 140, simulacro3: 135, promedio: 135, estado: 'Óptimo' },
      { id: 5, nombre: 'Historia del Perú y Universal', simulacro1: 125, simulacro2: 130, simulacro3: 140, promedio: 132, estado: 'Óptimo' }
    ]
  },
  {
    id: 3,
    nombre: 'Mateo Sebastián Quispe',
    codigo: 'SEMSM-Q6268',
    aula: 'Ciclo San Marcos',
    puestoRanking: 96,
    totalAlumnos: 120,
    promedioGeneral: 340,
    cursosCriticos: 3,
    cursos: [
      { id: 1, nombre: 'Habilidad Verbal', simulacro1: 80, simulacro2: 90, simulacro3: 85, promedio: 85, estado: 'En Riesgo' },
      { id: 2, nombre: 'Habilidad Lógico-Matemática', simulacro1: 60, simulacro2: 70, simulacro3: 65, promedio: 65, estado: 'En Riesgo' },
      { id: 3, nombre: 'Aritmética y Álgebra', simulacro1: 50, simulacro2: 60, simulacro3: 55, promedio: 55, estado: 'En Riesgo' },
      { id: 4, nombre: 'Física y Química', simulacro1: 45, simulacro2: 40, simulacro3: 50, promedio: 45, estado: 'En Riesgo' },
      { id: 5, nombre: 'Historia del Perú y Universal', simulacro1: 90, simulacro2: 85, simulacro3: 95, promedio: 90, estado: 'Regular' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('acadesys_tab') || 'dashboard');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [hijos, setHijos] = useState(ESTUDIANTES_DEMO);
  const [idHijoSeleccionado, setIdHijoSeleccionado] = useState(1);

  useEffect(() => {
    obtenerHijosMock()
      .then((data) => {
        const datosApi = data || [];
        const listaCombinada = [
          ...datosApi,
          ...ESTUDIANTES_DEMO.filter(
            (demo) => !datosApi.some((d) => d.id === demo.id || d.nombre?.toLowerCase() === demo.nombre?.toLowerCase())
          )
        ];
        setHijos(listaCombinada);
        if (listaCombinada.length > 0) {
          setIdHijoSeleccionado(listaCombinada[0].id);
        }
      })
      .catch(() => {
        setHijos(ESTUDIANTES_DEMO);
        setIdHijoSeleccionado(ESTUDIANTES_DEMO[0].id);
      });

    // Leemos 'usuario', que es donde vive el JSON con { nombre: 'Luis', rol: 'Alumno' }
    const savedUser = localStorage.getItem('usuario') || localStorage.getItem('acadesys_session');
    if (savedUser) {
      try {
        const userParsed = typeof savedUser === 'string' && savedUser.startsWith('{')
          ? JSON.parse(savedUser)
          : { nombre: 'Luis', rol: 'Alumno' };

        setSession(userParsed);

        const rol = (userParsed?.rol || userParsed?.Perfil || '').toLowerCase();
        if (rol.includes('alumno') || rol.includes('estudiante')) {
          setActiveTab('calificaciones');
        } else {
          setActiveTab('dashboard');
        }
      } catch (e) {
        console.error("Error al procesar sesión:", e);
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
    localStorage.removeItem('acadesys_token');
    localStorage.removeItem('usuario');
    setSession(null);
    setActiveTab('dashboard');
  };

  const handleUpdateUser = (nuevoUsuario) => {
    setSession(nuevoUsuario);
    localStorage.setItem('acadesys_session', JSON.stringify(nuevoUsuario));
  };

  const hijoActivo = hijos.find((h) => h.id === idHijoSeleccionado) || hijos[0] || null;
  const rolActual = (session?.rol || session?.Perfil || 'Administrador').toLowerCase();
  const esAdmin = rolActual.includes('admin') || rolActual.includes('administrador');
  const esTutor = rolActual.includes('tutor');
  const esDocente = rolActual.includes('docente');
  const esStaff = esAdmin || esDocente || esTutor;

  if (loadingSession) return null;

  return (
    <OfflineFallback>
      {!session ? (
        <LandingPage onLoginSuccess={handleLogin} />
      ) : (
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
          {/* Dashboard General */}
          {activeTab === 'dashboard' && (
            <DashboardOverviewPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'tutor-dashboard' && (
            <TutorDashboardPage setActiveTab={setActiveTab} />
          )}

          {/* HU-01: Matrícula Ágil */}
          {activeTab === 'matriculas' && (esAdmin || esTutor) && (
            <UsuariosPage />
          )}

          {/* Comunicados Institucionales */}
          {activeTab === 'comunicados' && (
            <ComunicadosPage user={session} />
          )}

          {/* Control de Asistencia */}
          {activeTab === 'asistencia' && esStaff && (
            <AsistenciaPage />
          )}

          {/* HU-07: Registro y Cierre de Simulacros */}
          {activeTab === 'registro-notas' && esStaff && (
            <RegistroNotasPage />
          )}

          {/* HU-04: Semáforo de Morosidad */}
          {activeTab === 'morosidad' && (esAdmin || esTutor) && (
            <MorosidadPage />
          )}

          {/* HU-05: Materiales y Repositorio Cloud del Alumno */}
          {activeTab === 'materiales' && (
            <PanelAlumnoPage />
          )}

          {/* Calificaciones y Cuadro de Mérito */}
          {activeTab === 'calificaciones' && (
            <CalificacionesPage 
              estudianteActivo={hijoActivo}
              listaEstudiantes={hijos}
              onCambiarEstudiante={(id) => setIdHijoSeleccionado(id)}
              onIrATutorIA={() => setActiveTab('tutor-ia')} 
            />
          )}

          {/* HU-06: Tutor Pedagógico Pre-U (Gemini) */}
          {activeTab === 'tutor-ia' && (
            <TutorIAPage estudianteActivo={hijoActivo} />
          )}

          {/* Módulo Académico */}
          {(
            activeTab === 'academico' ||
            activeTab === 'academico-ciclos' ||
            activeTab === 'academico-turnos'
          ) && esStaff && (
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

          {/* Administración y RBAC */}
          {activeTab === 'usuarios' && esAdmin && <UsuariosPage />}
          {activeTab === 'perfiles' && esAdmin && <PerfilesPage />}
          {activeTab === 'menu-options' && esAdmin && <OpcionesMenuPage />}
        </DashboardLayout>
      )}
    </OfflineFallback>
  );
}