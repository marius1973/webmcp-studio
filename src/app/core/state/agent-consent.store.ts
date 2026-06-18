import { Injectable, signal } from '@angular/core';

export interface ConsentRequest {
  toolName: string;
  summary: string;
  args: unknown;
  resolve: (approved: boolean) => void;
}

/** Cola de consentimiento antes de tools destructivas del agente. */
@Injectable({ providedIn: 'root' })
export class AgentConsentStore {
  /** Si false, las tools destructivas se ejecutan sin preguntar. */
  readonly requireConsent = signal(true);

  readonly pending = signal<ConsentRequest | null>(null);

  toggleRequire(): void {
    this.requireConsent.update((v) => !v);
  }

  async request(toolName: string, summary: string, args: unknown): Promise<boolean> {
    if (!this.requireConsent()) return true;
    return new Promise((resolve) => {
      this.pending.set({ toolName, summary, args, resolve });
    });
  }

  approve(): void {
    const p = this.pending();
    if (!p) return;
    this.pending.set(null);
    p.resolve(true);
  }

  deny(): void {
    const p = this.pending();
    if (!p) return;
    this.pending.set(null);
    p.resolve(false);
  }
}

export const DESTRUCTIVE_AGENT_TOOLS = new Set(['delete_component', 'apply_patch']);
