import { ComponentKind, ComponentNode, TreeState } from '../state/component-tree.types';

export interface SelectionExplanation {
  id: string;
  kind: ComponentKind;
  label: string;
  props: Record<string, string>;
  parentId: string | null;
  childCount: number;
  summary: string;
}

export interface TreeSuggestion {
  priority: 'high' | 'medium' | 'low';
  message: string;
  hint?: string;
}

const CONTAINER_KINDS: ComponentKind[] = ['container', 'card'];

function hasButtonUnder(state: TreeState, id: string): boolean {
  const node = state.nodes[id];
  if (!node) return false;
  if (node.kind === 'button') return true;
  return node.children.some((c) => hasButtonUnder(state, c));
}

function isEmptyContainer(node: ComponentNode): boolean {
  return CONTAINER_KINDS.includes(node.kind) && node.children.length === 0;
}

/** Describe el nodo seleccionado (o raíz). */
export function explainSelection(state: TreeState, selectedId: string | null): SelectionExplanation | null {
  const id = selectedId && state.nodes[selectedId] ? selectedId : state.rootId;
  const node = state.nodes[id];
  if (!node) return null;
  const childCount = node.children.length;
  const propsSummary = Object.keys(node.props).length
    ? Object.entries(node.props)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
    : 'sin props';
  return {
    id: node.id,
    kind: node.kind,
    label: node.label,
    props: { ...node.props },
    parentId: node.parentId,
    childCount,
    summary: `${node.kind} "${node.label}" (${childCount} hijos, ${propsSummary})`,
  };
}

/** Sugerencias heurísticas para el agente o el usuario. */
export function suggestNextSteps(state: TreeState, selectedId: string | null): TreeSuggestion[] {
  const suggestions: TreeSuggestion[] = [];
  const root = state.nodes[state.rootId];
  const selected = selectedId ? state.nodes[selectedId] : root;
  const nodes = Object.values(state.nodes);

  if (nodes.length <= 1) {
    suggestions.push({
      priority: 'high',
      message: 'El árbol está vacío: crea un container Hero bajo root.',
      hint: 'run_playbook(landing-analytics) o create_component(container)',
    });
  }

  if (root && !hasButtonUnder(state, root.id)) {
    suggestions.push({
      priority: 'high',
      message: 'No hay ningún botón (CTA) bajo la raíz.',
      hint: 'create_component(button) bajo un container Hero',
    });
  }

  const emptyCards = nodes.filter((n) => n.kind === 'card' && n.children.length === 0);
  if (emptyCards.length) {
    suggestions.push({
      priority: 'medium',
      message: `${emptyCards.length} card(s) vacía(s): agrega un text hijo.`,
      hint: `update_component en ${emptyCards[0]!.id} o create_component(text)`,
    });
  }

  const emptyContainers = nodes.filter(isEmptyContainer);
  if (emptyContainers.length) {
    suggestions.push({
      priority: 'medium',
      message: `${emptyContainers.length} contenedor(es) sin hijos.`,
      hint: 'create_component(text|button) dentro del contenedor',
    });
  }

  if (selected) {
    if (selected.kind === 'text' && !selected.props['text'] && selected.label === 'Texto') {
      suggestions.push({
        priority: 'medium',
        message: `El text ${selected.id} usa el label por defecto; define props.text.`,
        hint: 'update_component con props: { text: "…", textSize: "hero" }',
      });
    }
    if (selected.kind === 'input' && !selected.props['placeholder']) {
      suggestions.push({
        priority: 'low',
        message: `El input ${selected.id} no tiene placeholder.`,
        hint: 'update_component con props.placeholder',
      });
    }
    if (selected.kind === 'image' && !selected.props['src']) {
      suggestions.push({
        priority: 'high',
        message: `La imagen ${selected.id} no tiene src.`,
        hint: 'update_component con props: { src: "https://…", alt: "…" }',
      });
    }
    if (selected.kind === 'link' && !selected.props['href']) {
      suggestions.push({
        priority: 'medium',
        message: `El link ${selected.id} no tiene href.`,
        hint: 'update_component con props.href',
      });
    }
  }

  const textCount = nodes.filter((n) => n.kind === 'text').length;
  if (textCount === 0 && nodes.length > 1) {
    suggestions.push({
      priority: 'low',
      message: 'No hay nodos text: considera títulos o párrafos.',
      hint: 'create_component(text)',
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      priority: 'low',
      message: 'Estructura coherente. Revisa Preview o exporta con export_project_code.',
    });
  }

  return suggestions;
}

export function formatSuggestions(suggestions: TreeSuggestion[]): string {
  return suggestions.map((s, i) => `${i + 1}. [${s.priority}] ${s.message}${s.hint ? ` → ${s.hint}` : ''}`).join('\n');
}
