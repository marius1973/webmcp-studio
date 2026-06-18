#!/usr/bin/env node
/** Ejecuta el benchmark de tools vs enfoque DOM simulado. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const spec = join(root, '..', 'src', 'app', 'core', 'benchmark', 'tool-benchmark.spec.ts');

const r = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vitest', 'run', spec],
  { stdio: 'inherit', cwd: join(root, '..'), shell: process.platform === 'win32' },
);

process.exit(r.status ?? 1);
