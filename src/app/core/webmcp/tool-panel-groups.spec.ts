import { describe, expect, it } from 'vitest';
import { McpToolMeta } from './webmcp.types';
import { groupToolsForPanel, PINNED_DEMO_TOOLS } from './tool-panel-groups';

function meta(name: string, source: McpToolMeta['source'] = 'route'): McpToolMeta {
  return { name, description: name, source };
}

describe('groupToolsForPanel', () => {
  it('agrupa pinned primero y no duplica', () => {
    const tools = [
      meta('create_component'),
      meta('read_tree'),
      meta('greet', 'app'),
      meta('update_component'),
    ];
    const groups = groupToolsForPanel(tools);
    expect(groups[0]?.id).toBe('pinned');
    expect(groups[0]?.tools.map((t) => t.name)).toEqual(['read_tree', 'create_component']);
    const all = groups.flatMap((g) => g.tools.map((t) => t.name));
    expect(new Set(all).size).toBe(all.length);
  });

  it('incluye las 5 tools del demo en pinned cuando existen', () => {
    const tools = PINNED_DEMO_TOOLS.map((n) => meta(n));
    const pinned = groupToolsForPanel(tools).find((g) => g.id === 'pinned');
    expect(pinned?.tools).toHaveLength(5);
  });
});
