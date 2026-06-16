# Angular WebMCP Studio

<p align="center">
  <a href="https://github.com/marius1973/webmcp-studio/actions/workflows/ci.yml">
    <img src="https://github.com/marius1973/webmcp-studio/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/WebMCP-Experimental-purple?logo=angular" />
  <img src="https://img.shields.io/badge/AI_Agent-Ready-success?logo=openai" />
  <img src="https://img.shields.io/badge/Angular-v22-dd0031?logo=angular" />
  <img src="https://img.shields.io/badge/Signals-Native-blue?logo=typescript" />
</p>

<p align="center">
  <a href="https://webmcp-studio-buur.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀_Demo_Vivo-Ver_ahora-000?logo=vercel&style=for-the-badge" />
  </a>
</p>

<p align="center">
  <img src="docs/demo.gif" alt="WebMCP Studio: 4 paneles, paleta y drag & drop, undo, simulador de agente (create_component) y narración en el Observador" width="960" />
</p>

Un **IDE en el navegador** donde los agentes de IA editan estructura Angular en vivo — no generan código de una vez, sino que mutan, deshacen y observan paso a paso.

## Por qué WebMCP

La mayoría de los agentes que “controlan” una web app lo hacen **desde afuera**: leen el DOM, adivinan la UI y hacen clics en pantalla. WebMCP invierte eso: la app **expone tools tipadas** que el agente descubre e invoca como una API.

| Sin WebMCP | Con WebMCP Studio |
|------------|-------------------|
| La IA lee el DOM con OCR o heurísticas | La IA ejecuta `create_component` directamente |
| Clics en coordenadas X,Y frágiles | Llamadas estructuradas con validación de schema |
| No entiende el estado interno | Acceso al árbol real vía `read_tree` |
| Requiere prompts complejos | Descubrimiento automático de tools |
| Sin undo/redo del agente | Commands con narración y reversión |

### Comparativa con otros enfoques

*Comparación conceptual de enfoques, no de rendimiento ni paridad de producto.* Herramientas como v0 o Lovable generan apps de cero; este studio **itera sobre estructura existente** con undo/redo por nodo.

| Enfoque | Cómo opera | Tensión típica | WebMCP Studio |
|---------|------------|----------------|---------------|
| **Automatización visual** (p. ej. Playwright + IA) | Screenshots y clics en pantalla | Frágil ante cambios de UI; poco estado interno | Llamadas directas a tools, sin screenshots ni OCR |
| **Control remoto del browser** (p. ej. Browser Use) | CDP desde fuera del tab | Infra extra; no es API nativa de la app | Corre en el browser, sin backend |
| **Generadores one-shot** (p. ej. v0, Lovable) | Prompt → app o código nuevo | Poca edición granular por el agente | El agente muta el árbol paso a paso, con preview |
| **Este studio** | Tools WebMCP sobre Commands | Experimental (ver abajo) | Undo/redo, Observador y export Angular |

## ⚠️ Estado experimental

WebMCP es un estándar W3C en desarrollo. Este proyecto usa la implementación experimental de Angular v22.

- **Demo en vivo** ([webmcp-studio-buur.vercel.app](https://webmcp-studio-buur.vercel.app/)): funciona en **cualquier navegador** con el **simulador** y el polyfill — no hace falta agente nativo.
- **Agente nativo del navegador**: **Edge 147+** (integrado, `navigator.modelContext`).
- **Chrome 149+**: [Origin Trial](https://developer.chrome.com/docs/ai/webmcp) para visitantes en producción (token por origen); en local, flag [`chrome://flags/#enable-webmcp-testing`](https://developer.chrome.com/docs/ai/webmcp#local-webmcp) (no `chrome://flags#webmcp`).
- **Fallback**: simulador integrado + `@mcp-b/webmcp-polyfill` cubren el mismo contrato de tools.
- **APIs sujetas a cambios** entre versiones menores de Angular.

## 🧪 Prompt para agentes de IA

Ejemplo de system prompt **alineado con la demo**: el Preview muestra bloques etiquetados (`container`, `card`, `text`, `button`) — un **esqueleto estructural**, no una landing pulida con navbar ni links.

```text
Eres un agente en Angular WebMCP Studio.
Tipos disponibles: container, card, button, text, input.
No hay navbar, links ni estilos custom — solo árbol + preview wireframe.

Armá un esqueleto de landing para analytics:

1. read_tree — inspeccioná root antes de editar
2. container "Hero" bajo root:
   - text: "Visualiza tus datos"
   - text: "Dashboards en tiempo real para equipos de datos"
   - button (variant primary): "Empezar gratis"
3. Tres card hermanas bajo root, cada una con un text hijo:
   - "Real-time" / "AI Insights" / "Collaboration"
4. Preview — confirmá la estructura anidada (bloques con etiquetas, no diseño final)
5. export_project_code con download: true → ZIP Angular

Tools: create_component, update_component, move_component, read_tree,
new_component_via_form, update_component_via_form, export_project_code
```

**Qué verás en el demo** (coincide con el prompt):

| Pedido en el prompt | En el árbol / Preview |
|---------------------|------------------------|
| `container` "Hero" + textos + botón | Marco con etiqueta **Hero**, textos y botón renderizados como widgets simples |
| 3 `card` con `text` hijo | Tres tarjetas con borde sólido y un bloque de texto cada una |
| Preview | Bloques anidados con labels — **wireframe**, no SaaS terminado |
| `export_project_code` | ZIP con componentes Angular standalone generados desde el árbol |

**Cómo lo ejecuta el agente**

| Paso | Tool / acción |
|------|----------------|
| Inspeccionar | `read_tree` |
| Hero y cards | `create_component` + `update_component` / `update_component_via_form` para `label`, `text`, `variant` |
| Orden | `move_component` si hace falta reordenar |
| Ver resultado | Modo **Preview** en el canvas |
| Código | `export_project_code` con `download: true` |

> Renombrar el proyecto a "AnalyticsLanding" es opcional (topbar **Renombrar**). El valor del demo es el **flujo agente → tools → árbol → undo → export**, no el pixel-perfect.

## Características

Cada mutación — manual o del agente — es una **tool WebMCP** o un **Command** con undo/redo, narración en el Observador y export a Angular.

### Editor visual
- **4 paneles**: árbol de componentes, canvas (Estructura / Preview), panel de herramientas y consola del agente.
- **Árbol**: paleta para crear nodos, drag & drop (CDK) para reordenar/reparentar, navegación por teclado (↑↓←→, Home/End, Supr).
- **Canvas Preview**: render dinámico con `NgComponentOutlet` (botón, texto, input, contenedores).
- **Inspector de propiedades**: Signal Form para `label` y props por tipo (`variant`, `text`, `placeholder`).
- **Undo/redo** global (toolbar, consola y atajos Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z o Ctrl+Y). No se activa en campos editables ni `contenteditable`.

### WebMCP
- Tools de edición: `create_component`, `update_component`, `delete_component`, `move_component`, `read_tree`, `list_component_types`, `undo`, `redo`, **`export_project_code`**.
- **Signal Forms como tools**: `new_component_via_form`, `update_component_via_form` (`experimentalWebMcpTool`).
- Tools de app: `greet`, `ping_studio`. En `/docs`: `search_docs`, `list_sections`.
- **Auto-cleanup por ruta**: las tools del editor viven en `project/:id` y se desregistran al navegar (`withExperimentalAutoCleanupInjectors`).
- **Simulador de agente** en el canvas para probar tools sin agente nativo del navegador.
- Respuestas con flag **`isError`** para que el agente distinga éxito de error.

### Modo Observador
- Timeline en la consola con pasos narrados (qué, por qué, nodos afectados, origen 🤖/🙂).
- Acciones **manuales y del agente** (vía `CommandBus` y tools).
- Input `rationale` en las tools de edición; toggle para activar/desactivar la narración.

### Proyectos y persistencia
- **IndexedDB** sin dependencias extra (`PersistenceService`).
- Multiproyecto por ruta `project/:id`; autosave debounced; undo no cruza proyectos.
- Topbar: crear, **renombrar**, **borrar**, exportar JSON, **exportar Angular ZIP** (`npm install && npm start`).
- Import con **validación** del árbol y **confirmación** antes de sobrescribir.
- Entrada en `/`: último proyecto usado, o **`alpha`** por defecto (`/project/alpha`).
- Errores de persistencia visibles en la barra de estado (`role="status"`).

### Accesibilidad y layout
- ARIA en topbar, árbol, tabs de la consola y preview widgets.
- Layout **responsive** en pantallas &lt; 1100px (paneles apilados).

## Arranque

```bash
npm install
npm start        # http://localhost:4200
npm run build
```

Al abrir la app, `/` redirige al último proyecto que usaste o a **`/project/alpha`** por defecto (se crea si no existe).

## Probarlo (30 segundos)

1. Abrí el **[demo](https://webmcp-studio-buur.vercel.app/)** → ya tenés un proyecto `alpha`.
2. En el canvas, franja **Simular agente** → clic en `create_component(button)` o `create_component(card)` → mirá el árbol y la pestaña **Observador**.

Listo. Para explorar más:

1. En el árbol, selecciona un nodo y usa la paleta (Contenedor, Card, Botón…) para crear hijos.
2. Arrastra por ⠿ para reordenar o reparentar; usa las flechas del teclado con el foco en el árbol.
3. Edita propiedades en el inspector del canvas y aplica con un único Command `updateNode`.
4. Prueba el **simulador de agente** (cualquier navegador) o invoca tools desde un agente WebMCP nativo (Edge 147+; Chrome 149+ con Origin Trial o flag de desarrollo).
5. Revisa la pestaña **Observador** en la consola: cada paso queda narrado.
6. Exporta el proyecto como **Angular ZIP** desde el topbar o con la tool `export_project_code`.

## Cómo Funciona Internamente

La IA no manipula el DOM directamente: cada acción atraviesa **WebMCP** → **Angular DI** → **CommandBus** → **stores** en signals. Las tools se registran por ruta y se limpian solas al navegar.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│  WebMCP Bridge  │────▶│  Angular DI     │
│  (Browser AI)   │◄────│  (navigator.    │◄────│  (CommandBus)   │
│                 │     │   modelContext) │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Tool Registry  │
                        │  (Auto-cleanup  │
                        │   per route)    │
                        └─────────────────┘
```

Flujo detallado (renderizado en GitHub con [Mermaid](https://mermaid.js.org)):

```mermaid
flowchart TD
    A[AI Agent] -->|WebMCP Protocol| B[navigator.modelContext]
    B -->|Schema Discovery| C[Tool Registry]
    C -->|execute| D[Angular DI]
    D -->|Command| E[CommandBus]
    E -->|undo/redo| F[Tree Store]
    E -->|narrate| G[Observer Store]
```

| Capa | Rol |
|------|-----|
| **AI Agent** | Invoca tools vía `navigator.modelContext` (o simulador en el canvas). |
| **WebMCP Bridge** | `provideExperimentalWebMcpTools` + polyfill; expone schemas y `execute()`. |
| **Tool Registry** | Refleja tools en el panel; auto-cleanup al salir de `project/:id` o entrar en `docs`. |
| **CommandBus** | Despacha Commands, undo/redo con snapshots y narración de acciones manuales. |
| **Tree Store** | Árbol normalizado en signals; fuente de verdad del editor y del export Angular. |

## Estructura

```
src/app/
├── core/
│   ├── commands/      # Command, tree-commands, CommandBus (undo/redo + narración manual)
│   ├── persistence/   # IndexedDB (PersistenceService)
│   ├── export/        # generador de proyecto Angular + ZIP
│   ├── state/         # stores (árbol, proyectos, observador, tools, log)
│   └── webmcp/        # tools, serialización, validación, tipos WebMCP
├── panels/
│   ├── component-tree/
│   ├── canvas/        # estructura, preview, Signal Forms
│   ├── agent-console/
│   ├── tool-panel/
│   ├── docs/
│   └── project-entry.ts   # redirección inicial
├── shell/             # layout 4 paneles + topbar
└── app.routes.ts      # project/:id, docs, /
```

## Testing

```bash
npm test              # unit (Vitest) — 44 tests
npm run test:watch    # Vitest en modo watch
npm run test:e2e      # e2e (Playwright)
npm run demo:hero     # GIF hero del README (~15 s)
npm run demo:gif      # webm hero → docs/demo.gif (ffmpeg + gifsicle)
npm run demo:optimize # recomprime docs/demo.gif si ya existe
npm run demo:readme   # hero + gif optimizado en un paso
npm run demo:video    # recorrido completo (DEMO.md, escenas 0–8)
```

El GIF del README pesa **~1 MB** (960×540, 8 fps, paleta 96 colores + `gifsicle -O3 --lossy=80`). Sin optimizar suele superar 2 MB.

Cobertura unitaria: store del árbol, Commands, CommandBus, tools de edición, validación/import, observador, clonado del árbol y persistencia del último proyecto.

E2E (`e2e/`): crear/deshacer, narración del agente, cambio de tools editor↔docs, persistencia entre recargas.

CI en [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (`npm test` + `npm run build` en push a `master`). [Último run](https://github.com/marius1973/webmcp-studio/actions/workflows/ci.yml).

Guion de demo en [`DEMO.md`](./DEMO.md).

## Deploy (solo si querés hostear tu propia instancia)

¿Solo querés probar? Usá el **[demo en vivo](https://webmcp-studio-buur.vercel.app/)** — no hace falta deployar nada.

<details>
<summary>Click para instrucciones de Vercel</summary>

SPA estática: no requiere backend ni variables de entorno. La config vive en [`vercel.json`](./vercel.json).

| Setting | Valor |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist/webmcp-studio/browser` |
| Install Command | `npm ci` |
| Node.js | 22 (`.nvmrc` + `engines` en `package.json`) |

### Pasos

1. Subir el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repositorio.
3. Vercel detecta `vercel.json` automáticamente; confirmá y hacé **Deploy**.
4. Abrí tu URL (ej. **[webmcp-studio-buur.vercel.app](https://webmcp-studio-buur.vercel.app/)**) → redirige a `/project/alpha` (o al último proyecto usado).

Los **rewrites** envían rutas como `/project/alpha` y `/docs` a `index.html` para que el router de Angular funcione al recargar o compartir links.

### Notas de producción

- **Persistencia**: IndexedDB es local al navegador y dominio; no sincroniza entre dispositivos.
- **WebMCP**: el agente nativo corre en el cliente (Edge 147+; Chrome 149+ OT). El demo en Vercel usa simulador/polyfill — no requiere flags.
- **Preview deployments**: cada PR puede tener su URL de preview si conectás el repo.

</details>

## Stack

- Angular v22 **standalone + zoneless**, TypeScript 6.0, Signals y Signal Forms.
- Polyfill `@mcp-b/webmcp-polyfill` cuando `navigator.modelContext` no está disponible.
- El árbol se clona con `cloneTreeState` (sin `JSON.stringify`) para snapshots de undo/redo.

## Por qué importa

Los agentes de IA no deberían ser "usuarios" de las apps que usamos.
Deberían ser **ciudadanos de primera clase** con APIs diseñadas para ellos.

WebMCP es ese API: no reemplaza al humano, le da a la IA un modo de operar
que es seguro, reversible y observable. Este studio es una prueba de que
Angular puede ser la plataforma donde esa visión se construye.

Si te interesa el futuro de la IA en el navegador, [discutamos](https://github.com/marius1973/webmcp-studio/discussions).
