import { ComponentNode, TreeState } from './component-tree.types';

/** Clona un TreeState sin JSON.stringify (más rápido en árboles medianos). */
export function cloneTreeState(state: TreeState): TreeState {
  const nodes: Record<string, ComponentNode> = {};
  for (const [id, node] of Object.entries(state.nodes)) {
    nodes[id] = {
      id: node.id,
      kind: node.kind,
      label: node.label,
      props: { ...node.props },
      children: [...node.children],
      parentId: node.parentId,
    };
  }
  return { rootId: state.rootId, nodes };
}
