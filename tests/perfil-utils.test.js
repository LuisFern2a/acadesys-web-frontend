import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarCodigoAlumno,
  resolverUrlFoto,
  valorTexto,
} from '../src/utils/perfil.js';

test('normalizarCodigoAlumno agrega el prefijo una sola vez', () => {
  assert.equal(normalizarCodigoAlumno('1134'), 'ACAD-1134');
  assert.equal(normalizarCodigoAlumno('ACAD-1134'), 'ACAD-1134');
  assert.equal(normalizarCodigoAlumno('acad-1134'), 'ACAD-1134');
  assert.equal(normalizarCodigoAlumno('ACAD-ACAD-1134'), 'ACAD-1134');
  assert.equal(normalizarCodigoAlumno('  1134  '), 'ACAD-1134');
});

test('normalizarCodigoAlumno no inventa código cuando el valor está vacío', () => {
  assert.equal(normalizarCodigoAlumno(''), '');
  assert.equal(normalizarCodigoAlumno(null), '');
  assert.equal(normalizarCodigoAlumno(undefined), '');
  assert.equal(normalizarCodigoAlumno('   '), '');
});

test('valorTexto solo reemplaza null, undefined y cadenas vacías', () => {
  assert.equal(valorTexto(null), 'No registrado');
  assert.equal(valorTexto(undefined), 'No registrado');
  assert.equal(valorTexto(''), 'No registrado');
  assert.equal(valorTexto('   '), 'No registrado');
  assert.equal(valorTexto(0), 0);
  assert.equal(valorTexto(false), false);
  assert.equal(valorTexto('Jessenia'), 'Jessenia');
});

test('resolverUrlFoto une rutas relativas al origen real del backend', () => {
  assert.equal(
    resolverUrlFoto('/uploads/perfiles/foto.webp', 'https://api.acadesys.com/api'),
    'https://api.acadesys.com/uploads/perfiles/foto.webp'
  );
  assert.equal(
    resolverUrlFoto('uploads/perfiles/foto.webp', 'https://api.acadesys.com/api/'),
    'https://api.acadesys.com/uploads/perfiles/foto.webp'
  );
  assert.equal(
    resolverUrlFoto('/uploads/perfiles/foto.webp', 'https://api.acadesys.com'),
    'https://api.acadesys.com/uploads/perfiles/foto.webp'
  );
});

test('resolverUrlFoto conserva URLs absolutas y devuelve null sin foto', () => {
  assert.equal(resolverUrlFoto('https://cdn.test/foto.webp', 'https://api.test/api'), 'https://cdn.test/foto.webp');
  assert.equal(resolverUrlFoto('data:image/png;base64,AAA', 'https://api.test/api'), 'data:image/png;base64,AAA');
  assert.equal(resolverUrlFoto('blob:https://app.test/123', 'https://api.test/api'), 'blob:https://app.test/123');
  assert.equal(resolverUrlFoto(null, 'https://api.test/api'), null);
  assert.equal(resolverUrlFoto('', 'https://api.test/api'), null);
});


