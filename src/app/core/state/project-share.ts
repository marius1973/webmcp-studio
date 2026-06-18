import { TreeState } from './component-tree.types';
import { validateTreeState } from '../webmcp/tree-validate';

/** Codifica el árbol para compartir en la URL (?share=…). */
export function encodeTreeShare(state: TreeState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Decodifica ?share=…; null si es inválido o corrupto. */
export function decodeTreeShare(token: string): TreeState | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as TreeState;
    const validated = validateTreeState(parsed);
    return validated.ok ? validated.state : null;
  } catch {
    return null;
  }
}

export function buildShareUrl(state: TreeState, projectId: string): string {
  const token = encodeTreeShare(state);
  const base = typeof location !== 'undefined' ? location.origin : '';
  return `${base}/project/${projectId}?share=${token}`;
}
