import { describe, it, expect } from 'vitest';
import { ComponentTreeStore } from '../state/component-tree.store';
import { serializeTree } from './tree-serialize';

describe('serializeTree', () => {
  it('serializa el árbol anidado', () => {
    const s = new ComponentTreeStore();
    const card = s.createChild('root', 'card');
    s.createChild(card, 'text');
    const out = serializeTree(s.state());
    expect(out.id).toBe('root');
    expect(out.children[0].kind).toBe('card');
    expect(out.children[0].children[0].kind).toBe('text');
  });
});
