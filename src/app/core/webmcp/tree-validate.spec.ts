import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from '../state/component-tree.store';
import { validateTreeState } from './tree-validate';

describe('validateTreeState', () => {
  it('acepta un árbol inicial válido', () => {
    const result = validateTreeState(createInitialTreeState());
    expect(result.ok).toBe(true);
  });

  it('rechaza JSON sin rootId', () => {
    const result = validateTreeState({ nodes: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/rootId/i);
  });

  it('rechaza kinds inválidos', () => {
    const state = createInitialTreeState();
    state.nodes['root'].kind = 'widget' as never;
    const result = validateTreeState(state);
    expect(result.ok).toBe(false);
  });

  it('rechaza hijos huérfanos', () => {
    const state = createInitialTreeState();
    state.nodes['orphan'] = {
      id: 'orphan',
      kind: 'button',
      label: 'Huérfano',
      props: {},
      children: [],
      parentId: 'root',
    };
    const result = validateTreeState(state);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/huérfanos|padre|listado/i);
  });

  it('rechaza referencias hijo-padre inconsistentes', () => {
    const state = createInitialTreeState();
    state.nodes['a'] = { id: 'a', kind: 'container', label: 'A', props: {}, children: ['b'], parentId: 'root' };
    state.nodes['b'] = { id: 'b', kind: 'container', label: 'B', props: {}, children: ['a'], parentId: 'a' };
    state.nodes['root'].children = ['a'];
    const result = validateTreeState(state);
    expect(result.ok).toBe(false);
  });
});
