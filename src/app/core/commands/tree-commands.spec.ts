import { describe, it, expect } from 'vitest';
import { ComponentTreeStore } from '../state/component-tree.store';
import { createComponent, deleteComponent, moveComponent, updateNode } from './tree-commands';

describe('tree-commands', () => {
  it('createComponent inserta y selecciona', () => {
    const s = new ComponentTreeStore();
    createComponent('root', 'button').run(s);
    const child = s.childrenOf('root')[0];
    expect(child.kind).toBe('button');
    expect(s.selectedId()).toBe(child.id);
  });

  it('deleteComponent quita el nodo', () => {
    const s = new ComponentTreeStore();
    createComponent('root', 'card').run(s);
    const id = s.childrenOf('root')[0].id;
    deleteComponent(id).run(s);
    expect(s.childrenOf('root').length).toBe(0);
  });

  it('updateNode aplica label y props', () => {
    const s = new ComponentTreeStore();
    createComponent('root', 'text').run(s);
    const id = s.childrenOf('root')[0].id;
    updateNode(id, 'Hola', { text: 'Hola mundo' }).run(s);
    expect(s.node(id)?.label).toBe('Hola');
    expect(s.node(id)?.props['text']).toBe('Hola mundo');
  });

  it('moveComponent reubica el nodo', () => {
    const s = new ComponentTreeStore();
    createComponent('root', 'container').run(s);
    const a = s.childrenOf('root')[0].id;
    createComponent('root', 'button').run(s);
    const btn = s.childrenOf('root')[1].id;
    moveComponent(btn, a, 0).run(s);
    expect(s.childrenOf(a)[0].id).toBe(btn);
  });
});
