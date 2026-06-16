import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ComponentTree } from '../panels/component-tree/component-tree';
import { ToolPanel } from '../panels/tool-panel/tool-panel';
import { AgentConsole } from '../panels/agent-console/agent-console';
import { ProjectStore } from '../core/state/project.store';
import { DEFAULT_PROJECT_ID } from '../core/state/project.constants';
import { ProjectExportService } from '../core/export/project-export.service';
import { CommandBus } from '../core/commands/command-bus';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ComponentTree, ToolPanel, AgentConsole],
  template: `
    <header class="topbar">
      <span class="logo">▰ WebMCP Studio</span>

      <div class="project-bar">
        <label class="sr-label" for="proj">Proyecto</label>
        <select id="proj" aria-label="Proyecto activo" [value]="projects.currentId() ?? ''" (change)="switchProject($event)">
          @for (p of projects.projects(); track p.id) {
            <option [value]="p.id">{{ p.name }}</option>
          }
          @empty {
            <option value="" disabled>Sin proyectos</option>
          }
        </select>
        <button (click)="newProject()" aria-label="Nuevo proyecto" title="Nuevo proyecto">＋ Nuevo</button>
        <button (click)="renameProject()" [disabled]="!projects.currentId()" aria-label="Renombrar proyecto" title="Renombrar">✎ Renombrar</button>
        <button class="danger" (click)="deleteProject()" [disabled]="!projects.currentId()" aria-label="Borrar proyecto" title="Borrar">🗑 Borrar</button>
        <button (click)="exportProject()" aria-label="Exportar proyecto a JSON" title="Exportar JSON">⤓ JSON</button>
        <button (click)="exportAngularZip()" aria-label="Exportar como proyecto Angular ZIP" title="Proyecto Angular (npm install && npm start)">⤓ Angular ZIP</button>
        <label class="import" title="Importar JSON">
          ⤒ Import
          <input type="file" accept="application/json,.json" (change)="importProject($event)" aria-label="Importar proyecto desde JSON" />
        </label>
      </div>

      <nav class="nav">
        <a routerLink="/docs" routerLinkActive="active">Docs</a>
      </nav>
      <span class="status" role="status" aria-live="polite">{{ projects.status() }}</span>
    </header>

    <div class="layout">
      <aside class="pane tree"><app-component-tree /></aside>
      <main class="pane canvas"><router-outlet /></main>
      <aside class="pane tools"><app-tool-panel /></aside>
      <section class="pane console"><app-agent-console /></section>
    </div>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100vh; }
    .topbar { display:flex; align-items:center; gap:.8rem; padding:.55rem 1rem; background:var(--surface-1); border-bottom:1px solid var(--border); flex-wrap:wrap; }
    .logo { font-weight:700; }
    .project-bar { display:flex; align-items:center; gap:.35rem; }
    .sr-label { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
    select { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.25rem .5rem; font-size:.78rem; }
    .topbar button, .import { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.25rem .55rem; font-size:.74rem; cursor:pointer; }
    .topbar button:hover, .import:hover { border-color:var(--accent); }
    .topbar button.danger:hover { border-color:#e55; color:#f88; }
    .topbar button:disabled { opacity:.45; cursor:not-allowed; }
    .import input { display:none; }
    .nav a { font-size:.78rem; color:var(--muted); text-decoration:none; padding:.2rem .55rem; border-radius:6px; }
    .nav a:hover { color:var(--fg); background:var(--surface-2); }
    .nav a.active { color:#fff; background:var(--accent); }
    .status { font-size:.7rem; color:var(--muted); margin-left:auto; max-width:18rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .layout {
      flex:1; min-height:0; display:grid; gap:1px; background:var(--border);
      grid-template-columns: 260px 1fr 320px;
      grid-template-rows: 1fr 240px;
      grid-template-areas:
        "tree canvas tools"
        "console console console";
    }
    .pane { background:var(--surface-1); padding:.8rem; overflow:auto; min-height:0; }
    .tree { grid-area:tree; }
    .canvas { grid-area:canvas; background:var(--surface-0); }
    .tools { grid-area:tools; }
    .console { grid-area:console; }

    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(140px, 22vh) 1fr minmax(160px, 24vh) minmax(180px, 28vh);
        grid-template-areas:
          "tree"
          "canvas"
          "tools"
          "console";
      }
      .topbar { gap:.5rem; }
      .status { max-width:100%; margin-left:0; flex-basis:100%; }
    }

    @media (max-width: 640px) {
      .project-bar { flex-wrap:wrap; }
      .layout {
        grid-template-rows: minmax(120px, 20vh) 1fr minmax(140px, 22vh) minmax(160px, 26vh);
      }
    }
  `],
})
export class AppShell {
  protected readonly projects = inject(ProjectStore);
  private readonly bus = inject(CommandBus);
  private readonly router = inject(Router);
  private readonly exporter = inject(ProjectExportService);

  protected switchProject(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id) void this.router.navigate(['/project', id]);
  }

  protected async newProject(): Promise<void> {
    const id = await this.projects.createProject();
    void this.router.navigate(['/project', id]);
  }

  protected exportProject(): void {
    const text = this.projects.exportCurrent();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.projects.currentName() || 'proyecto'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected async exportAngularZip(): Promise<void> {
    try {
      await this.exporter.exportAsZip();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'desconocido';
      this.projects.status.set(`Error al exportar Angular: ${msg}`);
    }
  }

  protected renameProject(): void {
    const current = this.projects.currentName();
    const name = prompt('Nombre del proyecto:', current);
    if (name === null) return;
    void this.projects.renameProject(name);
  }

  protected async deleteProject(): Promise<void> {
    const id = this.projects.currentId();
    if (!id) return;
    const name = this.projects.currentName();
    if (!confirm(`¿Borrar el proyecto "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const nextId = await this.projects.deleteProject(id);
      if (nextId) {
        void this.router.navigate(['/project', nextId]);
      } else if (!this.projects.projects().length) {
        void this.router.navigate(['/project', DEFAULT_PROJECT_ID]);
      }
    } catch {
      // El error ya quedó en projects.status()
    }
  }

  protected importProject(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const preview = this.projects.previewImport(text);
      if (!preview.ok) {
        this.projects.status.set(`Error al importar: ${preview.error}`);
        return;
      }
      const current = this.projects.currentName();
      const msg = `¿Importar "${preview.name}" (${preview.nodeCount} nodos)?\nSe reemplazará el contenido del proyecto activo "${current}".`;
      if (!confirm(msg)) return;
      void this.projects.importJson(text);
    });
    input.value = '';
  }

  /** Atajos: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z o Ctrl+Y = redo. */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.isEditableTarget(event.target)) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.bus.undo();
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      this.bus.redo();
    }
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return !!target.closest('[contenteditable="true"]');
  }
}
