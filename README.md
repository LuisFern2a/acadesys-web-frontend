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

- Autenticación y gestión de usuarios.
- Matrícula de estudiantes.
- Checkout y simulación de pago.
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

- Registrar los datos del estudiante.
- Validar la información ingresada.
- Seleccionar el ciclo correspondiente.
- Simular la validación del método de pago.
- Mostrar estados de carga durante la operación.
- Procesar la matrícula mediante la API.
- Informar visualmente sobre operaciones exitosas o errores.

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

AcadeSys es desarrollado colaborativamente por un equipo dividido entre las áreas de Frontend y Backend.

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

### Luis

**Frontend Developer**

Participación en el desarrollo e integración del frontend de AcadeSys.

### Dante

**Frontend Developer**

Participación en el desarrollo de las interfaces y componentes frontend de AcadeSys.

---

## Backend

### Morgan

**Backend Developer**

Participación en el desarrollo de los servicios y lógica backend utilizados por AcadeSys.

### Gabriel

**Backend Developer**

Participación en el desarrollo de los servicios y lógica backend utilizados por AcadeSys.

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
- Luis
- Dante

### Backend

- Morgan
- Gabriel

---

**AcadeSys - Plataforma de Gestión Académica**
