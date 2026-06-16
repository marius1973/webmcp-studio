import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToolRegistryStore } from '../../core/state/tool-registry.store';
import { WebMcpCapability } from '../../core/webmcp/webmcp-capability';

@Component({
  selector: 'app-tool-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-head">
      <h2>Herramientas <span class="count">{{ registry.count() }}</span></h2>
      <span class="badge" [class.ok]="cap.available">{{ cap.label }}</span>
    </div>
    <ul class="tool-list">
      @for (tool of registry.tools(); track tool.name) {
        <li class="tool">
          <div class="tool-name">{{ tool.name }} <em>{{ tool.source }}</em></div>
          <div class="tool-desc">{{ tool.description }}</div>
        </li>
      } @empty {
        <li class="muted">Sin tools registradas.</li>
      }
    </ul>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; }
    .panel-head h2 { margin:0; font-size:.85rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
    .count { background:var(--accent); color:#fff; border-radius:999px; padding:0 .4rem; font-size:.7rem; }
    .badge { display:inline-block; margin-top:.4rem; font-size:.7rem; padding:.15rem .45rem; border-radius:6px; background:var(--warn-bg); color:var(--warn-fg); }
    .badge.ok { background:var(--ok-bg); color:var(--ok-fg); }
    .tool-list { list-style:none; margin:.6rem 0 0; padding:0; overflow:auto; display:flex; flex-direction:column; gap:.4rem; }
    .tool { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:.5rem .6rem; }
    .tool-name { font-weight:600; font-size:.85rem; }
    .tool-name em { font-style:normal; font-size:.65rem; color:var(--muted); border:1px solid var(--border); border-radius:4px; padding:0 .3rem; margin-left:.3rem; }
    .tool-desc { font-size:.75rem; color:var(--muted); margin-top:.2rem; }
    .muted { color:var(--muted); font-size:.8rem; }
  `],
})
export class ToolPanel {
  protected readonly registry = inject(ToolRegistryStore);
  protected readonly cap = inject(WebMcpCapability);
}
