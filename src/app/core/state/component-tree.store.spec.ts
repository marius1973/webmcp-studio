import { describe, it, expect } from 'vitest';
import { ComponentTreeStore } from './component-tree.store';

describe('ComponentTreeStore', () => {
  it('crea y anida componentes', () => {
    const s = new ComponentTreeStore();
    const card = s.createChild('root', 'card');
    const btn = s.createChild(card, 'button');
    expect(s.childrenOf('root').length).toBe(1);
    expect(s.childrenOf(card)[0].id).toBe(btn);
    expect(s.nodeCount()).toBe(3);
  });

  it('borra un subárbol completo', () => {
    const s = new ComponentTreeStore();
    const card = s.createChild('root', 'card');
    s.createChild(card, 'button');
    s.removeSubtree(card);
    expect(s.childrenOf('root').length).toBe(0);
    expect(s.nodeCount()).toBe(1);
  });

  it('no borra la raíz', () => {
    const s = new ComponentTreeStore();
    s.removeSubtree('root');
    expect(s.node('root')).toBeTruthy();
  });

  it('mueve nodos entre padres', () => {
    const s = new ComponentTreeStore();
    const a = s.createChild('root', 'container');
    const b = s.createChild('root', 'container');
    const btn = s.createChild(a, 'button');
    s.moveNode(btn, b, 0);
    expect(s.childrenOf(a).length).toBe(0);
    expect(s.childrenOf(b)[0].id).toBe(btn);
  });

  it('detecta ancestros para evitar ciclos', () => {
    const s = new ComponentTreeStore();
    const a = s.createChild('root', 'container');
    const b = s.createChild(a, 'container');
    expect(s.isAncestor(a, b)).toBe(true);
    expect(s.isAncestor(b, a)).toBe(false);
  });

  it('parchea label y props', () => {
    const s = new ComponentTreeStore();
    const btn = s.createChild('root', 'button');
    s.patch(btn, { label: 'Guardar', props: { variant: 'danger' } });
    expect(s.node(btn)?.label).toBe('Guardar');
    expect(s.node(btn)?.props['variant']).toBe('danger');
  });
});
