/**
 * Registra el service worker de la PWA mínima (solo en producción / HTTPS).
 */
export function registerStudioServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW opcional — no interrumpe la app
    });
  });
}
