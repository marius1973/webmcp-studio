import { TreeState } from '../state/component-tree.types';

export interface SerializedNode {
  id: string;
  kind: string;
  label: string;
  props: Record<string, string>;
  children: SerializedNode[];
}

/** Serializa el árbol normalizado a forma anidada (para read_tree). */
export function serializeTree(state: TreeState): SerializedNode {
  const build = (id: string): SerializedNode => {
    const n = state.nodes[id];
    return {
      id: n.id,
      kind: n.kind,
      label: n.label,
      props: n.props,
      children: n.children.map(build),
    };
  };
  return build(state.rootId);
}
