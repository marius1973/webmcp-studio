# Clip del time-travel slider + diseño multi-agente

Documento de producción y arquitectura para dos entregables del Studio:
1. **Clip de 10–15 s** del historial con slider (marketing / README).
2. **Dos agentes en paralelo** serializados por `CommandBus` (demo técnica).

---

## Parte 1 — Guion del clip del time-travel slider

### Mensaje único

> **Cada paso del agente es reversible — viaja en el tiempo, no solo deshaz.**

Un agente que opera por clics en pantalla no puede ofrecer esto: aquí cada mutación es un `Command` con snapshot; el slider es navegación directa al estado del árbol, no undo secuencial.

### Preparación (antes de grabar)

1. Proyecto **en blanco** (menú **Proyecto → Nuevo**).
2. Generar **8–12 acciones** mezclando origen para que el slider muestre **marcadores de color**:
   - **Azul** — acciones manuales (usuario): paleta ＋ Añadir, inspector, edición directa en canvas.
   - **Naranja** — agente (simulador o playbook sin carril).
   - **Rojo** — destructivo (`delete_component` o borrar nodo).
3. Secuencia sugerida (~12 pasos):
   - Manual: Card, Botón, Texto.
   - Manual: drag Texto → dentro de Card.
   - Agente: `create_component(button)` desde simulador.
   - Manual: doble clic en texto (edición in-place).
   - Agente: playbook **Landing analytics** (1 paso en historial).
   - Manual: delete de un nodo hoja.
   - Manual: Undo ×1 con ← del slider.
4. **No grabar** hasta que `N / N` del slider sea ≥ 8 y haya al menos un punto rojo, uno naranja y varios azules.

### Plano por plano (10–15 s, sin audio)

| Seg | Plano | Texto sobreimpreso (opcional) |
|-----|-------|-------------------------------|
| 0–2 | Wide: 4 paneles + slider visible bajo toolbar | *WebMCP Studio — historial vivo* |
| 2–4 | Zoom canvas: slider con puntos de color | *Cada acción = un paso* |
| 4–8 | Mano arrastra slider **lento y suave** hacia atrás (paso 8 → 3) | *Viaje en el tiempo — no solo Undo* |
| 8–11 | Suelta en paso ~3; árbol y preview cambian | *Estado exacto del árbol* |
| 11–13 | Arrastra de vuelta al final (paso actual) | *Rehacer es arrastrar adelante* |
| 13–15 | Mismo frame que inicio (mismo zoom, mismo proyecto) | *Reversible. Observable. Exportable.* |

### Detalles clave de producción

| Requisito | Cómo lograrlo |
|-----------|----------------|
| **Loopable** | Primer y último frame idénticos: termina en la **misma posición del slider** y el mismo zoom que el frame 0. No cambies proyecto ni modo Preview al cerrar. |
| **Movimiento suave** | Arrastra el `<input type="range">` de forma continua 3–4 s; evita saltos por clic en marcadores en el clip principal. |
| **Sin audio** | Export MP4 mudo (`-an`); música va en la plataforma (LinkedIn/X), no en el archivo. |
| **960 px ancho** | Coherente con `docs/demo.mp4` del README. |

### Cómo grabarlo

#### Opción A — Manual (OBS / Win+G)

1. `npm start` → ventana 1440×810, zoom 100 %.
2. Ejecuta la secuencia de preparación.
3. Graba solo el área del canvas + slider (10–15 s).
4. Recorta y exporta MP4; verifica loop (último frame ≈ primero).

#### Opción B — Playwright determinista (recomendado)

Script futuro `e2e/history-clip.spec.ts` (misma idea que `hero.spec.ts`):

```bash
npm run demo:hero          # patrón existente
# Añadir: npm run demo:history-clip && npm run demo:mp4 history-clip
```

Pasos automatizables:

1. `createBlankProject` + 10 acciones con `PACE = 600`.
2. `page.locator('.history-slider input[type=range]')` → `fill('3')` con `steps` de mouse move para suavidad.
3. Volver a `fill(String(maxIndex))` al final.
4. `ffmpeg` → `docs/history-clip.mp4`.

### Texto sugerido para acompañar el clip (LinkedIn / X)

> En WebMCP Studio el agente no “hace clic” en la UI: cada cambio es un **Command** con snapshot.  
> El slider de historial es **viaje en el tiempo** sobre el árbol real — undo/redo de todo el flujo, manual o IA.  
> Eso es lo que un agente por coordenadas (X,Y) no puede replicar.  
> Demo: [webmcp-studio-buur.vercel.app](https://webmcp-studio-buur.vercel.app/)

---

## Parte 2 — Diseño técnico: dos agentes en paralelo

### Tesis

La coordinación multi-agente sale **gratis** por la arquitectura de **Commands serializados**:

```
Agente A ──┐
           ├──► CommandBus (síncrono, 1 hilo) ──► TreeStore
Agente B ──┘
```

No hay mutex ni OT: JavaScript + `CommandBus.dispatch()` garantizan orden total. Undo/redo opera sobre la **intercalación** real (un solo historial).

Un agente que opera por **clics en DOM** no tiene esta propiedad: dos automatizaciones concurrentes producen carreras; no hay snapshot unificado ni slider de tiempo.

### Modelo de datos (retrocompatible)

```typescript
// ToolCallLog / ObserverEvent — campo opcional
lane?: 'A' | 'B';
conflict?: boolean;  // solo ObserverEvent
```

Sin `lane` → comportamiento idéntico al anterior.

### API

| Pieza | Rol |
|-------|-----|
| `EditingToolsService.withLane('A' \| 'B')` | Devuelve `LaneScopedEditingTools`; etiqueta cada `dispatch`. |
| `ParallelAgentRunner` | Intercala pasos `{ lane, run }` en orden fijo (determinista). |
| `CommandBus.detectLaneConflict` | Si el paso anterior fue otro carril y toca los mismos nodos → `conflict: true` (last-write-wins). |
| `ParallelAgentService.runTwoAgentDemo()` | Demo de 6 pasos A/B con conflicto en el mismo `text`. |

### Conflicto visible

- **Política:** last-write-wins (gana el último `dispatch`).
- **Observador:** `conflict: true`, texto `⚡ last-write-wins entre carriles`.
- **Historial:** entrada con `conflict: true`; tooltip del slider incluye `⚡ conflicto`.

### Undo combinado

Un solo `_past` / `_future`. Undo revierte el último Command **de cualquier carril**. El slider muestra la intercalación real A–B–A–B…

### UI

| Elemento | Ubicación |
|----------|-----------|
| Contador `A: n · B: m` | Pestaña **Observador** |
| Color carril (borde + tag) | Pasos del Observador y tool calls |
| **Demo: 2 agentes** | Botón en Observador |
| Marcadores azul/naranja en slider | Pasos con `lane: A` / `lane: B` |

### Pruebas

- `parallel-agent-runner.spec.ts` — orden determinista, conflicto LWW, undo combinado.
- `observer.store.lanes.spec.ts` — contadores por carril.

### Estimación

| Tarea | Tiempo |
|-------|--------|
| `lane` + `withLane` + CommandBus conflict | 4 h |
| `ParallelAgentRunner` + demo | 3 h |
| UI Observador + slider | 3 h |
| Tests + doc | 2 h |
| **Total** | **~2 días** |

### Archivos implementados

```
src/app/core/agents/
  agent-lane.types.ts
  parallel-agent-runner.ts
  parallel-agent-runner.spec.ts
  parallel-agent.service.ts
src/app/core/webmcp/
  lane-scoped-editing.tools.ts
  editing-tools.service.ts   # withLane()
src/app/core/commands/command-bus.ts   # lane, conflict, DispatchMeta
src/app/core/state/observer.store.ts # lane, conflict, laneCountA/B
src/app/panels/agent-console/        # UI demo + colores
src/app/shell/history-slider/        # marcadores por carril
```

### Cómo probar en la app

1. `npm start` → pestaña **Observador**.
2. Clic **Demo: 2 agentes**.
3. Ver intercalación A/B en timeline, conflicto en el paso 6, slider con puntos azul/naranja.
4. **Undo** (←) revierte paso a paso toda la sesión multi-agente.

---

## Referencia cruzada

- Historial slider: `src/app/shell/history-slider/`
- Demo MP4 README: `npm run demo:readme` → `docs/demo.mp4`
- Guion demo completo: [`DEMO.md`](./DEMO.md)
