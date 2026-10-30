# QA — Portal del alumno · Módulo “Mis pagos”

**Responsable:** Yan (Frontend / Fullstack — portal del alumno y sincronización de pagos)
**Proyecto:** AcadeSys
**Rama base:** `main` @ `687a07f`
**Fecha de ejecución:** 30/10/2026
**Entorno automatizado:** local (Node 22, pruebas con respuestas simuladas)
**Entorno manual:** pendiente de credenciales de académica de pruebas

---

## 1. Alcance

- Consulta de cuotas, importe, periodo, vencimiento y estado.
- Historial visual por estado (todas / pendientes / en revisión / pagadas).
- Registro de referencia de transferencia (no pasarela de pago).
- Estados de carga, error, vacío, aviso, éxito y reintento.
- Sincronización con el panel administrativo (`MorosidadPage`).
- Aislamiento de información entre alumnos y permisos por rol.
- Manejo de 401, 403 y 409.

**Fuera de alcance:** cobro real con pasarela, subida de archivo de comprobante, conciliación bancaria.

---

## 2. Resultado de la ejecución automatizada

```text
npm test        → 129 tests, 129 pass, 0 fail
npm run build   → compilación correcta (solo aviso previo de tamaño de chunk)
npx oxlint      → sin errores; avisos react(set-state-in-effect) ya presentes en el proyecto
```

Archivos de prueba añadidos:

- `tests/contrato-pagos.test.js` — contrato de pagos, normalización y errores.
- `tests/roles-navegacion.test.js` — permisos por rol y barreras de navegación.

> Importante: estas pruebas usan respuestas HTTP simuladas. No crean, aprueban ni modifican pagos reales.

---

## 3. Matriz de pruebas

| ID | Prueba | Acción realizada | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| QA-P-01 | Visualización de cuotas | `GET /api/alumno/pagos` con cuotas simuladas | Lista con concepto, periodo, monto, vencimiento y estado | Se renderizan tarjetas con los campos normalizados | Aprobado (simulado) | `contrato-pagos.test.js` · “obtenerMisPagos usa la sesión del JWT…” |
| QA-P-02 | Compatibilidad PascalCase/camelCase | Cuota con `IdPago`, `Monto`, `Mes`, `Estado` | La UI muestra el importe real, no `S/ 0.00` | `idPago=12`, `monto=350.5`, `periodo=Marzo` | Aprobado | “normaliza una cuota en PascalCase…” |
| QA-P-03 | Monto ausente | Cuota sin `Monto` | Mostrar “—” y advertencia, nunca `S/ 0.00` | `monto = null` y aviso de no transferir | Aprobado | “un monto ausente queda en null…” |
| QA-P-04 | Indicadores | Cuotas pendientes, pagadas y en revisión | Total pendiente, total pagado, cuotas en revisión y próximo vencimiento | Resumen calculado correctamente desde montos reales | Aprobado | “el resumen se calcula con montos reales…” |
| QA-P-05 | Historial por estado | Filtros Todas/Pendientes/En revisión/Pagadas | Cada filtro muestra solo su grupo y su contador | Filtros y contadores coherentes con la lista | Aprobado (revisión de código) | `PanelPagosAlumno.jsx` |
| QA-P-06 | Estado “En revisión” anidado | Cuota con `comprobante.estado = EN_REVISION` | Badge “En revisión” y sin formulario de reenvío | `enRevision=true`, `puedeRegistrarComprobante=false` | Aprobado | “detecta 'En revisión' anidado…” |
| QA-P-07 | Estado “En revisión” plano | `EstadoRevisionComprobante = "En revisión"` | Igual que QA-P-06 | Se reconocen acentos, espacios y guiones | Aprobado | “detecta 'En revisión' plano…” |
| QA-P-08 | Registro de referencia | `POST /api/alumno/pagos/{id}/comprobante` con `{referencia}` | Se envía solo la referencia | Payload exacto `{ referencia }`, sin monto ni estado | Aprobado | “registrarComprobanteAlumno envía solo la referencia…” |
| QA-P-09 | Frontend no altera el importe | Enviar `monto` y `estado` desde el navegador | El backend no recibe esos campos | Se descartan en el cliente | Aprobado | misma prueba anterior |
| QA-P-10 | Validación de referencia | Referencias de 2 y 121 caracteres | Rechazo local sin llamar al servidor | Error “entre 4 y 120 caracteres”, 0 peticiones | Aprobado | “el frontend no puede enviar un importe…” |
| QA-P-11 | Identificadores inválidos | `idPago` nulo, cero, negativo, decimal o texto | No generar `/undefined` | Error “no es válida”, 0 peticiones | Aprobado | “identificadores inválidos no generan peticiones” |
| QA-P-12 | Doble clic / duplicados | Dos envíos seguidos de la misma cuota | No se duplica el comprobante | Bloqueo síncrono (`envioEnCursoRef`) + recarga al recibir 409 | Aprobado (código) / Pendiente (prueba manual) | `PanelPagosAlumno.jsx` |
| QA-P-13 | 409 referencia duplicada | Respuesta 409 del backend | Mensaje claro, sesión intacta, estado refrescado | Mensaje del backend, token conservado y recarga automática | Aprobado | “un 409 por referencia duplicada…” |
| QA-P-14 | 403 sin permisos | Respuesta 403 | Mensaje de permisos, sin cerrar sesión | Error 403 y token intacto | Aprobado | “403 en pagos no cierra la sesión…” |
| QA-P-15 | 401 sesión vencida | Respuesta 401 | Cierre de sesión y retorno al inicio | Token y sesión limpiados, `location = "/"` | Aprobado | “401 en el portal de pagos limpia la sesión…” |
| QA-P-16 | Aislamiento entre alumnos | Revisión de URLs y cuerpos de petición | Ninguna llamada envía `idUsuario`/`idAlumno` | Solo `/api/alumno/pagos…` con JWT | Aprobado | “obtenerMisPagos usa la sesión del JWT…” |
| QA-P-17 | Acceso del alumno | Menú y vistas del alumno | Solo ve su intranet y “Mis pagos” | Menú restringido a `alumno/estudiante` | Aprobado | `roles-navegacion.test.js` |
| QA-P-18 | Acceso del docente | Menú y rutas | No accede a Morosidad ni a pagos del alumno | `morosidad` exige `administrador/admin` | Aprobado | “Morosidad exige administrador…” |
| QA-P-19 | Acceso del administrador | Menú y rutas | Conserva Morosidad y revisión de comprobantes | Restricción intacta tras los cambios | Aprobado | `roles-navegacion.test.js` + `App.jsx` |
| QA-P-20 | Sincronización con administración | Revisión de comprobantes en `MorosidadPage` | El admin ve el mismo registro y puede aprobar/rechazar | Se conservan comprobantes sin `IdCiclo` y los errores ya no pisan el resultado | Aprobado (código) / Pendiente (E2E) | `MorosidadPage.jsx` |
| QA-P-21 | Error de conexión | `fetch` sin red | Mensaje en español y opción de reintentar | “No se pudo conectar con el servidor…” + botón Reintentar | Aprobado | `api.js` · `solicitarApi` |
| QA-P-22 | Confirmación de pago | Intento de marcar “Pagado” desde el frontend | No debe ser posible | `actualizarEstadoPago` solo acepta “Moroso” | Aprobado | `contrato-api.test.js` existente |
| QA-P-23 | Prueba real con backend | Login de alumno y admin en Render | Ver estados reales de punta a punta | No ejecutada | **Pendiente** | Requiere credenciales de prueba |

---

## 4. Pruebas manuales pendientes (requieren backend/credenciales)

Para cerrar QA-P-23 y las evidencias con captura:

1. Iniciar sesión como alumno y abrir **Mis pagos**.
2. Verificar importe, periodo, vencimiento y estado contra el panel de administración.
3. Registrar una referencia de prueba y confirmar que la cuota pasa a **En revisión** (no a **Pagado**).
4. Iniciar sesión como administrador, abrir **Morosidad**, revisar el comprobante y aprobarlo.
5. Volver a la sesión del alumno, pulsar **Actualizar** y confirmar **Pagado** con fecha.
6. Reintentar el mismo registro para verificar el 409 y la ausencia de duplicados.
7. Abrir la URL del portal con un alumno B y confirmar que no ve las cuotas del alumno A.
8. Probar docente: confirmar que no aparece **Morosidad** ni **Mis pagos**.
9. Simular sesión vencida (token inválido) y error de red (modo offline).

Capturas sugeridas: cuotas del alumno, referencia en revisión, panel admin con el comprobante, cuota pagada, intento duplicado.

---

## 5. Dependencias pendientes del backend (Morgan)

| # | Dependencia | Impacto | Estado |
|---|---|---|---|
| D-01 | Confirmar nombres exactos de los campos de `GET /api/alumno/pagos` (camelCase/PascalCase y claves de `resumen`) | El cliente ya tolera ambos, pero debe fijarse el contrato | Pendiente |
| D-02 | Definir si el historial de pagos sale del mismo endpoint o requiere `GET /api/alumno/pagos/historial` | Hoy el historial se muestra filtrando las cuotas recibidas | Pendiente |
| D-03 | Definir subida de archivo de comprobante (`urlComprobante`) | Hoy solo se registra `referencia` | Pendiente |
| D-04 | Confirmar que `GET /api/pagos/comprobantes` devuelve `IdCiclo` | Si no lo devuelve, el admin ve todos los comprobantes de su academia (comportamiento tolerante actual) | Pendiente |

---

## 6. Notas de seguridad

- La identidad del alumno la determina el backend a partir del JWT; el frontend nunca envía `idUsuario`.
- Ocultar un botón no se usa como medida de seguridad: las rutas administrativas se validan también en el backend.
- No se almacenan contraseñas ni tokens en lugares distintos de `acadesys_token` y `acadesys_session`.
- Los mensajes al alumno no exponen SQL, rutas internas ni detalles del servidor.
