import { Injectable, computed, inject, signal } from '@angular/core';
import { ComponentTreeStore } from '../state/component-tree.store';
import { TreeState } from '../state/component-tree.types';
import { ObserverStore } from '../state/observer.store';
import { ToolOrigin } from '../webmcp/webmcp.types';
import type { AgentLane } from '../agents/agent-lane.types';
import { LANE_LABELS } from '../agents/agent-lane.types';
import { Command, CommandType } from './command';
import { TelemetryStore } from '../state/telemetry.store';

export interface HistoryEntry {
  type: CommandType;
  label: string;
  origin: ToolOrigin;
  before: TreeState;
  after: TreeState;
  at: number;
  lane?: AgentLane;
  conflict?: boolean;
}

/** Metadatos del último dispatch (conflictos multi-agente). */
export interface DispatchMeta {
  conflict: boolean;
  overlapping: string[];
  lane?: AgentLane;
}

/** Paso en la línea de tiempo undo/redo (índice 0 = estado inicial). */
export interface TimelineStep {
  index: number;
  id: string;
  label: string;
  origin: ToolOrigin;
  type: CommandType;
  destructive: boolean;
  at: number;
  tooltip: string;
  lane?: AgentLane;
}

export interface DispatchOptions {
  /** Nombre de la acción en la timeline (por defecto según el tipo de Command). */
  action?: string;
  /** Explicación del paso (por defecto: acción manual). */
  rationale?: string;
  /** Evita narrar (p. ej. cuando el caller narra con un action custom). */
  skipObserver?: boolean;
  /** Carril multi-agente (opcional). */
  lane?: AgentLane;
}

const ACTION_BY_TYPE: Record<CommandType, string> = {
  create: 'create_component',
  delete: 'delete_component',
  move: 'move_component',
  update: 'update_component',
};

function diffAffected(before: TreeState, after: TreeState): string[] {
  const ids = new Set([...Object.keys(before.nodes), ...Object.keys(after.nodes)]);
  const affected: string[] = [];
  for (const id of ids) {
    const b = before.nodes[id];
    const a = after.nodes[id];
    if (!b || !a) {
      affected.push(id);
      continue;
    }
    if (
      b.label !== a.label ||
      b.kind !== a.kind ||
      b.parentId !== a.parentId ||
      JSON.stringify(b.props) !== JSON.stringify(a.props) ||
      JSON.stringify(b.children) !== JSON.stringify(a.children)
    ) {
      affected.push(id);
      for (const childId of new Set([...b.children, ...a.children])) affected.push(childId);
    }
  }
  return [...new Set(affected)];
}

function formatTimelineTooltip(entry: HistoryEntry): string {
  const time = entry.at
    ? new Date(entry.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';
  const who = entry.lane
    ? LANE_LABELS[entry.lane]
    : entry.origin === 'agent'
      ? 'Agente'
      : 'Manual';
  const conflict = entry.conflict ? ' ⚡ conflicto' : '';
  return `${who}: ${entry.label}${time ? ` — ${time}` : ''}${conflict}`;
}

function detectLaneConflict(
  past: HistoryEntry[],
  affected: string[],
  lane?: AgentLane,
  origin?: ToolOrigin,
): { conflict: boolean; overlapping: string[] } {
  if (!lane || origin !== 'agent' || !past.length) return { conflict: false, overlapping: [] };
  const last = past[past.length - 1];
  if (!last.lane || last.lane === lane) return { conflict: false, overlapping: [] };
  const prevAffected = diffAffected(last.before, last.after);
  const overlapping = affected.filter((id) => prevAffected.includes(id));
  return { conflict: overlapping.length > 0, overlapping };
}

/**
 * Despacha Commands y mantiene el historial undo/redo.
 * Guarda snapshots antes/después de cada Command: el undo restaura `before`,
 * el redo restaura `after`. Distingue el origen (usuario vs agente) para la timeline.
 */
@Injectable({ providedIn: 'root' })
export class CommandBus {
  private readonly tree = inject(ComponentTreeStore);
  private readonly observer = inject(ObserverStore);
  private readonly telemetry = inject(TelemetryStore, { optional: true });
  private readonly _past = signal<HistoryEntry[]>([]);
  private readonly _future = signal<HistoryEntry[]>([]);
  private readonly _lastMeta = signal<DispatchMeta | null>(null);

  readonly lastMeta = this._lastMeta.asReadonly();

  readonly past = this._past.asReadonly();
  readonly future = this._future.asReadonly();
  readonly canUndo = computed(() => this._past().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);
  readonly count = computed(() => this._past().length);
  /** Posición actual en la línea de tiempo (0 = inicio, N = tras N comandos). */
  readonly currentIndex = computed(() => this._past().length);
  readonly maxIndex = computed(() => this._past().length + this._future().length);

  readonly timeline = computed((): TimelineStep[] => {
    const all = this.allEntriesChronological();
    const steps: TimelineStep[] = [
      {
        index: 0,
        id: 'start',
        label: 'Inicio',
        origin: 'user',
        type: 'update',
        destructive: false,
        at: 0,
        tooltip: 'Estado inicial del árbol',
      },
    ];
    for (let i = 0; i < all.length; i++) {
      const e = all[i];
      steps.push({
        index: i + 1,
        id: `${e.at}-${i}`,
        label: e.label,
        origin: e.origin,
        type: e.type,
        destructive: e.type === 'delete',
        at: e.at,
        tooltip: formatTimelineTooltip(e),
        lane: e.lane,
      });
    }
    return steps;
  });

  dispatch(command: Command, origin: ToolOrigin = 'user', options?: DispatchOptions): void {
    const before = this.tree.snapshot();
    command.run(this.tree);
    const after = this.tree.snapshot();
    const at = Date.now();
    const affected = diffAffected(before, after);
    const past = this._past();
    const { conflict, overlapping } = detectLaneConflict(past, affected, options?.lane, origin);
    const entry: HistoryEntry = {
      type: command.type,
      label: command.label,
      origin,
      before,
      after,
      at,
      lane: options?.lane,
      conflict,
    };
    this._past.update((p) => [...p, entry]);
    this._future.set([]);
    this._lastMeta.set({ conflict, overlapping, lane: options?.lane });

    if (origin === 'user' && !options?.skipObserver) {
      this.observer.narrate({
        action: options?.action ?? ACTION_BY_TYPE[command.type],
        what: command.label,
        rationale: options?.rationale ?? 'Acción manual desde el editor.',
        origin: 'user',
        affected,
        status: 'ok',
        at,
        lane: options?.lane,
        conflict,
      });
    }
  }

  dispatchBatch(
    commands: Command[],
    origin: ToolOrigin = 'agent',
    options?: { historyLabel?: string; action?: string; rationale?: string; what?: string; lane?: AgentLane },
  ): void {
    if (!commands.length) return;
    const before = this.tree.snapshot();
    try {
      for (const c of commands) c.run(this.tree);
    } catch (e) {
      this.tree.restore(before);
      throw e;
    }
    const after = this.tree.snapshot();
    const at = Date.now();
    const label = options?.historyLabel ?? `Batch (${commands.length} comandos)`;
    const affected = diffAffected(before, after);
    const past = this._past();
    const { conflict, overlapping } = detectLaneConflict(past, affected, options?.lane, origin);
    this._past.update((p) => [
      ...p,
      { type: 'update', label, origin, before, after, at, lane: options?.lane, conflict },
    ]);
    this._future.set([]);
    this._lastMeta.set({ conflict, overlapping, lane: options?.lane });

    if (origin === 'agent') {
      this.observer.narrate({
        action: options?.action ?? 'run_playbook',
        what: options?.what ?? label,
        rationale: options?.rationale ?? 'El agente ejecutó un playbook de varios pasos.',
        origin: 'agent',
        affected,
        status: 'ok',
        at,
        lane: options?.lane,
        conflict,
      });
    }
  }

  undo(options?: { skipObserver?: boolean }): void {
    const past = this._past();
    if (!past.length) return;
    const entry = past[past.length - 1];
    this.tree.restore(entry.before);
    this._past.set(past.slice(0, -1));
    this._future.update((f) => [entry, ...f]);

    if (!options?.skipObserver) {
      this.observer.narrate({
        action: 'undo',
        what: `Deshizo: ${entry.label}`,
        rationale: 'Acción manual desde el editor.',
        origin: 'user',
        affected: diffAffected(entry.after, entry.before),
        status: 'ok',
        at: Date.now(),
      });
      this.telemetry?.record('undo');
    }
  }

  /** Limpia el historial (al cambiar de proyecto). */
  reset(): void {
    this._past.set([]);
    this._future.set([]);
    this._lastMeta.set(null);
  }

  redo(options?: { skipObserver?: boolean }): void {
    const future = this._future();
    if (!future.length) return;
    const entry = future[0];
    this.tree.restore(entry.after);
    this._future.set(future.slice(1));
    this._past.update((p) => [...p, entry]);

    if (!options?.skipObserver) {
      this.observer.narrate({
        action: 'redo',
        what: `Rehizo: ${entry.label}`,
        rationale: 'Acción manual desde el editor.',
        origin: 'user',
        affected: diffAffected(entry.before, entry.after),
        status: 'ok',
        at: Date.now(),
      });
      this.telemetry?.record('redo');
    }
  }

  /**
   * Viaje directo en el historial (no undo secuencial).
   * Índice 0 = estado inicial; N = tras aplicar los primeros N comandos.
   */
  restoreTo(index: number, options?: { skipObserver?: boolean }): void {
    const past = this._past();
    const future = this._future();
    const total = past.length + future.length;
    const target = Math.max(0, Math.min(Math.floor(index), total));
    if (target === past.length) return;

    const beforeTree = this.tree.snapshot();
    const all = this.allEntriesChronological();
    const snap = this.snapshotAtIndex(target, all);
    this.tree.restore(snap);
    this._past.set(all.slice(0, target));
    this._future.set(all.slice(target));

    if (!options?.skipObserver) {
      const step = target > 0 ? all[target - 1] : null;
      this.observer.narrate({
        action: 'history_jump',
        what: step ? `Historial: ${step.label}` : 'Historial: inicio',
        rationale: `Salté al paso ${target} de ${total} en la línea de tiempo.`,
        origin: 'user',
        affected: diffAffected(beforeTree, snap),
        status: 'ok',
        at: Date.now(),
      });
      this.telemetry?.record('undo');
    }
  }

  private allEntriesChronological(): HistoryEntry[] {
    const past = this._past();
    const future = this._future();
    // future[0] es el siguiente redo; el orden cronológico completo es past + future.
    return [...past, ...future];
  }

  private snapshotAtIndex(index: number, all: HistoryEntry[]): TreeState {
    if (index === 0) return all.length ? all[0].before : this.tree.snapshot();
    return all[index - 1].after;
  }
}
