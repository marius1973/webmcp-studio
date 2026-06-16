import { DEFAULT_PROJECT_ID } from './project.constants';

/** Resuelve el id de entrada: último usado (si existe) o el proyecto por defecto. */
export function resolveEntryProjectId(
  projectIds: string[],
  lastId: string | null,
  defaultId: string = DEFAULT_PROJECT_ID,
): string {
  if (lastId && projectIds.includes(lastId)) return lastId;
  return defaultId;
}
