import { McpToolMeta } from './webmcp.types';

/** Tools ancladas para el demo (README / LinkedIn). */
export const PINNED_DEMO_TOOLS = [
  'read_tree',
  'create_component',
  'run_playbook',
  'suggest_next',
  'export_project_code',
] as const;

export interface ToolPanelGroup {
  id: string;
  title: string;
  tools: McpToolMeta[];
}

const EDITING = new Set([
  'update_component',
  'delete_component',
  'move_component',
  'list_component_types',
  'apply_patch',
  'list_playbooks',
  'undo',
  'redo',
]);

const ADVISOR = new Set(['explain_selection', 'export_schema']);

const FORMS = new Set([
  'update_selected_component',
  'delete_selected_component',
  'update_component_via_form',
  'new_component_via_form',
]);

const APP = new Set(['greet', 'ping_studio', 'search_docs', 'list_sections']);

function bucket(name: string): string {
  if ((PINNED_DEMO_TOOLS as readonly string[]).includes(name)) return 'pinned';
  if (EDITING.has(name)) return 'editing';
  if (ADVISOR.has(name)) return 'advisor';
  if (FORMS.has(name)) return 'forms';
  if (APP.has(name)) return 'app';
  return 'other';
}

const GROUP_TITLES: Record<string, string> = {
  pinned: 'Destacadas (demo)',
  editing: 'Edición',
  advisor: 'Asesor',
  forms: 'Signal Forms',
  app: 'App y docs',
  other: 'Otras',
};

const GROUP_ORDER = ['pinned', 'editing', 'advisor', 'forms', 'app', 'other'];

export function groupToolsForPanel(tools: McpToolMeta[]): ToolPanelGroup[] {
  const buckets = new Map<string, McpToolMeta[]>();
  for (const tool of tools) {
    const key = bucket(tool.name);
    const list = buckets.get(key) ?? [];
    list.push(tool);
    buckets.set(key, list);
  }

  const pinnedOrder = new Map(PINNED_DEMO_TOOLS.map((n, i) => [n, i]));
  const groups: ToolPanelGroup[] = [];

  for (const id of GROUP_ORDER) {
    const list = buckets.get(id);
    if (!list?.length) continue;
    if (id === 'pinned') {
      list.sort((a, b) => (pinnedOrder.get(a.name as (typeof PINNED_DEMO_TOOLS)[number]) ?? 99) -
        (pinnedOrder.get(b.name as (typeof PINNED_DEMO_TOOLS)[number]) ?? 99));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    groups.push({ id, title: GROUP_TITLES[id] ?? id, tools: list });
  }

  return groups;
}
