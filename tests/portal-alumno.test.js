import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const leer = (ruta) => readFileSync(join(raiz, ruta), 'utf8');

test('App conserva y entrega el expediente completo a StudentIntranetPage', () => {
  const app = leer('src/App.jsx');
  assert.match(app, /const \[studentData, setStudentData\] = useState\(null\)/);
  assert.match(app, /obtenerMiIntranetAlumno\(\)/);
  assert.match(app, /expediente=\{studentData\}/);
  assert.match(app, /onRefresh=\{refrescarExpedienteAlumno\}/);
});

test('el portal implementa las vistas declaradas en el menú del alumno', () => {
  const pagina = leer('src/pages/StudentIntranetPage.jsx');
  for (const vista of [
    'student-home',
    'student-ciclo',
    'student-horario',
    'student-cursos',
    'student-notas',
    'student-materiales',
    'student-pagos',
    'student-perfil',
  ]) {
    assert.ok(pagina.includes(vista), `Falta implementar la vista ${vista}`);
  }
  assert.match(pagina, /<PanelPagosAlumno \/>/);
  assert.match(pagina, /<ModalMiPerfil/);
});

test('Mis pagos no depende de que el expediente tenga ciclo ni de que termine de cargar', () => {
  const pagina = leer('src/pages/StudentIntranetPage.jsx');
  const pagos = pagina.indexOf('if (view === VIEWS.pagos) {');
  const renderPago = pagina.indexOf('<PanelPagosAlumno />');
  const carga = pagina.indexOf('if (loading && !expediente)');
  assert.ok(pagos >= 0 && renderPago > pagos, 'Debe existir el render directo de pagos');
  assert.ok(pagos < carga, 'Pagos debe resolverse antes de la pantalla de carga del expediente');
});

test('no quedan marcadores provisionales en las vistas del portal del alumno', () => {
  const pagina = leer('src/pages/StudentIntranetPage.jsx');
  for (const marcador of [
    'Aquí conectarás el componente',
    'Vista de los cursos matriculados en la semana.',
    'Materiales y sílabos del ciclo actual.',
    'Bienvenido a la Intranet',
  ]) {
    assert.equal(pagina.includes(marcador), false, `Quedó el marcador: ${marcador}`);
  }
});

test('la vista de resultados consume historial, promedio y ranking del expediente', () => {
  const pagina = leer('src/pages/StudentIntranetPage.jsx');
  assert.match(pagina, /notas\.promedioGeneral/);
  assert.match(pagina, /notas\.puestoRanking/);
  assert.match(pagina, /notas\.totalEvaluaciones/);
  assert.match(pagina, /notas\.historial/);
});
