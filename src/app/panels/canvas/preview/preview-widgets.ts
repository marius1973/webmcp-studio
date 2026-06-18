import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ComponentNode } from '../../../core/state/component-tree.types';
import { textSizeClass } from './preview-layout';

/** Componentes presentacionales que la IA "renderiza" vía NgComponentOutlet. */

@Component({
  selector: 'app-preview-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button class="pv-btn" [attr.data-variant]="variant()">{{ node().label }}</button>`,
  styles: [`
    .pv-btn { border:0; border-radius:8px; padding:.45rem .9rem; font-size:.85rem; cursor:pointer; color:#fff; background:var(--accent); }
    .pv-btn[data-variant="ghost"] { background:transparent; border:1px solid var(--accent); color:var(--accent); }
    .pv-btn[data-variant="danger"] { background:#c0455f; }
  `],
})
export class PreviewButton {
  readonly node = input.required<ComponentNode>();
  protected variant(): string {
    return this.node().props['variant'] || 'primary';
  }
}

@Component({
  selector: 'app-preview-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="sizeClass()">{{ node().props['text'] || node().label }}</span>`,
  styles: [
    `
    .pv-text-body { font-size:.9rem; color:var(--fg); }
    .pv-text-hero { font-size:1.45rem; font-weight:600; color:var(--fg); line-height:1.2; }
    .pv-text-caption { font-size:.75rem; color:var(--muted); }
  `,
  ],
})
export class PreviewText {
  readonly node = input.required<ComponentNode>();
  protected sizeClass(): string {
    return textSizeClass(this.node().props);
  }
}

@Component({
  selector: 'app-preview-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input class="pv-input" [attr.aria-label]="node().label" [placeholder]="node().props['placeholder'] || node().label" />`,
  styles: [`.pv-input { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:.45rem .7rem; color:var(--fg); font-size:.85rem; min-width:12rem; }`],
})
export class PreviewInput {
  readonly node = input.required<ComponentNode>();
}

@Component({
  selector: 'app-preview-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="pv-link" [href]="href()" target="_blank" rel="noopener">{{ text() }}</a>`,
  styles: [`.pv-link { color:var(--accent); font-size:.85rem; text-decoration:none; } .pv-link:hover { text-decoration:underline; }`],
})
export class PreviewLink {
  readonly node = input.required<ComponentNode>();
  protected href(): string {
    return this.node().props['href'] || '#';
  }
  protected text(): string {
    return this.node().props['text'] || this.node().label;
  }
}

@Component({
  selector: 'app-preview-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hr class="pv-divider" [attr.aria-label]="node().label" />`,
  styles: [`.pv-divider { border:0; border-top:1px solid var(--border); margin:.5rem 0; width:100%; }`],
})
export class PreviewDivider {
  readonly node = input.required<ComponentNode>();
}

@Component({
  selector: 'app-preview-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src()) {
      <img class="pv-img" [src]="src()" [alt]="alt()" />
    } @else {
      <span class="pv-img-ph">🖼 sin src</span>
    }
  `,
  styles: [
    `.pv-img { max-width:100%; border-radius:8px; border:1px solid var(--border); }`,
    `.pv-img-ph { font-size:.75rem; color:var(--muted); padding:.5rem; border:1px dashed var(--border); border-radius:8px; }`,
  ],
})
export class PreviewImage {
  readonly node = input.required<ComponentNode>();
  protected src(): string {
    return this.node().props['src'] ?? '';
  }
  protected alt(): string {
    return this.node().props['alt'] || this.node().label;
  }
}
