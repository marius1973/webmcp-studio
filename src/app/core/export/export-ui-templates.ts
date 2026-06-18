import { SerializedNode } from '../webmcp/tree-serialize';

/** Fragmentos de template/styles compartidos entre export monolítico y por sección. */

export function buildNodeTemplateLines(nodeVar = 'node'): string[] {
  const n = nodeVar;
  return [
    `@if (${n}.kind === 'container') {`,
    `  <section class="ui-container" [ngClass]="layoutClass(${n}.props)">`,
    `    @for (child of ${n}.children; track child.id) {`,
    `      <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: child }" />`,
    `    }`,
    `  </section>`,
    `} @else if (${n}.kind === 'card') {`,
    `  <article class="ui-card" [ngClass]="layoutClass(${n}.props)">`,
    `    <h2>{{ ${n}.label }}</h2>`,
    `    @for (child of ${n}.children; track child.id) {`,
    `      <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: child }" />`,
    `    }`,
    `  </article>`,
    `} @else if (${n}.kind === 'button') {`,
    `  <button type="button" class="ui-btn" [attr.data-variant]="${n}.props['variant'] || 'primary'">`,
    `    {{ ${n}.label }}`,
    `  </button>`,
    `} @else if (${n}.kind === 'text') {`,
    `  <p class="ui-text" [ngClass]="textClass(${n}.props)">{{ ${n}.props['text'] || ${n}.label }}</p>`,
    `} @else if (${n}.kind === 'input') {`,
    `  <input class="ui-input" [placeholder]="${n}.props['placeholder'] || ${n}.label" />`,
    `} @else if (${n}.kind === 'link') {`,
    `  <a class="ui-link" [href]="${n}.props['href'] || '#'">{{ ${n}.props['text'] || ${n}.label }}</a>`,
    `} @else if (${n}.kind === 'divider') {`,
    `  <hr class="ui-divider" />`,
    `} @else if (${n}.kind === 'image') {`,
    `  @if (${n}.props['src']) {`,
    `    <img class="ui-img" [src]="${n}.props['src']" [alt]="${n}.props['alt'] || ${n}.label" />`,
    `  }`,
    `}`,
  ];
}

export const UI_COMPONENT_STYLES = `
    .ui-layout { display:flex; flex-direction:column; gap:.75rem; }
    .ui-row { flex-direction:row; flex-wrap:wrap; }
    .ui-gap-sm { gap:.35rem; }
    .ui-gap-lg { gap:1.25rem; }
    .ui-align-center { align-items:center; }
    .ui-align-start { align-items:flex-start; }
    .ui-container { margin: .5rem 0; }
    .ui-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      background: var(--surface-1);
      margin: .5rem 0;
    }
    .ui-card h2 { margin: 0 0 .75rem; font-size: 1rem; }
    .ui-btn {
      border: 0; border-radius: 8px; padding: .45rem .9rem; font-size: .85rem;
      cursor: pointer; color: #fff; background: var(--accent);
    }
    .ui-btn[data-variant="ghost"] {
      background: transparent; border: 1px solid var(--accent); color: var(--accent);
    }
    .ui-btn[data-variant="danger"] { background: #c0455f; }
    .ui-text { margin: .35rem 0; font-size: .9rem; }
    .ui-text-hero { font-size: 1.45rem; font-weight: 600; }
    .ui-text-caption { font-size: .75rem; color: var(--muted); }
    .ui-input {
      background: var(--surface-1); border: 1px solid var(--border); border-radius: 8px;
      padding: .45rem .7rem; color: var(--fg); font-size: .85rem; min-width: 12rem;
    }
    .ui-link { color: var(--accent); text-decoration: none; font-size: .85rem; }
    .ui-divider { border: 0; border-top: 1px solid var(--border); margin: .5rem 0; }
    .ui-img { max-width: 100%; border-radius: 8px; }
`;

export const UI_HELPER_METHODS = `
  layoutClass(props: Record<string, string>): string[] {
    const c = ['ui-layout'];
    if (props['direction'] === 'row') c.push('ui-row');
    if (props['gap'] === 'sm') c.push('ui-gap-sm');
    if (props['gap'] === 'lg') c.push('ui-gap-lg');
    if (props['align'] === 'center') c.push('ui-align-center');
    if (props['align'] === 'start') c.push('ui-align-start');
    return c;
  }

  textClass(props: Record<string, string>): string {
    const s = props['textSize'];
    if (s === 'hero') return 'ui-text-hero';
    if (s === 'caption') return 'ui-text-caption';
    return 'ui-text';
  }
`;

export function sectionFileBase(node: SerializedNode): string {
  const fromLabel = node.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fromId = node.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return fromLabel || fromId || 'section';
}

export function sectionClassName(base: string): string {
  const parts = base.split('-').filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return `${parts.join('')}SectionComponent`;
}

export function sectionSelector(base: string): string {
  return `app-${base}-section`;
}
