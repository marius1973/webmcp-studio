import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from './component-tree.store';
import { encodeTreeShare, decodeTreeShare, buildShareUrl } from './project-share';

describe('project-share', () => {
  it('codifica y decodifica el árbol sin pérdida', () => {
    const state = createInitialTreeState();
    const token = encodeTreeShare(state);
    const decoded = decodeTreeShare(token);
    expect(decoded).toEqual(state);
  });

  it('rechaza tokens corruptos', () => {
    expect(decodeTreeShare('!!!')).toBeNull();
    expect(decodeTreeShare('')).toBeNull();
  });

  it('buildShareUrl incluye project id y share param', () => {
    const state = createInitialTreeState();
    const url = buildShareUrl(state, 'alpha');
    expect(url).toContain('/project/alpha?share=');
  });
});
