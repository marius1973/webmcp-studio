import { AngularProjectFiles } from './angular-project-generator';

/** Empaqueta los archivos generados en un Blob ZIP (carga JSZip bajo demanda). */
export async function createProjectZip(files: AngularProjectFiles): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Descarga un Blob en el navegador. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
