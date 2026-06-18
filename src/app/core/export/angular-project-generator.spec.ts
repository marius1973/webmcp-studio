import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from '../state/component-tree.store';
import { templateById } from '../state/project-templates';
import { generateAngularProject, slugifyProjectName, summarizeExport } from './angular-project-generator';

describe('generateAngularProject', () => {
  it('genera los archivos mínimos de un ng new', () => {
    const files = generateAngularProject(createInitialTreeState(), 'Mi App');
    expect(files['package.json']).toBeTruthy();
    expect(files['angular.json']).toBeTruthy();
    expect(files['src/app/app.component.ts']).toContain('selector: \'app-root\'');
    expect(files['src/app/app.config.ts']).toContain('provideZonelessChangeDetection');
    expect(files['src/app/generated-ui.component.ts']).toContain('AppRoot');
    expect(files['src/main.ts']).toContain('bootstrapApplication');
  });

  it('genera secciones y rutas cuando hay hijos bajo root', () => {
    const state = templateById('landing-saas')!.tree();
    const files = generateAngularProject(state, 'Landing');
    expect(files['src/app/app.routes.ts']).toContain('loadComponent');
    expect(files['src/app/home.component.ts']).toContain('HomeComponent');
    expect(Object.keys(files).some((p) => p.startsWith('src/app/sections/'))).toBe(true);
    expect(files['README.md']).toContain('npm start');
  });

  it('usa un slug seguro en package.json', () => {
    const files = generateAngularProject(createInitialTreeState(), 'Mi App Demo!');
    const pkg = JSON.parse(files['package.json']) as { name: string };
    expect(pkg.name).toBe('mi-app-demo');
    expect(slugifyProjectName('Mi App Demo!')).toBe('mi-app-demo');
  });

  it('resume la exportación', () => {
    const files = generateAngularProject(createInitialTreeState(), 'Demo');
    expect(summarizeExport(files, 'Demo')).toContain('package.json');
  });
});
