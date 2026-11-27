import React, { useRef, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { crearCheckoutPagoAlumno } from '../services/pagosOnline.api.js';

function esCheckoutHttps(valor) {
  try {
    const url = new URL(String(valor || ''));
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function BotonPagoOnline({
  idPago,
  disabled = false,
  onBusyChange,
  onConflicto,
  antesDePagar,
}) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const envioEnCursoRef = useRef(false);

  const iniciar = async () => {
    const id = Number(idPago);
    if (envioEnCursoRef.current || disabled || !Number.isSafeInteger(id) || id <= 0) return;

    envioEnCursoRef.current = true;
    setOcupado(true);
    setError('');
    setAviso('');
    onBusyChange?.(true);

    try {
      // Guarda primero a nombre de quién sale la boleta.
      if (typeof antesDePagar === 'function') await antesDePagar(id);
      const data = await crearCheckoutPagoAlumno(id);
      if (data?.proveedor !== 'MERCADOPAGO') {
        throw new Error('El backend no devolvió Mercado Pago como proveedor activo.');
      }
      if (!esCheckoutHttps(data?.checkoutUrl)) {
        throw new Error('Mercado Pago no devolvió una URL segura de checkout.');
      }
      setAviso('Redirigiendo a Mercado Pago…');
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      if (Number(err?.status) === 409 && typeof onConflicto === 'function') {
        try {
          await onConflicto(err);
        } catch {
          setError(err?.message || 'La cuota cambió de estado. Actualiza la pantalla.');
        }
      } else {
        setError(err?.message || 'No se pudo iniciar el checkout de Mercado Pago.');
      }
    } finally {
      // Si location.assign navega, la página se descargará. Si falla, se libera el botón.
      envioEnCursoRef.current = false;
      setOcupado(false);
      onBusyChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={iniciar}
        disabled={disabled || ocupado}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ocupado ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Preparando checkout…</>
        ) : (
          <><CreditCard className="h-4 w-4" aria-hidden="true" /> Pagar con Mercado Pago</>
        )}
      </button>
      {aviso && (
        <p role="status" className="flex max-w-xl items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      )}
      {error && (
        <p role="alert" className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{error}</p>
      )}
    </div>
  );
}
