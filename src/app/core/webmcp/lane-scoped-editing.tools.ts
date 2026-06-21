import type { AgentLane } from '../agents/agent-lane.types';
import type { EditingToolsService } from './editing-tools.service';
import type { ToolExecuteResult } from './webmcp.types';

/**
 * Vista de EditingToolsService etiquetada con un carril (A|B).
 * Cada despacho pasa `lane` al CommandBus y al Observador.
 */
export class LaneScopedEditingTools {
  constructor(
    private readonly svc: EditingToolsService,
    readonly lane: AgentLane,
  ) {}

  createComponent(kind: string, parentId?: string, rationale = ''): ToolExecuteResult {
    return this.svc.createComponent(kind, parentId, rationale, this.lane);
  }

  updateComponent(
    id: string,
    label?: string,
    props?: Record<string, string>,
    rationale = '',
  ): ToolExecuteResult {
    return this.svc.updateComponent(id, label, props, rationale, this.lane);
  }

  deleteComponent(id: string, rationale = ''): Promise<ToolExecuteResult> {
    return this.svc.deleteComponent(id, rationale, this.lane);
  }

  moveComponent(id: string, newParentId: string, index: number, rationale = ''): ToolExecuteResult {
    return this.svc.moveComponent(id, newParentId, index, rationale, this.lane);
  }

  readTree(rationale = ''): ToolExecuteResult {
    return this.svc.readTree(rationale, this.lane);
  }
}
