import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BadgeCheck, Banknote, CalendarClock, CheckCircle2, Clock3, CreditCard, Loader2, RefreshCw, Send } from 'lucide-react';
import { iniciarPagoAlumno, obtenerMisPagos, registrarComprobanteAlumno } from '../services/api';

const dinero = (valor) => `S/ ${Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (valor) => {
  if (!valor) return '—';
  const valorCorto = String(valor).slice(0, 10);
  const partes = valorCorto.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valorCorto;
};
const normalizarEstado = (estado) => String(estado || '').trim().toUpperCase();

export default function PanelPagosAlumno() {
  const [cuotas, setCuotas] = useState([]);
  const [resumen, setResumen] = useState({});
  const [instrucciones, setInstrucciones] = useState({});
  const [referencias, setReferencias] = useState({});
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await obtenerMisPagos();
      setCuotas(Array.isArray(data.cuotas) ? data.cuotas : []);
      setResumen(data.resumen || {});
      setMensaje(null);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudieron consultar tus cuotas.' });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const consultarInstrucciones = async (idPago) => {
    setAccion(`iniciar-${idPago}`);
    setMensaje(null);
    try {
      const data = await iniciarPagoAlumno(idPago);
      setInstrucciones((actual) => ({ ...actual, [idPago]: data }));
      if (data.instruccionesDisponibles) {
        setMensaje({ tipo: 'exito', texto: 'Consulta las instrucciones oficiales y registra la referencia después de efectuar la transferencia.' });
      } else {
        setMensaje({ tipo: 'aviso', texto: data.mensaje || 'La academia aún no tiene datos de transferencia configurados. No envíes dinero hasta confirmarlos con administración.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudieron consultar las instrucciones.' });
    } finally {
      setAccion(null);
    }
  };

  const enviarReferencia = async (idPago, event) => {
    event.preventDefault();
    const referencia = String(referencias[idPago] || '').trim();
    if (referencia.length < 4 || referencia.length > 120) {
      setMensaje({ tipo: 'error', texto: 'La referencia debe contener entre 4 y 120 caracteres.' });
      return;
    }
    if (!window.confirm('Confirma que ya realizaste la transferencia y que esta referencia corresponde al pago.')) return;
    setAccion(`referencia-${idPago}`);
    setMensaje(null);
    try {
      const resultado = await registrarComprobanteAlumno(idPago, { referencia });
      setMensaje({ tipo: 'exito', texto: resultado.mensaje || 'Referencia enviada a revisión. La cuota no se marcará como pagada hasta su aprobación.' });
      setReferencias((actual) => ({ ...actual, [idPago]: '' }));
      await cargar();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo registrar la referencia.' });
    } finally {
      setAccion(null);
    }
  };

  const totalPendiente = Number(resumen.montoPendiente || 0);
  const totalPagado = Number(resumen.montoPagado || 0);

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 text-slate-900 md:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700"><CreditCard className="h-4 w-4" aria-hidden="true"/> Finanzas del alumno</span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mis pagos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Consulta tus cuotas, sigue las instrucciones oficiales de transferencia y registra la referencia para revisión de la academia.</p>
        </div>
        <button type="button" onClick={cargar} disabled={cargando || accion !== null} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true"/> Actualizar</button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold">Importante: esta versión no cobra dentro de AcadeSys.</p>
        <p className="mt-1 text-xs leading-relaxed">Realiza transferencias únicamente a los datos oficiales confirmados por la academia. Este formulario registra una referencia; no procesa dinero ni sube un archivo de comprobante. El administrador debe revisar la operación antes de marcarla como pagada.</p>
      </div>

      {mensaje && <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : mensaje.tipo === 'aviso' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/><span>{mensaje.texto}</span></div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cuotas registradas</p><p className="mt-2 text-2xl font-bold">{cargando ? '…' : Number(resumen.cantidad || 0)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total pagado</p><p className="mt-2 text-2xl font-bold text-emerald-700">{cargando ? '…' : dinero(totalPagado)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total pendiente</p><p className="mt-2 text-2xl font-bold text-amber-700">{cargando ? '…' : dinero(totalPendiente)}</p></div>
      </section>

      {cargando ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-teal-700"/>Cargando tus cuotas...</div> : cuotas.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><Banknote className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-3 font-bold">Todavía no tienes cuotas registradas.</p><p className="mt-1 text-sm text-slate-500">Comunícate con administración para validar tu matrícula y generar los conceptos de pago correspondientes.</p></div>
      ) : <section className="space-y-4">{cuotas.map((cuota) => {
        const id = Number(cuota.idPago);
        const estado = normalizarEstado(cuota.estado);
        const comprobante = cuota.comprobante;
        const enRevision = normalizarEstado(comprobante?.estado) === 'EN_REVISION';
        const pagado = estado === 'PAGADO';
        const instruccion = instrucciones[id];
        const estadoClase = pagado ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : enRevision ? 'border-sky-200 bg-sky-50 text-sky-700' : estado === 'MOROSO' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800';
        return <article key={id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{cuota.concepto || 'Cuota'}</span><span className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${estadoClase}`}>{enRevision ? 'Comprobante en revisión' : cuota.estado || 'Pendiente'}</span></div>
              <h2 className="mt-3 text-base font-bold">{cuota.ciclo || 'Ciclo académico'}</h2>
              <p className="mt-1 text-sm text-slate-500">Periodo: {cuota.periodo || '—'}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarClock className="h-4 w-4" aria-hidden="true"/> Vencimiento: {fecha(cuota.fechaVencimiento)}</p>
            </div>
            <div className="md:text-right"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Importe de la cuota</p><p className="mt-1 text-2xl font-bold text-slate-900">{dinero(cuota.monto)}</p>{pagado && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="h-4 w-4"/> Confirmado {fecha(cuota.fechaPago)}</p>}</div>
          </div>

          {comprobante && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-700">Referencia registrada: <span className="font-normal">{comprobante.referencia || '—'}</span></p>{comprobante.motivoRevision && <p className="mt-1 text-rose-700">Observación: {comprobante.motivoRevision}</p>}</div>}

          {!pagado && !enRevision && <div className="mt-4 border-t border-slate-100 pt-4">
            {!instruccion ? <button type="button" onClick={() => consultarInstrucciones(id)} disabled={accion !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50">{accion === `iniciar-${id}` ? <Loader2 className="h-4 w-4 animate-spin"/> : <Banknote className="h-4 w-4"/>} Ver instrucciones de pago</button> : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-800">Instrucciones de transferencia</p>
                  {instruccion.instruccionesDisponibles ? <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Banco / entidad</dt><dd className="font-semibold">{instruccion.instrucciones?.entidad || '—'}</dd></div><div><dt className="text-xs text-slate-500">Titular</dt><dd className="font-semibold">{instruccion.instrucciones?.titular || '—'}</dd></div><div><dt className="text-xs text-slate-500">Cuenta</dt><dd className="font-semibold">{instruccion.instrucciones?.cuenta || '—'}</dd></div><div><dt className="text-xs text-slate-500">CCI</dt><dd className="font-semibold">{instruccion.instrucciones?.cci || '—'}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-slate-500">Indicaciones</dt><dd>{instruccion.instrucciones?.instrucciones || 'Sigue las indicaciones oficiales de la academia.'}</dd></div></dl> : <p className="mt-2 text-sm text-amber-800">{instruccion.mensaje || 'Datos bancarios no configurados. Contacta a administración antes de transferir.'}</p>}
                </div>
                {instruccion.instruccionesDisponibles && <form onSubmit={(event) => enviarReferencia(id, event)} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">Número de operación o referencia de la transferencia<input value={referencias[id] || ''} onChange={(event) => setReferencias((actual) => ({ ...actual, [id]: event.target.value }))} minLength={4} maxLength={120} required placeholder="Ej. número de operación bancaria" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-600"/></label>
                  <button type="submit" disabled={accion !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50">{accion === `referencia-${id}` ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>} Enviar referencia para revisión</button>
                </form>}
              </div>
            )}
          </div>}
          {enRevision && <p className="mt-4 flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800"><Clock3 className="h-4 w-4 shrink-0"/> La administración debe revisar la referencia. Esta cuota sigue pendiente hasta que se apruebe.</p>}
        </article>;
      })}</section>}
      <p className="text-xs text-slate-500">Si el importe o periodo no coincide con lo acordado, no realices la transferencia y consulta a la administración. Los importes mostrados proceden de los registros de cuotas del servidor.</p>
    </div>
  );
}
