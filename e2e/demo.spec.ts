import { test, expect } from '@playwright/test';

/**
 * Recorrido de demo alineado con DEMO.md (guion completo).
 *   npm run demo:video
 * El .webm queda en ./test-results/. Convertilo a GIF con ffmpeg (ver DEMO.md).
 *
 * Las pausas (`beat`) son solo para que el video se vea fluido, no para esperar al DOM.
 */
const PACE = 650;

test.describe.configure({ timeout: 180_000 });

test('recorrido completo del Studio', async ({ page }) => {
  const beat = () => page.waitForTimeout(PACE);

  // ── Escena 0 — mapa del Studio ─────────────────────────────────────────────
  await page.goto('/');
  await page.waitForURL(/\/project\//);
  await expect(page.getByText('▰ WebMCP Studio')).toBeVisible();
  await expect(page.locator('app-component-tree')).toBeVisible();
  await expect(page.locator('app-tool-panel')).toBeVisible();
  await expect(page.locator('app-agent-console')).toBeVisible();
  await beat();

  // ── Escena 1 — edición manual + timeline humana ───────────────────────────
  await page.getByRole('button', { name: /Añadir Card/ }).click();
  await beat();
  await page.getByRole('button', { name: /Añadir Botón/ }).click();
  await beat();
  await page.locator('#prop-label').fill('Mi botón');
  await page.locator('#prop-variant').selectOption('ghost');
  await page.locator('app-properties-form').getByRole('button', { name: 'Aplicar' }).click();
  await beat();
  await expect(page.locator('.timeline .step').filter({ hasText: '🙂' }).first()).toBeVisible();
  await beat();

  // ── Escena 2 — agente construye estructura + Preview ──────────────────────
  await page.getByRole('button', { name: 'create_component(card)' }).click();
  await beat();
  await page.getByRole('button', { name: 'create_component(button)' }).click();
  await beat();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('app-node-renderer')).toBeVisible();
  await beat();
  await page.getByRole('button', { name: 'Estructura' }).click();
  await beat();

  // ── Escena 3 — Signal Forms como tools ────────────────────────────────────
  await page.locator('app-new-component-form select').selectOption('text');
  await page.locator('app-new-component-form input').first().fill('Título de la demo');
  await beat();
  await page.locator('app-new-component-form').getByRole('button', { name: 'Crear' }).click();
  await beat();
  await expect(page.locator('app-properties-form .tool-hint')).toContainText('update_component_via_form');
  await expect(page.locator('#prop-text')).toBeVisible();
  await beat();

  // Inspector: update_component_via_form (texto creado queda seleccionado)
  await page.locator('#prop-text').fill('Texto editado desde el inspector');
  await page.locator('app-properties-form').getByRole('button', { name: 'Aplicar' }).click();
  await beat();

  // ── Escena 4 — Observador, Tool calls y toggle ──────────────────────────────
  const observerPanel = page.locator('#panel-observer');
  await expect(observerPanel.getByText('create_component').first()).toBeVisible();
  await expect(observerPanel.getByText(/porque/).first()).toBeVisible();
  await beat();
  await page.getByRole('tab', { name: /Tool calls/ }).click();
  await expect(page.locator('.log .row').first()).toBeVisible();
  await beat();
  await page.getByRole('tab', { name: /Observador/ }).click();
  await beat();

  const observerToggle = page.getByRole('checkbox', { name: /Modo Observador/i });
  await observerToggle.uncheck();
  await beat();
  await page.getByRole('button', { name: /Añadir Input/ }).click();
  await beat();
  await observerToggle.check();
  await beat();

  // ── Escena 5 — Undo / Redo ────────────────────────────────────────────────
  const undo = page.getByRole('button', { name: /Undo/ }).first();
  await undo.click();
  await beat();
  await undo.click();
  await beat();
  await page.getByRole('button', { name: /Redo/ }).first().click();
  await beat();

  // ── Escena 6 — auto-cleanup por ruta (Docs) ───────────────────────────────
  await page.getByRole('link', { name: 'Docs' }).click();
  const toolPanel = page.locator('app-tool-panel');
  await expect(toolPanel.getByText('search_docs')).toBeVisible();
  await expect(toolPanel.getByText('list_sections')).toBeVisible();
  await beat();
  await page.getByRole('link', { name: /Volver al editor/ }).click();
  await page.waitForURL(/\/project\//);
  await expect(page.locator('app-tool-panel').getByText('export_project_code')).toBeVisible();
  await beat();

  // ── Escena 7 — multiproyecto y persistencia ───────────────────────────────
  const projectSelect = page.getByLabel('Proyecto activo');
  await page.getByRole('button', { name: /Nuevo/ }).click();
  await page.waitForURL(/\/project\//);
  await beat();
  await page.getByRole('button', { name: /Añadir Botón/ }).click();
  await beat();
  await projectSelect.selectOption('alpha');
  await page.waitForURL(/\/project\/alpha/);
  await beat();

  page.once('dialog', (dialog) => dialog.accept('Alpha Demo'));
  await page.getByRole('button', { name: /Renombrar/ }).click();
  await beat();

  const countBeforeReload = await page.locator('app-component-tree .count').textContent();
  // Autosave debounced (400 ms en ProjectStore)
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForURL(/\/project\/alpha/);
  await expect(page.locator('app-component-tree .count')).toHaveText(countBeforeReload ?? '');
  await beat();

  // ── Escena 8 — export Angular ZIP ─────────────────────────────────────────
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Angular ZIP/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/i);
  await expect(page.getByRole('status')).toContainText(/Angular descargado/i);
  await beat();

  // Cierre — panel de herramientas y consola activos
  await expect(page.locator('app-tool-panel')).toBeVisible();
  await expect(page.getByRole('tab', { name: /Observador/ })).toBeVisible();
  await beat();
});
