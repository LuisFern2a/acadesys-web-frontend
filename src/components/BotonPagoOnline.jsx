import React, { useRef, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { crearCheckoutPagoAlumno, urlCheckoutValida } from '../services/pagosOnline.api.js';

export default function BotonPagoOnline({ idPago, disabled = false, onBusyChange, onConflicto }) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const envioEnCursoRef = useRef(false);

  const iniciar = async () => {
    const id = Number(idPago);
    if (envioEnCursoRef.current || disabled || !Number.isSafeInteger(id) || id <= 0) return;

    envioEnCursoRef.current = true;
    setOcupado(true);
    setError('');
    onBusyChange?.(true);

    try {
      const data = await crearCheckoutPagoAlumno(id);
      const destino = data?.checkoutUrl || data?.urlCheckout;
      if (!urlCheckoutValida(destino)) {
        throw new Error('El proveedor no devolvió una dirección segura de Mercado Pago.');
      }
      window.location.assign(new URL(destino).toString());
    } catch (err) {
      // 409: la cuota cambió de estado mientras se abría el checkout (por
      // ejemplo, otra pestaña ya la pagó). El panel refresca y muestra el
      // estado real; aquí no se afirma nada sobre el pago.
      if (Number(err?.status) === 409 && typeof onConflicto === 'function') {
        try {
          await onConflicto(err);
        } catch {
          setError(err?.message || 'La cuota cambió de estado. Actualiza la pantalla.');
        }
      } else {
        setError(err?.message || 'No se pudo iniciar el pago online.');
      }
    } finally {
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
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Conectando con Mercado Pago…</>
        ) : (
          <><CreditCard className="h-4 w-4" aria-hidden="true" /> Pagar online con Mercado Pago</>
        )}
      </button>
      {error && (
        <p role="alert" className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {error}
        </p>
      )}
    </div>
  );
}
