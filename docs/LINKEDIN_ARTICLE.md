# Guion: mismo landing en 3 enfoques

Video / artículo LinkedIn (~3 min). Usa el **Modo Observador** como hilo conductor.

## Hook (15 s)

> "Tres formas de que una IA edite tu UI: clics en pantalla, código one-shot, o tools WebMCP con undo."

Muestra el GIF del README.

---

## Enfoque 1 — Manual (30 s)

1. Abre el demo → proyecto `alpha`.
2. Menú **＋ Añadir**: container Hero → text → button.
3. Tres cards con text hijo.
4. **Observador**: pasos con origen 🙂 (usuario).
5. Undo (Ctrl+Z) — un paso desaparece.

**Frase:** *"El humano también deja rastro observable."*

---

## Enfoque 2 — Simulador / agente (45 s)

1. Expande **Simular agente y playbooks** → playbook **Landing analytics** (un clic).
2. **Observador** se llena con 🤖 `run_playbook`.
3. `suggest_next` → sugerencias en consola.
4. Undo único revierte todo el playbook.

**Frase:** *"El agente no adivina el DOM: ejecuta tools tipadas."*

---

## Enfoque 3 — Agente nativo Edge / Chrome OT (30 s)

1. Mismo prompt del README (`read_tree` → hero → cards → `export_project_code`).
2. Timeline 🤖 con `rationale` en cada paso.
3. Preview wireframe — expectativas alineadas.
4. **Exportar → Angular ZIP** → `npm install && npm start` (secciones por componente).

**Frase:** *"No es screenshot: es Angular real con rutas y estilos por sección."*

---

## Cierre (20 s)

| | DOM / clics | Generador one-shot | WebMCP Studio |
|--|-------------|-------------------|---------------|
| Estado interno | Frágil | Opaco | `read_tree` |
| Undo | No | No | Sí, por Command |
| Observable | No | No | Modo Observador |

CTA: [Demo](https://webmcp-studio-buur.vercel.app/) · [Repo](https://github.com/marius1973/webmcp-studio)

---

## Benchmark (opcional en post)

```bash
npm run benchmark
```

Comparte el ratio DOM simulado vs Commands — sin claims de &lt;50 ms.

## Hashtags sugeridos

`#Angular` `#WebMCP` `#AIAgents` `#WebDev` `#OpenSource`
