import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import { ComponentTreeStore } from '../../core/state/component-tree.store';
import { ComponentKind, COMPONENT_KINDS } from '../../core/state/component-tree.types';
import { CommandBus } from '../../core/commands/command-bus';
import { createComponent, updateNode } from '../../core/commands/tree-commands';
import { ToolRegistryStore } from '../../core/state/tool-registry.store';
import { AgentLogStore } from '../../core/state/agent-log.store';
import { ObserverStore } from '../../core/state/observer.store';
import { ToolOrigin } from '../../core/webmcp/webmcp.types';

interface NewComponentModel {
  kind: string;
  label: string;
  parentId: string;
}

const TOOL_NAME = 'new_component_via_form';

/**
 * Signal Form convertido en tool WebMCP con `experimentalWebMcpTool`.
 * Angular infiere el JSON schema desde el modelo y conecta validadores + submission.
 * El agente puede invocar `new_component_via_form`; un humano puede usar el mismo form.
 */
@Component({
  selector: 'app-new-component-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  template: `
    <div class="ncf">
      <span class="title">Signal Form → tool <code>{{ toolName }}</code></span>
      <div class="row">
        <select [formField]="ncForm.kind">
          @for (k of kinds; track k) {
            <option [value]="k">{{ k }}</option>
          }
        </select>
        <input [formField]="ncForm.label" placeholder="label" />
        <input [formField]="ncForm.parentId" placeholder="parentId" />
        <button type="button" (click)="submitAsUser()">Crear</button>
      </div>
      <span class="hint">El agente crea componentes invocando esta tool (mismo handler).</span>
    </div>
  `,
  styles: [`
    .ncf { display:flex; flex-direction:column; gap:.3rem; }
    .title { font-size:.72rem; color:var(--muted); }
    .title code { color:var(--accent); }
    .row { display:flex; gap:.4rem; flex-wrap:wrap; align-items:center; }
    select, input { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:.25rem .45rem; color:var(--fg); font-size:.8rem; }
    input { width:8rem; }
    button { background:var(--accent); color:#fff; border:0; border-radius:6px; padding:.3rem .8rem; font-size:.78rem; cursor:pointer; }
    .hint { font-size:.68rem; color:var(--muted); }
  `],
})
export class NewComponentForm {
  private readonly tree = inject(ComponentTreeStore);
  private readonly bus = inject(CommandBus);
  private readonly log = inject(AgentLogStore);
  private readonly observer = inject(ObserverStore);
  protected readonly toolName = TOOL_NAME;
  protected readonly kinds = COMPONENT_KINDS;

  protected readonly ncModel = signal<NewComponentModel>({
    kind: 'button',
    label: 'Nuevo botón',
    parentId: 'root',
  });

  protected readonly ncForm = form(
    this.ncModel,
    (f) => {
      required(f.kind);
      required(f.label);
      required(f.parentId);
    },
    {
      experimentalWebMcpTool: {
        name: TOOL_NAME,
        description: 'Crea un componente usando el formulario (kind, label, parentId).',
      },
      submission: {
        action: async () => {
          // El submission recibe el FieldTree; el valor actual está en el modelo.
          this.create(this.ncModel(), 'agent');
        },
      },
    },
  );

  constructor() {
    const registry = inject(ToolRegistryStore);
    const destroyRef = inject(DestroyRef);
    registry.add({
      name: TOOL_NAME,
      source: 'service',
      description: 'Signal Form: crea un componente (kind, label, parentId).',
      inputSchema: { type: 'object', properties: { kind: { type: 'string' }, label: { type: 'string' }, parentId: { type: 'string' } } },
    });
    destroyRef.onDestroy(() => registry.remove(TOOL_NAME));
  }

  protected submitAsUser(): void {
    this.create(this.ncModel(), 'user');
  }

  private create(value: NewComponentModel, origin: ToolOrigin): void {
    const allowed: ComponentKind[] = COMPONENT_KINDS;
    const kind: ComponentKind = (allowed as string[]).includes(value.kind) ? (value.kind as ComponentKind) : 'container';
    const parent = value.parentId && this.tree.node(value.parentId) ? value.parentId : this.tree.rootId();
    this.bus.dispatch(createComponent(parent, kind), origin, { skipObserver: true });
    const id = this.tree.selectedId();
    if (id && value.label) this.bus.dispatch(updateNode(id, value.label, {}), origin, { skipObserver: true });
    const at = Date.now();
    const what = `Creado ${kind} (${id})`;
    this.log.record({ toolName: TOOL_NAME, args: value, result: what, status: 'ok', origin, durationMs: 0, at });
    this.observer.narrate({
      action: TOOL_NAME,
      what,
      rationale: origin === 'agent' ? 'Creé el componente pedido usando el Signal Form expuesto como tool.' : 'Creación manual desde el formulario.',
      origin,
      affected: id ? [id] : [],
      status: 'ok',
      at,
    });
  }
}
