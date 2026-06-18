# Bundle y lazy loading

Mediciones locales (build producción, junio 2026):

| Chunk | Tamaño raw | Notas |
|-------|------------|--------|
| `main-*.js` | ~470 kB | Shell + editor + WebMCP |
| `chunk-*jszip*` | ~97 kB | **Lazy** — solo al exportar ZIP |
| `chunk-*canvas*` | ~27 kB | Ruta `project/:id` |

## JSZip (CommonJS)

`project-zip.ts` usa `import('jszip')` dinámico. El warning de Angular CLI es esperado:

```
Module 'jszip' used by 'project-zip.ts' is not ESM
```

El chunk queda separado y **no** forma parte del initial bundle de navegación.

## Budgets (`angular.json`)

- `initial`: warning 520 kB / error 1.1 MB
- Rutas lazy: `canvas-home`, `docs-view`, `project-entry`

## Cómo medir

```bash
npm run build
# Revisar la tabla "Lazy chunk files" en la salida de ng build
```

## Optimizaciones futuras (no implementadas)

- `allowedCommonJsDependencies: ['jszip']` para silenciar el warning
- Split del panel Observador si el main superara 600 kB
