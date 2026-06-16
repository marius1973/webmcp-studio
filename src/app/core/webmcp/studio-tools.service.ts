import { Injectable, inject } from '@angular/core';
import { AgentLogStore } from '../state/agent-log.store';
import { ToolOrigin } from './webmcp.types';

/**
 * Lógica de negocio detrás de las tools del Studio.
 * Tanto los `execute` de WebMCP como los botones de la UI llaman aquí,
 * así agente y humano comparten exactamente el mismo código.
 */
@Injectable({ providedIn: 'root' })
export class StudioToolsService {
  private readonly log = inject(AgentLogStore);

  greet(origin: ToolOrigin = 'agent'): string {
    const result = 'Hello agent! Angular WebMCP Studio está vivo. 🚀';
    this.record('greet', {}, result, origin);
    return result;
  }

  ping(name: string, origin: ToolOrigin = 'agent'): string {
    const who = name.trim() || 'anónimo';
    const result = `pong → ${who}`;
    this.record('ping_studio', { name }, result, origin);
    return result;
  }

  private record(toolName: string, args: unknown, result: unknown, origin: ToolOrigin): void {
    this.log.record({
      toolName,
      args,
      result,
      status: 'ok',
      origin,
      durationMs: 0,
      at: Date.now(),
    });
  }
}
