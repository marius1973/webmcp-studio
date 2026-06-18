# Angular WebMCP Studio — Guion de demo

Guion completo para presentación en vivo, video o GIF. Cubre editor manual, agente (simulador o nativo), Observador, multiproyecto, export y arquitectura WebMCP.

| Versión | Duración | Cuándo usarla |
|---------|----------|---------------|
| **Completa** | ~8 min | README, conferencias, primer contacto con el repo |
| **Rápida** | ~3 min | Escenas marcadas con ⚡ abajo |
| **Automatizada (README)** | ~15 s | `npm run demo:readme` — GIF hero: 4 paneles, DnD, undo, playbook, Observador |
| **Automatizada (completa)** | ~2–3 min | `npm run demo:video` (Playwright, alineado con escenas 0–8) |

**Navegador ideal (agente nativo):** Edge 147+ (`navigator.modelContext` integrado) o Chrome 149+ ([Origin Trial](https://developer.chrome.com/docs/ai/webmcp); flag local: `chrome://flags/#enable-webmcp-testing`).  
**Sin agente nativo:** el **Simulador de agente** del canvas reproduce el mismo flujo en cualquier navegador.

---

## Antes de empezar

### Elevator pitch (15 s)

> WebMCP Studio es un IDE en el navegador donde la IA **no scrapea el DOM**: invoca **tools WebMCP** que despachan **Commands** con undo/redo, narración en vivo y export a un proyecto **Angular real** descargable en ZIP.

### Setup

```bash
npm install
npm start        # http://localhost:4200 → /project/alpha (o último proyecto usado)
```

### Checklist pre-demo

- [ ] Ventana ancha (≥ 1200 px) para ver los 4 paneles; en móvil el layout se apila.
- [ ] Consola en pestaña **Observador** (no Tool calls).
- [ ] Modo Observador **activado** (checkbox en la consola).
- [ ] Proyecto **alpha** limpio o recién creado (opcional: menú **Proyecto → Nuevo**).
- [ ] Badge WebMCP en el canvas: verde = nativo, ámbar = polyfill o sin agente.

---

## Escena 0 — Mapa del Studio (30 s) ⚡

**Objetivo:** orientar al público en los 4 paneles y el topbar.

1. Muestra el layout:
   - **Izquierda:** Árbol de componentes (menú ＋ Añadir + drag ⠿).
   - **Centro:** Canvas (Preview / Estructura); simulador y forms en secciones colapsables.
   - **Derecha:** Panel de Herramientas (schemas; sección **Destacadas** + grupos).
   - **Abajo:** Consola (Observador / Tool calls).
2. Topbar: selector de proyecto, menú **Proyecto**, menú **Exportar**, **🔗 Compartir**, **Docs**, **Stats**.
3. Frase clave: *"Todo lo que hace un humano o un agente pasa por el mismo CommandBus."*

---

## Escena 1 — Edición manual + timeline humana (60 s)

**Objetivo:** mostrar que el Observador registra acciones **manuales** (🙂), no solo del agente.

1. En el árbol, selecciona **AppRoot** y usa **＋ Añadir**: **Card** → **Botón**.
2. Arrastra el botón por el handle ⠿ para reordenar o reparentar.
3. Selecciona el botón; expande **Inspector de propiedades** si hace falta; cambia `label` y `variant` → **Aplicar**.
4. Abre la consola **Observador**: cada paso aparece con 🙂 y acciones como `create_component`, `update_component`.
5. (Opcional) Navega el árbol con **flechas** del teclado; **Supr** borra un nodo.
6. Frase clave: *"Usuario y agente comparten historial y undo."*

---

## Escena 2 — El agente construye estructura real (60 s) ⚡

**Objetivo:** la IA modifica el árbol vía tools, no leyendo HTML.

1. Expande **Simular agente y playbooks** y ejecuta:
   - `create_component(card)` — *"Agrupo contenido en una card."*
   - Con la card seleccionada: `create_component(button)` — *"Agrego un botón de acción."*
   - O playbook **Landing analytics** (un solo undo).
2. Pasa el canvas a **Preview**: card y botón renderizados con `NgComponentOutlet`.
3. Vuelve a **Estructura** para ver el árbol anidado en el canvas.
4. En Observador: pasos con 🤖, tool name y **"porque …"** (rationale).
5. Panel derecho: schemas de `create_component`, `move_component`, etc.
6. Frase clave: *"Cada tool es un envoltorio fino sobre un Command."*

---

## Escena 3 — Signal Forms expuestos como tools (75 s)

**Objetivo:** demostrar `experimentalWebMcpTool` en dos formularios.

### 3a — Crear con `new_component_via_form`

1. En la sección colapsable del simulador: bloque **Signal Form → tool `new_component_via_form`**.
2. kind: `text`, label: `Título de la demo`, parentId: `root` → **Crear**.
3. Explica: el agente invoca la **misma tool**; Angular infiere schema y validación.

### 3b — Editar con `update_component_via_form`

1. Selecciona un nodo **text** o **button** en el árbol.
2. En el inspector, muestra el hint **Signal Form → tool `update_component_via_form`**.
3. Cambia props y **Aplicar**; verifica en Preview.
4. Frase clave: *"Forms humanos = tools del agente, sin duplicar lógica."*

---

## Escena 4 — Observador, Tool calls y control (45 s) ⚡

**Objetivo:** dos vistas de la consola + toggle del modo narración.

1. Pestaña **Tool calls**: log técnico `toolName(args) → result` con origen 🤖/🙂.
2. Vuelve a **Observador**: timeline narrada (qué, por qué, nodos afectados); clic en un paso resalta nodos.
3. Desactiva **Modo Observador**, crea un componente manual → no se registra.
4. Reactívalo y repite una acción → vuelve a narrar.
5. (Opcional) Pestaña Tool calls → simular `greet()` / `ping_studio()` (tools de app).

---

## Escena 5 — Undo/redo unificado (45 s)

**Objetivo:** deshacer lo del agente igual que lo manual.

1. Tras las acciones del agente, usa **Undo** en la **toolbar del canvas** (2–3 veces).
2. El árbol y el Preview revierten en sincronía.
3. **Redo** para recuperar un paso.
4. Atajos: `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` (o `Ctrl+Y`).
5. Frase clave: *"Snapshots memento en el CommandBus; el undo no cruza proyectos."*

---

## Escena 6 — Auto-cleanup por ruta (50 s) ⚡

**Objetivo:** las tools viven en el injector de la ruta.

1. Panel de Herramientas: `create_component`, `export_project_code`, `new_component_via_form`, …
2. Topbar → **Docs**.
3. Las tools de edición **desaparecen**; aparecen `search_docs` y `list_sections`.
4. Muestra el texto sobre `withExperimentalAutoCleanupInjectors`.
5. **← Volver al editor** → recuperas las tools de edición.
6. Frase clave: *"El agente solo ve las tools del contexto actual."*

---

## Escena 7 — Multiproyecto y persistencia (75 s)

**Objetivo:** IndexedDB, rutas y gestión en topbar.

1. Menú **Proyecto → Nuevo** (elige plantilla); añade 1–2 componentes con **＋ Añadir**.
2. **Proyecto → Renombrar** (modal).
3. Cambia entre proyectos en el selector: cada uno tiene su árbol e historial propio.
4. **Recarga** la página (F5): todo persiste (IndexedDB).
5. Menú **Exportar → JSON**; **Importar JSON** con confirmación y validación.
6. (Opcional) **Proyecto → Borrar** un proyecto de prueba.
7. Frase clave: *"Sin backend: persistencia local, lista para Vercel como SPA."*

---

## Escena 8 — Export como proyecto Angular real (60 s) ⚡

**Objetivo:** del diseño visual a `ng new` funcional.

1. Construye una UI mínima en **alpha** (card + botón + text).
2. Menú **Exportar → Angular ZIP** (o tool `export_project_code` con `download: true`).
3. Abre el ZIP: `package.json`, `angular.json`, `src/app/app.component.ts`, secciones por componente.
4. En otra terminal (opcional, si tienes tiempo en vivo):

   ```bash
   unzip alpha.zip -d /tmp/demo-export && cd /tmp/demo-export
   npm install && npm start
   ```

5. Frase clave: *"No es un screenshot: es código Angular standalone listo para `npm start`."*

---

## Escena 9 — Agente WebMCP nativo (45 s, opcional)

**Solo si tienes Edge 147+ o Chrome 149+ con WebMCP habilitado** (OT en producción o flag `enable-webmcp-testing` en local).

1. Señala el badge **WebMCP** en verde en la toolbar del canvas.
2. Pídele al agente del navegador algo como: *"Crea una card con un botón primary debajo de root"*.
3. Muestra que las mismas tools del panel se invocan sin el simulador.
4. Si falla o no hay agente: *"El simulador y el polyfill cubren el mismo contrato."*

---

## Escena 10 — Arquitectura en una diapositiva (30 s)

**Objetivo:** cerrar con el diagrama del README.

Muestra (o narra) el flujo:

```
AI Agent → navigator.modelContext → Tool Registry → Angular DI → CommandBus
                                                      ├─ Tree Store (undo/redo)
                                                      └─ Observer Store (narración)
```

Frase clave: *"WebMCP es experimental; la lógica de negocio vive en Commands y stores Angular."*

---

## Cierre (20 s)

> "WebMCP Studio demuestra que un agente puede **diseñar UI en Angular** con tools tipadas, explicar cada paso, deshacer errores, persistir proyectos y **entregar código descargable** — todo en el navegador, sin tocar el DOM a mano."

**Call to action:** README, demo en vivo, `npm run demo:video`, deploy en Vercel (`vercel.json` incluido).

---

## Guion rápido ⚡ (~3 min)

Si tienes poco tiempo, solo estas escenas:

1. **Escena 0** — mapa del Studio (20 s, recortado).
2. **Escena 2** — agente + Preview (60 s).
3. **Escena 4** — Observador (30 s).
4. **Escena 5** — Undo (30 s).
5. **Escena 6** — Docs + auto-cleanup (40 s).
6. **Escena 8** — Angular ZIP (40 s).

---

## Grabar la demo (video / GIF)

### GIF del README (~15 s)

```bash
npx playwright install chromium   # una vez
npm run demo:readme               # graba hero + genera docs/demo.gif optimizado (~1 MB)
```

Flujo del hero (`e2e/hero.spec.ts`): 4 paneles → **Proyecto → Nuevo** → **＋ Añadir** (Card, Botón, Texto) → **drag & drop** → **Undo** → playbook **Landing analytics** → **Observador** (replay) → **Preview**.

Pipeline: **ffmpeg** (8 fps, 960 px, paleta 96) + **gifsicle** (`-O3 --lossy=80 --colors 128`). Solo optimizar: `npm run demo:optimize`.

### Demo completa (escenas 0–8)

```bash
npm run demo:video
npm run demo:gif demo             # recorrido largo → docs/demo.gif
```

Requisitos: **ffmpeg** en el PATH y **gifsicle** vía `npm install` (devDependency). El script `scripts/demo-gif.mjs` busca el `video.webm` del prefijo indicado (`hero` por defecto).

> El ritmo se ajusta con `PACE` en `e2e/demo.spec.ts` (650 ms por paso).
> El recorrido automatizado cubre las **escenas 0–8** del guion completo (edición manual, agente, Signal Forms, Observador, undo, Docs, multiproyecto, Angular ZIP).
> Para la versión con audio y escena 9 (agente nativo), graba manualmente siguiendo este guion.

### Manual

| Herramienta | Plataforma |
|-------------|------------|
| Win + G | Windows (Xbox Game Bar) |
| QuickTime | macOS |
| OBS Studio | Todas |
| ScreenToGif / ShareX | Windows (GIF) |

**Tips de grabación**

- Resolución 1920×1080 o 1440×900; zoom del navegador al 100 %.
- Oculta bookmarks y extensiones ruidosas.
- Mueve el mouse con calma; pausa 1–2 s después de cada acción clave.
- Si grabas audio, lee las *frases clave* de cada escena casi textual.

---

## Referencia: qué mencionar en cada panel

| Panel | Mensaje para la audiencia |
|-------|---------------------------|
| Árbol | Menú ＋ Añadir, DnD, teclado; misma mutación que las tools |
| Canvas | Preview = UI real; Estructura = depuración del árbol |
| Herramientas | Documentación viva del contrato WebMCP |
| Consola Observador | IA explicable: qué, por qué, quién (🤖/🙂) |
| Consola Tool calls | Log técnico para desarrolladores |
| Topbar | Multiproyecto + export JSON + **Angular ZIP** + **Compartir** |
| Docs | Auto-cleanup de tools por ruta |

---

## Troubleshooting en vivo

| Problema | Qué decir / hacer |
|----------|-------------------|
| Badge WebMCP ámbar | "Usamos polyfill; el simulador es equivalente." |
| Observador vacío | Verificar checkbox Modo Observador activado. |
| Import rechazado | "Validación del árbol: evita JSON corrupto." |
| 404 al recargar en deploy | "En Vercel hace falta rewrite SPA (`vercel.json`)." |
| Undo no hace nada | Cambiaste de proyecto; el historial es por proyecto. |
