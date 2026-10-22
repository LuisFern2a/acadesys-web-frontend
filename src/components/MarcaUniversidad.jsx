import React from 'react';
import { obtenerMarcaUniversidad } from '../utils/universidadCiclo';

/**
 * Marca de agua institucional de la universidad de un ciclo.
 *
 * - Es DECORATIVA: no aporta informacion que no este en el texto de la
 *   tarjeta, por eso usa `alt=""` y `aria-hidden="true"` y no entra en la
 *   navegacion por teclado.
 * - Se decide por la UNIVERSIDAD del ciclo (nunca por el nombre del ciclo):
 *   varias tarjetas de la misma universidad reutilizan el mismo asset.
 * - Si la universidad no tiene asset local, no se renderiza nada (fallback
 *   limpio: sin imagen rota y sin inventar escudos).
 * - La opacidad es muy tenue y el contenedor de la tarjeta usa
 *   `overflow-hidden`, asi que el logo puede quedar parcialmente cortado por
 *   el borde lateral, tal como en la referencia visual aprobada.
 */
export default function MarcaUniversidad({ clave, className = '' }) {
  const marca = obtenerMarcaUniversidad(clave);
  if (!marca) return null;

  return (
    <img
      src={marca.asset}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      draggable="false"
      className={`pointer-events-none absolute z-0 select-none object-contain ${marca.posicion} ${marca.ancho} ${marca.opacidad} ${className}`}
    />
  );
}
