import React, { useCallback, useEffect, useRef, useState } from 'react';

import {

  BookOpen,

  FileText,

  Loader2,

  Plus,

  Trash2,

  UploadCloud,

  RefreshCcw,

  AlertCircle,

  CheckCircle2

} from 'lucide-react';

import {

  obtenerCiclosGestionActivos,

  obtenerCursosCiclo,

  obtenerMaterialesAdmin,

  subirMaterialPDF,

  eliminarMaterial,

  mensajeErrorApi

} from '../services/api';

export default function AdminMaterialesPage() {

  const [ciclos, setCiclos] = useState([]);

  const [cursos, setCursos] = useState([]);

  const [materiales, setMateriales] = useState([]);

  const [idCiclo, setIdCiclo] = useState('');

  const [idCurso, setIdCurso] = useState('');

  const [titulo, setTitulo] = useState('');

  const [descripcion, setDescripcion] = useState('');

  const [archivo, setArchivo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [cargandoSeleccion, setCargandoSeleccion] = useState(false);

  const [mensaje, setMensaje] = useState('');

  const [error, setError] = useState('');

  const cargaSeqRef = useRef(0);

  const guardandoRef = useRef(false);
  const eliminandoRef = useRef(new Set());

  const cargar = useCallback(async (cicloPreferido = '') => {

    const secuencia = ++cargaSeqRef.current;

    const vigente = () => secuencia === cargaSeqRef.current;

    setLoading(true);

    setError('');

    try {

      const listaCiclos = await obtenerCiclosGestionActivos();

      if (!vigente()) return;

      setCiclos(listaCiclos);

      const cicloActivo = listaCiclos.find((c) => String(c.idCiclo) === String(cicloPreferido)) || listaCiclos[0];

      if (cicloActivo) {

        setIdCiclo(String(cicloActivo.idCiclo));

        const listaCursos = await obtenerCursosCiclo(cicloActivo.idCiclo);

        if (!vigente()) return;

        setCursos(listaCursos);

        setIdCurso(listaCursos[0]?.idCurso ? String(listaCursos[0].idCurso) : '');

        const listaMateriales = await obtenerMaterialesAdmin(cicloActivo.idCiclo);

        if (!vigente()) return;

        setMateriales(listaMateriales);

      } else {

        setCursos([]);

        setMateriales([]);

      }

    } catch (err) {

      if (!vigente()) return;

      setError(mensajeErrorApi(err, 'No se pudo cargar la gestión de materiales.'));

    } finally {

      if (vigente()) setLoading(false);

    }

  }, []);

  useEffect(() => {

    cargar();

  }, [cargar]);

  const cambiarCiclo = async (value) => {

    const secuencia = ++cargaSeqRef.current;

    const vigente = () => secuencia === cargaSeqRef.current;

    setIdCiclo(value);
    setCargandoSeleccion(true);
    setCursos([]);
    setMateriales([]);
    setIdCurso('');

    setError('');

    setMensaje('');

    try {

      const listaCursos = await obtenerCursosCiclo(value);

      if (!vigente()) return;

      setCursos(listaCursos);

      setIdCurso(listaCursos[0]?.idCurso ? String(listaCursos[0].idCurso) : '');

      const listaMateriales = await obtenerMaterialesAdmin(value);

      if (!vigente()) return;

      setMateriales(listaMateriales);

    } catch (err) {

      if (!vigente()) return;

      setCursos([]);

      setMateriales([]);

      setError(mensajeErrorApi(err, 'No se pudieron cargar los materiales.'));

    } finally {
      if (vigente()) setCargandoSeleccion(false);
    }

  };

  const leerArchivo = (file) => new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (guardandoRef.current || cargandoSeleccion) return;

    setMensaje('');

    setError('');

    if (!idCiclo || !idCurso || !titulo.trim() || !archivo) {

      setError('Selecciona el ciclo, curso, título y un archivo PDF.');

      return;

    }

    const esPdf = archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name || '');

    if (!esPdf) {

      setError('Solo se permiten archivos PDF.');

      return;

    }

    if (archivo.size > 10 * 1024 * 1024) {

      setError('El PDF no puede superar los 10 MB.');

      return;

    }

    if (archivo.size === 0) {

      setError('El archivo PDF está vacío.');

      return;

    }

    guardandoRef.current = true;

    setGuardando(true);

    try {

      if (await archivo.slice(0, 5).text() !== '%PDF-') {
        throw new Error('El archivo seleccionado no contiene una cabecera PDF válida.');
      }

      const fileData = await leerArchivo(archivo);

      const creado = await subirMaterialPDF({

        idCiclo: Number(idCiclo),

        idCurso: Number(idCurso),

        titulo: titulo.trim(),

        descripcion: descripcion.trim(),

        nombreArchivo: archivo.name,

        fileData

      });

      setMateriales((prev) => [creado, ...prev]);

      setTitulo('');

      setDescripcion('');

      setArchivo(null);

      const input = document.getElementById('pdf-material');

      if (input) input.value = '';

      setMensaje('Material publicado correctamente.');

    } catch (err) {

      setError(mensajeErrorApi(err, 'No se pudo publicar el material.'));

    } finally {

      guardandoRef.current = false;

      setGuardando(false);

    }

  };

  const handleEliminar = async (material) => {

    if (eliminandoRef.current.has(material.idMaterial)) return;
    if (!window.confirm(`¿Eliminar el material "${material.titulo}"?`)) return;

    if (!material.idMaterial) {

      setError('El material no tiene un identificador válido.');

      return;

    }

    eliminandoRef.current.add(material.idMaterial);
    try {

      await eliminarMaterial(material.idMaterial);

      setMateriales((prev) => prev.filter((m) => m.idMaterial !== material.idMaterial));

      setMensaje('Material eliminado.');

    } catch (err) {

      setError(mensajeErrorApi(err, 'No se pudo eliminar el material.'));

    } finally {
      eliminandoRef.current.delete(material.idMaterial);
    }

  };

  if (loading && ciclos.length === 0) {

    return (

      <div className="min-h-full bg-slate-50 flex items-center justify-center">

        <Loader2 className="w-8 h-8 animate-spin text-teal-700" aria-hidden="true" />

      </div>

    );

  }

  return (

    <div className="min-h-full bg-slate-50 text-slate-900 p-6 md:p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">

          <div>

            <p className="text-teal-700 text-[11px] font-bold uppercase tracking-[0.16em]">Administración</p>

            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Materiales Académicos</h1>

            <p className="text-sm text-slate-500 mt-2">

              Publica PDFs de apoyo y asígnalos al ciclo y curso correcto. El estudiante solo verá los materiales de su ciclo.

            </p>

          </div>

          <button

            type="button"

            onClick={() => cargar(idCiclo)}
            disabled={loading || guardando || cargandoSeleccion}

            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"

          >

            <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />

            Actualizar

          </button>

        </div>

        {mensaje && (

          <div role="status" className="mb-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">

            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />

            {mensaje}

          </div>

        )}

        {error && (

          <div role="alert" className="mb-5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">

            <AlertCircle className="w-4 h-4" aria-hidden="true" />

            {error}

          </div>

        )}

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">

          <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4 h-fit">

            <div className="flex items-center gap-2 text-slate-900 font-bold">

              <Plus className="w-4 h-4 text-teal-700" aria-hidden="true" />

              Nuevo material PDF

            </div>

            <label className="block">

              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Ciclo</span>

              <select

                value={idCiclo}
                disabled={loading || guardando}

                onChange={(e) => cambiarCiclo(e.target.value)}

                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:border-teal-500"

              >

                {ciclos.map((ciclo) => (

                  <option key={ciclo.idCiclo} value={ciclo.idCiclo}>{ciclo.nombre}</option>

                ))}

              </select>

            </label>

            <label className="block">

              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Curso</span>

              <select

                value={idCurso}
                disabled={loading || guardando || cargandoSeleccion}

                onChange={(e) => setIdCurso(e.target.value)}

                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:border-teal-500"

              >

                {cursos.map((curso) => (

                  <option key={curso.idCurso} value={curso.idCurso}>{curso.nombre}</option>

                ))}

              </select>

            </label>

            <label className="block">

              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Título</span>

              <input

                value={titulo}

                onChange={(e) => setTitulo(e.target.value)}

                placeholder="Ej. Semana 4 - Álgebra"

                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500"

              />

            </label>

            <label className="block">

              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Descripción</span>

              <textarea

                value={descripcion}

                onChange={(e) => setDescripcion(e.target.value)}

                rows={3}

                placeholder="Material de refuerzo..."

                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 resize-none"

              />

            </label>

            <label className="block">

              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Archivo PDF</span>

              <div className="mt-1 p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">

                <input

                  id="pdf-material"

                  type="file"

                  accept="application/pdf,.pdf"

                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}

                  className="w-full text-xs text-slate-600"

                />

                <p className="text-[10px] text-slate-500 mt-2">Máximo 10 MB.</p>

              </div>

            </label>

            <button

              type="submit"

              disabled={loading || guardando || cargandoSeleccion || !idCiclo || !idCurso}

              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-sm font-bold text-white"

            >

              {guardando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-4 h-4" aria-hidden="true" />}

              {guardando ? 'Publicando...' : 'Publicar PDF'}

            </button>

          </form>

          <section className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">

            <div className="flex items-center justify-between gap-3 mb-5">

              <div>

                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Materiales del ciclo</p>

                <h2 className="text-xl font-bold text-slate-900 mt-1">{ciclos.find((c) => String(c.idCiclo) === String(idCiclo))?.nombre || '-'}</h2>

              </div>

              <BookOpen className="w-5 h-5 text-teal-700" aria-hidden="true" />

            </div>

            {materiales.length === 0 ? (

              <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl">

                <FileText className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />

                <p className="text-sm font-bold text-slate-900 mt-3">No hay materiales publicados.</p>

                <p className="text-xs text-slate-500 mt-1">Sube el primer PDF para este ciclo.</p>

              </div>

            ) : (

              <div className="space-y-3">

                {materiales.map((material) => (

                  <div key={material.idMaterial ?? material.IdMaterial} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div className="min-w-0">

                      <p className="text-[10px] uppercase tracking-wider font-bold text-teal-700">{material.curso || 'Curso'}</p>

                      <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">{material.titulo}</h3>

                      <p className="text-xs text-slate-500 mt-1">{material.descripcion || 'Sin descripción'}</p>

                      <p className="text-[10px] text-slate-500 mt-2">{material.nombreArchivo || 'PDF'} · {String(material.fechaPublicacion || '').slice(0, 10)}</p>

                    </div>

                    <div className="flex items-center gap-2">

                      {material.urlArchivo && (

                        <a

                          href={material.urlArchivo}

                          target="_blank"

                          rel="noopener noreferrer"

                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"

                        >

                          Ver

                        </a>

                      )}

                      <button

                        type="button"

                        onClick={() => handleEliminar(material)}

                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"

                        title="Eliminar"

                        aria-label={`Eliminar ${material.titulo}`}

                      >

                        <Trash2 className="w-4 h-4" aria-hidden="true" />

                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>

      </div>

    </div>

  );

}
