// Helpers puros del perfil del alumno (sin React ni acceso a red).
// Se mantienen aquí para poder probarlos de forma aislada.

// Normaliza el código del alumno a UNA sola forma "ACAD-xxxx".
// Acepta valores con o sin prefijo e incluso con prefijos duplicados.
export const normalizarCodigoAlumno = (valor) => {
  const codigo = String(valor ?? '').trim();
  if (!codigo) return '';
  const limpio = codigo.replace(/^(?:ACAD-)+/i, '');
  return limpio ? `ACAD-${limpio}` : 'ACAD-';
};

// Devuelve "No registrado" solo para null/undefined/"".
// Conserva 0 y false, que son valores válidos.
export const valorTexto = (valor, vacio = 'No registrado') => {
  if (valor === null || valor === undefined) return vacio;
  if (typeof valor === 'string' && valor.trim() === '') return vacio;
  return valor;
};

// Resuelve la URL de la foto contra el origen real del backend.
// - URLs absolutas (http/https/data/blob) se conservan intactas.
// - Rutas relativas (/uploads/...) se unen al origen, sin duplicar /api.
export const resolverUrlFoto = (fotoUrl, apiUrl = '') => {
  if (fotoUrl === null || fotoUrl === undefined) return null;
  const valor = String(fotoUrl).trim();
  if (!valor) return null;
  if (/^(?:https?:|data:|blob:)/i.test(valor)) return valor;

  const base = String(apiUrl || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  if (!base) return valor.startsWith('/') ? valor : `/${valor}`;
  return `${base}${valor.startsWith('/') ? valor : `/${valor}`}`;
};


