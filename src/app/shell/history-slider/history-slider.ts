import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommandBus, TimelineStep } from '../../core/commands/command-bus';

const MAX_VISIBLE_MARKERS = 11;

/**
 * Línea de tiempo undo/redo con slider arrastrable y marcadores por origen.
 * Viaje directo en el historial (no undo secuencial).
 */
@Component({
  selector: 'app-history-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="history-slider" role="group" aria-label="Historial undo/redo">
      <button
        type="button"
        class="nav-btn"
        (click)="undo()"
        [disabled]="!bus.canUndo()"
        title="Deshacer (Ctrl/Cmd+Z)"
        aria-label="Deshacer"
      >←</button>

      <div class="track-wrap">
        <input
          type="range"
          class="slider"
          [min]="0"
          [max]="bus.maxIndex()"
          [value]="sliderValue()"
          [disabled]="bus.maxIndex() === 0"
          (input)="onSliderInput($event)"
          (change)="onSliderChange($event)"
          aria-label="Posición en el historial"
          aria-valuemin="0"
          [attr.aria-valuemax]="bus.maxIndex()"
          [attr.aria-valuenow]="sliderValue()"
        />
        <div class="history-labels" aria-hidden="true">
          @for (step of visibleSteps(); track step.id) {
            <button
              type="button"
              class="step-marker"
              [class.active]="step.index === bus.currentIndex()"
              [class.manual]="step.origin === 'user' && !step.destructive && step.index > 0"
              [class.agent]="step.origin === 'agent' && !step.lane"
              [class.lane-a]="step.lane === 'A'"
              [class.lane-b]="step.lane === 'B'"
              [class.destructive]="step.destructive"
              [class.start]="step.index === 0"
              [title]="step.tooltip"
              (click)="jumpTo(step.index)"
            >
              <span class="dot"></span>
              <span class="label">{{ shortLabel(step) }}</span>
            </button>
          }
        </div>
      </div>

      <span class="pos">{{ bus.currentIndex() }} / {{ bus.maxIndex() }}</span>

      <button
        type="button"
        class="nav-btn"
        (click)="redo()"
        [disabled]="!bus.canRedo()"
        title="Rehacer"
        aria-label="Rehacer"
      >→</button>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .history-slider {
      display:flex; align-items:center; gap:.5rem;
      padding:.35rem .5rem;
      background:var(--surface-1);
      border:1px solid var(--border);
      border-radius:8px;
    }
    .nav-btn {
      flex-shrink:0;
      width:1.75rem; height:1.75rem;
      background:var(--surface-2); color:var(--fg);
      border:1px solid var(--border); border-radius:6px;
      font-size:.9rem; cursor:pointer; line-height:1;
    }
    .nav-btn:disabled { opacity:.35; cursor:not-allowed; }
    .nav-btn:not(:disabled):hover { border-color:var(--accent); color:var(--accent); }
    .track-wrap { flex:1; min-width:0; display:flex; flex-direction:column; gap:.25rem; }
    .slider {
      width:100%; height:.35rem; cursor:pointer;
      accent-color:var(--accent);
    }
    .slider:disabled { opacity:.35; cursor:not-allowed; }
    .history-labels {
      display:flex; align-items:flex-start; justify-content:space-between;
      gap:.15rem; min-height:2.1rem; overflow:hidden;
    }
    .step-marker {
      flex:1; min-width:0; max-width:4.5rem;
      display:flex; flex-direction:column; align-items:center; gap:.15rem;
      background:transparent; border:0; padding:.1rem .05rem; cursor:pointer;
    }
    .step-marker .dot {
      width:.55rem; height:.55rem; border-radius:50%;
      background:var(--muted); transition:transform .12s ease, box-shadow .12s ease;
    }
    .step-marker.start .dot { background:var(--border); }
    .step-marker.manual .dot { background:#4a9eff; }
    .step-marker.agent .dot { background:#f0a030; }
    .step-marker.lane-a .dot { background:#4a9eff; }
    .step-marker.lane-b .dot { background:#f0a030; }
    .step-marker.destructive .dot { background:#e85d6a; }
    .step-marker.active .dot {
      transform:scale(1.35);
      box-shadow:0 0 0 2px var(--surface-0), 0 0 0 3px currentColor;
    }
    .step-marker.manual.active .dot { color:#4a9eff; }
    .step-marker.agent.active .dot { color:#f0a030; }
    .step-marker.destructive.active .dot { color:#e85d6a; }
    .step-marker .label {
      font-size:.58rem; color:var(--muted); text-align:center;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;
      opacity:0; transition:opacity .12s ease;
    }
    .step-marker:hover .label, .step-marker.active .label { opacity:1; }
    .pos {
      flex-shrink:0; font-size:.65rem; color:var(--muted);
      font-family:ui-monospace,monospace; min-width:2.8rem; text-align:center;
    }
  `],
})
export class HistorySlider {
  protected readonly bus = inject(CommandBus);
  protected readonly sliderValue = signal(0);

  protected readonly visibleSteps = computed(() => {
    const steps = this.bus.timeline();
    if (steps.length <= MAX_VISIBLE_MARKERS) return steps;
    const cur = this.bus.currentIndex();
    const half = Math.floor(MAX_VISIBLE_MARKERS / 2);
    let start = Math.max(0, cur - half);
    const end = Math.min(steps.length, start + MAX_VISIBLE_MARKERS);
    start = Math.max(0, end - MAX_VISIBLE_MARKERS);
    return steps.slice(start, end);
  });

  constructor() {
    effect(() => {
      this.sliderValue.set(this.bus.currentIndex());
    });
  }

  protected shortLabel(step: TimelineStep): string {
    if (step.index === 0) return 'Inicio';
    const words = step.label.split(/\s+/);
    return words.length > 2 ? `${words[0]}…` : step.label;
  }

  protected undo(): void {
    this.bus.undo();
  }

  protected redo(): void {
    this.bus.redo();
  }

  protected jumpTo(index: number): void {
    this.bus.restoreTo(index);
  }

  protected onSliderInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.sliderValue.set(value);
    this.bus.restoreTo(value, { skipObserver: true });
  }

  protected onSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.bus.restoreTo(value);
  }
}
