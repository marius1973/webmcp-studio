import { describe, it, expect } from 'vitest';
import { createInitialTreeState } from '../state/component-tree.store';
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
