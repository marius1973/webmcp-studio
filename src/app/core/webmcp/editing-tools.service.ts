import { Injectable, inject } from '@angular/core';
import { ComponentTreeStore } from '../state/component-tree.store';
import { ComponentKind, COMPONENT_KINDS } from '../state/component-tree.types';
import { AgentLogStore } from '../state/agent-log.store';
import { ObserverStore } from '../state/observer.store';
import { ToolExecuteResult, ToolOrigin } from './webmcp.types';
import { CommandBus } from '../commands/command-bus';
import {
  createComponent,
  deleteComponent,
  moveComponent,
  updateNode,
} from '../commands/tree-commands';
import { serializeTree } from './tree-serialize';
import { ProjectExportService } from '../export/project-export.service';
import { generateAngularProject, summarizeExport } from '../export/angular-project-generator';
import { ProjectStore } from '../state/project.store';
import { validateTreeState } from './tree-validate';
import { playbookById, PLAYBOOKS } from '../playbooks/playbooks';
import { stepsToCommands } from '../playbooks/playbook-executor';
import { explainSelection, formatSuggestions, suggestNextSteps } from './tree-advisor';
import { AgentConsentStore } from '../state/agent-consent.store';
import { treeSchemaAsJson } from '../export/tree-schema';
import { TelemetryStore } from '../state/telemetry.store';
import { downloadBlob } from '../export/project-zip';
import type { AgentLane } from '../agents/agent-lane.types';
import { LaneScopedEditingTools } from './lane-scoped-editing.tools';

/**
 * Lógica detrás de las tools de edición.
 * Cada método despacha un Command (origen `agent`), loguea la tool call y
 * NARRA un paso del Modo Observador (qué + por qué). El `rationale` lo aporta
 * el agente vía el input `rationale` de cada tool.
 */
@Injectable({ providedIn: 'root' })
export class EditingToolsService {
  private readonly bus = inject(CommandBus);
  private readonly tree = inject(ComponentTreeStore);
  private readonly log = inject(AgentLogStore);
  private readonly observer = inject(ObserverStore);
  private readonly exporter = inject(ProjectExportService);
  private readonly projects = inject(ProjectStore);
  private readonly consent = inject(AgentConsentStore);
  private readonly telemetry = inject(TelemetryStore);

  /** Etiqueta cada despacho con un carril multi-agente (A|B). */
  withLane(lane: AgentLane): LaneScopedEditingTools {
    return new LaneScopedEditingTools(this, lane);
  }

  createComponent(kind: string, parentId?: string, rationale = '', lane?: AgentLane): ToolExecuteResult {
    const k = this.asKind(kind);
    if (!k) return this.emit('create_component', { kind, parentId }, `kind inválido: ${kind}`, 'error', rationale, [], lane);
    const parent = parentId && this.tree.node(parentId) ? parentId : this.tree.rootId();
    this.bus.dispatch(createComponent(parent, k), 'agent', { lane });
    const newId = this.tree.selectedId() ?? '';
    return this.emit('create_component', { kind: k, parentId: parent }, `Creado ${k} (${newId}) en ${parent}`, 'ok', rationale, [newId], lane);
  }

  updateComponent(
    id: string,
    label?: string,
    props?: Record<string, string>,
    rationale = '',
    lane?: AgentLane,
  ): ToolExecuteResult {
    const node = this.tree.node(id);
    if (!node) return this.emit('update_component', { id }, `No existe el nodo ${id}`, 'error', rationale, [], lane);
    this.bus.dispatch(updateNode(id, label ?? node.label, props ?? {}), 'agent', { lane });
    return this.emit('update_component', { id, label, props }, `Actualizado ${id}`, 'ok', rationale, [id], lane);
  }

  async deleteComponent(id: string, rationale = '', lane?: AgentLane): Promise<ToolExecuteResult> {
    const node = this.tree.node(id);
    if (!node) return this.emit('delete_component', { id }, `No existe el nodo ${id}`, 'error', rationale, [], lane);
    if (node.parentId === null) return this.emit('delete_component', { id }, 'No se puede borrar la raíz', 'error', rationale, [], lane);
    const ok = await this.consent.request(
      'delete_component',
      `Borrar ${node.kind} "${node.label}" (${id}) y su subárbol`,
      { id },
    );
    if (!ok) return this.emit('delete_component', { id }, 'Rechazado por el usuario', 'error', rationale, [], lane);
    this.bus.dispatch(deleteComponent(id), 'agent', { lane });
    return this.emit('delete_component', { id }, `Borrado ${id}`, 'ok', rationale, [id], lane);
  }

  moveComponent(
    id: string,
    newParentId: string,
    index: number,
    rationale = '',
    lane?: AgentLane,
  ): ToolExecuteResult {
    if (!this.tree.node(id) || !this.tree.node(newParentId)) {
      return this.emit('move_component', { id, newParentId, index }, 'Nodo o destino inexistente', 'error', rationale, [], lane);
    }
    if (id === newParentId || this.tree.isAncestor(id, newParentId)) {
      return this.emit('move_component', { id, newParentId, index }, 'Movimiento inválido (ciclo)', 'error', rationale, [], lane);
    }
    this.bus.dispatch(moveComponent(id, newParentId, index), 'agent', { lane });
    return this.emit('move_component', { id, newParentId, index }, `Movido ${id} → ${newParentId}[${index}]`, 'ok', rationale, [id, newParentId], lane);
  }

  readTree(rationale = '', lane?: AgentLane): ToolExecuteResult {
    const text = JSON.stringify(serializeTree(this.tree.state()));
    return this.emit('read_tree', {}, text, 'ok', rationale, [], lane);
  }

  listTypes(rationale = ''): ToolExecuteResult {
    return this.emit('list_component_types', {}, COMPONENT_KINDS.join(', '), 'ok', rationale, []);
  }

  undo(rationale = ''): ToolExecuteResult {
    if (!this.bus.canUndo()) return this.emit('undo', {}, 'No hay acciones para deshacer', 'error', rationale, []);
    this.bus.undo({ skipObserver: true });
    return this.emit('undo', {}, 'undo aplicado', 'ok', rationale, []);
  }

  redo(rationale = ''): ToolExecuteResult {
    if (!this.bus.canRedo()) return this.emit('redo', {}, 'No hay acciones para rehacer', 'error', rationale, []);
    this.bus.redo({ skipObserver: true });
    return this.emit('redo', {}, 'redo aplicado', 'ok', rationale, []);
  }

  async exportProjectCode(projectName?: string, download = true, rationale = ''): Promise<ToolExecuteResult> {
    const args = { projectName, download };
    try {
      if (download) {
        const result = await this.exporter.exportAsZip(projectName);
        const text = `${result.summary}. ZIP descargado: ${result.slug}.zip`;
        return this.emit('export_project_code', args, text, 'ok', rationale, []);
      }
      const name = (projectName?.trim() || this.projects.currentName() || 'studio-export').trim();
      const files = generateAngularProject(this.tree.state(), name);
      const text = summarizeExport(files, name);
      return this.emit('export_project_code', args, text, 'ok', rationale, []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      return this.emit('export_project_code', args, msg, 'error', rationale, []);
    }
  }

  listPlaybooks(rationale = ''): ToolExecuteResult {
    const text = PLAYBOOKS.map((p) => `${p.id}: ${p.label}`).join('\n');
    return this.emit('list_playbooks', {}, text, 'ok', rationale, []);
  }

  runPlaybook(playbookId: string, rationale = ''): ToolExecuteResult {
    const pb = playbookById(playbookId);
    if (!pb) {
      return this.emit('run_playbook', { playbookId }, `Playbook desconocido: ${playbookId}`, 'error', rationale, []);
    }
    try {
      const commands = stepsToCommands(pb.steps, this.tree);
      const why = rationale.trim() || pb.rationale;
      this.bus.dispatchBatch(commands, 'agent', {
        historyLabel: pb.label,
        action: 'run_playbook',
        what: `Playbook: ${pb.label}`,
        rationale: why,
      });
      return this.emit(
        'run_playbook',
        { playbookId },
        `Playbook "${pb.label}" ejecutado (${commands.length} pasos)`,
        'ok',
        why,
        [],
        undefined,
        true,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al ejecutar playbook';
      return this.emit('run_playbook', { playbookId }, msg, 'error', rationale, []);
    }
  }

  explainSelection(nodeId?: string, rationale = ''): ToolExecuteResult {
    const id = nodeId && this.tree.node(nodeId) ? nodeId : this.tree.selectedId();
    const info = explainSelection(this.tree.state(), id);
    if (!info) return this.emit('explain_selection', { nodeId: id }, 'Nodo no encontrado', 'error', rationale, []);
    const text = `${info.summary}\nparent: ${info.parentId ?? '—'}\nhijos: ${info.childCount}`;
    return this.emit('explain_selection', { nodeId: info.id }, text, 'ok', rationale, [info.id]);
  }

  suggestNext(nodeId?: string, rationale = ''): ToolExecuteResult {
    const id = nodeId && this.tree.node(nodeId) ? nodeId : this.tree.selectedId();
    const suggestions = suggestNextSteps(this.tree.state(), id);
    const text = formatSuggestions(suggestions);
    return this.emit('suggest_next', { nodeId: id }, text, 'ok', rationale, id ? [id] : []);
  }

  async applyPatch(patch: unknown, rationale = ''): Promise<ToolExecuteResult> {
    const validated = validateTreeState(patch);
    if (!validated.ok) {
      return this.emit('apply_patch', {}, validated.error, 'error', rationale, []);
    }
    const state = validated.state;
    const ok = await this.consent.request(
      'apply_patch',
      `Reemplazar el árbol completo (${Object.keys(state.nodes).length} nodos)`,
      { nodeCount: Object.keys(state.nodes).length },
    );
    if (!ok) return this.emit('apply_patch', {}, 'Rechazado por el usuario', 'error', rationale, []);
    try {
      this.bus.dispatchBatch(
        [
          {
            type: 'update',
            label: 'Aplicar parche de árbol',
            run: (t) => {
              t.restore(state);
              t.select(state.rootId);
            },
          },
        ],
        'agent',
        {
          historyLabel: 'apply_patch',
          action: 'apply_patch',
          what: `Árbol reemplazado (${Object.keys(state.nodes).length} nodos)`,
          rationale: rationale.trim() || 'El agente aplicó un parche completo del árbol.',
        },
      );
      return this.emit(
        'apply_patch',
        {},
        `Parche aplicado (${Object.keys(state.nodes).length} nodos)`,
        'ok',
        rationale,
        [state.rootId],
        undefined,
        true,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al aplicar parche';
      return this.emit('apply_patch', {}, msg, 'error', rationale, []);
    }
  }

  exportSchema(download = false, rationale = ''): ToolExecuteResult {
    const text = treeSchemaAsJson(this.tree.state());
    if (download) {
      const blob = new Blob([text], { type: 'application/json' });
      downloadBlob(blob, 'tree-schema.json');
      this.telemetry.record('export', 'export_schema');
    }
    return this.emit('export_schema', { download }, text, 'ok', rationale, []);
  }

  private asKind(kind: string): ComponentKind | null {
    return (COMPONENT_KINDS as string[]).includes(kind) ? (kind as ComponentKind) : null;
  }

  private emit(
    toolName: string,
    args: unknown,
    result: string,
    status: 'ok' | 'error',
    rationale: string,
    affected: string[],
    lane?: AgentLane,
    skipNarrate = false,
    origin: ToolOrigin = 'agent',
  ): ToolExecuteResult {
    const at = Date.now();
    const isError = status === 'error';
    const meta = this.bus.lastMeta();
    const conflict = meta?.conflict ?? false;
    const conflictNote = conflict ? ' [last-write-wins: conflicto con otro carril]' : '';
    this.log.record({ toolName, args, result, status, origin, durationMs: 0, at, lane });
    if (!isError && origin === 'agent') {
      const t = toolName === 'run_playbook' ? 'playbook' : 'tool_invoke';
      this.telemetry.record(t, toolName);
    }
    if (!skipNarrate) {
      this.observer.narrate({
        action: toolName,
        what: result + conflictNote,
        rationale: rationale.trim() || 'El agente no explicó el motivo.',
        origin,
        affected: affected.filter(Boolean),
        status,
        at,
        lane,
        conflict,
      });
    }
    return { text: result, isError };
  }
}
