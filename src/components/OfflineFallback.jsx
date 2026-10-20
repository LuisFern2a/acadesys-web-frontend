import React, { useState, useEffect } from 'react';

export default function OfflineFallback({ children }) {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // No desmontar la aplicación: se conservan los formularios sin guardar.
  return (
    <>
      {isOffline && (
        <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-[100] border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
          Sin conexión. Los cambios no se guardarán hasta recuperar Internet; conserva esta ventana abierta.
        </div>
      )}
      {children}
    </>
  );
}
