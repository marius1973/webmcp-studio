import { describe, expect, it } from 'vitest';
import { MockDataEngine } from './mock-engine';
import { MockContext } from './mock-path';

const FEATURE_TITLES = ['AI Insights', 'Real-time', 'Collaboration'] as const;

function ctx(partial: Partial<MockContext> & Pick<MockContext, 'componentType' | 'nodeId'>): MockContext {
  return {
    label: 'Nodo',
    path: 'hero.title',
    ...partial,
  };
}

describe('MockDataEngine', () => {
  const engine = new MockDataEngine();

  it('resuelve hero.title y hero.subtitle', () => {
    expect(engine.resolve(ctx({ componentType: 'text', path: 'hero.title', textSize: 'hero', nodeId: 't1' }))).toBe(
      'Analytics Dashboard Pro',
    );
    expect(engine.resolve(ctx({ componentType: 'text', path: 'hero.subtitle', parentLabel: 'Hero', nodeId: 't2' }))).toBe(
      'Real-time insights for data teams',
    );
  });

  it('resuelve CTA y cards de feature', () => {
    expect(engine.resolve(ctx({ componentType: 'button', path: 'hero.cta', parentLabel: 'Hero', nodeId: 'b1' }))).toBe(
      'Start free trial',
    );
    const title = engine.resolve(ctx({ componentType: 'card', path: 'real-time', label: 'Real-time', nodeId: 'c1' }));
    expect(FEATURE_TITLES).toContain(title);
  });

  it('es estable por nodeId (sin parpadeo)', () => {
    const a = engine.resolve(ctx({ componentType: 'text', path: 'real-time.body', parentLabel: 'Real-time', nodeId: 'x' }));
    const b = engine.resolve(ctx({ componentType: 'text', path: 'real-time.body', parentLabel: 'Real-time', nodeId: 'x' }));
    expect(a).toBe(b);
  });

  it('genera avatar e imagen mock', () => {
    const src = engine.resolveImageSrc(ctx({ componentType: 'image', path: 'hero.image', nodeId: 'img1' }), '');
    expect(src).toContain('picsum.photos');
  });
});
