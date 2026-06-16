import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentLogStore } from '../../core/state/agent-log.store';
import { ObserverStore } from '../../core/state/observer.store';
import { CommandBus } from '../../core/commands/command-bus';
import { StudioToolsService } from '../../core/webmcp/studio-tools.service';

type ConsoleView = 'calls' | 'observer';

@Component({
  selector: 'app-agent-console',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="panel-head">
      <div class="tabs" role="tablist" aria-label="Vistas de la consola">
        <button
          type="button"
          role="tab"
          id="tab-observer"
          [attr.aria-selected]="view() === 'observer'"
          aria-controls="panel-observer"
          [class.active]="view() === 'observer'"
          (click)="view.set('observer')"
        >
          Observador <span class="count">{{ observer.agentCount() }}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-calls"
          [attr.aria-selected]="view() === 'calls'"
          aria-controls="panel-calls"
          [class.active]="view() === 'calls'"
          (click)="view.set('calls')"
        >
          Tool calls <span class="count">{{ log.count() }}</span>
        </button>
      </div>

      @if (view() === 'observer') {
        <div class="obs-actions">
          <label class="switch">
            <input type="checkbox" [checked]="observer.enabled()" (change)="observer.toggle()" />
            Modo Observador
          </label>
          <button (click)="bus.undo()" [disabled]="!bus.canUndo()" title="Deshacer (incluye acciones del agente)">↶ Undo</button>
          <button (click)="bus.redo()" [disabled]="!bus.canRedo()">↷ Redo</button>
          <button class="ghost" (click)="observer.clear()">limpiar</button>
        </div>
      } @else {
        <div class="dev-actions">
          <span class="dev-label">simular app-tools:</span>
          <button (click)="tools.greet('user')">greet()</button>
          <input [(ngModel)]="pingName" placeholder="nombre" />
          <button (click)="tools.ping(pingName(), 'user')">ping_studio()</button>
          <button class="ghost" (click)="log.clear()">limpiar</button>
        </div>
      }
    </div>

    @if (view() === 'observer') {
      <div class="timeline" role="tabpanel" id="panel-observer" aria-labelledby="tab-observer">
        @for (e of reversedEvents(); track e.at) {
          <div class="step" [class.agent]="e.origin === 'agent'" [class.err]="e.status === 'error'">
            <span class="who">{{ e.origin === 'agent' ? '🤖' : '🙂' }}</span>
            <div class="body">
              <div class="line"><code class="action">{{ e.action }}</code> <span class="what">{{ e.what }}</span></div>
              <div class="why">porque {{ e.rationale }}</div>
              @if (e.affected.length) { <div class="affected">nodos: {{ e.affected.join(', ') }}</div> }
            </div>
            <span class="time">{{ fmt(e.at) }}</span>
          </div>
        } @empty {
          <div class="muted">Todavía no hay pasos. Creá componentes en el editor o invocá tools desde un agente.</div>
        }
      </div>
    } @else {
      <div class="log" role="tabpanel" id="panel-calls" aria-labelledby="tab-calls">
        @for (e of reversedCalls(); track $index) {
          <div class="row" [class.agent]="e.origin === 'agent'">
            <span class="origin">{{ e.origin === 'agent' ? '🤖' : '🙂' }}</span>
            <code class="call">{{ e.toolName }}({{ argStr(e.args) }})</code>
            <span class="arrow">→</span>
            <span class="result">{{ e.result }}</span>
          </div>
        } @empty {
          <div class="muted">Sin tool calls todavía.</div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; }
    .panel-head { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
    .tabs { display:flex; gap:.3rem; }
    .tabs button { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:6px; padding:.2rem .55rem; font-size:.75rem; cursor:pointer; }
    .tabs button.active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .count { background:var(--surface-2); color:var(--fg); border-radius:999px; padding:0 .35rem; font-size:.65rem; }
    .tabs button.active .count { background:rgba(255,255,255,.25); color:#fff; }
    .obs-actions, .dev-actions { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
    .switch { display:flex; align-items:center; gap:.3rem; font-size:.72rem; color:var(--muted); }
    .dev-label { font-size:.7rem; color:var(--muted); }
    button { background:var(--accent); color:#fff; border:0; border-radius:6px; padding:.25rem .6rem; font-size:.75rem; cursor:pointer; }
    .obs-actions button { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); }
    button:disabled { opacity:.4; cursor:not-allowed; }
    button.ghost { background:transparent; color:var(--muted); border:1px solid var(--border); }
    input { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:.2rem .4rem; color:var(--fg); font-size:.75rem; width:6rem; }
    .timeline, .log { margin-top:.6rem; overflow:auto; display:flex; flex-direction:column; gap:.35rem; }
    .step { display:flex; gap:.5rem; padding:.35rem .5rem; border-radius:8px; background:var(--surface-2); border-left:3px solid var(--border); }
    .step.agent { border-left-color:var(--accent); }
    .step.err { border-left-color:#c0455f; }
    .who { font-size:1rem; }
    .body { flex:1; }
    .line { font-size:.8rem; }
    .action { color:var(--accent); font-family:ui-monospace,monospace; }
    .what { color:var(--fg); }
    .why { font-size:.74rem; color:var(--muted); font-style:italic; margin-top:.1rem; }
    .affected { font-size:.68rem; color:var(--muted); font-family:ui-monospace,monospace; margin-top:.1rem; }
    .time { font-size:.65rem; color:var(--muted); white-space:nowrap; }
    .log { font-family:ui-monospace,monospace; }
    .row { display:flex; align-items:baseline; gap:.4rem; font-size:.78rem; padding:.2rem .3rem; border-radius:6px; }
    .row.agent { background:var(--surface-2); }
    .call { color:var(--accent); }
    .arrow { color:var(--muted); }
    .muted { color:var(--muted); font-size:.8rem; }
  `],
})
export class AgentConsole {
  protected readonly log = inject(AgentLogStore);
  protected readonly observer = inject(ObserverStore);
  protected readonly bus = inject(CommandBus);
  protected readonly tools = inject(StudioToolsService);

  protected readonly view = signal<ConsoleView>('observer');
  protected readonly pingName = signal('Mario');

  protected readonly reversedEvents = computed(() => [...this.observer.events()].reverse());
  protected readonly reversedCalls = computed(() => [...this.log.log()].reverse());

  protected fmt(at: number): string {
    return new Date(at).toLocaleTimeString();
  }

  protected argStr(args: unknown): string {
    if (args && typeof args === 'object' && Object.keys(args).length) {
      return JSON.stringify(args);
    }
    return '';
  }
}
