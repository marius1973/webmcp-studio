import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentLogStore } from '../../core/state/agent-log.store';
import { ObserverStore, ObserverEvent } from '../../core/state/observer.store';
import { ComponentTreeStore } from '../../core/state/component-tree.store';
import { StudioToolsService } from '../../core/webmcp/studio-tools.service';
import { ParallelAgentService } from '../../core/agents/parallel-agent.service';

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
          <span class="lane-stats" aria-label="Pasos por carril">
            <span class="lane-a">A: {{ observer.laneCountA() }}</span>
            <span class="sep">·</span>
            <span class="lane-b">B: {{ observer.laneCountB() }}</span>
          </span>
          <label class="switch">
            <input type="checkbox" [checked]="observer.enabled()" (change)="observer.toggle()" />
            Modo Observador
          </label>
          <button class="ghost" (click)="observer.clear()">limpiar</button>
          <button class="demo-2" type="button" (click)="runTwoAgents()" title="Dos agentes intercalados vía CommandBus">Demo: 2 agentes</button>
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
          <button
            type="button"
            class="step"
            [class.agent]="e.origin === 'agent'"
            [class.lane-a]="e.lane === 'A'"
            [class.lane-b]="e.lane === 'B'"
            [class.conflict]="e.conflict"
            [class.err]="e.status === 'error'"
            (click)="replay(e)"
            [title]="stepTitle(e)"
          >
            <span class="who">{{ whoIcon(e) }}</span>
            <div class="body">
              <div class="line">
                @if (e.lane) { <span class="lane-tag" [class]="'lane-' + e.lane.toLowerCase()">{{ e.lane }}</span> }
                <code class="action">{{ e.action }}</code> <span class="what">{{ e.what }}</span>
              </div>
              <div class="why">porque {{ e.rationale }}</div>
              @if (e.conflict) { <div class="conflict-note">⚡ last-write-wins entre carriles</div> }
              @if (e.affected.length) { <div class="affected">nodos: {{ e.affected.join(', ') }}</div> }
            </div>
            <span class="time">{{ fmt(e.at) }}</span>
          </button>
        } @empty {
          <div class="muted">Todavía no hay pasos. Crea componentes en el editor o invoca tools desde un agente.</div>
        }
      </div>
    } @else {
      <div class="log" role="tabpanel" id="panel-calls" aria-labelledby="tab-calls">
        @for (e of reversedCalls(); track $index) {
          <div class="row" [class.agent]="e.origin === 'agent'" [class.lane-a]="e.lane === 'A'" [class.lane-b]="e.lane === 'B'">
            <span class="origin">{{ e.lane ?? (e.origin === 'agent' ? '🤖' : '🙂') }}</span>
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
    .lane-stats { font-size:.68rem; font-family:ui-monospace,monospace; }
    .lane-stats .lane-a { color:#4a9eff; }
    .lane-stats .lane-b { color:#f0a030; }
    .lane-stats .sep { color:var(--muted); margin:0 .2rem; }
    .switch { display:flex; align-items:center; gap:.3rem; font-size:.72rem; color:var(--muted); }
    .dev-label { font-size:.7rem; color:var(--muted); }
    button { background:var(--accent); color:#fff; border:0; border-radius:6px; padding:.25rem .6rem; font-size:.75rem; cursor:pointer; }
    .obs-actions button { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); }
    button:disabled { opacity:.4; cursor:not-allowed; }
    button.ghost { background:transparent; color:var(--muted); border:1px solid var(--border); }
    button.demo-2 { background:linear-gradient(90deg,#4a9eff,#f0a030); color:#fff; border:0; font-weight:600; }
    input { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:.2rem .4rem; color:var(--fg); font-size:.75rem; width:6rem; }
    .timeline, .log { margin-top:.6rem; overflow:auto; display:flex; flex-direction:column; gap:.35rem; }
    .step { display:flex; gap:.5rem; padding:.35rem .5rem; border-radius:8px; background:var(--surface-2); border-left:3px solid var(--border); width:100%; text-align:left; cursor:pointer; border:0; border-left:3px solid var(--border); color:inherit; font:inherit; }
    .step.agent { border-left-color:var(--accent); }
    .step.lane-a { border-left-color:#4a9eff; }
    .step.lane-b { border-left-color:#f0a030; }
    .step.conflict { box-shadow:inset 0 0 0 1px #e85d6a; }
    .step.err { border-left-color:#c0455f; }
    .lane-tag { font-size:.6rem; font-weight:700; padding:0 .25rem; border-radius:4px; margin-right:.25rem; }
    .lane-tag.lane-a { background:rgba(74,158,255,.2); color:#4a9eff; }
    .lane-tag.lane-b { background:rgba(240,160,48,.2); color:#f0a030; }
    .conflict-note { font-size:.68rem; color:#e85d6a; margin-top:.1rem; }
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
    .row.lane-a { border-left:2px solid #4a9eff; }
    .row.lane-b { border-left:2px solid #f0a030; }
    .call { color:var(--accent); }
    .arrow { color:var(--muted); }
    .muted { color:var(--muted); font-size:.8rem; }
  `],
})
export class AgentConsole {
  protected readonly log = inject(AgentLogStore);
  protected readonly observer = inject(ObserverStore);
  protected readonly tree = inject(ComponentTreeStore);
  protected readonly tools = inject(StudioToolsService);
  private readonly parallel = inject(ParallelAgentService);

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

  protected replay(e: ObserverEvent): void {
    if (e.affected.length) {
      this.tree.setHighlighted(e.affected);
      this.tree.select(e.affected[0]!);
    } else {
      this.tree.clearHighlight();
    }
  }

  protected runTwoAgents(): void {
    this.view.set('observer');
    this.parallel.runTwoAgentDemo();
  }

  protected whoIcon(e: ObserverEvent): string {
    if (e.lane === 'A') return '🔵';
    if (e.lane === 'B') return '🟠';
    return e.origin === 'agent' ? '🤖' : '🙂';
  }

  protected stepTitle(e: ObserverEvent): string {
    const lane = e.lane ? `Carril ${e.lane} · ` : '';
    const conflict = e.conflict ? ' · conflicto LWW' : '';
    return `${lane}Clic para resaltar nodos${conflict}`;
  }
}
