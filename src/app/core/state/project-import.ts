import { TreeState } from './component-tree.types';
import { validateTreeState } from '../webmcp/tree-validate';

export type ImportPreview =
  | { ok: true; name: string; nodeCount: number }
  | { ok: false; error: string };

/** Valida un JSON de export/import sin aplicarlo al store. */
export function previewImportJson(text: string): ImportPreview {
  try {
    const parsed = JSON.parse(text) as { name?: unknown; tree?: unknown };
    if (!parsed.tree) return { ok: false, error: 'JSON sin árbol válido' };
    const validated = validateTreeState(parsed.tree);
    if (!validated.ok) return validated;
    const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'proyecto importado';
    return { ok: true, name, nodeCount: Object.keys(validated.state.nodes).length };
  } catch {
    return { ok: false, error: 'JSON no válido' };
  }
}

export function parseImportTree(text: string): { ok: true; state: TreeState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text) as { tree?: unknown };
    if (!parsed.tree) return { ok: false, error: 'JSON sin árbol válido' };
    return validateTreeState(parsed.tree);
  } catch {
    return { ok: false, error: 'JSON no válido' };
  }
}
