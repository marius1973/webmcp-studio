import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectStore } from '../../core/state/project.store';

/** Sección Docs: demuestra que al cambiar de ruta cambian las tools del panel. */
@Component({
  selector: 'app-docs-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="docs">
      @if (projects.fallbackProjectId(); as pid) {
        <p class="back-row"><a class="back" [routerLink]="['/project', pid]">← Volver al editor</a></p>
      }
      <h1>Documentación</h1>
      <p>Estás fuera del editor. Observa el <strong>Panel de Herramientas</strong>: las tools de
         edición (<code>create_component</code>, <code>move_component</code>…) desaparecieron y
         aparecieron <code>search_docs</code> y <code>list_sections</code>.</p>
      <p>Eso es <strong>auto-cleanup</strong>: las tools viven en el injector de la ruta y se
         desregistran al navegar, gracias a <code>withExperimentalAutoCleanupInjectors</code>.</p>
    </div>
  `,
  styles: [`
    .docs { max-width:40rem; line-height:1.55; }
    .back-row { margin:0 0 .8rem; }
    .back { color:var(--accent); text-decoration:none; font-size:.85rem; }
    .back:hover { text-decoration:underline; }
    h1 { margin:0 0 .6rem; font-size:1.4rem; }
    code { background:var(--surface-2); padding:0 .25rem; border-radius:4px; font-size:.85em; }
  `],
})
export class DocsView {
  protected readonly projects = inject(ProjectStore);
}
