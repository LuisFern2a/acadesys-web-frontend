
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

  obtenerCiclosGestionActivos,

  obtenerContextoNotas,

  obtenerMatriculasNotas,

  obtenerNotas

} from '../services/api';



const NOTA_MINIMA = 0;



const TIPOS_EVALUACION = ['Práctica', 'Evaluación', 'Examen', 'Simulacro'];

const normalizarTipoEvaluacion = (valor) => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();



export default function RegistroNotasPage() {

  // Identidad institucional AcadeSys: el acento de la pantalla usa siempre el
  // azul de la marca (el color de tema de la academia podía llegar naranja).
  const acentoAcadesys = '#2563EB';



  const [ciclos, setCiclos] = useState([]);

  const [idCiclo, setIdCiclo] = useState('');
  const [periodo, setPeriodo] = useState('General');

  const [tipoEvaluacion, setTipoEvaluacion] = useState('Simulacro');

  const [contexto, setContexto] = useState(null);

  const [estudiantes, setEstudiantes] = useState([]);

  const [evaluaciones, setEvaluaciones] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [errorCarga, setErrorCarga] = useState('');



  const escalaMaxima = contexto?.escalaMaxima ?? null;

  const escalaNumerica = Number(escalaMaxima);

  const escalaLista =
    escalaMaxima !== null &&
    escalaMaxima !== '' &&
    Number.isFinite(escalaNumerica) &&
    escalaNumerica > 0;

  const guardandoRef = useRef(false);
  const cargaSeqRef = useRef(0);



  const cargarCiclos = useCallback(async () => {

    try {

      setCargando(true);

      setErrorCarga('');



      const lista = await obtenerCiclosGestionActivos();

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

    if (!idCiclo) return false;

    const secuencia = ++cargaSeqRef.current;
    const vigente = () => secuencia === cargaSeqRef.current;

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

      if (!vigente()) return false;

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

      return true;

    } catch (error) {

      console.error(error);

      if (vigente()) {

        setErrorCarga(error.message || 'No se pudo cargar el registro de notas.');

        setContexto(null);

        setEstudiantes([]);

        setEvaluaciones([]);

      }

      return false;

    } finally {

      if (vigente()) setCargando(false);

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

            normalizarTipoEvaluacion(nota.TipoEvaluacion ?? nota.tipoEvaluacion) === normalizarTipoEvaluacion(tipoEvaluacion) &&
            String(nota.Periodo ?? nota.periodo ?? 'General') === periodo

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

  }, [tipoEvaluacion, periodo, evaluaciones, escalaLista]);



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



    const valor = valorCrudo.replace(',', '.');
    if (!/^\d+(\.\d{0,2})?$/.test(valor)) return;



    const numero = Number(valor);



    if (

      !Number.isFinite(numero) ||

      numero < NOTA_MINIMA ||

      numero > Number(escalaMaxima)

    ) {

      return;

    }



    setEstudiantes((actuales) =>

      actuales.map((estudiante) =>

        Number(estudiante.idMatricula) === Number(idMatricula)

          ? { ...estudiante, calificacion: valor }

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



    if (!/^[\d.,]$/.test(event.key) && event.key !== 'Enter' && event.key !== 'Escape') {

      event.preventDefault();

    }

  };



  const handleGuardar = async () => {

    if (!idCiclo || !escalaLista || guardandoRef.current || cargando || String(contexto?.idCiclo) !== String(idCiclo)) return;

    const vaciasPersistidas = estudiantes.filter(
      (estudiante) =>
        estudiante.idEvaluacion &&
        (estudiante.calificacion === '' ||
          estudiante.calificacion === null ||
          estudiante.calificacion === undefined)
    );

    if (vaciasPersistidas.length > 0) {
      await Swal.fire({
        title: 'No se puede borrar una nota registrada',
        text: 'La API no permite eliminar calificaciones ya guardadas. Vuelve a escribir la nota anterior o usa otro valor antes de guardar.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a'
      });
      return;
    }

    const conNota = estudiantes.filter(

      (estudiante) =>

        estudiante.calificacion !== '' &&

        estudiante.calificacion !== null &&

        estudiante.calificacion !== undefined

    );



    if (conNota.length === 0) {

      await Swal.fire({

        title: 'No hay calificaciones para guardar',

        text: 'Ingresa al menos una calificación antes de continuar.',

        icon: 'info',

        confirmButtonColor: '#2563eb',

        background: '#ffffff',

        color: '#0f172a'

      });

      return;

    }



    const fueraDeRango = conNota.some((estudiante) => {

      const valor = Number(estudiante.calificacion);

      return (

        !Number.isFinite(valor) ||

        valor < NOTA_MINIMA ||

        valor > Number(escalaMaxima)

      );

    });



    if (fueraDeRango) {

      await Swal.fire({

        title: 'Calificación inválida',

        text: `Todas las calificaciones deben estar entre 0 y ${escalaMaxima}.`,

        icon: 'error',

        confirmButtonColor: '#2563eb',

        background: '#ffffff',

        color: '#0f172a'

      });

      return;

    }



    try {

      guardandoRef.current = true;

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

          })),
          periodo

        );

      }



      if (existentes.length > 0) {

        const resultados = await Promise.allSettled(

          existentes.map((estudiante) =>

            actualizarNotaDocente(

              estudiante.idEvaluacion,

              Number(estudiante.calificacion)

            )

          )

        );

        const fallo = resultados.find((resultado) => resultado.status === 'rejected');
        if (fallo) throw fallo.reason;

      }



      const sincronizado = await cargarRegistro();



      await Swal.fire({

        title: sincronizado ? 'Calificaciones guardadas' : 'Guardado confirmado; consulta pendiente',

        text: sincronizado ? 'Las calificaciones fueron sincronizadas con la base de datos.' : 'La API confirmó el guardado, pero no se pudo recargar el registro. Reintenta la consulta antes de volver a guardar.',

        icon: sincronizado ? 'success' : 'warning',

        confirmButtonColor: '#2563eb',

        background: '#ffffff',

        color: '#0f172a'

      });

    } catch (error) {

      console.error(error);



      // Si una parte del lote falla (POST ok / PUT con error), la memoria local
      // puede quedar con notas nuevas sin idEvaluacion y un reintento volvería a
      // hacer POST generando duplicados. Recargamos el registro real antes de
      // avisar al usuario para sincronizar la UI con lo persistido.
      const resincronizado = await cargarRegistro();



      await Swal.fire({

        title: 'No se pudieron guardar las calificaciones',

        text: resincronizado

          ? `${error.message || 'La API rechazó la operación.'} El registro se recargó con las calificaciones guardadas en el servidor.`

          : error.message || 'La API rechazó la operación. No se registró un guardado local alternativo.',

        icon: 'error',

        confirmButtonColor: '#2563eb',

        background: '#ffffff',

        color: '#0f172a'

      });

    } finally {

      guardandoRef.current = false;

      setGuardando(false);

    }

  };



  const cicloSeleccionado = ciclos.find(

    (ciclo) => String(ciclo.idCiclo) === String(idCiclo)

  );



  const notasIngresadas = useMemo(

    () =>

      estudiantes

        .filter(
          (estudiante) =>
            estudiante.calificacion !== '' &&
            estudiante.calificacion !== null &&
            estudiante.calificacion !== undefined
        )

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

      : '—';



  const maxLength = escalaLista

    ? String(Math.trunc(Number(escalaMaxima))).length + 3

    : 4;



  return (

    <div className="p-6 md:p-8 font-sans text-slate-900 bg-slate-50 min-h-full space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">

        <div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">

            <Sparkles className="w-3.5 h-3.5" />

            <span>Evaluación académica · Escala dinámica</span>

          </div>



          <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">

            Registro de Evaluaciones

          </h1>



          <p className="text-sm text-slate-500 mt-1">

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

          className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-lg font-bold transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"

          style={{ backgroundColor: acentoAcadesys }}

        >

          <Save className="w-4 h-4" />

          <span>{guardando ? 'Guardando...' : 'Guardar Calificaciones'}</span>

        </button>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">

        <div className="flex items-center gap-3">

          <School className="w-5 h-5 text-blue-700 shrink-0" />

          <div className="w-full">

            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">

              Ciclo

            </label>

            <select

              value={idCiclo}

              onChange={(event) => setIdCiclo(event.target.value)}

              disabled={cargando || guardando}

              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-none cursor-pointer focus:border-blue-600 transition disabled:opacity-50"

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

          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />

          <div className="w-full">

            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">

              Tipo de evaluación

            </label>

            <select

              value={tipoEvaluacion}

              onChange={(event) => setTipoEvaluacion(event.target.value)}

              disabled={cargando || guardando || !idCiclo}

              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-none cursor-pointer focus:border-blue-600 transition disabled:opacity-50"

            >

              {TIPOS_EVALUACION.map((tipo) => (

                <option key={tipo} value={tipo}>

                  {tipo}

                </option>

              ))}

            </select>

          </div>

        </div>

        <div className="flex items-center gap-3">
          <div className="w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="periodo-evaluacion">
              Periodo académico
            </label>
            <input
              id="periodo-evaluacion"
              type="text"
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value.slice(0, 50))}
              disabled={cargando || guardando || !idCiclo}
              maxLength={50}
              placeholder="Ej. General, Parcial 1, Simulacro octubre"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 transition disabled:opacity-50"
            />
          </div>
        </div>

      </div>



      {errorCarga && (

        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">

          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

          <div>

            <strong className="block text-rose-800">No se pudo sincronizar el registro.</strong>

            <span>{errorCarga}</span>

          </div>

        </div>

      )}



      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">

          <Users className="w-5 h-5 text-blue-700" />

          <div>

            <span className="text-[10px] font-bold uppercase text-slate-500 block">

              Matriculados

            </span>

            <span className="text-xl font-bold text-slate-900">

              {estudiantes.length}

            </span>

          </div>

        </div>



        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">

          <TrendingUp className="w-5 h-5 text-blue-700" />

          <div>

            <span className="text-[10px] font-bold uppercase text-slate-500 block">

              Puntaje promedio

            </span>

            <span className="text-xl font-bold text-slate-900 font-mono">

              {promedioGeneral}

              {escalaLista && (

                <small className="text-xs text-slate-500"> / {escalaMaxima}</small>

              )}

            </span>

          </div>

        </div>



        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">

          <CheckCircle2 className="w-5 h-5 text-emerald-700" />

          <div>

            <span className="text-[10px] font-bold uppercase text-slate-500 block">

              Escala activa

            </span>

            <span className="text-xl font-bold text-emerald-700 font-mono">

              {escalaLista ? `0 - ${escalaMaxima}` : 'No disponible'}

            </span>

          </div>

        </div>

      </div>



      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-50">

          <div className="flex items-center gap-2">

            <ShieldCheck className="w-4 h-4 text-blue-700" />

            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">

              {cicloSeleccionado?.nombre || 'Registro oficial'} • {tipoEvaluacion}

            </span>

          </div>



          <span className="text-xs font-mono text-slate-500">

            {escalaLista

              ? `Validación activa: [0 - ${escalaMaxima}]`

              : 'Esperando escala del backend'}

          </span>

        </div>



        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead>

              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">

                <th className="py-4 px-6">Estudiante</th>

                <th className="py-4 px-6 text-center">Matrícula</th>

                <th className="py-4 px-6 text-center">Calificación</th>

                <th className="py-4 px-6 text-center">Estado</th>

              </tr>

            </thead>



            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">

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

                      : 'No hay estudiantes matriculados en este ciclo.'}

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

                      className="hover:bg-slate-50 transition-colors"

                    >

                      <td className="py-4 px-6">

                        <span className="font-bold text-slate-900 block">

                          {estudiante.nombre}

                        </span>

                        <span className="text-[11px] font-mono text-blue-700">

                          {estudiante.codigo || 'Sin código'}

                        </span>

                      </td>



                      <td className="py-4 px-6 text-center font-mono text-slate-500">

                        #{estudiante.idMatricula}

                      </td>



                      <td className="py-4 px-6 text-center">

                        <input

                          type="text"

                          aria-label={`Calificación de ${estudiante.nombre}`}

                          inputMode="decimal"

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

                          className="w-24 text-center py-2 px-2 border rounded-lg text-sm font-bold font-mono outline-none transition bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed"

                        />

                      </td>



                      <td className="py-4 px-6 text-center">

                        <span

                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold ${

                            tieneNota

                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'

                              : 'bg-slate-50 text-slate-500 border border-slate-300'

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
