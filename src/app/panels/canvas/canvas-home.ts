import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ComponentTreeStore } from '../../core/state/component-tree.store';
import { ComponentKind, KIND_ICON } from '../../core/state/component-tree.types';
import { CommandBus } from '../../core/commands/command-bus';
import { WebMcpCapability } from '../../core/webmcp/webmcp-capability';
import { NodeRenderer } from './preview/node-renderer';
import { PropertiesForm } from './properties-form';
import { NewComponentForm } from './new-component-form';
import { EditingToolsService } from '../../core/webmcp/editing-tools.service';
import { ProjectStore } from '../../core/state/project.store';

type CanvasMode = 'structure' | 'preview';

@Component({
  selector: 'app-canvas-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NodeRenderer, PropertiesForm, NewComponentForm],
  template: `
    <div class="toolbar">
      <div class="group">
        <button (click)="bus.undo()" [disabled]="!bus.canUndo()" title="Deshacer">↶ Undo</button>
        <button (click)="bus.redo()" [disabled]="!bus.canRedo()" title="Rehacer">↷ Redo</button>
        <span class="count">{{ bus.count() }} acciones</span>
      </div>
      <div class="group modes">
        <button [class.active]="mode() === 'preview'" (click)="mode.set('preview')">Preview</button>
        <button [class.active]="mode() === 'structure'" (click)="mode.set('structure')">Estructura</button>
      </div>
      <span class="badge" [class.ok]="cap.available">{{ cap.label }}</span>
    </div>

    <div class="inspector">
      <app-properties-form />
    </div>

    <div class="agent-strip">
      <div class="sim">
        <span class="sim-label">Simular agente:</span>
        <button (click)="edit.createComponent('button', sel(), 'Agrego un botón de acción a la UI.')">create_component(button)</button>
        <button (click)="edit.createComponent('card', sel(), 'Agrupo contenido en una card.')">create_component(card)</button>
        <button (click)="edit.deleteComponent(sel(), 'Quito el nodo seleccionado por redundante.')" [disabled]="sel() === tree.rootId()">delete_component</button>
        <button (click)="edit.readTree('Inspecciono la estructura antes de editar.')">read_tree</button>
        <button (click)="edit.undo('Revierto el último cambio.')">undo</button>
      </div>
      <app-new-component-form />
    </div>

    <div class="stage">
      @if (mode() === 'preview') {
        <app-node-renderer />
      } @else {
        <ng-container [ngTemplateOutlet]="box" [ngTemplateOutletContext]="{ $implicit: tree.rootId() }" />
      }
    </div>

    <div class="history">
      <h3>Historial</h3>
      @for (e of reversedPast(); track e.at) {
        <div class="h-row"><span>{{ e.origin === 'agent' ? '🤖' : '🙂' }}</span> <span class="h-type">{{ e.type }}</span> {{ e.label }}</div>
      } @empty {
        <div class="muted">Sin acciones todavía. Creá componentes desde el árbol.</div>
      }
    </div>

    <ng-template #box let-id>
      @if (tree.node(id); as n) {
        <div class="cbox" [class.sel]="tree.selectedId() === id" [attr.data-kind]="n.kind" (click)="select($event, id)">
          <div class="cbox-head"><span>{{ icon(n.kind) }}</span> {{ n.label }} <em>{{ n.kind }}</em></div>
          @if (tree.childrenOf(id).length) {
            <div class="cbox-children">
              @for (c of tree.childrenOf(id); track c.id) {
                <ng-container [ngTemplateOutlet]="box" [ngTemplateOutletContext]="{ $implicit: c.id }" />
              }
            </div>
          }
        </div>
      }
    </ng-template>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; gap:.7rem; }
    .toolbar { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
    .group { display:flex; align-items:center; gap:.4rem; }
    button { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.25rem .6rem; font-size:.78rem; cursor:pointer; }
    button:disabled { opacity:.4; cursor:not-allowed; }
    .modes button.active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .count { font-size:.72rem; color:var(--muted); }
    .badge { margin-left:auto; font-size:.7rem; padding:.15rem .45rem; border-radius:6px; background:var(--warn-bg); color:var(--warn-fg); }
    .badge.ok { background:var(--ok-bg); color:var(--ok-fg); }
    .inspector { background:var(--surface-1); border:1px solid var(--border); border-radius:8px; padding:.5rem .6rem; }
    .agent-strip { background:var(--surface-1); border:1px solid var(--border); border-radius:8px; padding:.5rem .6rem; display:flex; flex-direction:column; gap:.5rem; }
    .sim { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
    .sim-label { font-size:.7rem; color:var(--muted); }
    .sim button { background:var(--surface-2); border:1px solid var(--border); color:var(--accent); border-radius:6px; padding:.2rem .5rem; font-size:.72rem; font-family:ui-monospace,monospace; cursor:pointer; }
    .sim button:disabled { opacity:.4; cursor:not-allowed; }
    .stage { flex:1; min-height:0; overflow:auto; border:1px solid var(--border); border-radius:10px; padding:1rem; background:var(--surface-0); }
    .cbox { border:1px solid var(--border); border-radius:8px; padding:.5rem; margin:.35rem 0; background:var(--surface-1); cursor:pointer; }
    .cbox.sel { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
    .cbox-head { font-size:.8rem; display:flex; align-items:center; gap:.35rem; }
    .cbox-head em { font-style:normal; color:var(--muted); font-size:.65rem; border:1px solid var(--border); border-radius:4px; padding:0 .3rem; }
    .cbox-children { margin-left:.6rem; }
    .cbox[data-kind="button"] { background:#221c33; }
    .cbox[data-kind="card"] { background:#172230; }
    .history { max-height:110px; overflow:auto; border-top:1px solid var(--border); padding-top:.4rem; }
    .history h3 { margin:0 0 .3rem; font-size:.75rem; text-transform:uppercase; color:var(--muted); letter-spacing:.05em; }
    .h-row { font-size:.74rem; padding:.1rem 0; }
    .h-type { color:var(--accent); font-family:ui-monospace,monospace; }
    .muted { color:var(--muted); font-size:.78rem; }
  `],
})
export class CanvasHome {
  protected readonly tree = inject(ComponentTreeStore);
  protected readonly bus = inject(CommandBus);
  protected readonly cap = inject(WebMcpCapability);
  protected readonly edit = inject(EditingToolsService);
  private readonly projects = inject(ProjectStore);

  /** Param de ruta `:id` (vía withComponentInputBinding) = proyecto activo. */
  readonly id = input<string>();

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) void this.projects.activate(id);
    });
  }
  protected readonly mode = signal<CanvasMode>('preview');

  protected readonly reversedPast = computed(() => [...this.bus.past()].reverse());

  protected sel(): string {
    return this.tree.selectedId() ?? this.tree.rootId();
  }

  protected icon(k: ComponentKind): string {
    return KIND_ICON[k];
  }

  protected select(event: Event, id: string): void {
    event.stopPropagation();
    this.tree.select(id);
  }
}
