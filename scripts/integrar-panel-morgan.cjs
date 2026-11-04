'use strict';

const fs = require('node:fs');
const path = require('node:path');

const archivoPanel = path.resolve(process.cwd(), 'src/components/PanelPagosAlumno.jsx');
const archivoApi = path.resolve(process.cwd(), 'src/services/api.js');
const archivoApiOnline = path.resolve(process.cwd(), 'src/services/pagosOnline.api.js');
const archivoBoton = path.resolve(process.cwd(), 'src/components/BotonPagoOnline.jsx');

for (const archivo of [archivoPanel, archivoApi, archivoApiOnline, archivoBoton]) {
  if (!fs.existsSync(archivo)) {
    console.error(`No se encontró ${path.relative(process.cwd(), archivo)}. Ejecuta este script desde la raíz del frontend.`);
    process.exit(1);
  }
}

let panel = fs.readFileSync(archivoPanel, 'utf8');
const nombreImport = "import BotonPagoOnline from './BotonPagoOnline.jsx';";
const codigoBoton = `\n                        <BotonPagoOnline\n                          idPago={id}\n                          disabled={bloqueada}\n                          onBusyChange={(ocupadoOnline) => {\n                            envioEnCursoRef.current = ocupadoOnline;\n                            setAccion(ocupadoOnline ? \`checkout-\${id}\` : null);\n                          }}\n                        />\n`;

if (panel.includes(nombreImport) && panel.includes('<BotonPagoOnline')) {
  console.log('PanelPagosAlumno.jsx ya contiene el botón online. No se realizaron cambios.');
  process.exit(0);
}

if (!panel.includes("import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';")) {
  console.error('No coincide el import de React esperado. No se modificó el panel.');
  process.exit(1);
}

const anclaImport = "import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';";
panel = panel.replace(anclaImport, `${anclaImport}\n${nombreImport}`);

const anclaBoton = /(\{!cuota\.pagado && !cuota\.enRevision && \(\s*<div className="mt-4 border-t border-slate-100 pt-4">\s*)/;
if (!anclaBoton.test(panel)) {
  console.error('No se encontró el bloque de cuotas pendientes esperado. No se guardó el panel.');
  process.exit(1);
}
panel = panel.replace(anclaBoton, `$1${codigoBoton}`);

const backup = `${archivoPanel}.morgan.bak`;
if (!fs.existsSync(backup)) fs.copyFileSync(archivoPanel, backup);
fs.writeFileSync(archivoPanel, panel, 'utf8');
console.log('Integración completada: se añadió BotonPagoOnline y se creó un respaldo .morgan.bak.');
