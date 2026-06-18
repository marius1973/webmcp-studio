import { PlaybookDefinition } from './playbook.types';

/** Playbooks predefinidos para el simulador y `run_playbook`. */
export const PLAYBOOKS: PlaybookDefinition[] = [
  {
    id: 'landing-analytics',
    label: 'Landing analytics',
    rationale: 'Armo un esqueleto SaaS: hero con título, subtítulo, CTA y tres feature cards.',
    steps: [
      { op: 'create_component', kind: 'container', parentId: 'root', label: 'Hero' },
      {
        op: 'update_component',
        ref: '@last',
        props: { direction: 'column', gap: 'md', align: 'start' },
      },
      { op: 'create_component', kind: 'text', parentId: '@last' },
      {
        op: 'update_component',
        ref: '@last',
        label: 'Título',
        props: { text: 'Visualiza tus datos', textSize: 'hero' },
      },
      { op: 'create_component', kind: 'text', parentId: '@parent' },
      {
        op: 'update_component',
        ref: '@last',
        props: { text: 'Dashboards en tiempo real para equipos de datos', textSize: 'body' },
      },
      { op: 'create_component', kind: 'button', parentId: '@parent' },
      {
        op: 'update_component',
        ref: '@last',
        label: 'Empezar gratis',
        props: { variant: 'primary' },
      },
      { op: 'create_component', kind: 'card', parentId: 'root', label: 'Real-time' },
      { op: 'create_component', kind: 'text', parentId: '@last' },
      { op: 'update_component', ref: '@last', props: { text: 'Métricas al instante', textSize: 'body' } },
      { op: 'create_component', kind: 'card', parentId: 'root', label: 'AI Insights' },
      { op: 'create_component', kind: 'text', parentId: '@last' },
      { op: 'update_component', ref: '@last', props: { text: 'Detección automática', textSize: 'body' } },
      { op: 'create_component', kind: 'card', parentId: 'root', label: 'Collaboration' },
      { op: 'create_component', kind: 'text', parentId: '@last' },
      { op: 'update_component', ref: '@last', props: { text: 'Comparte con tu equipo', textSize: 'body' } },
    ],
  },
  {
    id: 'contact-form',
    label: 'Formulario contacto',
    rationale: 'Creo un bloque de contacto con título, email y botón enviar.',
    steps: [
      { op: 'create_component', kind: 'container', parentId: 'root', label: 'Contacto' },
      {
        op: 'update_component',
        ref: '@last',
        props: { direction: 'column', gap: 'sm', align: 'start' },
      },
      { op: 'create_component', kind: 'text', parentId: '@last' },
      {
        op: 'update_component',
        ref: '@last',
        label: 'Título',
        props: { text: 'Hablemos', textSize: 'hero' },
      },
      { op: 'create_component', kind: 'input', parentId: '@parent' },
      {
        op: 'update_component',
        ref: '@last',
        label: 'Email',
        props: { placeholder: 'tu@empresa.com' },
      },
      { op: 'create_component', kind: 'button', parentId: '@parent' },
      {
        op: 'update_component',
        ref: '@last',
        label: 'Enviar',
        props: { variant: 'primary' },
      },
    ],
  },
];

export function playbookById(id: string): PlaybookDefinition | undefined {
  return PLAYBOOKS.find((p) => p.id === id);
}
