import {
  DestroyRef,
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
  provideExperimentalWebMcpTools,
} from '@angular/core';
import { ToolRegistryStore } from '../state/tool-registry.store';
import { EditingToolsService } from './editing-tools.service';
import { McpToolMeta, ToolExecuteResult } from './webmcp.types';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function bool(v: unknown, fallback = true): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Campo `rationale` que invita al agente a explicar el porqué (Modo Observador). */
const RATIONALE = { type: 'string', description: 'Por qué realizas esta acción (Modo Observador).' } as const;

const PROPS_SCHEMA = {
  type: 'object',
  additionalProperties: { type: 'string' },
  description: 'Props del nodo (variant, text, placeholder…).',
} as const;

/** Schemas compartidos entre el panel de tools y las tools WebMCP reales. */
export const CREATE_COMPONENT_SCHEMA = {
  type: 'object',
  properties: { kind: { type: 'string' }, parentId: { type: 'string' }, rationale: RATIONALE },
  required: ['kind'],
  additionalProperties: false,
} as const;

export const UPDATE_COMPONENT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    props: PROPS_SCHEMA,
    rationale: RATIONALE,
  },
  required: ['id'],
  additionalProperties: false,
} as const;

export const DELETE_COMPONENT_SCHEMA = {
  type: 'object',
  properties: { id: { type: 'string' }, rationale: RATIONALE },
  required: ['id'],
  additionalProperties: false,
} as const;

export const MOVE_COMPONENT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    newParentId: { type: 'string' },
    index: { type: 'number' },
    rationale: RATIONALE,
  },
  required: ['id', 'newParentId'],
  additionalProperties: false,
} as const;

const RATIONALE_ONLY_SCHEMA = { type: 'object', properties: { rationale: RATIONALE } } as const;

export const EXPORT_PROJECT_CODE_SCHEMA = {
  type: 'object',
  properties: {
    projectName: { type: 'string', description: 'Nombre del proyecto (carpeta y package.json).' },
    download: { type: 'boolean', description: 'Si true, descarga un ZIP con proyecto Angular listo para npm install && npm start.' },
    rationale: RATIONALE,
  },
  additionalProperties: false,
} as const;

export const RUN_PLAYBOOK_SCHEMA = {
  type: 'object',
  properties: {
    playbookId: { type: 'string', description: 'ID del playbook (p. ej. landing-analytics, contact-form).' },
    rationale: RATIONALE,
  },
  required: ['playbookId'],
  additionalProperties: false,
} as const;

export const APPLY_PATCH_SCHEMA = {
  type: 'object',
  properties: {
    tree: {
      type: 'object',
      description: 'TreeState completo (rootId + nodes) que reemplaza el árbol actual.',
      properties: {
        rootId: { type: 'string' },
        nodes: { type: 'object', additionalProperties: { type: 'object' } },
      },
      required: ['rootId', 'nodes'],
    },
    rationale: RATIONALE,
  },
  required: ['tree'],
  additionalProperties: false,
} as const;

export const EXPORT_SCHEMA_SCHEMA = {
  type: 'object',
  properties: {
    download: { type: 'boolean', description: 'Si true, descarga tree-schema.json.' },
    rationale: RATIONALE,
  },
  additionalProperties: false,
} as const;

const NODE_ID_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'ID del nodo (por defecto: seleccionado).' },
    rationale: RATIONALE,
  },
  additionalProperties: false,
} as const;

/** Metadatos mostrados en el Panel de Herramientas (scope de ruta = editor). */
export const EDITING_TOOL_METAS: McpToolMeta[] = [
  { name: 'create_component', source: 'route', description: 'Crea un componente (kind) bajo un padre.', inputSchema: { ...CREATE_COMPONENT_SCHEMA } },
  { name: 'update_component', source: 'route', description: 'Actualiza label y/o props de un nodo.', inputSchema: { ...UPDATE_COMPONENT_SCHEMA } },
  { name: 'delete_component', source: 'route', description: 'Borra un nodo y su subárbol.', inputSchema: { ...DELETE_COMPONENT_SCHEMA } },
  { name: 'move_component', source: 'route', description: 'Mueve un nodo a otro padre en un índice.', inputSchema: { ...MOVE_COMPONENT_SCHEMA } },
  { name: 'read_tree', source: 'route', description: 'Devuelve el árbol actual (solo lectura).', inputSchema: { ...RATIONALE_ONLY_SCHEMA } },
  { name: 'list_component_types', source: 'route', description: 'Lista los tipos de componente disponibles.', inputSchema: { ...RATIONALE_ONLY_SCHEMA } },
  { name: 'undo', source: 'route', description: 'Deshace la última acción.', inputSchema: { ...RATIONALE_ONLY_SCHEMA } },
  { name: 'redo', source: 'route', description: 'Rehace la última acción deshecha.', inputSchema: { ...RATIONALE_ONLY_SCHEMA } },
  {
    name: 'export_project_code',
    source: 'route',
    description: 'Genera un proyecto Angular standalone y lo descarga como ZIP.',
    inputSchema: { ...EXPORT_PROJECT_CODE_SCHEMA },
  },
  {
    name: 'list_playbooks',
    source: 'route',
    description: 'Lista playbooks predefinidos disponibles para run_playbook.',
    inputSchema: { ...RATIONALE_ONLY_SCHEMA },
  },
  {
    name: 'run_playbook',
    source: 'route',
    description: 'Ejecuta un playbook predefinido en un solo undo.',
    inputSchema: { ...RUN_PLAYBOOK_SCHEMA },
  },
  {
    name: 'apply_patch',
    source: 'route',
    description: 'Reemplaza el árbol completo con un TreeState validado.',
    inputSchema: { ...APPLY_PATCH_SCHEMA },
  },
  {
    name: 'explain_selection',
    source: 'route',
    description: 'Describe el nodo seleccionado (kind, props, hijos).',
    inputSchema: { ...NODE_ID_SCHEMA },
  },
  {
    name: 'suggest_next',
    source: 'route',
    description: 'Sugerencias heurísticas para mejorar el árbol o el nodo actual.',
    inputSchema: { ...NODE_ID_SCHEMA },
  },
  {
    name: 'export_schema',
    source: 'route',
    description: 'Exporta JSON Schema + instancia del árbol actual.',
    inputSchema: { ...EXPORT_SCHEMA_SCHEMA },
  },
];

const wrap = (result: ToolExecuteResult) => ({
  content: [{ type: 'text' as const, text: result.text }],
  isError: result.isError,
});

/**
 * Tools de edición con scope de ruta. Registradas vía `provideExperimentalWebMcpTools`
 * y reflejadas en el ToolRegistryStore. Con `withExperimentalAutoCleanupInjectors`,
 * al navegar fuera del editor el injector de ruta se destruye: las tools se
 * desregistran de WebMCP y `DestroyRef.onDestroy` las quita del panel.
 */
export function provideEditingTools(): (Provider | EnvironmentProviders)[] {
  const svc = () => inject(EditingToolsService);
  return [
    provideExperimentalWebMcpTools([
      {
        name: 'create_component',
        description: 'Crea un componente (kind) bajo un padre.',
        inputSchema: CREATE_COMPONENT_SCHEMA,
        execute: (a) => wrap(svc().createComponent(str(a['kind']), str(a['parentId']) || undefined, str(a['rationale']))),
      },
      {
        name: 'update_component',
        description: 'Actualiza label y/o props de un nodo.',
        inputSchema: UPDATE_COMPONENT_SCHEMA,
        execute: (a) =>
          wrap(
            svc().updateComponent(
              str(a['id']),
              str(a['label']) || undefined,
              (a['props'] as Record<string, string>) ?? undefined,
              str(a['rationale']),
            ),
          ),
      },
      {
        name: 'delete_component',
        description: 'Borra un nodo y su subárbol.',
        inputSchema: DELETE_COMPONENT_SCHEMA,
        execute: async (a) => wrap(await svc().deleteComponent(str(a['id']), str(a['rationale']))),
      },
      {
        name: 'move_component',
        description: 'Mueve un nodo a otro padre en un índice.',
        inputSchema: MOVE_COMPONENT_SCHEMA,
        execute: (a) => wrap(svc().moveComponent(str(a['id']), str(a['newParentId']), num(a['index']), str(a['rationale']))),
      },
      {
        name: 'read_tree',
        description: 'Devuelve el árbol actual (solo lectura).',
        inputSchema: RATIONALE_ONLY_SCHEMA,
        execute: (a) => wrap(svc().readTree(str(a['rationale']))),
      },
      {
        name: 'list_component_types',
        description: 'Lista los tipos de componente disponibles.',
        inputSchema: RATIONALE_ONLY_SCHEMA,
        execute: (a) => wrap(svc().listTypes(str(a['rationale']))),
      },
      {
        name: 'undo',
        description: 'Deshace la última acción.',
        inputSchema: RATIONALE_ONLY_SCHEMA,
        execute: (a) => wrap(svc().undo(str(a['rationale']))),
      },
      {
        name: 'redo',
        description: 'Rehace la última acción deshecha.',
        inputSchema: RATIONALE_ONLY_SCHEMA,
        execute: (a) => wrap(svc().redo(str(a['rationale']))),
      },
      {
        name: 'export_project_code',
        description: 'Genera un proyecto Angular standalone (ng new style) y lo descarga como ZIP.',
        inputSchema: EXPORT_PROJECT_CODE_SCHEMA,
        execute: async (a) =>
          wrap(
            await svc().exportProjectCode(
              str(a['projectName']) || undefined,
              bool(a['download'], true),
              str(a['rationale']),
            ),
          ),
      },
      {
        name: 'list_playbooks',
        description: 'Lista playbooks predefinidos disponibles para run_playbook.',
        inputSchema: RATIONALE_ONLY_SCHEMA,
        execute: (a) => wrap(svc().listPlaybooks(str(a['rationale']))),
      },
      {
        name: 'run_playbook',
        description: 'Ejecuta un playbook predefinido en un solo undo.',
        inputSchema: RUN_PLAYBOOK_SCHEMA,
        execute: (a) => wrap(svc().runPlaybook(str(a['playbookId']), str(a['rationale']))),
      },
      {
        name: 'apply_patch',
        description: 'Reemplaza el árbol completo con un TreeState validado.',
        inputSchema: APPLY_PATCH_SCHEMA,
        execute: async (a) => wrap(await svc().applyPatch(a['tree'], str(a['rationale']))),
      },
      {
        name: 'explain_selection',
        description: 'Describe el nodo seleccionado (kind, props, hijos).',
        inputSchema: NODE_ID_SCHEMA,
        execute: (a) => wrap(svc().explainSelection(str(a['id']) || undefined, str(a['rationale']))),
      },
      {
        name: 'suggest_next',
        description: 'Sugerencias heurísticas para mejorar el árbol o el nodo actual.',
        inputSchema: NODE_ID_SCHEMA,
        execute: (a) => wrap(svc().suggestNext(str(a['id']) || undefined, str(a['rationale']))),
      },
      {
        name: 'export_schema',
        description: 'Exporta JSON Schema + instancia del árbol actual.',
        inputSchema: EXPORT_SCHEMA_SCHEMA,
        execute: (a) => wrap(svc().exportSchema(bool(a['download'], false), str(a['rationale']))),
      },
    ]),
    provideEnvironmentInitializer(() => {
      const registry = inject(ToolRegistryStore);
      const destroyRef = inject(DestroyRef);
      registry.addMany(EDITING_TOOL_METAS);
      destroyRef.onDestroy(() => registry.removeMany(EDITING_TOOL_METAS.map((m) => m.name)));
    }),
  ];
}
