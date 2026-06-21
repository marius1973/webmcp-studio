import { Injectable, signal } from '@angular/core';
import { ComponentKind } from '../../../core/state/component-tree.types';

export interface CanvasContextMenuState {
  x: number;
  y: number;
  parentId: string;
}

@Injectable({ providedIn: 'root' })
export class CanvasContextMenuService {
  readonly menu = signal<CanvasContextMenuState | null>(null);

  open(x: number, y: number, parentId: string): void {
    this.menu.set({ x, y, parentId });
  }

  close(): void {
    this.menu.set(null);
  }
}

export const CONTEXT_ADD_KINDS: ComponentKind[] = [
  'container',
  'card',
  'text',
  'button',
  'input',
  'link',
  'divider',
  'image',
];
