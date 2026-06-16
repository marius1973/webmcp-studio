# Angular WebMCP Studio — Guion de demo

Guion completo para presentación en vivo, video o GIF. Cubre editor manual, agente (simulador o nativo), Observador, multiproyecto, export y arquitectura WebMCP.

| Versión | Duración | Cuándo usarla |
|---------|----------|---------------|
| **Completa** | ~8 min | README, conferencias, primer contacto con el repo |
| **Rápida** | ~3 min | Escenas marcadas con ⚡ abajo |
| **Automatizada** | ~2–3 min | `npm run demo:video` (Playwright, alineado con escenas 0–8) |

**Navegador ideal:** Edge 147+ o Chrome 149 (agente WebMCP nativo vía `navigator.modelContext`).  
**Sin agente nativo:** el **Simulador de agente** del canvas reproduce el mismo flujo.

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
- [ ] Proyecto **alpha** limpio o recién creado (opcional: **＋ Nuevo**).
- [ ] Badge WebMCP en el canvas: verde = nativo, ámbar = polyfill o sin agente.

---

## Escena 0 — Mapa del Studio (30 s) ⚡

**Objetivo:** orientar al público en los 4 paneles y el topbar.

1. Mostrá el layout:
   - **Izquierda:** Árbol de componentes (paleta + drag ⠿).
   - **Centro:** Canvas (Preview / Estructura) + simulador + Signal Forms.
   - **Derecha:** Panel de Herramientas (schemas de las tools activas).
   - **Abajo:** Consola (Observador / Tool calls).
2. Topbar: selector de proyecto, **＋ Nuevo**, **Renombrar**, **Borrar**, **JSON**, **Angular ZIP**, **Docs**.
3. Frase clave: *"Todo lo que hace un humano o un agente pasa por el mismo CommandBus."*

---

## Escena 1 — Edición manual + timeline humana (60 s)

**Objetivo:** mostrar que el Observador registra acciones **manuales** (🙂), no solo del agente.

1. En el árbol, seleccioná **AppRoot** y usá la paleta: **Card** → **Botón**.
2. Arrastrá el botón por el handle ⠿ para reordenar o reparentar.
3. Seleccioná el botón; en el **inspector de propiedades** cambiá `label` y `variant` → **Aplicar**.
4. Abrí la consola **Observador**: cada paso aparece con 🙂 y acciones como `create_component`, `update_component`.
5. (Opcional) Navegá el árbol con **flechas** del teclado; **Supr** borra un nodo.
6. Frase clave: *"Usuario y agente comparten historial y undo."*

---

## Escena 2 — El agente construye estructura real (60 s) ⚡

**Objetivo:** la IA modifica el árbol vía tools, no leyendo HTML.

1. En **Simular agente**, ejecutá:
   - `create_component(card)` — *"Agrupo contenido en una card."*
   - Con la card seleccionada: `create_component(button)` — *"Agrego un botón de acción."*
2. Pasá el canvas a **Preview**: card y botón renderizados con `NgComponentOutlet`.
3. Volvé a **Estructura** para ver el árbol anidado en el canvas.
4. En Observador: pasos con 🤖, tool name y **"porque …"** (rationale).
5. Panel derecho: schemas de `create_component`, `move_component`, etc.
6. Frase clave: *"Cada tool es un envoltorio fino sobre un Command."*

---

## Escena 3 — Signal Forms expuestos como tools (75 s)

**Objetivo:** demostrar `experimentalWebMcpTool` en dos formularios.

### 3a — Crear con `new_component_via_form`

1. Bloque **Signal Form → tool `new_component_via_form`**.
2. kind: `text`, label: `Título de la demo`, parentId: `root` → **Crear**.
3. Explicá: el agente invoca la **misma tool**; Angular infiere schema y validación.

### 3b — Editar con `update_component_via_form`

1. Seleccioná un nodo **text** o **button** en el árbol.
2. En el inspector, mostrá el hint **Signal Form → tool `update_component_via_form`**.
3. Cambiá props y **Aplicar**; verificá en Preview.
4. Frase clave: *"Forms humanos = tools del agente, sin duplicar lógica."*

---

## Escena 4 — Observador, Tool calls y control (45 s) ⚡

**Objetivo:** dos vistas de la consola + toggle del modo narración.

1. Pestaña **Tool calls**: log técnico `toolName(args) → result` con origen 🤖/🙂.
2. Volvé a **Observador**: timeline narrada (qué, por qué, nodos afectados).
3. Desactivá **Modo Observador**, creá un componente manual → no se registra.
4. Reactivalo y repetí una acción → vuelve a narrar.
5. (Opcional) Pestaña Tool calls → simular `greet()` / `ping_studio()` (tools de app).

---

## Escena 5 — Undo/redo unificado (45 s)

**Objetivo:** deshacer lo del agente igual que lo manual.

1. Tras las acciones del agente, usá **Undo** en la consola o toolbar del canvas (2–3 veces).
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
4. Mostrá el texto sobre `withExperimentalAutoCleanupInjectors`.
5. **← Volver al editor** → recuperás las tools de edición.
6. Frase clave: *"El agente solo ve las tools del contexto actual."*

---

## Escena 7 — Multiproyecto y persistencia (75 s)

**Objetivo:** IndexedDB, rutas y gestión en topbar.

1. **＋ Nuevo** → creá un proyecto; añadí 1–2 componentes desde la paleta.
2. **Renombrar** el proyecto (prompt).
3. Cambiá entre proyectos en el selector: cada uno tiene su árbol e historial propio.
4. **Recargá** la página (F5): todo persiste (IndexedDB).
5. **⤓ JSON** → exportá el árbol; **Import** con confirmación y validación.
6. (Opcional) **🗑 Borrar** un proyecto de prueba.
7. Frase clave: *"Sin backend: persistencia local, lista para Vercel como SPA."*

---

## Escena 8 — Export como proyecto Angular real (60 s) ⚡

**Objetivo:** del diseño visual a `ng new` funcional.

1. Construí una UI mínima en **alpha** (card + botón + text).
2. Topbar → **⤓ Angular ZIP** (o tool `export_project_code` con `download: true`).
3. Abrí el ZIP: `package.json`, `angular.json`, `src/app/app.component.ts`, `generated-ui.component.ts`.
4. En otra terminal (opcional, si tenés tiempo en vivo):

   ```bash
   unzip alpha.zip -d /tmp/demo-export && cd /tmp/demo-export
   npm install && npm start
   ```

5. Frase clave: *"No es un screenshot: es código Angular standalone listo para `npm start`."*

---

## Escena 9 — Agente WebMCP nativo (45 s, opcional)

**Solo si tenés Edge 147+ / Chrome 149 con agente integrado.**

1. Señalá el badge **WebMCP** en verde en la toolbar del canvas.
2. Pedile al agente del navegador algo como: *"Creá una card con un botón primary debajo de root"*.
3. Mostrá que las mismas tools del panel se invocan sin el simulador.
4. Si falla o no hay agente: *"El simulador y el polyfill cubren el mismo contrato."*

---

## Escena 10 — Arquitectura en una diapositiva (30 s)

**Objetivo:** cerrar con el diagrama del README.

Mostrá (o narrá) el flujo:

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

Si tenés poco tiempo, solo estas escenas:

1. **Escena 0** — mapa del Studio (20 s, recortado).
2. **Escena 2** — agente + Preview (60 s).
3. **Escena 4** — Observador (30 s).
4. **Escena 5** — Undo (30 s).
5. **Escena 6** — Docs + auto-cleanup (40 s).
6. **Escena 8** — Angular ZIP (40 s).

---

## Grabar la demo (video / GIF)

### Automatizada (Playwright)

```bash
npx playwright install chromium   # una vez
npm run demo:video
npm run demo:gif
# → docs/demo.gif (también queda el .webm en test-results/)
```

Requisitos: **ffmpeg** en el PATH. El script `scripts/demo-gif.mjs` busca el `video.webm` más reciente y genera un GIF optimizado (960 px, 10 fps, paleta de 128 colores).

Convertir manualmente (si preferís otro tamaño):

```bash
ffmpeg -y -i test-results/demo-recorrido-completo-del-Studio-demo/video.webm \
  -filter_complex "fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse[out]" \
  -map "[out]" docs/demo.gif
```

> El ritmo se ajusta con `PACE` en `e2e/demo.spec.ts` (650 ms por paso).
> El recorrido automatizado cubre las **escenas 0–8** del guion completo (edición manual, agente, Signal Forms, Observador, undo, Docs, multiproyecto, Angular ZIP).
> Para la versión con audio y escena 9 (agente nativo), grabá manualmente siguiendo este guion.

### Manual

| Herramienta | Plataforma |
|-------------|------------|
| Win + G | Windows (Xbox Game Bar) |
| QuickTime | macOS |
| OBS Studio | Todas |
| ScreenToGif / ShareX | Windows (GIF) |

**Tips de grabación**

- Resolución 1920×1080 o 1440×900; zoom del navegador al 100 %.
- Ocultá bookmarks y extensiones ruidosas.
- Mové el mouse con calma; pausá 1–2 s después de cada acción clave.
- Si grabás audio, leé las *frases clave* de cada escena casi textual.

---

## Referencia: qué mencionar en cada panel

| Panel | Mensaje para la audiencia |
|-------|---------------------------|
| Árbol | Paleta, DnD, teclado; misma mutación que las tools |
| Canvas | Preview = UI real; Estructura = depuración del árbol |
| Herramientas | Documentación viva del contrato WebMCP |
| Consola Observador | IA explicable: qué, por qué, quién (🤖/🙂) |
| Consola Tool calls | Log técnico para desarrolladores |
| Topbar | Multiproyecto + export JSON + **Angular ZIP** |
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
