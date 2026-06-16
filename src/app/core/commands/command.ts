import { ComponentTreeStore } from '../state/component-tree.store';

export type CommandType = 'create' | 'delete' | 'move' | 'update';

/**
 * Mutación atómica del árbol. Solo describe la acción hacia adelante;
 * el undo/redo lo resuelve el CommandBus con snapshots (memento).
 * Las tools WebMCP son envoltorios finos que despachan estos Commands.
 */
export interface Command {
  readonly type: CommandType;
  readonly label: string;
  run(tree: ComponentTreeStore): void;
}
