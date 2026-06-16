import {
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
  provideExperimentalWebMcpTools,
} from '@angular/core';
import { ToolRegistryStore } from '../state/tool-registry.store';
import { StudioToolsService } from './studio-tools.service';
import { McpToolMeta } from './webmcp.types';

/** Metadatos de las tools de nivel-app (se muestran en el Panel de Herramientas). */
export const STUDIO_TOOL_METAS: McpToolMeta[] = [
  {
    name: 'greet',
    description: 'Saluda al agente y confirma que el Studio está vivo.',
    source: 'app',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'ping_studio',
    description: 'Hace ping al Studio con un nombre; devuelve pong.',
    source: 'app',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Quién hace el ping.' } },
      additionalProperties: false,
    },
  },
];

/**
 * Tools de nivel-app (greet, ping_studio).
 * `provideExperimentalWebMcpTools` las registra al iniciar y las desregistra al destruir la app.
 * El initializer siembra el ToolRegistryStore para que el panel las refleje.
 */
export function provideStudioTools(): (Provider | EnvironmentProviders)[] {
  return [
    provideExperimentalWebMcpTools([
      {
        name: 'greet',
        description: 'Saluda al agente y confirma que el Studio está vivo.',
        inputSchema: { type: 'object', properties: {} },
        execute: () => ({
          content: [{ type: 'text', text: inject(StudioToolsService).greet('agent') }],
        }),
      },
      {
        name: 'ping_studio',
        description: 'Hace ping al Studio con un nombre; devuelve pong.',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string', description: 'Quién hace el ping.' } },
          additionalProperties: false,
        },
        execute: (args) => {
          const name = typeof args['name'] === 'string' ? args['name'] : '';
          return { content: [{ type: 'text', text: inject(StudioToolsService).ping(name, 'agent') }] };
        },
      },
    ]),
    provideEnvironmentInitializer(() => {
      inject(ToolRegistryStore).addMany(STUDIO_TOOL_METAS);
    }),
  ];
}
