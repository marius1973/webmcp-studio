import { Injectable, signal } from '@angular/core';

/** Estado compartido de edición in-place en el canvas (evita drag durante edit). */
@Injectable({ providedIn: 'root' })
export class CanvasEditStore {
  readonly editingNodeId = signal<string | null>(null);

  start(nodeId: string): void {
    this.editingNodeId.set(nodeId);
  }

  stop(): void {
    this.editingNodeId.set(null);
  }

  isEditing(nodeId: string): boolean {
    return this.editingNodeId() === nodeId;
  }
}
