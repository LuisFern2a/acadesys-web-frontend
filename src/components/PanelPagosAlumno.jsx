
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BotonPagoOnline from './BotonPagoOnline.jsx';
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert
} from 'lucide-react';
import { iniciarPagoAlumno, mensajeErrorApi, obtenerMisPagos, registrarComprobanteAlumno } from '../services/api';
import { conciliarPagoAlumno, consultarEstadoPagoAlumno, idPagoDesdeReferencia } from '../services/pagosOnline.api.js';

// Tras volver de Mercado Pago se verifica la cuota con el backend durante ~1 min.
const INTENTOS_VERIFICACION_RETORNO = 6;
const ESPERA_VERIFICACION_RETORNO_MS = 10000;

// Si la conciliación no está disponible (pasarela apagada, consulta reciente o
// proveedor caído) se lee el estado guardado: nunca se inventa un resultado.
const consultarConConciliacion = async (idPago) => {
  try {
    return await conciliarPagoAlumno(idPago);
  } catch (error) {
    if ([429, 502, 503].includes(Number(error?.status))) return consultarEstadoPagoAlumno(idPago);
    throw error;
  }
};

const dinero = (valor) => {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '—';
  return `S/ ${numero.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fecha = (valor) => {
  if (!valor) return '—';
  const valorCorto = String(valor).slice(0, 10);
  const partes = valorCorto.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valorCorto;
};

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'revision', label: 'En revisión' },
  { id: 'pagadas', label: 'Pagadas' }
];

// Mensaje para el alumno: nunca se muestran rutas internas ni detalles del servidor.
const mensajeParaAlumno = (error, porDefecto) => {
  if (Number(error?.status) === 409) {
    return error.message || 'Ya existe una referencia registrada para esta cuota. Actualiza la lista para revisar su estado.';
  }
  return mensajeErrorApi(error, porDefecto);
};

const ESTILOS_ESTADO = {
  PAGADO: { clase: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icono: CheckCircle2 },
  EN_REVISION: { clase: 'border-sky-200 bg-sky-50 text-sky-700', Icono: Clock3 },
  MOROSO: { clase: 'border-rose-200 bg-rose-50 text-rose-700', Icono: ShieldAlert },
  VENCIDO: { clase: 'border-rose-200 bg-rose-50 text-rose-700', Icono: ShieldAlert }
};

const estiloEstado = (cuota) => {
  if (cuota?.pagado) return { clave: 'PAGADO', etiqueta: 'Pagado', ...ESTILOS_ESTADO.PAGADO };
  if (cuota?.enRevision) return { clave: 'EN_REVISION', etiqueta: 'En revisión', ...ESTILOS_ESTADO.EN_REVISION };
  const clave = cuota?.estadoClave || 'PENDIENTE';
  if (ESTILOS_ESTADO[clave]) return { clave, etiqueta: cuota?.estado || 'Pendiente', ...ESTILOS_ESTADO[clave] };
  return { clave, etiqueta: cuota?.estado || 'Pendiente', clase: 'border-amber-200 bg-amber-50 text-amber-800', Icono: CalendarClock };
};

// Instrucciones de transferencia: se aceptan camelCase y PascalCase, igual que
// el resto del contrato. Si el backend no las habilita, no se muestran datos
// bancarios ni se permite registrar la referencia.
const normalizarInstruccionesPago = (data = {}) => {
  const banco = data?.instrucciones ?? data?.Instrucciones ?? {};
  return {
    instruccionesDisponibles: Boolean(data?.instruccionesDisponibles ?? data?.InstruccionesDisponibles),
    mensaje: data?.mensaje ?? data?.message ?? data?.Mensaje ?? '',
    instrucciones: {
      entidad: banco?.entidad ?? banco?.Entidad ?? '',
      titular: banco?.titular ?? banco?.Titular ?? '',
      cuenta: banco?.cuenta ?? banco?.Cuenta ?? banco?.numeroCuenta ?? banco?.NumeroCuenta ?? '',
      cci: banco?.cci ?? banco?.CCI ?? '',
      instrucciones: banco?.instrucciones ?? banco?.Instrucciones ?? ''
    }
  };
};

// Interpreta la respuesta de estado del backend sin confirmar nada por su
// cuenta: solo describe lo que el servidor tiene registrado. La cuota sigue
// siendo la única fuente de verdad y se refresca con la lista.
const mensajeEstadoPago = (data = {}) => {
  const estadoCuota = String(data?.estadoPago || '').trim() || 'no disponible';
  const transaccion = data?.transaccion ? data.transaccion : null;
  if (!transaccion) {
    return {
      tipo: 'aviso',
      texto: `No hay una transacción de pago online registrada para esta cuota. Estado actual: ${estadoCuota}.`
    };
  }

  const estadoTransaccion = String(transaccion?.estado || '').trim() || 'PENDIENTE';
  const proveedorTexto = String(transaccion?.proveedor || '').trim().toUpperCase() === 'CULQI'
    ? 'Culqi'
    : 'el intento histórico con la pasarela anterior';
  const clave = estadoTransaccion.toUpperCase();
  if (clave === 'APROBADA' || estadoCuota.toLowerCase() === 'pagado') {
    return {
      tipo: 'exito',
      texto: `El servidor reporta la transacción como ${estadoTransaccion} y la cuota como ${estadoCuota}. La lista se actualizó con ese estado.`
    };
  }
  if (clave === 'EXPIRADA') {
    return {
      tipo: 'aviso',
      texto: `El enlace de pago anterior venció. La cuota sigue en estado ${estadoCuota}; puedes iniciar el pago online nuevamente.`
    };
  }
  if (['RECHAZADA', 'CANCELADA', 'REEMBOLSADA', 'CONTRACARGO'].includes(clave)) {
    return {
      tipo: 'error',
      texto: `${proveedorTexto} reportó la transacción como ${estadoTransaccion}. La cuota sigue en estado ${estadoCuota}. Puedes reintentar el pago online o usar la transferencia manual.`
    };
  }
  return {
    tipo: 'aviso',
    texto: `La transacción sigue en estado ${estadoTransaccion} y la cuota en ${estadoCuota}. La confirmación depende del backend; vuelve a consultar más tarde.`
  };
};

export default function PanelPagosAlumno() {
  const [cuotas, setCuotas] = useState([]);
  const [resumen, setResumen] = useState({});
  const [instrucciones, setInstrucciones] = useState({});
  const [referencias, setReferencias] = useState({});
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [filtro, setFiltro] = useState('todas');

  // Evita respuestas obsoletas si se recarga mientras hay una petición en vuelo.
  const secuenciaRef = useRef(0);
  const montadoRef = useRef(true);
  // Bloqueo síncrono: `accion` (estado) no alcanza para dos clics en el mismo tick.
  const envioEnCursoRef = useRef(false);
  const temporizadorRetornoRef = useRef(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      clearTimeout(temporizadorRetornoRef.current);
    };
  }, []);

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    const secuencia = ++secuenciaRef.current;
    if (!silencioso) setCargando(true);
    try {
      const data = await obtenerMisPagos();
      if (!montadoRef.current || secuencia !== secuenciaRef.current) return;
      setCuotas(Array.isArray(data.cuotas) ? data.cuotas : []);
      setResumen(data.resumen || {});
      setMensaje((actual) => (actual?.origen === 'redirect' ? actual : null));
    } catch (error) {
      if (!montadoRef.current || secuencia !== secuenciaRef.current) return;
      setMensaje({ tipo: 'error', texto: mensajeParaAlumno(error, 'No se pudieron consultar tus cuotas. Vuelve a intentarlo en unos segundos.') });
    } finally {
      if (montadoRef.current && secuencia === secuenciaRef.current) setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
<<<<<<< HEAD

  // Verificación tras el regreso de Mercado Pago. El parámetro `status` solo
  // decide el aviso inicial; el resultado final siempre viene del backend.
  const verificarRetorno = useCallback((idPago) => {
    const paso = async (intento) => {
      if (!montadoRef.current) return;
      try {
        // Conciliación activa al inicio y a los 30 s; entre medio, lectura simple.
        const data = intento % 3 === 0
          ? await consultarConConciliacion(idPago)
          : await consultarEstadoPagoAlumno(idPago);
        if (!montadoRef.current) return;
        const estadoCuota = String(data?.estadoPago || '').toLowerCase();
        const estadoTx = String(data?.transaccion?.estado || '').toUpperCase();
        if (estadoCuota === 'pagado') {
          await cargar({ silencioso: true });
          if (montadoRef.current) setMensaje({ tipo: 'exito', texto: 'Pago confirmado. Tu cuota figura como pagada.' });
          return;
        }
        if (['RECHAZADA', 'CANCELADA'].includes(estadoTx)) {
          await cargar({ silencioso: true });
          if (montadoRef.current) setMensaje(mensajeEstadoPago(data));
          return;
        }
      } catch {
        // Un error puntual no interrumpe los reintentos; el último aviso lo explica.
      }
      if (!montadoRef.current) return;
      if (intento + 1 >= INTENTOS_VERIFICACION_RETORNO) {
        setMensaje({
          tipo: 'aviso',
          texto: 'Todavía no recibimos la confirmación de Mercado Pago. Si ya pagaste, usa «Consultar estado del pago» en unos minutos; no vuelvas a pagar la misma cuota.'
        });
        return;
      }
      temporizadorRetornoRef.current = setTimeout(
        () => paso(intento + 1),
        ESPERA_VERIFICACION_RETORNO_MS
      );
    };
    return paso(0);
  }, [cargar]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status') || params.get('collection_status');
    const idPagoRetorno = idPagoDesdeReferencia(params.get('external_reference'));

    if (status || idPagoRetorno) {
      if (status === 'approved') {
        setMensaje({
          tipo: 'aviso',
          texto: 'Mercado Pago informó que recibió tu pago. Estamos confirmándolo con la academia; la cuota se marcará como pagada solo cuando el servidor lo verifique.',
          origen: 'redirect'
        });
      } else if (status === 'pending' || status === 'in_process') {
        setMensaje({
          tipo: 'aviso',
          texto: 'Tu pago está en proceso de validación por Mercado Pago. Te mostraremos el resultado cuando se confirme.',
          origen: 'redirect'
        });
      } else if (status === 'rejected' || status === 'null') {
        setMensaje({
          tipo: 'error',
          texto: 'El pago no se pudo completar o fue rechazado por la pasarela. Puedes intentarlo nuevamente.',
          origen: 'redirect'
        });
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      if (idPagoRetorno && status !== 'rejected' && status !== 'null') verificarRetorno(idPagoRetorno);
    }
  }, [verificarRetorno]);

=======
>>>>>>> 3b0557a (feat(payments): integrate Culqi payment gateway and webhook)
  const consultarInstrucciones = async (idPago) => {
    if (envioEnCursoRef.current) return;
    envioEnCursoRef.current = true;
    setAccion(`iniciar-${idPago}`);
    setMensaje(null);
    try {
      const data = await iniciarPagoAlumno(idPago);
      if (!montadoRef.current) return;
      const normalizado = normalizarInstruccionesPago(data);
      setInstrucciones((actual) => ({ ...actual, [idPago]: normalizado }));
      if (normalizado.instruccionesDisponibles) {
        setMensaje({ tipo: 'exito', texto: 'Consulta las instrucciones oficiales y registra la referencia después de efectuar la transferencia.' });
      } else {
        setMensaje({ tipo: 'aviso', texto: normalizado.mensaje || 'La academia aún no tiene datos de transferencia configurados. No envíes dinero hasta confirmarlos con administración.' });
      }
    } catch (error) {
      if (montadoRef.current) setMensaje({ tipo: 'error', texto: mensajeParaAlumno(error, 'No se pudieron consultar las instrucciones de pago.') });
    } finally {
      envioEnCursoRef.current = false;
      if (montadoRef.current) setAccion(null);
    }
  };

  const consultarEstado = async (idPago) => {
    if (envioEnCursoRef.current) return;
    envioEnCursoRef.current = true;
    setAccion(`estado-${idPago}`);
    setMensaje(null);
    try {
      const data = await consultarConConciliacion(idPago);
      if (!montadoRef.current) return;
      const aviso = mensajeEstadoPago(data);
      // Se refresca la lista para que la tarjeta muestre el estado real del
      // servidor (pagada, en revisión o pendiente), sin tocar el pago.
      await cargar({ silencioso: true });
      if (!montadoRef.current) return;
      setMensaje(aviso);
    } catch (error) {
      if (montadoRef.current) setMensaje({ tipo: 'error', texto: mensajeParaAlumno(error, 'No se pudo consultar el estado del pago.') });
    } finally {
      envioEnCursoRef.current = false;
      if (montadoRef.current) setAccion(null);
    }
  };

  const refrescarTrasConflicto = async (error) => {
    await cargar({ silencioso: true });
    if (!montadoRef.current) return;
    setMensaje({ tipo: 'aviso', texto: mensajeParaAlumno(error, 'La cuota cambió de estado. Se actualizó la información.') });
  };

  // Tras cerrar Culqi, consultar el estado desde el backend durante un periodo
  // breve. Nunca se toma el callback del navegador como confirmación de pago.
  const reconciliarTrasCheckout = async ({ idPago } = {}) => {
    const id = Number(idPago);
    if (!Number.isSafeInteger(id) || id <= 0 || envioEnCursoRef.current) return;
    envioEnCursoRef.current = true;
    setAccion(`conciliar-${id}`);
    try {
      let ultimoEstado = null;
      for (let intento = 0; intento < 4; intento += 1) {
        if (intento > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 2500));
        }
        const data = await consultarEstadoPagoAlumno(id);
        ultimoEstado = data;
        await cargar({ silencioso: true });
        if (!montadoRef.current) return;

        if (String(data?.estadoPago || '').trim().toLowerCase() === 'pagado') {
          setMensaje({ tipo: 'exito', texto: 'Culqi confirmó el pago y AcadeSys actualizó esta cuota.' });
          return;
        }
        const estadoTx = String(data?.transaccion?.estado || '').trim().toUpperCase();
        if (['EXPIRADA', 'CANCELADA'].includes(estadoTx)) {
          setMensaje({ tipo: 'error', texto: `La orden Culqi quedó ${estadoTx.toLowerCase()}. Puedes volver a iniciar el pago o usar la transferencia manual.` });
          return;
        }
      }

      const estadoTx = String(ultimoEstado?.transaccion?.estado || 'PENDIENTE').trim();
      setMensaje({
        tipo: 'aviso',
        texto: `Culqi aún no ha confirmado el pago. La transacción continúa como ${estadoTx} y la cuota no se marcará como pagada hasta verificarla. Usa «Consultar estado del pago» más tarde; no repitas el pago si ya completaste el QR.`,
      });
    } catch (error) {
      if (montadoRef.current) {
        setMensaje({ tipo: 'aviso', texto: mensajeParaAlumno(error, 'No se pudo conciliar automáticamente el pago. Usa «Consultar estado del pago» para volver a intentarlo.') });
      }
    } finally {
      envioEnCursoRef.current = false;
      if (montadoRef.current) setAccion(null);
    }
  };

  const enviarReferencia = async (idPago, event) => {
    event.preventDefault();
    if (envioEnCursoRef.current) return;
    const referencia = String(referencias[idPago] || '').trim();
    if (referencia.length < 4 || referencia.length > 120) {
      setMensaje({ tipo: 'error', texto: 'La referencia debe contener entre 4 y 120 caracteres.' });
      return;
    }
    if (!window.confirm('Confirma que ya realizaste la transferencia y que esta referencia corresponde al pago.')) return;

    envioEnCursoRef.current = true;
    setAccion(`referencia-${idPago}`);
    setMensaje(null);
    try {
      const resultado = await registrarComprobanteAlumno(idPago, { referencia });
      if (!montadoRef.current) return;
      setReferencias((actual) => ({ ...actual, [idPago]: '' }));
      await cargar({ silencioso: true });
      if (!montadoRef.current) return;
      setMensaje({ tipo: 'exito', texto: resultado.mensaje || 'Referencia enviada a revisión. La cuota no se marcará como pagada hasta su aprobación.' });
    } catch (error) {
      // 409: otra pestaña (o un reintento) ya registró la referencia. Se recarga
      // para mostrar el estado real en lugar de dejar la cuota como pendiente.
      if (Number(error?.status) === 409 && montadoRef.current) await cargar({ silencioso: true });
      if (montadoRef.current) setMensaje({ tipo: 'error', texto: mensajeParaAlumno(error, 'No se pudo registrar la referencia.') });
    } finally {
      envioEnCursoRef.current = false;
      if (montadoRef.current) setAccion(null);
    }
  };

  const totalPendiente = Number(resumen.montoPendiente || 0);
  const totalPagado = Number(resumen.montoPagado || 0);
  const enRevision = Number(resumen.cantidadEnRevision || 0);
  const proximoVencimiento = resumen.proximoVencimiento || null;

  const conteos = useMemo(() => ({
    todas: cuotas.length,
    pendientes: cuotas.filter((c) => !c.pagado && !c.enRevision).length,
    revision: cuotas.filter((c) => c.enRevision).length,
    pagadas: cuotas.filter((c) => c.pagado).length
  }), [cuotas]);

  const cuotasFiltradas = useMemo(() => cuotas.filter((cuota) => {
    if (filtro === 'pagadas') return cuota.pagado;
    if (filtro === 'revision') return cuota.enRevision;
    if (filtro === 'pendientes') return !cuota.pagado && !cuota.enRevision;
    return true;
  }), [cuotas, filtro]);

  const ocupado = accion !== null;
  const sinCuotas = !cargando && cuotas.length === 0;
  const errorSinDatos = sinCuotas && mensaje?.tipo === 'error';

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 text-slate-900 md:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700"><CreditCard className="h-4 w-4" aria-hidden="true"/> Finanzas del alumno</span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mis pagos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Consulta tus cuotas, paga online con Culqi cuando el importe admite QR o registra la referencia de tu transferencia para revisión de la academia.</p>
        </div>
        <button type="button" onClick={() => cargar()} disabled={cargando || ocupado} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true"/> Actualizar</button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold">Pago online con Culqi y transferencia manual.</p>
        <p className="mt-1 text-xs leading-relaxed">El QR de billeteras móviles permite pagos de S/ 6.00 a S/ 500.00 en soles. Después de pagar, AcadeSys consulta y verifica el estado con Culqi; el retorno del checkout por sí solo nunca confirma una cuota. Para importes fuera del rango QR, utiliza el medio manual habilitado por la academia mientras se habilita otro medio online compatible. Este formulario no sube el archivo del comprobante.</p>
      </div>

      <div aria-live="polite">
        {mensaje && !errorSinDatos && (
          <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : mensaje.tipo === 'aviso' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>
            <span>{mensaje.texto}</span>
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={cargando}>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total pendiente</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{cargando ? '…' : dinero(totalPendiente)}</p>
          <p className="mt-1 text-xs text-slate-500">{cargando ? ' ' : `${conteos.pendientes} cuota(s) por pagar`}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total pagado</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{cargando ? '…' : dinero(totalPagado)}</p>
          <p className="mt-1 text-xs text-slate-500">{cargando ? ' ' : `${conteos.pagadas} cuota(s) confirmada(s)`}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cuotas en revisión</p>
          <p className="mt-2 text-2xl font-bold text-sky-700">{cargando ? '…' : enRevision}</p>
          <p className="mt-1 text-xs text-slate-500">Pendientes de aprobación</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Próximo vencimiento</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cargando ? '…' : fecha(proximoVencimiento)}</p>
          <p className="mt-1 text-xs text-slate-500">{proximoVencimiento ? 'De tu cuota pendiente más cercana' : 'Sin vencimientos pendientes'}</p>
        </div>
      </section>

      {cargando ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500" role="status">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-teal-700" aria-hidden="true"/>
          Cargando tus cuotas...
        </div>
      ) : errorSinDatos ? (
        <div className="rounded-xl border border-rose-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true"/>
          <p className="mt-3 font-bold">No pudimos cargar tus cuotas</p>
          <p className="mt-1 text-sm text-slate-500">{mensaje?.texto}</p>
          <button type="button" onClick={() => cargar()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800"><RefreshCw className="h-4 w-4" aria-hidden="true"/> Reintentar</button>
        </div>
      ) : sinCuotas ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Banknote className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true"/>
          <p className="mt-3 font-bold">Todavía no tienes cuotas registradas.</p>
          <p className="mt-1 text-sm text-slate-500">Comunícate con administración para validar tu matrícula y generar los conceptos de pago correspondientes.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar cuotas por estado">
            {FILTROS.map((opcion) => (
              <button key={opcion.id} type="button" onClick={() => setFiltro(opcion.id)} aria-pressed={filtro === opcion.id} disabled={ocupado} className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${filtro === opcion.id ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                {opcion.label}
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${filtro === opcion.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{conteos[opcion.id]}</span>
              </button>
            ))}
          </div>

          {cuotasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <Banknote className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true"/>
              <p className="mt-3 font-bold">No hay cuotas en este estado.</p>
              <p className="mt-1 text-sm text-slate-500">Cambia el filtro para ver el resto de tus cuotas.</p>
            </div>
          ) : (
            <section className="space-y-4">
              {cuotasFiltradas.map((cuota, indice) => {
                const id = Number(cuota.idPago);
                const idValido = Number.isSafeInteger(id) && id > 0;
                const estado = estiloEstado(cuota);
                const IconoEstado = estado.Icono;
                const comprobante = cuota.comprobante;
                const instruccion = instrucciones[id];
                const montoNumero = cuota.monto === null || cuota.monto === undefined || cuota.monto === ''
                  ? NaN
                  : Number(cuota.monto);
                const montoCentimosQR = Number.isFinite(montoNumero)
                  ? Math.round((montoNumero + Number.EPSILON) * 100)
                  : null;
                const qrDisponible = Number.isSafeInteger(montoCentimosQR)
                  && montoCentimosQR >= 600 && montoCentimosQR <= 50000;
                const bloqueada = ocupado || !idValido;
                return (
                  <article key={`${cuota.idPago ?? 'sin-id'}-${indice}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{cuota.concepto || 'Cuota'}</span>
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold ${estado.clase}`}>
                            <IconoEstado className="h-3.5 w-3.5" aria-hidden="true"/>
                            {estado.etiqueta}
                          </span>
                        </div>
                        <h2 className="mt-3 text-base font-bold">{cuota.ciclo || 'Ciclo académico'}</h2>
                        <p className="mt-1 text-sm text-slate-500">Periodo: {cuota.periodo || '—'}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarClock className="h-4 w-4" aria-hidden="true"/> Vencimiento: {fecha(cuota.fechaVencimiento)}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Importe de la cuota</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{dinero(cuota.monto)}</p>
                        {cuota.monto === null && <p className="mt-1 text-xs text-rose-700">El monto no está disponible. No transfieras sin confirmarlo con administración.</p>}
                        {cuota.pagado && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="h-4 w-4" aria-hidden="true"/> Confirmado {fecha(cuota.fechaPago)}</p>}
                      </div>
                    </div>

                    {comprobante && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                        <p className="font-bold text-slate-700">Referencia registrada: <span className="font-normal">{comprobante.referencia || '—'}</span></p>
                        {comprobante.motivoRevision && <p className="mt-1 text-rose-700">Observación de administración: {comprobante.motivoRevision}</p>}
                      </div>
                    )}

                    {!cuota.pagado && !cuota.enRevision && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        
                        {qrDisponible ? (
                          <BotonPagoOnline
                            idPago={id}
                            disabled={bloqueada}
                            onBusyChange={(ocupadoOnline) => {
                              envioEnCursoRef.current = ocupadoOnline;
                              setAccion(ocupadoOnline ? `checkout-${id}` : null);
                            }}
                            onConflicto={refrescarTrasConflicto}
                            onCheckoutOrder={reconciliarTrasCheckout}
                          />
                        ) : (
                          <p className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                            El pago QR con billeteras Culqi admite importes de S/ 6.00 a S/ 500.00. Para esta cuota, utiliza la transferencia manual habilitada por la academia mientras se implementa otro medio online compatible.
                          </p>
                        )}
{!idValido ? (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Esta cuota no tiene un identificador válido. Comunícate con administración para regularizarla.</p>
                        ) : !instruccion ? (
                          <button type="button" onClick={() => consultarInstrucciones(id)} disabled={bloqueada} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                            {accion === `iniciar-${id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/> : <Banknote className="h-4 w-4" aria-hidden="true"/>}
                            Ver instrucciones de pago
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-bold text-slate-800">Instrucciones de transferencia</p>
                              {instruccion.instruccionesDisponibles ? (
                                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                  <div><dt className="text-xs text-slate-500">Banco / entidad</dt><dd className="font-semibold">{instruccion.instrucciones?.entidad || '—'}</dd></div>
                                  <div><dt className="text-xs text-slate-500">Titular</dt><dd className="font-semibold">{instruccion.instrucciones?.titular || '—'}</dd></div>
                                  <div><dt className="text-xs text-slate-500">Cuenta</dt><dd className="font-semibold">{instruccion.instrucciones?.cuenta || '—'}</dd></div>
                                  <div><dt className="text-xs text-slate-500">CCI</dt><dd className="font-semibold">{instruccion.instrucciones?.cci || '—'}</dd></div>
                                  <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Indicaciones</dt><dd>{instruccion.instrucciones?.instrucciones || 'Sigue las indicaciones oficiales de la academia.'}</dd></div>
                                </dl>
                              ) : (
                                <p className="mt-2 text-sm text-amber-800">{instruccion.mensaje || 'Datos bancarios no configurados. Contacta a administración antes de transferir.'}</p>
                              )}
                            </div>
                            {instruccion.instruccionesDisponibles && (
                              <form onSubmit={(event) => enviarReferencia(id, event)} className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600">
                                  Número de operación o referencia de la transferencia
                                  <input
                                    value={referencias[id] || ''}
                                    onChange={(event) => setReferencias((actual) => ({ ...actual, [id]: event.target.value }))}
                                    minLength={4}
                                    maxLength={120}
                                    required
                                    disabled={bloqueada}
                                    placeholder="Ej. número de operación bancaria"
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-600 disabled:bg-slate-100"
                                  />
                                </label>
                                <button type="submit" disabled={bloqueada} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                                  {accion === `referencia-${id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/> : <Send className="h-4 w-4" aria-hidden="true"/>}
                                  Enviar referencia para revisión
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => consultarEstado(id)}
                        disabled={bloqueada}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {accion === `estado-${id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/> : <RefreshCw className="h-4 w-4" aria-hidden="true"/>}
                        Consultar estado del pago
                      </button>
                      <span className="text-xs text-slate-500">Solo lee el estado guardado en el servidor; no confirma pagos.</span>
                    </div>

                    {cuota.enRevision && (
                      <p className="mt-4 flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800">
                        <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true"/>
                        La administración debe revisar la referencia. Esta cuota sigue pendiente hasta que se apruebe; no necesitas registrarla de nuevo.
                      </p>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      <p className="text-xs text-slate-500">Si el importe o periodo no coincide con lo acordado, no realices la transferencia y consulta a la administración. Los importes mostrados proceden de los registros de cuotas del servidor. La consulta de estado solo lee esos registros y no modifica la cuota.</p>
    </div>
  );
}