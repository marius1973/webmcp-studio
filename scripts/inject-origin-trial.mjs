/**
 * Inyecta el token de Chrome Origin Trial (WebMCP) en index.html tras el build.
 * Uso en Vercel: variable de entorno WEBMCP_ORIGIN_TRIAL_TOKEN
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const token = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN?.trim();
if (!token) {
  console.log('WEBMCP_ORIGIN_TRIAL_TOKEN no definido — se omite Origin Trial.');
  process.exit(0);
}

const indexPath = join('dist', 'webmcp-studio', 'browser', 'index.html');
if (!existsSync(indexPath)) {
  console.error(`No se encontró ${indexPath}. Ejecuta ng build primero.`);
  process.exit(1);
}

const meta = `<meta http-equiv="origin-trial" content="${token}" />`;
let html = readFileSync(indexPath, 'utf8');

if (html.includes('origin-trial')) {
  html = html.replace(/<meta http-equiv="origin-trial"[^>]*>/i, meta);
} else {
  html = html.replace('</head>', `  ${meta}\n</head>`);
}

writeFileSync(indexPath, html);
console.log('Origin Trial meta inyectado en dist.');
