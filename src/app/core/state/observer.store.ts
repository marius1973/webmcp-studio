import { Injectable, computed, signal } from '@angular/core';
import { ToolOrigin } from '../webmcp/webmcp.types';

/** Un paso narrado del Modo Observador: qué pasó y por qué. */
export interface ObserverEvent {
  action: string;       // nombre de la tool/command
  what: string;         // qué hizo (resultado)
  rationale: string;    // por qué (explicación del agente)
  origin: ToolOrigin;
  affected: string[];   // ids de nodos tocados
  status: 'ok' | 'error';
  at: number;
}

/**
 * Modo Observador: el agente explica cada acción (qué y por qué).
 * `enabled` controla si la narración está activa; los eventos alimentan la timeline.
 */
@Injectable({ providedIn: 'root' })
export class ObserverStore {
  readonly enabled = signal(true);

  private readonly _events = signal<ObserverEvent[]>([]);
  readonly events = this._events.asReadonly();
  readonly count = computed(() => this._events().length);
  readonly agentCount = computed(() => this._events().filter((e) => e.origin === 'agent').length);

  narrate(event: ObserverEvent): void {
    if (!this.enabled()) return;
    this._events.update((e) => [...e, event]);
  }

  toggle(): void {
    this.enabled.update((v) => !v);
  }

  clear(): void {
    this._events.set([]);
  }
}
