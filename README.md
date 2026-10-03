# AcadeSys

**AcadeSys** es una plataforma web orientada a la gestión académica de una academia preuniversitaria. El proyecto busca centralizar diferentes procesos académicos y administrativos dentro de una aplicación moderna, interactiva y fácil de utilizar.

El sistema fue desarrollado de manera colaborativa, separando las responsabilidades de Frontend y Backend y utilizando Git y GitHub para el control de versiones y la integración del trabajo del equipo.

---

## Demo

La aplicación se encuentra desplegada en:

https://acadesys-web-frontend.vercel.app/

---

## Características principales

AcadeSys integra diferentes módulos para alumnos y personal administrativo:

- Vitrina pública de ciclos académicos (consulta sin necesidad de iniciar sesión).
- Autenticación y gestión de usuarios.
- Matrícula autónoma mediante checkout con pago simulado.
- Gestión académica.
- Simulacros y calificaciones.
- Ranking de estudiantes.
- Repositorio de materiales académicos.
- Panel del alumno.
- Control de pagos y morosidad.
- Tutor pedagógico con Inteligencia Artificial.
- Gestión mediante diferentes roles.
- Interfaz adaptable y moderna.

---

## Panel del Alumno

El alumno dispone de una interfaz desde la cual puede consultar información relacionada con su actividad académica.

Entre las funcionalidades disponibles se encuentran:

- Visualización de calificaciones.
- Historial de simulacros.
- Indicadores visuales según el rendimiento académico.
- Ranking de estudiantes.
- Acceso a materiales educativos.
- Descarga de recursos disponibles.
- Acceso al Tutor Pedagógico IA.

---

## Tutor Pedagógico IA

AcadeSys incorpora una interfaz conversacional que permite al estudiante interactuar con un tutor basado en Inteligencia Artificial.

La interfaz incluye:

- Historial de conversación.
- Envío de mensajes mediante formulario o tecla Enter.
- Indicador visual mientras se procesa una respuesta.
- Auto-scroll hacia los mensajes más recientes.
- Manejo de errores y respuestas alternativas cuando el servicio de IA no está disponible.

---

## Matrícula y Checkout

El sistema incorpora un flujo de inscripción y pago que permite:

- Registrar los datos del estudiante (nombre, apellido y correo electrónico).
- Validar la información ingresada.
- Seleccionar el ciclo correspondiente.
- Simular la validación del método de pago.
- Mostrar estados de carga durante la operación.
- Procesar la matrícula mediante la API.
- Informar visualmente sobre operaciones exitosas o errores.
- Generar automáticamente las credenciales de acceso del estudiante y enviarlas por correo electrónico.

---

## Control de Morosidad

El módulo administrativo permite consultar y gestionar el estado de los pagos registrados.

Incluye:

- Consulta de pagos.
- Filtros por estado: Todos, Al Día y Morosos.
- Búsqueda de estudiantes.
- Indicadores de deuda y estados de pago.
- Cambio rápido entre los estados Pagado y Moroso.
- Actualización optimista de la interfaz.
- Sincronización posterior con el backend.

---

## Tecnologías utilizadas

### Frontend

- React
- JavaScript
- Vite
- Tailwind CSS
- Lucide React
- SweetAlert2
- HTML5
- CSS3

### Backend

El frontend de AcadeSys consume una API REST desarrollada por el equipo Backend.

La comunicación entre ambas capas permite gestionar la información relacionada con usuarios, matrículas, pagos y demás procesos académicos y administrativos del sistema.

### Herramientas de desarrollo

- Git
- GitHub
- Visual Studio Code
- Vercel

---

## Arquitectura general

AcadeSys utiliza una arquitectura separada entre Frontend y Backend.

```text
Frontend (React)
       |
       | HTTP / REST API
       |
       v
Backend
       |
       v
Base de Datos
```

Esta separación permite desarrollar, mantener y desplegar las diferentes capas del sistema de manera independiente.

---

## Estructura del Frontend

```text
acadesys-web-frontend/
|
|-- public/
|
|-- src/
|   |-- components/
|   |-- pages/
|   |-- services/
|   |-- ...
|
|-- package.json
|-- vite.config.js
|-- README.md
```

La capa `services` centraliza la comunicación entre los componentes de React y los servicios proporcionados por el backend.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/LuisFern2a/acadesys-web-frontend.git
```

### 2. Entrar al proyecto

```bash
cd acadesys-web-frontend
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Ejecutar el entorno de desarrollo

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local desde la cual puede abrirse la aplicación.

---

## Compilación para producción

Para generar una versión optimizada de la aplicación:

```bash
npm run build
```

Los archivos resultantes se generarán dentro del directorio `dist`.

---

## Flujo de trabajo con Git

Durante el desarrollo se utiliza un flujo basado en ramas para evitar realizar modificaciones directamente sobre `main`.

Ejemplo:

```text
main
|
|-- feature/nueva-funcionalidad
|-- fix/correccion
|-- developer/actividad
```

Las funcionalidades se desarrollan en ramas independientes y posteriormente se integran mediante Pull Requests.

Este flujo permite mantener estable la rama principal, revisar los cambios antes de integrarlos, reducir conflictos y conservar un historial organizado del desarrollo.

---

# Equipo de Desarrollo

AcadeSys es desarrollado colaborativamente por un equipo dividido entre las áreas de Frontend, Backend y Base de Datos.

## Frontend

### Yan

**Frontend Developer**

Participación en el desarrollo de interfaces, lógica e integración con servicios del sistema.

Principales actividades:

- Desarrollo del Checkout de Matrícula.
- Interactividad del Panel del Alumno.
- Integración y revisión del Tutor Pedagógico IA.
- Desarrollo de funcionalidades del módulo de Morosidad.
- Manejo de estados con React.
- Validación de formularios.
- Manejo de errores.
- Consumo de API REST.
- Actualización optimista de interfaces.
- Trabajo mediante ramas y Pull Requests.

### Dante

**Frontend Developer**

Encargado del diseño de la vitrina pública de ciclos (la página de inicio tipo tienda virtual, al estilo de una academia preuniversitaria), donde cualquier visitante puede consultar los ciclos aperturados, sus turnos, horarios y cursos sin necesidad de iniciar sesión.

Principales actividades:

- Maquetado de la página principal como catálogo de ciclos.
- Diseño del formulario de inscripción/checkout (datos básicos: nombre, apellido y correo).
- Maquetado del flujo de pago simulado (confirmación visual tipo "Pagar con Yape").

### Luis

**Frontend Developer**

Creador y mantenedor original del repositorio de frontend de AcadeSys. Participación en el desarrollo e integración de la interfaz, junto con el diseño de la vitrina de ciclos y el modal de pago simulado.

---

## Backend

### Morgan

**Backend Developer**

Arquitecto principal del backend de AcadeSys. Encargado de la lógica de autenticación, matrícula y pagos, así como de liderar la reestructuración del proyecto hacia un modelo de academia preuniversitaria con flujo de inscripción autónomo (tipo e-commerce educativo).

Principales actividades:

- Diseño e implementación de la autenticación basada en JWT.
- Endpoint público de consulta de ciclos (`GET /api/ciclos/publicos`).
- Endpoint de checkout de matrícula (`POST /api/matriculas/checkout`): registra al alumno, lo matricula en el ciclo elegido y genera sus credenciales de acceso.
- Generación automática de código de usuario y contraseña temporal.
- Envío de correos de bienvenida con las credenciales del alumno (Nodemailer).
- Middleware de cierre de periodo/actas para bloquear la edición de notas tras sellar una evaluación.
- Integración del Tutor Pedagógico IA con la API de Gemini.
- Diseño de la arquitectura para la futura integración de una pasarela de pagos real (MercadoPago / Culqi, mediante webhooks) como evolución del pago simulado actual.

---

## Base de Datos

### Gabriel 

**Database Administrator**

Encargado del diseño y mantenimiento de la base de datos del proyecto en MySQL (Aiven), además de mantener actualizadas las Historias de Usuario del proyecto conforme evoluciona el alcance del producto.

Principales actividades:

- Modelado de las tablas de ciclos, matrículas y pagos.
- Limpieza y ajuste del modelo de datos conforme a la reestructuración del proyecto (de un enfoque multi-academia a una única academia preuniversitaria).
- Carga de datos de prueba (ciclos San Marcos, UNI, entre otros).
- Creación directa de la cuenta maestra de Administrador en la base de datos.
- Actualización de las Historias de Usuario del proyecto.

---

## Metodología de trabajo

El proyecto se desarrolla colaborativamente mediante la separación de responsabilidades entre las diferentes capas del sistema.

```text
Frontend
    |
    v
API REST
    |
    v
Backend
    |
    v
Base de Datos
```

Los integrantes trabajan sobre sus responsabilidades utilizando ramas independientes y posteriormente integran los cambios mediante Pull Requests en GitHub.

---

## Estado del proyecto

AcadeSys se encuentra en desarrollo activo.

El proyecto fue reestructurado durante su desarrollo: partiendo de un modelo inicial más genérico, el equipo lo enfocó hacia la plataforma oficial de una academia preuniversitaria (al estilo de una academia como ADUNI), priorizando un flujo de inscripción autónomo con pago simulado, de cara a mostrar un avance funcional y orientado al usuario final. El Tutor Pedagógico IA quedó temporalmente en pausa durante esta etapa, para concentrar el esfuerzo del equipo en que el flujo principal de matrícula funcione de punta a punta.

Actualmente cuenta con diferentes módulos académicos y administrativos integrados entre el frontend y los servicios proporcionados por el backend.

---

## Contexto académico

AcadeSys fue desarrollado como proyecto académico aplicando conceptos relacionados con:

- Desarrollo Web.
- Ingeniería de Software.
- Diseño de interfaces.
- APIs REST.
- Bases de Datos.
- Programación Frontend.
- Programación Backend.
- Control de versiones.
- Trabajo colaborativo con Git y GitHub.

---

## Autores

### Frontend

- Yan
- Dante
- Luis

### Backend

- Morgan

### Base de Datos

- Gabriel 

---

**AcadeSys - Plataforma de Gestión Académica**
