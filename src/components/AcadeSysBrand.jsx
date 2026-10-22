import marcaAcadeSys from '../assets/acadesys-mark-teal.png';

// Marca institucional de AcadeSys. El símbolo se mantiene y se tiñe de teal;
// el texto se compone aparte para conservar nitidez y contraste sobre fondos
// navy o claros, sin filtros ni degradados sobre el raster original.
export default function AcadeSysBrand({
  compacto = false,
  tono = 'oscuro',
  className = ''
}) {
  const esOscuro = tono !== 'claro';

  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <img
        src={marcaAcadeSys}
        alt={compacto ? 'AcadeSys' : ''}
        aria-hidden={compacto ? undefined : 'true'}
        className="h-8 w-8 shrink-0 object-contain"
      />

      {!compacto && (
        <span className="min-w-0 leading-none">
          <span
            className={`block truncate text-[17px] font-bold tracking-tight ${
              esOscuro ? 'text-white' : 'text-slate-900'
            }`}
          >
            AcadeSys
          </span>
          <span
            className={`mt-1 block truncate text-[8px] font-semibold uppercase tracking-[0.22em] ${
              esOscuro ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Preuniversitario
          </span>
        </span>
      )}
    </span>
  );
}
