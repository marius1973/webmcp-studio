# Angular WebMCP Studio — Guion de demo

Duración objetivo: ~4 minutos. Ideal en **Edge 147+** o **Chrome 149** (agente WebMCP nativo).
Sin agente nativo, usá el **Simulador de agente** del editor: la experiencia es la misma.

## Setup
```bash
npm install
npm start      # http://localhost:4200  (se abre en /project/alpha)
```

## Escena 1 — "La IA modifica la estructura, no solo la lee" (60s)
1. Mostrá los 4 paneles: Árbol, Canvas, Herramientas, Consola del agente.
2. En el editor, tocá **create_component(card)** y luego, con la card seleccionada,
   **create_component(button)** en "Simular agente".
3. Pasá el Canvas a modo **Preview**: el botón aparece renderizado dentro de la card.
   → *La IA construyó UI real a través de tools, no por DOM scraping.*

## Escena 2 — "Ves cada tool call en tiempo real" (45s)
1. Abrí la consola inferior en la vista **Observador**.
2. Cada acción del agente aparece con 🤖, el nombre de la tool y **"porque …"** (el rationale).
3. Señalá el **Panel de Herramientas** (derecha): lista las tools disponibles ahora mismo.

## Escena 3 — "El Signal Form es una tool" (40s)
1. En el editor, mostrá el bloque *Signal Form → tool `new_component_via_form`*.
2. Cambiá kind a `text`, label "Título", y tocá **Crear**.
3. Explicá: el mismo formulario que usa un humano está **expuesto como tool** para el agente,
   con schema y validación inferidos por Angular.

## Escena 4 — "Deshacer lo que hizo el agente" (30s)
1. En la consola (Observador), tocá **Undo** un par de veces.
2. El árbol y el Canvas revierten los cambios del agente.
   → *Las acciones del agente son Commands, deshacibles como cualquier acción humana.*
   Atajo: `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z`.

## Escena 5 — "Auto-cleanup: al cambiar de contexto, cambian las tools" (40s)
1. Mirá el Panel de Herramientas (están `create_component`, `move_component`, …).
2. Hacé click en **Docs** en el topbar.
3. Las tools de edición **desaparecen** y aparecen `search_docs` y `list_sections`.
   → *Las tools viven en el injector de la ruta; al navegar se desregistran solas
   (`withExperimentalAutoCleanupInjectors`).*

## Escena 6 — "Persistencia y multiproyecto" (30s)
1. Tocá **＋ Nuevo** para crear otro proyecto; creá un par de componentes.
2. Cambiá entre proyectos con el selector del topbar: cada uno mantiene su árbol.
3. **Recargá** la página: todo sigue ahí (IndexedDB). Probá **Export** / **Import** JSON.

## Cierre (15s)
"La IA no leyó el código: lo modificó estructuralmente, explicando qué y por qué,
con tools que aparecen y desaparecen según el contexto — y todo es deshacible y persistente."

## Grabar la demo (GIF / video)

La demo está automatizada con Playwright, así que el video se genera solo.

```bash
# 1) instalar el navegador de Playwright (una vez)
npx playwright install chromium

# 2) grabar el recorrido completo (levanta la app solo)
npm run demo:video
#    → genera test-results/<hash>/video.webm
```

Convertir el `.webm` a GIF con ffmpeg:

```bash
ffmpeg -i test-results/<hash>/video.webm \
  -vf "fps=12,scale=1000:-1:flags=lanczos" docs/demo.gif
```

> Tip: el ritmo del recorrido se ajusta con la constante `PACE` en `e2e/demo.spec.ts`.
> Para un GIF más liviano, bajá `fps` o `scale`. El `.webm` ya sirve como video directo.

### Alternativa manual
Si preferís grabar tu pantalla: seguí las 6 escenas de arriba con cualquier capturador
(ShareX, ScreenToGif, la grabadora de Windows con Win+G) — la app ya está pensada para
que el recorrido fluya en ese orden.
