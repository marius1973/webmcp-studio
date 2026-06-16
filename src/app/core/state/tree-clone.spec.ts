import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from './component-tree.store';
import { cloneTreeState } from './tree-clone';

describe('cloneTreeState', () => {
  it('clona sin compartir referencias mutables', () => {
    const original = createInitialTreeState();
    const copy = cloneTreeState(original);
    copy.nodes['root'].label = 'Otro';
    copy.nodes['root'].children.push('x');
    copy.nodes['root'].props['k'] = 'v';
    expect(original.nodes['root'].label).toBe('AppRoot');
    expect(original.nodes['root'].children).toEqual([]);
    expect(original.nodes['root'].props).toEqual({});
  });
});
