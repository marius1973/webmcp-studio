import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from '../state/component-tree.store';
import { templateById } from '../state/project-templates';
import { buildTreeSchemaExport, TREE_STATE_JSON_SCHEMA } from './tree-schema';

describe('tree-schema', () => {
  it('exporta schema + instancia', () => {
    const state = createInitialTreeState();
    const doc = buildTreeSchemaExport(state);
    expect(doc.schema).toEqual(TREE_STATE_JSON_SCHEMA);
    expect(doc.instance.rootId).toBe('root');
    expect(doc.meta.nodeCount).toBe(1);
  });

  it('valida plantilla landing', () => {
    const state = templateById('landing-saas')!.tree();
    const doc = buildTreeSchemaExport(state);
    expect(doc.meta.nodeCount).toBeGreaterThan(5);
  });
});
