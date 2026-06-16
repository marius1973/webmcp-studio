import {
  DestroyRef,
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
  provideExperimentalWebMcpTools,
} from '@angular/core';
import { ToolRegistryStore } from '../state/tool-registry.store';
import { AgentLogStore } from '../state/agent-log.store';
import { McpToolMeta } from './webmcp.types';

/** Tools de la sección Docs: distintas a las del editor, para demostrar el cambio de tools por ruta. */
export const DOCS_TOOL_METAS: McpToolMeta[] = [
  { name: 'search_docs', source: 'route', description: 'Busca en la documentación del Studio.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'list_sections', source: 'route', description: 'Lista las secciones de la documentación.', inputSchema: { type: 'object', properties: {} } },
];

const wrap = (text: string) => ({ content: [{ type: 'text' as const, text }] });

export function provideDocsTools(): (Provider | EnvironmentProviders)[] {
  return [
    provideExperimentalWebMcpTools([
      {
        name: 'search_docs',
        description: 'Busca en la documentación del Studio.',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
        execute: (a) => {
          const query = typeof a['query'] === 'string' ? a['query'] : '';
          const text = `Resultados para "${query}": WebMCP, Commands, Signal Forms.`;
          inject(AgentLogStore).record({ toolName: 'search_docs', args: { query }, result: text, status: 'ok', origin: 'agent', durationMs: 0, at: Date.now() });
          return wrap(text);
        },
      },
      {
        name: 'list_sections',
        description: 'Lista las secciones de la documentación.',
        inputSchema: { type: 'object', properties: {} },
        execute: () => {
          const text = 'Introducción, Arquitectura, Tools';
          inject(AgentLogStore).record({ toolName: 'list_sections', args: {}, result: text, status: 'ok', origin: 'agent', durationMs: 0, at: Date.now() });
          return wrap(text);
        },
      },
    ]),
    provideEnvironmentInitializer(() => {
      const registry = inject(ToolRegistryStore);
      const destroyRef = inject(DestroyRef);
      registry.addMany(DOCS_TOOL_METAS);
      destroyRef.onDestroy(() => registry.removeMany(DOCS_TOOL_METAS.map((m) => m.name)));
    }),
  ];
}
