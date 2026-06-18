import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { optimizeGif } from './demo-optimize.mjs';

const prefer = process.argv[2] ?? 'hero';

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

const input = pickVideo(await collectVideos('test-results'), prefer);
if (!input) {
  const hint = prefer === 'hero' ? 'npm run demo:hero' : `npm run demo:video (o pasa otro prefijo: node scripts/demo-gif.mjs <prefijo>)`;
  console.error(`No se encontró video.webm para "${prefer}". Ejecuta primero: ${hint}`);
  process.exit(1);
}
console.log(`Fuente: ${input}`);

const output = 'docs/demo.gif';
// 8 fps + paleta 96 colores: base más liviana antes de gifsicle
const filter =
  'fps=8,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3[out]';

const result = spawnSync(
  'ffmpeg',
  ['-y', '-i', input, '-filter_complex', filter, '-map', '[out]', output],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (result.status !== 0) process.exit(result.status ?? 1);

const { before, after } = await optimizeGif(output);
const mb = (n) => (n / (1024 * 1024)).toFixed(2);
const pct = before ? Math.round((1 - after / before) * 100) : 0;
console.log(`GIF generado: ${output} (${mb(after)} MB, −${pct}% tras optimizar)`);
