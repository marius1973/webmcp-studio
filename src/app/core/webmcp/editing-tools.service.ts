import { Injectable, inject } from '@angular/core';
import { ComponentTreeStore } from '../state/component-tree.store';
import { ComponentKind } from '../state/component-tree.types';
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

const KINDS: ComponentKind[] = ['container', 'card', 'button', 'text', 'input'];

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

  createComponent(kind: string, parentId?: string, rationale = ''): ToolExecuteResult {
    const k = this.asKind(kind);
    if (!k) return this.emit('create_component', { kind, parentId }, `kind inválido: ${kind}`, 'error', rationale, []);
    const parent = parentId && this.tree.node(parentId) ? parentId : this.tree.rootId();
    this.bus.dispatch(createComponent(parent, k), 'agent');
    const newId = this.tree.selectedId() ?? '';
    return this.emit('create_component', { kind: k, parentId: parent }, `Creado ${k} (${newId}) en ${parent}`, 'ok', rationale, [newId]);
  }

  updateComponent(id: string, label?: string, props?: Record<string, string>, rationale = ''): ToolExecuteResult {
    const node = this.tree.node(id);
    if (!node) return this.emit('update_component', { id }, `No existe el nodo ${id}`, 'error', rationale, []);
    this.bus.dispatch(updateNode(id, label ?? node.label, props ?? {}), 'agent');
    return this.emit('update_component', { id, label, props }, `Actualizado ${id}`, 'ok', rationale, [id]);
  }

  deleteComponent(id: string, rationale = ''): ToolExecuteResult {
    const node = this.tree.node(id);
    if (!node) return this.emit('delete_component', { id }, `No existe el nodo ${id}`, 'error', rationale, []);
    if (node.parentId === null) return this.emit('delete_component', { id }, 'No se puede borrar la raíz', 'error', rationale, []);
    this.bus.dispatch(deleteComponent(id), 'agent');
    return this.emit('delete_component', { id }, `Borrado ${id}`, 'ok', rationale, [id]);
  }

  moveComponent(id: string, newParentId: string, index: number, rationale = ''): ToolExecuteResult {
    if (!this.tree.node(id) || !this.tree.node(newParentId)) {
      return this.emit('move_component', { id, newParentId, index }, 'Nodo o destino inexistente', 'error', rationale, []);
    }
    if (id === newParentId || this.tree.isAncestor(id, newParentId)) {
      return this.emit('move_component', { id, newParentId, index }, 'Movimiento inválido (ciclo)', 'error', rationale, []);
    }
    this.bus.dispatch(moveComponent(id, newParentId, index), 'agent');
    return this.emit('move_component', { id, newParentId, index }, `Movido ${id} → ${newParentId}[${index}]`, 'ok', rationale, [id, newParentId]);
  }

  readTree(rationale = ''): ToolExecuteResult {
    const text = JSON.stringify(serializeTree(this.tree.state()));
    return this.emit('read_tree', {}, text, 'ok', rationale, []);
  }

  listTypes(rationale = ''): ToolExecuteResult {
    return this.emit('list_component_types', {}, KINDS.join(', '), 'ok', rationale, []);
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

  private asKind(kind: string): ComponentKind | null {
    return (KINDS as string[]).includes(kind) ? (kind as ComponentKind) : null;
  }

  private emit(
    toolName: string,
    args: unknown,
    result: string,
    status: 'ok' | 'error',
    rationale: string,
    affected: string[],
    origin: ToolOrigin = 'agent',
  ): ToolExecuteResult {
    const at = Date.now();
    const isError = status === 'error';
    this.log.record({ toolName, args, result, status, origin, durationMs: 0, at });
    this.observer.narrate({
      action: toolName,
      what: result,
      rationale: rationale.trim() || 'El agente no explicó el motivo.',
      origin,
      affected: affected.filter(Boolean),
      status,
      at,
    });
    return { text: result, isError };
  }
}
