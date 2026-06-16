/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readLastProjectId, persistLastProjectId, clearLastProjectId, LAST_PROJECT_KEY } from './project-last';

describe('project-last', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste y lee el último proyecto', () => {
    persistLastProjectId('demo-abc');
    expect(readLastProjectId()).toBe('demo-abc');
  });

  it('clear elimina el último proyecto', () => {
    persistLastProjectId('demo-abc');
    clearLastProjectId();
    expect(readLastProjectId()).toBeNull();
  });

  it('tolera localStorage bloqueado', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => persistLastProjectId('x')).not.toThrow();
    expect(readLastProjectId()).toBeNull();
    spy.mockRestore();
  });

  it('usa la clave esperada', () => {
    persistLastProjectId('p1');
    expect(localStorage.getItem(LAST_PROJECT_KEY)).toBe('p1');
  });
});
