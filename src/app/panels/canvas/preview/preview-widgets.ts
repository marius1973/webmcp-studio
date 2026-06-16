import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ComponentNode } from '../../../core/state/component-tree.types';

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
  template: `<span class="pv-text">{{ node().props['text'] || node().label }}</span>`,
  styles: [`.pv-text { font-size:.9rem; color:var(--fg); }`],
})
export class PreviewText {
  readonly node = input.required<ComponentNode>();
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
