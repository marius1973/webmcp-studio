import { ComponentNode } from '../../../core/state/component-tree.types';

export type DirectEditField = 'text' | 'label' | 'placeholder' | 'linkText';

export function readDirectEditValue(node: ComponentNode, field: DirectEditField): string {
  switch (field) {
    case 'text':
      return node.props['text'] ?? node.label;
    case 'label':
      return node.label;
    case 'placeholder':
      return node.props['placeholder'] ?? node.label;
    case 'linkText':
      return node.props['text'] ?? node.label;
  }
}

export function buildDirectEditPatch(
  node: ComponentNode,
  field: DirectEditField,
  value: string,
): { label?: string; props?: Record<string, string> } {
  const trimmed = value.trim();
  switch (field) {
    case 'label':
      return { label: trimmed || node.label };
    case 'text':
      return { props: { ...node.props, text: trimmed } };
    case 'placeholder':
      return { props: { ...node.props, placeholder: trimmed } };
    case 'linkText':
      return { props: { ...node.props, text: trimmed } };
  }
}

export function isDirectEditableKind(kind: ComponentNode['kind']): boolean {
  return kind === 'text' || kind === 'button' || kind === 'input' || kind === 'link';
}
