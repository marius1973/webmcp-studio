import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectStore } from '../../core/state/project.store';
import { BRAND_LOGO, brandLogoSrcset } from '../../core/brand/brand-logo';

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
      <aside class="brand" aria-label="Marca">
        <img
          class="brand-logo"
          [src]="brand.src"
          [attr.srcset]="brandSrcset"
          alt="WebMCP Studio"
          [width]="brand.docs"
          [height]="brand.docs"
          decoding="async"
        />
        <p class="brand-name">WebMCP Studio</p>
        <p class="brand-tag">Angular v22 · WebMCP · Signals</p>
      </aside>
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
    .brand {
      float:right; width:10.5rem; margin:0 0 1rem 1.25rem; padding:.85rem .75rem;
      text-align:center; background:var(--surface-2); border:1px solid var(--border);
      border-radius:12px;
    }
    .brand-logo {
      display:block; margin:0 auto .5rem;
      width:8rem; height:8rem;
      object-fit:contain;
    }
    .brand-name { margin:0; font-weight:700; font-size:.85rem; }
    .brand-tag { margin:.2rem 0 0; font-size:.65rem; color:var(--muted); }
    .back-row { margin:0 0 .8rem; }
    .back { color:var(--accent); text-decoration:none; font-size:.85rem; }
    .back:hover { text-decoration:underline; }
    h1 { margin:0 0 .6rem; font-size:1.4rem; }
    code { background:var(--surface-2); padding:0 .25rem; border-radius:4px; font-size:.85em; }
  `],
})
export class DocsView {
  protected readonly projects = inject(ProjectStore);
  protected readonly brand = BRAND_LOGO;
  protected readonly brandSrcset = brandLogoSrcset();
}
