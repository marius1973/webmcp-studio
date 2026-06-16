import { Injectable } from '@angular/core';

export type WebMcpMode = 'native' | 'polyfill' | 'unavailable';

/**
 * Único punto que toca el estado de `navigator.modelContext`.
 * El modo lo fija main.ts en el arranque (antes de bootstrap).
 */
@Injectable({ providedIn: 'root' })
export class WebMcpCapability {
  readonly mode: WebMcpMode =
    (globalThis as { __WEBMCP_MODE?: WebMcpMode }).__WEBMCP_MODE ?? 'unavailable';

  get available(): boolean {
    return this.mode !== 'unavailable';
  }

  get label(): string {
    switch (this.mode) {
      case 'native':
        return 'WebMCP nativo (navigator.modelContext)';
      case 'polyfill':
        return 'WebMCP vía polyfill (sin agente nativo)';
      default:
        return 'WebMCP no disponible';
    }
  }
}
