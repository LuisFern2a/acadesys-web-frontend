import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { UNIVERSIDADES, obtenerUniversidadCiclo, obtenerLogoUniversidad } from '../utils/universidadCiclo';

/**
 * Logo de la universidad de un ciclo.
 *
 * Sustituye visualmente el icono de toga del contenedor de la tarjeta SOLO
 * cuando la universidad se identifica con seguridad Y existe su archivo de
 * logo en `src/assets/universidades/`.
 *
 * Ocupa exactamente el mismo espacio que el icono (44x44 px). Cuando hay logo
 * oficial se muestra limpio, sin el recuadro azul, porque los escudos traen su
 * propio fondo/colores y el recuadro los ensuciaría. Si la universidad no se
 * reconoce (o la imagen falla al cargar) se conserva el `GraduationCap`
 * original dentro de su recuadro azul.
 */
export default function UniversidadLogo({ ciclo, className = '' }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const clave = obtenerUniversidadCiclo(ciclo);
  const nombre = clave ? UNIVERSIDADES[clave].nombre : null;
  const logo = clave && !errorImagen ? obtenerLogoUniversidad(clave) : null;

  if (logo) {
    return (
      <div className={`w-11 h-11 shrink-0 flex items-center justify-center ${className}`}>
        <img
          src={logo}
          alt={nombre}
          loading="lazy"
          onError={() => setErrorImagen(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`w-11 h-11 shrink-0 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center ${className}`}>
      <GraduationCap className="w-5 h-5" aria-hidden="true" />
    </div>
  );
}
