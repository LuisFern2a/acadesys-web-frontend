# Informe de correcciones del frontend AcadeSys

## Resultado: LISTO CON OBSERVACIONES

Las correcciones están implementadas en el árbol de trabajo, sin commit ni push. El build termina correctamente y las **28 pruebas automatizadas pasan**. Lint termina con código 0, sin errores, pero conserva **17 advertencias `react(set-state-in-effect)`**. No se ejecutaron pruebas autenticadas en navegador ni operaciones contra la base de datos publicada: quedan pendientes antes del despliegue.

## Alcance y estado Git

| Repositorio | Estado inicial registrado | Estado de entrega |
| --- | --- | --- |
| `acadesys-web-frontend` | Limpio; `main`; `e5b51772f8fe43527dcc782811ecf704b6ef458d` | Misma rama y commit, con cambios locales para revisión |
| `acadesys-api-backend` | Limpio; `main`; `44521d086a9e272e1741ea350cac9a5b2232df90` | Limpio; misma rama y commit; sin modificaciones |

No se ejecutaron pull, cambio de rama, commit ni push. No se cambiaron dependencias, lockfile, configuración de Tailwind/Vite, rutas del backend, nombres de tablas/campos ni credenciales. No hay cambios versionados en `.env`, `node_modules` o artefactos generados. Se conservaron el framework, la navegación por vistas y la identidad visual existente.

## Archivos modificados o añadidos

- `package.json`: únicamente incorpora el comando `test`, usando el runner incluido en Node.
- `src/App.jsx`: pasa la sesión a Gestión Académica para mostrar acciones según el rol real.
- `src/services/api.js`: normalizadores, sesión unificada, errores con status, ciclos de gestión, overview administrativo y caché breve del expediente.
- `src/hooks/useModalDialog.js` **(nuevo)**: foco inicial, Tab/Shift+Tab, Escape, restauración del foco y bloqueo/restauración del scroll.
- `src/utils/calificaciones.js` **(nuevo)**: promedios sin valores vacíos y escalas por universidad.
- `src/components/DashboardLayout.jsx`: campana con lecturas reales y accesibilidad del menú.
- `src/components/ModalMiPerfil.jsx`: validación, bloqueo de doble envío y guardado únicamente de datos soportados.
- `src/components/OfflineFallback.jsx`: aviso sin desmontar los formularios.
- `src/pages/AcademicoPage.jsx`: ciclos, Aulas, permisos de escritura, bloqueo de operaciones y formularios accesibles.
- `src/pages/AdminMaterialesPage.jsx`: PDF, límites, estados de carga y cambios de ciclo seguros.
- `src/pages/AsistenciaPage.jsx`: fecha local, bloqueo de fechas futuras, sincronización por ciclo/fecha y doble envío.
- `src/pages/CalificacionesPage.jsx`: promedio, tipos válidos, ranking y carreras de carga.
- `src/pages/ComunicadosPage.jsx`: validación, publicación/lectura protegidas contra duplicación y diálogo accesible.
- `src/pages/DashboardOverviewPage.jsx`: métricas del endpoint agregado real.
- `src/pages/LandingPage.jsx`: login único, disponibilidad, precios reales, matrícula y respuestas obsoletas.
- `src/pages/MorosidadPage.jsx`: ciclos internos, carreras de carga y bloqueo de actualización concurrente.
- `src/pages/OpcionesMenuPage.jsx`: bloqueo de doble envío y diálogo accesible.
- `src/pages/PerfilesPage.jsx`: bloqueo de operaciones concurrentes y diálogo accesible.
- `src/pages/RegistroNotasPage.jsx`: escala válida, notas vacías, decimales, promedio y reconciliación del guardado.
- `src/pages/StudentIntranetPage.jsx`: expediente compartido, actualización forzada, promedios y escala visible.
- `src/pages/TutorIAPage.jsx`: expediente compartido, contexto del servidor y solicitudes explícitas/bloqueadas.
- `src/pages/UsuariosPage.jsx`: correo, nombres/apellidos, protección de la cuenta propia y formularios.
- `tests/contrato-api.test.js` **(nuevo)**: pruebas con fetch y almacenamiento simulados; sin acceso a la red.
- `INFORME_CORRECCIONES_FRONTEND.md` **(nuevo)**: este informe.

## Bugs corregidos: problema, solución y comprobación

Las pruebas **A** son automatizadas y ya se ejecutaron. Las comprobaciones **M** se detallan en la sección manual y **no se han ejecutado en navegador**.

| Problema | Solución | Archivo principal | Cómo comprobar |
| --- | --- | --- | --- |
| Vacíos/null contaban como cero en promedios | Excluir ausencias y conservar el cero real; mostrar `—` sin notas | `RegistroNotasPage.jsx`, `CalificacionesPage.jsx`, `StudentIntranetPage.jsx`, `calificaciones.js` | A: promedio con `[0, '', null, 20] = 10`; M1 |
| `Number(null)` habilitaba una escala inexistente | Normalizar la escala y exigir valor finito mayor que cero; no adivinar la escala de registro | `api.js`, `RegistroNotasPage.jsx` | A: escala nula sigue siendo null, cadena `2000` se normaliza; M1 |
| Escalas auxiliares sensibles a mayúsculas o espacios | Mapa compartido, conservando los máximos del contrato de notas | `calificaciones.js`, intranet y Tutor IA | A: UNMSM/UNI 2000, PUCP/UNFV 1000, UNAC 100, UNT 300, Preuniversitario 20 |
| Registro impedía decimales que acepta la API | Entrada decimal con punto/coma, hasta dos decimales y validación del rango | `RegistroNotasPage.jsx` | M1: `12,5`, cero, máximo y valor mayor que el máximo |
| Borrar una nota guardada se omitía silenciosamente | Bloquear el guardado con explicación explícita; la API también rechaza una actualización vacía | `RegistroNotasPage.jsx`, `api.js` | A: update vacío rechazado, cero enviado por PUT; M1 |
| Reintentos podían duplicar escrituras; fallos parciales podían recargarse antes de terminar | Candados síncronos; esperar todos los PUT antes de reconciliar; no anunciar sincronización si la lectura falla | `RegistroNotasPage.jsx` y formularios de gestión | A: status 409 conservado; M1, M2, M3 |
| Buscar en el ranking modificaba el puesto | Calcular puesto y empates en la lista completa, filtrar después | `CalificacionesPage.jsx` | M1: buscar al segundo alumno; debe seguir segundo |
| Tipos de evaluación del ranking no coincidían con el catálogo de escritura | Usar Simulacro, Examen, Practica y Evaluacion; mantener la opción Todos | `CalificacionesPage.jsx` | M1: revisar filtros y registros persistidos |
| Páginas internas dependían exclusivamente de la vitrina pública | Intentar ciclos administrativos; fallback público solo por 403/404, sin ocultar errores 5xx | `api.js`, notas, ranking, materiales, asistencia y morosidad | A: admin, fallback 403 y rechazo 500; M2, M3, M4 |
| Se pedían tipo/modalidad/periodo de ciclo sin persistencia | Retirar esos controles y enviar solo campos soportados; conservar el periodo de evaluaciones, que sí existe | `AcademicoPage.jsx`, `api.js` | A: payload create/update sin esos tres campos; M2 |
| Aulas estaba implementado pero sin pestaña visible | Habilitar la pestaña dentro de Gestión Académica | `AcademicoPage.jsx` | M2: abrir Aulas y ejecutar CRUD autorizado |
| Enter en el asistente de ciclos invocaba el guardado genérico | Dirigir el submit al paso siguiente o al guardado de ciclo | `AcademicoPage.jsx` | M2: Enter no debe cerrar ni descartar el formulario |
| Editar ciclo tras un fallo de detalle podía enviar cursos vacíos | No abrir edición si no se pudieron consultar las relaciones; descartar detalles obsoletos | `AcademicoPage.jsx` | M2: simular fallo y respuestas en orden inverso |
| Docentes/tutores veían acciones académicas que requieren administrador | Mostrar las escrituras solo para administrador; mantener consultas permitidas | `App.jsx`, `AcademicoPage.jsx` | M2 con cuentas de administrador, docente y tutor |
| Materiales podían quedar vacíos por diferencias de nombres de campos | Normalizar PascalCase/camelCase y listas envueltas en el servicio | `api.js`, `AdminMaterialesPage.jsx` | A: material con IdMaterial/Titulo/Curso; M3 |
| PDF sin MIME, vacío, demasiado grande o respuesta 413 producía mala UX | Aceptar MIME/extensión PDF y comprobar cabecera `%PDF-`; validar 0/10 MB; explicar 413 incluso si viene como HTML | `AdminMaterialesPage.jsx`, `api.js` | A: transporte Base64 y 413 HTML; M3 |
| Cambios rápidos de ciclo/fecha podían sobrescribir la vista actual | Identificar cada solicitud y descartar respuestas anteriores; vaciar datos dependientes al cambiar selección | Notas, ranking, materiales, asistencia, morosidad y landing | M4 con red lenta y respuesta invertida |
| Asistencia permitía fechas futuras y podía guardar datos de otra selección | Máximo hoy en fecha local, validación antes de consultar/guardar y clave de datos ciclo/fecha | `AsistenciaPage.jsx` | M4: hoy, fecha vacía, futura y cambio rápido de ciclo |
| Lectura/publicación de comunicados podía enviarse repetidamente | Candados por operación/ID; título 3–180 y contenido 1–10 000; notificar actualización de lecturas | `ComunicadosPage.jsx` | M5 con doble clic, texto inválido y fallo HTTP |
| Campana mostraba siempre un punto | Calcularlo con `confirmado`/`leido`; refrescar tras publicación/lectura, evitando respuestas obsoletas | `DashboardLayout.jsx`, `api.js` | A: flags `0`, `1`, `'0'`, `'1'`; M5 |
| Actualizaciones concurrentes de pago podían invertirse | Bloqueo síncrono; ciclo fijo mientras se actualiza; conservar la protección de inscripción pendiente | `MorosidadPage.jsx` | A: API solo acepta Pagado/Moroso; M6 |
| Validación de correo rechazaba dominios válidos; apellido materno no era editable | Validación general de correo, apellido materno opcional y conservación en payload | `UsuariosPage.jsx`, `api.js` | A: payload de apellido materno; M7 |
| Operaciones sobre la cuenta propia podían quitar el acceso | Impedir autodesactivación, autoeliminación y cambio del propio perfil | `UsuariosPage.jsx` | M7 con cuenta administradora propia |
| Landing duplicaba login y recortaba la contraseña; `usuario` podía tratarse como objeto | Una función de login; sesión a partir de `user` y nombre desde `usuario`; conservar clave exacta; validar portal por rol | `api.js`, `LandingPage.jsx` | A: sesión válida sin token duplicado y clave con espacios; M8 |
| Se ocultaban precios 0 y 1 asumiendo que eran relleno | Mostrar importes reales no negativos; respetar disponibilidad tanto en tarjeta como al abrir inscripción | `LandingPage.jsx` | M8: precios 0/1, cupo agotado y capacidad sin límite según backend |
| Verificación de correo/detalle podía actualizar un formulario ya cambiado o cerrado | Secuencias de solicitud y candado de checkout antes de verificar; retirar espera artificial de dos segundos | `LandingPage.jsx` | M4, M8 |
| App/intranet/Tutor repetían el expediente al arrancar | Compartir petición/respuesta durante 10 s por token, limpiar en logout/cambio de sesión y permitir actualización forzada | `api.js`, `StudentIntranetPage.jsx`, `TutorIAPage.jsx` | A: concurrencia, cambio de token directo y refresh; M9 |
| Tutor enviaba carrera/contexto inventado y solicitaba diagnóstico automáticamente al montar | Enviar solo la pregunta; expediente resuelto por JWT en backend; diagnóstico explícito y candados de envío | `api.js`, `TutorIAPage.jsx` | A: payload contiene solo pregunta; M9 |
| Perfil ofrecía un botón de guardado en pestañas sin persistencia | Mostrar Guardar únicamente para datos personales; validar correo/teléfono y evitar doble envío | `ModalMiPerfil.jsx` | M10: guardar datos, reabrir; foto solo vista previa; seguridad/preferencias no guardables |
| Los diálogos no retenían/restauraban el foco | Hook común, Escape, Tab/Shift+Tab, roles y scroll; etiquetas de usuario y nota accesibles | `useModalDialog.js` y diálogos | M10 usando teclado y móvil |
| Perder conexión desmontaba la aplicación y descartaba formularios | Banner que conserva los componentes y no promete persistencia offline | `OfflineFallback.jsx` | M10: escribir, desconectar/reconectar sin recargar |
| Mensajes HTTP perdían status y había texto mal codificado | Preservar status/datos en errores 4xx, explicar red/413 y corregir textos visibles; 401 limpia sesión y 403 no | `api.js` | A: 401/403/409/413/500 y desconexión |

## Integración con el backend: decisiones conservadas

- No se inventó `DELETE /api/notas/:id`. Crear notas sigue usando `POST /api/notas`; actualizar usa `PUT /api/notas/:id` con `Calificacion`. Vaciar una nota persistida no está soportado y se informa al usuario.
- Ciclos usan las rutas existentes de `/api/admin/ciclos`. La visibilidad sigue cambiándose mediante el PATCH existente, separado del PUT. No se cambió el modelo de eliminación.
- Docentes/tutores no adquieren permisos administrativos: el fallback de lectura no cambia las comprobaciones del backend.
- El dashboard administrativo consulta `GET /api/admin/dashboard/overview`: estudiantes, ciclos activos, morosidad, promedio normalizado /20 y rendimiento por ciclo. No se agregan pagos silenciosamente ni se presentan errores como métricas cero.
- Materiales conservan **JSON con `fileData` Base64** en `POST /api/materiales`; no se introdujo multipart/FormData. El límite de PDF sigue siendo 10 MB. Un proxy puede rechazar antes con 413; no se modificó su configuración.
- Pagos siguen usando `GET /api/pagos/ciclo/:idCiclo` y `PUT /api/pagos/:id/estado`, con estados exactos `Pagado`/`Moroso`. La inscripción pendiente no se confirma como si hubiera sido pagada por una pasarela.
- Lectura de comunicados sigue usando `PUT /api/comunicados/:id/lectura`.
- Perfil propio usa las rutas existentes `/api/usuarios/me` y su allowlist de datos personales, nunca una modificación de rol/academia/estado/clave por autoservicio.
- La matrícula de landing sigue siendo **simulada**, con pago pendiente; no se presenta como cobro real. No se probó el envío de correo.
- Normalización de listas centralizada para perfiles, usuarios/directorio, aulas, cursos, asignaciones, horarios, asistencia, notas, ciclos, materiales, pagos y comunicados; las mutaciones conservan los nombres de campos exigidos por cada endpoint.

## Validaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **28/28**, 0 fallos, sin peticiones reales ni modificaciones de BD |
| `npm run build` | **Correcto**; bundle JS aproximado 630 kB / 160 kB gzip; aviso de chunk mayor de 500 kB |
| `npm run lint` | Código 0; **0 errores y 17 advertencias** `react(set-state-in-effect)` |
| Revisión de `git diff` | Revisadas integración, payloads, permisos, escrituras, conservación de estilos y alcance de archivos |
| `git diff --check` | Sin errores de whitespace; Git avisa conversión LF/CRLF en Windows |
| Backend | Árbol limpio, sin modificaciones |

En este entorno Windows el shim `npm` lanzado directamente desde bash falla con `/usr/bin/env: bash`. Se ejecutaron los mismos scripts correctamente mediante:

```text
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" test
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run build
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run lint
```

Las pruebas cubren normalizadores, cero/null, escalas, sesión, JWT, errores, fallback por rol, overview, payloads de ciclos/PDF/notas/pagos/IA/usuarios y aislamiento del caché por sesión. No equivalen a pruebas E2E, de rendimiento ni a una conexión autenticada con la API desplegada.

## Comprobaciones manuales pendientes

Realizarlas en un entorno de prueba con cuentas y datos autorizados, no creando/eliminando registros de producción para probar.

- **M1 — Notas y ranking:** escalas 20/100/300/1000/2000; vacío, cero, decimal, máximo y excedido; crear/editar; intentar vaciar una nota persistida; doble clic; simular 409 y fallo parcial. Buscar un alumno sin cambiar su puesto ni los empates.
- **M2 — Académico:** crear/editar ciclo y volver a consultarlo, publicación mediante PATCH, cursos asociados; Enter en cada paso; nombre duplicado 409; CRUD de Aulas/cursos/horarios/carga docente; errores de relaciones y permisos de docente/tutor.
- **M3 — Materiales:** PDF válido, MIME vacío con extensión válida, archivo falso `.pdf`, vacío, exactamente 10 MB y mayor de 10 MB; 413 JSON/HTML; doble envío; descarga del PDF persistido y eliminación autorizada.
- **M4 — Carreras:** con red lenta, cambiar A→B→A en materiales/asistencia/morosidad/ranking; cambiar fecha; cerrar detalle público durante una petición. La última selección debe prevalecer. Comprobar fecha vacía/futura.
- **M5 — Comunicados:** publicación con textos límites; confirmar lectura, recargar y comprobar persistencia; campana sin falso punto; doble clic y errores; leer con distintos perfiles.
- **M6 — Finanzas:** comparar con BD/endpoint; actualizar Pagado/Moroso y recargar; confirmar que una inscripción pendiente y una fila sin IdPago no se pueden validar como un cobro real.
- **M7 — Usuarios/roles/menús:** correo con dominio válido distinto de Gmail, DNI inválido, nombres con tildes/guion/apóstrofo, apellido materno opcional; conflictos 409; propia cuenta protegida; roles activos/inactivos y permisos de navegación; reintento de asignación de menú sin recrearlo.
- **M8 — Landing/login:** accesos por rol correcto/incorrecto, usuario/correo/DNI/código, clave exacta, credenciales inválidas; ciclo lleno desde tarjeta y detalle; precios 0/1; matrícula/reinscripción simulada, correo cambiado y 409.
- **M9 — Alumno/IA:** login y recarga; una petición compartida de expediente durante arranque; Actualizar fuerza lectura; cambio de cuenta sin datos cruzados; sin ciclo/sin notas/nota cero; Tutor envía solo pregunta y muestra fallos del proveedor sin inventar respuesta.
- **M10 — UX:** teclado completo en cada modal, Escape, foco de retorno, scroll móvil, errores/success; editar perfil y reabrir; desconectar/reconectar sin perder un formulario ni anunciar guardado offline.

## Observaciones y límites no modificados

1. **Advertencias de React:** quedan 17 avisos de actualizaciones de estado iniciadas en efectos de carga/sincronización. No se desactivaron reglas ni se introdujeron temporizadores para esconderlos. Se corrigieron los avisos detectados de dependencia de hooks e inmutabilidad del ranking; una refactorización general del patrón de carga requiere revisión adicional.
2. **Tamaño del bundle:** Vite advierte un chunk superior a 500 kB. No se cambiaron límites para silenciarlo ni se hizo una migración de navegación/framework. Code splitting queda como mejora independiente.
3. **Funciones sin soporte de API:** eliminar notas persistidas, foto de perfil persistente, preferencias y cambio de contraseña propia validando clave actual no se implementan con rutas inventadas. Se bloquean o se indican expresamente como no persistentes.
4. **Validación real pendiente:** no se verificaron navegador, accesibilidad con lector de pantalla, correo, proveedor IA, proxy de uploads, caché PWA desplegado ni persistencia contra una BD de prueba. Los resultados automatizados se basan en respuestas simuladas compatibles con las rutas locales revisadas.
5. **Reglas del servidor:** cierres de periodo, autorización, cuotas, conflictos por concurrencia entre navegadores y comportamiento de eliminación siguen siendo responsabilidad del backend. Los candados del cliente no sustituyen transacciones ni restricciones de BD.
6. **Promedios institucionales:** se respeta el agregado del backend, incluido su criterio de normalización y ponderación. No se cambia la fórmula en el servidor desde el frontend.

**Entrega para revisión: LISTO CON OBSERVACIONES.** Antes de desplegar, completar M1–M10 y revisar los avisos anteriores. Los cambios permanecen sin commit ni push.
