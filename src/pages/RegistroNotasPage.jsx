import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Save,
  School,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  actualizarNotaDocente,
  guardarNotasDocente,
  obtenerCiclosPublicos,
  obtenerContextoNotas,
  obtenerMatriculasNotas,
  obtenerNotas
} from '../services/api';

const NOTA_MINIMA = 0;

const TIPOS_EVALUACION = [
  'Simulacro',
  'Examen',
  'Tarea',
  'Practica',
  'Oral',
  'Participacion'
];

export default function RegistroNotasPage() {
  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('acadesys_session') || '{}');
    } catch {
      return {};
    }
  })();

  const colorTema = sessionData.colorTema || '#4f46e5';

  const [ciclos, setCiclos] = useState([]);
  const [idCiclo, setIdCiclo] = useState('');
  const [tipoEvaluacion, setTipoEvaluacion] = useState('Simulacro');
  const [contexto, setContexto] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const escalaMaxima = contexto?.escalaMaxima ?? null;
  const escalaLista = Number.isFinite(Number(escalaMaxima));

  const cargarCiclos = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga('');

      const lista = await obtenerCiclosPublicos();
      setCiclos(lista);

      if (lista.length > 0) {
        setIdCiclo((actual) => actual || String(lista[0].idCiclo));
      } else {
        setIdCiclo('');
        setContexto(null);
        setEstudiantes([]);
        setEvaluaciones([]);
      }
    } catch (error) {
      console.error(error);
      setErrorCarga(error.message || 'No se pudieron cargar los ciclos.');
      setCiclos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarRegistro = useCallback(async () => {
    if (!idCiclo) return;

    try {
      setCargando(true);
      setErrorCarga('');
      setContexto(null);
      setEstudiantes([]);
      setEvaluaciones([]);

      const [contextoApi, matriculasApi, notasApi] = await Promise.all([
        obtenerContextoNotas(idCiclo),
        obtenerMatriculasNotas(idCiclo),
        obtenerNotas()
      ]);

      setContexto(contextoApi);

      const idsMatricula = new Set(
        matriculasApi.map((m) => Number(m.idMatricula))
      );

      const notasDelCiclo = notasApi.filter((nota) =>
        idsMatricula.has(Number(nota.IdMatricula ?? nota.idMatricula))
      );

      setEvaluaciones(notasDelCiclo);

      setEstudiantes(
        matriculasApi.map((matricula) => ({
          ...matricula,
          calificacion: ''
        }))
      );
    } catch (error) {
      console.error(error);
      setErrorCarga(error.message || 'No se pudo cargar el registro de notas.');
      setContexto(null);
      setEstudiantes([]);
      setEvaluaciones([]);
    } finally {
      setCargando(false);
    }
  }, [idCiclo]);

  useEffect(() => {
    cargarCiclos();
  }, [cargarCiclos]);

  useEffect(() => {
    cargarRegistro();
  }, [cargarRegistro]);

  useEffect(() => {
    if (!escalaLista) return;

    setEstudiantes((actuales) =>
      actuales.map((estudiante) => {
        const existente = evaluaciones
          .filter((nota) =>
            Number(nota.IdMatricula ?? nota.idMatricula) === Number(estudiante.idMatricula) &&
            String(nota.TipoEvaluacion ?? nota.tipoEvaluacion) === tipoEvaluacion
          )
          .sort(
            (a, b) =>
              Number(b.IdEvaluacion ?? b.idEvaluacion ?? 0) -
              Number(a.IdEvaluacion ?? a.idEvaluacion ?? 0)
          )[0];

        return {
          ...estudiante,
          idEvaluacion: existente?.IdEvaluacion ?? existente?.idEvaluacion ?? null,
          calificacion:
            existente?.Calificacion ?? existente?.calificacion ?? ''
        };
      })
    );
  }, [tipoEvaluacion, evaluaciones, escalaLista]);

  const handleNotaChange = (idMatricula, valorCrudo) => {
    if (!escalaLista || guardando) return;

    if (valorCrudo === '') {
      setEstudiantes((actuales) =>
        actuales.map((estudiante) =>
          Number(estudiante.idMatricula) === Number(idMatricula)
            ? { ...estudiante, calificacion: '' }
            : estudiante
        )
      );
      return;
    }

    if (!/^\d+$/.test(valorCrudo)) return;

    const numero = Number(valorCrudo);

    if (
      !Number.isInteger(numero) ||
      numero < NOTA_MINIMA ||
      numero > Number(escalaMaxima)
    ) {
      return;
    }

    setEstudiantes((actuales) =>
      actuales.map((estudiante) =>
        Number(estudiante.idMatricula) === Number(idMatricula)
          ? { ...estudiante, calificacion: numero }
          : estudiante
      )
    );
  };

  const handleNotaKeyDown = (event) => {
    const permitidas = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End'
    ];

    if (permitidas.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleGuardar = async () => {
    if (!idCiclo || !escalaLista || guardando) return;

    const conNota = estudiantes.filter(
      (estudiante) =>
        estudiante.calificacion !== '' &&
        estudiante.calificacion !== null &&
        estudiante.calificacion !== undefined
    );

    if (conNota.length === 0) {
      await Swal.fire({
        title: 'No hay notas para guardar',
        text: 'Ingresa al menos una calificación antes de continuar.',
        icon: 'info',
        confirmButtonColor: colorTema,
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    const fueraDeRango = conNota.some((estudiante) => {
      const valor = Number(estudiante.calificacion);
      return (
        !Number.isInteger(valor) ||
        valor < NOTA_MINIMA ||
        valor > Number(escalaMaxima)
      );
    });

    if (fueraDeRango) {
      await Swal.fire({
        title: 'Calificación inválida',
        text: `Todas las notas deben estar entre 0 y ${escalaMaxima}.`,
        icon: 'error',
        confirmButtonColor: colorTema,
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    try {
      setGuardando(true);

      const nuevas = conNota.filter((estudiante) => !estudiante.idEvaluacion);
      const existentes = conNota.filter((estudiante) => estudiante.idEvaluacion);

      if (nuevas.length > 0) {
        await guardarNotasDocente(
          idCiclo,
          nuevas.map((estudiante) => ({
            IdMatricula: Number(estudiante.idMatricula),
            TipoEvaluacion: tipoEvaluacion,
            Calificacion: Number(estudiante.calificacion)
          }))
        );
      }

      if (existentes.length > 0) {
        await Promise.all(
          existentes.map((estudiante) =>
            actualizarNotaDocente(
              estudiante.idEvaluacion,
              Number(estudiante.calificacion)
            )
          )
        );
      }

      await cargarRegistro();

      await Swal.fire({
        title: 'Notas guardadas',
        text: 'Las calificaciones fueron sincronizadas con la base de datos.',
        icon: 'success',
        confirmButtonColor: colorTema,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (error) {
      console.error(error);

      await Swal.fire({
        title: 'No se pudieron guardar las notas',
        text:
          error.message ||
          'La API rechazó la operación. No se registró un guardado local alternativo.',
        icon: 'error',
        confirmButtonColor: colorTema,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setGuardando(false);
    }
  };

  const cicloSeleccionado = ciclos.find(
    (ciclo) => String(ciclo.idCiclo) === String(idCiclo)
  );

  const notasIngresadas = useMemo(
    () =>
      estudiantes
        .map((estudiante) => Number(estudiante.calificacion))
        .filter((valor) => Number.isFinite(valor)),
    [estudiantes]
  );

  const promedioGeneral =
    notasIngresadas.length > 0
      ? (
          notasIngresadas.reduce((acumulado, valor) => acumulado + valor, 0) /
          notasIngresadas.length
        ).toFixed(1)
      : '0.0';

  const maxLength = escalaLista
    ? String(Math.trunc(Number(escalaMaxima))).length
    : 4;

  return (
    <div className="p-6 md:p-10 font-sans text-slate-100 bg-slate-950 min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>P1-09: Escala dinámica de calificaciones</span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            Registro de Notas
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            {escalaLista
              ? `Escala oficial de ${contexto?.universidadObjetivo || 'la universidad'}: 0 a ${escalaMaxima}.`
              : 'Selecciona un ciclo para obtener la escala oficial desde la API.'}
          </p>
        </div>

        <button
          type="button"
          disabled={
            guardando ||
            cargando ||
            !escalaLista ||
            estudiantes.length === 0
          }
          onClick={handleGuardar}
          className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: colorTema }}
        >
          <Save className="w-4 h-4" />
          <span>{guardando ? 'Guardando...' : 'Guardar Notas'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <School className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Ciclo
            </label>
            <select
              value={idCiclo}
              onChange={(event) => setIdCiclo(event.target.value)}
              disabled={cargando || guardando}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-indigo-500 transition disabled:opacity-50"
            >
              {ciclos.length === 0 && <option value="">Sin ciclos disponibles</option>}
              {ciclos.map((ciclo) => (
                <option key={ciclo.idCiclo} value={ciclo.idCiclo}>
                  {ciclo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tipo de evaluación
            </label>
            <select
              value={tipoEvaluacion}
              onChange={(event) => setTipoEvaluacion(event.target.value)}
              disabled={cargando || guardando || !idCiclo}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-indigo-500 transition disabled:opacity-50"
            >
              {TIPOS_EVALUACION.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorCarga && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-200">No se pudo sincronizar el registro.</strong>
            <span>{errorCarga}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <Users className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Matriculados
            </span>
            <span className="text-xl font-black text-white">
              {estudiantes.length}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Promedio registrado
            </span>
            <span className="text-xl font-black text-white font-mono">
              {promedioGeneral}
              {escalaLista && (
                <small className="text-xs text-slate-500"> / {escalaMaxima}</small>
              )}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Escala activa
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {escalaLista ? `0 - ${escalaMaxima}` : 'No disponible'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-3xl shadow-xl border border-slate-800/80 overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {cicloSeleccionado?.nombre || 'Registro oficial'} • {tipoEvaluacion}
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {escalaLista
              ? `Validación activa: [0 - ${escalaMaxima}]`
              : 'Esperando escala del backend'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Estudiante</th>
                <th className="py-4 px-6 text-center">Matrícula</th>
                <th className="py-4 px-6 text-center">Calificación</th>
                <th className="py-4 px-6 text-center">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Sincronizando matrículas, evaluaciones y escala...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    {errorCarga
                      ? 'No hay datos disponibles porque la sincronización falló.'
                      : 'No hay alumnos matriculados en este ciclo.'}
                  </td>
                </tr>
              ) : (
                estudiantes.map((estudiante) => {
                  const tieneNota =
                    estudiante.calificacion !== '' &&
                    estudiante.calificacion !== null &&
                    estudiante.calificacion !== undefined;

                  return (
                    <tr
                      key={estudiante.idMatricula}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="font-bold text-white block">
                          {estudiante.nombre}
                        </span>
                        <span className="text-[11px] font-mono text-indigo-400">
                          {estudiante.codigo || 'Sin código'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center font-mono text-slate-400">
                        #{estudiante.idMatricula}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={!escalaLista || guardando}
                          value={estudiante.calificacion}
                          onChange={(event) =>
                            handleNotaChange(
                              estudiante.idMatricula,
                              event.target.value
                            )
                          }
                          onKeyDown={handleNotaKeyDown}
                          maxLength={maxLength}
                          placeholder={escalaLista ? `0-${escalaMaxima}` : '...'}
                          className="w-24 text-center py-2 px-2 border rounded-xl text-sm font-bold font-mono outline-none transition bg-slate-950 border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            tieneNota
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {tieneNota ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {estudiante.idEvaluacion ? 'Registrada' : 'Lista para guardar'}
                            </>
                          ) : (
                            'Pendiente'
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
