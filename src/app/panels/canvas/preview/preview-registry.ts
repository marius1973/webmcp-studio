import { Type } from '@angular/core';
import { ComponentKind } from '../../../core/state/component-tree.types';
import { PreviewButton, PreviewDivider, PreviewImage, PreviewInput, PreviewLink, PreviewText } from './preview-widgets';

/** Tipos que se instancian dinámicamente con NgComponentOutlet (hojas). */
export const PREVIEW_LEAVES: Partial<Record<ComponentKind, Type<unknown>>> = {
  button: PreviewButton,
  text: PreviewText,
  input: PreviewInput,
  link: PreviewLink,
  divider: PreviewDivider,
  image: PreviewImage,
};

/** Kinds que actúan como contenedores (renderizan hijos). */
export const CONTAINER_KINDS: ComponentKind[] = ['container', 'card'];

export function leafComponent(kind: ComponentKind): Type<unknown> | null {
  return PREVIEW_LEAVES[kind] ?? null;
}
export function isContainerKind(kind: ComponentKind): boolean {
  return CONTAINER_KINDS.includes(kind);
}
