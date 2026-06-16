import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppShell } from './app/shell/app-shell';

type WebMcpMode = 'native' | 'polyfill' | 'unavailable';

/**
 * Decide el modo WebMCP ANTES de bootstrap:
 *  - native: el navegador ya expone navigator.modelContext (Edge 147+, Chrome 149 OT).
 *  - polyfill: cargamos @mcp-b/webmcp-polyfill para demos sin agente nativo.
 */
async function resolveWebMcp(): Promise<WebMcpMode> {
  if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
    return 'native';
  }
  try {
    await import('@mcp-b/webmcp-polyfill');
    if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
      return 'polyfill';
    }
  } catch {
    /* sin polyfill disponible */
  }
  return 'unavailable';
}

async function bootstrap(): Promise<void> {
  (globalThis as { __WEBMCP_MODE?: WebMcpMode }).__WEBMCP_MODE = await resolveWebMcp();
  await bootstrapApplication(AppShell, appConfig);
}

bootstrap().catch((err) => console.error(err));
