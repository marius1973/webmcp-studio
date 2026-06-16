import { Injectable, computed, signal } from '@angular/core';
import { ToolCallLog } from '../webmcp/webmcp.types';

/** Historial de tool calls que muestra la consola del agente. */
@Injectable({ providedIn: 'root' })
export class AgentLogStore {
  private readonly _log = signal<ToolCallLog[]>([]);

  readonly log = this._log.asReadonly();
  readonly count = computed(() => this._log().length);

  record(entry: ToolCallLog): void {
    this._log.update((l) => [...l, entry]);
  }

  clear(): void {
    this._log.set([]);
  }
}
