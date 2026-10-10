import React, { useEffect, useState } from 'react';
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
  obtenerCiclosPublicos,
  obtenerCursosCiclo,
  obtenerMaterialesAdmin,
  subirMaterialPDF,
  eliminarMaterial
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
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const listaCiclos = await obtenerCiclosPublicos();
      setCiclos(listaCiclos);
      const cicloActivo = listaCiclos.find((c) => String(c.idCiclo) === String(idCiclo)) || listaCiclos[0];
      if (cicloActivo) {
        setIdCiclo(String(cicloActivo.idCiclo));
        const listaCursos = await obtenerCursosCiclo(cicloActivo.idCiclo);
        setCursos(listaCursos);
        setIdCurso(listaCursos[0]?.idCurso ? String(listaCursos[0].idCurso) : '');
        const listaMateriales = await obtenerMaterialesAdmin(cicloActivo.idCiclo);
        setMateriales(listaMateriales);
      } else {
        setCursos([]);
        setMateriales([]);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar la gestión de materiales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarCiclo = async (value) => {
    setIdCiclo(value);
    setError('');
    setMensaje('');
    const listaCursos = await obtenerCursosCiclo(value);
    setCursos(listaCursos);
    setIdCurso(listaCursos[0]?.idCurso ? String(listaCursos[0].idCurso) : '');
    try {
      setMateriales(await obtenerMaterialesAdmin(value));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los materiales.');
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
    setMensaje('');
    setError('');

    if (!idCiclo || !idCurso || !titulo.trim() || !archivo) {
      setError('Selecciona el ciclo, curso, t├¡tulo y un archivo PDF.');
      return;
    }

    if (archivo.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.');
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      setError('El PDF no puede superar los 10 MB.');
      return;
    }

    setGuardando(true);
    try {
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
      setError(err.message || 'No se pudo publicar el material.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (material) => {
    if (!window.confirm(`┬┐Eliminar el material "${material.titulo}"?`)) return;
    try {
      await eliminarMaterial(material.idMaterial);
      setMateriales((prev) => prev.filter((m) => m.idMaterial !== material.idMaterial));
      setMensaje('Material eliminado.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el material.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.16em]">Administración</p>
            <h1 className="text-3xl font-black mt-1">Materiales Académicos</h1>
            <p className="text-sm text-slate-500 mt-2">
              Publica PDFs de apoyo y asígnalos al ciclo y curso correcto. El alumno solo ver├í los materiales de su ciclo.
            </p>
          </div>
          <button
            type="button"
            onClick={cargar}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>

        {mensaje && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 h-fit">
            <div className="flex items-center gap-2 text-white font-black">
              <Plus className="w-4 h-4 text-blue-400" />
              Nuevo material PDF
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Ciclo</span>
              <select
                value={idCiclo}
                onChange={(e) => cambiarCiclo(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-blue-500"
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
                onChange={(e) => setIdCurso(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-blue-500"
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
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Descripción</span>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Material de refuerzo..."
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-blue-500 resize-none"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Archivo PDF</span>
              <div className="mt-1 p-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950">
                <input
                  id="pdf-material"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400"
                />
                <p className="text-[10px] text-slate-600 mt-2">Máximo 10 MB.</p>
              </div>
            </label>

            <button
              type="submit"
              disabled={guardando}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-sm font-black text-white"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {guardando ? 'Publicando...' : 'Publicar PDF'}
            </button>
          </form>

          <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Materiales del ciclo</p>
                <h2 className="text-xl font-black text-white mt-1">{ciclos.find((c) => String(c.idCiclo) === String(idCiclo))?.nombre || '-'}</h2>
              </div>
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>

            {materiales.length === 0 ? (
              <div className="p-8 text-center border border-slate-800 rounded-2xl">
                <FileText className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-sm font-bold text-white mt-3">No hay materiales publicados.</p>
                <p className="text-xs text-slate-500 mt-1">Sube el primer PDF para este ciclo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materiales.map((material) => (
                  <div key={material.idMaterial ?? material.IdMaterial} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-blue-300">{material.curso || 'Curso'}</p>
                      <h3 className="text-sm font-black text-white mt-1 truncate">{material.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-1">{material.descripcion || 'Sin descripción'}</p>
                      <p className="text-[10px] text-slate-600 mt-2">{material.nombreArchivo || 'PDF'} ┬À {String(material.fechaPublicacion || '').slice(0, 10)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {material.urlArchivo && (
                        <a
                          href={material.urlArchivo}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                        >
                          Ver
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminar(material)}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
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
