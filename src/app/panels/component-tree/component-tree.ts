import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentTreeStore } from '../../core/state/component-tree.store';
import {
  ComponentKind,
  KIND_ICON,
  KIND_LABEL,
} from '../../core/state/component-tree.types';
import { CommandBus } from '../../core/commands/command-bus';
import {
  createComponent,
  deleteComponent,
  moveComponent,
} from '../../core/commands/tree-commands';

@Component({
  selector: 'app-component-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DragDropModule],
  template: `
    <div class="panel-head"><h2 id="tree-heading">Árbol de componentes <span class="count">{{ tree.nodeCount() }}</span></h2></div>

    <div class="palette" role="toolbar" aria-label="Paleta de componentes">
      @for (k of kinds; track k) {
        <button
          type="button"
          class="chip"
          (click)="add(k)"
          [attr.aria-label]="'Añadir ' + label(k) + ' al nodo seleccionado'"
        >
          {{ icon(k) }} {{ label(k) }}
        </button>
      }
    </div>

    <div
      class="tree"
      role="tree"
      aria-labelledby="tree-heading"
      tabindex="0"
      (keydown)="onTreeKeydown($event)"
    >
      <div
        class="row root"
        role="treeitem"
        [attr.aria-selected]="tree.selectedId() === tree.rootId()"
        [attr.aria-level]="1"
        [attr.aria-setsize]="1"
        [attr.aria-posinset]="1"
        (click)="tree.select(tree.rootId())"
      >
        <span class="icon" aria-hidden="true">▢</span><span class="lbl">{{ rootLabel() }}</span>
      </div>
      <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: tree.rootId(), level: 1 }" />
    </div>

    <ng-template #branch let-id let-level="level">
      <div
        class="children"
        role="group"
        cdkDropList
        [id]="id"
        [cdkDropListData]="id"
        [cdkDropListConnectedTo]="tree.allNodeIds()"
        (cdkDropListDropped)="onDrop($event)"
      >
        @for (child of tree.childrenOf(id); track child.id; let i = $index) {
          <div class="node-wrap" cdkDrag [cdkDragData]="child.id">
            <div
              class="row"
              role="treeitem"
              [attr.aria-selected]="tree.selectedId() === child.id"
              [attr.aria-level]="level + 1"
              [attr.aria-setsize]="tree.childrenOf(id).length"
              [attr.aria-posinset]="i + 1"
              (click)="tree.select(child.id)"
            >
              <span class="handle" cdkDragHandle aria-hidden="true" title="Arrastrar">⠿</span>
              <span class="icon" aria-hidden="true">{{ icon(child.kind) }}</span>
              <span class="lbl">{{ child.label }}</span>
              <button
                type="button"
                class="mini"
                (click)="del($event, child.id)"
                [attr.aria-label]="'Borrar ' + child.label"
              >✕</button>
            </div>
            <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: child.id, level: level + 1 }" />
          </div>
        }
      </div>
    </ng-template>

    <p class="hint">Arrastrá por ⠿ para reordenar o reparentar. Flechas ↑↓ para navegar, Supr para borrar.</p>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; }
    .panel-head h2 { margin:0; font-size:.85rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
    .count { background:var(--accent); color:#fff; border-radius:999px; padding:0 .4rem; font-size:.7rem; }
    .palette { display:flex; flex-wrap:wrap; gap:.3rem; margin:.6rem 0; }
    .chip { background:var(--surface-2); border:1px solid var(--border); color:var(--fg); border-radius:6px; padding:.2rem .45rem; font-size:.72rem; cursor:pointer; }
    .chip:hover { border-color:var(--accent); }
    .tree { overflow:auto; flex:1; min-height:0; outline:none; }
    .tree:focus-visible { box-shadow: inset 0 0 0 2px var(--accent); border-radius:6px; }
    .children { margin-left:.9rem; border-left:1px dashed var(--border); padding-left:.3rem; min-height:6px; }
    .row { display:flex; align-items:center; gap:.35rem; padding:.2rem .3rem; border-radius:6px; cursor:pointer; font-size:.82rem; }
    .row:hover { background:var(--surface-2); }
    .row[aria-selected="true"] { background:var(--accent); color:#fff; }
    .row.root { font-weight:600; }
    .handle { cursor:grab; color:var(--muted); font-size:.8rem; }
    .row[aria-selected="true"] .handle { color:#fff; }
    .lbl { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mini { background:transparent; border:0; color:inherit; opacity:.5; cursor:pointer; font-size:.75rem; }
    .mini:hover { opacity:1; }
    .hint { font-size:.7rem; color:var(--muted); margin:.5rem 0 0; }
    .cdk-drag-preview { background:var(--surface-2); border:1px solid var(--accent); border-radius:6px; padding:.2rem .4rem; font-size:.82rem; }
    .cdk-drop-list-dragging .cdk-drag { transition: transform .15s ease; }
  `],
})
export class ComponentTree {
  protected readonly tree = inject(ComponentTreeStore);
  private readonly bus = inject(CommandBus);
  protected readonly kinds: ComponentKind[] = ['container', 'card', 'button', 'text', 'input'];

  protected icon(k: ComponentKind): string {
    return KIND_ICON[k];
  }
  protected label(k: ComponentKind): string {
    return KIND_LABEL[k];
  }
  protected rootLabel(): string {
    return this.tree.node(this.tree.rootId())?.label ?? 'AppRoot';
  }

  protected add(kind: ComponentKind): void {
    const parent = this.tree.selectedId() ?? this.tree.rootId();
    this.bus.dispatch(createComponent(parent, kind));
  }

  protected del(event: Event, id: string): void {
    event.stopPropagation();
    this.bus.dispatch(deleteComponent(id));
  }

  protected onDrop(event: CdkDragDrop<string>): void {
    const movedId = event.item.data as string;
    const targetParentId = event.container.id;
    if (movedId === targetParentId || this.tree.isAncestor(movedId, targetParentId)) return;
    this.bus.dispatch(moveComponent(movedId, targetParentId, event.currentIndex));
  }

  protected onTreeKeydown(event: KeyboardEvent): void {
    const order = this.tree.preorderIds();
    const current = this.tree.selectedId() ?? this.tree.rootId();
    const idx = order.indexOf(current);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (idx < order.length - 1) this.tree.select(order[idx + 1]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (idx > 0) this.tree.select(order[idx - 1]);
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const children = this.tree.childrenOf(current);
        if (children.length) this.tree.select(children[0].id);
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const parent = this.tree.parentOf(current);
        if (parent) this.tree.select(parent);
        break;
      }
      case 'Home':
        event.preventDefault();
        this.tree.select(this.tree.rootId());
        break;
      case 'End':
        event.preventDefault();
        this.tree.select(order.at(-1) ?? this.tree.rootId());
        break;
      case 'Delete':
      case 'Backspace':
        if (current !== this.tree.rootId()) {
          event.preventDefault();
          this.bus.dispatch(deleteComponent(current));
        }
        break;
    }
  }
}
