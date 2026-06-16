import { TreeState } from '../state/component-tree.types';
import { serializeTree, SerializedNode } from '../webmcp/tree-serialize';

export interface AngularProjectFiles {
  [path: string]: string;
}

export function slugifyProjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio-export';
}

/** Genera un proyecto Angular standalone (estilo `ng new`) a partir del árbol del Studio. */
export function generateAngularProject(tree: TreeState, projectName: string): AngularProjectFiles {
  const slug = slugifyProjectName(projectName);
  const root = serializeTree(tree);
  const treeJson = JSON.stringify(root, null, 2);

  return {
    'package.json': JSON.stringify(
      {
        name: slug,
        version: '0.0.0',
        private: true,
        scripts: { ng: 'ng', start: 'ng serve', build: 'ng build' },
        dependencies: {
          '@angular/common': '^22.0.0',
          '@angular/compiler': '^22.0.0',
          '@angular/core': '^22.0.0',
          '@angular/platform-browser': '^22.0.0',
          rxjs: '~7.8.0',
          tslib: '^2.6.0',
        },
        devDependencies: {
          '@angular/build': '^22.0.0',
          '@angular/cli': '^22.0.0',
          '@angular/compiler-cli': '^22.0.0',
          typescript: '~6.0.0',
        },
      },
      null,
      2,
    ),
    'angular.json': JSON.stringify(
      {
        $schema: './node_modules/@angular/cli/lib/config/schema.json',
        version: 1,
        newProjectRoot: 'projects',
        projects: {
          [slug]: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            prefix: 'app',
            architect: {
              build: {
                builder: '@angular/build:application',
                options: {
                  outputPath: `dist/${slug}`,
                  index: 'src/index.html',
                  browser: 'src/main.ts',
                  polyfills: [],
                  tsConfig: 'tsconfig.app.json',
                  assets: [{ glob: '**/*', input: 'public' }],
                  styles: ['src/styles.css'],
                  scripts: [],
                },
                configurations: {
                  production: {
                    budgets: [{ type: 'initial', maximumWarning: '500kB', maximumError: '1MB' }],
                    outputHashing: 'all',
                  },
                  development: { optimization: false, extractLicenses: false, sourceMap: true },
                },
                defaultConfiguration: 'production',
              },
              serve: {
                builder: '@angular/build:dev-server',
                configurations: {
                  production: { buildTarget: `${slug}:build:production` },
                  development: { buildTarget: `${slug}:build:development` },
                },
                defaultConfiguration: 'development',
              },
            },
          },
        },
      },
      null,
      2,
    ),
    'tsconfig.json': JSON.stringify(
      {
        compileOnSave: false,
        compilerOptions: {
          strict: true,
          noImplicitOverride: true,
          noPropertyAccessFromIndexSignature: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          skipLibCheck: true,
          isolatedModules: true,
          experimentalDecorators: true,
          moduleResolution: 'bundler',
          importHelpers: true,
          target: 'ES2022',
          module: 'ES2022',
          lib: ['ES2022', 'dom', 'dom.iterable'],
        },
        angularCompilerOptions: {
          enableI18nLegacyMessageIdFormat: false,
          strictInjectionParameters: true,
          strictInputAccessModifiers: true,
          typeCheckHostBindings: true,
          strictTemplates: true,
        },
      },
      null,
      2,
    ),
    'tsconfig.app.json': JSON.stringify(
      {
        extends: './tsconfig.json',
        compilerOptions: { outDir: './out-tsc/app', types: [] },
        files: ['src/main.ts'],
        include: ['src/**/*.d.ts'],
      },
      null,
      2,
    ),
    '.gitignore': `node_modules/
dist/
.angular/
out-tsc/
`,
    'README.md': `# ${projectName}

Proyecto Angular generado desde **WebMCP Studio**.

\`\`\`bash
npm install
npm start
\`\`\`

Abre http://localhost:4200 para ver la UI exportada.
`,
    'public/.gitkeep': '',
    'src/index.html': `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(projectName)}</title>
  <base href="/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <app-root></app-root>
</body>
</html>
`,
    'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
`,
    'src/styles.css': `:root {
  --surface-0: #0e1116;
  --surface-1: #161b22;
  --border: #2b323c;
  --fg: #e6edf3;
  --muted: #8b949e;
  --accent: #6e56cf;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: var(--surface-0);
  color: var(--fg);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
}
`,
    'src/app/app.config.ts': `import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
`,
    'src/app/app.component.ts': `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GeneratedUiComponent } from './generated-ui.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GeneratedUiComponent],
  template: \`
    <main class="app">
      <header class="app-head">
        <h1>${escapeHtml(projectName)}</h1>
        <p class="muted">Generado con WebMCP Studio</p>
      </header>
      <app-generated-ui />
    </main>
  \`,
  styles: [\`
    .app { padding: 1.5rem; max-width: 48rem; margin: 0 auto; }
    .app-head h1 { margin: 0 0 .25rem; font-size: 1.35rem; }
    .muted { margin: 0 0 1rem; color: var(--muted); font-size: .85rem; }
  \`],
})
export class AppComponent {}
`,
    'src/app/generated-ui.component.ts': buildGeneratedUiComponent(treeJson),
  };
}

function buildGeneratedUiComponent(treeJson: string): string {
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface UiNode {
  id: string;
  kind: string;
  label: string;
  props: Record<string, string>;
  children: UiNode[];
}

@Component({
  selector: 'app-generated-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: \`
    <ng-template #branch let-node>
      @if (node.kind === 'container') {
        <section class="ui-container">
          @for (child of node.children; track child.id) {
            <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: child }" />
          }
        </section>
      } @else if (node.kind === 'card') {
        <article class="ui-card">
          <h2>{{ node.label }}</h2>
          @for (child of node.children; track child.id) {
            <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: child }" />
          }
        </article>
      } @else if (node.kind === 'button') {
        <button type="button" class="ui-btn" [attr.data-variant]="node.props['variant'] || 'primary'">
          {{ node.label }}
        </button>
      } @else if (node.kind === 'text') {
        <p class="ui-text">{{ node.props['text'] || node.label }}</p>
      } @else if (node.kind === 'input') {
        <input class="ui-input" [placeholder]="node.props['placeholder'] || node.label" />
      }
    </ng-template>
    <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: root }" />
  \`,
  styles: [\`
    .ui-container { display: flex; flex-direction: column; gap: .5rem; margin: .5rem 0; }
    .ui-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      background: var(--surface-1);
      margin: .5rem 0;
    }
    .ui-card h2 { margin: 0 0 .75rem; font-size: 1rem; }
    .ui-btn {
      border: 0;
      border-radius: 8px;
      padding: .45rem .9rem;
      font-size: .85rem;
      cursor: pointer;
      color: #fff;
      background: var(--accent);
    }
    .ui-btn[data-variant="ghost"] {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
    }
    .ui-btn[data-variant="danger"] { background: #c0455f; }
    .ui-text { margin: .35rem 0; font-size: .9rem; }
    .ui-input {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: .45rem .7rem;
      color: var(--fg);
      font-size: .85rem;
      min-width: 12rem;
    }
  \`],
})
export class GeneratedUiComponent {
  readonly root: UiNode = ${treeJson};
}
`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function listGeneratedPaths(files: AngularProjectFiles): string[] {
  return Object.keys(files).sort();
}

export function summarizeExport(files: AngularProjectFiles, projectName: string): string {
  const paths = listGeneratedPaths(files);
  return `Proyecto Angular "${projectName}" (${paths.length} archivos): ${paths.join(', ')}`;
}
