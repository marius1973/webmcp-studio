import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectStore } from '../core/state/project.store';

/** Redirige a la ruta de entrada del editor (último proyecto o uno nuevo). */
@Component({
  selector: 'app-project-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="muted" role="status" aria-live="polite">Cargando proyecto…</p>`,
  styles: [`.muted { color:var(--muted); font-size:.85rem; margin:1rem; }`],
})
export class ProjectEntry implements OnInit {
  private readonly router = inject(Router);
  private readonly projects = inject(ProjectStore);

  ngOnInit(): void {
    void this.projects.resolveEntryProjectId().then((id) => {
      void this.router.navigate(['/project', id], { replaceUrl: true });
    });
  }
}
