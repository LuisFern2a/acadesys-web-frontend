# Integración frontend — Morgan

Se entregan archivos completos para añadir el checkout online sin reemplazar el `api.js` ni reescribir manualmente `PanelPagosAlumno.jsx`.

## Archivos nuevos

Copia desde este paquete:

- `frontend/src/services/pagosOnline.api.js` → `src/services/pagosOnline.api.js` del frontend.
- `frontend/src/components/BotonPagoOnline.jsx` → `src/components/BotonPagoOnline.jsx` del frontend.
- `frontend/scripts/integrar-panel-morgan.cjs` → `scripts/integrar-panel-morgan.cjs` del frontend.

El módulo nuevo reutiliza `API_URL` y `fetchWithAuth`, que ya exporta `src/services/api.js`. Por eso no se debe reemplazar ni editar ese archivo.

## Aplicar el cambio al panel existente

Desde la raíz del frontend, ejecuta:

```bash
node scripts/integrar-panel-morgan.cjs
```

El script agrega el import y el botón online al bloque de cuotas pendientes. Antes de modificar el panel, crea `src/components/PanelPagosAlumno.jsx.morgan.bak`. Es idempotente: si el botón ya está integrado, no lo duplica.

## Validar

```bash
npm run build
```

Después ejecuta el script de pruebas que figure en el `package.json` del proyecto.
