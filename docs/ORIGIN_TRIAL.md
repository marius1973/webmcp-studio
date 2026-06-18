# WebMCP — Chrome Origin Trial en Vercel

Para habilitar `navigator.modelContext` **nativo** en Chrome 149+ sin que el visitante active flags.

## Pasos

1. Registra tu origen en [Chrome Origin Trials — WebMCP](https://developer.chrome.com/docs/ai/webmcp#join-the-webmcp-origin-trial).
2. Copia el **trial token** que te den para `https://webmcp-studio-buur.vercel.app` (o tu dominio).
3. En **Vercel → Project → Settings → Environment Variables**, agrega:
   - `WEBMCP_ORIGIN_TRIAL_TOKEN` = tu token
4. Redeploy. El script `scripts/inject-origin-trial.mjs` corre tras `ng build` e inserta:

   ```html
   <meta http-equiv="origin-trial" content="TOKEN…" />
   ```

## Desarrollo local

- Flag: [`chrome://flags/#enable-webmcp-testing`](https://developer.chrome.com/docs/ai/webmcp#local-webmcp)
- O exporta el token antes del build:

  ```bash
  set WEBMCP_ORIGIN_TRIAL_TOKEN=eyJ…
  npm run build
  ```

## Sin token

El demo sigue funcionando con **simulador** + **polyfill** (`@mcp-b/webmcp-polyfill`). El Origin Trial solo activa la API nativa en Chrome para visitantes de producción.

## Edge 147+

Microsoft Edge integra el agente con `navigator.modelContext` sin este token; el meta tag es específico del Origin Trial de Chrome.
