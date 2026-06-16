import { Injectable, computed, signal } from '@angular/core';
import { ComponentKind, ComponentNode, KIND_LABEL, TreeState } from './component-tree.types';
import { cloneTreeState } from './tree-clone';

let idSeq = 0;
function nextId(kind: ComponentKind): string {
  idSeq += 1;
  return `${kind}-${idSeq.toString(36)}-${Date.now().toString(36).slice(-4)}`;
}

export function createInitialTreeState(): TreeState {
  const rootId = 'root';
  const root: ComponentNode = {
    id: rootId,
    kind: 'container',
    label: 'AppRoot',
    props: {},
    children: [],
    parentId: null,
  };
  return { nodes: { [rootId]: root }, rootId };
}

/**
 * Estado normalizado del árbol en signals.
 * Las mutaciones son inmutables (clonan + set). Los Commands las invocan;
 * el undo/redo del CommandBus restaura snapshots completos.
 */
@Injectable({ providedIn: 'root' })
export class ComponentTreeStore {
  private readonly _state = signal<TreeState>(createInitialTreeState());
  readonly state = this._state.asReadonly();

  readonly rootId = computed(() => this._state().rootId);
  readonly selectedId = signal<string | null>('root');

  /** Todos los ids: cada nodo puede ser destino de drop. */
  readonly allNodeIds = computed(() => Object.keys(this._state().nodes));
  readonly nodeCount = computed(() => Object.keys(this._state().nodes).length);

  /** Orden de visita en profundidad (raíz primero) para navegación por teclado. */
  readonly preorderIds = computed(() => {
    const s = this._state();
    const ids: string[] = [];
    const walk = (id: string): void => {
      ids.push(id);
      for (const childId of s.nodes[id]?.children ?? []) walk(childId);
    };
    walk(s.rootId);
    return ids;
  });

  parentOf(id: string): string | null {
    return this._state().nodes[id]?.parentId ?? null;
  }

  node(id: string): ComponentNode | undefined {
    return this._state().nodes[id];
  }

  childrenOf(id: string): ComponentNode[] {
    const s = this._state();
    return (s.nodes[id]?.children ?? []).map((cid) => s.nodes[cid]).filter(Boolean) as ComponentNode[];
  }

  select(id: string | null): void {
    this.selectedId.set(id);
  }

  /** ¿`maybeAncestor` es ancestro (o igual) de `id`? Evita ciclos en move. */
  isAncestor(maybeAncestor: string, id: string): boolean {
    const s = this._state();
    let cur: string | null = id;
    while (cur) {
      if (cur === maybeAncestor) return true;
      cur = s.nodes[cur]?.parentId ?? null;
    }
    return false;
  }

  // --- snapshots (para el CommandBus) ---
  snapshot(): TreeState {
    return cloneTreeState(this._state());
  }
  restore(state: TreeState): void {
    this._state.set(cloneTreeState(state));
  }

  // --- mutaciones inmutables (las usan los Commands) ---

  createChild(parentId: string, kind: ComponentKind, index?: number): string {
    const s = cloneTreeState(this._state());
    const parent = s.nodes[parentId];
    if (!parent) return '';
    const id = nextId(kind);
    s.nodes[id] = { id, kind, label: KIND_LABEL[kind], props: {}, children: [], parentId };
    const at = index ?? parent.children.length;
    parent.children.splice(at, 0, id);
    this._state.set(s);
    return id;
  }

  removeSubtree(id: string): void {
    const s = cloneTreeState(this._state());
    const node = s.nodes[id];
    if (!node || node.parentId === null) return; // no se borra la raíz
    const toDelete: string[] = [];
    const collect = (n: string): void => {
      toDelete.push(n);
      s.nodes[n]?.children.forEach(collect);
    };
    collect(id);
    const parent = s.nodes[node.parentId];
    if (parent) parent.children = parent.children.filter((c) => c !== id);
    toDelete.forEach((d) => delete s.nodes[d]);
    this._state.set(s);
  }

  moveNode(id: string, newParentId: string, index: number): void {
    const s = cloneTreeState(this._state());
    const node = s.nodes[id];
    const newParent = s.nodes[newParentId];
    if (!node || !newParent || node.parentId === null) return;
    const oldParent = s.nodes[node.parentId];
    if (oldParent) oldParent.children = oldParent.children.filter((c) => c !== id);
    const at = Math.max(0, Math.min(index, newParent.children.length));
    newParent.children.splice(at, 0, id);
    node.parentId = newParentId;
    this._state.set(s);
  }

  patch(id: string, changes: Partial<Pick<ComponentNode, 'label' | 'props'>>): void {
    const s = cloneTreeState(this._state());
    const node = s.nodes[id];
    if (!node) return;
    if (changes.label !== undefined) node.label = changes.label;
    if (changes.props !== undefined) node.props = { ...node.props, ...changes.props };
    this._state.set(s);
  }
}
