import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ComponentTreeStore } from '../../../core/state/component-tree.store';
import { ComponentKind } from '../../../core/state/component-tree.types';
import { isContainerKind, leafComponent } from './preview-registry';
import { layoutClass } from './preview-layout';

/**
 * Render dinámico en vivo del árbol.
 * - Contenedores (container/card): frame recursivo que renderiza sus hijos.
 * - Hojas (button/text/input): se instancian con NgComponentOutlet desde el registro.
 * Click selecciona el nodo (sincroniza con árbol y canvas).
 */
@Component({
  selector: 'app-node-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgTemplateOutlet],
  template: `
    <ng-template #node let-id>
      @if (tree.node(id); as n) {
        @if (isContainer(n.kind)) {
          <div
            class="frame"
            [class]="layout(n.props)"
            [attr.data-kind]="n.kind"
            [class.sel]="tree.selectedId() === id"
            [class.hl]="tree.isHighlighted(id)"
            (click)="pick($event, id)"
          >
            <span class="frame-tag">{{ n.label }}</span>
            @for (c of tree.childrenOf(id); track c.id) {
              <ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{ $implicit: c.id }" />
            }
            @if (!tree.childrenOf(id).length) { <span class="empty">contenedor vacío</span> }
          </div>
        } @else {
          <div class="leaf" [class.sel]="tree.selectedId() === id" [class.hl]="tree.isHighlighted(id)" (click)="pick($event, id)">
            <ng-container *ngComponentOutlet="leaf(n.kind); inputs: { node: n }" />
          </div>
        }
      }
    </ng-template>
    <ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{ $implicit: tree.rootId() }" />
  `,
  styles: [`
    :host { display:block; }
    .frame { border:1px dashed var(--border); border-radius:10px; padding:1.4rem .7rem .7rem; margin:.4rem 0; position:relative; }
    .pv-layout { display:flex; flex-direction:column; gap:.75rem; }
    .pv-row { flex-direction:row; flex-wrap:wrap; }
    .pv-col { flex-direction:column; }
    .pv-gap-sm { gap:.35rem; }
    .pv-gap-lg { gap:1.25rem; }
    .pv-align-center { align-items:center; }
    .pv-align-start { align-items:flex-start; }
    .frame[data-kind="card"] { background:var(--surface-1); border-style:solid; box-shadow:0 1px 0 rgba(0,0,0,.2); }
    .frame.sel, .leaf.sel { outline:2px solid var(--accent); outline-offset:2px; border-radius:10px; }
    .frame.hl, .leaf.hl { box-shadow:0 0 0 2px #f0c040; }
    .frame-tag { position:absolute; top:.25rem; left:.5rem; font-size:.62rem; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
    .empty { font-size:.7rem; color:var(--muted); }
    .leaf { display:inline-block; margin:.3rem; cursor:pointer; }
    .frame { cursor:pointer; }
  `],
})
export class NodeRenderer {
  protected readonly tree = inject(ComponentTreeStore);

  protected isContainer(k: ComponentKind): boolean {
    return isContainerKind(k);
  }
  protected leaf(k: ComponentKind) {
    return leafComponent(k);
  }
  protected layout(props: Record<string, string>): string {
    return layoutClass(props);
  }
  protected pick(event: Event, id: string): void {
    event.stopPropagation();
    this.tree.select(id);
  }
}
