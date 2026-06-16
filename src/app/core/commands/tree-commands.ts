import { ComponentKind, KIND_LABEL } from '../state/component-tree.types';
import { Command } from './command';

export function createComponent(parentId: string, kind: ComponentKind, index?: number): Command {
  return {
    type: 'create',
    label: `Crear ${KIND_LABEL[kind]}`,
    run: (tree) => {
      const id = tree.createChild(parentId, kind, index);
      if (id) tree.select(id);
    },
  };
}

export function deleteComponent(id: string): Command {
  const label = `Borrar ${id}`;
  return {
    type: 'delete',
    label,
    run: (tree) => {
      const parentId = tree.node(id)?.parentId ?? null;
      tree.removeSubtree(id);
      tree.select(parentId);
    },
  };
}

export function moveComponent(id: string, newParentId: string, index: number): Command {
  return {
    type: 'move',
    label: `Mover ${id}`,
    run: (tree) => tree.moveNode(id, newParentId, index),
  };
}

export function renameComponent(id: string, label: string): Command {
  return {
    type: 'update',
    label: `Renombrar ${id}`,
    run: (tree) => tree.patch(id, { label }),
  };
}

export function updateProp(id: string, key: string, value: string): Command {
  return {
    type: 'update',
    label: `Editar ${key}`,
    run: (tree) => tree.patch(id, { props: { [key]: value } }),
  };
}

export function updateNode(id: string, label: string, props: Record<string, string>): Command {
  return {
    type: 'update',
    label: `Editar ${id}`,
    run: (tree) => tree.patch(id, { label, props }),
  };
}
