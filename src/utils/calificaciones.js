// Contrato definitivo del backend: `Evaluacion.Calificacion` es INT.
// Por lo tanto la calificación siempre es un NÚMERO ENTERO dentro de la escala
// del ciclo. No se redondea, no se trunca y no se aceptan decimales.

export const ESTADO_NOTA_VIGENTE = 1;
export const ESTADO_NOTA_ACTA_CERRADA = 2;
export const ESTADO_NOTA_BAJA = -1;

// Normaliza tipos de evaluación: quita acentos, minúsculas y espacios.
export function normalizarTipoEvaluacion(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// Acepta enteros y cadenas de dígitos. Rechaza '12.5', '12,5', 'abc',
// 'NaN', 'Infinity', vacíos y cualquier valor no finito.
export function esCalificacionEntera(valor) {
  if (typeof valor === 'number') return Number.isInteger(valor);
  if (typeof valor !== 'string') return false;
  const limpio = valor.trim();
  if (limpio === '' || !/^\d+$/.test(limpio)) return false;
  return Number.isSafeInteger(Number(limpio));
}

// Devuelve el entero equivalente o `null`. Nunca redondea ni trunca:
// '12.5' devuelve null (no 12).
export function calificacionEntera(valor) {
  if (!esCalificacionEntera(valor)) return null;
  return Number(String(valor).trim());
}

// Conserve la firma anterior para que no rompa importaciones externas.
export function esCalificacionValida(valor) {
  return (typeof valor === 'number' || typeof valor === 'string') && String(valor).trim() !== '' && Number.isFinite(Number(valor));
}

// El promedio puede ser fraccionario (es un promedio); las calificaciones que
// lo alimentan sí deben ser enteras.
export function promedioCalificaciones(valores) {
  const notas = (Array.isArray(valores) ? valores : [])
    .map((valor) => calificacionEntera(valor))
    .filter((nota) => nota !== null);
  return notas.length ? notas.reduce((suma, nota) => suma + nota, 0) / notas.length : null;
}

// Escala de puntaje por universidad objetivo.
//
// Debe COINCIDIR con la tabla compartida del backend (utils/escalas.js):
//   - las universidades con escala configurada se respetan tal cual;
//   - las universidades sin escala propia usan la escala interna
//     preuniversitaria de AcadeSys (vigesimal, 20 puntos);
//   - el valor por defecto es SIEMPRE 20, nunca 2000, para que el portal del
//     alumno y el Tutor IA muestren la misma escala que valida el backend.
const ESCALAS_POR_UNIVERSIDAD = {
  UNMSM: 2000,
  UNI: 2000,
  PUCP: 1000,
  UNFV: 1000,
  UNAC: 100,
  UNT: 300,
  UNALM: 20,
  UPCH: 20,
  ULIMA: 20,
  UPC: 20,
  USMP: 20,
  UTP: 20,
  PREUNIVERSITARIO: 20
};

const ESCALA_POR_DEFECTO = 20;

export function escalaPorUniversidad(universidad) {
  return ESCALAS_POR_UNIVERSIDAD[String(universidad || '').trim().toUpperCase()] ?? ESCALA_POR_DEFECTO;
}

// Estados de una evaluación: 1 vigente (editable), 2 acta cerrada (no editable),
// -1 baja lógica (no se muestra). Si el backend no envía el campo, se asume
// vigente para no bloquear la edición de notas existentes.
export function estadoNota(estado) {
  const numero = Number(estado);
  if (!Number.isFinite(numero)) return ESTADO_NOTA_VIGENTE;
  if (numero === ESTADO_NOTA_ACTA_CERRADA) return ESTADO_NOTA_ACTA_CERRADA;
  if (numero === ESTADO_NOTA_BAJA) return ESTADO_NOTA_BAJA;
  return ESTADO_NOTA_VIGENTE;
}

export function notaEsEditable(estado) {
  return estadoNota(estado) === ESTADO_NOTA_VIGENTE;
}

// Elige la evaluación que corresponde a un alumno dentro de un tipo/periodo.
// Prioridad: vigente (1) > acta cerrada (2). Las bajas lógicas (-1) se
// descartan. Si solo existe una cerrada, esa es la que se muestra.
export function seleccionarNotaDelAlumno(notas = [], { idMatricula, tipoEvaluacion, periodo } = {}) {
  const id = Number(idMatricula);
  const tipo = normalizarTipoEvaluacion(tipoEvaluacion);
  const periodoTexto = String(periodo ?? 'General');

  const candidatas = (Array.isArray(notas) ? notas : []).filter((nota) => {
    if (!nota) return false;
    const estado = estadoNota(nota.estadoRegistro ?? nota.EstadoRegistro);
    if (estado === ESTADO_NOTA_BAJA) return false;
    if (Number(nota.idMatricula ?? nota.IdMatricula) !== id) return false;
    if (normalizarTipoEvaluacion(nota.tipoEvaluacion ?? nota.TipoEvaluacion) !== tipo) return false;
    return String(nota.periodo ?? nota.Periodo ?? 'General') === periodoTexto;
  });

  if (candidatas.length === 0) return null;

  const prioridad = (nota) =>
    estadoNota(nota.estadoRegistro ?? nota.EstadoRegistro) === ESTADO_NOTA_VIGENTE ? 2 : 1;

  return [...candidatas].sort((a, b) => {
    const diferencia = prioridad(b) - prioridad(a);
    if (diferencia !== 0) return diferencia;
    return (
      Number(b.idEvaluacion ?? b.IdEvaluacion ?? 0) - Number(a.idMatricula ?? a.IdMatricula ?? 0)
    );
  })[0];
}

// Prepara el envío del guardado sin tocar la red:
//   nuevas      -> POST /api/notas
//   existentes  -> PUT /api/notas/:id
//   omitidas    -> acta cerrada o no editable: NO se envían
//   invalidas   -> no son enteros o exceden la escala
//   vacias*     -> no se puede guardar ni borrar
export function planificarGuardadoNotas(estudiantes = [], { escalaMaxima = null } = {}) {
  const escala = Number(escalaMaxima);
  const hayEscala =
    escalaMaxima !== null && escalaMaxima !== '' && Number.isFinite(escala) && escala > 0;

  const plan = {
    nuevas: [],
    existentes: [],
    omitidas: [],
    invalidas: [],
    vaciasNuevas: [],
    vaciasPersistidas: []
  };

  for (const estudiante of Array.isArray(estudiantes) ? estudiantes : []) {
    if (!estudiante) continue;

    const idEvaluacion = Number(estudiante.idEvaluacion);
    const tieneId = Number.isSafeInteger(idEvaluacion) && idEvaluacion > 0;
    const bruto = estudiante.calificacion;
    const vacia = bruto === '' || bruto === null || bruto === undefined;
    const editable = estudiante.editable !== false;

    if (vacia) {
      if (tieneId) {
        if (estudiante.calificacionEditada) plan.vaciasPersistidas.push(estudiante);
      } else if (estudiante.calificacionEditada) {
        plan.vaciasNuevas.push(estudiante);
      }
      continue;
    }

    if (!editable) {
      plan.omitidas.push(estudiante);
      continue;
    }

    const valor = calificacionEntera(bruto);
    if (valor === null || valor < 0 || (hayEscala && valor > escala)) {
      plan.invalidas.push(estudiante);
      continue;
    }

    if (tieneId) plan.existentes.push(estudiante);
    else plan.nuevas.push(estudiante);
  }

  return plan;
}