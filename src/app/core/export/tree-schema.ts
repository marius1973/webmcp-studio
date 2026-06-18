import { TreeState } from '../state/component-tree.types';
import { COMPONENT_KINDS } from '../state/component-tree.types';

/** JSON Schema (draft 2020-12) del TreeState para `export_schema` e integraciones. */
export const TREE_STATE_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://webmcp-studio.dev/schemas/tree-state.json',
  title: 'WebMCP Studio TreeState',
  description: 'Árbol normalizado de componentes UI del editor.',
  type: 'object',
  required: ['rootId', 'nodes'],
  additionalProperties: false,
  properties: {
    rootId: { type: 'string', description: 'ID del nodo raíz (único con parentId null).' },
    nodes: {
      type: 'object',
      additionalProperties: { $ref: '#/$defs/componentNode' },
      description: 'Mapa id → nodo.',
    },
  },
  $defs: {
    componentKind: {
      type: 'string',
      enum: [...COMPONENT_KINDS],
    },
    componentNode: {
      type: 'object',
      required: ['id', 'kind', 'label', 'props', 'children', 'parentId'],
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        kind: { $ref: '#/$defs/componentKind' },
        label: { type: 'string' },
        props: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Props tipadas como strings (variant, text, direction, href, src…).',
        },
        children: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs de hijos en orden.',
        },
        parentId: { type: ['string', 'null'] },
      },
    },
  },
} as const;

export interface TreeSchemaExport {
  schema: typeof TREE_STATE_JSON_SCHEMA;
  instance: TreeState;
  meta: {
    nodeCount: number;
    exportedAt: string;
    studioVersion: string;
  };
}

/** Documento listo para consumir: schema + instancia actual. */
export function buildTreeSchemaExport(state: TreeState, studioVersion = '0.0.0'): TreeSchemaExport {
  return {
    schema: TREE_STATE_JSON_SCHEMA,
    instance: state,
    meta: {
      nodeCount: Object.keys(state.nodes).length,
      exportedAt: new Date().toISOString(),
      studioVersion,
    },
  };
}

export function treeSchemaAsJson(state: TreeState): string {
  return JSON.stringify(buildTreeSchemaExport(state), null, 2);
}
