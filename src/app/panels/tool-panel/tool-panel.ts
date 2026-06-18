import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ToolRegistryStore } from '../../core/state/tool-registry.store';
import { WebMcpCapability } from '../../core/webmcp/webmcp-capability';
import { groupToolsForPanel } from '../../core/webmcp/tool-panel-groups';

@Component({
  selector: 'app-tool-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-head">
      <h2>Herramientas <span class="count">{{ registry.count() }}</span></h2>
      <span class="badge" [class.ok]="cap.available">{{ cap.label }}</span>
    </div>

    @for (group of groups(); track group.id) {
      <section class="group" [class.pinned]="group.id === 'pinned'">
        <h3 class="group-title">{{ group.title }}</h3>
        <ul class="tool-list">
          @for (tool of group.tools; track tool.name) {
            <li class="tool" [class.pin]="group.id === 'pinned'">
              <div class="tool-name">{{ tool.name }} <em>{{ tool.source }}</em></div>
              <div class="tool-desc">{{ tool.description }}</div>
            </li>
          }
        </ul>
      </section>
    } @empty {
      <p class="muted">Sin tools registradas.</p>
    }
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; gap:.5rem; overflow:auto; }
    .panel-head h2 { margin:0; font-size:.85rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
    .count { background:var(--accent); color:#fff; border-radius:999px; padding:0 .4rem; font-size:.7rem; }
    .badge { display:inline-block; margin-top:.4rem; font-size:.7rem; padding:.15rem .45rem; border-radius:6px; background:var(--warn-bg); color:var(--warn-fg); }
    .badge.ok { background:var(--ok-bg); color:var(--ok-fg); }
    .group-title { margin:.4rem 0 .25rem; font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
    .group.pinned .group-title { color:var(--accent); }
    .tool-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.35rem; }
    .tool { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:.45rem .55rem; }
    .tool.pin { border-color:var(--accent); box-shadow:0 0 0 1px rgba(110,86,207,.25); }
    .tool-name { font-weight:600; font-size:.82rem; font-family:ui-monospace,monospace; }
    .tool-name em { font-style:normal; font-size:.65rem; color:var(--muted); border:1px solid var(--border); border-radius:4px; padding:0 .3rem; margin-left:.3rem; font-family:system-ui,sans-serif; }
    .tool-desc { font-size:.72rem; color:var(--muted); margin-top:.15rem; }
    .muted { color:var(--muted); font-size:.8rem; }
  `],
})
export class ToolPanel {
  protected readonly registry = inject(ToolRegistryStore);
  protected readonly cap = inject(WebMcpCapability);
  protected readonly groups = computed(() => groupToolsForPanel(this.registry.tools()));
}
