/** Tipos compartidos de la capa WebMCP del Studio. */

import type { AgentLane } from '../agents/agent-lane.types';

export type ToolOrigin = 'user' | 'agent';
export type ToolSource = 'app' | 'route' | 'service';

/** Resultado de ejecutar una tool WebMCP (texto + flag de error). */
export interface ToolExecuteResult {
  text: string;
  isError: boolean;
}

/** Metadatos de una tool registrada, para mostrar en el Panel de Herramientas. */
export interface McpToolMeta {
  name: string;
  description: string;
  source: ToolSource;
  inputSchema?: Record<string, unknown>;
}

/** Una llamada a tool registrada en la consola del agente. */
export interface ToolCallLog {
  toolName: string;
  args: unknown;
  result: unknown;
  status: 'ok' | 'error';
  origin: ToolOrigin;
  durationMs: number;
  at: number;
  /** Carril multi-agente (opcional; no rompe logs sin lane). */
  lane?: AgentLane;
}
