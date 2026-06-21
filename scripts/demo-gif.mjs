import { spawnSync } from 'node:child_process';
import { optimizeGif } from './demo-optimize.mjs';
import { demoVideoHint, findDemoVideo } from './demo-video-source.mjs';

const prefer = process.argv[2] ?? 'hero';

const input = await findDemoVideo(prefer);
if (!input) {
  console.error(`No se encontró video.webm para "${prefer}". Ejecuta primero: ${demoVideoHint(prefer)}`);
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
