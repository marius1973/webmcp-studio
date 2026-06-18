import { ComponentKind, ComponentNode, TreeState } from '../state/component-tree.types';

const KINDS: ComponentKind[] = [
  'container',
  'card',
  'button',
  'text',
  'input',
  'link',
  'divider',
  'image',
];
const MAX_NODES = 500;

export type TreeValidationResult =
  | { ok: true; state: TreeState }
  | { ok: false; error: string };

/** Valida estructura, referencias, kinds y ausencia de ciclos/huérfanos. */
export function validateTreeState(tree: unknown): TreeValidationResult {
  if (!tree || typeof tree !== 'object') return { ok: false, error: 'Árbol inválido' };

  const t = tree as Partial<TreeState>;
  if (!t.rootId || typeof t.rootId !== 'string') return { ok: false, error: 'Falta rootId' };
  if (!t.nodes || typeof t.nodes !== 'object') return { ok: false, error: 'Falta nodes' };

  const nodes = t.nodes;
  const ids = Object.keys(nodes);
  if (!ids.length) return { ok: false, error: 'El árbol no tiene nodos' };
  if (ids.length > MAX_NODES) return { ok: false, error: `Demasiados nodos (máx. ${MAX_NODES})` };
  if (!nodes[t.rootId]) return { ok: false, error: 'rootId no existe en nodes' };

  const root = nodes[t.rootId] as ComponentNode;
  if (root.parentId !== null) return { ok: false, error: 'La raíz debe tener parentId null' };

  for (const id of ids) {
    const node = nodes[id] as ComponentNode;
    if (!node || typeof node !== 'object') return { ok: false, error: `Nodo inválido: ${id}` };
    if (node.id !== id) return { ok: false, error: `ID inconsistente en nodo ${id}` };
    if (!(KINDS as string[]).includes(node.kind)) {
      return { ok: false, error: `Kind inválido en ${id}: ${String(node.kind)}` };
    }
    if (typeof node.label !== 'string') return { ok: false, error: `Label inválido en ${id}` };
    if (!node.props || typeof node.props !== 'object' || Array.isArray(node.props)) {
      return { ok: false, error: `Props inválidos en ${id}` };
    }
    if (!Array.isArray(node.children)) return { ok: false, error: `Children inválidos en ${id}` };

    if (node.parentId === null && id !== t.rootId) {
      return { ok: false, error: `Solo la raíz puede tener parentId null (${id})` };
    }
    if (node.parentId !== null) {
      const parent = nodes[node.parentId] as ComponentNode | undefined;
      if (!parent) return { ok: false, error: `Padre inexistente para ${id}: ${node.parentId}` };
      if (!parent.children.includes(id)) {
        return { ok: false, error: `Hijo ${id} no listado en padre ${node.parentId}` };
      }
    }

    for (const childId of node.children) {
      if (typeof childId !== 'string') return { ok: false, error: `ID de hijo inválido en ${id}` };
      const child = nodes[childId] as ComponentNode | undefined;
      if (!child) return { ok: false, error: `Hijo inexistente ${childId} en ${id}` };
      if (child.parentId !== id) return { ok: false, error: `parentId de ${childId} no coincide con ${id}` };
    }
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const visit = (id: string): boolean => {
    if (stack.has(id)) return false;
    if (visited.has(id)) return true;
    stack.add(id);
    const node = nodes[id] as ComponentNode;
    for (const childId of node.children) {
      if (!visit(childId)) return false;
    }
    stack.delete(id);
    visited.add(id);
    return true;
  };
  if (!visit(t.rootId)) return { ok: false, error: 'Ciclo detectado en el árbol' };
  if (visited.size !== ids.length) {
    return { ok: false, error: 'Nodos huérfanos detectados (no alcanzables desde la raíz)' };
  }

  return { ok: true, state: t as TreeState };
}
