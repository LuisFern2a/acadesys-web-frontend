import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// El service worker de producción usa cache-first. En desarrollo eso hacía que
// el navegador siguiera ejecutando módulos viejos de Vite (por eso persistían
// errores ya corregidos y el HMR no aplicaba). En producción se registra; en
// desarrollo se eliminan registros y cachés heredados para servir siempre el
// código actual del servidor.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    })
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((registros) => Promise.all(registros.map((registro) => registro.unregister())))
      .then(() => (window.caches ? window.caches.keys() : []))
      .then((claves) => Promise.all(claves.map((clave) => window.caches.delete(clave))))
      .catch(() => {})
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)