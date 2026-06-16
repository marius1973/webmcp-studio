import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ComponentTreeStore, createInitialTreeState } from './component-tree.store';
import { TreeState } from './component-tree.types';
import { CommandBus } from '../commands/command-bus';
import { PersistenceError, PersistenceService, ProjectMeta } from '../persistence/persistence.service';
import { validateTreeState } from '../webmcp/tree-validate';
import { parseImportTree, previewImportJson, ImportPreview } from './project-import';
import { clearLastProjectId, persistLastProjectId, readLastProjectId } from './project-last';
import { DEFAULT_PROJECT_ID } from './project.constants';
import { resolveEntryProjectId } from './project-entry';

export type { ImportPreview } from './project-import';

function deriveName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Coordina los proyectos: lista, proyecto activo, alta/baja y autosave en IndexedDB.
 * Al activar un proyecto carga su árbol en el ComponentTreeStore y resetea el historial,
 * de modo que cada proyecto es independiente (y el undo no cruza proyectos).
 */
@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly tree = inject(ComponentTreeStore);
  private readonly bus = inject(CommandBus);
  private readonly persistence = inject(PersistenceService);

  private readonly _projects = signal<ProjectMeta[]>([]);
  readonly projects = this._projects.asReadonly();
  readonly currentId = signal<string | null>(null);
  readonly currentName = computed(() => {
    const id = this.currentId();
    return this._projects().find((p) => p.id === id)?.name ?? (id ? deriveName(id) : '—');
  });
  /** Proyecto para enlaces de vuelta al editor (activo, último usado o alpha). */
  readonly fallbackProjectId = computed(() => {
    const current = this.currentId();
    if (current) return current;
    const last = readLastProjectId();
    const ids = this._projects().map((p) => p.id);
    if (last && ids.includes(last)) return last;
    if (ids.includes(DEFAULT_PROJECT_ID)) return DEFAULT_PROJECT_ID;
    return ids[0] ?? DEFAULT_PROJECT_ID;
  });
  readonly status = signal<string>('');

  private loading = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.refresh();
    effect(() => {
      const state = this.tree.state();
      const id = this.currentId();
      if (!id || this.loading) return;
      untracked(() => this.scheduleSave(id, state));
    });
  }

  /** Resuelve el proyecto inicial: último usado o `alpha` (por defecto). */
  async resolveEntryProjectId(): Promise<string> {
    await this.refresh();
    return resolveEntryProjectId(
      this._projects().map((p) => p.id),
      readLastProjectId(),
    );
  }

  async refresh(): Promise<void> {
    try {
      this._projects.set(await this.persistence.list());
    } catch (e) {
      this.setError(e, 'listar proyectos');
    }
  }

  /** Activa un proyecto: lo carga (o lo crea si no existe) y resetea el historial. */
  async activate(id: string): Promise<void> {
    this.loading = true;
    try {
      const record = await this.persistence.get(id);
      if (record) {
        const validated = validateTreeState(record.tree);
        if (!validated.ok) throw new Error(`Árbol corrupto: ${validated.error}`);
        this.tree.restore(validated.state);
      } else {
        const fresh = createInitialTreeState();
        this.tree.restore(fresh);
        await this.persistence.save({ id, name: deriveName(id), tree: fresh, updatedAt: Date.now() });
      }
      this.bus.reset();
      this.tree.select('root');
      this.currentId.set(id);
      persistLastProjectId(id);
      await this.refresh();
      this.status.set(`Proyecto "${this.currentName()}" cargado`);
    } catch (e) {
      this.setError(e, 'cargar proyecto');
    } finally {
      this.loading = false;
    }
  }

  async createProject(name?: string): Promise<string> {
    const base = (name ?? 'proyecto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proyecto';
    const id = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      await this.persistence.save({ id, name: name ?? deriveName(id), tree: createInitialTreeState(), updatedAt: Date.now() });
      await this.refresh();
      this.status.set(`Proyecto "${name ?? deriveName(id)}" creado`);
      return id;
    } catch (e) {
      this.setError(e, 'crear proyecto');
      throw e;
    }
  }

  /** Borra un proyecto. Devuelve el id del siguiente proyecto a activar si se borró el actual. */
  async deleteProject(id: string): Promise<string | null> {
    try {
      await this.persistence.delete(id);
      const wasCurrent = this.currentId() === id;
      await this.refresh();
      if (wasCurrent) {
        this.currentId.set(null);
        this.bus.reset();
        clearLastProjectId();
        const next = this._projects()[0]?.id ?? null;
        this.status.set('Proyecto borrado');
        return next;
      }
      this.status.set('Proyecto borrado');
      return null;
    } catch (e) {
      this.setError(e, 'borrar proyecto');
      throw e;
    }
  }

  async renameProject(name: string): Promise<void> {
    const id = this.currentId();
    const trimmed = name.trim();
    if (!id) return;
    if (!trimmed) {
      this.status.set('El nombre no puede estar vacío');
      return;
    }
    try {
      const record = await this.persistence.get(id);
      if (!record) throw new Error('Proyecto no encontrado');
      await this.persistence.save({ ...record, name: trimmed, updatedAt: Date.now() });
      await this.refresh();
      this.status.set(`Proyecto renombrado a "${trimmed}"`);
    } catch (e) {
      this.setError(e, 'renombrar proyecto');
    }
  }

  async saveNow(): Promise<void> {
    const id = this.currentId();
    if (!id) return;
    try {
      await this.persistence.save({ id, name: this.currentName(), tree: this.tree.state(), updatedAt: Date.now() });
      await this.refresh();
    } catch (e) {
      this.setError(e, 'guardar proyecto');
      throw e;
    }
  }

  exportCurrent(): string {
    return JSON.stringify({ id: this.currentId(), name: this.currentName(), tree: this.tree.state() }, null, 2);
  }

  previewImport(text: string): ImportPreview {
    return previewImportJson(text);
  }

  async importJson(text: string): Promise<boolean> {
    const preview = this.previewImport(text);
    if (!preview.ok) {
      this.status.set(`Error al importar: ${preview.error}`);
      return false;
    }
    try {
      const parsed = parseImportTree(text);
      if (!parsed.ok) {
        this.status.set(`Error al importar: ${parsed.error}`);
        return false;
      }
      this.tree.restore(parsed.state);
      this.bus.reset();
      this.tree.select(parsed.state.rootId);
      await this.saveNow();
      this.status.set(`Proyecto importado (${preview.nodeCount} nodos)`);
      return true;
    } catch (e) {
      this.setError(e, 'importar proyecto');
      return false;
    }
  }

  private scheduleSave(id: string, state: TreeState): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      void this.persistence
        .save({ id, name: this.currentName(), tree: state, updatedAt: Date.now() })
        .then(() => this.refresh())
        .catch((e) => this.setError(e, 'guardar automáticamente'));
    }, 400);
  }

  private setError(e: unknown, action: string): void {
    const detail = e instanceof PersistenceError || e instanceof Error ? e.message : 'desconocido';
    this.status.set(`Error al ${action}: ${detail}`);
  }
}
