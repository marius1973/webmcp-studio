import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ComponentNode } from '../../../core/state/component-tree.types';
import { MockContext } from '../../../core/mock-data/mock-path';
import { MockDataEngine } from '../../../core/mock-data/mock-engine';
import { PreviewModeStore } from '../../../core/mock-data/preview-mode.store';
import { DirectEditDirective } from '../direct-edit/direct-edit.directive';
import { textSizeClass } from './preview-layout';

function mockCtx(node: ComponentNode, path: string, parentLabel?: string): MockContext {
  return {
    componentType: node.kind,
    label: node.label,
    parentLabel,
    path,
    nodeId: node.id,
    textSize: node.props['textSize'],
    variant: node.props['variant'],
  };
}

/** Componentes presentacionales que la IA "renderiza" vía NgComponentOutlet. */

@Component({
  selector: 'app-preview-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DirectEditDirective],
  template: `
    <button class="pv-btn" [attr.data-variant]="variant()" type="button">
      <span [appDirectEdit]="node().id" field="label">{{ label() }}</span>
    </button>
  `,
  styles: [`
    .pv-btn { border:0; border-radius:8px; padding:.45rem .9rem; font-size:.85rem; cursor:pointer; color:#fff; background:var(--accent); }
    .pv-btn[data-variant="ghost"] { background:transparent; border:1px solid var(--accent); color:var(--accent); }
    .pv-btn[data-variant="danger"] { background:#c0455f; }
    :host ::ng-deep .direct-editing { outline:2px solid var(--accent); border-radius:4px; padding:0 .15rem; }
  `],
})
export class PreviewButton {
  readonly node = input.required<ComponentNode>();
  readonly mockPath = input('');
  readonly parentLabel = input<string | undefined>(undefined);

  private readonly mock = inject(MockDataEngine);
  private readonly previewMode = inject(PreviewModeStore);

  protected variant(): string {
    return this.node().props['variant'] || 'primary';
  }

  protected label(): string {
    const n = this.node();
    if (!this.previewMode.isMock()) return n.label;
    return this.mock.resolve(mockCtx(n, this.mockPath(), this.parentLabel()));
  }
}

@Component({
  selector: 'app-preview-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DirectEditDirective],
  template: `
    <span [class]="sizeClass()" [appDirectEdit]="node().id" field="text">{{ content() }}</span>
  `,
  styles: [
    `
    .pv-text-body { font-size:.9rem; color:var(--fg); }
    .pv-text-hero { font-size:1.45rem; font-weight:600; color:var(--fg); line-height:1.2; }
    .pv-text-caption { font-size:.75rem; color:var(--muted); }
    :host ::ng-deep .direct-editing { outline:2px solid var(--accent); border-radius:4px; padding:0 .15rem; }
  `,
  ],
})
export class PreviewText {
  readonly node = input.required<ComponentNode>();
  readonly mockPath = input('');
  readonly parentLabel = input<string | undefined>(undefined);

  private readonly mock = inject(MockDataEngine);
  private readonly previewMode = inject(PreviewModeStore);

  protected sizeClass(): string {
    return textSizeClass(this.node().props);
  }

  protected content(): string {
    const n = this.node();
    if (!this.previewMode.isMock()) return n.props['text'] || n.label;
    return this.mock.resolve(mockCtx(n, this.mockPath(), this.parentLabel()));
  }
}

@Component({
  selector: 'app-preview-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DirectEditDirective],
  template: `
    <div class="pv-input-wrap" [attr.aria-label]="node().label">
      <span class="pv-input-ph" [appDirectEdit]="node().id" field="placeholder">{{ placeholder() }}</span>
    </div>
  `,
  styles: [`
    .pv-input-wrap { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:.45rem .7rem; min-width:12rem; }
    .pv-input-ph { color:var(--muted); font-size:.85rem; display:block; min-height:1.1rem; }
    :host ::ng-deep .direct-editing { color:var(--fg); outline:2px solid var(--accent); border-radius:4px; }
  `],
})
export class PreviewInput {
  readonly node = input.required<ComponentNode>();
  readonly mockPath = input('');
  readonly parentLabel = input<string | undefined>(undefined);

  private readonly mock = inject(MockDataEngine);
  private readonly previewMode = inject(PreviewModeStore);

  protected placeholder(): string {
    const n = this.node();
    if (!this.previewMode.isMock()) return n.props['placeholder'] || n.label;
    return this.mock.resolve(mockCtx(n, this.mockPath(), this.parentLabel()));
  }
}

@Component({
  selector: 'app-preview-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DirectEditDirective],
  template: `
    <a class="pv-link" [href]="href()" target="_blank" rel="noopener">
      <span [appDirectEdit]="node().id" field="linkText">{{ text() }}</span>
    </a>
  `,
  styles: [`
    .pv-link { color:var(--accent); font-size:.85rem; text-decoration:none; }
    .pv-link:hover { text-decoration:underline; }
    :host ::ng-deep .direct-editing { outline:2px solid var(--accent); border-radius:4px; }
  `],
})
export class PreviewLink {
  readonly node = input.required<ComponentNode>();
  readonly mockPath = input('');
  readonly parentLabel = input<string | undefined>(undefined);

  private readonly mock = inject(MockDataEngine);
  private readonly previewMode = inject(PreviewModeStore);

  protected href(): string {
    return this.node().props['href'] || '#';
  }

  protected text(): string {
    const n = this.node();
    if (!this.previewMode.isMock()) return n.props['text'] || n.label;
    return this.mock.resolve(mockCtx(n, this.mockPath(), this.parentLabel()));
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
    `.pv-img { max-width:100%; border-radius:8px; border:1px solid var(--border); display:block; }`,
    `.pv-img-ph { font-size:.75rem; color:var(--muted); padding:.5rem; border:1px dashed var(--border); border-radius:8px; display:block; }`,
  ],
})
export class PreviewImage {
  readonly node = input.required<ComponentNode>();
  readonly mockPath = input('');
  readonly parentLabel = input<string | undefined>(undefined);

  private readonly mock = inject(MockDataEngine);
  private readonly previewMode = inject(PreviewModeStore);

  protected src(): string {
    const n = this.node();
    const existing = n.props['src'] ?? '';
    if (!this.previewMode.isMock()) return existing;
    return this.mock.resolveImageSrc(mockCtx(n, this.mockPath(), this.parentLabel()), existing);
  }

  protected alt(): string {
    return this.node().props['alt'] || this.node().label;
  }
}
