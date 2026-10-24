import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { CalendarDays, GraduationCap, Loader2, RefreshCcw } from 'lucide-react';
import { obtenerCiclosPublicos, procesarCheckoutMatricula } from '../services/api';

function formatearFecha(valor) {
  if (!valor) return 'Por confirmar';
  const texto = String(valor).slice(0, 10);
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 'Por confirmar';
  const fecha = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (fecha.getFullYear() !== Number(match[1]) || fecha.getMonth() !== Number(match[2]) - 1 || fecha.getDate() !== Number(match[3])) {
    return 'Por confirmar';
  }
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function cicloNoFinalizado(ciclo) {
  if (!ciclo?.fechaFin) return true;
  const texto = String(ciclo.fechaFin).slice(0, 10);
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const fin = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
  if (fin.getFullYear() !== Number(match[1]) || fin.getMonth() !== Number(match[2]) - 1 || fin.getDate() !== Number(match[3])) return false;
  return fin >= new Date();
}

/**
 * Reinscripción autenticada del alumno actual. La API vuelve a comprobar
 * identidad, rol, academia, estado, precio, vacantes y matrícula duplicada.
 */
export default function PanelReinscripcionAlumno({ user, estudiante, cicloActual, onUpdated }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [error, setError] = useState('');

  const identidad = useMemo(() => {
    const nombres = String(estudiante?.nombres ?? estudiante?.Nombres ?? user?.nombres ?? '').trim();
    const paterno = String(estudiante?.apellidoPaterno ?? estudiante?.ApellidoPaterno ?? user?.apellidoPaterno ?? '').trim();
    const materno = String(estudiante?.apellidoMaterno ?? estudiante?.ApellidoMaterno ?? user?.apellidoMaterno ?? '').trim();
    const apellidos = [paterno, materno].filter(Boolean).join(' ').trim();
    const correo = String(estudiante?.correo ?? estudiante?.CorreoElectronico ?? user?.correo ?? '').trim().toLowerCase();
    return { nombres, apellidos, correo };
  }, [estudiante, user]);

  const idCicloActual = Number(cicloActual?.idCiclo ?? cicloActual?.IdCiclo ?? 0);
  const ciclosDisponibles = ciclos.filter((ciclo) => {
    if (!Number.isSafeInteger(Number(ciclo.idCiclo)) || Number(ciclo.idCiclo) <= 0) return false;
    if (Number(ciclo.idCiclo) === idCicloActual) return false;
    if (Number(ciclo.estadoRegistro) !== 1) return false;
    if (ciclo.vacantesDisponibles !== null && Number(ciclo.vacantesDisponibles) <= 0) return false;
    return cicloNoFinalizado(ciclo);
  });

  const cargarCiclos = async () => {
    setAbierto(true);
    setCargando(true);
    setError('');
    try {
      const resultado = await obtenerCiclosPublicos();
      setCiclos(Array.isArray(resultado) ? resultado : []);
    } catch (err) {
      setCiclos([]);
      setError(err.message || 'No se pudo consultar la oferta de ciclos.');
    } finally {
      setCargando(false);
    }
  };

  const reinscribirse = async (ciclo) => {
    if (procesandoId !== null) return;

    if (identidad.nombres.length < 2 || identidad.apellidos.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identidad.correo)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Revisa los datos de tu perfil',
        text: 'No se pudo obtener tu nombre, apellido o correo registrado. Actualiza tu perfil o contacta a la administración; no se enviará una matrícula con datos incompletos.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const precioValido = ciclo.precio !== null && ciclo.precio !== undefined && String(ciclo.precio).trim() !== '' && Number.isFinite(Number(ciclo.precio)) && Number(ciclo.precio) >= 0;
    if (!precioValido) {
      await Swal.fire({
        icon: 'warning',
        title: 'Precio pendiente de configuración',
        text: 'Este ciclo todavía no tiene un precio válido publicado. La matrícula no se enviará.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: 'Confirmar reinscripción',
      html: `<p>¿Deseas matricularte en <strong>${String(ciclo.nombre || 'el ciclo seleccionado').replace(/[&<>"']/g, '')}</strong>?</p><p style="margin-top:10px">Precio registrado: <strong>S/ ${Number(ciclo.precio).toFixed(2)}</strong></p><p style="margin-top:10px;color:#64748b;font-size:13px">Modo demostración: no se realizará un cobro real. El pago quedará pendiente.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar reinscripción',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0D9488',
    });
    if (!confirmacion.isConfirmed) return;

    setProcesandoId(Number(ciclo.idCiclo));
    setError('');
    try {
      const resultado = await procesarCheckoutMatricula({
        idCiclo: Number(ciclo.idCiclo),
        nombres: identidad.nombres,
        apellidos: identidad.apellidos,
        correo: identidad.correo,
        prefijoCiclo: ciclo.prefijo || null,
        monto: Number(ciclo.precio),
      });

      const correoEnviado = resultado?.correo?.estado === 'enviado';
      await Swal.fire({
        icon: correoEnviado ? 'success' : 'warning',
        title: correoEnviado ? 'Reinscripción registrada' : 'Reinscripción registrada; correo pendiente',
        text: correoEnviado
          ? 'La reinscripción quedó registrada. El pago sigue pendiente y es simulado; no se hizo ningún cobro. Se confirmó el envío de las instrucciones por correo.'
          : 'La reinscripción quedó registrada, pero no se pudo confirmar el envío del correo. El pago sigue pendiente y no se hizo ningún cobro. No vuelvas a enviar el formulario; contacta a la academia.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0D9488',
      });

      if (typeof onUpdated === 'function') {
        try { await onUpdated(); } catch { /* La matrícula ya fue confirmada: no afirmar que falló. */ }
      }
      setAbierto(false);
    } catch (err) {
      const codigo = err?.data?.code;
      let mensaje = err?.message || 'No se pudo completar la reinscripción.';
      if (codigo === 'REINSCRIPCION_REQUIERE_SESION' || err?.status === 401) {
        mensaje = 'La sesión ya no es válida. Cierra sesión, vuelve a entrar y repite el proceso desde tu panel.';
      } else if (codigo === 'CICLO_SIN_VACANTES') {
        mensaje = 'El ciclo acaba de alcanzar su capacidad máxima. Actualiza la oferta y selecciona otro ciclo.';
      } else if (codigo === 'CICLO_PRECIO_NO_CONFIGURADO') {
        mensaje = 'El ciclo no tiene un precio válido configurado. La matrícula fue rechazada; contacta a la academia.';
      } else if (codigo === 'CORREO_NO_CONFIGURADO') {
        mensaje = 'El servicio de correo no está configurado. No se registró la matrícula. Contacta a la administración.';
      }
      await Swal.fire({ icon: 'error', title: 'No se pudo reinscribir', text: mensaje, confirmButtonText: 'Entendido' });
      // Refrescar el catálogo porque el servidor pudo rechazarlo por cambio de estado/capacidad.
      try { setCiclos(await obtenerCiclosPublicos()); } catch { /* Mantener catálogo existente y mostrar el error real. */ }
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-teal-100 bg-teal-50 p-2 text-teal-700">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Otros ciclos disponibles</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Consulta la oferta publicada por la academia y reinscríbete con tu cuenta. El servidor valida de nuevo el precio, las vacantes y los permisos.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={abierto ? () => { setAbierto(false); setError(''); } : cargarCiclos}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          disabled={cargando || procesandoId !== null}
        >
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarDays className="h-4 w-4" aria-hidden="true" />}
          {abierto ? 'Ocultar ciclos' : 'Ver ciclos disponibles'}
        </button>
      </div>

      {abierto && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {cargando ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Consultando ciclos publicados…</div>
          ) : ciclosDisponibles.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No hay otros ciclos publicados con vacantes disponibles. Esta pantalla no crea ciclos ni inventa precios.
              <button type="button" onClick={cargarCiclos} className="ml-2 inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"><RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Actualizar</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {ciclosDisponibles.map((ciclo) => (
                <article key={ciclo.idCiclo} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">{ciclo.nombre}</h3>
                      <p className="mt-1 text-xs text-slate-500">{ciclo.universidadObjetivo || 'Preuniversitario'} · {ciclo.turno || 'Turno por confirmar'}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-teal-50 px-2 py-1 text-sm font-bold text-teal-800">S/ {Number(ciclo.precio).toFixed(2)}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Inicio: {formatearFecha(ciclo.fechaInicio)} · Fin: {formatearFecha(ciclo.fechaFin)}</p>
                  <p className="mt-1 text-xs text-slate-500">{ciclo.vacantesDisponibles === null ? 'Vacantes sin límite configurado' : `${ciclo.vacantesDisponibles} vacantes disponibles`}</p>
                  <button
                    type="button"
                    onClick={() => reinscribirse(ciclo)}
                    disabled={procesandoId !== null}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {procesandoId === Number(ciclo.idCiclo) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Reinscribirme en este ciclo
                  </button>
                </article>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Importante: el pago se mantiene pendiente en modo demostración. No hay una pasarela de pago real conectada y esta acción no confirma un cobro.</p>
        </div>
      )}
    </section>
  );
}
