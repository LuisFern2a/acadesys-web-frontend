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
import OfflineFallback from './components/OfflineFallback';
import { obtenerHijosMock } from './services/api';

const ESTUDIANTES_DEMO = [
  {
    id: 1,
    nombre: 'Luis Fernando Tóccas',
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
    nombre: 'Valeria Sofía Ramos',
    codigo: 'ACAD-2026-812',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 1,
    totalAlumnos: 36,
    promedioGeneral: 18.6,
    cursosCriticos: 0,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 19, tareas: 20, final: 18, promedio: 19.0, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 20, tareas: 19, final: 19, promedio: 19.3, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 18, tareas: 18, final: 17, promedio: 17.7, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 17, tareas: 18, final: 18, promedio: 17.7, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 19, tareas: 20, final: 19, promedio: 19.3, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  },
  {
    id: 3,
    nombre: 'Mateo Sebastián Quispe',
    codigo: 'ACAD-2026-640',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 28,
    totalAlumnos: 36,
    promedioGeneral: 11.2,
    cursosCriticos: 3,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 11, tareas: 12, final: 10, promedio: 11.0, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 14, tareas: 13, final: 12, promedio: 13.0, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 10, tareas: 11, final: 9, promedio: 10.0, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 8, tareas: 10, final: 9, promedio: 9.0, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 13, tareas: 14, final: 12, promedio: 13.0, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  },
  {
    id: 4,
    nombre: 'Camila Alejandra Torres',
    codigo: 'ACAD-2026-905',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 5,
    totalAlumnos: 36,
    promedioGeneral: 16.4,
    cursosCriticos: 0,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 17, tareas: 18, final: 16, promedio: 17.0, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 16, tareas: 17, final: 16, promedio: 16.3, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 15, tareas: 16, final: 16, promedio: 15.7, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 14, tareas: 16, final: 15, promedio: 15.0, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 18, tareas: 19, final: 17, promedio: 18.0, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  },
  {
    id: 5,
    nombre: 'Diego Alonso Navarro',
    codigo: 'ACAD-2026-512',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 19,
    totalAlumnos: 36,
    promedioGeneral: 13.5,
    cursosCriticos: 2,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 12, tareas: 14, final: 11, promedio: 12.3, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 15, tareas: 16, final: 15, promedio: 15.3, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 14, tareas: 15, final: 13, promedio: 14.0, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 10, tareas: 11, final: 11, promedio: 10.7, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 15, tareas: 16, final: 15, promedio: 15.3, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  },
  {
    id: 6,
    nombre: 'Andrea Lucía Paredes',
    codigo: 'ACAD-2026-789',
    aula: '5to de Secundaria - Aula 101 UNI',
    puestoRanking: 2,
    totalAlumnos: 36,
    promedioGeneral: 17.8,
    cursosCriticos: 0,
    cursos: [
      { id: 1, nombre: 'Álgebra Superior', docente: 'Prof. Carlos Mendoza', parcial: 18, tareas: 19, final: 18, promedio: 18.3, materialPdf: 'Silabo_Algebra_Bimestre2.pdf', pesoMb: '1.4 MB' },
      { id: 2, nombre: 'Razonamiento Matemático', docente: 'Prof. Dante Quispe', parcial: 18, tareas: 18, final: 19, promedio: 18.3, materialPdf: 'Guia_Ejercicios_RM_Semana8.pdf', pesoMb: '2.1 MB' },
      { id: 3, nombre: 'Geometría del Espacio', docente: 'Prof. Juan David Peralta', parcial: 16, tareas: 17, final: 17, promedio: 16.7, materialPdf: 'Formulario_Geometria_Espacio.pdf', pesoMb: '980 KB' },
      { id: 4, nombre: 'Física y Cinemática', docente: 'Prof. María Flores', parcial: 16, tareas: 17, final: 18, promedio: 17.0, materialPdf: 'Problemas_Resueltos_Cinematica.pdf', pesoMb: '3.5 MB' },
      { id: 5, nombre: 'Química Orgánica', docente: 'Prof. Rosaura Benítez', parcial: 18, tareas: 19, final: 19, promedio: 18.7, materialPdf: 'Tabla_Compuestos_Organicos.pdf', pesoMb: '1.8 MB' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [hijos, setHijos] = useState(ESTUDIANTES_DEMO);
  const [idHijoSeleccionado, setIdHijoSeleccionado] = useState(1);

  useEffect(() => {
    obtenerHijosMock()
      .then((data) => {
        const datosApi = data || [];
        // Combinamos los alumnos que trae la API (evitando duplicados por nombre o ID)
        const listaCombinada = [
          ...datosApi,
          ...ESTUDIANTES_DEMO.filter(
            (demo) => !datosApi.some((d) => d.id === demo.id || d.nombre.toLowerCase() === demo.nombre.toLowerCase())
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

  const hijoActivo = hijos.find((h) => h.id === idHijoSeleccionado) || hijos[0] || null;
  const rolActual = (session?.rol || session?.Perfil || 'Administrador').toLowerCase();
  const esAdmin = rolActual.includes('admin');
  const esDocenteOAdmin = esAdmin || rolActual.includes('docente');

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
              listaEstudiantes={hijos}
              onCambiarEstudiante={(id) => setIdHijoSeleccionado(id)}
              onIrATutorIA={() => setActiveTab('tutor-ia')} 
            />
          )}
          {activeTab === 'tutor-ia' && (
            <TutorIAPage 
              estudianteActivo={hijoActivo} 
            />
          )}

          {activeTab === 'academico' && esDocenteOAdmin && <AcademicoPage />}
          {activeTab === 'usuarios' && esAdmin && <UsuariosPage />}
          {activeTab === 'perfiles' && esAdmin && <PerfilesPage />}
          {activeTab === 'menu-options' && esAdmin && <OpcionesMenuPage />}
        </DashboardLayout>
      )}
    </OfflineFallback>
  );
}