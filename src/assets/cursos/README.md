# Iconos de cursos (`src/assets/cursos/`)

Iconografía académica line-art monocromática de **AcadeSys**, usada por
`src/components/CursoIcon.jsx` (una sola fuente de verdad: `src/utils/cursoIcono.js`)
en las pestañas **Cursos Académicos** y **Horarios**.

## Colección

**Tabler Icons** — paquete `@tabler/icons` **v3.31.0**

- Fuente original: <https://github.com/tabler/tabler-icons> · <https://tabler.io/icons>
- Descarga: `https://unpkg.com/@tabler/icons@3.31.0/icons/outline/<icono>.svg`
- **Licencia: MIT** (ver `https://github.com/tabler/tabler-icons/blob/main/LICENSE`).
  Uso libre, incluido comercial, **sin obligación de atribución**; la mención aquí
  es sólo por trazabilidad.
- Estilo: `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`,
  `stroke-linecap/linejoin="round"`, `viewBox="0 0 24 24"`. Monocromáticos: toman
  el color del contenedor (`text-teal-700` de AcadeSys) mediante `currentColor`.
- Sin dependencias nuevas: los archivos se importan localmente con Vite (`?raw`).
  **No hay llamadas a CDNs en runtime.**

## Mapa archivo → icono de la colección

| Archivo local | Icono Tabler | Cursos reales que lo usan |
| --- | --- | --- |
| `quimica.svg` | `flask` | Química |
| `fisica.svg` | `atom` | Física |
| `biologia.svg` | `microscope` | Biología |
| `matematica.svg` | `calculator` | Matemática |
| `aritmetica.svg` | `math-symbols` | Aritmética |
| `algebra.svg` | `variable` | Álgebra |
| `geometria.svg` | `compass` | Geometría |
| `trigonometria.svg` | `angle` | Trigonometría |
| `logico-matematica.svg` | `math-function` | Habilidad Lógico-Matemática, Razonamiento Matemático |
| `verbal.svg` | `book-2` | Habilidad Verbal, Razonamiento Verbal, Comprensión Lectora (RV) |
| `lenguaje.svg` | `letter-case` | Lenguaje |
| `comunicacion.svg` | `message-2` | Comunicación |
| `literatura.svg` | `feather` | Literatura |
| `historia.svg` | `building-monument` | Historia, Historia del Perú y Universal |
| `geografia.svg` | `world` | Geografía |
| `economia.svg` | `chart-line` | Economía |
| `filosofia.svg` | `bulb` | Filosofía |
| `psicologia.svg` | `brain` | Psicología |
| `civica.svg` | `scale` | Educación Cívica |

Los archivos se guardan **tal cual se publican** (sin editar); el ajuste de tamaño
a la caja del icono se hace en runtime, no en el asset.


