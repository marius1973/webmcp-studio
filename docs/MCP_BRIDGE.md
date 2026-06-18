# Puente MCP externo

Permite que herramientas fuera del tab (Cursor, scripts Node, iframe padre) invoquen tools del studio.

## API en el browser

Con el studio abierto (`npm start` o demo):

```javascript
// Consola DevTools
await window.webmcpStudio.invoke('read_tree', { rationale: 'debug' });
await window.webmcpStudio.invoke('create_component', { kind: 'button', parentId: 'root' });
await window.webmcpStudio.invoke('explain_selection', {});
await window.webmcpStudio.invoke('suggest_next', {});
```

## postMessage (iframe / extensión)

```javascript
window.postMessage({
  type: 'webmcp-studio:invoke',
  id: 'req-1',
  tool: 'read_tree',
  args: { rationale: 'desde iframe' },
}, '*');

window.addEventListener('message', (e) => {
  if (e.data?.type === 'webmcp-studio:result' && e.data.id === 'req-1') {
    console.log(e.data.text);
  }
});
```

## WebSocket (dev)

1. Instala dependencia dev: `npm install -D ws`
2. `node scripts/mcp-bridge-server.mjs`
3. Abre el studio — intenta conectar a `ws://localhost:3847`

Envía JSON:

```json
{ "type": "webmcp-studio:invoke", "id": "1", "tool": "suggest_next", "args": {} }
```

## Tools soportadas en bridge

`create_component`, `read_tree`, `delete_component`, `run_playbook`, `explain_selection`, `suggest_next`

Para el resto, usa el agente WebMCP nativo o el simulador en el canvas.

## Integración con MCP (Cursor / Claude Desktop)

Un servidor MCP stdio puede reenviar llamadas vía WebSocket o instruir al usuario a usar `window.webmcpStudio`. Este repo incluye el hub WS como punto de extensión; un adaptador MCP completo es opcional según tu entorno.
