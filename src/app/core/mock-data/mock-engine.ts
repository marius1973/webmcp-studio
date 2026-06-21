import { Injectable } from '@angular/core';
import { MockContext } from './mock-path';

const FEATURE_TITLES = ['AI Insights', 'Real-time', 'Collaboration'] as const;
const FEATURE_BODIES = [
  'Detección automática de anomalías en tus métricas.',
  'Métricas al instante con latencia inferior a 50 ms.',
  'Comparte dashboards con tu equipo en un clic.',
] as const;
const NAMES = [
  'Alex Chen',
  'María García',
  'Jordan Lee',
  'Samira Patel',
  'Lucas Müller',
  'Elena Rossi',
] as const;

function seededIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function pick<T>(seed: string, options: readonly T[]): T {
  return options[seededIndex(seed, options.length)]!;
}

export type MockGenerator = (ctx: MockContext) => string;

/** 10+ generadores hardcodeados (sin dependencias externas). */
export const MOCK_GENERATORS: Record<string, MockGenerator> = {
  'hero.title': () => 'Analytics Dashboard Pro',
  'hero.subtitle': () => 'Real-time insights for data teams',
  'hero.cta': () => 'Start free trial',
  'hero.body': () => 'Visualiza KPIs, funnels y cohortes en un solo lugar.',
  'card.feature': (ctx) => pick(ctx.nodeId, FEATURE_TITLES),
  'card.body': (ctx) => pick(ctx.nodeId, FEATURE_BODIES),
  'stats.number': (ctx) => {
    const base = 1200 + seededIndex(ctx.nodeId, 8800);
    return base.toLocaleString('en-US');
  },
  'user.name': (ctx) => pick(ctx.nodeId, NAMES),
  'user.avatar': (ctx) => `https://i.pravatar.cc/150?u=${encodeURIComponent(ctx.nodeId)}`,
  'input.email': () => 'name@company.com',
  'link.text': () => 'Ver documentación',
  'default.text': (ctx) => `Contenido demo para ${ctx.label || ctx.path}`,
  'default.button': () => 'Get started',
};

@Injectable({ providedIn: 'root' })
export class MockDataEngine {
  resolve(ctx: MockContext): string {
    const key = this.resolveKey(ctx);
    const gen = MOCK_GENERATORS[key] ?? MOCK_GENERATORS['default.text']!;
    return gen(ctx);
  }

  resolveImageSrc(ctx: MockContext, existing?: string): string {
    if (existing?.trim()) return existing;
    if (ctx.path.includes('avatar') || ctx.label.toLowerCase().includes('avatar')) {
      return MOCK_GENERATORS['user.avatar']!(ctx);
    }
    return `https://picsum.photos/seed/${encodeURIComponent(ctx.nodeId)}/320/180`;
  }

  private resolveKey(ctx: MockContext): string {
    const path = ctx.path.toLowerCase();
    const parent = (ctx.parentLabel ?? '').toLowerCase();
    const label = ctx.label.toLowerCase();

    if (ctx.componentType === 'text') {
      if (ctx.textSize === 'hero' || path.endsWith('.title') || label.includes('titulo')) return 'hero.title';
      if (path.includes('hero') && path.endsWith('.subtitle')) return 'hero.subtitle';
      if (path.includes('hero') && ctx.textSize === 'body') return 'hero.subtitle';
      if (parent.includes('card') || path.includes('card') || /real-time|ai insights|collaboration/i.test(ctx.parentLabel ?? '')) {
        return path.endsWith('.title') ? 'card.feature' : 'card.body';
      }
      if (label.includes('kpi') || label.includes('valor') || label.includes('stats')) return 'stats.number';
      if (path.includes('hero')) return 'hero.body';
      if (path.includes('card') || parent.includes('card')) return 'card.body';
      return 'default.text';
    }

    if (ctx.componentType === 'button') {
      if (path.includes('hero') || parent.includes('hero')) return 'hero.cta';
      return 'default.button';
    }

    if (ctx.componentType === 'input') return 'input.email';

    if (ctx.componentType === 'link') return 'link.text';

    if (ctx.componentType === 'card' || ctx.componentType === 'container') {
      if (path.includes('hero') || label.includes('hero')) return 'hero.title';
      if (ctx.componentType === 'card') return 'card.feature';
      return 'default.text';
    }

    if (path in MOCK_GENERATORS) return path;
    return 'default.text';
  }
}
