
import React, { useRef, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import {
  crearCheckoutPagoAlumno,
  idOrdenCulqiValido,
} from '../services/pagosOnline.api.js';

const CULQI_SCRIPT_URL = 'https://js.culqi.com/checkout-js';
let culqiScriptPromise;

function cargarCulqiCheckout() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('El checkout solo puede abrirse desde el navegador.'));
  }
  if (typeof window.CulqiCheckout === 'function') return Promise.resolve();
  if (culqiScriptPromise) return culqiScriptPromise;

  culqiScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${CULQI_SCRIPT_URL}"]`);
    const limpiar = () => {
      culqiScriptPromise = null;
    };
    if (!script) {
      script = document.createElement('script');
      script.src = CULQI_SCRIPT_URL;
      script.async = true;
      script.dataset.acadesysCulqi = 'true';
      document.body.appendChild(script);
    }
    const alCargar = () => {
      if (typeof window.CulqiCheckout === 'function') {
        resolve();
      } else {
        reject(new Error('No se pudo inicializar el checkout de Culqi.'));
      }
      limpiar();
    };
    const alError = () => {
      reject(new Error('No se pudo cargar el servicio de pagos. Revisa tu conexión e inténtalo nuevamente.'));
      limpiar();
    };
    script.addEventListener('load', alCargar, { once: true });
    script.addEventListener('error', alError, { once: true });
    // Si el script ya había terminado de cargar entre la búsqueda y los listeners.
    if (typeof window.CulqiCheckout === 'function') alCargar();
  });

  return culqiScriptPromise;
}

function mensajeErrorCulqi(error) {
  const detalle = String(error?.data?.user_message || error?.data?.message || '').trim();
  if (detalle && detalle.length <= 180) return detalle;
  if (error?.code === 'CULQI_NO_CONFIGURADO') {
    return 'La pasarela todavía no está habilitada. Puedes usar el medio manual de pago de la academia.';
  }
  return error?.message || 'No se pudo iniciar el pago online.';
}

export default function BotonPagoOnline({
  idPago,
  disabled = false,
  onBusyChange,
  onConflicto,
  onCheckoutOrder,
}) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const envioEnCursoRef = useRef(false);
  const checkoutRef = useRef(null);

  const iniciar = async () => {
    const id = Number(idPago);
    if (envioEnCursoRef.current || disabled || !Number.isSafeInteger(id) || id <= 0) return;

    envioEnCursoRef.current = true;
    setOcupado(true);
    setError('');
    setAviso('');
    onBusyChange?.(true);

    try {
      const data = await crearCheckoutPagoAlumno(id);
      if (data?.proveedor !== 'CULQI') {
        throw new Error('El backend todavía no está configurado para usar Culqi. Verifica PAYMENT_PROVIDER en Render.');
      }
      if (!idOrdenCulqiValido(data?.orderId)) {
        throw new Error('Culqi no devolvió un identificador de orden válido.');
      }
      if (typeof data?.publicKey !== 'string' || !/^pk_(?:test|live)_[A-Za-z0-9]+$/.test(data.publicKey)) {
        throw new Error('La llave pública de Culqi no está configurada correctamente.');
      }
      if (!Number.isSafeInteger(Number(data?.amountCentimos)) || Number(data.amountCentimos) <= 0 || data.currency !== 'PEN') {
        throw new Error('El importe de la orden no es válido. Actualiza tus cuotas o contacta con administración.');
      }

      await cargarCulqiCheckout();

      const paymentMethods = {
        tarjeta: false,
        // Culqi separa Yape y las demás billeteras como opciones configurables.
        yape: false,
        billetera: true,
        bancaMovil: false,
        agente: false,
        cuotealo: false,
      };
      const settings = {
        title: 'AcadeSys',
        currency: 'PEN',
        amount: Number(data.amountCentimos),
        order: data.orderId,
      };
      const client = {
        email: String(data.client?.email || ''),
        firstName: String(data.client?.firstName || ''),
        lastName: String(data.client?.lastName || ''),
      };
      const options = {
        lang: 'es',
        installments: false,
        modal: true,
        paymentMethods,
        paymentMethodsSort: ['yape', 'billetera'],
      };
      const appearance = {
        theme: 'default',
        hiddenCulqiLogo: false,
        hiddenBannerContent: false,
        hiddenBanner: false,
        hiddenToolBarAmount: false,
        menuType: 'select',
        buttonCardPayText: 'Pagar',
        defaultStyle: {
          bannerColor: '#0f766e',
          buttonBackground: '#0f766e',
          menuColor: '#0f766e',
          linksColor: '#0f766e',
          buttonTextColor: '#ffffff',
          priceColor: '#0f172a',
        },
      };

      const checkout = new window.CulqiCheckout(data.publicKey, {
        settings,
        client,
        options,
        appearance,
      });
      checkoutRef.current = checkout;

      checkout.culqi = () => {
        // Culqi.order significa que el checkout generó/seleccionó una orden;
        // NO significa que el pago ya fue aprobado. La verdad llega por webhook.
        if (checkout.order) {
          checkout.close?.();
          setAviso('Checkout iniciado. Estamos esperando la confirmación de Culqi; la cuota seguirá pendiente hasta verificar el pago.');
          onCheckoutOrder?.({ idPago: id, orderId: data.orderId });
        } else if (checkout.error) {
          const texto = checkout.error?.user_message || checkout.error?.merchant_message;
          setError(typeof texto === 'string' && texto.length <= 180
            ? texto
            : 'Culqi no pudo continuar con el pago. Inténtalo nuevamente.');
        }
      };

      checkout.open();
    } catch (err) {
      if (Number(err?.status) === 409 && typeof onConflicto === 'function') {
        try {
          await onConflicto(err);
        } catch {
          setError(err?.message || 'La cuota cambió de estado. Actualiza la pantalla.');
        }
      } else {
        setError(mensajeErrorCulqi(err));
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
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Preparando pago…</>
        ) : (
          <><CreditCard className="h-4 w-4" aria-hidden="true" /> Pagar con QR Yape / Plin</>
        )}
      </button>
      {aviso && (
        <p role="status" className="flex max-w-xl items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      )}
      {error && (
        <p role="alert" className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {error}
        </p>
      )}
    </div>
  );
}