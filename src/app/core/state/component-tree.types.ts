/** Modelo de datos del árbol de componentes (normalizado por id). */

export type ComponentKind =
  | 'container'
  | 'card'
  | 'button'
  | 'text'
  | 'input'
  | 'link'
  | 'divider'
  | 'image';

export const COMPONENT_KINDS: ComponentKind[] = [
  'container',
  'card',
  'button',
  'text',
  'input',
  'link',
  'divider',
  'image',
];

export interface ComponentNode {
  id: string;
  kind: ComponentKind;
  label: string;
  props: Record<string, string>;
  children: string[];      // ids de hijos (orden significativo)
  parentId: string | null; // null solo para la raíz
}

export interface TreeState {
  nodes: Record<string, ComponentNode>;
  rootId: string;
}

export const KIND_LABEL: Record<ComponentKind, string> = {
  container: 'Contenedor',
  card: 'Card',
  button: 'Botón',
  text: 'Texto',
  input: 'Input',
  link: 'Link',
  divider: 'Divisor',
  image: 'Imagen',
};

export const KIND_ICON: Record<ComponentKind, string> = {
  container: '▢',
  card: '🗂',
  button: '🔘',
  text: '🔤',
  input: '⌨',
  link: '🔗',
  divider: '—',
  image: '🖼',
};
