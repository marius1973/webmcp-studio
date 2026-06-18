/** Paso atómico ejecutable en un solo undo (batch). */

export type PlaybookStep =
  | { op: 'create_component'; kind: string; parentId?: string; label?: string; props?: Record<string, string> }
  | { op: 'update_component'; ref?: string; id?: string; label?: string; props?: Record<string, string> }
  | { op: 'delete_component'; ref?: string; id?: string }
  | { op: 'move_component'; ref?: string; id?: string; newParentId: string; index?: number };

export interface PlaybookDefinition {
  id: string;
  label: string;
  rationale: string;
  steps: PlaybookStep[];
}
