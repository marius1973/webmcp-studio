import { TreeState } from './component-tree.types';
import { createInitialTreeState } from './component-tree.store';

export interface ProjectTemplate {
  id: string;
  label: string;
  description: string;
  tree: () => TreeState;
}

function node(
  id: string,
  kind: TreeState['nodes'][string]['kind'],
  label: string,
  parentId: string | null,
  children: string[],
  props: Record<string, string> = {},
): TreeState['nodes'][string] {
  return { id, kind, label, props, children, parentId };
}

function landingSaas(): TreeState {
  const nodes: TreeState['nodes'] = {
    root: node('root', 'container', 'AppRoot', null, ['hero', 'feat-row']),
    hero: node('hero', 'container', 'Hero', 'root', ['t1', 't2', 'cta'], {
      direction: 'column',
      gap: 'md',
      align: 'start',
    }),
    t1: node('t1', 'text', 'Título', 'hero', [], { text: 'Visualiza tus datos', textSize: 'hero' }),
    t2: node('t2', 'text', 'Subtítulo', 'hero', [], {
      text: 'Dashboards en tiempo real',
      textSize: 'body',
    }),
    cta: node('cta', 'button', 'Empezar gratis', 'hero', [], { variant: 'primary' }),
    'feat-row': node('feat-row', 'container', 'Features', 'root', ['c1', 'c2', 'c3'], {
      direction: 'row',
      gap: 'md',
      align: 'start',
    }),
    c1: node('c1', 'card', 'Real-time', 'feat-row', ['c1t'], {}),
    c1t: node('c1t', 'text', 'Desc', 'c1', [], { text: 'Métricas al instante', textSize: 'body' }),
    c2: node('c2', 'card', 'AI Insights', 'feat-row', ['c2t'], {}),
    c2t: node('c2t', 'text', 'Desc', 'c2', [], { text: 'Detección automática', textSize: 'body' }),
    c3: node('c3', 'card', 'Collaboration', 'feat-row', ['c3t'], {}),
    c3t: node('c3t', 'text', 'Desc', 'c3', [], { text: 'Comparte con tu equipo', textSize: 'body' }),
  };
  return { rootId: 'root', nodes };
}

function loginForm(): TreeState {
  const nodes: TreeState['nodes'] = {
    root: node('root', 'container', 'AppRoot', null, ['login']),
    login: node('login', 'card', 'Login', 'root', ['title', 'email', 'pass', 'submit'], {
      direction: 'column',
      gap: 'sm',
      align: 'start',
    }),
    title: node('title', 'text', 'Título', 'login', [], { text: 'Iniciar sesión', textSize: 'hero' }),
    email: node('email', 'input', 'Email', 'login', [], { placeholder: 'tu@empresa.com' }),
    pass: node('pass', 'input', 'Contraseña', 'login', [], { placeholder: '••••••••' }),
    submit: node('submit', 'button', 'Entrar', 'login', [], { variant: 'primary' }),
  };
  return { rootId: 'root', nodes };
}

function dashboardShell(): TreeState {
  const nodes: TreeState['nodes'] = {
    root: node('root', 'container', 'AppRoot', null, ['shell']),
    shell: node('shell', 'container', 'Shell', 'root', ['sidebar', 'main'], {
      direction: 'row',
      gap: 'lg',
      align: 'start',
    }),
    sidebar: node('sidebar', 'container', 'Sidebar', 'shell', ['nav1', 'nav2', 'div1'], {
      direction: 'column',
      gap: 'sm',
      align: 'start',
    }),
    nav1: node('nav1', 'link', 'Dashboard', 'sidebar', [], { href: '#', text: 'Dashboard' }),
    nav2: node('nav2', 'link', 'Reportes', 'sidebar', [], { href: '#reports', text: 'Reportes' }),
    div1: node('div1', 'divider', '—', 'sidebar', [], {}),
    main: node('main', 'container', 'Main', 'shell', ['h1', 'kpi-row'], {
      direction: 'column',
      gap: 'md',
      align: 'start',
    }),
    h1: node('h1', 'text', 'Heading', 'main', [], { text: 'Resumen', textSize: 'hero' }),
    'kpi-row': node('kpi-row', 'container', 'KPIs', 'main', ['k1', 'k2'], {
      direction: 'row',
      gap: 'md',
      align: 'start',
    }),
    k1: node('k1', 'card', 'Usuarios', 'kpi-row', ['k1t'], {}),
    k1t: node('k1t', 'text', 'Valor', 'k1', [], { text: '12.4k', textSize: 'hero' }),
    k2: node('k2', 'card', 'Ingresos', 'kpi-row', ['k2t'], {}),
    k2t: node('k2t', 'text', 'Valor', 'k2', [], { text: '$48k', textSize: 'hero' }),
  };
  return { rootId: 'root', nodes };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    label: 'En blanco',
    description: 'Solo AppRoot vacío',
    tree: createInitialTreeState,
  },
  {
    id: 'landing-saas',
    label: 'Landing SaaS',
    description: 'Hero + 3 feature cards',
    tree: landingSaas,
  },
  {
    id: 'login-form',
    label: 'Login',
    description: 'Card con email, password y botón',
    tree: loginForm,
  },
  {
    id: 'dashboard-shell',
    label: 'Dashboard shell',
    description: 'Sidebar con links + área principal',
    tree: dashboardShell,
  },
];

export function templateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}
