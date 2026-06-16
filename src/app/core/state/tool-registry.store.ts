import { Injectable, computed, signal } from '@angular/core';
import { McpToolMeta } from '../webmcp/webmcp.types';

/**
 * Espejo en signals de las tools registradas en WebMCP.
 * El Panel de Herramientas lo lee en tiempo real. add/remove reflejan
 * el registro/desregistro por ruta (auto-cleanup) en la UI.
 */
@Injectable({ providedIn: 'root' })
export class ToolRegistryStore {
  private readonly _tools = signal<McpToolMeta[]>([]);

  readonly tools = this._tools.asReadonly();
  readonly count = computed(() => this._tools().length);

  add(meta: McpToolMeta): void {
    this._tools.update((t) => [...t.filter((x) => x.name !== meta.name), meta]);
  }

  addMany(metas: McpToolMeta[]): void {
    this._tools.update((t) => {
      const names = new Set(metas.map((m) => m.name));
      return [...t.filter((x) => !names.has(x.name)), ...metas];
    });
  }

  remove(name: string): void {
    this._tools.update((t) => t.filter((x) => x.name !== name));
  }

  removeMany(names: string[]): void {
    const set = new Set(names);
    this._tools.update((t) => t.filter((x) => !set.has(x.name)));
  }
}
