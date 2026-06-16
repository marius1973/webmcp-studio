import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from './component-tree.store';
import { previewImportJson } from './project-import';

describe('previewImportJson', () => {
  it('acepta un export válido', () => {
    const json = JSON.stringify({
      id: 'p1',
      name: 'Demo',
      tree: createInitialTreeState(),
    });
    const result = previewImportJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.name).toBe('Demo');
      expect(result.nodeCount).toBe(1);
    }
  });

  it('rechaza JSON malformado', () => {
    const result = previewImportJson('{ no es json');
    expect(result.ok).toBe(false);
  });

  it('rechaza árbol inválido', () => {
    const result = previewImportJson(JSON.stringify({ tree: { rootId: 'x', nodes: {} } }));
    expect(result.ok).toBe(false);
  });
});
