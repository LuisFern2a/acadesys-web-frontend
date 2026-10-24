import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Prueba estática de contrato del flujo del alumno: el portal del alumno no
// debe consumir el catálogo administrativo de perfiles (GET /api/perfiles).
// No importa componentes de React; solo inspecciona el código fuente real.
const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const leer = (rutaRelativa) => readFileSync(join(raiz, rutaRelativa), 'utf8');

// Se ignoran comentarios para no confundir documentación con código ejecutable.
const sinComentarios = (codigo) =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

test('el layout compartido no importa ni ejecuta obtenerPerfiles', () => {
  const codigo = sinComentarios(leer('src/components/DashboardLayout.jsx'));
  assert.ok(
    !codigo.includes('obtenerPerfiles'),
    'DashboardLayout.jsx no debe importar ni llamar obtenerPerfiles'
  );
});

test('Mi Perfil del alumno no depende de /api/perfiles', () => {
  const codigo = sinComentarios(leer('src/pages/StudentIntranetPage.jsx'));
  assert.ok(!codigo.includes('/api/perfiles'));
  assert.ok(!codigo.includes('obtenerPerfiles'));
});

test('el código del alumno no se concatena dos veces', () => {
  const codigo = leer('src/pages/StudentIntranetPage.jsx');
  assert.ok(!codigo.includes('ACAD-ACAD'));
  assert.ok(!/ACAD-\s*\{/.test(codigo), 'El JSX no debe anteponer ACAD- a una variable ya normalizada');
});


