import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function findLatestVideo(dir) {
  let latest = null;

  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (entry.name !== 'video.webm') continue;
      const mtime = (await stat(full)).mtimeMs;
      if (!latest || mtime > latest.mtime) latest = { path: full, mtime };
    }
  }

  await walk(dir);
  return latest?.path ?? null;
}

const input = await findLatestVideo('test-results');
if (!input) {
  console.error('No se encontró video.webm. Ejecutá primero: npm run demo:video');
  process.exit(1);
}

const output = 'docs/demo.gif';
const filter =
  'fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3[out]';

const result = spawnSync(
  'ffmpeg',
  ['-y', '-i', input, '-filter_complex', filter, '-map', '[out]', output],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`GIF generado: ${output}`);
