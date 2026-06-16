import { describe, it, expect } from 'vitest';
import { resolveEntryProjectId } from './project-entry';
import { DEFAULT_PROJECT_ID } from './project.constants';

describe('resolveEntryProjectId', () => {
  it('usa el último proyecto si sigue existiendo', () => {
    expect(resolveEntryProjectId(['alpha', 'beta-1'], 'beta-1')).toBe('beta-1');
  });

  it('cae en alpha si no hay último proyecto', () => {
    expect(resolveEntryProjectId(['alpha', 'beta-1'], null)).toBe('alpha');
  });

  it('cae en alpha si el último ya no existe', () => {
    expect(resolveEntryProjectId(['alpha'], 'borrado')).toBe('alpha');
  });

  it('devuelve alpha aunque aún no esté en la lista (activate lo crea)', () => {
    expect(resolveEntryProjectId([], null)).toBe(DEFAULT_PROJECT_ID);
  });
});
