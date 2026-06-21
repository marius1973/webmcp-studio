import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgComponentOutlet, NgStyle, NgTemplateOutlet } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentTreeStore } from '../../../core/state/component-tree.store';
import { ComponentKind, ComponentNode } from '../../../core/state/component-tree.types';
import { CommandBus } from '../../../core/commands/command-bus';
import { moveComponent, updateNode } from '../../../core/commands/tree-commands';
import { MockDataEngine } from '../../../core/mock-data/mock-engine';
import { joinPath, pathSegment } from '../../../core/mock-data/mock-path';
import { PreviewModeStore } from '../../../core/mock-data/preview-mode.store';
import { CanvasContextMenuComponent } from '../direct-edit/canvas-context-menu';
import { CanvasContextMenuService } from '../direct-edit/canvas-context-menu.service';
import { CanvasEditStore } from '../direct-edit/canvas-edit.store';
import { formatSizePx, sizeStyle } from '../direct-edit/canvas-resize';
import { isContainerKind, leafComponent } from './preview-registry';
import { layoutClass } from './preview-layout';

/**
 * Render dinámico en vivo del árbol con edición directa en canvas:
 * doble clic (texto), drag, resize y menú contextual.
 */
@Component({
  selector: 'app-node-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgStyle, NgTemplateOutlet, DragDropModule, CanvasContextMenuComponent],
  template: `
    <ng-template #node let-id let-path="path" let-parentLabel="parentLabel">
      @if (tree.node(id); as n) {
        @if (isContainer(n.kind)) {
          <div
            class="frame canvas-node"
            [class]="layout(n.props)"
            [class.mock]="previewMode.isMock()"
            [class.sel]="tree.selectedId() === id"
            [class.hl]="tree.isHighlighted(id)"
            [attr.data-kind]="n.kind"
            [attr.data-node-id]="id"
            [ngStyle]="sizeStyle(n.props)"
            (click)="pick($event, id)"
            (contextmenu)="openMenu($event, id)"
            cdkDropList
            [id]="dropId(id)"
            [cdkDropListData]="id"
            [cdkDropListConnectedTo]="dropTargets()"
            (cdkDropListDropped)="onDrop($event)"
          >
            @if (tree.selectedId() === id && isResizable(n.kind)) {
              <button type="button" class="resize-handle se" aria-label="Redimensionar" (mousedown)="startResize($event, id)"></button>
            }
            @if (previewMode.isMock()) {
              @if (frameTitle(n, path, parentLabel); as title) {
                @if (title) { <span class="frame-title">{{ title }}</span> }
              }
            } @else {
              <span class="frame-tag">{{ n.label }}</span>
            }
            <span class="drag-handle" cdkDragHandle title="Arrastrar en canvas">⠿</span>
            <div class="frame-body" cdkDrag [cdkDragData]="id" [cdkDragDisabled]="dragDisabled(id)">
              @for (c of tree.childrenOf(id); track c.id; let i = $index) {
                <ng-container
                  [ngTemplateOutlet]="node"
                  [ngTemplateOutletContext]="{
                    $implicit: c.id,
                    path: childPath(path, n, c, i),
                    parentLabel: n.label
                  }"
                />
              }
              @if (!tree.childrenOf(id).length) {
                <span class="empty">{{ previewMode.isMock() ? '' : 'contenedor vacío' }}</span>
              }
            </div>
          </div>
        } @else {
          <div
            class="leaf-wrap canvas-node"
            cdkDrag
            [cdkDragData]="id"
            [cdkDragDisabled]="dragDisabled(id)"
            (click)="pick($event, id)"
            (contextmenu)="openMenu($event, n.parentId ?? tree.rootId())"
          >
            <span class="drag-handle leaf-handle" cdkDragHandle title="Arrastrar en canvas">⠿</span>
            <div
              class="leaf"
              [class.sel]="tree.selectedId() === id"
              [class.hl]="tree.isHighlighted(id)"
              [attr.data-node-id]="id"
              [ngStyle]="sizeStyle(n.props)"
            >
              @if (tree.selectedId() === id && isResizable(n.kind)) {
                <button type="button" class="resize-handle se" aria-label="Redimensionar" (mousedown)="startResize($event, id)"></button>
              }
              <ng-container *ngComponentOutlet="leaf(n.kind); inputs: leafInputs(n, path, parentLabel)" />
            </div>
          </div>
        }
      }
    </ng-template>

    <div class="root" [class.mock]="previewMode.isMock()">
      <ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{ $implicit: tree.rootId(), path: '', parentLabel: undefined }" />
    </div>
    <app-canvas-context-menu />
    <p class="canvas-hint">Doble clic en texto · Arrastra ⠿ · Clic derecho para agregar · Esquina para tamaño</p>
  `,
  styles: [`
    :host { display:block; }
    .root.mock { padding:.25rem 0; }
    .canvas-hint { margin:.5rem 0 0; font-size:.68rem; color:var(--muted); text-align:center; }
    .frame { border:1px dashed var(--border); border-radius:10px; padding:1.4rem .7rem .7rem; margin:.4rem 0; position:relative; }
    .frame.mock { border-style:solid; border-color:var(--border); background:var(--surface-1); padding:1rem .85rem .85rem; }
    .frame.mock[data-kind="card"] { background:var(--surface-2); box-shadow:0 2px 8px rgba(0,0,0,.15); }
    .frame-body { min-height:1.5rem; }
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
    .frame-title { display:block; font-size:.72rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; margin-bottom:.35rem; }
    .frame.mock .frame-title { font-size:.8rem; color:var(--fg); text-transform:none; letter-spacing:0; }
    .empty { font-size:.7rem; color:var(--muted); }
    .leaf-wrap { position:relative; display:inline-block; margin:.3rem; }
    .leaf { display:inline-block; cursor:pointer; position:relative; min-width:2rem; min-height:1.5rem; }
    .frame { cursor:pointer; }
    .drag-handle { position:absolute; top:.2rem; right:.35rem; font-size:.75rem; color:var(--muted); cursor:grab; z-index:2; padding:.1rem .2rem; border-radius:4px; background:rgba(0,0,0,.15); }
    .leaf-handle { top:-.35rem; right:-.15rem; }
    .resize-handle {
      position:absolute; right:.15rem; bottom:.15rem; width:.65rem; height:.65rem;
      border:0; padding:0; cursor:nwse-resize; z-index:3;
      background:linear-gradient(135deg, transparent 50%, var(--accent) 50%);
      border-radius:0 0 4px 0;
    }
    .cdk-drag-preview { opacity:.85; box-shadow:0 4px 16px rgba(0,0,0,.35); }
    .cdk-drop-list-dragging .canvas-node { transition: transform .15s ease; }
  `],
})
export class NodeRenderer {
  protected readonly tree = inject(ComponentTreeStore);
  protected readonly previewMode = inject(PreviewModeStore);
  protected readonly sizeStyle = sizeStyle;
  private readonly mock = inject(MockDataEngine);
  private readonly bus = inject(CommandBus);
  private readonly contextMenu = inject(CanvasContextMenuService);
  private readonly editStore = inject(CanvasEditStore);

  private resizing: { id: string; startX: number; startY: number; startW: number; startH: number } | null = null;

  protected isContainer(k: ComponentKind): boolean {
    return isContainerKind(k);
  }

  protected leaf(k: ComponentKind) {
    return leafComponent(k);
  }

  protected layout(props: Record<string, string>): string {
    return layoutClass(props);
  }

  protected dropId(id: string): string {
    return `canvas-drop-${id}`;
  }

  protected dropTargets(): string[] {
    return this.tree.allNodeIds().map((id) => this.dropId(id));
  }

  protected isResizable(kind: ComponentKind): boolean {
    return kind === 'container' || kind === 'card' || kind === 'image';
  }

  protected childPath(parentPath: string, parent: ComponentNode, child: ComponentNode, index: number): string {
    return joinPath(parentPath || undefined, pathSegment(child, index, parent));
  }

  protected frameTitle(node: ComponentNode, path: string, parentLabel?: string): string {
    if (node.kind === 'card') {
      return this.mock.resolve({
        componentType: node.kind,
        label: node.label,
        parentLabel,
        path,
        nodeId: node.id,
      });
    }
    if (node.label.toLowerCase().includes('hero') || path.includes('hero')) return '';
    return node.label;
  }

  protected leafInputs(node: ComponentNode, path: string, parentLabel?: string): Record<string, unknown> {
    return { node, mockPath: path, parentLabel };
  }

  protected pick(event: Event, id: string): void {
    event.stopPropagation();
    this.tree.select(id);
  }

  protected dragDisabled(id: string): boolean {
    return id === this.tree.rootId() || this.editStore.editingNodeId() !== null;
  }

  protected openMenu(event: MouseEvent, parentId: string): void {
    const parent = this.tree.node(parentId);
    if (!parent || !isContainerKind(parent.kind)) return;
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.open(event.clientX, event.clientY, parent.id);
  }

  protected onDrop(event: CdkDragDrop<string>): void {
    const movedId = event.item.data as string;
    const targetParentId = event.container.data as string;
    if (movedId === targetParentId || this.tree.isAncestor(movedId, targetParentId)) return;
    this.bus.dispatch(moveComponent(movedId, targetParentId, event.currentIndex), 'user', {
      rationale: 'Reordené o reparenté desde el canvas.',
    });
  }

  protected startResize(event: MouseEvent, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    const node = this.tree.node(id);
    if (!node) return;
    const el = (event.target as HTMLElement).closest('.canvas-node') as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    const startW = rect?.width ?? 200;
    const startH = rect?.height ?? 120;
    this.resizing = { id, startX: event.clientX, startY: event.clientY, startW, startH };

    const onMove = (e: MouseEvent) => this.onResizeMove(e);
    const onUp = (e: MouseEvent) => {
      this.onResizeEnd(e);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizing) return;
    const dx = event.clientX - this.resizing.startX;
    const dy = event.clientY - this.resizing.startY;
    const node = this.tree.node(this.resizing.id);
    if (!node) return;
    const width = formatSizePx(this.resizing.startW + dx);
    const height = formatSizePx(this.resizing.startH + dy);
    this.tree.patch(this.resizing.id, { props: { ...node.props, width, height } });
  }

  private onResizeEnd(event: MouseEvent): void {
    if (!this.resizing) return;
    const { id, startX, startY, startW, startH } = this.resizing;
    this.resizing = null;
    const node = this.tree.node(id);
    if (!node) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const width = formatSizePx(startW + dx);
    const height = formatSizePx(startH + dy);
    this.bus.dispatch(
      updateNode(id, node.label, { ...node.props, width, height }),
      'user',
      { rationale: 'Redimensioné el nodo desde el canvas.' },
    );
  }
}
