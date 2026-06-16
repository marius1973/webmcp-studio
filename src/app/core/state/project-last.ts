export const LAST_PROJECT_KEY = 'webmcp-studio:last-project';

export function readLastProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function persistLastProjectId(id: string): void {
  try {
    localStorage.setItem(LAST_PROJECT_KEY, id);
  } catch {
    // Storage bloqueado o lleno: no interrumpe el flujo del editor.
  }
}

export function clearLastProjectId(): void {
  try {
    localStorage.removeItem(LAST_PROJECT_KEY);
  } catch {
    // noop
  }
}
