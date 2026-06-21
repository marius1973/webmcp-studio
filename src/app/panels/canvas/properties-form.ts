import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ComponentTreeStore } from '../../core/state/component-tree.store';
import { ComponentKind } from '../../core/state/component-tree.types';
import { CommandBus } from '../../core/commands/command-bus';
import { updateNode } from '../../core/commands/tree-commands';
import { ToolRegistryStore } from '../../core/state/tool-registry.store';
import { AgentLogStore } from '../../core/state/agent-log.store';
import { ObserverStore } from '../../core/state/observer.store';
import { ToolOrigin } from '../../core/webmcp/webmcp.types';

interface PropsModel {
  id: string;
  label: string;
  text: string;
  placeholder: string;
  variant: string;
  direction: string;
  gap: string;
  align: string;
  textSize: string;
  href: string;
  src: string;
  alt: string;
  width: string;
  height: string;
}

const TOOL_NAME = 'update_component_via_form';

/**
 * Inspector de propiedades con Signal Forms, expuesto también como tool WebMCP.
 * El modelo se sincroniza con el nodo seleccionado; "Aplicar" despacha un único
 * Command `updateNode` (una entrada de historial, undo/redo-able).
 */
@Component({
  selector: 'app-properties-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  template: `
    @if (selectedKind(); as kind) {
      <form class="props" (submit)="apply($event)">
        <span class="tool-hint">Signal Form → tool <code>{{ toolName }}</code></span>
        <div class="field">
          <label for="prop-label">label</label>
          <input id="prop-label" [formField]="pform.label" />
        </div>

        @if (kind === 'button') {
          <div class="field">
            <label for="prop-variant">variant</label>
            <select id="prop-variant" [formField]="pform.variant">
              <option value="primary">primary</option>
              <option value="ghost">ghost</option>
              <option value="danger">danger</option>
            </select>
          </div>
        }
        @if (kind === 'text') {
          <div class="field">
            <label for="prop-text">text</label>
            <input id="prop-text" [formField]="pform.text" />
          </div>
          <div class="field">
            <label for="prop-textSize">textSize</label>
            <select id="prop-textSize" [formField]="pform.textSize">
              <option value="body">body</option>
              <option value="hero">hero</option>
              <option value="caption">caption</option>
            </select>
          </div>
        }
        @if (kind === 'container' || kind === 'card') {
          <div class="field">
            <label for="prop-direction">direction</label>
            <select id="prop-direction" [formField]="pform.direction">
              <option value="column">column</option>
              <option value="row">row</option>
            </select>
          </div>
          <div class="field">
            <label for="prop-gap">gap</label>
            <select id="prop-gap" [formField]="pform.gap">
              <option value="sm">sm</option>
              <option value="md">md</option>
              <option value="lg">lg</option>
            </select>
          </div>
          <div class="field">
            <label for="prop-align">align</label>
            <select id="prop-align" [formField]="pform.align">
              <option value="start">start</option>
              <option value="center">center</option>
            </select>
          </div>
          <div class="field">
            <label for="prop-width">width (px)</label>
            <input id="prop-width" [formField]="pform.width" placeholder="auto" />
          </div>
          <div class="field">
            <label for="prop-height">height (px)</label>
            <input id="prop-height" [formField]="pform.height" placeholder="auto" />
          </div>
        }
        @if (kind === 'input') {
          <div class="field">
            <label for="prop-placeholder">placeholder</label>
            <input id="prop-placeholder" [formField]="pform.placeholder" />
          </div>
        }
        @if (kind === 'link') {
          <div class="field">
            <label for="prop-href">href</label>
            <input id="prop-href" [formField]="pform.href" />
          </div>
          <div class="field">
            <label for="prop-link-text">text</label>
            <input id="prop-link-text" [formField]="pform.text" />
          </div>
        }
        @if (kind === 'image') {
          <div class="field">
            <label for="prop-src">src</label>
            <input id="prop-src" [formField]="pform.src" />
          </div>
          <div class="field">
            <label for="prop-alt">alt</label>
            <input id="prop-alt" [formField]="pform.alt" />
          </div>
          <div class="field">
            <label for="prop-width">width (px)</label>
            <input id="prop-width" [formField]="pform.width" placeholder="auto" />
          </div>
          <div class="field">
            <label for="prop-height">height (px)</label>
            <input id="prop-height" [formField]="pform.height" placeholder="auto" />
          </div>
        }

        <button type="submit">Aplicar</button>
        <span class="live">↳ {{ pform.label().value() }}</span>
      </form>
    } @else {
      <p class="muted">Selecciona un nodo para editar sus propiedades.</p>
    }
  `,
  styles: [`
    :host { display:block; }
    .props { display:flex; align-items:flex-end; gap:.6rem; flex-wrap:wrap; }
    .tool-hint { width:100%; font-size:.68rem; color:var(--muted); margin-bottom:.1rem; }
    .tool-hint code { color:var(--accent); }
    .field { display:flex; flex-direction:column; gap:.15rem; }
    label { font-size:.65rem; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
    input, select { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:.25rem .45rem; color:var(--fg); font-size:.8rem; }
    button { background:var(--accent); color:#fff; border:0; border-radius:6px; padding:.3rem .8rem; font-size:.78rem; cursor:pointer; }
    .live { font-size:.72rem; color:var(--muted); font-family:ui-monospace,monospace; }
    .muted { color:var(--muted); font-size:.8rem; margin:0; }
  `],
})
export class PropertiesForm {
  private readonly tree = inject(ComponentTreeStore);
  private readonly bus = inject(CommandBus);
  private readonly log = inject(AgentLogStore);
  private readonly observer = inject(ObserverStore);
  protected readonly toolName = TOOL_NAME;

  protected readonly pmodel = signal<PropsModel>({
    id: '',
    label: '',
    text: '',
    placeholder: '',
    variant: 'primary',
    direction: 'column',
    gap: 'md',
    align: 'start',
    textSize: 'body',
    href: '',
    src: '',
    alt: '',
    width: '',
    height: '',
  });

  protected readonly pform = form(
    this.pmodel,
    (f) => {
      required(f.id);
      required(f.label);
    },
    {
      experimentalWebMcpTool: {
        name: TOOL_NAME,
        description: 'Actualiza label y props del nodo seleccionado vía Signal Form.',
      },
      submission: {
        action: async () => {
          this.applyModel(this.pmodel(), 'agent');
        },
      },
    },
  );

  protected readonly selectedKind = computed<ComponentKind | undefined>(() => {
    const id = this.tree.selectedId();
    return id ? this.tree.node(id)?.kind : undefined;
  });

  constructor() {
    const registry = inject(ToolRegistryStore);
    const destroyRef = inject(DestroyRef);
    registry.add({
      name: TOOL_NAME,
      source: 'service',
      description: 'Signal Form: actualiza label y props (id, label, text, placeholder, variant).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          text: { type: 'string' },
          placeholder: { type: 'string' },
          variant: { type: 'string' },
        },
        required: ['id', 'label'],
      },
    });
    destroyRef.onDestroy(() => registry.remove(TOOL_NAME));

    effect(() => {
      const id = this.tree.selectedId();
      const node = id ? this.tree.node(id) : undefined;
      untracked(() => {
        this.pmodel.set({
          id: id ?? '',
          label: node?.label ?? '',
          text: node?.props['text'] ?? '',
          placeholder: node?.props['placeholder'] ?? '',
          variant: node?.props['variant'] ?? 'primary',
          direction: node?.props['direction'] ?? 'column',
          gap: node?.props['gap'] ?? 'md',
          align: node?.props['align'] ?? 'start',
          textSize: node?.props['textSize'] ?? 'body',
          href: node?.props['href'] ?? '',
          src: node?.props['src'] ?? '',
          alt: node?.props['alt'] ?? '',
          width: node?.props['width'] ?? '',
          height: node?.props['height'] ?? '',
        });
      });
    });
  }

  protected apply(event: Event): void {
    event.preventDefault();
    this.applyModel(this.pmodel(), 'user');
  }

  private applyModel(m: PropsModel, origin: ToolOrigin): void {
    const id = m.id || this.tree.selectedId();
    if (!id || !this.tree.node(id)) return;
    const kind = this.tree.node(id)?.kind;
    const props: Record<string, string> = {};
    if (kind === 'button') props['variant'] = m.variant;
    if (kind === 'text') {
      props['text'] = m.text;
      props['textSize'] = m.textSize;
    }
    if (kind === 'input') props['placeholder'] = m.placeholder;
    if (kind === 'container' || kind === 'card') {
      props['direction'] = m.direction;
      props['gap'] = m.gap;
      props['align'] = m.align;
      if (m.width.trim()) props['width'] = m.width.trim();
      if (m.height.trim()) props['height'] = m.height.trim();
    }
    if (kind === 'link') {
      props['href'] = m.href;
      props['text'] = m.text;
    }
    if (kind === 'image') {
      props['src'] = m.src;
      props['alt'] = m.alt;
      if (m.width.trim()) props['width'] = m.width.trim();
      if (m.height.trim()) props['height'] = m.height.trim();
    }
    this.bus.dispatch(updateNode(id, m.label, props), origin, {
      skipObserver: origin === 'agent',
      action: TOOL_NAME,
      rationale:
        origin === 'agent'
          ? 'Actualicé las propiedades del nodo usando el Signal Form expuesto como tool.'
          : 'Edición manual desde el inspector de propiedades.',
    });
    if (origin === 'agent') {
      const at = Date.now();
      const what = `Actualizado ${id}`;
      this.log.record({ toolName: TOOL_NAME, args: m, result: what, status: 'ok', origin, durationMs: 0, at });
      this.observer.narrate({
        action: TOOL_NAME,
        what,
        rationale: 'Actualicé las propiedades del nodo usando el Signal Form expuesto como tool.',
        origin,
        affected: [id],
        status: 'ok',
        at,
      });
    }
  }
}
