import React from 'react';
import { BookOpen } from 'lucide-react';
import { obtenerSvgIconoCurso } from '../utils/cursoIcono';

/**
 * Icono de la MATERIA de un curso.
 *
 * Único punto de render del mapeo CURSO -> ICONO: se usa igual en "Cursos
 * Académicos" y en "Horarios", de forma que un mismo curso muestra siempre el
 * mismo icono en ambas pestañas.
 *
 * Dibuja la colección académica line-art de `src/assets/cursos/` (Tabler Icons,
 * MIT) insertada inline, para que herede `currentColor` y tome el azul
 * institucional de AcadeSys. Sólo ocupa la caja del icono: no cambia tamaño,
 * padding, bordes ni posición de la tarjeta.
 *
 * Si el curso no se reconoce se conserva el icono genérico de curso
 * (`BookOpen`); nunca se asigna una materia al azar.
 *
 * El icono es decorativo (el nombre del curso ya está en la tarjeta), por eso se
 * oculta a lectores de pantalla.
 */
export default function CursoIcon({ nombre, className = '' }) {
  const svg = obtenerSvgIconoCurso(nombre);

  if (!svg) {
    return <BookOpen className={className} aria-hidden="true" />;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
