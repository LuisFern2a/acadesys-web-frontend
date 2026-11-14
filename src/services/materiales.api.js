import { fetchWithAuth } from './api.js';

// HU-19: los PDF ya no son públicos. Se descargan con el token de la sesión
// desde GET /api/materiales/:id/descargar y se entregan al navegador como blob.
export function nombreDescargaMaterial(material = {}) {
  const base = String(material.nombreArchivo || material.titulo || 'material')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').trim().slice(0, 120) || 'material';
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
}

export async function descargarMaterial(material = {}) {
  const id = Number(material.idMaterial ?? material.IdMaterial);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('El material no tiene un identificador válido.');
  }
  const respuesta = await fetchWithAuth(`/api/materiales/${id}/descargar`, { method: 'GET' });
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.error || 'No se pudo descargar el material.');
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreDescargaMaterial(material);
  enlace.rel = 'noopener';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
