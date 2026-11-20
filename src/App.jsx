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
import { esRetornoMercadoPago } from './services/pagosOnline.api.js';
import {
  obtenerMiIntranetAlumno,
  obtenerMiUsuario,
  guardarSesion,
  obtenerSesion,
  limpiarSesion,
} from './services/api';
import {
  esAlumno as esAlumnoRol,
  esAdmin as esAdminRol,
  esDocente as esDocenteRol,
  esTutor as esTutorRol,
  claveRol,
  grupoDeRol,
} from './utils/roles';

const leerSesionGuardada = () => {
  // La sesión vive en `acadesys_session`; `usuario` solo se admite como formato legado.
  const sesion = obtenerSesion();
  if (sesion) return sesion;

  const legado = localStorage.getItem('usuario');
  if (!legado) return null;

  try {
    const parsed = JSON.parse(legado);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Sincroniza los datos básicos del expediente con la sesión visual.
 * El expediente completo se conserva por separado en `studentData`; no se
 * introduce información académica dentro del token ni se cambia el contrato API.
 */
function crearSesionDesdeExpediente(sesion, expediente) {
  if (!sesion || !expediente || typeof expediente !== 'object') return sesion;

  const usuario = expediente.usuario || {};
  return {
    ...sesion,
    idUsuario: usuario.idUsuario ?? sesion.idUsuario,
    nombre: usuario.nombreCompleto ?? sesion.nombre,
    correo: usuario.correo ?? sesion.correo,
    dni: usuario.dni ?? sesion.dni,
    codigoUsuario: usuario.codigoUsuario ?? sesion.codigoUsuario,
    ciclo: expediente.ciclo ?? null,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('acadesys_tab') || 'dashboard',
  );
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Expediente completo del alumno devuelto por GET /api/alumno/me.
  const [studentData, setStudentData] = useState(null);
  const [studentBootstrapped, setStudentBootstrapped] = useState(false);
  const [studentDataLoading, setStudentDataLoading] = useState(false);
  const [studentDataError, setStudentDataError] = useState('');

  const revalidandoSesionRef = useRef(0);

  // Recuperar la sesión y forzar el inicio del portal del alumno en su página principal.
  useEffect(() => {
    const esEnlaceRecuperacion = (window.location.hash || '').startsWith(
      '#restablecer-password?',
    );

    if (esEnlaceRecuperacion) {
      setLoadingSession(false);
      return;
    }

    const savedUser = leerSesionGuardada();
    if (!savedUser) {
      setLoadingSession(false);
      return;
    }

    setSession(savedUser);
    setStudentData(null);
    setStudentDataError('');

    if (esAlumnoRol(savedUser)) {
      // Al volver del checkout de Culqi se abre directamente «Mis pagos».
      setActiveTab(esRetornoMercadoPago() ? 'student-pagos' : 'student-home');
      setStudentBootstrapped(false);
    } else {
      setActiveTab('dashboard');
      setStudentBootstrapped(true);
    }

    setLoadingSession(false);
  }, []);

  // Cargar una sola vez el expediente completo para alimentar todas las vistas del alumno.
  useEffect(() => {
    if (!session || !esAlumnoRol(session) || studentBootstrapped) return undefined;

    let activo = true;
    setStudentDataLoading(true);
    setStudentDataError('');

    obtenerMiIntranetAlumno()
      .then((data) => {
        if (!activo) return;

        const expediente = data && typeof data === 'object' ? data : null;
        setStudentData(expediente);

        if (expediente?.usuario) {
          const sessionActualizada = crearSesionDesdeExpediente(session, expediente);
          setSession(sessionActualizada);
          guardarSesion(sessionActualizada);
        }
      })
      .catch((error) => {
        if (!activo) return;
        setStudentDataError(
          error?.message || 'No fue posible cargar tu expediente académico.',
        );
        console.warn(
          '[Alumno] No fue posible cargar el expediente:',
          error?.message || 'Error desconocido',
        );
      })
      .finally(() => {
        if (!activo) return;
        setStudentDataLoading(false);
        setStudentBootstrapped(true);
      });

    return () => {
      activo = false;
    };
  }, [session, studentBootstrapped]);

  // Volver a consultar el endpoint con force=true al pulsar «Actualizar» en el portal.
  const refrescarExpedienteAlumno = async () => {
    if (!session || !esAlumnoRol(session)) return null;

    setStudentDataLoading(true);
    setStudentDataError('');

    try {
      const data = await obtenerMiIntranetAlumno({ force: true });
      const expediente = data && typeof data === 'object' ? data : null;
      setStudentData(expediente);

      if (expediente?.usuario) {
        const sessionActualizada = crearSesionDesdeExpediente(session, expediente);
        setSession(sessionActualizada);
        guardarSesion(sessionActualizada);
      }

      return expediente;
    } catch (error) {
      setStudentDataError(
        error?.message || 'No fue posible actualizar tu expediente académico.',
      );
      return null;
    } finally {
      setStudentDataLoading(false);
    }
  };

  // Revalidar el perfil al recuperar el foco, sin consultas periódicas constantes.
  useEffect(() => {
    if (!session) return undefined;

    const revalidarSesion = async () => {
      const ahora = Date.now();
      if (ahora - revalidandoSesionRef.current < 5000) return;
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
        const cambioRol = !idDisponibles && claveRol(rolNuevo) !== claveRol(rolActual);
        if (!cambioId && !cambioRol) return;

        const actualizada = {
          ...session,
          rol: rolNuevo || session.rol,
          Perfil: rolNuevo || session.Perfil,
          idPerfil: idNuevo ?? session.idPerfil,
        };

        setSession(actualizada);
        guardarSesion(actualizada);
        setStudentData(null);
        setStudentDataError('');

        const esAlumnoNuevo = grupoDeRol(rolNuevo) === 'alumno';
        setStudentBootstrapped(!esAlumnoNuevo);
        setStudentDataLoading(false);
        setActiveTab(esAlumnoNuevo ? 'student-home' : 'dashboard');
        localStorage.setItem(
          'acadesys_tab',
          esAlumnoNuevo ? 'student-home' : 'dashboard',
        );
      } catch {
        // Un 401 ya lo gestiona fetchWithAuth. Otros errores no cierran la sesión.
      }
    };

    window.addEventListener('focus', revalidarSesion);
    return () => window.removeEventListener('focus', revalidarSesion);
  }, [session]);

  const handleLogin = (user) => {
    setSession(user);
    setStudentData(null);
    setStudentDataError('');
    setStudentDataLoading(false);
    setStudentBootstrapped(!esAlumnoRol(user));

    const destino = esAlumnoRol(user)
      ? (esRetornoMercadoPago() ? 'student-pagos' : 'student-home')
      : 'dashboard';
    setActiveTab(destino);
    localStorage.setItem('acadesys_tab', destino);
  };

  const handleLogout = () => {
    limpiarSesion();
    localStorage.removeItem('acadesys_tab');
    setSession(null);
    setStudentData(null);
    setStudentDataError('');
    setStudentDataLoading(false);
    setStudentBootstrapped(false);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('acadesys_tab', tab);
  };

  const handleUpdateUser = (nuevoUsuario) => {
    setSession(nuevoUsuario);
    guardarSesion(nuevoUsuario);
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
          onUpdateUser={handleUpdateUser}
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
                  totalAlumnos: session?.ciclo?.totalAlumnos,
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
                expediente={studentData}
                loading={studentDataLoading || (!studentBootstrapped && !studentDataError)}
                error={studentDataError}
                onRefresh={refrescarExpedienteAlumno}
                onUpdateUser={handleUpdateUser}
              />
            )
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverviewPage setActiveTab={handleTabChange} user={session} />
              )}

              {activeTab === 'comunicados' && (
                <ComunicadosPage user={session} />
              )}

              {activeTab === 'asistencia' && esStaff && <AsistenciaPage />}
              {activeTab === 'registro-notas' && esStaff && <RegistroNotasPage />}
              {activeTab === 'morosidad' && esAdmin && <MorosidadPage />}
              {activeTab === 'calificaciones' && esStaff && <CalificacionesPage />}

              {(activeTab === 'academico' ||
                activeTab === 'academico-ciclos' ||
                activeTab === 'academico-turnos') &&
                esStaff && (
                  <AcademicoPage
                    user={session}
                    vistaInicial={
                      activeTab === 'academico-ciclos'
                        ? 'ciclos'
                        : activeTab === 'academico-turnos'
                          ? 'turnos'
                          : 'asignaciones'
                    }
                  />
                )}

              {activeTab === 'materiales-admin' && esAdmin && <AdminMaterialesPage />}
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
