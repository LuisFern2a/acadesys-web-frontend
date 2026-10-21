const fs = require('fs');
let c = fs.readFileSync('src/pages/StudentIntranetPage.jsx', 'utf8');

// Encontrar el bloque del perfil
const startMarker = '{view === VIEWS.perfil && (';
const endMarker = '        )}';

// Encontrar la posición de inicio
const startPos = c.indexOf(startMarker);
if (startPos === -1) {
  console.log('No se encontró el marcador de inicio');
  process.exit(1);
}

// Encontrar la posición de fin (el último '        )}' que cierra este bloque)
// Buscar desde la posición de inicio
let endPos = c.indexOf(endMarker, startPos);
if (endPos === -1) {
  console.log('No se encontró el marcador de fin');
  process.exit(1);
}

// El contenido que queremos insertar nuevo
const newContent = `        {view === VIEWS.perfil && (
          <div className="max-w-7xl mx-auto">
            {/* Sin subtitle redundante */}
            
            {/* TARJETA DE IDENTIDAD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-xl font-bold text-white">
                  {(data?.usuario?.nombreCompleto || user?.nombre || 'AL').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{data?.usuario?.nombreCompleto || user?.nombre}</p>
                  <p className="text-xs text-slate-500">ACAD-{data?.usuario?.codigoUsuario || user?.codigoUsuario || ''}</p>
                </div>
              </div>
            </div>

            {/* GRID: Dos tarjetas separadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* TARJETA: Información Personal */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Información personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Nombres</p>
                    <span className="text-slate-900">{data?.usuario?.nombres || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Apellido paterno</p>
                    <span className="text-slate-900">{data?.usuario?.apellidoPaterno || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Apellido materno</p>
                    <span className="text-slate-900">{data?.usuario?.apellidoMaterno || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">DNI</p>
                    <span className="text-slate-900">{data?.usuario?.dni || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Correo</p>
                    <span className="text-slate-900">{data?.usuario?.correo || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Teléfono</p>
                    <span className="text-slate-900">{data?.usuario?.telefono || data?.usuario?.celular || 'No registrado'}</span>
                  </div>
                </div>
              </div>

              {/* TARJETA: Información Académica */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Información académica</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Universidad objetivo</p>
                    <span className="text-slate-900">{ciclo?.universidadObjetivo || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Ciclo actual</p>
                    <span className="text-slate-900">{ciclo?.nombre || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Modalidad</p>
                    <span className="text-slate-900">{ciclo?.modalidad || 'No registrado'}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Fec. inicio</p>
                    <span className="text-slate-900">{ciclo?.fechaInicio && normalizarFecha(ciclo.fechaInicio)}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Fec. fin</p>
                    <span className="text-slate-900">{ciclo?.fechaFin && normalizarFecha(ciclo.fechaFin)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}`;

// El contenido antiguo que reemplazaremos (desde el startMarker hasta el endMarker inclusive)
const oldContent = c.substring(startPos, endPos + endMarker.length);

// Reemplazar
c = c.replace(oldContent, newContent);
fs.writeFileSync('src/pages/StudentIntranetPage.jsx', c);
console.log('Replacement successful');