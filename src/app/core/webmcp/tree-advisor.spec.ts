import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from '../state/component-tree.store';
import { explainSelection, suggestNextSteps } from './tree-advisor';

describe('tree-advisor', () => {
  it('explainSelection describe la raíz', () => {
    const state = createInitialTreeState();
    const info = explainSelection(state, 'root');
    expect(info?.kind).toBe('container');
    expect(info?.id).toBe('root');
  });

  it('suggestNextSteps detecta árbol vacío', () => {
    const state = createInitialTreeState();
    const tips = suggestNextSteps(state, 'root');
    expect(tips.some((t) => t.message.includes('vacío') || t.message.includes('botón'))).toBe(true);
  });
});
