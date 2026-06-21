import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

function pickVideo(videos, prefer) {
  if (!videos.length) return null;
  const preferred = videos.filter((v) => v.path.toLowerCase().includes(prefer.toLowerCase()));
  if (!preferred.length) return null;
  return preferred.reduce((a, b) => (a.mtime > b.mtime ? a : b)).path;
}

async function collectVideos(dir) {
  const videos = [];

  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (entry.name !== 'video.webm') continue;
      videos.push({ path: full, mtime: (await stat(full)).mtimeMs });
    }
  }

  await walk(dir);
  return videos;
}

/** Busca el video.webm más reciente de Playwright que coincida con el prefijo (p. ej. hero). */
export async function findDemoVideo(prefer = 'hero', root = 'test-results') {
  return pickVideo(await collectVideos(root), prefer);
}

export function demoVideoHint(prefer) {
  return prefer === 'hero' ? 'npm run demo:hero' : `npm run demo:video (o pasa otro prefijo)`;
}
