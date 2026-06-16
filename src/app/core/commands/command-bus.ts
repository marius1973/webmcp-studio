import { Injectable, computed, inject, signal } from '@angular/core';
import { ComponentTreeStore } from '../state/component-tree.store';
import { TreeState } from '../state/component-tree.types';
import { ObserverStore } from '../state/observer.store';
import { ToolOrigin } from '../webmcp/webmcp.types';
import { Command, CommandType } from './command';

export interface HistoryEntry {
  type: CommandType;
  label: string;
  origin: ToolOrigin;
  before: TreeState;
  after: TreeState;
  at: number;
}

export interface DispatchOptions {
  /** Nombre de la acción en la timeline (por defecto según el tipo de Command). */
  action?: string;
  /** Explicación del paso (por defecto: acción manual). */
  rationale?: string;
  /** Evita narrar (p. ej. cuando el caller narra con un action custom). */
  skipObserver?: boolean;
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

/**
 * Despacha Commands y mantiene el historial undo/redo.
 * Guarda snapshots antes/después de cada Command: el undo restaura `before`,
 * el redo restaura `after`. Distingue el origen (usuario vs agente) para la timeline.
 */
@Injectable({ providedIn: 'root' })
export class CommandBus {
  private readonly tree = inject(ComponentTreeStore);
  private readonly observer = inject(ObserverStore);
  private readonly _past = signal<HistoryEntry[]>([]);
  private readonly _future = signal<HistoryEntry[]>([]);

  readonly past = this._past.asReadonly();
  readonly future = this._future.asReadonly();
  readonly canUndo = computed(() => this._past().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);
  readonly count = computed(() => this._past().length);

  dispatch(command: Command, origin: ToolOrigin = 'user', options?: DispatchOptions): void {
    const before = this.tree.snapshot();
    command.run(this.tree);
    const after = this.tree.snapshot();
    const at = Date.now();
    this._past.update((p) => [
      ...p,
      { type: command.type, label: command.label, origin, before, after, at },
    ]);
    this._future.set([]);

    if (origin === 'user' && !options?.skipObserver) {
      this.observer.narrate({
        action: options?.action ?? ACTION_BY_TYPE[command.type],
        what: command.label,
        rationale: options?.rationale ?? 'Acción manual desde el editor.',
        origin: 'user',
        affected: diffAffected(before, after),
        status: 'ok',
        at,
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
    }
  }

  /** Limpia el historial (al cambiar de proyecto). */
  reset(): void {
    this._past.set([]);
    this._future.set([]);
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
    }
  }
}
