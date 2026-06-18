/**
 * Hub WebSocket para puente MCP ↔ WebMCP Studio (dev).
 * Uso: node scripts/mcp-bridge-server.mjs
 * El studio se conecta a ws://localhost:3847 cuando está abierto.
 */
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = 3847;
const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebMCP Studio bridge — conectá el studio y usá postMessage/WS\n');
});

const wss = new WebSocketServer({ server: httpServer });
let studio: import('ws').WebSocket | null = null;

wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      if (msg.type === 'webmcp-studio:hello') {
        studio = ws;
        ws.send(JSON.stringify({ type: 'webmcp-studio:ready' }));
        return;
      }
      if (studio && ws !== studio) {
        studio.send(String(raw));
      }
    } catch {
      // ignore
    }
  });
  ws.on('close', () => {
    if (studio === ws) studio = null;
  });
});

httpServer.listen(PORT, () => {
  console.log(`Bridge WS en ws://localhost:${PORT}`);
  console.log('También disponible: window.webmcpStudio.invoke(tool, args) en la consola del browser');
});
