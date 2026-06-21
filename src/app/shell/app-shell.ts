import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ComponentTree } from '../panels/component-tree/component-tree';
import { ToolPanel } from '../panels/tool-panel/tool-panel';
import { AgentConsole } from '../panels/agent-console/agent-console';
import { ProjectStore } from '../core/state/project.store';
import { DEFAULT_PROJECT_ID } from '../core/state/project.constants';
import { ProjectExportService } from '../core/export/project-export.service';
import { CommandBus } from '../core/commands/command-bus';
import { ComponentTreeStore } from '../core/state/component-tree.store';
import { buildShareUrl } from '../core/state/project-share';
import { AgentConsentStore } from '../core/state/agent-consent.store';
import { PROJECT_TEMPLATES } from '../core/state/project-templates';
import { TelemetryStore } from '../core/state/telemetry.store';
import { BRAND_LOGO, brandLogoSrcset } from '../core/brand/brand-logo';

type ShellMenu = 'project' | 'export' | null;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ComponentTree, ToolPanel, AgentConsole],
  template: `
    <header class="topbar">
      <a class="logo" routerLink="/" title="WebMCP Studio">WebMCP Studio</a>

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

        <div class="menu-wrap">
          <button
            type="button"
            class="menu-trigger"
            (click)="toggleMenu('project', $event)"
            [attr.aria-expanded]="openMenu() === 'project'"
            aria-haspopup="menu"
          >
            Proyecto ▾
          </button>
          @if (openMenu() === 'project') {
            <div class="menu" role="menu" (click)="$event.stopPropagation()">
              <button type="button" role="menuitem" (click)="openNewProjectModal()">＋ Nuevo…</button>
              <button type="button" role="menuitem" (click)="openRenameModal()" [disabled]="!projects.currentId()">✎ Renombrar…</button>
              <button type="button" role="menuitem" (click)="openAboutModal()">ℹ Acerca de…</button>
              <button type="button" role="menuitem" class="danger-text" (click)="deleteProject()" [disabled]="!projects.currentId()">🗑 Borrar</button>
            </div>
          }
        </div>

        <div class="menu-wrap">
          <button
            type="button"
            class="menu-trigger"
            (click)="toggleMenu('export', $event)"
            [attr.aria-expanded]="openMenu() === 'export'"
            aria-haspopup="menu"
          >
            Exportar ▾
          </button>
          @if (openMenu() === 'export') {
            <div class="menu" role="menu" (click)="$event.stopPropagation()">
              <button type="button" role="menuitem" (click)="exportProject()">⤓ JSON</button>
              <button type="button" role="menuitem" (click)="exportAngularZip()">⤓ Angular ZIP</button>
              <label class="menu-import" role="menuitem">
                ⤒ Importar JSON
                <input type="file" accept="application/json,.json" (change)="importProject($event)" aria-label="Importar proyecto desde JSON" />
              </label>
            </div>
          }
        </div>

        <button class="share" (click)="shareProject()" [disabled]="!projects.currentId()" aria-label="Compartir enlace del árbol" title="Copiar enlace con el árbol actual">🔗 Compartir</button>
      </div>

      <nav class="nav">
        <a routerLink="/docs" routerLinkActive="active">Docs</a>
        <label class="telemetry" title="Telemetría anónima local (sin red)">
          <input type="checkbox" [checked]="telemetry.enabled()" (change)="telemetry.toggle()" />
          Stats
        </label>
      </nav>
      <span class="status" role="status" aria-live="polite">{{ projects.status() }}</span>
    </header>

    <div class="layout">
      <aside class="pane tree"><app-component-tree /></aside>
      <main class="pane canvas"><router-outlet /></main>
      <aside class="pane tools"><app-tool-panel /></aside>
      <section class="pane console"><app-agent-console /></section>
    </div>

    @if (newProjectOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-project-title" (click)="closeNewProjectModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h2 id="new-project-title">Nuevo proyecto</h2>
          <label class="field" for="tpl">Plantilla</label>
          <select id="tpl" [value]="newTemplateId()" (change)="onTemplateChange($event)">
            @for (t of templates; track t.id) {
              <option [value]="t.id">{{ t.label }} — {{ t.description }}</option>
            }
          </select>
          <label class="field" for="new-name">Nombre (opcional)</label>
          <input id="new-name" type="text" [value]="newProjectName()" (input)="onNewNameInput($event)" placeholder="Mi proyecto" />
          <div class="modal-actions">
            <button type="button" class="primary" (click)="confirmNewProject()">Crear proyecto</button>
            <button type="button" class="ghost" (click)="closeNewProjectModal()">Cancelar</button>
          </div>
        </div>
      </div>
    }

    @if (renameOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rename-title" (click)="closeRenameModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h2 id="rename-title">Renombrar proyecto</h2>
          <label class="field" for="rename-name">Nombre</label>
          <input id="rename-name" type="text" [value]="renameName()" (input)="onRenameInput($event)" />
          <div class="modal-actions">
            <button type="button" class="primary" (click)="confirmRename()">Guardar</button>
            <button type="button" class="ghost" (click)="closeRenameModal()">Cancelar</button>
          </div>
        </div>
      </div>
    }

    @if (aboutOpen()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="about-title" (click)="closeAboutModal()">
        <div class="modal-card about-card" (click)="$event.stopPropagation()">
          <img
            class="about-logo"
            [src]="brand.src"
            [attr.srcset]="brandSrcset"
            alt="WebMCP Studio"
            [width]="brand.about"
            [height]="brand.about"
            decoding="async"
          />
          <h2 id="about-title">WebMCP Studio</h2>
          <p class="about-tagline">IDE en el navegador donde agentes de IA editan estructura Angular con tools tipadas, undo/redo y export real.</p>
          <div class="modal-actions">
            <a class="primary link-btn" routerLink="/docs" (click)="closeAboutModal()">Ver documentación</a>
            <button type="button" class="ghost" (click)="closeAboutModal()">Cerrar</button>
          </div>
        </div>
      </div>
    }

    @if (consent.pending(); as req) {
      <div class="consent-backdrop" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <div class="consent-card">
          <h2 id="consent-title">El agente quiere ejecutar <code>{{ req.toolName }}</code></h2>
          <p>{{ req.summary }}</p>
          <div class="consent-actions">
            <button class="primary" (click)="consent.approve()">Permitir</button>
            <button class="ghost" (click)="consent.deny()">Rechazar</button>
          </div>
          <label class="consent-opt">
            <input type="checkbox" [checked]="consent.requireConsent()" (change)="consent.toggleRequire()" />
            Pedir confirmación en acciones destructivas
          </label>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100vh; }
    .topbar { display:flex; align-items:center; gap:.8rem; padding:.55rem 1rem; background:var(--surface-1); border-bottom:1px solid var(--border); flex-wrap:wrap; }
    .logo { flex-shrink:0; text-decoration:none; color:inherit; font-weight:700; font-size:.9rem; }
    .project-bar { display:flex; align-items:center; gap:.35rem; flex-wrap:wrap; }
    .sr-label { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
    select { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.25rem .5rem; font-size:.78rem; }
    .menu-trigger, .share { background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.25rem .55rem; font-size:.74rem; cursor:pointer; }
    .menu-trigger:hover { border-color:var(--accent); }
    .share { background:var(--accent); color:#fff; border-color:var(--accent); font-weight:600; }
    .share:disabled { opacity:.45; cursor:not-allowed; }
    .menu-wrap { position:relative; }
    .menu { position:absolute; top:calc(100% + .25rem); left:0; z-index:50; min-width:11rem; background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:.25rem; box-shadow:0 8px 24px rgba(0,0,0,.35); }
    .menu button, .menu-import { display:block; width:100%; text-align:left; background:transparent; border:0; color:var(--fg); border-radius:6px; padding:.35rem .5rem; font-size:.74rem; cursor:pointer; }
    .menu button:hover, .menu-import:hover { background:var(--surface-1); }
    .menu button:disabled { opacity:.45; cursor:not-allowed; }
    .menu button.danger-text { color:#f88; }
    .menu-import input { display:none; }
    .nav a { font-size:.78rem; color:var(--muted); text-decoration:none; padding:.2rem .55rem; border-radius:6px; }
    .nav a:hover { color:var(--fg); background:var(--surface-2); }
    .nav a.active { color:#fff; background:var(--accent); }
    .telemetry { font-size:.7rem; color:var(--muted); display:flex; align-items:center; gap:.25rem; margin-left:.5rem; cursor:pointer; }
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

    .modal-backdrop, .consent-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal-card, .consent-card {
      background:var(--surface-1); border:1px solid var(--border); border-radius:12px; padding:1.2rem; width:min(22rem, 92vw); box-shadow:0 8px 32px rgba(0,0,0,.4);
    }
    .modal-card h2, .consent-card h2 { margin:0 0 .5rem; font-size:.95rem; }
    .field { display:block; font-size:.72rem; color:var(--muted); margin:.6rem 0 .2rem; }
    .modal-card select, .modal-card input { width:100%; background:var(--surface-2); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:.35rem .5rem; font-size:.82rem; }
    .modal-actions, .consent-actions { display:flex; gap:.5rem; margin-top:.9rem; }
    .primary { background:var(--accent); color:#fff; border:0; border-radius:6px; padding:.35rem .8rem; cursor:pointer; font-size:.8rem; }
    .ghost { background:transparent; border:1px solid var(--border); color:var(--fg); border-radius:6px; padding:.35rem .8rem; cursor:pointer; font-size:.8rem; }
    .consent-card code { color:var(--accent); }
    .consent-opt { font-size:.72rem; color:var(--muted); display:flex; gap:.35rem; align-items:center; margin-top:.6rem; }
    .about-card { text-align:center; max-width:22rem; }
    .about-logo {
      display:block; margin:0 auto .75rem;
      width:10rem; height:10rem;
      object-fit:contain;
    }
    .about-tagline { font-size:.82rem; color:var(--muted); line-height:1.45; margin:0; }
    .link-btn { display:inline-block; text-decoration:none; text-align:center; }
  `],
})
export class AppShell {
  protected readonly projects = inject(ProjectStore);
  protected readonly consent = inject(AgentConsentStore);
  protected readonly telemetry = inject(TelemetryStore);
  protected readonly templates = PROJECT_TEMPLATES;
  private readonly bus = inject(CommandBus);
  private readonly tree = inject(ComponentTreeStore);
  private readonly router = inject(Router);
  private readonly exporter = inject(ProjectExportService);

  protected readonly openMenu = signal<ShellMenu>(null);
  protected readonly newProjectOpen = signal(false);
  protected readonly newTemplateId = signal('blank');
  protected readonly newProjectName = signal('');
  protected readonly renameOpen = signal(false);
  protected readonly renameName = signal('');
  protected readonly aboutOpen = signal(false);
  protected readonly brand = BRAND_LOGO;
  protected readonly brandSrcset = brandLogoSrcset();

  @HostListener('document:click')
  protected closeMenus(): void {
    this.openMenu.set(null);
  }

  protected toggleMenu(menu: ShellMenu, event: Event): void {
    event.stopPropagation();
    this.openMenu.update((current) => (current === menu ? null : menu));
  }

  protected switchProject(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id) void this.router.navigate(['/project', id]);
  }

  protected openNewProjectModal(): void {
    this.openMenu.set(null);
    this.newTemplateId.set('blank');
    this.newProjectName.set('');
    this.newProjectOpen.set(true);
  }

  protected closeNewProjectModal(): void {
    this.newProjectOpen.set(false);
  }

  protected onTemplateChange(event: Event): void {
    this.newTemplateId.set((event.target as HTMLSelectElement).value);
  }

  protected onNewNameInput(event: Event): void {
    this.newProjectName.set((event.target as HTMLInputElement).value);
  }

  protected async confirmNewProject(): Promise<void> {
    const id = await this.projects.createProject(
      this.newProjectName().trim() || undefined,
      this.newTemplateId(),
    );
    this.newProjectOpen.set(false);
    void this.router.navigate(['/project', id]);
  }

  protected openRenameModal(): void {
    this.openMenu.set(null);
    this.renameName.set(this.projects.currentName());
    this.renameOpen.set(true);
  }

  protected closeRenameModal(): void {
    this.renameOpen.set(false);
  }

  protected openAboutModal(): void {
    this.openMenu.set(null);
    this.aboutOpen.set(true);
  }

  protected closeAboutModal(): void {
    this.aboutOpen.set(false);
  }

  protected onRenameInput(event: Event): void {
    this.renameName.set((event.target as HTMLInputElement).value);
  }

  protected confirmRename(): void {
    void this.projects.renameProject(this.renameName());
    this.renameOpen.set(false);
  }

  protected exportProject(): void {
    this.openMenu.set(null);
    const text = this.projects.exportCurrent();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.projects.currentName() || 'proyecto'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.telemetry.record('export', 'json');
  }

  protected async exportAngularZip(): Promise<void> {
    this.openMenu.set(null);
    try {
      await this.exporter.exportAsZip();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'desconocido';
      this.projects.status.set(`Error al exportar Angular: ${msg}`);
    }
  }

  protected shareProject(): void {
    const id = this.projects.currentId();
    if (!id) return;
    const url = buildShareUrl(this.tree.state(), id);
    void navigator.clipboard.writeText(url).then(
      () => this.projects.status.set('Enlace copiado al portapapeles'),
      () => {
        this.projects.status.set('Copia el enlace manualmente');
        prompt('Enlace para compartir:', url);
      },
    );
  }

  protected async deleteProject(): Promise<void> {
    this.openMenu.set(null);
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
    this.openMenu.set(null);
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
