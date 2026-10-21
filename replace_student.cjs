const fs = require('fs');
let c = fs.readFileSync('src/pages/StudentIntranetPage.jsx', 'utf8');

// El bloque viejo del perfil (desde {view === VIEWS.perfil && hasta el cierre })
// Identificamos el bloque por sus marcadores conocidos
const startMarker = `        {view === VIEWS.perfil && (`;
const endMarker = `        )}`;

// Encontrar posiciones
const startPos = c.indexOf(startMarker);
if (startPos === -1) {
  console.log('No se encontró el inicio del bloque perfil');
  process.exit(1);
}

// Encontrar el cierre - buscar el último '        )}' después del start
let endPos = c.lastIndexOf(endMarker, c.length - 10);
if (endPos === -1) {
  console.log('No se encontró el fin del bloque perfil');
  process.exit(1);
}

// El contenido nuevo para la sección perfil
// Incluye: tarjeta de identidad con foto, grid de dos tarjetas
const newContent = `        {view === VIEWS.perfil && (
          <div className="max-w-7xl mx-auto">
            {/* Sin subtitle redundante */}
            
            {/* TARJETA DE IDENTIDAD CON FOTO */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
              <div className="relative">
                {/* Foto de perfil o iniciales */}
                {data?.usuario?.fotoUrl ? (
                  <img
                    src={API_URL + data.usuario.fotoUrl}
                    alt="Foto de perfil de " + (data?.usuario?.nombreCompleto || user?.nombre)
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl bg-blue-700 flex items-center justify-center text-xl font-bold text-white"
                  >
                    {(data?.usuario?.nombreCompleto || user?.nombre || 'AL').slice(0, 2).toUpperCase()}
                  </div>
                )}
                
                {/* Botón Cambiar foto - visible solo si hay sesión y no está cargando */}
                {user && !cargandoPerfil && (
                  <div className="absolute bottom-1 right-1">
                    <button
                      type="button"
                      onClick={() => document.getElementById('foto-perfil-input').click()
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCcw className="w-3 h-3" aria-hidden="true" />
                      Cambiar foto
                    </button>
                  </div>
                )}
                
                {/* Input file oculto */}
                <input
                  id="foto-perfil-input"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => handleFotoChange(e)}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <p className="font-medium text-slate-900">{data?.usuario?.nombreCompleto || user?.nombre}</p>
                <p className="text-xs text-slate-500">ACAD-{data?.usuario?.codigoUsuario || user?.codigoUsuario || ''}</p>
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
                    <span className="text-slate-900">
                      {ciclo?.fechaInicio && normalizarFecha(ciclo.fechaInicio)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Fec. fin</p>
                    <span className="text-slate-900">
                      {ciclo?.fechaFin && normalizarFecha(ciclo.fechaFin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}`;

// Reemplazar el bloque viejo por el nuevo
// El bloque viejo comienza después de "  {view === VIEWS.perfil && (" y antes del último "        )}"
// Encontrar el inicio y fin exactos
const inicioMarker = `        {view === VIEWS.perfil && `;
const finMarker = `        )}`;

const inicioIdx = c.indexOf(inicioMarker);
if (inicioIdx === -1) {
  console.log('No se encontró el inicio del bloque perfil');
  process.exit(1);
}

// Encontrar el fin - buscar el último occurrence de el marcador de cierre
// El bloque viejo termina con "        )}" seguido de cerrar divs
// Buscamos desde la posición del inicio
let finIdx = c.lastIndexOf(finMarker, c.length - 100);
if (finIdx === -1) {
  console.log('No se encontró el fin del bloque perfil');
  process.exit(1);
}

// El contenido viejo que reemplazaremos
const viejoBloque = c.substring(inicioIdx, finIdx + finMarker.length);

// Reemplazar
c = c.replace(viejoBloque, newContent);
fs.writeFileSync('src/pages/StudentIntranetPage.jsx', c);
console.log('Replacement successful');