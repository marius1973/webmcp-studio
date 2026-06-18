import { DestroyRef, Injectable, inject } from '@angular/core';
import { EditingToolsService } from '../webmcp/editing-tools.service';

const BRIDGE_WS_URL = 'ws://localhost:3847';
const MSG_INVOKE = 'webmcp-studio:invoke';
const MSG_RESULT = 'webmcp-studio:result';

type BridgeInvoke = {
  type: typeof MSG_INVOKE;
  id: string;
  tool: string;
  args?: Record<string, unknown>;
};

/**
 * Puente para clientes externos (MCP server, bookmarklet, iframe padre).
 * Protocolo postMessage + WebSocket opcional en dev (puerto 3847).
 */
@Injectable({ providedIn: 'root' })
export class StudioBridgeService {
  private readonly edit = inject(EditingToolsService);
  private ws: WebSocket | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.onMessage);
      (window as unknown as { webmcpStudio?: unknown }).webmcpStudio = {
        invoke: (tool: string, args?: Record<string, unknown>) => this.invokeTool(tool, args ?? {}),
        version: '1',
      };
      this.tryConnectWs();
    }
    destroyRef.onDestroy(() => {
      window.removeEventListener('message', this.onMessage);
      this.ws?.close();
    });
  }

  private readonly onMessage = (event: MessageEvent): void => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    const msg = data as BridgeInvoke;
    if (msg.type !== MSG_INVOKE || !msg.id || !msg.tool) return;
    void this.handleInvoke(msg.id, msg.tool, msg.args ?? {}, (payload) => {
      event.source?.postMessage(payload, { targetOrigin: event.origin === 'null' ? '*' : event.origin });
    });
  };

  private tryConnectWs(): void {
    try {
      this.ws = new WebSocket(BRIDGE_WS_URL);
      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as BridgeInvoke;
          if (msg.type === MSG_INVOKE) {
            void this.handleInvoke(msg.id, msg.tool, msg.args ?? {}, (payload) => {
              this.ws?.send(JSON.stringify(payload));
            });
          }
        } catch {
          // ignore malformed
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
      };
    } catch {
      // bridge server not running
    }
  }

  private async handleInvoke(
    id: string,
    tool: string,
    args: Record<string, unknown>,
    reply: (payload: unknown) => void,
  ): Promise<void> {
    const result = await this.invokeTool(tool, args);
    reply({ type: MSG_RESULT, id, ...result });
  }

  private async invokeTool(
    tool: string,
    args: Record<string, unknown>,
  ): Promise<{ ok: boolean; text: string; isError?: boolean }> {
    const rationale = String(args['rationale'] ?? 'Invocado vía bridge externo');
    try {
      let res;
      switch (tool) {
        case 'create_component':
          res = this.edit.createComponent(String(args['kind']), String(args['parentId'] || '') || undefined, rationale);
          break;
        case 'read_tree':
          res = this.edit.readTree(rationale);
          break;
        case 'delete_component':
          res = await this.edit.deleteComponent(String(args['id']), rationale);
          break;
        case 'run_playbook':
          res = this.edit.runPlaybook(String(args['playbookId']), rationale);
          break;
        case 'explain_selection':
          res = this.edit.explainSelection(String(args['id'] || '') || undefined, rationale);
          break;
        case 'suggest_next':
          res = this.edit.suggestNext(String(args['id'] || '') || undefined, rationale);
          break;
        default:
          return { ok: false, text: `Tool no soportada en bridge: ${tool}`, isError: true };
      }
      return { ok: !res.isError, text: res.text, isError: res.isError };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error en bridge';
      return { ok: false, text: msg, isError: true };
    }
  }
}
