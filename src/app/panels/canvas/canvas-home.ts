import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ComponentTreeStore } from '../../core/state/component-tree.store';
import { ComponentKind, KIND_ICON } from '../../core/state/component-tree.types';
import { CommandBus } from '../../core/commands/command-bus';
import { WebMcpCapability } from '../../core/webmcp/webmcp-capability';
import { NodeRenderer } from './preview/node-renderer';
import { PropertiesForm } from './properties-form';
import { NewComponentForm } from './new-component-form';
import { EditingToolsService } from '../../core/webmcp/editing-tools.service';
import { ProjectStore } from '../../core/state/project.store';
import { decodeTreeShare } from '../../core/state/project-share';
import { PLAYBOOKS } from '../../core/playbooks/playbooks';
import { PreviewModeStore } from '../../core/mock-data/preview-mode.store';
import { HistorySlider } from '../../shell/history-slider/history-slider';

type CanvasMode = 'structure' | 'preview';

@Component({
  selector: 'app-canvas-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NodeRenderer, PropertiesForm, NewComponentForm, HistorySlider],
  template: `
    <div class="toolbar">
      <div class="group modes">
        <button [class.active]="mode() === 'preview'" (click)="mode.set('preview')">Preview</button>
        <button [class.active]="mode() === 'structure'" (click)="mode.set('structure')">Estructura</button>
      </div>
      @if (mode() === 'preview') {
        <div class="group preview-data" role="group" aria-label="Vista previa">
          <button
            type="button"
            [class.active]="!previewData.isMock()"
            (click)="previewData.setWireframe()"
          >Wireframe</button>
          <button
            type="button"
            [class.active]="previewData.isMock()"
            (click)="previewData.setMock()"
          >Con datos</button>
        </div>
      }
      <span class="badge" [class.ok]="cap.available">{{ cap.label }}</span>
    </div>

    <app-history-slider />

    <div class="stage">
      @if (mode() === 'preview') {
        <app-node-renderer />
      } @else {
        <ng-container [ngTemplateOutlet]="box" [ngTemplateOutletContext]="{ $implicit: tree.rootId() }" />
      }
    </div>

    @if (hasInspectableSelection()) {
      <details class="fold inspector-fold">
        <summary>Inspector de propiedades</summary>
        <div class="fold-body">
          <app-properties-form />
        </div>
      </details>
    }

    <details class="fold agent-fold">
      <summary>Simular agente y playbooks</summary>
      <div class="fold-body agent-strip">
        <div class="sim">
          <button (click)="edit.createComponent('button', sel(), 'Agrego un botón de acción a la UI.')">create_component(button)</button>
          <button (click)="edit.createComponent('card', sel(), 'Agrupo contenido en una card.')">create_component(card)</button>
          <button (click)="edit.deleteComponent(sel(), 'Quito el nodo seleccionado por redundante.')" [disabled]="sel() === tree.rootId()">delete_component</button>
          <button (click)="edit.readTree('Inspecciono la estructura antes de editar.')">read_tree</button>
          <button (click)="edit.suggestNext(undefined, 'Sugerencias para el árbol.')">suggest_next</button>
          <button (click)="edit.explainSelection(undefined, 'Explico la selección.')">explain_selection</button>
        </div>
        <div class="playbooks">
          <span class="sim-label">Playbooks:</span>
          @for (pb of playbooks; track pb.id) {
            <button (click)="edit.runPlaybook(pb.id, pb.rationale)">{{ pb.label }}</button>
          }
        </div>
        <app-new-component-form />
      </div>
    </details>

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
    :host { display:flex; flex-direction:column; height:100%; gap:.5rem; min-height:0; }
    .toolbar { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; flex-shrink:0; }
    .group { display:flex; align-items:center; gap:.4rem; }
    button { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.25rem .6rem; font-size:.78rem; cursor:pointer; }
    button:disabled { opacity:.4; cursor:not-allowed; }
    .modes button.active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .preview-data button.active { background:var(--ok-bg); color:var(--ok-fg); border-color:var(--ok-fg); }
    .count { font-size:.72rem; color:var(--muted); }
    .badge { margin-left:auto; font-size:.7rem; padding:.15rem .45rem; border-radius:6px; background:var(--warn-bg); color:var(--warn-fg); }
    .badge.ok { background:var(--ok-bg); color:var(--ok-fg); }
    .stage { flex:1; min-height:12rem; overflow:auto; border:1px solid var(--border); border-radius:10px; padding:1rem; background:var(--surface-0); }
    .fold { flex-shrink:0; border:1px solid var(--border); border-radius:8px; background:var(--surface-1); }
    .fold summary { cursor:pointer; font-size:.72rem; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); padding:.45rem .6rem; user-select:none; }
    .fold-body { padding:0 .6rem .6rem; }
    .agent-strip { display:flex; flex-direction:column; gap:.5rem; }
    .sim { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
    .sim-label { font-size:.7rem; color:var(--muted); }
    .sim button { background:var(--surface-2); border:1px solid var(--border); color:var(--accent); border-radius:6px; padding:.2rem .5rem; font-size:.72rem; font-family:ui-monospace,monospace; cursor:pointer; }
    .sim button:disabled { opacity:.4; cursor:not-allowed; }
    .playbooks { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
    .playbooks button { background:var(--surface-2); border:1px dashed var(--accent); color:var(--fg); border-radius:6px; padding:.2rem .5rem; font-size:.72rem; cursor:pointer; }
    .cbox { border:1px solid var(--border); border-radius:8px; padding:.5rem; margin:.35rem 0; background:var(--surface-1); cursor:pointer; }
    .cbox.sel { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
    .cbox-head { font-size:.8rem; display:flex; align-items:center; gap:.35rem; }
    .cbox-head em { font-style:normal; color:var(--muted); font-size:.65rem; border:1px solid var(--border); border-radius:4px; padding:0 .3rem; }
    .cbox-children { margin-left:.6rem; }
    .cbox[data-kind="button"] { background:var(--surface-2); }
    .cbox[data-kind="card"] { background:var(--surface-1); }
  `],
})
export class CanvasHome {
  protected readonly tree = inject(ComponentTreeStore);
  protected readonly bus = inject(CommandBus);
  protected readonly cap = inject(WebMcpCapability);
  protected readonly edit = inject(EditingToolsService);
  private readonly projects = inject(ProjectStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly playbooks = PLAYBOOKS;
  protected readonly previewData = inject(PreviewModeStore);

  readonly id = input<string>();

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      void this.projects.activate(id).then(() => this.applyShareFromUrl());
    });
  }

  private applyShareFromUrl(): void {
    const share = this.route.snapshot.queryParamMap.get('share');
    if (!share) return;
    const state = decodeTreeShare(share);
    if (!state) {
      this.projects.status.set('Enlace compartido inválido o corrupto');
      return;
    }
    this.tree.restore(state);
    this.bus.reset();
    this.tree.select(state.rootId);
    this.projects.status.set('Árbol cargado desde enlace compartido');
  }

  protected readonly mode = signal<CanvasMode>('preview');

  protected readonly hasInspectableSelection = computed(() => {
    const id = this.tree.selectedId();
    return !!id && id !== this.tree.rootId();
  });

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
