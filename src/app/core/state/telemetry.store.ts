import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'webmcp-studio:telemetry';
const ENABLED_KEY = 'webmcp-studio:telemetry-enabled';

export type TelemetryEventType = 'tool_invoke' | 'export' | 'undo' | 'redo' | 'playbook';

export interface TelemetryEvent {
  type: TelemetryEventType;
  name?: string;
  at: number;
}

/** Telemetría anónima opt-in — solo local (localStorage), sin red ni PII. */
@Injectable({ providedIn: 'root' })
export class TelemetryStore {
  private readonly _events = signal<TelemetryEvent[]>(this.loadEvents());
  readonly events = this._events.asReadonly();
  readonly enabled = signal(this.loadEnabled());
  readonly count = computed(() => this._events().length);

  readonly summary = computed(() => {
    const counts: Record<string, number> = {};
    for (const e of this._events()) {
      const key = e.name ? `${e.type}:${e.name}` : e.type;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  });

  toggle(): void {
    this.enabled.update((v) => {
      const next = !v;
      try {
        localStorage.setItem(ENABLED_KEY, String(next));
      } catch {
        // storage bloqueado
      }
      return next;
    });
  }

  record(type: TelemetryEventType, name?: string): void {
    if (!this.enabled()) return;
    const ev: TelemetryEvent = { type, name, at: Date.now() };
    this._events.update((list) => {
      const next = [...list, ev].slice(-500);
      this.persist(next);
      return next;
    });
  }

  clear(): void {
    this._events.set([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }

  exportJson(): string {
    return JSON.stringify(
      { enabled: this.enabled(), summary: this.summary(), events: this._events() },
      null,
      2,
    );
  }

  private loadEvents(): TelemetryEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as TelemetryEvent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private loadEnabled(): boolean {
    try {
      return localStorage.getItem(ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persist(events: TelemetryEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // quota / privado
    }
  }
}
