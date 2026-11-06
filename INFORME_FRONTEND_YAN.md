# INFORME FRONTEND — YAN

**Proyecto:** AcadeSys — plataforma web de gestión académica y administrativa  
**Repositorio auditado:** `C:\Users\yanza\acadesys-web-frontend`  
**Rama:** `main` (sin cambios de rama)  
**Commit base:** `c74e06b` — `feat: integrar checkout online en panel de pagos`  
**Backend de referencia (solo lectura):** `C:\Users\yanza\acadesys-api-backend`, HEAD `7e0401b`  
**Fecha:** 06/11/2026  
**Responsable:** Yan — Integraciones y calidad

> Esta auditoría se hizo sobre el código actualizado del repositorio. No se hicieron commits, push ni despliegues. No se modificó el backend. No se simularon pagos reales ni se marcaron cuotas como pagadas desde el frontend.

---

## 1. Arquitectura del frontend

### 1.1 Stack

| Elemento | Implementación actual |
|---|---|
| UI | React 19 (`react`, `react-dom`) |
| Build | Vite 8 (`vite.config.js`) |
| Estilos | Tailwind CSS 4 vía `@tailwindcss/postcss` |
| Iconografía | `lucide-react` |
| Alertas/diálogos | `sweetalert2` |
| Pruebas | `node --test tests/*.test.js` |
| Lint | `oxlint` |
| PWA | Service worker propio (`public/sw.js`) registrado solo en producción |

No hay `react-router`. La navegación es por estado (`activeTab`) y se persiste en `localStorage` con la clave `acadesys_tab`.

### 1.2 Organización

```text
src/
  App.jsx                        → sesión, rol, navegación y render por vista
  components/
    DashboardLayout.jsx          → shell, sidebar, menú por rol, perfil
    PanelPagosAlumno.jsx         → portal “Mis pagos” del alumno
    PanelReinscripcionAlumno.jsx → reinscripción desde el portal del alumno
    BotonPagoOnline.jsx          → checkout de Mercado Pago
    ModalMiPerfil.jsx            → autoservicio de perfil
    OfflineFallback.jsx          → aviso de desconexión
    AcadeSysBrand.jsx            → marca institucional
  pages/
    LandingPage.jsx              → login, catálogo público, matrícula, recuperación
    DashboardOverviewPage.jsx    → resumen administrativo
    AcademicoPage.jsx            → aulas, cursos, asignaciones, ciclos, horarios
    CalificacionesPage.jsx       → consulta y ranking de notas
    RegistroNotasPage.jsx        → registro de notas por docente
    AsistenciaPage.jsx           → asistencia por ciclo y fecha
    ComunicadosPage.jsx          → comunicados
    MorosidadPage.jsx            → pagos, comprobantes y morosidad (admin)
    StudentIntranetPage.jsx      → portal del alumno (inicio, ciclo, horario, cursos, notas, materiales, pagos, perfil)
    AdminMaterialesPage.jsx      → materiales (admin)
    UsuariosPage.jsx             → usuarios
    PerfilesPage.jsx             → perfiles
    OpcionesMenuPage.jsx         → opciones de menú
    TutorIAPage.jsx              → Tutor IA
  services/
    api.js                       → cliente central: URL, JWT, errores, normalización y servicios
    pagosOnline.api.js           → checkout y estado de pago online
  utils/
    roles.js                     → normalización exacta de perfiles
    calificaciones.js            → contrato entero de notas y escalas
    perfil.js                    → foto, código de alumno, textos
    universidades.js, horarios.js, etc.
  hooks/
    useModalDialog.js
public/
  sw.js, manifest.webmanifest, favicons, logos
```

### 1.3 Autenticación y sesión

- El JWT se guarda en `localStorage` bajo `acadesys_token`.
- La sesión se guarda en `acadesys_session` (sin duplicar el token).
- `fetchWithAuth` inyecta `Authorization: Bearer <token>`.
- `401` limpia la sesión y redirige al inicio; `403` no cierra sesión.
- La autorización efectiva está en el backend. El frontend solo decide qué vistas y menús mostrar.
- Los roles se comparan por **igualdad exacta** contra alias cerrados (`utils/roles.js`), no con `includes`. Esto evita que perfiles parecidos hereden permisos administrativos.
- El alumno se reconoce como `Alumno` o `Estudiante`; el menú de pagos solo se ofrece a ese grupo.

### 1.4 Manejo de estados y navegación

- `App.jsx` mantiene `session`, `activeTab`, `loadingSession` y el bootstrap del expediente del alumno.
- El portal del alumno usa `StudentIntranetPage` con vistas internas: `student-home`, `student-ciclo`, `student-horario`, `student-cursos`, `student-notas`, `student-materiales`, `student-pagos`, `student-perfil`.
- La vista de pagos se renderiza **antes** del estado de carga del expediente académico. Así, un fallo en datos académicos no oculta “Mis pagos”.
- `DashboardLayout` construye el menú según rol y resuelve rutas contra una lista cerrada de vistas. No evalúa rutas ni HTML.
- Hay protección visual por rol en `App.jsx` y en el menú. La validación real vuelve a estar en el backend.

### 1.5 Cliente API

`src/services/api.js` es el punto único de integración:

- `API_URL` desde `VITE_API_URL` (valor actual: `https://acadesys-api.onrender.com`).
- `solicitarApi` centraliza la URL y el mensaje de desconexión.
- `fetchWithAuth` centraliza JWT, 401, 403, 413, 5xx y errores de negocio.
- `normalizarListaRespuesta` acepta arreglos directos y respuestas envueltas (`data`, `datos`, `items`, `resultados`).
- Los normalizadores aceptan PascalCase y camelCase, porque el backend mezcla ambos formatos según el módulo.
- `pagosOnline.api.js` reutiliza `fetchWithAuth` y solo añade `/api/alumno/pagos/:id/checkout` y `/api/alumno/pagos/:id/estado`.

---

## 2. Estado de integración con backend

### 2.1 Verificación realizada

Se contrastaron los servicios del frontend contra las rutas reales del backend local (HEAD `7e0401b`, sin modificarlo). Los flujos principales coinciden:

| Módulo | Endpoint del frontend | Ruta real del backend | Estado |
|---|---|---|---|
| Login | `POST /api/auth/login` | `auth.routes.js` | Correcto |
| Expediente alumno | `GET /api/alumno/me` | `alumno.routes.js` | Correcto |
| Cuotas del alumno | `GET /api/alumno/pagos` | `alumno.routes.js` | Correcto |
| Instrucciones manuales | `POST /api/alumno/pagos/:id/iniciar` | `alumno.routes.js` | Correcto |
| Comprobante/referencia | `POST /api/alumno/pagos/:id/comprobante` | `alumno.routes.js` | Correcto |
| Checkout online | `POST /api/alumno/pagos/:id/checkout` | `alumno-checkout.routes.js` | Correcto |
| Estado online | `GET /api/alumno/pagos/:id/estado` | `alumno-checkout.routes.js` | Correcto |
| Comprobantes admin | `GET /api/pagos/comprobantes` | `pagos.routes.js` | Correcto |
| Revisión de comprobante | `PUT /api/pagos/comprobantes/:id/revision` | `pagos.routes.js` | Correcto |
| Mensualidades | `POST /api/pagos/mensualidades/generar` | `pagos.routes.js` | Correcto |
| Notas | `GET/POST/PUT /api/notas` | `notas.routes.js` | Correcto |
| Aulas/cursos/asignaciones/horarios/asistencias | `/api/academico/*` | `academico.routes.js` | Correcto |
| Ciclos | `/api/ciclos/*` y `/api/admin/ciclos/*` | `ciclos.routes.js`, `admin-ciclos.routes.js` | Correcto |
| Matrícula | `POST /api/matriculas/verificar` y `/checkout` | `matriculas.routes.js` | Correcto |
| Mi perfil | `GET/PUT /api/usuarios/me` | `usuario.routes.js` | Correcto |
| Materiales admin | `/api/materiales/admin` | `materiales.routes.js` | Correcto |
| Comunicados | `/api/comunicados` | `comunicados.routes.js` | Correcto |
| Dashboard | `/api/dashboard/*` | `dashboard.routes.js` | Correcto |

### 2.2 Puntos verificados

- Las URLs no están inventadas en las páginas; los componentes consumen servicios existentes.
- Los métodos HTTP coinciden con el backend (POST para checkout, GET para estado, PUT para revisión/notas, DELETE para foto).
- Los parámetros sensibles (`idPago`, `idCiclo`, `idAula`) se validan antes de llamar.
- Los nombres de campos se normalizan (PascalCase/camelCase) en los módulos que lo necesitan.
- Los errores 401/403/409/413/5xx tienen tratamiento centralizado.
- No se duplican endpoints en el flujo de pagos: `iniciarPagoAlumno` (transferencia manual) y `crearCheckoutPagoAlumno` (online) son propósitos distintos.

### 2.3 Servicios obsoletos detectados (sin uso actual)

Estas funciones existen en `src/services/api.js`, pero **no se invocan desde ninguna página o componente** y apuntan a rutas que no existen en el backend actual:

| Función | Endpoint que construye | Situación |
|---|---|---|
| `crearMatricula` / `registrarMatriculaAgil` | `POST /api/matriculas` | El backend solo expone `/verificar` y `/checkout` |
| `obtenerMonitoreoTutores` | `GET /api/tutores/monitoreo` | No existe esa ruta |
| `obtenerMaterialesAlumno` | `GET /api/materiales?idCiclo=...` | El backend solo tiene `/api/materiales/admin` y POST/DELETE |
| `obtenerNotasSimulacroAlumno` | `GET /api/notas/simulacros` | No existe esa ruta |

No se eliminaron para no borrar funciones sin confirmar con sus autores. **No rompen la aplicación actual porque no están conectadas a la UI**, pero deben retirarse o reimplementarse en una limpieza coordinada.

### 2.4 Error 503 del backend

El backend responde:

```json
{
  "code": "PASARELA_NO_CONFIGURADA",
  "error": "El pago online todavía no está disponible. Puedes usar el medio manual habilitado por la academia."
}
```

Antes, `fetchWithAuth` convertía cualquier 5xx en un mensaje genérico y descartaba el `code`. El alumno veía “Ocurrió un error en el servidor” en lugar del aviso de pasarela no configurada. Esto ya está corregido sin exponer detalles internos (ver sección 7).

---

## 3. Estado del módulo de pagos

### 3.1 Flujo online (Mercado Pago)

| Requisito | Estado | Evidencia |
|---|---|---|
| Botón solo en cuotas pendientes | Cumple | Se renderiza con `!cuota.pagado && !cuota.enRevision` |
| No permitir pagar cuotas pagadas | Cumple | La tarjeta pagada no muestra el bloque de pago; el backend además responde 409 |
| Monto no determinado por el navegador | Cumple | El checkout envía `{}`; el backend obtiene alumno, academia, importe y moneda |
| URL de checkout desde el backend | Cumple | Se usa `data.checkoutUrl`; el frontend no construye la URL de Mercado Pago |
| URL segura | Cumple | `urlCheckoutValida` exige HTTPS y dominio `mercadopago.com` / `mercadopago.com.pe` |
| Retorno no confirma automáticamente | Cumple | No se procesan parámetros de retorno ni se marca la cuota; solo se consulta el estado del backend |
| Consulta de estado | Cumple (mejorado) | Ahora se usa `GET /api/alumno/pagos/:id/estado` desde “Consultar estado del pago” |
| Pagos pendientes visibles | Cumple | Filtro “Pendientes”, resumen y estados |
| Pagos rechazados comunicados | Cumple | `mensajeEstadoPago` distingue `RECHAZADA`, `CANCELADA`, `REEMBOLSADA`, `CONTRACARGO` |
| Consulta repetible | Cumple | Botón por cuota + botón “Actualizar” |
| Transferencia manual conservada | Cumple | Instrucciones, referencia y revisión administrativa siguen intactas |
| 503 sin romper pantalla | Cumple (corregido) | Mensaje de negocio y la pantalla sigue operativa |

### 3.2 Flujo manual

- Se conserva `iniciarPagoAlumno` y `registrarComprobanteAlumno`.
- Si la academia no tiene datos bancarios, no se muestran datos inventados y no se permite registrar la referencia.
- El comprobante queda “En revisión” y la cuota no se marca pagada hasta la aprobación administrativa.
- `MorosidadPage` conserva la revisión de comprobantes y no permite marcar “Pagado” manualmente; solo “Moroso”.

### 3.3 Limitaciones actuales

- La pasarela real sigue pendiente de configuración (Torito). El backend devuelve 503 hasta que existan credenciales y webhook verificados.
- No se ejecutó un pago real ni una prueba E2E contra Mercado Pago, por indicación expresa y por falta de credenciales.
- La URL de retorno la define el backend (`PAYMENT_RETURN_URL`). Al volver, `App.jsx` fuerza `student-home` para alumnos, por lo que el usuario debe abrir “Mis pagos”. El nuevo botón “Consultar estado del pago” cubre la verificación sin confirmar nada automáticamente.
- El archivo `src/components/PanelPagosAlumno.jsx.morgan.bak` sigue en el repositorio. No se importa, pero conviene retirarlo cuando la integración esté consolidada.

---

## 4. Estado de los módulos académicos

| Módulo | Implementación | Observación |
|---|---|---|
| Portal del alumno | `StudentIntranetPage` + `GET /api/alumno/me` | Usa datos reales: usuario, matrícula, ciclo, cursos, horario, notas y materiales |
| Mi Perfil | `ModalMiPerfil` + `/api/usuarios/me` | Allowlist del backend; conserva apellido materno y contraseña exacta |
| Registro de notas | `RegistroNotasPage` + `/api/notas` | La escala se obtiene del contexto; el backend exige enteros |
| Calificaciones | `CalificacionesPage` | Consulta notas y calcula ranking en el cliente; respeta escala por universidad |
| Actividades | No hay página dedicada | El repo no tiene un módulo “Actividades” separado; se cubre con evaluaciones/notas |
| Catálogo de cursos | `LandingPage` / `AcademicoPage` | Filtros por universidad, ciclo y búsqueda; sin prefijos hardcodeados |
| Matrículas | `LandingPage`, `PanelReinscripcionAlumno` | Preflight `/verificar` y checkout `/checkout`; el backend decide el precio |
| Ciclos | `AcademicoPage` | Admin usa `/api/admin/ciclos`; docente/tutor cae a ciclos públicos activos si recibe 403 |
| Horarios | `AcademicoPage` | Filtros por universidad/ciclo y validación de solapamiento |
| Asistencia | `AsistenciaPage` | `/api/academico/asistencias`; no permite fechas futuras |
| Comunicados | `ComunicadosPage` | Normaliza flags 0/1 y strings |
| Materiales | `StudentIntranetPage` (alumno) y `AdminMaterialesPage` | El alumno recibe materiales dentro de `/api/alumno/me`; el admin usa `/api/materiales/admin` |
| Evaluaciones | `RegistroNotasPage` | Tipos: Práctica, Evaluación, Examen, Simulacro |

### 4.1 Hallazgo académico corregido

`RegistroNotasPage` permitía escribir decimales (`step="0.01"`, regex con parte decimal), pero `Evaluacion.Calificacion` es `INT` en el backend y `calificacionEntera` rechaza decimales. El usuario podía escribir “12.5” y recibir el error recién al guardar. Se corrigió la validación en el input para aceptar solo enteros.

### 4.2 Observaciones no bloqueantes

- `CalificacionesPage` calcula el ranking con las notas que devuelve el backend; si el backend pagina o limita resultados, el ranking sería parcial. No se modificó porque el contrato actual devuelve la lista completa.
- `StudentIntranetPage` recarga el expediente al cambiar de vista interna (con caché breve de 10 s). Es aceptable, pero puede generar peticiones repetidas si se navega rápido.
- No hay módulo dedicado de “Actividades”; si el producto lo requiere, debe definirse el contrato con backend antes de crear la página.

---

## 5. Problemas visuales y funcionales

### 5.1 Identidad visual

El código actual **no coincide** con algunos lineamientos del enunciado:

| Lineamiento indicado | Implementación actual |
|---|---|
| Color principal `#178477` | Se usan `teal-600` / `teal-700` de Tailwind |
| Tipografía Poppins | Se usa “Archivo” (Google Fonts), definida en `src/index.css` |
| Menú lateral blanco | Sidebar oscuro `#0F172A` en `DashboardLayout` |
| Elementos activos en teal | Cumple (teal sobre sidebar oscuro) |
| Fondo `slate-50`, tarjetas blancas, bordes `slate-200` | Cumple en las páginas revisadas |
| Sombras discretas y bordes moderados | Cumple |
| Responsive | Cumple en login, dashboard, pagos, tablas con scroll y menú móvil |

**No se cambiaron estos tokens** para no rediseñar la plataforma ni sobrescribir decisiones visuales existentes. Si el lineamiento institucional (`#178477`, Poppins, sidebar blanco) es la fuente de verdad, debe hacerse un cambio centralizado y coordinado con Luis/Yan, no página por página.

### 5.2 Pagos

- El aviso superior decía “esta versión no cobra dentro de AcadeSys”, aunque ya existe checkout online. Se actualizó para explicar el flujo online, el retorno y la transferencia manual.
- Se añadió “Consultar estado del pago” por cuota, con texto explícito de que no confirma pagos.
- La tarjeta de pago mantiene el diseño institucional: tarjeta blanca, borde slate-200, acento teal, tipografía y espaciado consistentes.
- El mensaje de estado rechazado ahora es claro y ofrece reintentar online o usar transferencia manual.

### 5.3 Calidad de código y limpieza

- `npm run lint` reporta **0 errores** y **20 advertencias** (`react(set-state-in-effect)` y una de `exhaustive-deps`). La línea base tenía 21; se eliminó la advertencia de `maxLength` no usado en `RegistroNotasPage`. No se introdujeron advertencias nuevas.
- El build advierte que el chunk principal supera 500 kB (708 kB, 179 kB gzip). Es una advertencia de tamaño, no un fallo; conviene code-splitting en una tarea aparte.
- Hay archivos auxiliares en la raíz (`replace_profile.cjs`, `replace_student.cjs`, `diff.txt`, `lint.txt`, `lint_output.txt`) y un backup `PanelPagosAlumno.jsx.morgan.bak`. No afectan el runtime, pero conviene limpiarlos.
- El service worker es cache-first en producción. Ya existe `CACHE_NAME = 'acadesys-cache-v5'`; recordar incrementarlo en cada despliegue para no servir JS antiguo.

---

## 6. Errores encontrados

| # | Severidad | Error | Estado |
|---|---|---|---|
| E1 | Alta | El 503 `PASARELA_NO_CONFIGURADA` se convertía en “error de servidor” genérico y se perdía el aviso de pasarela no disponible | Corregido |
| E2 | Media | `consultarEstadoPagoAlumno` existía pero no se usaba; el alumno no podía consultar el estado desde la UI | Corregido |
| E3 | Media | Un 409 al iniciar checkout (cuota ya pagada o checkout en preparación) no refrescaba la lista; la tarjeta podía quedar desactualizada | Corregido |
| E4 | Media | El checkout de matrícula enviaba `monto` desde el navegador aunque el backend lo ignora | Corregido (ya no se envía) |
| E5 | Media | El input de notas aceptaba decimales, pero el backend exige enteros | Corregido |
| E6 | Baja | Cuatro servicios apuntan a endpoints inexistentes y no se usan | Documentado; no eliminado |
| E7 | Baja | Al volver de Mercado Pago se abre `student-home`, no “Mis pagos” | Documentado; mitigado con “Consultar estado” |
| E8 | Baja | Tokens visuales no coinciden con el lineamiento (`#178477`, Poppins, sidebar blanco) | Documentado; no rediseñado |
| E9 | Baja | Chunk principal > 500 kB y 20 advertencias de lint | Documentado; no bloqueante |
| E10 | Baja | Archivos de backup y scripts auxiliares en la raíz | Documentado |

---

## 7. Correcciones realizadas

### 7.1 `src/services/api.js` — tratamiento del 503 de pasarela

Se modificó el bloque 5xx de `fetchWithAuth` para leer el `code` del backend sin exponer detalles internos. Solo el código `PASARELA_NO_CONFIGURADA` se traduce a un mensaje de negocio:

```js
if (response.status >= 500) {
  const datos = await response.json().catch(() => ({}));
  const codigo = typeof datos?.code === 'string' ? datos.code : null;
  const error = new Error('Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.');
  error.status = response.status;
  if (codigo) error.code = codigo;
  if (response.status === 503 && codigo === 'PASARELA_NO_CONFIGURADA') {
    error.message = 'El pago online todavía no está disponible. Puedes usar la transferencia manual habilitada por la academia.';
  }
  throw error;
}
```

El test existente de “5xx no revelan detalles internos” sigue pasando: el mensaje genérico se conserva y no se expone `detalle interno de BD`.

### 7.2 `src/components/BotonPagoOnline.jsx` — conflicto 409

Se añadió la prop `onConflicto`. Cuando el backend responde 409:

- no se muestra un error local ambiguo;
- el panel refresca la lista;
- se informa el estado real de la cuota desde el servidor.

También se mantiene el bloqueo síncrono con `envioEnCursoRef` para evitar doble clic.

### 7.3 `src/components/PanelPagosAlumno.jsx` — consulta de estado y mensajes

- Se importó `consultarEstadoPagoAlumno`.
- Se añadió `mensajeEstadoPago(data)` para interpretar `estadoPago` y `transaccion.estado` sin confirmar nada desde el navegador.
- Se añadió `consultarEstado(idPago)`: llama al endpoint, refresca la lista y muestra el estado real.
- Se añadió `refrescarTrasConflicto(error)` para el 409 del checkout.
- Se añadió el botón “Consultar estado del pago” en cada tarjeta, con texto “Solo lee el estado guardado en el servidor; no confirma pagos”.
- Se actualizó el aviso superior: ahora explica pago online, retorno desde Mercado Pago, transferencia manual y que el comprobante no se sube desde este formulario.
- Se actualizó el pie para aclarar que la consulta no modifica la cuota.

### 7.4 `src/pages/RegistroNotasPage.jsx` — notas enteras

- El input pasó de `step="0.01"` a `step="1"` y `inputMode="numeric"`.
- `handleNotaChange` acepta solo `/^\d+$/`; un decimal se rechaza en el input.
- `handleNotaKeyDown` solo permite dígitos (además de teclas de edición/navegación).
- Se eliminó la variable `maxLength` que no se usaba y generaba advertencia de lint.

### 7.5 Matrícula sin monto del navegador

- `src/services/api.js` (`procesarCheckoutMatricula`) ya no incluye `monto` en el cuerpo.
- `src/components/PanelReinscripcionAlumno.jsx` ya no envía `monto`.
- El backend sigue calculando el precio real desde la base de datos; el contrato no cambia porque el campo era opcional e ignorado.

### 7.6 Pruebas nuevas

Se creó `tests/contrato-checkout-pagos.test.js` con 8 pruebas:

1. El checkout solo envía el ID de la cuota por POST.
2. Un ID inválido no dispara peticiones.
3. El 503 de pasarela se muestra como aviso de negocio.
4. Un 409 conserva el mensaje del backend.
5. Un 500 no expone detalles internos.
6. La consulta de estado usa GET y no modifica la cuota.
7. El checkout de matrícula no envía monto desde el navegador.
8. Solo se aceptan URLs HTTPS de Mercado Pago.

---

## 8. Archivos modificados

### Modificados

| Archivo | Cambio |
|---|---|
| `src/services/api.js` | 503 de pasarela con mensaje de negocio; checkout de matrícula sin `monto` |
| `src/components/BotonPagoOnline.jsx` | Manejo de 409 con `onConflicto` |
| `src/components/PanelPagosAlumno.jsx` | Consulta de estado, refresco tras conflicto, textos actualizados, botón por cuota |
| `src/components/PanelReinscripcionAlumno.jsx` | Ya no envía `monto` |
| `src/pages/RegistroNotasPage.jsx` | Input de notas solo enteros; limpieza de variable no usada |

### Nuevo

| Archivo | Cambio |
|---|---|
| `tests/contrato-checkout-pagos.test.js` | 8 pruebas del contrato de checkout/estado/matrícula |

### No modificados

- No se modificó el backend.
- No se modificaron `App.jsx`, `DashboardLayout.jsx` ni los tokens visuales.
- No se eliminó el flujo manual ni componentes existentes.
- No se instalaron dependencias.
- No se hicieron commits ni push.

---

## 9. Pruebas ejecutadas

### 9.1 Pruebas unitarias / de contrato / de componentes

```text
npm test
→ 137 tests
→ 137 pass
→ 0 fail
→ 0 cancelled
→ 0 skipped
```

Se ejecutaron los 8 archivos previos más el nuevo:

- `catalogo-cursos.test.js`
- `contrato-api.test.js`
- `contrato-pagos.test.js`
- `flujo-alumno-perfiles.test.js`
- `horarios-academicos.test.js`
- `oferta-ciclo.test.js`
- `perfil-utils.test.js`
- `roles-navegacion.test.js`
- `contrato-checkout-pagos.test.js` (nuevo)

Las pruebas cubren: contrato de API, pagos, matrícula, notas, roles, navegación, catálogo, horarios, perfiles y flujo del alumno. Todas usan respuestas simuladas; no se llamó a la API publicada ni a Mercado Pago.

### 9.2 Lint

```text
npm run lint
→ 0 errores
→ 20 advertencias
```

Advertencias preexistentes:

- `react(set-state-in-effect)` en varias páginas (App, Asistencia, Morosidad, PanelPagos, Perfiles, OpcionesMenu, Usuarios, Calificaciones, AdminMateriales, Comunicados, RegistroNotas, StudentIntranet, Academico).
- `react-hooks(exhaustive-deps)` en `ModalMiPerfil`.

No se ocultaron advertencias ni se eliminaron pruebas para mejorar el resultado. Se eliminó una variable no usada (`maxLength`) en `RegistroNotasPage`.

### 9.3 Pruebas no ejecutadas

- No se ejecutó E2E real contra Mercado Pago: faltan credenciales y está prohibido simular pagos reales.
- No se ejecutó una prueba manual con una académica de pruebas: no hay credenciales disponibles.
- No se ejecutó un análisis de accesibilidad automatizado (no hay herramienta instalada); se revisaron roles `aria-live`, `role="alert"`, `aria-pressed` y estados de foco en los flujos tocados.

---

## 10. Resultado del build

```text
npm run build
→ vite v8.2.2
→ 1872 módulos transformados
→ build exitoso
```

Salida relevante:

```text
dist/index.html                     1.82 kB │ gzip:   0.83 kB
dist/assets/index-*.css            46.19 kB │ gzip:   8.99 kB
dist/assets/index-*.js            708.62 kB │ gzip: 179.05 kB
```

Advertencia: el chunk principal supera los 500 kB. No es un error y no impide desplegar. Recomendación: code-splitting por rutas/páginas en una tarea posterior, sin cambiar la arquitectura actual en esta auditoría.

---

## 11. Pendientes de Luis

> Área sugerida: autenticación / recuperación de contraseña y apoyo visual. Confirmar alcance con el equipo.

- Validar el flujo de recuperación de contraseña en un entorno con correo real (enlace, token, expiración y mensaje).
- Revisar la decisión de identidad visual: si el lineamiento `#178477` / Poppins / sidebar blanco es obligatorio, coordinar un cambio centralizado en `src/index.css` y `DashboardLayout.jsx`.
- Confirmar el destino de los scripts auxiliares `replace_profile.cjs` y `replace_student.cjs` antes de eliminarlos.
- Revisar que los mensajes de login/recuperación no revelen si un correo existe.

---

## 12. Pendientes de Dante

> Área sugerida: módulos académicos / notas / asistencia. Confirmar alcance con el equipo.

- Validar con datos reales el registro de notas enteras y el cierre de actas (el frontend ya no acepta decimales).
- Confirmar si “Actividades” y “Evaluaciones” requieren páginas dedicadas o si se mantienen dentro de `RegistroNotasPage` / `CalificacionesPage`.
- Revisar la paginación o límite de notas que devuelve `/api/notas`; el ranking de `CalificacionesPage` es parcial si el backend limita resultados.
- Validar la asistencia por ciclo con fechas y matrículas reales, incluyendo tardanzas y justificados.
- Revisar el uso de `obtenerMaterialesAlumno` y `obtenerNotasSimulacroAlumno`: no están conectados y apuntan a rutas inexistentes.

---

## 13. Pendientes de Morgan

> Área: integración de pagos / checkout.

- Validar en un entorno con backend actualizado que el botón “Pagar online” recibe `checkoutUrl` y redirige a Mercado Pago.
- Confirmar que el 503 `PASARELA_NO_CONFIGURADA` muestre el aviso correcto y no rompa la pantalla (ya cubierto por prueba).
- Probar “Consultar estado del pago” después de un checkout pendiente, rechazado y aprobado.
- Definir si el botón online debe ocultarse cuando la pasarela no está configurada o mantenerse visible con el aviso de 503. Hoy se mantiene visible y el error se explica.
- Retirar `src/components/PanelPagosAlumno.jsx.morgan.bak` cuando la integración esté consolidada.
- Revisar el script `scripts/integrar-panel-morgan.cjs`: ya cumplió su función, pero puede quedar como herramienta de migración documentada.

---

## 14. Pendientes de Torito

> Área: pasarela real / webhook / infraestructura.

- Configurar credenciales reales de Mercado Pago (`MERCADOPAGO_ACCESS_TOKEN`, `PAYMENT_RETURN_URL`, secreto de webhook).
- Implementar/verificar el webhook firmado y la idempotencia de confirmaciones.
- Definir la URL de retorno a AcadeSys y confirmar que no confirma pagos por parámetros de query.
- Validar el paso de 503 a operativo sin cambios adicionales en el frontend (el frontend ya consume el contrato actual).
- Confirmar que el backend sigue siendo la única fuente de verdad del monto, la moneda y el estado.

---

## 15. Pendientes de Yan

- Ejecutar una prueba E2E manual del portal del alumno con credenciales de una académica de pruebas: cuota pendiente, 503, transferencia manual, referencia, revisión y cuota pagada.
- Coordinar con Morgan/Torito la prueba del checkout real cuando la pasarela esté configurada.
- Decidir si se alinean los tokens visuales con el lineamiento institucional o si se actualiza el lineamiento para reflejar la identidad actual (Archivo / teal / sidebar oscuro).
- Limpiar, con autorización de sus autores, los servicios obsoletos y los archivos de backup/auxiliares.
- Evaluar code-splitting para reducir el chunk principal y revisar las 20 advertencias de lint en una tarea separada.
- Mantener el incremento de `CACHE_NAME` del service worker en cada despliegue para evitar JS antiguo en producción.

---

## Resumen final

### Correcciones realizadas

1. **503 de pasarela**: el frontend ahora muestra “El pago online todavía no está disponible…” en lugar de un error genérico, sin exponer detalles internos.
2. **Consulta de estado**: se conectó `GET /api/alumno/pagos/:id/estado` y se añadió un botón por cuota que refresca el estado real sin confirmar pagos.
3. **Conflicto 409**: al iniciar un checkout sobre una cuota que cambió de estado, el panel refresca la lista y comunica el estado real.
4. **Monto de matrícula**: el navegador ya no envía `monto`; el backend calcula el precio desde la base de datos.
5. **Notas enteras**: el input de `RegistroNotasPage` ya no acepta decimales, alineado con `Evaluacion.Calificacion INT`.
6. **Pruebas**: se añadieron 8 pruebas de contrato del checkout, estado, matrícula y validación de URL.

### Resultados

- **Pruebas:** 137/137 aprobadas, 0 fallos.
- **Build:** exitoso, 1872 módulos; advertencia de chunk > 500 kB (no bloqueante).
- **Lint:** 0 errores, 20 advertencias (una menos que la línea base por limpieza de una variable no usada).
- **Backend:** contratos principales verificados contra `acadesys-api-backend` HEAD `7e0401b`; no se modificó.
- **Seguridad:** el frontend no envía importes ni confirma pagos; el backend sigue siendo la autoridad. La sesión y los permisos se validan en el backend; el frontend solo complementa la autorización visual.

### Conclusión

El frontend queda **estable y correctamente integrado con el backend actualizado** en los flujos auditados. El módulo de pagos conserva la transferencia manual y ahora maneja de forma explícita el 503, la consulta de estado y los conflictos 409. La integración real de Mercado Pago sigue bloqueada por configuración del proveedor (Torito), no por el frontend. Los pendientes restantes son de validación manual, limpieza coordinada y decisión visual, no defectos críticos del código actual.
