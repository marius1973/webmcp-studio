import { describe, expect, it } from 'vitest';
import { formatSizePx, sizeStyle } from './canvas-resize';

describe('canvas-resize', () => {
  it('maps width/height props to inline styles', () => {
    expect(sizeStyle({ width: '200', height: '120px' })).toEqual({
      width: '200px',
      height: '120px',
      maxWidth: '100%',
      boxSizing: 'border-box',
    });
    expect(sizeStyle({})).toEqual({});
  });

  it('clamps resize px values', () => {
    expect(formatSizePx(10)).toBe('48');
    expect(formatSizePx(201.4)).toBe('201');
  });
});
