import { useEffect, useRef } from 'react';

let abiertos = 0;
let overflowOriginal = '';

// Mantiene el foco dentro del diálogo y lo devuelve al control que lo abrió.
export default function useModalDialog(abierto, cerrar, ocupado = false) {
  const dialogRef = useRef(null);
  const cerrarRef = useRef(cerrar);
  const ocupadoRef = useRef(ocupado);

  useEffect(() => {
    cerrarRef.current = cerrar;
    ocupadoRef.current = ocupado;
  }, [cerrar, ocupado]);

  useEffect(() => {
    if (!abierto || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const anterior = document.activeElement;
    if (abiertos === 0) overflowOriginal = document.body.style.overflow;
    abiertos += 1;
    document.body.style.overflow = 'hidden';
    const controles = () => Array.from(dialog.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
    )).filter((el) => el.getClientRects().length > 0);
    (controles()[0] || dialog).focus();

    const manejarTecla = (event) => {
      // SweetAlert tiene su propio manejo de foco cuando está sobre el diálogo.
      if (document.querySelector('.swal2-container')) return;
      if (event.key === 'Escape' && !ocupadoRef.current) {
        event.preventDefault();
        cerrarRef.current?.();
      }
      if (event.key !== 'Tab') return;
      const elementos = controles();
      const primero = elementos[0];
      const ultimo = elementos.at(-1);
      if (!primero) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === primero || !dialog.contains(document.activeElement))) {
        event.preventDefault(); ultimo.focus();
      } else if (!event.shiftKey && (document.activeElement === ultimo || !dialog.contains(document.activeElement))) {
        event.preventDefault(); primero.focus();
      }
    };
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.removeEventListener('keydown', manejarTecla);
      abiertos -= 1;
      if (abiertos === 0) document.body.style.overflow = overflowOriginal;
      if (anterior?.isConnected) anterior.focus();
    };
  }, [abierto]);

  return dialogRef;
}
