import React, { useState, useEffect } from 'react';

export default function OfflineFallback({ children }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  if (!isOffline) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white select-none">
      {/* Contenedor del ícono animado */}
      <div className="relative mb-6">
        <div className="w-28 h-28 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-500/10">
          <svg
            className="w-14 h-14 text-rose-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824-2.179a4.978 4.978 0 012.83 1.414m-8.484 8.486l14.142-14.142"
            />
          </svg>
        </div>
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
        </span>
      </div>

      {/* Etiquetas y mensaje principal */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Sin Conexión a Internet
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
        Modo Fuera de Línea
      </h1>

      <p className="text-slate-400 max-w-md text-sm sm:text-base leading-relaxed mb-8">
        No se pudo establecer contacto con los servidores de AcadeSys. Verifica tu conexión de red o continúa navegando en los datos cacheados por el Service Worker.
      </p>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition duration-150 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reintentar conexión
        </button>
      </div>
    </div>
  );
}