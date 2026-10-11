import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Download, Loader2, RefreshCw, Search, Trophy, Users, AlertCircle } from 'lucide-react';
import { obtenerCiclosPublicos, obtenerContextoNotas, obtenerMatriculasNotas, obtenerNotas } from '../services/api';

const TIPOS = ['Simulacro', 'Examen', 'Practica', 'Oral', 'Tarea', 'Participacion', 'Todos'];
const normalizarTipo = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function CalificacionesPage() {
  const [ciclos, setCiclos] = useState([]);
  const [idCiclo, setIdCiclo] = useState('');
  const [tipo, setTipo] = useState('Simulacro');
  const [contexto, setContexto] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoCiclos, setCargandoCiclos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarCiclos = useCallback(async () => {
    setCargandoCiclos(true);
    setError('');
    try {
      const lista = await obtenerCiclosPublicos();
      setCiclos(lista);
      setIdCiclo((actual) => actual && lista.some((c) => String(c.idCiclo) === actual)
        ? actual : (lista.length ? String(lista[0].idCiclo) : ''));
    } catch (err) {
      setCiclos([]);
      setIdCiclo('');
      setError(err.message || 'No se pudieron cargar los ciclos.');
    } finally { setCargandoCiclos(false); }
  }, []);

  const cargarResultados = useCallback(async () => {
    if (!idCiclo) { setMatriculas([]); setNotas([]); setContexto(null); return; }
    setCargando(true);
    setError('');
    try {
      const [ctx, listaMatriculas, listaNotas] = await Promise.all([
        obtenerContextoNotas(idCiclo),
        obtenerMatriculasNotas(idCiclo),
        obtenerNotas()
      ]);
      const ids = new Set(listaMatriculas.map((m) => Number(m.idMatricula ?? m.IdMatricula)));
      setContexto(ctx);
      setMatriculas(listaMatriculas.map((m) => ({
        idMatricula: Number(m.idMatricula ?? m.IdMatricula),
        codigo: m.codigo ?? m.CodigoUsuario ?? '',
        nombre: m.nombre ?? m.Alumno ?? ([m.Nombres, m.ApellidoPaterno, m.ApellidoMaterno].filter(Boolean).join(' ') || 'Alumno sin nombre')
      })));
      setNotas(listaNotas.filter((n) => ids.has(Number(n.IdMatricula ?? n.idMatricula))));
    } catch (err) {
      setContexto(null); setMatriculas([]); setNotas([]);
      setError(err.message || 'No se pudo cargar el cuadro de mérito del ciclo.');
    } finally { setCargando(false); }
  }, [idCiclo]);

  useEffect(() => { cargarCiclos(); }, [cargarCiclos]);
  useEffect(() => { if (!cargandoCiclos) cargarResultados(); }, [cargandoCiclos, cargarResultados]);

  const resultados = useMemo(() => {
    const tipoFiltro = normalizarTipo(tipo);
    const lista = matriculas.map((m) => {
      const evaluaciones = notas.filter((n) => Number(n.IdMatricula ?? n.idMatricula) === m.idMatricula &&
        (tipo === 'Todos' || normalizarTipo(n.TipoEvaluacion ?? n.tipoEvaluacion) === tipoFiltro));
      const puntajes = evaluaciones.map((n) => Number(n.Calificacion ?? n.calificacion)).filter(Number.isFinite);
      const promedio = puntajes.length ? puntajes.reduce((a,b) => a + b, 0) / puntajes.length : null;
      return { ...m, evaluaciones: puntajes.length, promedio };
    }).filter((m) => !busqueda.trim() || `${m.nombre} ${m.codigo}`.toLowerCase().includes(busqueda.trim().toLowerCase()));
    lista.sort((a,b) => {
      if (a.promedio === null && b.promedio === null) return a.nombre.localeCompare(b.nombre);
      if (a.promedio === null) return 1;
      if (b.promedio === null) return -1;
      return b.promedio - a.promedio || a.nombre.localeCompare(b.nombre);
    });
    let last = null; let lastRank = 0;
    return lista.map((m,index) => {
      const rank = m.promedio === null ? null : (last !== null && Math.abs(m.promedio - last) < 0.000001 ? lastRank : index + 1);
      if (m.promedio !== null) { last = m.promedio; lastRank = rank; }
      const total = lista.filter((x) => x.promedio !== null).length;
      const percentile = rank && total ? rank / total : null;
      const clasificacion = !rank ? 'Sin evaluación' : rank === 1 ? 'Primer puesto' : percentile <= .10 ? 'Top 10%' : percentile <= .25 ? 'Top 25%' : 'En ranking';
      return { ...m, puesto: rank, clasificacion };
    });
  }, [matriculas, notas, tipo, busqueda]);

  const totalConNota = resultados.filter((r) => r.promedio !== null).length;
  const escalaMaxima = Number(contexto?.escalaMaxima || 0);
  const cicloActual = ciclos.find((c) => String(c.idCiclo) === String(idCiclo));

  const exportarCSV = () => {
    const rows = [
      ['Puesto','Código','Alumno','Ciclo','Tipo de evaluación','Promedio','Escala máxima','Evaluaciones','Clasificación'],
      ...resultados.map((r) => [r.puesto ?? '', r.codigo, r.nombre, contexto?.ciclo || cicloActual?.nombre || '', tipo, r.promedio === null ? '' : r.promedio.toFixed(2), escalaMaxima || '', r.evaluaciones, r.clasificacion])
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `cuadro-merito-ciclo-${idCiclo || 'sin-ciclo'}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 text-slate-900 md:p-10">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><Trophy className="h-4 w-4"/> RESULTADOS PREUNIVERSITARIOS</div><h1 className="text-3xl font-black">Simulacros y cuadro de mérito</h1><p className="mt-1 text-sm text-slate-500">El ranking se calcula dentro del ciclo seleccionado y según las evaluaciones registradas en la base de datos.</p></div>
        <div className="flex gap-2"><button onClick={cargarResultados} disabled={cargando || !idCiclo} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold hover:bg-slate-100 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`}/> Actualizar</button><button onClick={exportarCSV} disabled={!resultados.length} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"><Download className="h-4 w-4"/> Exportar CSV</button></div>
      </header>
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="h-5 w-5 shrink-0"/>{error}</div>}
      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Ciclo
          <select value={idCiclo} onChange={(e) => setIdCiclo(e.target.value)} disabled={cargandoCiclos || !ciclos.length} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">{!ciclos.length && <option value="">No hay ciclos activos</option>}{ciclos.map((c) => <option key={c.idCiclo} value={c.idCiclo}>{c.nombre}</option>)}</select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Evaluación para el ranking
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">{TIPOS.map((t) => <option key={t} value={t}>{t === 'Todos' ? 'Todas las evaluaciones (promedio)' : t}</option>)}</select>
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span><strong>{contexto?.ciclo || cicloActual?.nombre || 'Sin ciclo seleccionado'}</strong>{contexto?.universidadObjetivo ? ` · ${contexto.universidadObjetivo}` : ''}</span><span className="text-slate-500">Escala de puntaje: {escalaMaxima || 'no disponible'} · Alumnos matriculados: {matriculas.length} · Con nota: {totalConNota}</span></div>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Alumnos en el ciclo</p><p className="mt-2 text-3xl font-black">{cargando ? '…' : matriculas.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Con evaluaciones</p><p className="mt-2 text-3xl font-black text-indigo-700">{cargando ? '…' : totalConNota}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Primera posición actual</p><p className="mt-2 text-3xl font-black text-amber-600">{cargando ? '…' : resultados.find((r) => r.puesto === 1)?.nombre || 'Sin resultados'}</p></div></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><h2 className="font-bold">Clasificación por ciclo</h2><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno o código..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 md:w-72"/></div></div>
        {cargando || cargandoCiclos ? <div className="p-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin"/>Cargando resultados reales...</div> : resultados.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 font-bold">No hay alumnos que coincidan con el ciclo y el filtro.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Puesto</th><th className="px-5 py-4">Código</th><th className="px-5 py-4">Alumno</th><th className="px-5 py-4">Promedio</th><th className="px-5 py-4">Evaluaciones</th><th className="px-5 py-4">Clasificación</th></tr></thead><tbody>{resultados.map((r) => <tr key={r.idMatricula} className="border-t border-slate-100 hover:bg-slate-50/80"><td className="px-5 py-4 font-black">{r.puesto ? `#${r.puesto}` : '—'}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{r.codigo || '—'}</td><td className="px-5 py-4 font-semibold">{r.nombre}</td><td className="px-5 py-4 font-black">{r.promedio === null ? '—' : `${r.promedio.toFixed(2)} / ${escalaMaxima || '?'}`}</td><td className="px-5 py-4">{r.evaluaciones}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${r.puesto === 1 ? 'border-amber-200 bg-amber-50 text-amber-700' : r.promedio === null ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-indigo-100 bg-indigo-50 text-indigo-700'}`}>{r.clasificacion}</span></td></tr>)}</tbody></table></div>}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Criterio: promedio de las evaluaciones seleccionadas. Los alumnos sin notas se muestran al final y no reciben puesto. Los empates comparten posición.</div>
      </section>
    </div>
  );
}
