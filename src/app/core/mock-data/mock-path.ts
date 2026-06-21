import { ComponentKind, ComponentNode } from '../state/component-tree.types';

export interface MockContext {
  componentType: ComponentKind;
  label: string;
  parentLabel?: string;
  path: string;
  nodeId: string;
  textSize?: string;
  variant?: string;
}

export function slugLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '') || 'node'
  );
}

/** Segmento semántico para armar rutas mock (hero.title, card.feature, …). */
export function pathSegment(node: ComponentNode, siblingIndex: number, parent?: ComponentNode): string {
  const label = slugLabel(node.label);
  const parentSlug = parent ? slugLabel(parent.label) : '';

  if (node.kind === 'text') {
    if (node.props['textSize'] === 'hero') return 'title';
    if (node.props['textSize'] === 'caption') return 'caption';
    if (parentSlug.includes('hero')) return siblingIndex === 0 ? 'title' : 'subtitle';
    if (parent?.kind === 'card') return 'body';
    if (label.includes('titulo') || label === 'title') return 'title';
    if (label.includes('sub') || label.includes('desc')) return 'subtitle';
    return 'body';
  }
  if (node.kind === 'button') return 'cta';
  if (node.kind === 'input') return 'input';
  if (node.kind === 'image') return 'image';
  if (node.kind === 'link') return 'link';
  if (node.kind === 'card') return label || 'feature';
  if (node.kind === 'container') return label || 'section';
  return label || node.kind;
}

export function joinPath(parentPath: string | undefined, segment: string): string {
  return parentPath ? `${parentPath}.${segment}` : segment;
}
