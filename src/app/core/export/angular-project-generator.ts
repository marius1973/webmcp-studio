import { TreeState } from '../state/component-tree.types';
import { serializeTree, SerializedNode } from '../webmcp/tree-serialize';
import {
  buildNodeTemplateLines,
  sectionClassName,
  sectionFileBase,
  sectionSelector,
  UI_COMPONENT_STYLES,
  UI_HELPER_METHODS,
} from './export-ui-templates';

export interface AngularProjectFiles {
  [path: string]: string;
}

export interface SectionMeta {
  base: string;
  className: string;
  selector: string;
  path: string;
  routePath: string;
  label: string;
}

export function slugifyProjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio-export';
}

/** Genera un proyecto Angular standalone (estilo `ng new`) a partir del árbol del Studio. */
export function generateAngularProject(tree: TreeState, projectName: string): AngularProjectFiles {
  const slug = slugifyProjectName(projectName);
  const root = serializeTree(tree);
  const sections = buildSectionMetas(root);
  const files: AngularProjectFiles = {
    ...baseProjectFiles(slug, projectName),
  };

  if (sections.length > 0) {
    for (const sec of sections) {
      const node = root.children.find((c) => sectionFileBase(c) === sec.base)!;
      files[sec.path] = buildSectionComponent(sec, node);
    }
    files['src/app/home.component.ts'] = buildHomeComponent(sections);
    files['src/app/app.routes.ts'] = buildRoutes(sections);
    files['src/app/app.config.ts'] = buildAppConfig();
    files['src/app/app.component.ts'] = buildAppShell(projectName, sections);
    files['README.md'] = buildReadme(projectName, sections);
  } else {
    const treeJson = JSON.stringify(root, null, 2);
    files['src/app/generated-ui.component.ts'] = buildMonolithicUi(treeJson);
    files['src/app/app.config.ts'] = buildAppConfigMinimal();
    files['src/app/app.component.ts'] = buildAppWithInlineUi(projectName);
    files['README.md'] = buildReadme(projectName, []);
  }

  return files;
}

function buildSectionMetas(root: SerializedNode): SectionMeta[] {
  return root.children.map((child) => {
    const base = sectionFileBase(child);
    return {
      base,
      className: sectionClassName(base),
      selector: sectionSelector(base),
      path: `src/app/sections/${base}.component.ts`,
      routePath: base,
      label: child.label,
    };
  });
}

function buildSectionComponent(sec: SectionMeta, node: SerializedNode): string {
  const nodeJson = JSON.stringify(node, null, 2);
  const branch = buildNodeTemplateLines('node').join('\n      ');
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

export interface UiNode {
  id: string;
  kind: string;
  label: string;
  props: Record<string, string>;
  children: UiNode[];
}

/** Sección "${sec.label}" — generada desde WebMCP Studio. */
@Component({
  selector: '${sec.selector}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NgClass],
  template: \`
    <ng-template #branch let-node>
      ${branch}
    </ng-template>
    <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: root }" />
  \`,
  styles: [\`${UI_COMPONENT_STYLES}\`],
})
export class ${sec.className} {
  readonly root: UiNode = ${nodeJson};
${UI_HELPER_METHODS}
}
`;
}

function buildHomeComponent(sections: SectionMeta[]): string {
  const imports = sections.map((s) => s.className).join(', ');
  const tags = sections.map((s) => `      <${s.selector} />`).join('\n');
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
${sections.map((s) => `import { ${s.className} } from './sections/${s.base}.component';`).join('\n')}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [${imports}],
  template: \`
    <div class="home">
${tags}
    </div>
  \`,
  styles: [\`.home { display: flex; flex-direction: column; gap: 1rem; }\`],
})
export class HomeComponent {}
`;
}

function buildRoutes(sections: SectionMeta[]): string {
  const sectionRoutes = sections
    .map(
      (s) => `  {
    path: '${s.routePath}',
    loadComponent: () => import('./sections/${s.base}.component').then((m) => m.${s.className}),
    title: '${escapeHtml(s.label)}',
  },`,
    )
    .join('\n');
  return `import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.component').then((m) => m.HomeComponent),
    title: 'Inicio',
  },
${sectionRoutes}
  { path: '**', redirectTo: '' },
];
`;
}

function buildAppConfig(): string {
  return `import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes)],
};
`;
}

function buildAppConfigMinimal(): string {
  return `import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
`;
}

function buildAppShell(projectName: string, sections: SectionMeta[]): string {
  const navLinks = sections
    .map(
      (s) =>
        `          <a routerLink="/${s.routePath}" routerLinkActive="active">${escapeHtml(s.label)}</a>`,
    )
    .join('\n');
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: \`
    <main class="app">
      <header class="app-head">
        <h1>${escapeHtml(projectName)}</h1>
        <p class="muted">Generado con WebMCP Studio</p>
        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
${navLinks}
        </nav>
      </header>
      <router-outlet />
    </main>
  \`,
  styles: [\`
    .app { padding: 1.5rem; max-width: 52rem; margin: 0 auto; }
    .app-head h1 { margin: 0 0 .25rem; font-size: 1.35rem; }
    .muted { margin: 0 0 .75rem; color: var(--muted); font-size: .85rem; }
    .nav a { font-size: .8rem; color: var(--muted); margin-right: .75rem; text-decoration: none; }
    .nav a.active { color: var(--accent); font-weight: 600; }
  \`],
})
export class AppComponent {}
`;
}

function buildAppWithInlineUi(projectName: string): string {
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
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
`;
}

function buildReadme(projectName: string, sections: SectionMeta[]): string {
  const sectionList =
    sections.length > 0
      ? sections.map((s) => `- \`${s.path}\` — ruta \`/${s.routePath}\` (${s.label})`).join('\n')
      : '- `src/app/generated-ui.component.ts` — UI monolítica (árbol vacío bajo root)';
  return `# ${projectName}

Proyecto Angular **standalone** generado desde [WebMCP Studio](https://github.com/marius1973/webmcp-studio).

## Inicio rápido

\`\`\`bash
npm install
npm start
\`\`\`

Abre http://localhost:4200

## Estructura

- \`src/app/app.routes.ts\` — rutas por sección (lazy load)
- \`src/app/home.component.ts\` — vista principal con todas las secciones
${sectionList}

Cada sección tiene **estilos propios** en su \`@Component({ styles })\`.

## Build producción

\`\`\`bash
npm run build
\`\`\`

Salida en \`dist/\`.
`;
}

function baseProjectFiles(slug: string, projectName: string): AngularProjectFiles {
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
          '@angular/router': '^22.0.0',
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
    '.gitignore': `node_modules/\ndist/\n.angular/\nout-tsc/\n`,
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
  };
}

function buildMonolithicUi(treeJson: string): string {
  const branch = buildNodeTemplateLines('node').join('\n      ');
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

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
  imports: [NgTemplateOutlet, NgClass],
  template: \`
    <ng-template #branch let-node>
      ${branch}
    </ng-template>
    <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: root }" />
  \`,
  styles: [\`${UI_COMPONENT_STYLES}\`],
})
export class GeneratedUiComponent {
  readonly root: UiNode = ${treeJson};
${UI_HELPER_METHODS}
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
