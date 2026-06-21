import { Injectable, computed, signal } from '@angular/core';

export type PreviewDataMode = 'wireframe' | 'mock';

/** Toggle wireframe vs datos mock en el canvas Preview (solo visual; no muta el árbol). */
@Injectable({ providedIn: 'root' })
export class PreviewModeStore {
  readonly mode = signal<PreviewDataMode>('wireframe');
  readonly isMock = computed(() => this.mode() === 'mock');

  setWireframe(): void {
    this.mode.set('wireframe');
  }

  setMock(): void {
    this.mode.set('mock');
  }
}
