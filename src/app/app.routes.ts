import { Routes } from '@angular/router';
import { provideEditingTools } from './core/webmcp/editing-tools';
import { provideDeclarativeEditingTools } from './core/webmcp/declarative-editing-tools';
import { provideDocsTools } from './core/webmcp/docs-tools';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./panels/project-entry').then((m) => m.ProjectEntry),
  },
  {
    path: 'project/:id',
    loadComponent: () => import('./panels/canvas/canvas-home').then((m) => m.CanvasHome),
    // Tools de edición SOLO disponibles dentro del editor (auto-cleanup al salir).
    providers: [...provideEditingTools(), provideDeclarativeEditingTools()],
  },
  {
    path: 'docs',
    loadComponent: () => import('./panels/docs/docs-view').then((m) => m.DocsView),
    // Otro set de tools: el panel cambia al navegar acá.
    providers: [...provideDocsTools()],
  },
];
