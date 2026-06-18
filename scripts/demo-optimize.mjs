import { rename, stat, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import gifsicle from 'gifsicle';

/** Comprime un GIF con gifsicle (-O3, lossy 80, 128 colores). Devuelve bytes antes/después. */
export async function optimizeGif(input = 'docs/demo.gif') {
  const tmp = input.replace(/\.gif$/i, '.opt.gif');
  const before = (await stat(input)).size;

  const result = spawnSync(
    gifsicle,
    ['-O3', '--lossy=80', '--colors', '128', input, '-o', tmp],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error(`gifsicle falló con código ${result.status ?? 1}`);
  }

  try {
    await unlink(input);
  } catch {
    /* ok */
  }
  await rename(tmp, input);

  const after = (await stat(input)).size;
  return { before, after, input };
}

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = process.argv[2] ?? 'docs/demo.gif';
  try {
    const { before, after } = await optimizeGif(input);
    const pct = before ? Math.round((1 - after / before) * 100) : 0;
    console.log(`Optimizado: ${formatSize(before)} → ${formatSize(after)} (−${pct}%)`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ENOENT')) {
      console.error(`No se encontró ${input}. Ejecuta primero: npm run demo:gif`);
    } else {
      console.error(msg);
    }
    process.exit(1);
  }
}
