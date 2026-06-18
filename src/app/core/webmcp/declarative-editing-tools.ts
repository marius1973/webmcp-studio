import {
  DestroyRef,
  EnvironmentProviders,
  inject,
  provideEnvironmentInitializer,
  declareExperimentalWebMcpTool,
} from '@angular/core';
import { ToolRegistryStore } from '../state/tool-registry.store';
import { EditingToolsService } from './editing-tools.service';
import { ComponentTreeStore } from '../state/component-tree.store';

const RATIONALE = { type: 'string', description: 'Por qué realizas esta acción (Modo Observador).' } as const;

/**
 * Tools declarativas ligadas al nodo seleccionado (`declareExperimentalWebMcpTool`).
 * Complementan las tools imperativas de `provideExperimentalWebMcpTools`.
 */
export function provideDeclarativeEditingTools(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const edit = inject(EditingToolsService);
    const tree = inject(ComponentTreeStore);
    const registry = inject(ToolRegistryStore);
    const destroyRef = inject(DestroyRef);

    const metas = [
      {
        name: 'update_selected_component',
        source: 'route' as const,
        description: 'Actualiza label/props del nodo actualmente seleccionado.',
        inputSchema: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            props: { type: 'object', additionalProperties: { type: 'string' } },
            rationale: RATIONALE,
          },
        },
      },
      {
        name: 'delete_selected_component',
        source: 'route' as const,
        description: 'Borra el nodo seleccionado (no la raíz).',
        inputSchema: { type: 'object', properties: { rationale: RATIONALE } },
      },
    ];

    registry.addMany(metas);
    destroyRef.onDestroy(() => registry.removeMany(metas.map((m) => m.name)));

    declareExperimentalWebMcpTool({
      name: 'update_selected_component',
      description: 'Actualiza el nodo seleccionado en el árbol (declarativo/contextual).',
      inputSchema: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          props: { type: 'object', additionalProperties: { type: 'string' } },
          rationale: RATIONALE,
        },
      },
      execute: (a) => {
        const id = tree.selectedId();
        if (!id) {
          return { content: [{ type: 'text' as const, text: 'No hay nodo seleccionado' }], isError: true };
        }
        const res = edit.updateComponent(
          id,
          typeof a['label'] === 'string' ? a['label'] : undefined,
          (a['props'] as Record<string, string>) ?? undefined,
          String(a['rationale'] ?? ''),
        );
        return { content: [{ type: 'text' as const, text: res.text }], isError: res.isError };
      },
    });

    declareExperimentalWebMcpTool({
      name: 'delete_selected_component',
      description: 'Borra el nodo seleccionado (declarativo/contextual).',
      inputSchema: { type: 'object', properties: { rationale: RATIONALE } },
      execute: async (a) => {
        const id = tree.selectedId();
        if (!id) {
          return { content: [{ type: 'text' as const, text: 'No hay nodo seleccionado' }], isError: true };
        }
        const res = await edit.deleteComponent(id, String(a['rationale'] ?? ''));
        return { content: [{ type: 'text' as const, text: res.text }], isError: res.isError };
      },
    });
  });
}
