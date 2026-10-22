# Logos de universidades

Logos **oficiales** usados por la tarjeta de ciclo (`AcademicoPage`, vista
`#/ciclos`) para reemplazar el icono de toga (`GraduationCap`). El nombre del
archivo debe coincidir con la clave (en minúsculas) definida en
`src/utils/universidadCiclo.js`; el código los descubre automáticamente.

## Archivos incluidos

| Universidad                              | Clave   | Archivo                    |
| ---------------------------------------- | ------- | -------------------------- |
| Universidad Nacional Mayor de San Marcos | `unmsm` | `unmsm.svg`                |
| Universidad Nacional de Ingeniería       | `uni`   | `uni.svg`                  |
| Pontificia Universidad Católica del Perú | `pucp`  | `pucp.svg`                 |
| Universidad Nacional Federico Villarreal | `unfv`  | `unfv.png`                 |
| Universidad Nacional del Callao          | `unac`  | `unac.png`                 |
| Universidad Nacional de Trujillo         | `unt`   | `unt.png`                  |

## Fuente y licencia de cada logo

| Clave   | Fuente exacta                                                                                      | Licencia      |
| ------- | -------------------------------------------------------------------------------------------------- | ------------- |
| `unmsm` | `https://www.trilce.edu.pe/static/images/academia/svg/logo-unmsm.svg` (aportado por el usuario)     | Uso provisto por el usuario |
| `uni`   | `https://www.trilce.edu.pe/static/images/academia/svg/logo-uni.svg` (aportado por el usuario)       | Uso provisto por el usuario |
| `pucp`  | `https://www.trilce.edu.pe/static/images/academia/svg/logo-pucp.svg` (aportado por el usuario)      | Uso provisto por el usuario |
| `unfv`  | Wikimedia Commons — `File:Escudo UNFV.png` → `https://upload.wikimedia.org/wikipedia/commons/4/4f/Escudo_UNFV.png` | CC BY-SA 4.0 (Universidad Nacional Federico Villarreal) |
| `unac`  | Wikimedia Commons — `File:Universidad-nacional-del-callao.png` → `https://upload.wikimedia.org/wikipedia/commons/1/13/Universidad-nacional-del-callao.png` | CC BY-SA 4.0 (Universidad Nacional del Callao) |
| `unt`   | Wikimedia Commons — `File:Universidad Nacional de Trujillo - Perú vector logo.png` → `https://upload.wikimedia.org/wikipedia/commons/6/6e/Universidad_Nacional_de_Trujillo_-_Per%C3%BA_vector_logo.png` | Dominio público |

> Los tres SVG (`unmsm`, `uni`, `pucp`) fueron **aportados explícitamente por el
> usuario** desde `trilce.edu.pe`. Se guardan como assets locales: la aplicación
> **no** carga `trilce.edu.pe` en runtime. Si esos archivos no se desean por
> licencia, basta con reemplazarlos por otro archivo con el mismo nombre.

## Reglas

- El logo se muestra dentro de un contenedor cuadrado de 44×44 px con
  `object-contain` (no se recorta ni se deforma, conserva su relación de
  aspecto). Los escudos con proporciones distintas se centran y equilibran solos.
- Los escudos traen su propio fondo/colores: **no** se les aplican filtros ni se
  recolorean. Por eso se muestran **sin** el recuadro azul del icono de toga.
- Mientras una universidad no tenga logo (o la imagen falle), la tarjeta muestra
  el `GraduationCap` como *fallback* seguro.

## Logos agregados para el catálogo demo (2026-10)

Estos logos se descargaron de Wikimedia Commons y se guardan como assets
locales (la aplicación NO hace peticiones a Wikimedia en runtime).

| Clave   | Archivo    | Archivo de origen en Commons                                | Licencia                |
| ------- | ---------- | ----------------------------------------------------------- | ----------------------- |
| `unalm` | `unalm.png` | `File:Unalm logo.png` (autoría: UNALM)                        | Dominio público         |
| `ulima` | `ulima.svg` | `File:Universidad de Lima logo.svg` (autoría: Supertoni123)   | CC0 1.0                 |
| `upc`   | `upc.png`   | `File:UPC logo transparente.png` (autoría: UPC)               | Dominio público         |
| `utp`   | `utp.png`   | `File:UTP-logo.svg` (autoría: Lamder), rasterizado a 960 px  | Dominio público         |
| `usmp`  | `usmp.png`  | `File:Universidad San Martin.svg` (autoría: CD Universidad de San Martín de Porres S.A.), rasterizado a 250 px | Dominio público |

Universidades **sin asset** (no se inventa ningún escudo; la tarjeta se
muestra sin marca de agua):

| Clave  | Motivo                                                                                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `upch` | En Commons los únicos ficheros con "UPCH" en el nombre pertenecen a **otra institución**: `File:EscudoUPCH.jpg` es el escudo de una universidad de Tabasco (México) y `File:Escudo UPCH.png` es de "Universidad Popular". No se usan para no atribuir un escudo ajeno a la UPCH peruana. |

## Uso como marca de agua

- La marca de agua de la tarjeta de ciclo la decide la **UNIVERSIDAD**
  (`src/utils/universidadCiclo.js`), nunca el nombre del ciclo.
- Se renderiza como `<img>` decorativo dentro de la tarjeta
  (`src/components/MarcaUniversidad.jsx`): `alt=""`, `aria-hidden="true"`,
  `pointer-events-none`, opacidad entre 4 % y 8 % y tamaño `w-28`–`w-44`.
- Cada universidad tiene su propia configuración (`opacidad`, `ancho` y
  `posicion`) en `UNIVERSIDADES[clave].marca`; por ejemplo, el asset horizontal
  de UNFV va más bajo y pegado al borde para no cruzar la columna
  HORARIO/CURSOS.
- Si la universidad no tiene asset, no se renderiza ninguna imagen (fallback
  limpio, sin imágenes rotas).
