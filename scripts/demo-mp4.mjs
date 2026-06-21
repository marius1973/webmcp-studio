import { stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { demoVideoHint, findDemoVideo } from './demo-video-source.mjs';

const prefer = process.argv[2] ?? 'hero';
const input = await findDemoVideo(prefer);

if (!input) {
  console.error(`No se encontró video.webm para "${prefer}". Ejecuta primero: ${demoVideoHint(prefer)}`);
  process.exit(1);
}

console.log(`Fuente: ${input}`);

const output = 'docs/demo.mp4';
const result = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    input,
    '-vf',
    'fps=24,scale=960:-2:flags=lanczos',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-crf',
    '26',
    '-an',
    output,
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (result.status !== 0) process.exit(result.status ?? 1);

const bytes = (await stat(output)).size;
const mb = (n) => (n / (1024 * 1024)).toFixed(2);
console.log(`MP4 generado: ${output} (${mb(bytes)} MB)`);
